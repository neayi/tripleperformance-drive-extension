
class FarmModel {
    constructor() 
    {
        this.apiTools = false;

        this.defGeneralites = {};
    }

    loadApiTools()
    {
        if (this.apiTools)
            return this.apiTools;

        let parameters = new tp_parameters();
        parameters.loadSecrets();
        if (!parameters.checkSecrets())
            return;

        return this.apiTools = new api_tools(parameters.secrets.wikiURL, parameters.secrets.username, parameters.secrets.password);
    }

    /**
     * Create a new tab for the comptabilité
     */
    createComptabiliteTab() 
    {
        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let comments = "";

        let sheet = spreadsheet.getSheetByName("Comptabilité");
        if (sheet != null) {
            const newName = renameSheet(sheet, "Comptabilité");
            comments = "Un onglet Comptabilité a été trouvé dans la feuille, et a été renommé en " + newName;
        }

        sheet = spreadsheet.insertSheet("Comptabilité");
        addMessageToLog("Creation d'un nouvel onglet Comptabilité", "Comptabilité", "OK", comments);

        setSheetVersion(sheet, 1, "Vous pouvez ajouter, supprimer ou renommer des années. N'ajoutez pas et ne modifiez pas"
            + " les noms des lignes. Vous pouvez laisser des lignes vides ou les supprimer si vous ne"
            + " les utilisez pas pour cette ferme.");

        const jsonString = HtmlService.createHtmlOutputFromFile("definitions/compta_defs_fr.html").getContent();
        const definitionsDesPostesCompta = JSON.parse(jsonString);

        let year = (new Date()).getFullYear();

        sheet.getRange(4, 1, 1, 6).setValues([["", "Année", year - 4, year - 3, year - 2, year - 1]])
            .setFontWeight("bold")
            .setFontSize(15)
            .setBackground("#f3f3f3");

        sheet.setFrozenRows(4);

        let currentRow = 5;
        let posteTotalRow = 6;
        let totals = new Map();

        for (const [compte, postesDuCompte] of Object.entries(definitionsDesPostesCompta)) {

            let totauxRows = [];

            for (const [postePrincipal, definition] of Object.entries(postesDuCompte)) {
                let posteRowStart = currentRow;

                definition.postes.forEach((unPoste) => {

                    totals.set(unPoste, currentRow);

                    sheet.getRange(currentRow++, 1, 1, 2).setValues([
                        [postePrincipal, unPoste]
                    ]);
                });

                // Now add a row for the total
                posteTotalRow = currentRow++;

                if (compte != "Soldes de gestion")
                {
                    totauxRows.push(posteTotalRow);
    
                    sheet.getRange(posteTotalRow, 1, 1, 2).setValues([
                        [postePrincipal, "Total"]
                    ]);
    
                    sheet.getRange(posteTotalRow, 3, 1, 4).setFormulas([
                        [`=SUM(C${posteRowStart}:C${posteTotalRow - 1})`,
                        `=SUM(D${posteRowStart}:D${posteTotalRow - 1})`,
                        `=SUM(E${posteRowStart}:E${posteTotalRow - 1})`,
                        `=SUM(F${posteRowStart}:F${posteTotalRow - 1})`]
                    ]);
    
                    sheet.getRange(posteTotalRow, 1, 1, 6)
                        .setFontWeight("bold")
                        .setFontSize(12)
                        .setBackground(definition.color);

                    totals.set(postePrincipal, posteTotalRow);
                }
                else 
                {
                    // Specific case for "Soldes de gestion"
                    Logger.log("Paramètres de auxiliaires :" + [...totals.entries()]);

                    sheet.getRange(posteTotalRow, 1, 3, 2).setValues([
                        [postePrincipal, "EBE total"],
                        [postePrincipal, "Valeur ajoutée"],
                        [postePrincipal, "Capacité d'autofinancement"]
                    ]);

                    // "EBE total": "Total des produits - Total des charges",
                    let cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges}`);    
                    });
                    posteTotalRow++;

                    // "Valeur ajoutée": "Total des produits - charges sauf personnel"
                    cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        let personnel = totals.get('Charges de personnel');
                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges} + ${c}${personnel}`);    
                    });
                    posteTotalRow++;

                    // "Capacité d'autofinancement": "Valeur ajoutée - frais financiers"
                    cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        let personnel = totals.get('Charges de personnel');
                        let annuites = totals.get('Annuité de remboursement');

                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges} + ${c}${personnel} - ${c}${annuites}`);    
                    });

                    // Style
                    sheet.getRange(posteTotalRow - 2, 1, 3, 6)
                        .setFontWeight("bold")
                        .setFontSize(12)
                        .setBackground(definition.color);
                }

                // Merge the cells in column A
                sheet.getRange(posteRowStart, 1, posteTotalRow - posteRowStart + 1, 1)
                    .merge()
                    .setBackground(definition.color)
                    .setFontWeight("bold")
                    .setFontSize(15)
                    .setHorizontalAlignment("center")
                    .setVerticalAlignment("middle")
                    .setWrap(true);
            }

            if (compte != "Soldes de gestion")
            {
                // Add a total row (totauxRows)
                posteTotalRow += 2;

                let cIndex = 3;
                ['C', 'D', 'E', 'F'].forEach((c) => {
                    let sumItems = totauxRows.map((r) => `${c}${r}`);
        
                    sheet.getRange(posteTotalRow, cIndex++).setFormula("=" + sumItems.join('+'));    
                });

                sheet.getRange(posteTotalRow, 1).setValue("Total des " + compte.toLowerCase());
                sheet.getRange(posteTotalRow, 1, 1, 6)
                    .setFontWeight("bold")
                    .setFontSize(15)
                    .setBackground("#f3f3f3");

                totals.set(compte, posteTotalRow);

                posteTotalRow++;
                currentRow = posteTotalRow + 1;
            }

        }

        sheet.getRange(5, 3, posteTotalRow, 4)
            .setNumberFormat("#,##0 €");
    }

    syncComptabiliteToWiki()
    {
        Logger.log("syncComptabiliteToWiki");

        let wikiTitle = this.getFarmPageTitle();
        let wiki = new wikiPage();

        Logger.log(wikiTitle);

        if (!wikiTitle)
            return;

        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Comptabilité");
        if (sheet == null) {
            addMessageToLog("Synchro Comptabilité", "Comptabilité", "Erreur", 
                            "Impossible de trouver l'onglet Comptabilité !");
            return;
        }

        const dataRange = sheet.getDataRange();

        if (dataRange.getRow() != 1 ||
            dataRange.getColumn() != 1) {
            addMessageToLog("Synchro Comptabilité", "Comptabilité", "Erreur",
                    "La structure de l'onglet comptabilité a été modifiée. Veuillez créer l'onglet"
                       +" à nouveau, copier les données dans le nouvel onglet et recommencer !")
            return;
        }

        const version = sheet.getRange(1, 2).getValue();
        const maxcols = dataRange.getNumColumns();
        const maxrows = dataRange.getNumRows();

        let templateParametersPerYear = [];

        if (version == 1)
        {
            for (let col = 3; col <= maxcols; col++)
            {
                let parameters = new Map();

                const annee = String(sheet.getRange(4, col).getValue());

                const regex = /[A-Z]/g;

                if (!annee.match(/^[0-9]{4}$/))
                    continue;

                for (let row = 5; row < maxrows; row++){
                    const label = sheet.getRange(row, 2).getValue();
                    const value = sheet.getRange(row, col).getValue();

                    if (Number(value) == 0)
                        continue;

                    if (label.length == 0 ||
                        label.toLowerCase() == "total" ||
                        label.toLowerCase() == "valeur ajoutée" ||
                        label.toLowerCase() == "capacité d'autofinancement")
                        continue; 

                    parameters.set(label + ' ' + annee, Number(value)); 
                }

                if (parameters.size > 0)
                {
                    let pArray = [];
                    parameters.forEach( ( value, key ) => { pArray.push(key + ' = ' + value) } );
                    templateParametersPerYear.push(pArray.join("\n | "));
                }
            }               

            let newCode = "{{#economic_charts:\n   " + templateParametersPerYear.join("\n | ") + '}}';

            Logger.log(newCode);

            this.loadApiTools();
            let pageContent = this.apiTools.getPageContent(wikiTitle);

            if (wiki.hasParserFunction("economic_charts", pageContent))
                pageContent = wiki.replaceParserFunction("economic_charts", newCode, pageContent);
            else
                pageContent += "\n\n" + newCode;

            this.apiTools.updateWikiPage(wikiTitle, pageContent, "Mise à jour des données de la de la comptabilité");

            Logger.log("Sync done");

            addMessageToLog("Synchro Comptabilité", "Comptabilité", "OK", "La page "+ wikiTitle +" a été mise à jour !");

            return;
        }
        else
        {
            addMessageToLog("Synchro Comptabilité", "Comptabilité", "Erreur", `La version actuelle (${version}) du document n'est pas gérée ! Veuillez créer l'onglet`
                              +" à nouveau, copier les données dans le nouvel onglet et recommencer !");
            return;
        }
    }

    /**
     * Syncs the data in the ferme tab, and populate the template "Portrait de ferme"
     * @returns
     */
    syncGeneralitesToWiki()
    {
        Logger.log("syncGeneralitesToWiki");

        let wikiTitle = this.getFarmPageTitle();
        let wiki = new wikiPage();

        Logger.log(wikiTitle);

        if (!wikiTitle)
            return;

        let params = new Map();

        this.loadFarmDefinitions();

        Logger.log(this.defGeneralites);

        this.defGeneralites.forEach( ( category, fields ) => { 
            fields.foreach( (f) => {
                if (f.template != 'Portrait de ferme' || !f.TemplateParam)
                    return;

                const value = this.getGeneraliteValue(f.Intitule);

                if (value == "")
                    return;

                params.push(f.TemplateParam, value);
            });
            
        } );

        Logger.log(params);

        return;

        // {{Portrait de ferme
        
        // "Intitule": "Nom de l'exploitation",
        // "Description": "Indiquer le nom de l'exploitation (en général, correspond au titre de la page)",
        // "Template": "Portrait de ferme",
        // "TemplateParam": "Nom de l'exploitation"

        let newCode = "{{#economic_charts:\n   " + templateParametersPerYear.join("\n | ") + '}}';

        Logger.log(newCode);

        this.loadApiTools();
        let pageContent = this.apiTools.getPageContent(wikiTitle);

        if (wiki.hasParserFunction("economic_charts", pageContent))
            pageContent = wiki.replaceParserFunction("economic_charts", newCode, pageContent);
        else
            pageContent += "\n\n" + newCode;

        this.apiTools.updateWikiPage(wikiTitle, pageContent, "Mise à jour des données de la de la comptabilité");

        Logger.log("Sync done");

        addMessageToLog("Synchro Comptabilité", "Comptabilité", "OK", "La page "+ wikiTitle +" a été mise à jour !");

        return;
    }


    // returns the title of the page where the farm is stored
    getFarmPageTitle()
    { 
        let wikiTitle = String(this.getGeneraliteValue("Nom de la page Triple Performance"));
        Logger.log(wikiTitle);

        if (wikiTitle.length == 0) {
            addMessageToLog("Synchro Comptabilité", "Comptabilité", "Erreur", 
                "Le nom de la page Triple Performance est vide. Veuillez créer puis reporter le nom de la page dans l'onglet Ferme !");
            return false;
        }
        
        return wikiTitle;
    }

    loadFarmDefinitions()
    {
        if (this.defGeneralites.Entreprise)
            return this.defGeneralites;

        const jsonString = HtmlService.createHtmlOutputFromFile("definitions/generalites_ferme.html").getContent();
        this.defGeneralites = JSON.parse(jsonString);

        return this.defGeneralites;
    }

    getGeneraliteValue(fieldname)
    {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ferme");

        Logger.log(sheet);

        if (!sheet) {
            addMessageToLog("", "", "Erreur", 
                "Impossible de trouver l'onglet Ferme. Veuillez le créer et le remplir avant de démarrer une synchronisation !");
            return null;
        }

        var range = sheet.getDataRange();
        var values = range.getValues();
                
        for (var r = 0; r < values.length; r++) 
        {
            if (values[r][0] == fieldname)
                return values[r][1];
        }

        return null;
    }
}