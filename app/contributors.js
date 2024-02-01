
function createUsers() {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const tripleperformanceURL = "https://wiki.tripleperformance.fr/";

    // Ignore the first row for the column names
    for (let rowId = 2; rowId <= sheet.getLastRow(); rowId++) {
        this.apiTools = new api_tools(tripleperformanceURL, 'Bertrand Gorge@Triple_Performance_Robot', 'oggbeitecs3dgqtep18cbm3o5qhpakf2');

        const values = sheet.getRange(rowId, 1, 1, 2).getValues();

        if (values[0][0].trim() == "")
            continue;

        let userpage = values[0][0];
        let username = values[0][1];

        var pageContent = apiTools.getPageContent(userpage);

        if (pageContent && pageContent.trim().length > 0) {
            continue;
        }
        else {
            pageContent = "{{Contributeur | Nom = " + username + " | Photo = | Biographie = | URL = }}";

            this.apiTools.createWikiPage(userpage, pageContent, "Création de la page");
        }

        let content = getHyperlinkedTitle(tripleperformanceURL, userpage, username);
        sheet.getRange(rowId, 3, 1, 1).setValue(content);
    }

    SpreadsheetApp.getUi() // Or DocumentApp, SlidesApp or FormApp.
        .alert('Completed');

}
