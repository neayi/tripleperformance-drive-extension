
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


/**
 * Given a RichTextValue Object, iterate over the individual runs
 *    and call out to htmlStyleRtRun() to return the text wrapped
 *    in <span> tags with specific styling.
 * @see https://gist.github.com/mvogelgesang/8fe14931d79ed79d73154d969f02aada
 * 
 * @param {RichTextValue} richTextValue a RichTextValue object
 *    from a given Cell.
 * @return {string} HTML encoded text 
 */
function htmlEncodeRichText(richTextValue) {
    // create an empty string which will hold the html content
    var htmlString = "";
    // get an array of Runs for the given Rich Text
    var rtRuns = richTextValue.getRuns();
    // loop the array
    for (var i = 0; i < rtRuns.length; i++) {
      // return html version of a given run, append to existing string
      htmlString += htmlStyleRtRun(rtRuns[i]);
    }
    return htmlString;
  }
  
  /**
   * Given a RichTextValue Run, evaluates for style attributes and 
   *    builds a <span> tag with in-line styles. 
   *    For instance:
   *    <span style="color: cyan">text</span>
   *
   * @see https://gist.github.com/mvogelgesang/8fe14931d79ed79d73154d969f02aada
   * 
   * @param {RichTextValue} richTextRun an instance of a
   *    RichTextValue run
   * @return {string} inputted text wrapped in <span> tag with 
   *    applicable styling. 
   */
  function htmlStyleRtRun(richTextRun) {
    // string to hold the inline style key value pairs
    var styleString = "";
    // evaluate the attributes of a given Run and construct style attributes
    if (richTextRun.getTextStyle().isBold()) {
      styleString += "font-weight:bold;"
    }
    if (richTextRun.getTextStyle().isItalic()) {
      styleString += "font-style:italic;"
    }
    
    // fetch values for font family, size, and color attributes
    // styleString += "font-family:" + richTextRun.getTextStyle().getFontFamily() +
    //   ";";
    // styleString += "font-size:" + richTextRun.getTextStyle().getFontSize() +
    //   "px;";
    // styleString += "color:" + richTextRun.getTextStyle().getForegroundColor() +
    //   ";";
  
    // underline and strikethrough use the same style key, text-decoration, must evaluate together, otherwise, the styling breaks. 
    // both false 
    if (!richTextRun.getTextStyle().isUnderline() && !richTextRun.getTextStyle().isStrikethrough()) {
      // do nothing
    }
    // underline true, strikethrough false
    else if (richTextRun.getTextStyle().isUnderline() && !richTextRun.getTextStyle()
      .isStrikethrough()) {
      styleString += "text-decoration: underline;";
    }
    // underline false, strikethrough true
    else if (!richTextRun.getTextStyle().isUnderline() && richTextRun.getTextStyle()
      .isStrikethrough()) {
      styleString += "text-decoration: line-through;";
    }
    // both true
    else {
      styleString += "text-decoration: line-through underline;";
    }
  
    // line breaks don't get converted, run regex and insert <br> to replace \n
    var richText = richTextRun.getText();
    var re = new RegExp("\n", "g");
    var richText = richText.replace(re, "<br>");
  
    // bring it all together
    var formattedText = '<span style="' + styleString + '">' + richText +
      '</span>';
    return formattedText;
  }