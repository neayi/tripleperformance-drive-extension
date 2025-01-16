class speakersModel {
    constructor() {
        this.startTime = new Date();
        this.columns = ['Page Triple Performance', 'Nom', 'Photo', 'Biographie', 'URL Société', 'URL Nouvelle photo', "Mise à jour ('o')", "Date de mise à jour"];
    }

    createTab() {
        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let speakerSheet = spreadsheet.getSheetByName("Intervenants");
        if (!speakerSheet) {
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

    addSpeakers(speakers) {

        // // Unique speakers only
        // speakers = speakers.filter((value, index, array) => array.indexOf(value) === index);

        // let speakerSheet = this.createTab();

        // let existingSpeakers = speakerSheet.getDataRange().getValues().map((r) => r[0]).filter((v) => v != "");
        // let newSpeakers = speakers.filter(speakername => !existingSpeakers.includes(speakername));

        // newSpeakers.forEach(speaker => {
        //     speakerSheet.appendRow([speaker]);
        // });

        // return newSpeakers.length;
    }

    pushSpeakersToWiki() {
        Logger.log('pushSpeakersToWiki');

        let speakerSheet = SpreadsheetApp.getActiveSheet();

        let data = speakerSheet.getDataRange();
        let startRow = data.getRow();

        const photoPageCol = this.getColNumber("Photo");
        const photoURLCol = this.getColNumber("URL Nouvelle photo");
        const wikiPageUpdateTimeCol = this.getColNumber("Mise à jour ('o')");

        let newPersons = 0;
        let updatedPersons = 0;
        let untouchedPersons = 0;

        let idFound = false;

        let redirectPages = new Map();
        let wiki = new wikiPage();
        const self = this;
        const tripleperformanceURL = getTriplePerformanceURL();

        data.getValues().forEach((row, rowIndex) => {

            if (!idFound && row[0] == this.columns[0]) {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let speaker = self.getSpeakerFromRow(row);

            if (speaker.name.length == 0 ||
                speaker.wikiPage.length == 0 ||
                speaker.update != 'o')
                return;

            console.log("Starting process of updating speaker " + speaker.name);

            if (speaker.nameFromWikiPageName != speaker.name) {
                let newWikiPageName = 'User:' + speaker.name;
                redirectPages.set(speaker.wikiPage, newWikiPageName);
                speaker.wikiPage = newWikiPageName;
            }

            if (speaker.newPhotoURL.length > 0)
            {
                speaker.photoPage = self.pushSpeakerPhoto(speaker.name, speaker.newPhotoURL);

                let content = getHyperlinkedTitle(tripleperformanceURL, speaker.photoPage, speaker.photoPage);
                speakerSheet.getRange(rowIndex + startRow, photoPageCol).setValue(content);
                speakerSheet.getRange(rowIndex + startRow, photoURLCol).setValue('');
                SpreadsheetApp.flush();
            }

            let apiTools = getApiTools();

            // Update the page
            let pageContent = apiTools.getPageContent(speaker.wikiPage);

            let newPageContent = pageContent;

            if (wiki.hasTemplate(pageContent, "Contributeur"))
            {
                let params = new Map();
                if (speaker.name.length > 0)
                    params.set('Nom', speaker.name);
                if (speaker.biography.length > 0)
                    params.set('Biographie', speaker.biography);
                if (speaker.biographyURL.length > 0)
                    params.set('URL', speaker.biographyURL);
                if (speaker.photoPage.length > 0)
                    params.set('Photo', speaker.fixedName + ".jpg");

                newPageContent = wiki.updateTemplate("Contributeur", params, pageContent);
                console.log("Updating template for " + speaker.name);
            }
            else
            {
                let newArgs = new Map();

                // Only update the fields that are set here
                newArgs.set('nom', 'Nom = ' + speaker.name);
                if (speaker.biography.length > 0)
                    newArgs.set('biographie', 'Biographie = ' +  speaker.biography);
                if (speaker.biographyURL.length > 0)
                    newArgs.set('url', 'URL = ' +  speaker.biographyURL);
                if (speaker.photoPage.length > 0)
                    newArgs.set('photo', 'Photo = ' +  speaker.fixedName + ".jpg");

                newPageContent = wiki.buildTemplateFromMap("Contributeur", newArgs);
                console.log("Creating template for " + speaker.name);
            }

            if (newPageContent == pageContent)
                untouchedPersons++
            else {
                if (pageContent === false)
                    apiTools.createWikiPage(speaker.wikiPage, newPageContent, "Création d'une page pour la personne'");
                else
                    apiTools.updateWikiPage(speaker.wikiPage, newPageContent, "Mise à jour des données de la personne");

                console.log("Saving page for " + speaker.name);
                updatedPersons++;
            }

        // }
        //     else {
        //         wikiTitle = "User:" + speaker.fixedName;

        //         let params = new Map();
        //         params.set('Nom', speaker.fixedName);
        //         if (speaker.biography.length > 0)
        //             params.set('Biographie', speaker.biography);
        //         if (speaker.biographyURL.length > 0)
        //             params.set('URL', speaker.biographyURL);
        //         if (speaker.photoPage.length > 0)
        //             params.set('Photo', speaker.fixedName + ".jpg");

        //         let pageContent = "";
        //         pageContent = wiki.updateTemplate("Contributeur", params, pageContent);

        //         apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
        //         newPersons++;
        //     }

            speakerSheet.getRange(rowIndex + startRow, wikiPageUpdateTimeCol, 1, 2).setValues([['', new Date()]]);
        });

        redirectPages.forEach((properPage, badPage) => {
            let apiTools = getApiTools();
            apiTools.createWikiPage(badPage, "#Redirect [["+properPage+"]]", "Création d'une redirection vers le nom bien orthographié'");
            console.log("Created a redirect from " + badPage + " to " + properPage);
        });

        return [newPersons, updatedPersons, untouchedPersons];
    }

    // findWikiPageForSpeaker(speakerName) {
    //     let apiTools = getApiTools();

    //     let pages = apiTools.getPagesWithForSemanticQuery("[[A un type de page::Personne]][[A un nom::" + speakerName + "]]");
    //     if (pages.length > 0)
    //         return pages[0];

    //     return null;
    // }


    pushSpeakerPhoto(fixedName, photoURL) {
        let apiTools = getApiTools();

        const destName = fixedName + '.jpg';
        let comment = `Image accompagnant la biographie de [[User:${fixedName} | ${fixedName}]]`;

        Logger.log("Pushing photo for  " + fixedName);
        let ret = apiTools.uploadImage(photoURL, destName, comment);

        return 'File:' + destName;
    }

    getColNumber(colname) {
        return this.columns.indexOf(colname) + 1;
    }

    buildContributorsSheet() {
        Logger.log('buildContributorsSheet');

        // Adds a new sheet
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();

        let apiTools = getApiTools();

        // Loads all the users, including missing
        // [[-Contributeur::+]] OR [[-A comme agriculteur::+]] OR [[-A un auteur::+]] OR [[-Page author::+]]
        let allUsers = apiTools.getSemanticValuesWithForSemanticQuery('[[-Contributeur::+]] OR [[-A comme agriculteur::+]] OR [[-A un auteur::+]] OR [[-Page author::+]]', ['A un nom', 'A une photo', 'Biographie', 'A une URL']);

        let data = [];
        data.push(this.columns);


        allUsers.forEach(aUser => {
            let currentUserName = aUser[1];
            if (currentUserName.length == 0) {
                currentUserName = aUser[0].replace(/^[^:]+:/, '').replace(/ \([0-9]+\)$/, '');
            }

            data.push([
                getHyperlinkedTitle(getTriplePerformanceURL(), aUser[0]),
                currentUserName,
                aUser[2].length > 0 ? getHyperlinkedTitle(getTriplePerformanceURL(), aUser[2]) : '',
                aUser[3],
                aUser[4],
                '',
                aUser[1].length > 0 ? '' : 'o',
                ''
            ]);
        });

        // Now show the list, with a final colum for updating or creating the row
        // By default, the missing users will have the 'c' flag
        sheet.getRange(1, 1, data.length, data[0].length).setValues(data)
        sheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
        let range = sheet.getRange(2, 7, sheet.getMaxRows() - 1, 1);
        setConditionalFormatingYN(range);

        sheet.setFrozenRows(1);
    }

    getSpeakerFromRow(row) {
        let speaker = {};
        let [wikiPage, name, photoPage, biography, biographyURL, newPhotoURL, update, ...others] = row;

        speaker.wikiPage = wikiPage;
        speaker.name = name;
        speaker.nameFromWikiPageName = wikiPage.replace(/^[^:]+:/, '');
        speaker.photoPage = photoPage;
        speaker.biography = biography;
        speaker.biographyURL = biographyURL;
        speaker.newPhotoURL = newPhotoURL;
        speaker.update = update;

        return speaker;
    }
}
