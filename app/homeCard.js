// called by the add on when it is opened
function card_onHomepage(event) {
    var ui = SpreadsheetApp.getUi();

    try {
        ui.createAddonMenu()
        .addSubMenu(ui.createMenu('Formations')
            .addItem('Synchroniser les formations', 'syncTrainingCourses')
            .addItem('Synchroniser les vignettes', 'pushTrainingCoursesThumbnailsToTriplePerformance')
            .addItem('Mettre à jour la liste des intervenants', 'updateTrainingCoursesSpeakersList')
            .addItem("Pousser les intervenants vers Triple Performance", 'pushSpeakersToTriplePerformance')
        )
        .addSubMenu(ui.createMenu('YouTube')
            .addItem("Charger les nouvelles vidéos de la chaîne", 'fetchVideosFromYouTubeChannel')
            .addItem("Charger le détail des vidéos", 'fetchVideosDetailsFromYouTubeChannel')
            .addItem("Vérifier les pages Triple Performance", 'checkVideosFromTriplePerformance')
            .addItem("Pousser les vignettes vers Triple Performance", 'pushThumbnailsToTriplePerformance')
            .addItem("Pousser les vidéos vers Triple Performance", 'pushVideosToTriplePerformance')
            .addItem("Mettre à jour la liste des intervenants", 'updateYoutubeSpeakersList')
            .addItem("Pousser les intervenants vers Triple Performance", 'pushSpeakersToTriplePerformance')
            .addItem("Récupérer la langue des vidéos", 'fetchVideosLanguage')
        )
        .addSubMenu(ui.createMenu('Traitements en lots')
            .addItem("Créer des pages avec une template", 'createPagesWithTemplate')
            .addItem("Ajouter des mots-clés aux pages", 'addKeywordsToPages')
            .addItem("Ajouter du code en bas des pages", 'addCodeToPages')
        )
        .addToUi();        
    } catch (error) {
        Logger.log(error); 
    }
    
    return card_buildHomepageCard();
}

function syncTrainingCourses() {
    Logger.log("Synchro de la liste des formations")
    let trainingModel = new TrainingCourseModel();
    trainingModel.syncTrainings();
}

function pushTrainingCoursesThumbnailsToTriplePerformance() {
    Logger.log("pushTrainingCoursesThumbnailsToTriplePerformance")
    let trainingModel = new TrainingCourseModel();
    trainingModel.syncThumbnails();
}

function updateTrainingCoursesSpeakersList() {
    Logger.log("updateTrainingCoursesSpeakersList")
    let trainingModel = new TrainingCourseModel();
    trainingModel.buildSpeakersList();
}

function fetchVideosFromYouTubeChannel() {
    Logger.log("fetchVideosFromYouTubeChannel")
    let youTube = new YoutubeModel();
    youTube.fetchVideosFromYouTube();
}

function fetchVideosDetailsFromYouTubeChannel() {
    Logger.log("fetchVideosDetailsFromYouTubeChannel")
    let youTube = new YoutubeModel();
    youTube.fetchDetailsFromYoutube(800);
}

function checkVideosFromTriplePerformance() {
    Logger.log("checkVideosFromTriplePerformance")
    let youTube = new YoutubeModel();
    youTube.checkVideosFromTriplePerformance();
}

function pushVideosToTriplePerformance() {
    Logger.log("pushVideosToTriplePerformance")
    let youTube = new YoutubeModel();
    youTube.pushYoutubePagesToWiki();
}

function pushThumbnailsToTriplePerformance() {
    Logger.log("pushThumbnailsToTriplePerformance")
    let youTube = new YoutubeModel();
    youTube.pushThumbnailsToWiki();
}

function updateYoutubeSpeakersList() {
    Logger.log("updateYoutubeSpeakersList")
    let youTube = new YoutubeModel();
    youTube.buildSpeakersList();
}

function fetchVideosLanguage() {
    Logger.log("fetchVideosLanguage")
    let youTube = new YoutubeModel();
    youTube.fetchVideosLanguage();
}

function pushSpeakersToTriplePerformance() {
    Logger.log("pushSpeakersToTriplePerformance")
    let speakers = new speakersModel();
    speakers.pushSpeakersToWiki();
}

function showImportCard() {
    Logger.log('showImportCard');
}

function showParametersCard() {
    return parametersbuildCard();
}

function showSyncCard() {
    return syncTabsBuildCard();
}

function testConnection() {
    Logger.log('testConnection');

    let parameters = new tp_parameters();
    if (parameters.testConnection())
        alert("La connexion fonctionne correctement.");
}

function goToSpecialTabs(e) {
    switch (e.parameters.tab) {
        case "Gestion de formations":
            return card_buildTrainingCourseCard();

        case "Import YouTube":
            return card_buildYoutubeCard();

        case "Traitements en lots":
            return card_buildBatchProcessingCard();

        default:
            Logger.log("Unknown special tab " + e.parameters.tab);
            break;
    }
}

function createChart(e) {
    const chartsModel = new chartsBuilder();
    let chartName = e.parameters.grid_item_identifier;
    if (!chartName)
        chartName = e.parameters.chart;

    chartsModel.createChart(chartName);
}

function createFarmPortraitCreateTabsCard() {

}

function createTrainingCoursesCreateTabsCard() {

}

function createYoutubeCreateTabsCard() {

}

function UnhandledEvent(call) {
    Logger.log(call);
}

/**
 * Built with https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOZgqRncmlkhKtjb2x1bW5Db3VudAGldGl0bGWgq2JvcmRlclN0eWxlgqR0eXBlqU5PX0JPUkRFUqxjb3JuZXJSYWRpdXMApWl0ZW1zkYWlaW1hZ2WCqGltYWdlVXJp2VZodHRwczovL3dpa2kudHJpcGxlcGVyZm9ybWFuY2UuZnIvc2tpbnMvc2tpbi1uZWF5aS9mYXZpY29uL2xvZ28tdHJpcGxlLXBlcmZvcm1hbmNlLnN2Z6ljcm9wU3R5bGWCpHR5cGWwUkVDVEFOR0xFX0NVU1RPTathc3BlY3RSYXRpbwOmbGF5b3V0qlRFWFRfQkVMT1eldGl0bGWgrXRleHRBbGlnbm1lbnSlU1RBUlSoc3VidGl0bGWgs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSCrXRleHRQYXJhZ3JhcGiBpHRleHS5PGI+Q3LDqWVyIGxlcyBvbmdsZXRzPC9iPrNob3Jpem9udGFsQWxpZ25tZW50pVNUQVJUgqpidXR0b25MaXN0gadidXR0b25zk4KkdGV4dLFQb3J0cmFpdCBkZSBmZXJtZadvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSzTGlzdGUgZGUgZm9ybWF0aW9uc6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSvQ2hhw65uZSB5b3V0dWJlp29uQ2xpY2uBpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkKdjb2x1bW5zgatjb2x1bW5JdGVtc5GBp3dpZGdldHOQgadkaXZpZGVygIGtdGV4dFBhcmFncmFwaIGkdGV4dK48Yj5BY3Rpb25zPC9iPoKtZGVjb3JhdGVkVGV4dISodG9wTGFiZWygpHRleHSzVGVzdGVyIGxhIGNvbm5leGlvbqZidXR0b26DpHRleHSpRMOpbWFycmVyp29uQ2xpY2uCpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkLVvcGVuRHluYW1pY0xpbmtBY3Rpb26CqGZ1bmN0aW9urHNob3dUZXN0Q2FyZKpwYXJhbWV0ZXJzkKRpY29ugqlrbm93bkljb26qVklERU9fUExBWadhbHRUZXh02StUZXN0ZXIgbGEgY29ubmV4aW9uIGF2ZWMgVHJpcGxlIFBlcmZvcm1hbmNlq2JvdHRvbUxhYmVst1Rlc3RlciBsZXMgaWRlbnRpZmlhbnRzs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0r1N5bmNocm9uaXNlci4uLqZidXR0b26EpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26sc2hvd1N5bmNDYXJkqnBhcmFtZXRlcnOQpGljb26DqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHSsU3luY2hyb25pc2VyqWltYWdlVHlwZaZTUVVBUkWoZGlzYWJsZWTCq2JvdHRvbUxhYmVs2SRTeW5jaHJvbmlzZXIgdmVycyBUcmlwbGUgUGVyZm9ybWFuY2WBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0qEltcG9ydGVyq2JvdHRvbUxhYmVsuEltcG9ydGVyIGxlcyBkb25uw6llcy4uLqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26uc2hvd0ltcG9ydENhcmSqcGFyYW1ldGVyc5CkaWNvboKpa25vd25JY29uqlZJREVPX1BMQVmnYWx0VGV4dKZpbXBvcnSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0q1BhcmFtw6h0cmVzq2JvdHRvbUxhYmVsuFBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26yc2hvd1BhcmFtZXRlcnNDYXJkqnBhcmFtZXRlcnOQpGljb26CqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHTZIVZvaXIgbGVzIHBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbg==
 * 
 * @returns 
 */
function card_buildHomepageCard() {

    var builder = CardService.newCardBuilder();

    builder.setFixedFooter(CardService.newFixedFooter()
        .setPrimaryButton(CardService.newTextButton()
            .setText('Synchroniser la page')
            .setBackgroundColor('#15a072')
            .setOnClickAction(CardService.newAction()
                .setFunctionName('showSyncCard'))));

    let cardSectionHeader = CardService.newCardSection();

    cardSectionHeader.addWidget(CardService.newGrid()
        .setNumColumns(1)
        .setBorderStyle(CardService.newBorderStyle()
            .setType(CardService.BorderType.NO_BORDER)
            .setCornerRadius(0))
        .addItem(CardService.newGridItem()
            .setTextAlignment(CardService.HorizontalAlignment.START)
            .setLayout(CardService.GridItemLayout.TEXT_BELOW)
            .setImage(CardService.newImageComponent()
                .setImageUrl('https://neayi.com/Triple%20Performance%20by%20Neayi.png')
                .setCropStyle(CardService.newImageCropStyle()
                    .setAspectRatio(4)
                    .setImageCropType(CardService.ImageCropType.RECTANGLE_CUSTOM)))));

    // Add the grid with all the available charts
    cardSectionHeader.addWidget(CardService.newTextParagraph().setText('<b>Ajouter un graphique à la page</b>'));
    let chartsGrid = CardService.newGrid()
        .setNumColumns(2)
        .setBorderStyle(CardService.newBorderStyle()
            .setType(CardService.BorderType.STROKE)
            .setStrokeColor('#e0e0e0')
            .setCornerRadius(4))
        .setOnClickAction(CardService.newAction().setFunctionName('createChart'));

    let chartModel = new chartsBuilder();
    chartModel.getCharts().forEach((chart) => {
        chartsGrid.addItem(CardService.newGridItem()
            .setSubtitle(chart.name)
            .setIdentifier(chart.name)
            .setTextAlignment(CardService.HorizontalAlignment.START)
            .setLayout(CardService.GridItemLayout.TEXT_BELOW)
            .setImage(CardService.newImageComponent().setImageUrl(chart.image)));
    });

    cardSectionHeader.addWidget(chartsGrid);
    builder.addSection(cardSectionHeader);

    // Add the link to the other Cards
    let cardSectionOthePages = CardService.newCardSection();
    cardSectionOthePages.addWidget(CardService.newTextParagraph().setText("<b>Gérer d'autres types de données</b>"));
    let buttonSet = CardService.newButtonSet();
    [
     'Gestion de formations',
     'Import YouTube',
     'Traitements en lots'
    ].forEach((tab) => {
        buttonSet.addButton(CardService.newTextButton()
            .setText(tab)
            .setOnClickAction(CardService.newAction()
                .setFunctionName('goToSpecialTabs')
                .setParameters({ "tab": tab })));
    });
    cardSectionOthePages.addWidget(buttonSet);
    builder.addSection(cardSectionOthePages);

    // Add the parameters section
    let cardSectionParams = CardService.newCardSection();
    cardSectionParams.addWidget(CardService.newTextParagraph().setText('<b>Paramètres</b>'));

    let actions = [
        {title: "Paramètres de connexion", subtitle: "Paramètres", function: 'showParametersCard'},
        {title: "Tester les identifiants", subtitle: "Tester la connexion", function: 'testConnection'}
    ];

    actions.forEach((action) => {
        let cardaction = CardService.newAction().setFunctionName(action.function);

        cardSectionParams.addWidget(CardService.newDecoratedText()
            .setText(action.subtitle)
            .setBottomLabel(action.title)
            .setOnClickAction(cardaction)
            .setButton(CardService.newImageButton()
                .setIcon(CardService.Icon.VIDEO_PLAY)
                .setOnClickAction(cardaction)));
    });

    builder.addSection(cardSectionParams);


    return builder.build();
}