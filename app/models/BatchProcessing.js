
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
            ["Titre",     "262", "left",   true,  true],
            ["Mot-clé 1", "100", "center", true,  false],
            ["Mot-clé 2", "100", "center", true,  false]
        ];

        this.columnsAddKeywords = this.columnsAddKeywordsDefinitions.map(col => col[0]);
        
        // title, width, alignment, wrap, bold
        this.columnsInsertCodeDefinitions = [
            ["Titre", "262", "left", true,  true],
            ["Code",  "500", "left", true,  false]
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
        let values = data.getValues();
        let keywordsToLookup = values.shift();
        keywordsToLookup.shift(); // remove the title

        let startRow = data.getRow();

        values.forEach((row, rowIndex) => {

            let title = row[0];
   
            let newValues = [];

            var wiki = new wikiPage();
            let apiTools = getApiTools();

            var pageContent = apiTools.getPageContent(title);
            const originalPageContent = pageContent;

            let col = 1;
            keywordsToLookup.forEach(keyword => {
                if (row[col] == 'a') {
                    pageContent = wiki.insertKeywordInPage(pageContent, keyword);
                    newValues.push('x');
                } else 
                    newValues.push(row[col]);

                col++;
            });

            if (originalPageContent != pageContent)
                apiTools.updateWikiPage(title, pageContent, "Ajout de mot clé");

            sheet.getRange(rowIndex + startRow + 1, 2, 1, keywordsToLookup.length).setValues([newValues]);
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

        //
        
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

        sheet.setRowHeightsForced(2, 900, 70);
        sheet.getRange(2, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsCreatePagesDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, 900, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, 900, 1).setFontWeight("bold");
        });

        const statusCol = this.getColNumberCreatePages("Statut (a/u/x)");

        var range = sheet.getRange(2, statusCol, 900, 1);
        setConditionalFormatingYN(range);

        return sheet;
    }

    addTabForKeywordsManagement() {
        let sheet = renameAndCreateTab("Ajout de mots clés");

        sheet.getRange(1, 1, 1, this.columnsAddKeywords.length).setValues([this.columnsAddKeywords]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsAddKeywordsDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, 900, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, 900, 1).setFontWeight("bold");
        });

        var range = sheet.getRange(2, 2, 900, 20);
        setConditionalFormatingYN(range);

        return sheet;
    }

    addTabForCodeInsertion() {
        let sheet = renameAndCreateTab("Ajout de code");

        sheet.getRange(1, 1, 1, this.columnsInsertCode.length).setValues([this.columnsInsertCode]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        this.columnsInsertCodeDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, 900, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, 900, 1).setFontWeight("bold");
        });

        sheet.getRange(2, 2, 900, 1).setFontFamily("Code");

        return sheet;
    }

    addTabForSearchEngine() {
        let sheet = renameAndCreateTab("Recherche de pages");

        sheet.getRange(1, 1, 1, this.columnsSearch.length).setValues([this.columnsSearch]);
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");

        sheet.setFrozenRows(1);

        sheet.getRange(2, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        this.columnsSearchDefinitions.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(2, colNumber + 1, 900, 1)
                .setHorizontalAlignment(col[2])
                .setWrap(col[3]);

            if (col[4])
                sheet.getRange(2, colNumber + 1, 900, 1).setFontWeight("bold");
        });

        setConditionalFormatingYN(sheet.getRange(2, 3, 900, 20));

        return sheet;
    }

    getColNumberCreatePages(colname) {
        return this.columnsCreatePages.indexOf(colname) + 1;
    }

    getColNumberAddKeyword(colname) {
        return this.columnsAddKeywords.indexOf(colname) + 1;
    }

}