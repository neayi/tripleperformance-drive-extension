
/**
 * Create a log tab called Triple Performance Log, and clear it if it already exists
 */
function createLogTab() {
    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let sheet = spreadsheet.getSheetByName("Triple Performance Log");
    if (sheet) 
        return;

    sheet = spreadsheet.insertSheet("Triple Performance Log");
    
    // Now prepare the sheet for more logging:
    // Add the header row, put it in bold
    sheet.getRange(1, 1, 1, 5).setValues([
        ["Date et heure", "Action", "Onglet", "Statut", "Commentaire"]
    ]).setFontWeight("bold");

    // freeze the header row
    sheet.setFrozenRows(1);

    // Change the columns widths
    // todo
}

function addMessageToLog(action, tab, status, comments) {
    Logger.log(action + " - " + tab + " - " + status + " : " + comments);

    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let sheet = spreadsheet.getSheetByName("Triple Performance Log");

    let maintenant = new Date();

    sheet.appendRow([Utilities.formatDate(maintenant, 'Europe/Paris', 'dd-MMM HH-mm'), action, tab, status, comments]);
    sheet.autoResizeColumns(1, 5);

    sheet.activate();
}

function renameSheet(sheet, name, counter = 1) {
    try
    {
        let newName = `${name} (${counter})`;
        sheet.setName(newName);
        return newName;
    } 
    catch (e) 
    {
        return renameSheet(sheet, name, counter + 1);
    }
}

function setSheetVersion(sheet, version, documentation) {
    sheet.getRange(1, 1, 2, 3).setValues([
        ["Version", version, "Ne pas changer ce numéro !"],
        [documentation, "", ""]
    ]);

    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");
    sheet.getRange(2, 1, 1, 3).merge();
    sheet.getRange(2, 1, 1, 1).setWrap(true);    
}