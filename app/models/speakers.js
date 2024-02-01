class speakersModel {
    constructor() {
        this.apiTools = false;
        this.tripleperformanceURL = "";

        this.defGeneralites = {};

        this.columns = ["Nom tel que trouvé dans l'excel", "Nom corrigé", "URL de la photo", "Photo", "Biographie", "URL bio", "Page Wiki"];
    }

    createTab(tabName)
    {
        if (tabName == "Intervenants")
        {
            let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
            let speakerSheet = spreadsheet.getSheetByName("Intervenants");
            if (!speakerSheet)
            {
                speakerSheet = spreadsheet.insertSheet("Intervenants");

                // Now prepare the sheet for more logging:
                // Add the header row, put it in bold
                speakerSheet.getRange(1, 1, 1, this.columns.length)
                    .setValues([this.columns])
                    .setFontWeight("bold");

                speakerSheet.setFrozenRows(1);
            }

            return speakerSheet;
        }
    }

    addSpeakers(speakers) {
        
        // Unique speakers only
        speakers = speakers.filter((value, index, array) => array.indexOf(value) === index);

        Logger.log("Intervenants dans les vidéos");
        Logger.log(speakers);

        let speakerSheet = this.createTab("Intervenants");

        let existingSpeakers = speakerSheet.getDataRange().getValues().map((r) => r[0] ).filter((v) => v != "" );
        Logger.log("Intervenants préexistants");
        Logger.log(existingSpeakers);

        let newSpeakers = speakers.filter(speakername => !existingSpeakers.includes(speakername));

        Logger.log("Nouveaux intervenants");
        Logger.log(newSpeakers);

        newSpeakers.forEach(speaker => {
            speakerSheet.appendRow([speaker]);
        });

        return newSpeakers.length;
    }
}