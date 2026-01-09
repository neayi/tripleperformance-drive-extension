
function addYoutubeChannelTab() {
    let ytModel = new YoutubeModel();
    ytModel.createChannelTab();
}

function addYoutubePlaylistTab() {
    let ytModel = new YoutubeModel();
    ytModel.createPlaylistTab();
}

function fetchNewVideos() {
    let ytModel = new YoutubeModel();
    ytModel.fetchVideosFromYouTube();
}

function card_buildYoutubeCard() {

    var builder = CardService.newCardBuilder();

    // Add the parameters section
    let cardSectionYoutube = CardService.newCardSection();
    cardSectionYoutube.addWidget(CardService.newTextParagraph().setText('<b>Gérer des imports Youtube</b>'));

    let actions = [
        {title: "Créer un import de chaîne", subtitle: "Import de chaîne", function: 'addYoutubeChannelTab'},
        {title: "Créer un import de playlist", subtitle: "Import de playlist", function: 'addYoutubePlaylistTab'},
        {title: "Charger les nouvelles vidéos", subtitle: "Nouvelles vidéos", function: 'fetchNewVideos'},
        {title: "Charger le détail des vidéos", subtitle: "Charger le détail", function: 'fetchVideosDetailsFromYouTubeChannel'},
        {title: "Vérifier les pages Triple Performance", subtitle: "Vérifier les pages", function: 'checkVideosFromTriplePerformance'},
        {title: "Mettre à jour la liste des intervenants", subtitle: "Intervenants", function: 'updateYoutubeSpeakersList'}
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