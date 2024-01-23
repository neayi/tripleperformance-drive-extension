
function sync_tabs(e)
{
    const tabsNames = e.formInputs.TabsToCreate;

    let farmModel = new FarmModel();

    tabsNames.forEach((element) => {
        switch (element) {
            case 'Ferme':
                return;

            case 'Comptabilité':
                Logger.log("Synchro de Comptabilité")
                farmModel.syncComptabiliteToWiki();
                return;                

            case 'Qualité de la vie':
                return;
        
            default:
                console.log("Unknown tab to sync");
                return;
        }
    });


}

/**
 * https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOTga10ZXh0UGFyYWdyYXBogaR0ZXh0uTxiPlBvcnRyYWl0cyBkZSBmZXJtZTwvYj6BrnNlbGVjdGlvbklucHV0hKR0eXBlqUNIRUNLX0JPWKVsYWJlbLFPbmdsZXRzIMOgIGNyw6llcqRuYW1lrFRhYnNUb0NyZWF0ZaVpdGVtc5ODpHRleHSlRmVybWWldmFsdWWlRmVybWWoc2VsZWN0ZWTDg6R0ZXh0rUNvbXB0YWJpbGl0w6mldmFsdWWtQ29tcHRhYmlsaXTDqahzZWxlY3RlZMODpHRleHSyUXVhbGl0w6kgZGUgbGEgdmllpXZhbHVlslF1YWxpdMOpIGRlIGxhIHZpZahzZWxlY3RlZMOCqmJ1dHRvbkxpc3SBp2J1dHRvbnORg6R0ZXh0skNyw6llciBsZXMgb25nbGV0c6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9usGZhcm1fY3JlYXRlX3RhYnOqcGFyYW1ldGVyc5CnYWx0VGV4dKCzaG9yaXpvbnRhbEFsaWdubWVudKNFTkQ=
 */
function syncTabsBuildCard() {
    let cardSection1TextParagraph1 = CardService.newTextParagraph()
        .setText('<b>Synchronisation vers le wiki</b>');

    let tabsToCreateSelectionInput = CardService.newSelectionInput()
        .setFieldName('TabsToCreate')
        .setTitle('Onglets à synchroniser')
        .setType(CardService.SelectionInputType.CHECK_BOX);

    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = spreadsheet.getSheets();
    sheets.forEach(function(s) {
        const sheetName = s.getName();
        switch (sheetName) {
            case 'Ferme':
            case 'Qualité de la vie':
            case 'Comptabilité':
                tabsToCreateSelectionInput.addItem(sheetName, sheetName, true)
                break;
        
            default:
                break;
        }
    });

    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('sync_tabs')
        .setParameters({});

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText('Synchroniser les onglets')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(cardSection1ButtonList1Button1Action1);

    let cardSection1ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection1ButtonList1Button1);

    let cardSection1 = CardService.newCardSection()
        .addWidget(cardSection1TextParagraph1)
        .addWidget(tabsToCreateSelectionInput)
        .addWidget(cardSection1ButtonList1);

    let card = CardService.newCardBuilder()
        .addSection(cardSection1)
        .build();

    return card;
}