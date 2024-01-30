class TrainingCourseModel {
    constructor() {
        this.apiTools = false;
        this.tripleperformanceURL = "";
    }

    getApiTools()
    {
        let parameters = new tp_parameters();
        parameters.loadSecrets();
        this.tripleperformanceURL = parameters.secrets.wikiURL;

        return new api_tools(parameters.secrets.wikiURL, parameters.secrets.username, parameters.secrets.password);
    }

    syncTrainings() {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Liste des formations");
        if (sheet == null) {
            addMessageToLog("Synchro des formations", "Liste des formations", "Erreur", 
                            "Impossible de trouver l'onglet Liste des formations !");
            return;
        }

        let wiki = new wikiPage();
        this.apiTools = this.getApiTools();

        let newCourses = 0;
        let updatedCourses = 0;
        let untouchedCourses = 0;

        // Ignore the first row for the column names
        for (let rowId = 2; rowId <= sheet.getLastRow(); rowId++) {

            const trainingParams = this.getTrainingDataFromSpreadsheet(sheet, rowId);

            let wikiTitle = this.findPageForTraining(trainingParams.get('Code'), trainingParams.get('Structure'));

            Logger.log(wikiTitle);

            let bModified = false;

            if (wikiTitle) {
                // Update the page
                let pageContent = this.apiTools.getPageContent(wikiTitle);

                if (!wiki.hasTemplate(pageContent, "Formation")) {
                    throw new Error("La page " + wikiTitle + " a été trouvée pour la formation " + trainingParams.get("Titre") + " mais elle ne contient pas la template formation!");
                }

                let newPageContent = wiki.updateTemplate("Formation", trainingParams, pageContent);

                if (newPageContent == pageContent)
                    untouchedCourses++
                else
                {
                    let apiTools = this.getApiTools();
                    apiTools.updateWikiPage(wikiTitle, newPageContent, "Mise à jour des données de la formation");
                    updatedCourses++;
                    bModified = true;
                }
            }            
            else {
                // Create a new page
                wikiTitle = trainingParams.get("Titre") + " (formation)";
                let pageContent = this.apiTools.getPageContent(wikiTitle);

                // Check if a page doesn't exist with the same title already, if yes, ask to change the course title
                if (pageContent) {
                    throw new Error("Une page " + wikiTitle + " existe déjà. Merci de vérifier si elle correspond à la formation " + trainingParams.get("Titre") + " (et dans ce cas modifier le code de la formation dans la page avant de recommancer), et sinon de changer le titre de la formation pour éviter le doublon");
                }

                pageContent = wiki.updateTemplate("Formation", trainingParams, pageContent);

                let apiTools = this.getApiTools();
                apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
                bModified = true;
                newCourses++;
            }

            let maintenant = new Date();
            sheet.getRange(rowId, 19, 1, 2).setValues([
                ["=HYPERLINK(\"" + this.tripleperformanceURL + "/wiki/" + wikiTitle + "\"; \"" + wikiTitle + "\")", Utilities.formatDate(maintenant, 'Europe/Paris', 'dd-MMM HH-mm')]
            ]);
        }

        SpreadsheetApp.getUi().alert('Formations enregistrées');

        addMessageToLog("Synchro des formations", "Liste des formations", "Ok", 
            `${newCourses} nouvelles formations, ${updatedCourses} formations mises à jour (${untouchedCourses} n'ont pas été modifiées)`);
    }

    findPageForTraining(Code, Structure) {
        let pages = this.apiTools.getPagesWithForSemanticQuery("[[A un code de formation::" + Code + "]][[Est produit par::" + Structure + "]]");
        if (pages.length > 0)
            return pages[0];

        return null;
    }

    getTrainingDataFromSpreadsheet(sheet, rowId) {
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

}