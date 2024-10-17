function parameters_save(e)
{
    let parameters = new tp_parameters();

    let secrets = {
        wikiURL: '',
        username: '',
        password: ''
    };

    if (e.formInputs.URL && e.formInputs.URL.length > 0)
        secrets.wikiURL = e.formInputs.URL[0];
    if (e.formInputs.username && e.formInputs.username.length > 0)
        secrets.username = e.formInputs.username[0];
    if (e.formInputs.password && e.formInputs.password.length > 0)
        secrets.password = e.formInputs.password[0];

    parameters.storeSecrets(secrets);

    if (parameters.testConnection())
    {
        alert("Les paramètres ont été enregistrés.");
        return card_buildHomepageCard();
    }
}

function parametersbuildCard() {
    let parameters = new tp_parameters();
    parameters.loadSecrets();

    const availableURLs = [
        'https://wiki.tripleperformance.fr/', 
        'https://en.tripleperformance.ag/',
        'https://de.tripleperformance.ag/',
        'https://es.tripleperformance.ag/',
        'https://fi.tripleperformance.ag/',
        'https://el.tripleperformance.ag/',
        'https://hu.tripleperformance.ag/',
        'https://it.tripleperformance.ag/',
        'https://nl.tripleperformance.ag/',
        'https://pl.tripleperformance.ag/',
        'https://pt.tripleperformance.ag/',

        'https://wiki.preprod.tripleperformance.fr/', 
        'https://en.preprod.tripleperformance.ag/',
        'https://de.preprod.tripleperformance.ag/',
        'https://es.preprod.tripleperformance.ag/',
        'https://fi.preprod.tripleperformance.ag/',
        'https://el.preprod.tripleperformance.ag/',
        'https://hu.preprod.tripleperformance.ag/',
        'https://it.preprod.tripleperformance.ag/',
        'https://nl.preprod.tripleperformance.ag/',
        'https://pl.preprod.tripleperformance.ag/',
        'https://pt.preprod.tripleperformance.ag/'
    ];

    let cardSection1TextParagraphTitle = CardService.newTextParagraph()
        .setText('<b>Paramètres</b>');

    let cardSection1TextParagraphDescription = CardService.newTextParagraph()
        .setText(`Si vous n'avez pas d'identifiants, <a href="https://neayi.com/contact/">Contactez-nous !</a>`);
    
    let cardSection1SelectionInput1 = CardService.newSelectionInput()
        .setFieldName('URL')
        .setTitle('Site Triple Performance')
        .setType(CardService.SelectionInputType.DROPDOWN);

    availableURLs.forEach((url) => {
        cardSection1SelectionInput1.addItem(url, url, url == parameters.secrets().wikiURL);
    });

    let cardSection1TextInput1 = CardService.newTextInput()
        .setFieldName('username')
        .setTitle('Nom d\'utilisateur :')
        .setHint('Utilisateur@Triple_Performance_Robot')
        .setValue(parameters.secrets().username)
        .setMultiline(false);

    let cardSection1TextInput2 = CardService.newTextInput()
        .setFieldName('password')
        .setTitle('Mot de passe')
        .setMultiline(false);
    
    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('parameters_save');

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText('Enregistrer les paramètres')
        .setOnClickAction(cardSection1ButtonList1Button1Action1);

    let cardSection1ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection1ButtonList1Button1);

    let cardSection1 = CardService.newCardSection()
        .addWidget(cardSection1TextParagraphTitle)
        .addWidget(cardSection1TextParagraphDescription)
        .addWidget(cardSection1SelectionInput1)
        .addWidget(cardSection1TextInput1)
        .addWidget(cardSection1TextInput2)
        .addWidget(cardSection1ButtonList1);

    let card = CardService.newCardBuilder()
        .addSection(cardSection1)
        .build();

    return card;
}