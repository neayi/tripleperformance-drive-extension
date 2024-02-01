class TrainingCourseModel {
    constructor() {
        this.apiTools = false;
        this.tripleperformanceURL = "";

        this.columns = [
            "Code formation", "URL", "URL Image", "Rendu de l'image", "Titre de la formation", "Durée (heures)", 
            "Coût", "Modalité", "Intervenant", "Fournisseur", "Filière", "Finançable VIVEA, OPCO", "Présentation", 
            "Objectifs", "Public visé et prérequis", "Département", "Structure", "URL Structure", 
            "Page TriplePerformance", "Image", "Date de mise à jour"
        ];

        this.tabs = ["Structure de formation", "Liste des formations", "Intervenants"];
    }

    getCourseFromRow(row)
    {
        let course = {};
        let [courseCode, courseURL, courseImageURL, imageInSpreadsheet, courseTitle, durationInHours, cost, modality, speaker, 
             provider, production, financingCapability, presentation, objectives, target, department, 
             structure, structureURL, tripleperformanceTitle, tripleperformanceImage, updateDate, ...others] = row;

        course.courseCode = courseCode;
        course.courseURL = courseURL;
        course.courseImageURL = courseImageURL;
        course.courseTitle = courseTitle;
        course.durationInHours = durationInHours;
        course.cost = cost;
        course.modality = modality;
        course.speaker = speaker;
        course.provider = provider;
        course.production = production;
        course.financingCapability = financingCapability;
        course.presentation = presentation;
        course.objectives = objectives;
        course.target = target;
        course.department = department;
        course.structure = structure;
        course.structureURL = structureURL;
        course.tripleperformanceTitle = tripleperformanceTitle;
        course.tripleperformanceImage = tripleperformanceImage;
        course.updateDate = updateDate;
        
        return course;
    }

    getApiTools()
    {
        let parameters = new tp_parameters();
        parameters.loadSecrets();
        if (!parameters.checkSecrets())
            return;

        this.tripleperformanceURL = parameters.secrets.wikiURL;

        return new api_tools(parameters.secrets.wikiURL, parameters.secrets.username, parameters.secrets.password);
    }

    syncThumbnails() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;
        const wikiCol = this.getColNumber("Image");

        let imagesAdded = 0;

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let course = this.getCourseFromRow(row);
   
            if (course.courseCode.length == 0 || !course.courseImageURL.match(/^http/))
                return;
            
            if (course.tripleperformanceImage.length > 0)
                return;

            let apiTools = this.getApiTools();

            // Find the URL for this thumbnail
            const destName = `Illustration Formation ${course.courseCode}.jpg`;
            let comment = `Image accompagnant la formation [[${course.courseTitle} (formation)]]`;

            Logger.log("Getting thumbnail for " + course.courseCode + " " + course.courseImageURL + " " + destName);
            let ret = apiTools.uploadImage(course.courseImageURL, destName, comment);
            Logger.log(ret);

            let content = getHyperlinkedTitle(this.tripleperformanceURL, 'File:' + destName, destName);
            sheet.getRange(rowIndex + startRow, wikiCol, 1, 1).setValue(content);

            imagesAdded++;
        });

        SpreadsheetApp.getUi().alert(imagesAdded + " vignettes ajoutées !");
    }

    syncTrainings() {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Liste des formations");
        if (sheet == null) {
            SpreadsheetApp.getUi().alert("Impossible de trouver l'onglet Liste des formations !");
            return;
        }

        let wiki = new wikiPage();
        this.apiTools = this.getApiTools();

        let newCourses = 0;
        let updatedCourses = 0;
        let untouchedCourses = 0;

        const dateCol = this.getColNumber("Date de mise à jour");

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

                let presentation = trainingParams.get("Présentation").trim(); 
                trainingParams.unset("Présentation"); 
                let objectives = trainingParams.get("Objectifs").trim(); 
                trainingParams.unset("Objectifs"); 
                let target = trainingParams.get("Public visé et prérequis").trim(); 
                trainingParams.unset("Public visé et prérequis"); 

                pageContent = wiki.updateTemplate("Formation", trainingParams, pageContent);
                
                if (presentation.length > 0)
                    pageContent += "\n" + presentation;

                if (objectives.length > 0)
                    pageContent += "\n\n== Objectifs ==\n" + objectives;

                if (target.length > 0)
                    pageContent += "\n\n== Public visé et prérequis ==\n" + target;
    
                let apiTools = this.getApiTools();
                apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
                bModified = true;
                newCourses++;
            }

            let maintenant = new Date();
            let content = getHyperlinkedTitle(this.tripleperformanceURL, wikiTitle, wikiTitle);

            sheet.getRange(rowId, dateCol, 1, 2).setValues([
                [content, Utilities.formatDate(maintenant, 'Europe/Paris', 'dd-MMM HH-mm')]
            ]);
        }

        SpreadsheetApp.getUi().alert(`${newCourses} nouvelles formations, ${updatedCourses} formations mises à jour (${untouchedCourses} n'ont pas été modifiées)`);
    }

    findPageForTraining(Code, Structure) {
        let pages = this.apiTools.getPagesWithForSemanticQuery("[[A un code de formation::" + Code + "]][[Est produit par::" + Structure + "]]");
        if (pages.length > 0)
            return pages[0];

        return null;
    }

    getTrainingDataFromSpreadsheet(sheet, rowId) {
        // getRange(row, column, numRows, numColumns)
        const values = sheet.getRange(rowId, 1, 1, this.columns.length).getValues();

        if (values[0][0].trim() == "")
            return null;

        let course = this.getCourseFromRow(values[0]);

        let training = new Map();

        training.set("Code",	course.courseCode);
        training.set("URL",	course.courseURL);

        if (course.courseURL.length > 0)
            training.set("Image",	`Illustration Formation ${course.courseCode}.jpg`);

        training.set("Titre",	course.courseTitle);
        training.set("Durée",	course.durationInHours);
        training.set("Coût",	course.cost);
        training.set("Modalité",	course.modality);
        training.set("Intervenant",	course.speaker);
        training.set("Fournisseur",	course.provider);
        training.set("Filière",	course.production);
        training.set("Finançable",	course.financingCapability);
        training.set("Présentation",	course.presentation);
        training.set("Objectifs",	course.objectives);
        training.set("Public visé et prérequis",	course.target);
        training.set("Département",	course.department);
        training.set("Structure",	course.structure);
        training.set("URL Structure",	course.structureURL);

        Logger.log([...training.entries()]);

        return training;
    }

    getColNumber(colname) {
        return this.columns.indexOf(colname) + 1;
    }
    
    buildSpeakersList() {
        let sheet = SpreadsheetApp.getActiveSheet();
        let idFound = false;
        let speakers = [];

        sheet.getDataRange().getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let course = this.getCourseFromRow(row);
              
            if (course.speaker.length == 0)
                return;

            course.speaker.split(',').forEach((intervenant, i) => {
                intervenant = intervenant.trim();
                if (intervenant.length == 0)
                    return;

                speakers.push(intervenant);
            });
        });

        let speakersManager = new speakersModel();
        let newSpeakers = speakersManager.addSpeakers(speakers);

        SpreadsheetApp.getUi().alert(`Terminé - ${newSpeakers} intervenants ajoutés (veuillez compléter leur bio)`);
    }

    getTabs()
    {
        return this.tabs;
    }

    createTab(tabName)
    {
        if (!this.tabs.includes(tabName))
            return false;

        let sheet = renameAndCreateTab(tabName);

        if (tabName == "Liste des formations")
        {
            sheet.getRange(1, 1, 1, this.columns.length)
                .setValues([this.columns])
                .setFontWeight("bold")
                .setBackground("#f3f3f3");
            sheet.setFrozenRows(1);
        }
        else if (tabName == "Structure de formation")
        {
            setSheetVersion(sheet, 1, "Une fois les formations créées, vous pourrez modifier les valeurs " 
                        + " dans la feuille excel - seul le contenu de la template sera modifié, le reste" 
                        + " de la page de la formation sera laissé intact");

            sheet.getRange(4, 1, 2, 1).setValues([["Structure"], ["URL Structure"]])
                .setFontWeight("bold");
        }
        else if (tabName == "Intervenants")
        {
            let speakM = new speakersModel();
            sheet = speakM.createTab(tabName);
        }

        return sheet;
    }
}