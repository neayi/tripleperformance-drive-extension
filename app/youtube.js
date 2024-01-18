// function onOpen(e) {
//     SpreadsheetApp.getUi()
//         .createMenu("Triple Performance")
//         .addItem("Charger les vidéos de la chaîne", "fetchVideos")
//         .addItem("Mettre à jour les descriptions des vidéso", "updateDescriptions")
//         .addSeparator()
//         .addItem("Créer une nouvelle feuille", "createNewSheet")
//         .addToUi();
// }

/**
 * Create a new spreadsheets, with all data required to import a YouTube channel:
 * 
 * The channel ID
 * The place where the youtube videos will be fetched
 */
function createYoutubeSheet()
{

}

function fetchVideos() {
    var ss = SpreadsheetApp.getActiveSheet();

    var channelId = this.getSheetsChannelID(ss);
    if (!channelId) {
        SpreadsheetApp.getUi().alert("Veuillez saisir un ID de chaîne valide");
        return;
    }

    var existingValues = ss.getRange("A4:D1000").getValues();
    var existingYouTubeIds = existingValues.map(function (r) { return r[0]; }).filter(function (v) { return v != "" });

    // Find the first empty row
    firstEmptyRow = 4;
    for (var i = 4 + existingYouTubeIds.length; i < 1000; i++) {
        if (existingValues[i][0] == "" &&
            existingValues[i][1] == "" &&
            existingValues[i][2] == "" &&
            existingValues[i][3] == "") {
            firstEmptyRow = i;
            break;
        }
    }

    ss.getRange(3, 1, 1, 4).setValues([["ID", "URL", "Titre", "Description"]]);

    var sr = YouTube.Search.list("snippet, id", { channelId: channelId, maxResults: 10 });
    // var sr = YouTube.Search.list("snippet, id", { forMine: true, type: 'video', maxResults: 10});
    var vids = sr.items.filter(function (res) { return res.id.kind === "youtube#video" });

    var data = vids.map(function (v) { return [v.id.videoId, "https://www.youtube.com/watch?v=" + v.id.videoId, v.snippet.title, v.snippet.description] });

    data = data.filter(function (video) { return existingYouTubeIds.indexOf(video[0]) == -1 });

    ss.getRange(firstEmptyRow, 1, data.length, data[0].length).setValues(data);
}


function updateDescriptions() {
    var ss = SpreadsheetApp.getActiveSheet();

    var channelId = this.getSheetsChannelID(ss);
    if (!channelId) {
        SpreadsheetApp.getUi().alert("Veuillez saisir un ID de chaîne valide");
        return;
    }

    var existingValues = ss.getRange("A4:F1000").getValues();

    existingValues = existingValues.filter(function (video) { return video[0] != "" && video[4] == "o" });

    var data = existingValues.map(function (video) { return video[0]; }).join(", ");

    SpreadsheetApp.getUi().alert("Mise à jour des ids : " + data);

    var self = this;

    existingValues.forEach(function (video) {
        self.updateVideo(video[0], video[5]);
    });

    SpreadsheetApp.getUi().alert("Vidéos mises à jour !");

}

function getSheetsChannelID(sheet) {
    var channelId = "";
    var values = sheet.getRange(1, 1, 1, 4).getValues();


    if ((values[0][0] == "Chaîne" || values[0][0] == "Chaine" || values[0][0] == "Channel")
        && values[0][2] == "Channel ID") {
        channelId = values[0][3];
    }

    if (channelId == "") {
        Logger.log(values);
        return false;
    }

    return channelId;
}

function createNewSheet() {

    ss = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
    ss.setName("Vidéos de la chaîne quelquechose");

    ss.getRange(1, 1, 1, 4).setValues([["Chaîne", "", "Channel ID", ""]]);
    ss.getRange(3, 1, 1, 4).setValues([["ID", "URL", "Titre", "Description"]]);
}

function testUpdateVideo() {
    ScriptApp.invalidateAuth();

    this.updateVideo("zM3gRFWzmIc", "La microferme du Bourbonnais recherche un équilibre entre différents écosystèmes : zones de production, prairies, insectes, ...\n\nVoir le retour d'expérience complet sur https://wiki.tripleperformance.fr/wiki/Combinaison_de_permaculture_et_de_domotique_%C3%A0_la_microferme_du_Bourbonnais")
}

function updateVideo(videoId, newDescription) {
    var videoObject = YouTube.Videos.list('snippet',
        {
            id: videoId
            // forContentOwner: true,
            // onBehalfOfContentOwner: 'UC_x5XG1OV2P6uZZ5FSM9Ttw'
        }).items[0];

    videoObject.snippet.description = newDescription;
    ScriptApp.invalidateAuth();

    YouTube.Videos.update(videoObject, "snippet");

    Logger.log(videoObject);
}
