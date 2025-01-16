class TrainingCourseModel {
    constructor() {

        // title, width, wrap, alignment
        this.colDefs = [
            ["Titre de la formation", "262", "left"],
            ["Code formation", "100", "left"],
            ["URL", "100", "left"],
            ["URL Image", "100", "left"],
            ["Rendu de l'image", "100", "left"],
            ["Durée (heures)", "68", "center"],
            ["Durée (jours)", "60", "center"],
            ["Coût", "60", "center"],
            ["Modalité", "143", "center"],
            ["Intervenant", "180", "left"],
            ["Filière", "191", "left"],
            ["Mots clés", "191", "left"],
            ["Finançable VIVEA, OPCO", "100", "center"],
            ["Finançable CPF", "100", "center"],
            ["Finançable France Travail", "100", "center"],
            ["Présentation rapide", "250", "left"],
            ["Départements", "100", "left"],
            ["Structure", "100", "left"],
            ["Page TriplePerformance", "190", "left"],
            ["Image", "100", "left"],
            ["Date de mise à jour", "100", "center"],
            ["Objectifs", "100", "left"],
            ["Public visé et prérequis", "100", "left"],
            ["Contenu", "130", "left"],
            ["Mettre à jour le contenu éditorial", "130", "center"]
        ];

        this.columns = this.colDefs.map(col => col[0]);
    }

    syncThumbnails() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;
        const wikiCol = this.getColNumber("Image");

        let imagesAdded = 0;
        const tripleperformanceURL = getTriplePerformanceURL();

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

            let apiTools = getApiTools();

            // Find the URL for this thumbnail
            const destName = `Illustration Formation ${course.courseCode}.jpg`;
            let comment = `Image accompagnant la formation [[${course.courseTitle} (formation)]]`;

            Logger.log("Getting thumbnail for " + course.courseCode + " " + course.courseImageURL + " " + destName);
            let ret = apiTools.uploadImage(course.courseImageURL, destName, comment);

            let content = getHyperlinkedTitle(tripleperformanceURL, 'File:' + destName, destName);
            sheet.getRange(rowIndex + startRow, wikiCol).setValue(content);

            imagesAdded++;
        });

        alert(imagesAdded + " vignettes ajoutées !");
    }

    syncTrainings() {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Liste des formations");
        if (sheet == null) {
            alert("Impossible de trouver l'onglet Liste des formations !");
            return;
        }

        let wiki = new wikiPage();

        let newCourses = 0;
        let updatedCourses = 0;
        let untouchedCourses = 0;

        const dateCol = this.getColNumber("Date de mise à jour");
        const pageCol = this.getColNumber("Page TriplePerformance");

        const tripleperformanceURL = getTriplePerformanceURL();

        let rows = sheet.getDataRange().getValues();

        let existingPages = new Map();

        // Ignore the first row for the column names
        for (let rowId = 1; rowId < rows.length; rowId++) {
            const values = rows[rowId];

            if (values[0].trim() == "")
                continue;

            let course = this.getCourseFromRow(values);
            Logger.log(course.courseTitle);

            if (course.updateDate.length > 0)
                continue;

            const trainingParams = this.getTemplateForTrainingCourse(course);

            if (existingPages.size == 0)
                existingPages = this.findCoursePagesForStructure(course.structure);

            let wikiTitle = '';
            if (existingPages.has(course.courseCode))
                wikiTitle = existingPages.get(course.courseCode);

            Logger.log(course.courseCode + " - " + wikiTitle +" - " + typeof wikiTitle +  " - " + wikiTitle.length);
            let apiTools = getApiTools();

            if (wikiTitle.length > 0) {
                // Update the page
                let pageContent = apiTools.getPageContent(wikiTitle);

                if (!wiki.hasTemplate(pageContent, "Formation")) {
                    throw new Error("La page " + wikiTitle + " a été trouvée pour la formation " + course.courseTitle + " mais elle ne contient pas la template formation!");
                }

                let newPageContent = wiki.updateTemplate("Formation", trainingParams, pageContent);

                if (newPageContent == pageContent)
                    untouchedCourses++
                else
                {
                    apiTools.updateWikiPage(wikiTitle, newPageContent, "Mise à jour des données de la formation");
                    updatedCourses++;
                }
            }
            else {
                // Create a new page
                wikiTitle = 'Formation:' + course.courseTitle;
                let pageContent = apiTools.getPageContent(wikiTitle);

                // Check if a page doesn't exist with the same title already, if yes, ask to change the course title
                if (pageContent) {
                    throw new Error("Une page " + wikiTitle + " existe déjà. Merci de vérifier si elle correspond à la formation " + trainingParams.get("Titre") + " (et dans ce cas modifier le code de la formation dans la page avant de recommancer), et sinon de changer le titre de la formation pour éviter le doublon");
                }

                let presentation = course.shortPresentation.trim();
                let objectives = course.objectives.trim();
                let target = course.target.trim();

                pageContent = wiki.updateTemplate("Formation", trainingParams, pageContent).trim();

                if (presentation.length > 0)
                    pageContent += "\n" + presentation;

                if (objectives.length > 0)
                    pageContent += "\n\n== Objectifs ==\n" + objectives;

                if (target.length > 0)
                    pageContent += "\n\n== Public visé et prérequis ==\n" + target;

                pageContent += "\n\n{{Pages liées}}";

                apiTools.createWikiPage(wikiTitle, pageContent, "Création de la page");
                newCourses++;
            }

            sheet.getRange(rowId + 1, pageCol).setValue(getHyperlinkedTitle(tripleperformanceURL, wikiTitle, wikiTitle));
            sheet.getRange(rowId + 1, dateCol).setValue(Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm'));
            SpreadsheetApp.flush();
        }

        alert(`${newCourses} nouvelles formations, ${updatedCourses} formations mises à jour (${untouchedCourses} n'ont pas été modifiées)`);
    }

    findPageForTraining(Code, Structure) {
        let apiTools = getApiTools();

        let pages = apiTools.getPagesWithForSemanticQuery("[[A un code de formation::" + Code + "]][[Est produit par::" + Structure + "]]");
        if (pages.length > 0)
            return pages[0];

        return null;
    }

    findCoursePagesForStructure(Structure) {
        let apiTools = getApiTools();

        let pages = apiTools.getSemanticValuesWithForSemanticQuery("[[A un type de page::Formation]][[Est produit par::" + Structure + "]]", ['A un code de formation']);

        let ret = new Map();

        pages.forEach((row) => { ret.set(row[1], row[0]); });

        return ret;
    }

    getTemplateForTrainingCourse(course) {

        let training = new Map();

        training.set("Code", course.courseCode);
        training.set("URL",	course.courseURL);

        if (course.tripleperformanceImage.length > 0)
            training.set("Image",	`Illustration Formation ${course.courseCode}.jpg`);

        training.set("Titre",	course.courseTitle);

        if (course.durationInHours > 0)
            training.set("Durée",	course.durationInHours + " h");
        else if (course.durationInDays > 0)
            training.set("Durée",	course.durationInDays + " j");

        training.set("Coût",	course.cost);
        training.set("Modalité",	course.modality);
        training.set("Intervenant",	course.speaker);
        training.set("Filière",	course.production);
        training.set("Mots clés",	course.tags);
        training.set("Finançable Vivea",	course.financeableVivea);
        training.set("Finançable CPF",	course.financeableCPF);
        training.set("Finançable France Travail",	course.financeableFranceTravail);
        training.set("Présentation",	course.shortPresentation);
        training.set("Départements",	course.departments);
        training.set("Structure",	course.structure);

        return training;
    }

    getCourseFromRow(row)
    {
        let course = {};
        let [courseTitle, courseCode, courseURL, courseImageURL, imageInSpreadsheet, durationInHours, durationInDays, cost, modality, speaker,
             production, tags, financeableVivea, financeableCPF, financeableFranceTravail, shortPresentation, departments, structure,
             tripleperformanceTitle, tripleperformanceImage, updateDate, objectives, target, forceUpdatePage, ...others] = row;

        course.courseTitle = courseTitle;
        course.courseCode = courseCode;
        course.courseURL = courseURL;
        course.courseImageURL = courseImageURL;
        course.durationInHours = durationInHours;
        course.durationInDays = durationInDays;
        course.cost = cost;
        course.modality = modality;
        course.speaker = speaker;
        course.production = production;
        course.tags = tags;
        course.financeableVivea = financeableVivea;
        course.financeableCPF = financeableCPF;
        course.financeableFranceTravail = financeableFranceTravail;
        course.shortPresentation = shortPresentation;
        course.departments = departments;
        course.structure = structure;
        course.tripleperformanceTitle = tripleperformanceTitle;
        course.tripleperformanceImage = tripleperformanceImage;
        course.updateDate = updateDate;
        course.objectives = objectives;
        course.target = target;
        course.forceUpdatePage = forceUpdatePage;

        return course;
    }

    getColNumber(colname) {
        const col = this.columns.indexOf(colname);
        if (col == -1)
            throw new Error("La colonne " + colname + " n'a pas été trouvée dans l'onglet courrant. Veuillez recliquer sur \"Créer les onglets\".");

        return col + 1;
    }

    buildSpeakersList() {
        let sheet = SpreadsheetApp.getActiveSheet();
        let idFound = false;
        let speakers = [];

        sheet.getDataRange().getValues().forEach((row) => {
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

        alert(`Terminé - ${newSpeakers} intervenants ajoutés (veuillez compléter leur bio)`);
    }

    createTrainingTab()
    {
        let sheet = getOrCreateTab("Liste des formations");
        sheet.getRange(1, 1, 1, this.columns.length)
            .setValues([this.columns])
            .setFontWeight("bold")
            .setBackground(getLightGrayColor());
        sheet.setFrozenRows(1);
        sheet.setFrozenColumns(1);

        this.colDefs.forEach((col, colNumber) => {
            sheet.setColumnWidth(colNumber + 1, col[1]);
            sheet.getRange(1, colNumber + 1, sheet.getMaxRows(), 1)
                .setHorizontalAlignment(col[2]);
        });

        sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
            .setVerticalAlignment("middle")
            .setWrap(true);
        sheet.setRowHeightsForced(1, sheet.getMaxRows(), 70);

        sheet.getRange(2, this.getColNumber("URL"), sheet.getMaxRows() - 1, 1).setWrap(false);
        sheet.getRange(2, this.getColNumber("URL Image"), sheet.getMaxRows() - 1, 1).setWrap(false);

        sheet.getRange(2, this.getColNumber("Coût"), sheet.getMaxRows() - 1, 1)
            .setNumberFormat("#,##0 €");

        var modalite = sheet.getRange(2, this.getColNumber("Modalité"), sheet.getMaxRows() - 1, 1);
        var rule = SpreadsheetApp.newDataValidation()
            .requireValueInList(
                ["Présentiel",
                 "Terrain",
                 "Distanciel (e-learning)",
                 "Distanciel (classe virtuelle)",
                 "Présentiel + Distanciel",
                 "Terrain + Distanciel",
                 "Présentiel + Terrain",
                 "Présentiel + Terrain + Distanciel"], true)
            .build();
        modalite.setDataValidation(rule);

        var fundableCells = sheet.getRange(2, this.getColNumber("Finançable VIVEA, OPCO"), sheet.getMaxRows() - 1, 3);
        setConditionalFormatingYN(fundableCells);

        var forceUpdateRange = sheet.getRange(2, this.getColNumber("Mettre à jour le contenu éditorial"), sheet.getMaxRows() - 1, 1);
        setConditionalFormatingYN(forceUpdateRange);

        return sheet;
    }

}