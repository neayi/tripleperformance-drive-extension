class speakersModel {
    constructor() {
        this.defGeneralites = {};

        this.columns = ["Nom tel que trouvé dans l'excel", "Nom corrigé", "URL de la photo", "Photo", "Biographie", "URL bio", "Page Wiki"];
    }

    createTab(tabName) {
        if (tabName == "Intervenants") {
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
    }

    addSpeakers(speakers) {

        // Unique speakers only
        speakers = speakers.filter((value, index, array) => array.indexOf(value) === index);

        let speakerSheet = this.createTab("Intervenants");

        let existingSpeakers = speakerSheet.getDataRange().getValues().map((r) => r[0]).filter((v) => v != "");
        let newSpeakers = speakers.filter(speakername => !existingSpeakers.includes(speakername));

        newSpeakers.forEach(speaker => {
            speakerSheet.appendRow([speaker]);
        });

        return newSpeakers.length;
    }

    syncSpeakersToWiki() {
        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let speakerSheet = spreadsheet.getSheetByName("Intervenants");

        let data = speakerSheet.getDataRange();
        let startRow = data.getRow();
        const wikiPageCol = this.getColNumber("Page Wiki");

        let newPersons = 0;
        let updatedPersons = 0;
        let untouchedPersons = 0;

        let idFound = false;

        let redirectPages = new Map();
        let wiki = new wikiPage();

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0]) {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let speaker = this.getSpeakerFromRow(row);

            if (speaker.fixedName.length == 0)
                return;

            if (speaker.wikiPage.length > 0)
                return;

            if (speaker.originalName != speaker.fixedName) {
                redirectPages.set(speaker.fixedName, speaker.originalName);
                return;
            }

            let wikiTitle = this.getWikiPageForSpeaker(speaker.fixedName);
            let apiTools = getApiTools();

            if (wikiTitle) {
                // Update the page
                let pageContent = apiTools.getPageContent(wikiTitle);

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

            let content = getHyperlinkedTitle(getTriplePerformanceURL(), wikiTitle, speaker.fixedName);

            speakerSheet.getRange(rowIndex + startRow, wikiPageCol).setValue(content);
        });

        SpreadsheetApp.getUi().alert(`${newPersons} nouvelles pages, ${updatedPersons} pages contributeur mises à jour (${untouchedPersons} n'ont pas été modifiées)`);
    }

    getWikiPageForSpeaker(speakerName) {
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

    getColNumber(colname) {
        return this.columns.indexOf(colname) + 1;
    }
    
}