
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
    
    createTab(tabName)
    {
        if (!this.tabs.includes(tabName))
            return false;

        let sheet = renameAndCreateTab(tabName);

        if (tabName == "Ferme")
        {
            this.createFermeTab();
        }
    }

    /**
     * Returns a list of existing tabs in the spreadsheet that we know how to synchronize
     */
    getSynchronizableTabs()
    {
        let tabsToSynchronize = [];

        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        var sheets = spreadsheet.getSheets();
        sheets.forEach((s) => {
            const sheetName = s.getName();
            if (this.tabs.includes(sheetName))
                tabsToSynchronize.push(sheetName);
        });

        return tabsToSynchronize;
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

        if (!wikiTitle)
            return;

        let params = new Map();

        this.loadFarmDefinitions();

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

        return;

        // {{Portrait de ferme
        
        // "Intitule": "Nom de l'exploitation",
        // "Description": "Indiquer le nom de l'exploitation (en général, correspond au titre de la page)",
        // "Template": "Portrait de ferme",
        // "TemplateParam": "Nom de l'exploitation"

        let newCode = "{{#economic_charts:\n   " + templateParametersPerYear.join("\n | ") + '}}';

        let apiTools = getApiTools();
        let pageContent = apiTools.getPageContent(wikiTitle);

        if (wiki.hasParserFunction("economic_charts", pageContent))
            pageContent = wiki.replaceParserFunction("economic_charts", newCode, pageContent);
        else
            pageContent += "\n\n" + newCode;

        apiTools.updateWikiPage(wikiTitle, pageContent, "Mise à jour des données de la de la comptabilité");

        Logger.log("Sync done");

        SpreadsheetApp.getUi().alert("La page "+ wikiTitle +" a été mise à jour !");

        return;
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