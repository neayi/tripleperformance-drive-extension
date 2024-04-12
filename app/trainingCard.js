
function addTrainingTab() {
    let tcModel = new TrainingCourseModel();
    tcModel.createTrainingTab();
}

function pushTrainingThumbnailsToTriplePerformance() {
    let tcModel = new TrainingCourseModel();
    tcModel.syncThumbnails();
}

function pushTrainingCoursesToTriplePerformance() {
    let tcModel = new TrainingCourseModel();
    tcModel.syncTrainings();
}

function updateTrainingSpeakersList() {
    let tcModel = new TrainingCourseModel();
    tcModel.buildSpeakersList();
}

function card_buildTrainingCourseCard() {

    var builder = CardService.newCardBuilder();

    // Add the parameters section
    let cardSectionYoutube = CardService.newCardSection();
    cardSectionYoutube.addWidget(CardService.newTextParagraph().setText('<b>Gérer des imports Youtube</b>'));

    let actions = [
        {title: "Créer les onglets pour les formations", subtitle: "Créer les onglets", function: 'addTrainingTab'},
        {title: "Pousser les vignettes vers Triple Performance", subtitle: "Pousser les vignettes", function: 'pushTrainingThumbnailsToTriplePerformance'},
        {title: "Pousser les formations vers Triple Performance", subtitle: "Pousser les formations", function: 'pushTrainingCoursesToTriplePerformance'},
        {title: "Mettre à jour la liste des intervenants", subtitle: "Intervenants", function: 'updateTrainingSpeakersList'},
        {title: "Pousser les intervenants vers Triple Performance", subtitle: "Pousser les intervenants", function: 'pushSpeakersToTriplePerformance'}
    ];

    actions.forEach((action) => {
        let cardaction = CardService.newAction().setFunctionName(action.function);

        cardSectionYoutube.addWidget(CardService.newDecoratedText()
            .setText(action.subtitle)
            .setBottomLabel(action.title)
            .setOnClickAction(cardaction)
            .setButton(CardService.newImageButton()
                .setIcon(CardService.Icon.VIDEO_PLAY)
                .setOnClickAction(cardaction)));
    });

    builder.addSection(cardSectionYoutube);

    return builder.build();
}