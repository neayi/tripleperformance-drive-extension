function parameters_save(e)
{
    let parameters = new tp_parameters();

    let secrets = {
        wikiURL: e.formInputs.URL[0],
        username: e.formInputs.username[0],
        password: e.formInputs.password[0]
    };

    parameters.storeSecrets(secrets);

    SpreadsheetApp.getUi().alert("Les paramètres ont été enregistrés.");
}

function parametersbuildCard() {
    let parameters = new tp_parameters();
    parameters.loadSecrets();

    const availableURLs = [
        'https://wiki.tripleperformance.fr/', 
        'https://en.tripleperformance.ag/'
    ];

    let cardSection1TextParagraph1 = CardService.newTextParagraph()
        .setText('<b>Paramètres</b>');

    let cardSection1SelectionInput1 = CardService.newSelectionInput()
        .setFieldName('URL')
        .setTitle('Site Triple Performance')
        .setType(CardService.SelectionInputType.DROPDOWN);

    availableURLs.forEach((url) => {
        cardSection1SelectionInput1.addItem(url, url, url == parameters.secrets.wikiURL);
    });

    let cardSection1TextInput1 = CardService.newTextInput()
        .setFieldName('username')
        .setTitle('Nom d\'utilisateur :')
        .setHint('Utilisateur@Triple_Performance_Robot')
        .setValue(parameters.secrets.username)
        .setMultiline(false);

    let cardSection1TextInput2 = CardService.newTextInput()
        .setFieldName('password')
        .setTitle('Mot de passe')
        .setMultiline(false);
    
    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('parameters_save')
        .setParameters({});

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText('Enregistrer les paramètres')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(cardSection1ButtonList1Button1Action1);

    let cardSection1ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection1ButtonList1Button1);

    let cardSection1 = CardService.newCardSection()
        .addWidget(cardSection1TextParagraph1)
        .addWidget(cardSection1SelectionInput1)
        .addWidget(cardSection1TextInput1)
        .addWidget(cardSection1TextInput2)
        .addWidget(cardSection1ButtonList1);

    let card = CardService.newCardBuilder()
        .addSection(cardSection1)
        .build();

    return card;
}