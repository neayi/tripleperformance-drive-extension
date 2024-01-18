
function syncTrainings() {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const tripleperformanceURL = "https://wiki.tripleperformance.fr";

    // Ignore the first row for the column names
    for (let rowId = 2; rowId <= sheet.getLastRow(); rowId++) {
        this.apiTools = new api_tools(tripleperformanceURL, 'Bertrand Gorge@Triple_Performance_Robot', 'oggbeitecs3dgqtep18cbm3o5qhpakf2');

        const training = this.getTraining(sheet, rowId);

        let wikiTitle = this.findPageForTraining(training.get('Code'), training.get('Structure'));
        let templateParams = [...training.entries()].map(param => param[0] + ' = ' + param[1]);

        Logger.log(wikiTitle);

        var currentRowRange = sheet.getRange(rowId, 1, 1, sheet.getLastColumn());
        currentRowRange.setBackgroundRGB(223, 246, 228);

        if (wikiTitle) {
            // Update the page
            let pageContent = this.apiTools.getPageContent(wikiTitle);

            if (!this.apiTools.hasTemplate(pageContent, "Formation")) {
                throw new Error("La page " + wikiTitle + " a été trouvée pour la formation " + training.get("Titre") + " mais elle ne contient pas la template formation!");
            }

            pageContent = this.apiTools.replaceTemplate("Formation", "Formation", templateParams, pageContent);

            this.apiTools.updateWikiPage(wikiTitle, pageContent, "Mise à jour des données de la formation");
        }
        else {
            // Create a new page
            wikiTitle = training.get("Titre") + " (formation)";
            let pageContent = this.apiTools.getPageContent(wikiTitle);

            // Check if a page doesn't exist with the same title already, if yes, ask to change the course title
            if (pageContent) {
                throw new Error("Une page " + wikiTitle + " existe déjà. Merci de vérifier si elle correspond à la formation " + training.get("Titre") + " (et dans ce cas modifier le code de la formation dans la page avant de recommancer), et sinon de changer le titre de la formation pour éviter le doublon");
            }

            pageContent = "{{Formation}}";
            pageContent = this.apiTools.replaceTemplate("Formation", "Formation", templateParams, pageContent);

            this.apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
        }

        sheet.getRange(rowId, 19, 1, 1).setValues([["=HYPERLINK(\"" + tripleperformanceURL + "/wiki/" + wikiTitle + "\"; \"" + wikiTitle + "\")"]]);

        currentRowRange.setBackground(null);
    }

    SpreadsheetApp.getUi() // Or DocumentApp, SlidesApp or FormApp.
        .alert('Completed');
}

function findPageForTraining(Code, Structure) {
    let pages = this.apiTools.getPagesWithForSemanticQuery("[[A un code de formation::" + Code + "]][[Est produit par::" + Structure + "]]");
    if (pages.length > 0)
        return pages[0];

    return null;
}

function getTraining(sheet, rowId) {
    // getRange(row, column, numRows, numColumns)
    const values = sheet.getRange(rowId, 1, 1, 18).getValues();

    if (values[0][0].trim() == "")
        return null;

    let training = new Map();

    training.set("Code", values[0][0]);
    training.set("URL", values[0][1]);
    training.set("URL Image", values[0][2]);
    // training.set("Rendu de l'image", values[0][3]);
    training.set("Titre", values[0][4]);
    training.set("Durée", values[0][5]);
    training.set("Coût", values[0][6]);
    training.set("Modalité", values[0][7]);
    training.set("Intervenant", values[0][8]);
    training.set("Fournisseur", values[0][9]);
    training.set("Filière", values[0][10]);
    training.set("Finançable", values[0][11]);
    training.set("Présentation", values[0][12]);
    training.set("Objectifs", values[0][13]);
    training.set("Public visé et prérequis", values[0][14]);
    training.set("Département", values[0][15]);
    training.set("Structure", values[0][16]);
    training.set("URL Structure", values[0][17]);

    Logger.log([...training.entries()]);

    return training;
}

