
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

function renameAndCreateTab(tabName)
{
    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let sheet = spreadsheet.getSheetByName(tabName);
    if (sheet != null) {
        const newName = renameSheet(sheet, tabName);
        Logger.log("Un onglet " +tabName+ " a été trouvé dans la feuille, et a été renommé en " + newName);
    }

    return spreadsheet.insertSheet(tabName);
}

function setSheetVersion(sheet, version, documentation) {
    sheet.getRange(1, 1, 2, 3).setValues([
        ["Version", version, "Ne pas changer ce numéro !"],
        [documentation, "", ""]
    ]);

    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");
    sheet.getRange(2, 1, 1, 1).setWrap(true);    
    sheet.getRange(2, 1, 1, 4).merge();
}

function getHyperlinkedTitle(tripleperformanceURL, pageTitle, displayTitle = "")
{
    if (displayTitle.length == 0)
        displayTitle = pageTitle;

    displayTitle = displayTitle.replaceAll('"', '""');

    let pageURL = encodeURI(pageTitle.replaceAll(' ', '_'));
    return `=HYPERLINK("${tripleperformanceURL}wiki/${pageURL}"; "${displayTitle}")`;    
}

function getLightGrayColor()
{
    return "#f3f3f3";
}