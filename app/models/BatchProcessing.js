
class BatchProcessingytModel {
    constructor() {

        // title, width, alignment, wrap, bold
        this.columnsCreatePagesDefinitions = [
            ["Titre",                   "262", "left",   true,  true],
            ["Template",                "100", "left",   true,  false],
            ["URL Image",               "100", "left",   false, false],
            ["Rendu de l'image",        "100", "left",   false, false],
            ["Image TriplePerformance", "100", "left",   true,  false],
            ["Page TriplePerformance",  "190", "left",   true,  false],
            ["Statut (a/u/x)",          "100", "center", false, false],
            ["Param 1",                 "191", "left",   true,  false],
            ["Param 2",                 "191", "left",   true,  false],
            ["Param 3",                 "191", "left",   true,  false]
        ];

        this.columnsCreatePages = this.columnsCreatePagesDefinitions.map(col => col[0]);

        // title, width, alignment, wrap, bold
        this.columnsAddKeywordsDefinitions = [
            ["Titre",                   "262", "left",   true,  true],
            ["Mot-clé",                 "100", "center", true,  false],
            ["Statut (a/u/x)",          "100", "center", false, false]
        ];

        this.columnsAddKeywords = this.columnsAddKeywordsDefinitions.map(col => col[0]);
        
        // title, width, alignment, wrap, bold
        this.columnsInsertCodeDefinitions = [
            ["Titre", "262", "left", true,  true],
            ["Code",  "500", "left", true,  false],
            ["Statut",  "100", "center", true,  false]
        ];

        this.columnsInsertCode = this.columnsInsertCodeDefinitions.map(col => col[0]);

        // title, width, alignment, wrap, bold
        this.columnsSearchDefinitions = [
            ["Page",        "262", "left",   true,  false],
            ["Nb de match", "100", "right",  false, false],
            ["Mot-clé 1",   "100", "center", true,  false],
            ["Mot-clé 2",   "100", "center", true,  false]
        ];

        this.columnsSearch = this.columnsSearchDefinitions.map(col => col[0]);
    }

    /////// Public Functions /////

    /**
     * Create tabs for each of the batch processing tools
     * @returns 
     */
    addBatchProcessingTabs() {
        this.addTabForPageCreation();
        this.addTabForKeywordsManagement();
        this.addTabForCodeInsertion();
        this.addTabForSearchEngine();
    }
    
    createPagesWithTemplate() {
        Logger.log('createPagesWithTemplate');

        // For each row in the current sheet, first check the value of col "Statut (a/u/x)": 
        // a --> Add the page to Triple Performance (do nothing if the page already exists)
        // u --> Update the page on Triple Performance (only the template, do not touch the rest of the page)
        // x --> The page is already up to date, do not touch
        // n --> Do not import the page

        // Note : if "u", only the keywords in the sheet will be added/removed - all keywords that are already
        // in the template but not in the sheet will be left untouched

        // Note : the image will not be modified once uploaded


        // First get the list of keywords we are interested in:
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let values = data.getValues();

        const templateParameters = values.shift().slice(7);
        
        let startRow = data.getRow();

        const statusCol = this.getColNumberCreatePages("Statut (a/u/x)");
        const imageURLCol = this.getColNumberCreatePages("URL Image");
        const imageRenduCol = this.getColNumberCreatePages("Rendu de l'image");
        const imageTPCol = this.getColNumberCreatePages("Image TriplePerformance");
        const pageTPCol = this.getColNumberCreatePages("Page TriplePerformance");
        const templateNameCol = this.getColNumberCreatePages("Template");

        const tripleperformanceURL = getTriplePerformanceURL();

        values.forEach((row, rowIndex) => {

            const title = fixTitle(row[0]);
            
            const status = row[statusCol - 1];
            const imageURL = row[imageURLCol - 1];
            const imageTP = row[imageTPCol - 1];
            const templateName = row[templateNameCol - 1];
           
            let imageFileName = '';

            if (status != 'a' && status != 'u')
                return;
            let params = new Map();
            
            if (imageURL.length > 0 && imageTP.length == 0) {
                // Upload the image

                let apiTools = getApiTools();

                // Find the URL for this thumbnail
                const imageFileName = `Illustration ${title}.jpg`;
                let comment = `Image accompagnant la page [[${title}]]`;
                let text = `Image originale : ${imageURL}`;
    
                Logger.log("Uploading thumbnail for " + title + " from " + imageURL + " to File:" + imageFileName);
                apiTools.uploadImage(imageURL, imageFileName, comment, text);
                
                // Add the parameter to the template
                params.set('Image', imageFileName);
                
                // Update the spreadsheet
                let content = getHyperlinkedTitle(tripleperformanceURL, 'File:' + imageFileName, imageFileName);
                sheet.getRange(rowIndex + startRow + 1, imageRenduCol, 1, 2).setValues([["=IMAGE(\""+imageURL+"\")", content]]);
            }

            templateParameters.forEach((paramName, colIndex) => {
                const paramValue = String(row[colIndex + statusCol]).trim();
                
                if (paramValue.length == 0)
                    return;

                params.set(paramName, paramValue);
            });
            
            const wikipage = new wikiPage();
            const apiTools = getApiTools();
            let pageContent = apiTools.getPageContent(title);

            if (status == 'a') {
                // Create the page
 
                // Check if a page doesn't exist with the same title already, if yes, ask to change the course title
                if (pageContent) {
                    // the page already exists. Abord and set the status to Error
                    let cellcontent = getHyperlinkedTitle(getTriplePerformanceURL(), title);

                    sheet.getRange(rowIndex + startRow + 1, pageTPCol, 1, 2).setValues([[cellcontent, 'La page existe déjà !']]);
                    return;
                }

                pageContent = wikipage.updateTemplate(templateName, params, pageContent);

                pageContent += "\n\n\n\n{{Pages liées}}";

                apiTools.createWikiPage(title, pageContent, "Création de la page (Spreadsheet Add-On)");

                let cellcontent = getHyperlinkedTitle(getTriplePerformanceURL(), title);
                sheet.getRange(rowIndex + startRow + 1, pageTPCol, 1, 2).setValues([[cellcontent, 'x']]);

            } else if (status == 'u') {

                // Update the template
                pageContent = wikipage.updateTemplate(templateName, params, pageContent);

                apiTools.createWikiPage(title, pageContent, "Mise à jour des valeurs de la page (Spreadsheet Add-On)");

                let cellcontent = getHyperlinkedTitle(getTriplePerformanceURL(), title);
                sheet.getRange(rowIndex + startRow + 1, statusCol).setValue('x');
            }
            
        });

        alert("Terminé");        
    }
    
    addKeywordsToPages() {
        Logger.log('addKeywordsToPages');

        var ui = SpreadsheetApp.getUi();
        var response = ui.alert("Ajout de mots clés", 
            "Cette action va ajouter les mots clés avec un 'a' dans la colonne " +
            "pour chacune des pages. Toute autre valeur sera ignorée et la page inchangée", ui.ButtonSet.OK_CANCEL);

        // Process the user's response.
        if (response == ui.Button.CANCEL) {
            return;
        }
        
        // First get the list of keywords we are interested in:
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let pagesToModify = data.getValues();
        
        pagesToModify.shift(); // remove the title row

        let colTitle = this.getColNumberAddKeyword("Titre");
        let colKeyword = this.getColNumberAddKeyword("Mot-clé");
        let colStatus = this.getColNumberAddKeyword("Statut (a/u/x)");

        let startRow = data.getRow();

        pagesToModify.forEach((row, rowIndex) => {

            let title = row[colTitle - 1];
            let status = row[colStatus - 1];
            let keyword = row[colKeyword - 1].trim();
            if (keyword.length == 0)
                return;

            Logger.log("Processing page " + title + " with keyword " + keyword + " and status " + status);

            if (status != 'a')
                return;
            

            var wiki = new wikiPage();
            let apiTools = getApiTools();

            var pageContent = apiTools.getPageContent(title);
            const originalPageContent = pageContent;

            pageContent = wiki.insertKeywordInPage(pageContent, keyword);

            if (originalPageContent != pageContent)
                apiTools.updateWikiPage(title, pageContent, "Ajout de mot clé");

            sheet.getRange(rowIndex + startRow + 1, colStatus, 1, 1).setValue('x');
            SpreadsheetApp.flush();
        });

        alert("Terminé");
    }
    
    checkKeywordsInPages() {
        Logger.log('checkKeywordsInPages');

        // First get the list of keywords we are interested in:
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let values = data.getValues();
        let keywordsToLookup = values.shift();
        
        keywordsToLookup.shift(); // remove the title

        // Get all pages from triple performance with the keywords
        let apiTools = getApiTools();
        const query = keywordsToLookup.reduce((accumulator, currentValue) => {
            if (accumulator.length == 0)
                return "[[A un mot-clé::"+currentValue.trim()+"]]";
            else    
                return accumulator + " OR [[A un mot-clé::"+currentValue.trim()+"]]";
          }, '');

        let pagesWithKeywords = apiTools.getSemanticValuesWithForSemanticQuery(query, ['A un mot-clé']);
            
        // Build a map with page --> keywords
        let wikiPages = new Map(pagesWithKeywords.map(page => {
            return [page[0], page[1]];
        }));

        // Check all the pages were the keyword is set

        let startRow = data.getRow();

        values.forEach((row, rowIndex) => {

            let title = row[0];
   
            let existingKeywords = wikiPages.get(title.trim());
            
            if (!(existingKeywords instanceof Array))
                existingKeywords = Array(existingKeywords);

            let newValues = [];
            for (let index = 0; index < keywordsToLookup.length; index++) {
                const keyword = keywordsToLookup[index];
                if (existingKeywords.indexOf(keyword.trim()) != -1)
                    newValues.push('x');
                else
                    newValues.push('n');
            }

            sheet.getRange(rowIndex + startRow + 1, 2, 1, keywordsToLookup.length).setValues([newValues]);    
        });

        alert("Terminé");
    }
    
    addCodeToPages() {
        Logger.log('addCodeToPages');

        // Get data range
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let values = data.getValues();
        let startRow = data.getRow();

        values.shift(); // remove the title

        // For each row, get the page content
        values.forEach((row, rowIndex) => {
            let title = row[0];
            let code = row[1];
            let status = row[2];

            if (code.length == 0)
                return;

            if (status != 'o')
                return;

            let apiTools = getApiTools();
            let pageContent = apiTools.getPageContent(title);

            if (pageContent == undefined) {
                Logger.log("Page not found: " + title);
                return;
            }

            // Check if the code is already in the page
            if (pageContent.match(code)) {
                Logger.log("Code already in page: " + title);
                sheet.getRange(rowIndex + startRow + 1, 3, 1, 1).setValue('x');
                SpreadsheetApp.flush();
                return;
            }

            // Add the code to the page content
            pageContent += "\n\n" + code;

            // Update the page content
            apiTools.updateWikiPage(title, pageContent, "Ajout de code");
            sheet.getRange(rowIndex + startRow + 1, 3, 1, 1).setValue('x');

            SpreadsheetApp.flush();
        });
        
        alert("Terminé");
    }

    /**
     * For each page, adds or remplace the given parameter in the given template
     */
    addParameterToPages() {
        // Get all the current sheet data
        Logger.log('addParameterToPages');

        // Get data range
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let values = data.getValues();
        let startRow = data.getRow();

        let headers = values.shift(); // remove the title

        // Find the column with the page name (the column header must be "Page" or "Page Triple Performance")
        let pageCol = headers.indexOf("Page Triple Performance");
        if (pageCol == -1)
            pageCol = headers.indexOf("Page");

        // Find the column with the template's name (header must be "Template")
        let templateCol = headers.indexOf("Template");

        // Find the column with the parameter's name (header must be "Parameter")
        let parameterCol = headers.indexOf("Paramètre");
        if (parameterCol == -1)
            parameterCol = headers.indexOf("Parameter");

        // Find the column with the new value (header must be "Valeur")
        let valueCol = headers.indexOf("Valeur");
        if (valueCol == -1)
            valueCol = headers.indexOf("Value");

        // Find the column with the status (header must be "Statut" or "Status")
        let statusCol = headers.indexOf("Statut");
        if (statusCol == -1)
            statusCol = headers.indexOf("Status");

        if (pageCol == -1 || templateCol == -1 || parameterCol == -1 || valueCol == -1 || statusCol == -1) {
            alert("Veuillez vous assurer d'avoir les colonnes suivantes : Page Triple Performance, Template, Paramètre, Valeur, Statut");
            return;
        }

        const wikipage = new wikiPage();

        // Now, for each row, if the status is "o" then proceed, else ignore
        values.forEach((row, rowIndex) => {
            let title = row[pageCol];
            let template = row[templateCol];
            let parameter = row[parameterCol];
            let newValue = row[valueCol];
            let status = row[statusCol];

            if (!(status == 'o' || status == 'f'))
                return;
            
            if (template.length == 0 || title.length == 0 || parameter.length == 0)
                return;

            let apiTools = getApiTools();
            let pageContent = apiTools.getPageContent(title);

            if (pageContent == undefined) {
                Logger.log("Page not found: " + title);
                return;
            }

            let bIgnoreWhenExisting = (status == 'o'); // if f, we will force the new value

            pageContent = wikipage.addValueToTemplate(pageContent, template, parameter, newValue, bIgnoreWhenExisting);

            if (pageContent === false)
                return;

            console.log('Before updateWikiPage ');
            console.log(pageContent);

            // Update the page content
            apiTools.updateWikiPage(title, pageContent, "Mise à jour du paramètre " + parameter + " dans la template " + template);
            sheet.getRange(rowIndex + startRow + 1, statusCol + 1, 1, 1).setValue('x');

            SpreadsheetApp.flush();
        });
        
        alert("Terminé");
    }

    /**
     * Performs a search on each keyword in the header
     */
    findPages() {
        Logger.log('findPages');

        // First get the list of keywords we are interested in:
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let values = data.getValues();
        let keywordsToLookup = values.shift();
        
        keywordsToLookup.shift(); // remove the title
        keywordsToLookup.shift(); // remove the result count

        // Get all pages from triple performance with the keywords
        let apiTools = getApiTools();

        let pagesWithKeywords = new Map();

        keywordsToLookup.forEach(term => {
            let results = apiTools.search(term);

            results.forEach(page => {
                let keywords = pagesWithKeywords.get(page);    

                if (keywords == undefined)
                    pagesWithKeywords.set(page, [term]); 
                else
                {
                    keywords.push(term);
                    pagesWithKeywords.set(page, keywords);
                }                
            });
        });

        const tripleperformanceURL = getTriplePerformanceURL();

        values = [];
        let rowId = 2;
        pagesWithKeywords.forEach((keywords, pageTitle) => {

            let content = getHyperlinkedTitle(tripleperformanceURL, pageTitle);
            let row = [content, '=COUNTIF(C'+rowId+':Z'+rowId+'; "x")'];
            keywordsToLookup.forEach(term => {
                if (keywords.indexOf(term) != -1)
                    row.push('x');
                else
                    row.push('n');
            });
        
            values.push(row);
            rowId++;
        });

        sheet.getRange(2, 1, values.length, keywordsToLookup.length + 2).setValues(values);    

        alert("Terminé");        
    }

    ///// Private functions /////

    addTabForPageCreation() {
        
        let sheet = renameAndCreateTab("Création de pages avec template");

        sheet.getRange(1, 1, 1, this.columnsCreatePages.length).setValues([this.columnsCreatePages]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.setRowHeightsForced(2, sheet.getMaxRows() - 1, 70);
        sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsCreatePagesDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1).setFontWeight("bold");
        });

        const statusCol = this.getColNumberCreatePages("Statut (a/u/x)");

        var range = sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1);
        setConditionalFormatingYN(range);

        return sheet;
    }

    addTabForKeywordsManagement() {
        let sheet = renameAndCreateTab("Ajout de mots clés");

        sheet.getRange(1, 1, 1, this.columnsAddKeywords.length).setValues([this.columnsAddKeywords]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsAddKeywordsDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1).setFontWeight("bold");
        });

        var range = sheet.getRange(2, 2, sheet.getMaxRows() - 1, 20);
        setConditionalFormatingYN(range);

        return sheet;
    }

    addTabForCodeInsertion() {
        let sheet = renameAndCreateTab("Ajout de code");

        sheet.getRange(1, 1, 1, this.columnsInsertCode.length).setValues([this.columnsInsertCode]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsInsertCodeDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1).setFontWeight("bold");
        });

        sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setFontFamily("Code");
        
        var range = sheet.getRange(2, 3, sheet.getMaxRows() - 1, 1);
        setConditionalFormatingYN(range);

        return sheet;
    }

    addTabForSearchEngine() {
        let sheet = renameAndCreateTab("Recherche de pages");

        sheet.getRange(1, 1, 1, this.columnsSearch.length).setValues([this.columnsSearch]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).setVerticalAlignment("middle");

        this.columnsSearchDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, sheet.getMaxRows() - 1, 1).setFontWeight("bold");
        });

        setConditionalFormatingYN(sheet.getRange(2, 3, sheet.getMaxRows() - 1, 20));

        return sheet;
    }

    getColNumberCreatePages(colname) {
        return this.columnsCreatePages.indexOf(colname) + 1;
    }

    getColNumberAddKeyword(colname) {
        return this.columnsAddKeywords.indexOf(colname) + 1;
    }

    /**
     * Create a new tab and build some useful stats out of the French platform
     */
    platformStatistics() {
        // Start by getting a huge table of all the pages with the type of page and the type of production
        let apiTools = getApiTools('fr');

        let pages = apiTools.getSemanticValuesWithForSemanticQuery("[[A un type de page::!Personne]]", ['A un type de page', 'A un type de production', 'Number of page views']);
        let viewByProductions = {};
        let viewByTypes = {};
        let countByProductions = {};
        let countByTypes = {};
        let productions = [];
        let types = [];

        let self = this;

        pages.forEach(aPage => {
            let pageTypes = aPage[1];
            let pageProductions = aPage[2];
            let pageViews = Number(aPage[3]);
            
            if (typeof pageTypes == 'string')
                pageTypes = [pageTypes];

            pageTypes.forEach(pageType => {
                if (types.indexOf(pageType) == -1)
                    types.push(pageType);

                if (countByTypes[pageType] == undefined)
                    countByTypes[pageType] = 1;
                else
                    countByTypes[pageType] ++;

                if (viewByTypes[pageType] == undefined)
                    viewByTypes[pageType] = pageViews;
                else
                    viewByTypes[pageType] += pageViews;
            });

            if (typeof pageProductions == 'string')
                pageProductions = [pageProductions];

            pageProductions.forEach(production => {
                production = self.simplifyProductionName(production);

                if (productions.indexOf(production) == -1)
                    productions.push(production);

                if (countByProductions[production] == undefined)
                    countByProductions[production] = 1;
                else
                    countByProductions[production] ++;

                if (viewByProductions[production] == undefined)
                    viewByProductions[production] = pageViews;
                else
                    viewByProductions[production] += pageViews;
            });
        });

        // Create a new tab and write the results
        let sheet = renameAndCreateTab("Statistiques");

        let dataTypes = [['Type de page', 'Nombre de pages', 'Nombre de vues']];
        let dataProductions =  [['Type de production', 'Nombre de pages', 'Nombre de vues']];

        types.forEach(type => {
            dataTypes.push([type, countByTypes[type], viewByTypes[type]]);
        });
        sheet.getRange(1, 1, dataTypes.length, 3).setValues(dataTypes);

        productions.forEach(production => {
            dataProductions.push([production, countByProductions[production], viewByProductions[production]]);
        });

        sheet.getRange(1, 5, dataProductions.length, 3).setValues(dataProductions);
    }

    simplifyProductionName(production) {
        if (production.match(/Élevage/))
            return 'Élevage';
        if (production.match(/Ovin/))
            return 'Élevage';
        if (production.match(/Bovin/))
            return 'Élevage';

        if (production.match(/Aviculture/))
            return 'Aviculture';

        if (production.match(/Polyculture/))
            return 'Polyculture-élevage';

        if (production.match(/Prairies/))
            return 'Prairies';

        switch (production) {
            case 'Agriculture':
            case 'Agronomie':
                return '';

            default:
                break;
        }
        
        return production;
    }


    analyzeTranslations() {
        // The sheet should have one column per language, with the language code as the header. Each subsequent row should contain the page title in that language.
        Logger.log('analyzeTranslations');
        let sheet = SpreadsheetApp.getActiveSheet();
        let data = sheet.getDataRange();
        let values = data.getValues();
        let languages = values.shift(); // remove the title row

        values.forEach((row, rowIndex) => {
            languages.forEach((language, colIndex) => {
                let title = String(row[colIndex]);
                if (title.length == 0)
                    return;

                Logger.log("Analyzing translations for " + title + " in " + language);

                let apiTools = getApiTools(language);
              
                let translations = apiTools.getTranslationsForPage(title);
                if (translations.length == 0) {
                    Logger.log("No translations found for " + title + " in " + language);
                    return;
                }

                Logger.log(translations);

                // For each translation, check if the page is properly set in the corresponding language column
                for (const [targetLanguage, translatedTitle] of Object.entries(translations)) {
                    let targetColIndex = languages.indexOf(targetLanguage);
                    if (targetColIndex == -1) {
                        // Add a new column for the target language
                        targetColIndex = languages.length;
                        languages.push(targetLanguage);
                        sheet.insertColumnAfter(targetColIndex);
                        sheet.getRange(1, targetColIndex + 1).setValue(targetLanguage);
                    }

                    // If the cell is not empty, skip it
                    const existingValue = sheet.getRange(rowIndex + 2, targetColIndex + 1).getValue();
                    if (existingValue.length > 0) {
                        if (existingValue != translatedTitle) {
                            // Set the cell color to red to indicate a mismatch
                            sheet.getRange(rowIndex + 2, targetColIndex + 1).setBackground("red");
                        }

                        continue;
                    }

                    // Set the value in the corresponding cell
                    sheet.getRange(rowIndex + 2, targetColIndex + 1).setValue(translatedTitle);
                }
            });
        });
    }

    fixTranslations() {
        // The sheet should have one column per language, with the language code as the header. Each subsequent row should contain the page title in that language.
        Logger.log('analyzeTranslations');
        let sheet = SpreadsheetApp.getActiveSheet();
        let data = sheet.getDataRange();
        let values = data.getValues();
        let languages = values.shift(); // remove the title row
        const wikipage = new wikiPage();

        values.forEach((row, rowIndex) => {
            languages.forEach((language, colIndex) => {
                let title = row[colIndex];
                if (title.length == 0)
                    return;

                let apiTools = getApiTools(language);
                let pageContent = apiTools.getPageContentWithRedirect(title);

                if (!pageContent || pageContent.content.length == 0)
                    return; // the page does not exist

                console.log(pageContent);
            
                Logger.log("Analyzing translations for " + title + " in " + language);
              
                let translations = apiTools.getTranslationsForPage(title);
                if (translations.length == 0) {
                    Logger.log("No translations found for " + title + " in " + language);
                    return;
                }

                Logger.log(translations);

                languages.forEach((targetLanguage, targetColIndex) => {
                    if (targetLanguage == language)
                        return; // skip the current language

                    const targetTranslation = sheet.getRange(rowIndex + 2, targetColIndex + 1).getValue();
                    if (targetTranslation.length == 0)
                        return;

                    if (targetTranslation == translations[targetLanguage])
                        return; // the translation is already correct
                    
                    // Update the wiki page with the correct translation
                    Logger.log("Updating translation for " + title + " in " + targetLanguage + " to " + targetTranslation);

                    pageContent.content = wikipage.setTranslationForPage(pageContent.content, targetLanguage, targetTranslation);
                });

                if (pageContent && pageContent.content.length > 0) {
                    // Update the page content
                    apiTools.updateWikiPage(pageContent.title, pageContent.content, "Mise à jour des traductions");
                }   
            });
        });

        alert("Les traductions ont été mises à jour.");
    }
}