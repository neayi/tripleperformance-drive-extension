class speakersModel {
    constructor() {
        this.startTime = new Date();

        this.columns = ["Nom tel que trouvé dans l'excel", "Nom corrigé", "URL de la photo", "Photo",
                        "Biographie", "URL bio", "Page Wiki", "Date de création"];
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

        // Unique speakers only
        speakers = speakers.filter((value, index, array) => array.indexOf(value) === index);

        let speakerSheet = this.createTab();

        let existingSpeakers = speakerSheet.getDataRange().getValues().map((r) => r[0]).filter((v) => v != "");
        let newSpeakers = speakers.filter(speakername => !existingSpeakers.includes(speakername));

        newSpeakers.forEach(speaker => {
            speakerSheet.appendRow([speaker]);
        });

        return newSpeakers.length;
    }

    pushSpeakersToWiki() {
        Logger.log('pushYoutubePagesToWiki');

        // Remove any existing trigger first
        removeTrigger();

        onPushSpeakerPagesToWiki();
    }

    pushSpeakersToWikiPrivate() {
        let speakerSheet = this.createTab();

        let data = speakerSheet.getDataRange();
        let startRow = data.getRow();
        const wikiPageCol = this.getColNumber("Page Wiki");
        const photoPageCol = this.getColNumber("Photo");

        let newPersons = 0;
        let updatedPersons = 0;
        let untouchedPersons = 0;

        let idFound = false;

        let redirectPages = new Map();
        let wiki = new wikiPage();
        const self = this;
        const tripleperformanceURL = getTriplePerformanceURL();

        data.getValues().forEach((row, rowIndex) => {
            self.checkTime();

            if (!idFound && row[0] == this.columns[0]) {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let speaker = self.getSpeakerFromRow(row);

            if (speaker.fixedName.length == 0)
                return;

            if (speaker.wikiPage.length > 0)
                return;

            if (speaker.originalName != speaker.fixedName) {
                redirectPages.set(speaker.fixedName, speaker.originalName);
                return;
            }

            if (speaker.photoURL.length > 0 && speaker.photoPage.length == 0)
            {
                speaker.photoPage = self.pushSpeakerPhoto(speaker.fixedName, speaker.photoURL);

                let content = getHyperlinkedTitle(tripleperformanceURL, speaker.photoPage, speaker.photoPage);
                speakerSheet.getRange(rowIndex + startRow, photoPageCol).setValue(content);
                SpreadsheetApp.flush();
            }

            let wikiTitle = self.findWikiPageForSpeaker(speaker.fixedName);
            self.checkTime();

            let apiTools = getApiTools();

            if (wikiTitle) {
                // Update the page
                let pageContent = apiTools.getPageContent(wikiTitle);

                self.checkTime();

                if (!wiki.hasTemplate(pageContent, "Contributeur") &&
                    !wiki.hasTemplate(pageContent, "Intervenant")) {
                    throw new Error("La page " + wikiTitle + " a été trouvée pour l'utilisateur "
                        + speaker.fixedName + " mais elle ne contient pas la template Contributeur !");
                }

                let newPageContent = pageContent;

                if (wiki.hasTemplate(pageContent, "Contributeur"))
                {
                    let params = new Map();
                    if (speaker.biography.length > 0)
                        params.set('Biographie', speaker.biography);
                    if (speaker.biographyURL.length > 0)
                        params.set('URL', speaker.biographyURL);
                    if (speaker.photoPage.length > 0)
                        params.set('Photo', speaker.fixedName + ".jpg");

                    newPageContent = wiki.updateTemplate("Contributeur", params, pageContent);
                }
                else
                {
                    let newArgs = new Map();
                    
                    // Only update the fields that are set here
                    newArgs.set('nom', 'Nom = ' + speaker.fixedName);
                    if (speaker.biography.length > 0)
                        newArgs.set('biographie', 'Biographie = ' +  speaker.biography);
                    if (speaker.biographyURL.length > 0)
                        newArgs.set('url', 'URL = ' +  speaker.biographyURL);
                    if (speaker.photoPage.length > 0)
                        newArgs.set('photo', 'Photo = ' +  speaker.fixedName + ".jpg");

                    newPageContent = wiki.replaceTemplate("Intervenant", "Contributeur", newArgs, pageContent);
                }

                if (newPageContent == pageContent)
                    untouchedPersons++
                else {
                    apiTools.updateWikiPage(wikiTitle, newPageContent, "Mise à jour des données de la personne");
                    updatedPersons++;
                }
            }
            else {
                wikiTitle = "User:" + speaker.fixedName;

                let params = new Map();
                params.set('Nom', speaker.fixedName);
                if (speaker.biography.length > 0)
                    params.set('Biographie', speaker.biography);
                if (speaker.biographyURL.length > 0)
                    params.set('URL', speaker.biographyURL);
                if (speaker.photoPage.length > 0)
                    params.set('Photo', speaker.fixedName + ".jpg");

                let pageContent = "";
                pageContent = wiki.updateTemplate("Contributeur", params, pageContent);

                apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
                newPersons++;
            }

            let content = getHyperlinkedTitle(tripleperformanceURL, wikiTitle, speaker.fixedName);

            speakerSheet.getRange(rowIndex + startRow, wikiPageCol, 1, 2).setValues([[content, new Date()]]);
        });

        return [newPersons, updatedPersons, untouchedPersons];
    }

    findWikiPageForSpeaker(speakerName) {
        let apiTools = getApiTools();

        let pages = apiTools.getPagesWithForSemanticQuery("[[A un type de page::Personne]][[A un nom::" + speakerName + "]]");
        if (pages.length > 0)
            return pages[0];

        return null;
    }

    getSpeakerFromRow(row) {
        let speaker = {};
        let [originalName, fixedName, photoURL, photoPage, biography, biographyURL, wikiPage, ...others] = row;

        speaker.originalName = originalName;
        speaker.fixedName = fixedName;
        speaker.photoURL = photoURL;
        speaker.photoPage = photoPage;
        speaker.biography = biography;
        speaker.biographyURL = biographyURL;
        speaker.wikiPage = wikiPage;

        return speaker;
    }

    getAllSpeakersFromWiki() {
        let apiTools = getApiTools();

        Logger.log("getAllSpeakersFromWiki");
        let speakers = apiTools.getSemanticValuesWithForSemanticQuery(
            "[[A un type de page::Personne]]", 
            ['A un nom', 'Biographie', 'A une photo']);

        Logger.log("Got " + speakers.length + " speakers on Triple Performance");

        // A une photo :
        // {
        //     exists=1,
        //     namespace=6.0,
        //     fullurl=//wiki.tripleperformance.fr/wiki/Fichier:Ana%C3%AFs_Brucelle.jpg, 
        //     displaytitle=, 
        //     fulltext=Fichier:Anaïs Brucelle.jpg
        // }

        let speakerSheet = this.createTab();

        let existingSpeakers = speakerSheet.getDataRange().getValues().map((r) => r[0]).filter((v) => v != "");

        Logger.log("Had already " + existingSpeakers.length + " existing speakers");
        const triplePerformanceURL = getTriplePerformanceURL();

        let newSpeakers = speakers.filter(speaker => !existingSpeakers.includes(speaker[1])).map(speaker => {
            let photo = "";
            if (speaker[3] != "")
                photo = getHyperlinkedTitle(triplePerformanceURL, speaker[3].fulltext, speaker[3].fulltext);

            return [speaker[1], speaker[1], "", photo, speaker[2], "", getHyperlinkedTitle(triplePerformanceURL, speaker[0], speaker[1])]
        });

        Logger.log("Now insert the list of the  " + newSpeakers.length + " speakers");

        if (newSpeakers.length == 0)
            return;

        const insertRow = speakerSheet.getLastRow() + 1;
        speakerSheet.getRange(insertRow, 1, newSpeakers.length, 7).setValues(newSpeakers);
    }

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
    
    checkTime() {
        Logger.log("checkTime " + this.startTime + new Date());
        if (new Date().getTime() - this.startTime.getTime() > 40000) // 45 seconds from start of the script
            throw("time up");
    }
}