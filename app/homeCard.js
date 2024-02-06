// called by the add on when it is opened
function card_onHomepage(event)
{
    var ui = SpreadsheetApp.getUi();

    ui.createMenu('Triple Performance')
        .addSubMenu(ui.createMenu('Formations')
            .addItem('Synchroniser les formations', 'syncTrainingCourses')
            .addItem('Synchroniser les vignettes', 'pushTrainingCoursesThumbnailsToTriplePerformance')
            .addItem('Mettre à jour la liste des intervenants', 'updateTrainingCoursesSpeakersList')
            .addItem("Pousser les intervenants vers Triple Performance", 'pushSpeakersToTriplePerformance')
        )
        .addSubMenu(ui.createMenu('YouTube')
            .addItem("Charger les nouvelles vidéos de la chaîne", 'fetchVideosFromYouTubeChannel')
            .addItem("Charger le détail des vidéos", 'fetchVideosDetailsFromYouTubeChannel')
            .addItem("Pousser les vignettes vers Triple Performance", 'pushThumbnailsToTriplePerformance')
            .addItem("Pousser les vidéos vers Triple Performance", 'pushVideosToTriplePerformance')
            .addItem("Mettre à jour la liste des intervenants", 'updateYoutubeSpeakersList')
            .addItem("Pousser les intervenants vers Triple Performance", 'pushSpeakersToTriplePerformance')
        )
        .addToUi();
    
    return card_buildHomepageCard();
}

function syncTrainingCourses() {
    Logger.log("Synchro de la liste des formations")
    let trainingModel = new TrainingCourseModel();
    trainingModel.syncTrainings();
}

function pushTrainingCoursesThumbnailsToTriplePerformance()
{
    Logger.log("pushTrainingCoursesThumbnailsToTriplePerformance")
    let trainingModel = new TrainingCourseModel();
    trainingModel.syncThumbnails();
}

function updateTrainingCoursesSpeakersList()
{
    Logger.log("updateTrainingCoursesSpeakersList")
    let trainingModel = new TrainingCourseModel();
    trainingModel.buildSpeakersList();
}

function fetchVideosFromYouTubeChannel()
{
    Logger.log("fetchVideosFromYouTubeChannel")
    let youTube = new YoutubeModel();
    youTube.fetchVideosFromYouTube();
}

function fetchVideosDetailsFromYouTubeChannel()
{
    Logger.log("fetchVideosDetailsFromYouTubeChannel")
    let youTube = new YoutubeModel();
    youTube.fetchDetailsFromYoutube();
}

function pushVideosToTriplePerformance()
{
    Logger.log("pushVideosToTriplePerformance")
    let youTube = new YoutubeModel();
    youTube.syncYoutubeToWiki();
}

function pushThumbnailsToTriplePerformance()
{
    Logger.log("pushThumbnailsToTriplePerformance")
    let youTube = new YoutubeModel();
    youTube.addThumbnailsToWiki();
}

function updateYoutubeSpeakersList() {
    Logger.log("updateYoutubeSpeakersList")
    let youTube = new YoutubeModel();
    youTube.buildSpeakersList();
}

function pushSpeakersToTriplePerformance() {
    Logger.log("pushSpeakersToTriplePerformance")
    let speakers = new speakersModel();
    speakers.syncSpeakersToWiki();
}

function showImportCard()
{
    Logger.log('showImportCard');
}

function showParametersCard()
{
    return parametersbuildCard();
}

function showSyncCard()
{
    return syncTabsBuildCard();
}

function testConnection()
{
    Logger.log('testConnection');

    let parameters = new tp_parameters();
    parameters.loadSecrets();
    if (!parameters.checkSecrets())
    {
        SpreadsheetApp.getUi().alert("Les paramètres n'ont pas été saisis...!");
        return;
    }

    let api = new MediawikiAPI(parameters.secrets.wikiURL + "/api.php", parameters.secrets.username, parameters.secrets.password);

    let logindata = api.login();
    if (!logindata.login.result || logindata.login.result != 'Success') {
      SpreadsheetApp.getUi().alert("La connexion n'a pas fonctionné...\n " + JSON.stringify(logindata, null, 3));
      return;
    }

    SpreadsheetApp.getUi().alert("La connexion fonctionne correctement.");
}

function createNewTabs(e)
{
    switch (e.parameters.tab) {
        case "Portraits de ferme":
            let farm = new FarmModel();    
            return onCreateNewTabsCard("Portraits de ferme", farm.getTabs());

        case "Liste des formations":
            let tcModel = new TrainingCourseModel();
            return onCreateNewTabsCard("Liste des formations", tcModel.getTabs());

        case "Chaîne youtube":
            let ytModel = new YoutubeModel();
            return onCreateNewTabsCard("Chaîne youtube", ytModel.getTabs());

        case "Graphiques":
            let chartModel = new chartsBuilder();
            return onCreateNewTabsCard("Graphiques", chartModel.getCharts(), "Créer des graphiques");
                
        default:
            break;
    }
}

function createFarmPortraitCreateTabsCard()
{

}

function createTrainingCoursesCreateTabsCard()
{

}

function createYoutubeCreateTabsCard()
{

}

function UnhandledEvent(call)
{
    Logger.log(call);
}

/**
 * Built with https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOZgqRncmlkhKtjb2x1bW5Db3VudAGldGl0bGWgq2JvcmRlclN0eWxlgqR0eXBlqU5PX0JPUkRFUqxjb3JuZXJSYWRpdXMApWl0ZW1zkYWlaW1hZ2WCqGltYWdlVXJp2VZodHRwczovL3dpa2kudHJpcGxlcGVyZm9ybWFuY2UuZnIvc2tpbnMvc2tpbi1uZWF5aS9mYXZpY29uL2xvZ28tdHJpcGxlLXBlcmZvcm1hbmNlLnN2Z6ljcm9wU3R5bGWCpHR5cGWwUkVDVEFOR0xFX0NVU1RPTathc3BlY3RSYXRpbwOmbGF5b3V0qlRFWFRfQkVMT1eldGl0bGWgrXRleHRBbGlnbm1lbnSlU1RBUlSoc3VidGl0bGWgs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSCrXRleHRQYXJhZ3JhcGiBpHRleHS5PGI+Q3LDqWVyIGxlcyBvbmdsZXRzPC9iPrNob3Jpem9udGFsQWxpZ25tZW50pVNUQVJUgqpidXR0b25MaXN0gadidXR0b25zk4KkdGV4dLFQb3J0cmFpdCBkZSBmZXJtZadvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSzTGlzdGUgZGUgZm9ybWF0aW9uc6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSvQ2hhw65uZSB5b3V0dWJlp29uQ2xpY2uBpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkKdjb2x1bW5zgatjb2x1bW5JdGVtc5GBp3dpZGdldHOQgadkaXZpZGVygIGtdGV4dFBhcmFncmFwaIGkdGV4dK48Yj5BY3Rpb25zPC9iPoKtZGVjb3JhdGVkVGV4dISodG9wTGFiZWygpHRleHSzVGVzdGVyIGxhIGNvbm5leGlvbqZidXR0b26DpHRleHSpRMOpbWFycmVyp29uQ2xpY2uCpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkLVvcGVuRHluYW1pY0xpbmtBY3Rpb26CqGZ1bmN0aW9urHNob3dUZXN0Q2FyZKpwYXJhbWV0ZXJzkKRpY29ugqlrbm93bkljb26qVklERU9fUExBWadhbHRUZXh02StUZXN0ZXIgbGEgY29ubmV4aW9uIGF2ZWMgVHJpcGxlIFBlcmZvcm1hbmNlq2JvdHRvbUxhYmVst1Rlc3RlciBsZXMgaWRlbnRpZmlhbnRzs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0r1N5bmNocm9uaXNlci4uLqZidXR0b26EpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26sc2hvd1N5bmNDYXJkqnBhcmFtZXRlcnOQpGljb26DqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHSsU3luY2hyb25pc2VyqWltYWdlVHlwZaZTUVVBUkWoZGlzYWJsZWTCq2JvdHRvbUxhYmVs2SRTeW5jaHJvbmlzZXIgdmVycyBUcmlwbGUgUGVyZm9ybWFuY2WBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0qEltcG9ydGVyq2JvdHRvbUxhYmVsuEltcG9ydGVyIGxlcyBkb25uw6llcy4uLqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26uc2hvd0ltcG9ydENhcmSqcGFyYW1ldGVyc5CkaWNvboKpa25vd25JY29uqlZJREVPX1BMQVmnYWx0VGV4dKZpbXBvcnSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0q1BhcmFtw6h0cmVzq2JvdHRvbUxhYmVsuFBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26yc2hvd1BhcmFtZXRlcnNDYXJkqnBhcmFtZXRlcnOQpGljb26CqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHTZIVZvaXIgbGVzIHBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbg==
 * 
 * @returns 
 */
function card_buildHomepageCard() {
    let cardSection1TriplePerformanceLogoItem1Image1CropStyle1 = CardService.newImageCropStyle()
        .setAspectRatio(4)
        .setImageCropType(CardService.ImageCropType.RECTANGLE_CUSTOM);

    let cardSection1TriplePerformanceLogoItem1Image1 = CardService.newImageComponent()
        .setImageUrl('https://neayi.com/Triple%20Performance%20by%20Neayi.png')
        .setCropStyle(cardSection1TriplePerformanceLogoItem1Image1CropStyle1);

    let cardSection1TriplePerformanceLogoItem1 = CardService.newGridItem()
        .setTextAlignment(CardService.HorizontalAlignment.START)
        .setLayout(CardService.GridItemLayout.TEXT_BELOW)
        .setImage(cardSection1TriplePerformanceLogoItem1Image1);

    let cardSection1TriplePerformanceLogoBorderStyle1 = CardService.newBorderStyle()
        .setType(CardService.BorderType.NO_BORDER)
        .setCornerRadius(0);

    let cardSection1TriplePerformanceLogo = CardService.newGrid()
        .setNumColumns(1)
        .setBorderStyle(cardSection1TriplePerformanceLogoBorderStyle1)
        .addItem(cardSection1TriplePerformanceLogoItem1);

    let cardSection1CreateTabsTitle = CardService.newTextParagraph()
        .setText('<b>Créer les onglets ou des graphiques</b>');

    let cardSection1CreateTabs = CardService.newButtonSet();
    ['Portrait de ferme', 'Graphiques', 'Liste de formations', 'Chaîne youtube'].forEach((tab) => {

        let button = CardService.newTextButton()
            .setText(tab)
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(CardService.newAction()
                .setFunctionName('createNewTabs')
                .setParameters({"tab": tab}));

        cardSection1CreateTabs.addButton(button);
    });

    let cardSection1Divider1 = CardService.newDivider();

    let cardSection1ActionsTitle = CardService.newTextParagraph()
        .setText('<b>Actions</b>');

    let cardSection1TestButton1Action1 = CardService.newAction()
        .setFunctionName('testConnection');

    let cardSection1TestButton1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('Tester la connexion avec Triple Performance')
        .setOnClickAction(cardSection1TestButton1Action1);

    let cardSection1Test = CardService.newDecoratedText()
        .setText('Tester la connexion')
        .setBottomLabel('Tester les identifiants')
        .setButton(cardSection1TestButton1);

    let cardSection1ImportButton1Action1 = CardService.newAction()
        .setFunctionName('showImportCard')
        .setParameters({});

    let cardSection1ImportButton1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('import')
        .setOnClickAction(cardSection1ImportButton1Action1);

    let cardSection1Import = CardService.newDecoratedText()
        .setText('Importer')
        .setBottomLabel('Importer les données...')
        .setButton(cardSection1ImportButton1);

    let cardSection1ParametersButton1Action1 = CardService.newAction()
        .setFunctionName('showParametersCard')
        .setParameters({});

    let cardSection1ParametersButton1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('Voir les paramètres de connexion')
        .setOnClickAction(cardSection1ParametersButton1Action1);

    let cardSection1Parameters = CardService.newDecoratedText()
        .setText('Paramètres')
        .setBottomLabel('Paramètres de connexion')
        .setButton(cardSection1ParametersButton1);

    let cardFooter1Button1Action1 = CardService.newAction()
        .setFunctionName('showSyncCard')
        .setParameters({});

    let cardFooter1Button1 = CardService.newTextButton()
        .setText('Synchroniser')
        .setBackgroundColor('#15a072')
        .setOnClickAction(cardFooter1Button1Action1);

    let cardFooter1 = CardService.newFixedFooter()
        .setPrimaryButton(cardFooter1Button1);

    let cardSection1 = CardService.newCardSection()
        .addWidget(cardSection1TriplePerformanceLogo)
        .addWidget(cardSection1CreateTabsTitle)
        .addWidget(cardSection1CreateTabs)
        .addWidget(cardSection1Divider1)
        .addWidget(cardSection1ActionsTitle)
        .addWidget(cardSection1Test)
        .addWidget(cardSection1Import)
        .addWidget(cardSection1Parameters);

    let card = CardService.newCardBuilder()
        .setFixedFooter(cardFooter1)
        .addSection(cardSection1)
        .build();

    return card;
}