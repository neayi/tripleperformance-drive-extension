
function addBatchProcessingTabs() {
    let batchProcessingbatchProcessingytModel = new BatchProcessingytModel();
    batchProcessingbatchProcessingytModel.addBatchProcessingTabs();
}

function createPagesWithTemplate() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.createPagesWithTemplate();
}

function addKeywordsToPages() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.addKeywordsToPages();
}

function checkKeywordsInPages() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.checkKeywordsInPages();
}

function addCodeToPages() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.addCodeToPages();
}

function addParameterToPages() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.addParameterToPages();
}

function findPages() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.findPages();
}

function platformStatistics() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.platformStatistics();
}

function analyzeTranslations() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.analyzeTranslations();
}

function fixTranslations() {
    let batchProcessingytModel = new BatchProcessingytModel();
    batchProcessingytModel.fixTranslations();
}


function card_buildBatchProcessingCard() {

    var builder = CardService.newCardBuilder();

    // Add the parameters section
    let cardSectionBatchProcessing = CardService.newCardSection();
    cardSectionBatchProcessing.addWidget(CardService.newTextParagraph().setText('<b>Faire des traitements en lots</b>'));

    let actions = [
        {title: "Ajouter les onglets de traitement en lots", subtitle: "Ajouter les onglets", function: 'addBatchProcessingTabs'},
        {title: "Vérifier les mots-clés des pages", subtitle: "Vérifier les mots clés", function: 'checkKeywordsInPages'},
        {title: "Lancer une recherche", subtitle: "Rechercher des pages", function: 'findPages'},
        {title: "Nouvel onglet de statistiques de la plateforme", subtitle: "Calculer les statistiques", function: 'platformStatistics'},

        {title: "Découvrir les liens interlangues", subtitle: "Chercher les traductions à partir du wiki", function: 'analyzeTranslations'},
        {title: "Corriger les liens interlangues", subtitle: "Ajouter les liens manquants dans le wiki", function: 'fixTranslations'},
    ];

    actions.forEach((action) => {
        let cardaction = CardService.newAction().setFunctionName(action.function);

        cardSectionBatchProcessing.addWidget(CardService.newDecoratedText()
            .setText(action.subtitle)
            .setBottomLabel(action.title)
            .setOnClickAction(cardaction)
            .setButton(CardService.newImageButton()
                .setIcon(CardService.Icon.VIDEO_PLAY)
                .setOnClickAction(cardaction)));
    });

    builder.addSection(cardSectionBatchProcessing);

    return builder.build();
}