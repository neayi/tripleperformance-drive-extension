class chartsBuilder {
    constructor() {

        this.charts = [
            { type: 'Histogramme', name: 'Comptabilité', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/bilan.png' },
            { type: 'Histogramme', name: 'Histogramme par année', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/histogramme.png' },
            { type: 'Radar', name: 'Radar', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/radar.png' },
            { type: 'Rotation', name: 'Rotation', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/rotation.png' },
            { type: 'Carte proportionnelle', name: 'Assolement', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/assolement.png' },

            { type: 'Radar', name: 'Analyse environnementale', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/analyse-environnementale.png' },
            { type: 'Radar', name: 'Analyse socio-économique', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/analyse-socio-eco.png' },
            { type: 'Barres horizontales', name: "Capacité d'autoproduction", image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/autonomie.png' },
            { type: 'Camembert', name: 'Stratégie commerciale', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/commercialisation.png' },

            { type: 'Histogramme', name: 'Diagramme ombrothermique', image: 'https://wiki.tripleperformance.fr/skins/skin-neayi/add-on/ombrothermique.png' }
        ];
    }

    /**
     * Look in the current page and finds the names of all the charts in the page
     */
    findChartsOnPage() {
        let sheet = SpreadsheetApp.getActiveSheet();
        let charts = [];

        sheet.getDataRange().getValues().forEach((row) => {
            if (row[0] == "Titre" && row[1].length > 0)
                charts.push(row[1]);
        });

        return charts;
    }

    /**
     * Get a range for a chart whose title is chartTitle
     * @param String chartName 
     */
    getRangeForChart(chartTitle) {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();
        let chartStartRow = 0;
        let chartFound = false;

        let retRange = null;

        const expectedFields = ["Titre", "Alignement", "Largeur", "Hauteur"];
        let foundExpectedFields = 0;

        data.getValues().forEach((row, rowIndex) => {
            if (retRange)
                return;

            if (row[0] == "Graphique" && row[1].length > 0) {
                chartStartRow = rowIndex + startRow;
                foundExpectedFields = 0;
                return;
            }

            if (chartStartRow > 0 && row[0] == "Titre" && row[1] == chartTitle) {
                chartFound = true;
                foundExpectedFields++;
                return;
            }

            if (expectedFields.includes(row[0])) {
                foundExpectedFields++;
                return;
            }

            if (chartFound > 0 && foundExpectedFields == expectedFields.length && row[0] == "Fin du graphique") {
                const numRows = rowIndex + startRow - chartStartRow + 1;
                retRange = sheet.getRange(chartStartRow, 1, numRows, data.getNumColumns());
                return;
            }
        });

        return retRange;
    }

    /**
     * Construit un histogramme par année comme celui-ci
     * https://echarts.apache.org/examples/en/editor.html?c=bar-simple&code=PYBwLglsB2AEC8sDeBYAULTsBEZjABtIRsAuZAXwBp0scCBTAcwegBMzla6cAjYMHgC2nAIwBWbpmpSckMI06oMPTLgYAPMJ2wBhYAG-wsAGbAArgCdLAQxaXYAelgBlAGIAFbDRWr1WgEECCCZoHQBjVjAGS29ZOmxGE21ybHEABgBSON8eXFAxdNkZXOwNAI0IAGcleKxcAE8QBgibaKZgSwac1TUbSqqAGRteBgJa3L8zaDAAdQYQgAsUvkIOH17YEs3sNjabTgBtOr8AJnTRAE4ezfrz85vbnHvRR54AXWKN-oaK6omdmAmi1UgA3GwEcwtb5-frVYajcbkZRPNRmSxCNrRWKpJDgyEMCiwQA1BNgTlsvrJsFUYhAGDVyMdJlgUajGs0dLwbLEYbdsBBokIXEDFMjyTtwoROjoAMQ2ExsdKXcRk5mqbZsggjMYA1EJKqLYAAd04YEsUN5euwIGAVQFUDCqQg0DtbGh4t62HRmMEMR0SHCRNJHukls9DCEIEWNjtDK4ar5ZnC5jj1Np9NVeo1T2w0BsQhBOAAsjYAPc1MN-KpgGzhADWOkxzuFtYblbyexrRxDPFZer8-KhnAAzEUE5ts_2-_2EoPC8PJOPepO9dOZ2o55wACxj9cUpeYT4JlcsnvswvYLk8s8CiPChqi-N77CSgjS1IygDsp0uJnCJkzVETz8LVEV1GdqUNE1yDNC0ewSG07UgGAdGdV13QPPJvSxP1cUDElAKeYC8gjKMY3-MVMISJMUx0GlLDpGoe2IhI8wLHQiwAS-iCBxnbfUa3rRsbGbQS2zPTsDkZeDTyoz1N3ICQZNDZSnz3eoFNgc5VJY3o13XbBNKUuTpB7I8J3bfS_CBDlUivN4dlvIURULKy-Vfd8cBlNxTgADkuAA2dJCNuXS1FAnVKOfA1jVNc0GH4z1EPtFCnRdCA3QctlsN9HEcADIMQoss9SOjWNwP7L1gGTVN6MYorl0StQ2IvDxbAgBiGFgZoMRsaAogwq1q1bYTRJGpqcEk7sTLU9ScCM3d1zC3tVNnCEh3IXydImug3KtIzTh0szyQoWQjwoABuIA
     */
    syncCharts(chartname) {
        let farm = new FarmModel()
        let wikiTitle = farm.getFarmPageTitle();

        if (!wikiTitle)
            return;

        Logger.log("Synchronisation du graphique " + chartname);
        const range = this.getRangeForChart(chartname);

        if (!range) {
            alert("Impossible de trouver le chart complet pour " + chartname + ". " +
                "Il est possible qu'il ait été modifié dans sa structure, vérifiez en particulier qu'il y " +
                "ait bien la ligne \"Graphique\" et la ligne \"Fin du graphique\"");
            return;
        }

        const values = range.getValues();

        let chartParserFunction = 'echart';
        let chartTemplate = '';
        let chartArgs = new Map();

        let chart = ""; // Will be {{#echart: ...}}

        switch (this.getChartValue("Graphique", values)) {
            case "Histogramme par année":
                chart = this.getBarChartPerYear(range, wikiTitle);
                break;

            case "Assolement":
                chart = this.getTreeMap(range, wikiTitle);
                break;

            case "Rotation":
                chart = this.getRotation(range, wikiTitle);
                break;

            case "Radar":
                chart = this.getRadar(range, wikiTitle);
                break;

            case "Comptabilité":
                chart = this.getComptabilite(range);
                chartParserFunction = 'economic_charts';
                break;

            case "Analyse environnementale":
                chartArgs = this.getAnalyseChart(range);
                chartTemplate = 'EChart Radar environnemental MSV';
                break;

            case "Analyse socio-économique":
                chartArgs = this.getAnalyseChart(range);
                chartTemplate = 'EChart Radar MSV';
                break;

            case "Capacité d'autoproduction":
                chartArgs = this.getAnalyseChart(range);
                chartTemplate = "EChart Capacité d'autoproduction MSV";
                break;

            case "Stratégie commerciale":
                chartArgs = this.getStrategieCommerciale(range);
                chartTemplate = "EChart Stratégie commerciale MSV";
                break;

            case "Diagramme ombrothermique":
                chart = this.getClimateGraph(range, wikiTitle);
                break;

            default:
                alert("Le type de graphique de " + chartname +
                    " n'a pas été reconnu et ne peut pas être traité.");
                break;
        }

        let apiTools = getApiTools();

        if (!apiTools)
            return;

        let wiki = new wikiPage();
        let pageContent = apiTools.getPageContent(wikiTitle);
        if (pageContent === false) {
            alert("La page \"" + wikiTitle + "\" n'existe pas encore dans le wiki. Veuillez la créer de façon à pouvoir y insérer des graphiques !");
            return;
        }

        if (chartTemplate.length > 0)
            pageContent = wiki.updateTemplate(chartTemplate, chartArgs, pageContent);
        else {
            const chartTitle = this.getChartValue("Titre", values);
            pageContent = wiki.replaceOrAddChart(chartParserFunction, chartTitle, chart, pageContent);
        }

        apiTools.updateWikiPage(wikiTitle, pageContent, "Ajout du graphique " + chartname);

        alert("Le nouveau graphique a été ajouté à la page du wiki");
    }

    getBarChartPerYear(range, wikiTitle) {
        const values = range.getValues();
        var bgColors = range.getBackgrounds();

        let option = {
            "tooltip": {},
            "title": {
                "left": 'center',
                "text": ''
            },
            "legend": {
                "bottom": 10,
                "type": 'scroll'
            },
            "xAxis": {
                "type": "category",
                "axisLabel": {
                    "fontWeight": "bold",
                },
                "data": []
            },
            "yAxis": {
                "type": "value",
                "axisLabel": {
                    "formatter": "{value} €"
                }
            },
            "series": []
        };

        option.xAxis.data = this.getChartValues("Colonnes ➜", values);

        // If there's a blank cell, then consider we are at the end of the columns.
        let numCols = option.xAxis.data.indexOf('');
        if (numCols != -1)
            option.xAxis.data = option.xAxis.data.slice(0, numCols);
        else
            numCols = option.xAxis.data.length;

        option.title.text = this.getChartValue("Titre", values);

        const headerRow = this.getChartRowIndex("Colonnes ➜", values);
        const footerRow = this.getChartRowIndex("Total", values);
        Logger.log(`header and footer : ${headerRow} - ${footerRow}`);

        for (let rowIndex = headerRow + 1; rowIndex < footerRow; rowIndex++) {
            let series = {
                "type": "bar",
                "barMaxWidth": "150px",
                "label": {
                    "show": true,
                    "position": "inside",
                    "formatter": "{c} €"
                },
                "emphasis": {
                    "focus": "series"
                },
                "name": "",
                "stack": "stackName",
                "data": []
            };

            series.name = values[rowIndex][0];
            const seriesData = this.getChartValues(series.name, values, numCols);
            seriesData.forEach((v) => {
                series.data.push({
                    "value": v
                });
            });

            const color = bgColors[rowIndex][0];
            if (color != '#ffffff')
                series.itemStyle = { 'color': color };

            option.series.push(series);
        }

        return this.buildParserFunction(wikiTitle, option,
            this.getChartValue("Titre", values),
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));
    }

    getTreeMap(range, wikiTitle) {
        const values = range.getValues();
        const bgColors = range.getBackgrounds();
        const fgColors = range.getFontColorObjects();
        const title = this.getChartValue("Titre", values);

        let option = {
            "tooltip": {
                "formatter": "assolement",
                "confine": true
            },
            "series": [
                {
                    "type": 'treemap',
                    "roam": false,
                    "itemStyle": {
                        "borderWidth": 0,
                        "gapWidth": 2
                    },
                    "name": title,
                    "data": []
                }
            ]
        };

        const headerRow = this.getChartRowIndex("Catégorie", values);
        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        Logger.log(`header and footer : ${headerRow} - ${footerRow}`);

        let currentCategory = '';
        let currentCategoryJSON = { name: '' };

        for (let rowIndex = headerRow + 1; rowIndex < footerRow; rowIndex++) {
            let [cat, item, value] = values[rowIndex];

            if (cat == "" && item == "" && value == "")
                break; // We are at the end of our table

            if (cat != "" && cat != currentCategory) {
                currentCategory = cat;

                // Let's create a new category
                if (currentCategoryJSON.name != "")
                    option.series[0].data.push(currentCategoryJSON);

                currentCategoryJSON = {
                    name: currentCategory,
                    children: []
                };

                const color = bgColors[rowIndex][0];
                let fontColor = fgColors[rowIndex][0].asRgbColor().asHexString();

                if (fontColor.length == 9) // #aarrggbb
                    fontColor = '#' + fontColor.slice(3);

                if (color != '#ffffff')
                    currentCategoryJSON.itemStyle = { 'color': color, 'fontColor': fontColor };
            }

            if (item == "")
                item = cat;

            // in some cases, getValues picks up the unit as well, so remove all non numeric features:
            if (typeof value == 'string')
                value = Number.parseFloat(value.replace(',', '.'));

            let childData = {
                name: item,
                value: value,
            };

            if (currentCategoryJSON.itemStyle?.fontColor)
                childData.label = {
                    formatter: '{b} - {c}ha',
                    color: currentCategoryJSON.itemStyle?.fontColor
                };

            currentCategoryJSON.children.push(childData);
        }

        if (currentCategoryJSON.name != "") {
            option.series[0].data.push(currentCategoryJSON);
        }

        let parserFunction = this.buildParserFunction(wikiTitle, option,
            this.getChartValue("Titre", values),
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));

        return parserFunction;
    }

    getRotation(range, wikiTitle) {
        const values = range.getValues();
        const bgColors = range.getBackgrounds();
        const richTextValues = range.getRichTextValues();

        const title = this.getChartValue("Titre", values);

        let option = {
            "title": {
                "text": title,
                "left": 'center'
            },
            "tooltip": {
                "formatter": "rotation",
                "confine": true
            },
            "series": []
        };

        const headerRow = this.getChartRowIndex("Cultures/couverts", values);
        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        Logger.log(`header and footer : ${headerRow} - ${footerRow}`);

        // Build the crop ring
        let crops = {
            name: 'Rotation',
            type: 'pie',
            top: '40',
            radius: ['70%', '100%'],
            labelLine: {
                length: 30
            },
            label: {
                position: 'inner',
                fontWeight: 'bold'
            },
            data: []
        };

        let totalMonths = 0;
        for (let rowIndex = headerRow + 1; rowIndex < footerRow; rowIndex++) {
            let [culture, nbMois, Description] = values[rowIndex];

            if (culture == "" && nbMois == "" && Description == "")
                break; // We are at the end of our table

            let description = htmlEncodeRichText(richTextValues[rowIndex][2])

            let item = {
                'name': culture,
                'value': nbMois,
                'description': description
            };

            const color = bgColors[rowIndex][0];
            if (color != '#ffffff')
                item.itemStyle = { 'color': color };

            crops.data.push(item);

            totalMonths += nbMois;
        }

        option.series.push(crops);

        // Create the calendar ring
        let months = {
            name: 'Months',
            type: 'pie',
            top: '40',
            radius: ['60%', '70%'],
            label: {
                position: 'inner',
                rotate: 'tangential'
            },
            tooltip: {
                show: true,
                formatter: '{b}'
            },
            itemStyle: {
                borderColor: '#555',
                color: '#FFFFFF',
                borderWidth: 1
            },
            data: []
        };

        const monthsColorScale = [
            '#c7d2e3', // winter
            '#c7d2e3',
            '#bdd8c0', // spring
            '#bdd8c0',
            '#bdd8c0',
            '#ecebb3', // summer
            '#ecebb3',
            '#ecebb3',
            '#f8e0c5', // automn
            '#f8e0c5',
            '#f8e0c5',
            '#c7d2e3'
        ];

        let monthsPerYear = new Map();
        let currentDate = this.getChartValue("Date de démarrage", values);
        for (let month = 1; month <= totalMonths; month++) {
            let monthName = currentDate.toLocaleDateString(undefined, { month: 'short' });

            let item = { 'name': monthName, 'value': 1 };
            const year = currentDate.getFullYear();
            // if (year % 2 == 0)
            //     item.itemStyle = { color: '#EEE' };
            item.itemStyle = { color: monthsColorScale[currentDate.getMonth()] };

            months.data.push(item);

            let currentMonthsPerYear = monthsPerYear.get(year);
            if (currentMonthsPerYear == undefined)
                currentMonthsPerYear = 0;
            monthsPerYear.set(year, ++currentMonthsPerYear);

            // increment the current month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        option.series.push(months);

        // Create the calendar years ring
        let years = {
            name: 'Years',
            type: 'pie',
            top: '40',
            radius: ['45%', '60%'],
            label: {
                position: 'inner',
                rotate: 'tangential',
                fontWeight: 'bold'
            },
            emphasis: { disabled: true },
            tooltip: { show: false },
            itemStyle: {
                color: '#FFFFFF',
                borderWidth: 1
            },
            data: []
        };

        monthsPerYear.forEach((nbMonths, year) => {
            years.data.push({ 'name': year, 'value': nbMonths });
        });
        option.series.push(years);

        let parserFunction = this.buildParserFunction(wikiTitle, option,
            this.getChartValue("Titre", values),
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));

        return parserFunction;
    }

    getRadar(range, wikiTitle) {
        const values = range.getValues();

        let option = {
            "legend": {},
            "radar": {
                "radius": "60%",
                "center": ["50%", "60%"],
                "indicator": []
            },
            "series": [
                {
                    "type": "radar",
                    "data": [
                        {
                            "value": [],
                            "name": "",
                            "emphasis": {
                                "label": { "show": true }
                            },
                            "itemStyle": { "width": 3, "color": "#f1894c" },
                            "lineStyle": { "width": 3, "color": "#f1894c" },
                            "areaStyle": { "color": "#f1894c" }
                        },
                        {
                            "value": [],
                            "name": "Moyenne",
                            "emphasis": {
                                "title": { "show": true },
                                "label": { "show": true }
                            },
                            "lineStyle": { "width": 3 }
                        }
                    ]
                }
            ]
        };

        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        let hasMoyenne = false;
        for (let rowIndex = 1; rowIndex < footerRow; rowIndex++) {
            let [nomAxe, value, average, max] = values[rowIndex];

            if (average == "Moyenne") {
                option.series[0].data[0].name = value;
                continue;
            }

            if (typeof max !== 'number')
                continue;

            option.series[0].data[0].value.push(Number(value));
            option.series[0].data[1].value.push(Number(average));

            if (average > 0)
                hasMoyenne = true;

            option.radar.indicator.push({
                "name": nomAxe,
                "max": max
            });
        }

        // if no average has been found, just remove the average series
        if (!hasMoyenne)
            option.series[0].data.pop();

        return this.buildParserFunction(wikiTitle, option,
            this.getChartValue("Titre", values),
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));
    }

    getComptabilite(range) {

        const values = range.getValues();
        const title = this.getChartValue("Titre", values);

        const maxcols = range.getNumColumns();
        const footerRow = this.getChartRowIndex("Fin du graphique", values);

        let templateParametersPerYear = [];

        for (let col = 2; col <= maxcols; col++) {
            let parameters = new Map();

            const annee = String(values[6][col]);
            if (!annee.match(/^[0-9]{4}$/) &&
                !annee.match(/^[0-9]{4}-[0-9]{4}$/))
                continue;

            let currentCategory = "";

            for (let rowIndex = 7; rowIndex < footerRow; rowIndex++) {

                let category = values[rowIndex][0];
                if (category.length > 0)
                    currentCategory = category;
                else
                    category = currentCategory;

                const label = values[rowIndex][1];
                const value = values[rowIndex][col];

                if (Number(value) == 0)
                    continue;

                if (label.length == 0)
                    continue;

                if ((typeof label == 'string') && (
                    label.toLowerCase() == "total" ||
                    label.toLowerCase() == "valeur ajoutée" ||
                    label.toLowerCase() == "capacité d'autofinancement"))
                    continue;

                parameters.set(category + '/' + label + ' ' + annee, Number(value));
            }

            if (parameters.size > 0) {
                let pArray = [];
                parameters.forEach((value, key) => { pArray.push(key + ' = ' + value) });
                templateParametersPerYear.push(pArray.join("\n | "));
            }
        }

        let parserFunction = "{{#economic_charts:\n title=" + title + "\n | " + templateParametersPerYear.join("\n | ") + '}}';

        return parserFunction;
    }

    getClimateGraph(range, wikiTitle) {

        const values = range.getValues();

        // https://echarts.apache.org/examples/en/editor.html?c=mix-line-bar&code=PYBwLglsB2AEC8sDeAoWszGAG0iAXMmuhgE4QDmFApqYQOQCGAHhAM70A0x6L7ACsAjQwtQqhIkwATxDUGAY1LA2HbpPRKVbAMozs8ohpIKcwOrHoBiAJx36PEgF9HL9E_WwK5ACbjHBgBmYIQADJ7o5BQAFiGwAKwRsABGwGCYALZhSaYijMIAMozJ1NiEYKQArtTEHsQGNNB-RiQ-jGCMhADa9AAq1BlypO2VpNRclvxjChAgEB2QMPQAurWezACCrGzdjhIaMnKK7dQU5tJcjuhtHd30AFIT9ABiTwCyTxvvT4-clr-WL5_eg6J4AeSeADkngARFZJXjbQTCUQWfbGQ6GehsaKMHzAADuDmMbmcxGWnmkW3Yu0k6KksixADdGNhqpdjNBGBksVNqDM5gsoNAORoQCp5sKGFFYqLJBlhNkrrAMixCAAmULhZWsyjQXoQBQAax2ZGqCNgfDYRRKZRaxkC5lV6TEliQLLZ1CcKoyxI0pPcSXp6ExDA97ItXJ5DH6g1oIzGcpI4rYkpgDCCYCT6AV0CVxlVzEIABZtcZdRR9YaTeUqtQLVabaV_MZ0I7SM7UQx3azqt6AA0AYT9kgDsFJFOIbFoEGopq6e2VUaxb2E2YwjIzwnGFqp2wAkk1qEXYABGC03TqwLqngB0iVgAFoHwBmP7Fv4PgAcf1PP7PD6ngAbL-4RnmBL6TsY2Dbno0gGC2ragIwMwyGEyp1MYbAdMaDC5oWj7JIwTTrmw0gZKkdr0NAMA7sqmA4Hg4g4oShCBKy06Yc4QZLtyK4sOuoaWDB0B0cYe7sIePjHoQ57Kpe3QPg-IGwG-CSfqBv6Adpv7qqBUEaCJ1BwQh9oaMhqHSOhJINmMjAmYYwYmGYFjWD47kjtx9FYLgszMdErGwOx2CcRa2EoUaeHCARREkWF5GUQwNGiZ5XHoE5y4xgMQwJmJBybsJ27rhJbBSTJZ4WkZDniASEA-GA0SwIQL5pSQ3mMX5ZmSOG1DPE67RdkFlTQAoixwAAFD1ACUXUaGMYCjHAPWwAA1JYsBDvQADcyruBhFrzAM1WzZIpjYOYhAAESkBQRHjeqp5gfESmAVNl37fJ7RXl06q3mBj6_Xpqm3mpxb3n8QEg6Bt5A5qUOwOqL63h-CNI2BwHg2ev1gZD6qrKOPGcnxDB8gK8ztMKgkFfQRGkOutMAOp1Q1DCPaEACkxXUqVR4nmWGi0wA4owBCwPzkgMb5otOegPV9R2A2uoEw2jcKsCTb21AzTLJDzYtsDLWt9A-ttu3jh9xiHRkx065oLlXTdd3PaB_5_ueZ5vRakipKQ0mkIO9uWFYzwh55gafbc15m79KnxLeNh_DYf1_OqkMo-qX63gA7H8WehNnv5Z3HKl_oD76ZznZ6Z_-kNgb9L7KvjZLoKsThbUAA
        let option = {
            "tooltip": {
                "trigger": 'axis',
                "axisPointer": {
                    "type": 'cross',
                    "crossStyle": {
                        "color": '#999'
                    }
                }
            },
            "grid": {
                "left": 0,
                "right": 5,
                "bottom": 0,
                "containLabel": true
            },
            "legend": {
                "data": ['Température', 'Précipitation']
            },
            "xAxis": [
                {
                    "type": 'category',
                    "data": ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
                    "axisPointer": {
                        "type": 'shadow'
                    }
                }
            ],
            "yAxis": [
                {
                    "type": 'value',
                    "name": 'Précipitation',
                    "position": 'right',
                    "min": 0,
                    "max": 200,
                    "alignTicks": true,
                    "axisLabel": {
                        "formatter": '{value} mm'
                    }
                },
                {
                    "type": 'value',
                    "name": 'Température',
                    "position": 'left',
                    "min": 0,
                    "max": 40,
                    "alignTicks": true,
                    "axisLabel": {
                        "formatter": '{value} °C'
                    }
                }
            ],
            "series": [
                {
                    "name": 'Min',
                    "type": 'line',
                    "yAxisIndex": 1,
                    "data": [],
                    "lineStyle": {
                        "opacity": 0
                    },
                    "stack": 'minmax-band',
                    "symbol": 'none',
                    "tooltip": { "show": false },
                },
                {
                    "name": 'Max',
                    "type": 'line',
                    "yAxisIndex": 1,
                    "data": [],
                    "lineStyle": {
                        "opacity": 0
                    },
                    "areaStyle": {
                        "color": '#ddd'
                    },
                    "tooltip": { "show": false },
                    "stack": 'minmax-band',
                    "symbol": 'none'
                },
                {
                    "name": 'Température',
                    "type": 'line',
                    "yAxisIndex": 1,
                    "lineStyle": { "width": 3 },

                    "tooltip": {
                        "valueFormatter": function (value) {
                            return value + ' °C';
                        }
                    },
                    "itemStyle": {
                        "color": "rgba(210, 55, 55, 1)"
                    },
                    "data": []
                },
                {
                    "name": 'Précipitation',
                    "type": 'bar',
                    "barWidth": '100%',
                    "yAxisIndex": 0,
                    "barGap": 0,
                    "tooltip": {
                        "valueFormatter": function (value) {
                            return value + ' mm';
                        }
                    },
                    "itemStyle": {
                        "color": "rgba(55, 108, 181, 1)",
                        "borderColor": '#FFF'
                    },
                    "data": []
                }
            ]
        };

        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        let minTemp = 0;

        for (let rowIndex = 1; rowIndex < footerRow; rowIndex++) {

            let seriesIndex = -1;
            switch (values[rowIndex][0]) {
                case "Température min": seriesIndex = 0; break;            
                case "Température max": seriesIndex = 1; break;            
                case "Température moyenne": seriesIndex = 2; break;            
                case "Pluviométrie": seriesIndex = 3; break;

                default:
                    ;
            }

            if (seriesIndex < 0)
                continue;
        
            for (let colIndex = 1; colIndex <= 12; colIndex++) {
                option.series[seriesIndex].data.push(values[rowIndex][colIndex]);

                if (seriesIndex < 3) // temp
                    minTemp = Math.min(minTemp, values[rowIndex][colIndex]);
            }
        }

        if (option.series[0].data.length == 12 && 
            option.series[1].data.length == 12) {

            // Since the min-max is a sort of stacked area line, we need to account for the cumulated temp in the max line:
            for (let colIndex = 0; colIndex < 12; colIndex++) {
                option.series[1].data[colIndex] = option.series[1].data[colIndex] - option.series[0].data[colIndex];
            }
        }
        else {
            // Remove the min-max stack:
            option.series.shift();
            option.series.shift();
        }

        if (minTemp < 0) {
            // Adjust axes for negative temperatures
            option.yAxis[0].min = -50; // mm
            option.yAxis[0].min = -10; // °C
        }

        return this.buildParserFunction(wikiTitle, option,
            this.getChartValue("Titre", values),
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));        
    }

    buildParserFunction(wikiTitle, option, title, width, height, align) {

        // Push the content to its own JSON page

        let apiTools = getApiTools();

        if (!apiTools)
            return;

        let JsonPageTitle = wikiTitle.trim() + '/' + title.trim() + '.json';

        apiTools.createOrUpdateJsonPage(JsonPageTitle, option, "Mise à jour via l'add-on pour Google Spreadsheet™");

        // Now returns a parser function wikicode to place into the page

        let bFloat = false;

        switch (align.trim().toLowerCase()) {
            case 'droite':
            case 'right':
                bFloat = true;
                align = "| align=right";
                break;

            case 'gauche':
            case 'left':
                bFloat = true;
                align = "| align=left";
                break;

            default:
                align = "";
                break;
        }

        if (String(width).trim().length == 0)
            width = bFloat ? "500px" : "100%";

        if (String(height).trim().length == 0)
            height = "400px";

        let content = `{{#echarts: title=${title} | width=${width} | height=${height} ${align} | json = ${JsonPageTitle} }}`;

        return content;
    }

    getChartValue(fieldName, chartValues) {
        let ret = chartValues.find((row) => row[0] == fieldName);

        if (ret === undefined)
            return undefined;

        return ret[1];
    }

    getChartRowIndex(fieldName, chartValues) {
        return chartValues.findIndex((row) => row[0] == fieldName);
    }

    getChartValues(fieldName, chartValues, numCols = -1) {
        let ret = chartValues.find((row) => row[0] == fieldName);

        if (ret === undefined)
            return undefined;

        // Remove the column name and
        // keep only a number of columns
        if (numCols != -1)
            return ret.slice(1, numCols + 1);
        else
            return ret.slice(1);
    }

    getCharts() {
        return this.charts;
    }

    createChart(chartName) {
        Logger.log(`Creating new chart ${chartName}`);

        if (!this.charts.find((element) => element.name == chartName))
            return false;

        let farm = new FarmModel()
        farm.createFermeTab();

        if (chartName == "Histogramme par année") {
            this.createBarChartPerYear();
        }
        else if (chartName == "Assolement") {
            this.createTreeMap();
        }
        else if (chartName == "Rotation") {
            this.createRotation();
        }
        else if (chartName == "Radar") {
            this.createRadar();
        }
        else if (chartName == "Comptabilité") {
            this.createComptabilite();
        }
        else if (chartName == "Analyse environnementale") {
            this.createRadarEnvironnemental();
        }
        else if (chartName == "Analyse socio-économique") {
            this.createRadarSocioEconomique();
        }
        else if (chartName == "Capacité d'autoproduction") {
            this.createAutonomieChart();
        }
        else if (chartName == "Stratégie commerciale") {
            this.createStrategieCommerciale();
        }
        else if (chartName == "Diagramme ombrothermique") {
            this.createClimateGraph();
        }        
        else {
            alert("Ce graphique n'a pas encore été implémenté !");
            return;
        }

        alert("Le graphique a été ajouté à la fin de la page.");
    }

    createBarChartPerYear() {
        let sheet = SpreadsheetApp.getActiveSheet();

        const insertRow = this.createChartHeader("Histogramme par année", "Mon histogramme", "Droite");

        const totalStartRow = insertRow + 1;
        const totalEndRow = insertRow + 3;

        let year = (new Date()).getFullYear();

        let values = [
            ["Colonnes ➜", year - 3, year - 2, year - 1],
            ["Maïs", 30.0, 35.0, 40.0],
            ["Méteil", 15.0, 20.0, 15.0],
            ["Prairie permanente", 10.0, 8.0, 12.0],
            ["Total", `=sum(B${totalStartRow}:B${totalEndRow})`, `=sum(C${totalStartRow}:C${totalEndRow})`, `=sum(D${totalStartRow}:D${totalEndRow})`],
        ];

        sheet.getRange(insertRow, 1, values.length, 4).setValues(values);

        sheet.getRange(insertRow, 1, 1, 4).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        sheet.getRange(insertRow + 1, 1, 1, 1).setBackground("#fdcf74"); // Maïs
        sheet.getRange(insertRow + 2, 1, 1, 1).setBackground("#f8b26d"); // Méteil
        sheet.getRange(insertRow + 3, 1, 1, 1).setBackground("#afd095"); // Prairie
        sheet.getRange(insertRow + 4, 1, 1, 4).setFontWeight("bold").setBackground(getLightGrayColor()); // Totals

        this.createChartFooter("Vous pouvez ajouter des colonnes et des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique.");
    }

    createTreeMap() {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Assolement", "Mon assolement", "Centrer");

        let values = [
            ["Catégorie", "Assolement", "Surface"],
            ["Surface fourragère", "Prairie permanente", "25 ha"],
            ["", "Prairie temporaires", "20 ha"],
            ["", "Méteil", "12 ha"],
            ["Cultures de vente", "Blé tendre", "3 ha"],
            ["", "Moha", "15 ha"],
            ["Jachère", "", "10 ha"],
            ["SIE", "", "5 ha"]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 4).setFontWeight("bold").setBackground(getLightGrayColor()); // Columns titles

        sheet.getRange(insertRow + 1, 1, 7, 3).setVerticalAlignment("middle"); // values
        sheet.getRange(insertRow + 1, 1, 3, 1).merge().setBackground("#afd095"); // Surface fourragère
        sheet.getRange(insertRow + 4, 1, 2, 1).merge().setBackground("#ffe599"); // Cultures de vente
        sheet.getRange(insertRow + 6, 1, 1, 1).setBackground("#efefef"); // Jachère
        sheet.getRange(insertRow + 7, 1, 1, 1).setBackground("#ead1dc"); // SIE

        // Devise personnalisée pour 50 ha
        sheet.getRange(insertRow + 1, 3, 7, 1).setNumberFormat("# \\h\\a");
        sheet.getRange(insertRow, 3, 8, 1).setHorizontalAlignment('right');

        this.createChartFooter(
            "Vous pouvez ajouter des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique." +
            "Il faut fusionner la première colonne des lignes dans une même catégorie.");
    }

    createRotation() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Rotation", "Ma rotation", "Centrer", 4,
            ["Date de démarrage", "15/03/2024", "Une date à partir de laquelle on démarre la rotation", ""]);

        let values = [
            ["Cultures/couverts", "1 mois = 1 unité", "Actions menées (travail du sol, semis, couverts, mois ou sols nus)"],
            ["Colza", "3", ""],
            ["Blé dûr", "4", "Irrigation : 1500 m³/ha au total - arrosage tous les 10 jours"],
            ["Soja", "5", "Désherbage pré-levée : jusqu'à ce que le soja tombe en feuille"],
            ["Blé tendre", "6", ""],
            ["Moha", "2", ""],
            ["Jachère", "3", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 4).setFontWeight("bold").setBackground(getLightGrayColor()); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow, 1, 6, 3).setVerticalAlignment("middle"); // values
        sheet.getRange(insertRow + 1, 1, 1, 1).setBackground("#ffd966"); // colza
        sheet.getRange(insertRow + 2, 1, 1, 1).setBackground("#fff2cc"); // Blé dûr
        sheet.getRange(insertRow + 3, 1, 1, 1).setBackground("#d9ead3"); // Soja
        sheet.getRange(insertRow + 4, 1, 1, 1).setBackground("#ffe599"); // Blé tendre
        sheet.getRange(insertRow + 5, 1, 1, 1).setBackground("#d9ead3"); // Moha
        sheet.getRange(insertRow + 6, 1, 1, 1).setBackground("#efefef"); // Jachère

        // Create a HTMLRichText as an example
        var bold = SpreadsheetApp.newTextStyle()
            .setBold(true)
            .build();

        let textParts = [
            ["Préparation du sol", "cover crop (2 passages) puis herse rotative"],
            ["Labour", "tous les 3 ans"],
            ["Type de semoir", "mono simple monoshock"],
            ["Semis", "dense avec inter-rang inférieur à 80cm"],
            ["Date de semis", "27/06"],
            ["Densité de semis", "600 000 grains / ha"]];

        let richTextBuilder = SpreadsheetApp.newRichTextValue()
            .setText(textParts.map((row) => { return row.join(" : ") }).join("\n"));

        let start = 0;
        textParts.forEach((row) => {
            let end = start + row[0].length + 2;
            richTextBuilder = richTextBuilder.setTextStyle(start, end, bold);
            start += row.join(" : ").length + 1;
        });

        sheet.getRange(insertRow + 1, 3).setRichTextValue(richTextBuilder.build());

        this.createChartFooter(
            "Vous pouvez ajouter des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique." +
            "Vous pouvez mettre des retours chariot (ctrl-entrée), du gras et de l'italique dans la colonne Actions Menées.");
    }

    createRadar() {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Radar", "Mon radar", "Droite");

        let values = [
            ["", "Une ferme", "Moyenne", "Max"],
            ["Un axe", 8, 6, 10],
            ["Autre chose", 7, 5, 10],
            ["Un super indicateur", 9, 5, 10],
            ["Quelque chose de pertinent", 10, 8, 10],
            ["Un autre indicateur", 6, 4, 10]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 4).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        this.createChartFooter(
            "Vous pouvez ajouter ou supprimer des lignes. Vous ne devez pas changer le titre de la colonne Moyenne et Max. La colonne Max doit être remplie !");
    }

    createComptabilite() {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Comptabilité", "Ma comptabilité", "Centrer", 6);

        const jsonString = HtmlService.createHtmlOutputFromFile("definitions/compta_defs_fr.html").getContent();
        const definitionsDesPostesCompta = JSON.parse(jsonString);

        let year = (new Date()).getFullYear();

        sheet.getRange(insertRow, 1, 1, 6).setValues([["", "Année", year - 4, year - 3, year - 2, year - 1]])
            .setFontWeight("bold")
            .setFontSize(13)
            .setBackground(getLightGrayColor());

        let currentRow = insertRow + 1;
        let posteTotalRow = 6;
        let totals = new Map();

        for (const [compte, postesDuCompte] of Object.entries(definitionsDesPostesCompta)) {

            let totauxRows = [];

            for (const [postePrincipal, definition] of Object.entries(postesDuCompte)) {
                let posteRowStart = currentRow;

                definition.postes.forEach((unPoste) => {

                    totals.set(unPoste, currentRow);

                    sheet.getRange(currentRow++, 1, 1, 2).setValues([
                        [postePrincipal, unPoste]
                    ]);
                });

                // Now add a row for the total
                posteTotalRow = currentRow++;

                if (compte != "Soldes de gestion") {
                    totauxRows.push(posteTotalRow);

                    sheet.getRange(posteTotalRow, 1, 1, 2).setValues([
                        [postePrincipal, "Total"]
                    ]);

                    sheet.getRange(posteTotalRow, 3, 1, 4).setFormulas([
                        [`=SUM(C${posteRowStart}:C${posteTotalRow - 1})`,
                        `=SUM(D${posteRowStart}:D${posteTotalRow - 1})`,
                        `=SUM(E${posteRowStart}:E${posteTotalRow - 1})`,
                        `=SUM(F${posteRowStart}:F${posteTotalRow - 1})`]
                    ]);

                    sheet.getRange(posteTotalRow, 1, 1, 6)
                        .setFontWeight("bold")
                        .setFontSize(12)
                        .setBackground(definition.color);

                    totals.set(postePrincipal, posteTotalRow);
                }
                else {
                    // Specific case for "Soldes de gestion"
                    Logger.log("Paramètres de auxiliaires :" + [...totals.entries()]);

                    sheet.getRange(posteTotalRow, 1, 3, 2).setValues([
                        [postePrincipal, "EBE total"],
                        [postePrincipal, "Valeur ajoutée"],
                        [postePrincipal, "Capacité d'autofinancement"]
                    ]);

                    // "EBE total": "Total des produits - Total des charges",
                    let cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges}`);
                    });
                    posteTotalRow++;

                    // "Valeur ajoutée": "Total des produits - charges sauf personnel"
                    cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        let personnel = totals.get('Charges de personnel');
                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges} + ${c}${personnel}`);
                    });
                    posteTotalRow++;

                    // "Capacité d'autofinancement": "Valeur ajoutée - frais financiers"
                    cIndex = 3;
                    ['C', 'D', 'E', 'F'].forEach((c) => {
                        let produits = totals.get('Produits');
                        let charges = totals.get('Charges');
                        let personnel = totals.get('Charges de personnel');
                        let annuites = totals.get('Annuité de remboursement');

                        sheet.getRange(posteTotalRow, cIndex++).setFormula(`=${c}${produits} - ${c}${charges} + ${c}${personnel} - ${c}${annuites}`);
                    });

                    // Style
                    sheet.getRange(posteTotalRow - 2, 1, 3, 6)
                        .setFontWeight("bold")
                        .setFontSize(12)
                        .setBackground(definition.color);
                }

                // Merge the cells in column A
                sheet.getRange(posteRowStart, 1, posteTotalRow - posteRowStart + 1, 1)
                    .merge()
                    .setBackground(definition.color)
                    .setFontWeight("bold")
                    .setFontSize(13)
                    .setHorizontalAlignment("center")
                    .setVerticalAlignment("middle")
                    .setWrap(true);
            }

            if (compte != "Soldes de gestion") {
                // Add a total row (totauxRows)
                posteTotalRow += 2;

                let cIndex = 3;
                ['C', 'D', 'E', 'F'].forEach((c) => {
                    let sumItems = totauxRows.map((r) => `${c}${r}`);

                    sheet.getRange(posteTotalRow, cIndex++).setFormula("=" + sumItems.join('+'));
                });

                sheet.getRange(posteTotalRow, 1).setValue("Total des " + compte.toLowerCase());
                sheet.getRange(posteTotalRow, 1, 1, 6)
                    .setFontWeight("bold")
                    .setFontSize(13)
                    .setBackground(getLightGrayColor());

                totals.set(compte, posteTotalRow);

                posteTotalRow++;
                currentRow = posteTotalRow + 1;
            }
        }

        sheet.getRange(insertRow + 1, 3, posteTotalRow, 4)
            .setNumberFormat("#,##0 €");

        this.createChartFooter("Vous pouvez ajouter ou supprimer des lignes, et ajouter de nouvelles colonnes pour chaque année.", 6);
    }

    createRadarEnvironnemental() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Analyse environnementale", "Analyse environnementale", "Droite", 3);

        let values = [
            ["", "Nom de la ferme", "Moyenne"],
            ["Taux de MO", 3.6, 4.9],
            ["Couverture de sol", 100, 97],
            ["Biodiversité", 60, 52],
            ["Non travail du sol", 100, 70],
            ["Absence de chimie", 0, 0],
            ["Nombre d'espèces cultivées", 30, 30]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 3).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow + 1, 2, 1, 2)
            .setNumberFormat("0.0");
        sheet.getRange(insertRow + 2, 2, 5, 2)
            .setNumberFormat("0");

        this.createChartFooter(
            "Vous ne pouvez pas ajouter des lignes, mais vous pouvez supprimer celles qui ne concernent pas la ferme. "
            + " N'oubliez pas de changer le nom de la ferme (entête de colonne).", 3);
    }

    createRadarSocioEconomique() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Analyse socio-économique", "Analyse socio-économique", "Droite", 3);

        let values = [
            ["", "Nom de la ferme", "Moyenne"],
            ["Satisfaction économique", 10, 7],
            ["Satisfaction sociale", 10, 8],
            ["Cadre de vie", 9, 8],
            ["Coopération", 2, 0],
            ["Efficacité temps de travail", 30, 12],
            ["EBE/UTH", 24264, 13545],
            ["Confort au travail", 8, 7]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 3).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow + 1, 2, 7, 2)
            .setNumberFormat("0");

        this.createChartFooter(
            "Vous ne pouvez pas ajouter des lignes, mais vous pouvez supprimer celles qui ne concernent pas la ferme. "
            + " N'oubliez pas de changer le nom de la ferme (entête de colonne).", 3);
    }

    createAutonomieChart() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Capacité d'autoproduction", "Capacité d'autoproduction", "Droite", 3);
        // EChart Capacité d'autoproduction MSV
        let values = [
            ["", "Nom de la ferme", "Moyenne"],
            ["Semences", 3, 7],
            ["Plants", 90, 72],
            ["Légumes", 100, 85],
            ["MO", 10, 19]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 3).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow + 1, 2, 7, 2)
            .setNumberFormat("0");

        this.createChartFooter(
            "Vous ne pouvez pas ajouter des lignes, mais vous pouvez supprimer celles qui ne concernent pas la ferme. "
            + " N'oubliez pas de changer le nom de la ferme (entête de colonne).", 3);
    }

    getAnalyseChart(range) {
        const values = range.getValues();

        let args = new Map();

        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        let columnsFound = false;

        for (let rowIndex = 1; rowIndex < footerRow; rowIndex++) {
            let [nomAxe, value, average] = values[rowIndex];

            if (average == "Moyenne") {
                args.set('Nom de la ferme', value);
                columnsFound = true;
                continue;
            }

            if (!columnsFound)
                continue;

            if (nomAxe.trim().length == 0 &&
                value.trim().length == 0 &&
                average.trim().length == 0)
                break;

            args.set(nomAxe, Number(value));
            args.set(nomAxe + ' moyenne', Number(average));
        }

        return args;
    }

    // {{EChart Stratégie commerciale MSV
    createStrategieCommerciale() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Stratégie commerciale", "Stratégie commerciale", "Droite", 3);

        const totalStartRow = insertRow + 1;
        const totalEndRow = insertRow + 9;

        let values = [
            ["", "Nom de la ferme"],
            ["AMAP", 0.3],
            ["Marché", 0],
            ["Vente à la ferme", 0.23],
            ["Magasin", 0],
            ["Restaurants et Cantines", 0],
            ["Grossiste", 0],
            ["Paniers", 0],
            ["Revendeurs", 0],
            ["GMS", 0],
            ["Autres", `=1 - sum(B${totalStartRow}:B${totalEndRow})`],
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 3).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow + 1, 2, 10, 1)
            .setNumberFormat("0 \%");

        this.createChartFooter(
            "Vous ne pouvez pas ajouter des lignes, mais vous pouvez supprimer celles qui ne concernent pas la ferme. "
            + " N'oubliez pas de changer le nom de la ferme (entête de colonne).", 3);
    }

    createClimateGraph() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = this.createChartHeader("Diagramme ombrothermique", "Diagramme ombrothermique", "Droite", 13);

        const totalStartRow = insertRow + 1;
        const totalEndRow = insertRow + 9;

        let values = [
            ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
            ["Pluviométrie", "73", "67", "70", "96", "82", "63", "39", "44", "91", "128", "143", "86"],
            ["Température moyenne", "4,5", "4,7", "7,5", "10,5", "14,6", "19", "21,5", "21,4", "17,6", "13,9", "8,9", "5,5"],
            ["Température max", "8,6", "9,1", "12,2", "14,9", "18,6", "22,8", "25,4", "25,4", "21,4", "17,4", "12,5", "9,6"],
            ["Température min", "0,9", "0,3", "2,7", "5,6", "9,7", "14,2", "16,8", "17", "13,8", "10,4", "5,4", "2"]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, 13).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col

        sheet.getRange(insertRow + 1, 2, 1, 12).setNumberFormat("0 \\m\\m");
        sheet.getRange(insertRow + 2, 2, 3, 12).setNumberFormat("0.0 °C");

        this.createChartFooter(
            "Ne modifiez pas les lignes et les entêtes. Vous pouvez laisser les lignes vides si vous n'avez pas les valeurs", 13);
    }

    getStrategieCommerciale(range) {
        const values = range.getValues();

        let args = new Map();

        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        let columnsFound = false;

        for (let rowIndex = 1; rowIndex < footerRow; rowIndex++) {
            let [nomAxe, value] = values[rowIndex];

            if (!columnsFound &&
                nomAxe.trim().length == 0 &&
                value.trim().length > 0) {
                args.set('Nom de la ferme', value);
                columnsFound = true;
                continue;
            }

            if (!columnsFound)
                continue;

            if (nomAxe.trim().length == 0 &&
                value.trim().length == 0)
                break;

            args.set(nomAxe, Number(value) * 100);
        }

        return args;
    }

    /**
     * Returns the row where to add the rest of the chart
     * @param {*} insertRow 
     * @returns 
     */
    createChartHeader(chartType, chartExampleName, defaultAlign, cols = 4, additionalData = []) {
        let sheet = SpreadsheetApp.getActiveSheet();

        // Create the new charts after the last non empty row
        const insertRow = sheet.getLastRow() + 2;

        let values = [
            ["Graphique", chartType, "", ""],
            ["Titre", chartExampleName, "", ""],
            ["Alignement", defaultAlign, "Centrer / Droite / Gauche", ""],
            ["Largeur", "", "Par défaut : 500px", ""],
            ["Hauteur", "", "Par défaut : 400px", ""]
        ];

        if (additionalData.length > 0)
            values.push(additionalData);

        values.push(["", "", "", ""]);

        sheet.setActiveRange(sheet.getRange(insertRow, 1, values.length, 4).setValues(values));

        sheet.getRange(insertRow, 1, 1, cols).setFontWeight("bold").setBackground(getLightGrayColor()); // Header
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        sheet.getRange(insertRow, 3, values.length, 1).setFontStyle("italic"); // doc col
        sheet.getRange(insertRow + 1, 2, 1, 1).setFontWeight("bold").setFontSize(13); // Title

        return insertRow + values.length;
    }

    createChartFooter(documentation, cols = 4) {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = sheet.getLastRow() + 1;

        let values = [
            ["", "", "", ""],
            ["Documentation", "", "", ""],
            [documentation, "", "", ""],
            ["", "", "", ""],
            ["Fin du graphique", "(garder cette ligne intacte)", "", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, 4).setValues(values);

        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        sheet.getRange(insertRow + 2, 1, 1, cols).merge().setFontStyle("italic").setFontWeight("normal").setWrap(true); // doc
        sheet.getRange(insertRow + 4, 1, 1, cols).setFontWeight("bold").setBackground(getLightGrayColor()); // End

        SpreadsheetApp.flush();
    }
}