
class FarmModel {
    constructor() 
    {
        this.defGeneralites = {};

        this.tabs = ["Ferme"];
    }

    getTabs()
    {
        return this.tabs;
    }

    /** Make sure the farm Tab exists */
    createFermeTab() {
        const tabName = "Ferme";
        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        let currentSheet = SpreadsheetApp.getActiveSheet();

        let sheet = spreadsheet.getSheetByName(tabName);
        if (sheet == null)
        {
            sheet = spreadsheet.insertSheet(0);
            sheet.setName(tabName);
        }

        let bHasKey = false;
        var values = sheet.getDataRange().getValues();
                
        for (var r = 0; r < values.length; r++) 
        {
            if (values[r][0] == "Nom de la page Triple Performance")
            {
                bHasKey = true;
                break;
            }
        }

        if (!bHasKey) {
            // Create the new charts after the last non empty row
            const insertRow = sheet.getLastRow() + 1;
            const tripleperformanceURL = getTriplePerformanceURL();

            let values = [
                ["Nom de la page Triple Performance", "", `=HYPERLINK(CONCATENATE("${tripleperformanceURL}wiki/"; B${insertRow}); B${insertRow})`],
            ];

            sheet.getRange(insertRow, 1, values.length, 3).setValues(values);    
            sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold").setBackground(getLightGrayColor()); // Header

            SpreadsheetApp.flush();
        }

        currentSheet.activate();
    }

    // returns the title of the page where the farm is stored
    getFarmPageTitle()
    { 
        let wikiTitle = String(this.getGeneraliteValue("Nom de la page Triple Performance"));

        if (wikiTitle.length == 0) {
            SpreadsheetApp.getUi().alert("Le nom de la page Triple Performance est vide. Veuillez créer puis reporter le nom de la page dans l'onglet Ferme !");
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

        if (!sheet) {
            SpreadsheetApp.getUi().alert("Impossible de trouver l'onglet Ferme. Veuillez le créer et le remplir avant de démarrer une synchronisation !");
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