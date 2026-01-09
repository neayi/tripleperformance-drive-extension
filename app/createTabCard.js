
function onCreateTabSubmit(e)
{
    const tabsNames = e.formInputs.TabsToCreate;

    tabsNames.forEach((element) => {
        let farm = new FarmModel();
        if (farm.createTab(element))
            return;

        let chartsModel = new chartsBuilder();
        if (chartsModel.createChart(element))
            return;
    
        Logger.log("Unknown tab");
    });
}

/**
 * https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOTga10ZXh0UGFyYWdyYXBogaR0ZXh0uTxiPlBvcnRyYWl0cyBkZSBmZXJtZTwvYj6BrnNlbGVjdGlvbklucHV0hKR0eXBlqUNIRUNLX0JPWKVsYWJlbLFPbmdsZXRzIMOgIGNyw6llcqRuYW1lrFRhYnNUb0NyZWF0ZaVpdGVtc5ODpHRleHSlRmVybWWldmFsdWWlRmVybWWoc2VsZWN0ZWTDg6R0ZXh0rUNvbXB0YWJpbGl0w6mldmFsdWWtQ29tcHRhYmlsaXTDqahzZWxlY3RlZMODpHRleHSyUXVhbGl0w6kgZGUgbGEgdmllpXZhbHVlslF1YWxpdMOpIGRlIGxhIHZpZahzZWxlY3RlZMOCqmJ1dHRvbkxpc3SBp2J1dHRvbnORg6R0ZXh0skNyw6llciBsZXMgb25nbGV0c6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9usGZhcm1fY3JlYXRlX3RhYnOqcGFyYW1ldGVyc5CnYWx0VGV4dKCzaG9yaXpvbnRhbEFsaWdubWVudKNFTkQ=
 */
function onCreateNewTabsCard(title, tabs, actionName = 'Créer les onglets') {
    let cardSection1TextParagraph1 = CardService.newTextParagraph()
        .setText('<b>' + title + '</b>');

    let tabsToCreateSelectionInput = CardService.newSelectionInput()
        .setFieldName('TabsToCreate')
        .setTitle('Onglets à créer')
        .setType(CardService.SelectionInputType.CHECK_BOX);

    tabs.forEach((tabname) => {tabsToCreateSelectionInput.addItem(tabname, tabname, true)});

    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('onCreateTabSubmit')
        .setParameters({});

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText(actionName)
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