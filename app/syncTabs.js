
function sync_charts(e)
{
    const chartsNames = e.formInputs.TabsToCreate;
    let charts = new chartsBuilder();
    
    chartsNames.forEach((element) => {
        Logger.log(element);
        charts.syncCharts(element);
    });
}

/**
 * https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOTga10ZXh0UGFyYWdyYXBogaR0ZXh0uTxiPlBvcnRyYWl0cyBkZSBmZXJtZTwvYj6BrnNlbGVjdGlvbklucHV0hKR0eXBlqUNIRUNLX0JPWKVsYWJlbLFPbmdsZXRzIMOgIGNyw6llcqRuYW1lrFRhYnNUb0NyZWF0ZaVpdGVtc5ODpHRleHSlRmVybWWldmFsdWWlRmVybWWoc2VsZWN0ZWTDg6R0ZXh0rUNvbXB0YWJpbGl0w6mldmFsdWWtQ29tcHRhYmlsaXTDqahzZWxlY3RlZMODpHRleHSyUXVhbGl0w6kgZGUgbGEgdmllpXZhbHVlslF1YWxpdMOpIGRlIGxhIHZpZahzZWxlY3RlZMOCqmJ1dHRvbkxpc3SBp2J1dHRvbnORg6R0ZXh0skNyw6llciBsZXMgb25nbGV0c6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9usGZhcm1fY3JlYXRlX3RhYnOqcGFyYW1ldGVyc5CnYWx0VGV4dKCzaG9yaXpvbnRhbEFsaWdubWVudKNFTkQ=
 */
function syncTabsBuildCard() {
    let cardSection1TextParagraph1 = CardService.newTextParagraph()
        .setText('<b>Synchronisation vers le wiki</b>');

    const charts = new chartsBuilder();
    const chartNames = charts.findChartsOnPage();

    let title = 'Graphiques sur la page';
    let buttonCaption = 'Synchroniser le graphique';

    let tabsToCreateSelectionInput = CardService.newSelectionInput()
        .setFieldName('TabsToCreate')
        .setTitle(title)
        .setType(CardService.SelectionInputType.RADIO_BUTTON);

    let callBack = 'sync_tabs';
    if (chartNames.length > 0)
    {
        chartNames.forEach((chartName) => {
            tabsToCreateSelectionInput.addItem(chartName, chartName, true);
        });

        callBack = 'sync_charts';
    }

    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName(callBack);

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText(buttonCaption)
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