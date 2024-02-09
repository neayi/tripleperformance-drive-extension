class chartsBuilder {
    constructor() {
        this.charts = ["Histogramme par année", "Assolement", "Rotation", "Radar"];
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
        Logger.log("Synchronisation du graphique " + chartname);

        const range = this.getRangeForChart(chartname);

        if (!range) {
            SpreadsheetApp.getUi().alert("Impossible de trouver le chart complet pour " + chartname + ". " +
                "Il est possible qu'il ait été modifié dans sa structure, vérifiez en particulier qu'il y " +
                "ait bien la ligne \"Graphique\" et la ligne \"Fin du graphique\"");
            return;
        }

        const values = range.getValues();

        Logger.log(values);

        const chartType = this.getChartValue("Graphique", values);
        let chart = {};
        switch (chartType) {
            case "Histogramme par année":
                chart = this.getBarChartPerYear(range);
                break;

            case "Assolement":
                chart = this.getTreeMap(range);
                break;

            case "Rotation":
                chart = this.getRotation(range);
                break;

            case "Radar":
                chart = this.getRadar(range);
                break;

            default:
                SpreadsheetApp.getUi().alert("Le type de graphique de " + chartname +
                    "n'a pas été reconnu et ne peut pas être traité.");
                break;
        }

        if (!chart) {
            return;
        }

        Logger.log("syncComptabiliteToWiki");

        let farm = new FarmModel()
        let wikiTitle = farm.getFarmPageTitle();

        if (!wikiTitle)
            return;

        let apiTools = getApiTools();
        let pageContent = apiTools.getPageContent(wikiTitle)
            + "\n\n" + chart;

        apiTools.updateWikiPage(wikiTitle, pageContent, "Ajout du graphique " + chartname);

        Logger.log("Le nouveau graphique a été ajouté en bas de la page " + wikiTitle);

        SpreadsheetApp.getUi().alert("Le nouveau graphique a été ajouté en bas de la page du wiki");
    }

    getBarChartPerYear(range) {
        const values = range.getValues();
        var bgColors = range.getBackgrounds();

        let option = {
            "tooltip": {},
            "legend": {
                "bottom": 15
            },
            "grid": {
                "left": 70
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
                "name": "",
                "nameLocation": "middle",
                "nameGap": 50,
                "nameTextStyle": {
                    "fontWeight": "bold",
                    "fontSize": 18
                },
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

        option.yAxis.name = this.getChartValue("Titre", values);

        const headerRow = this.getChartRowIndex("Colonnes ➜", values);
        const footerRow = this.getChartRowIndex("Total", values);
        Logger.log(`header and footer : ${headerRow} - ${footerRow}`);

        for (let rowIndex = headerRow + 1; rowIndex < footerRow; rowIndex++) {
            let series = {
                "type": "bar",
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

        return this.buildParserFunction(option,
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));
    }

    getTreeMap(range) {
        const values = range.getValues();
        const bgColors = range.getBackgrounds();
        const fgColors = range.getFontColorObjects();
        const title = this.getChartValue("Titre", values);

        let option = {
            tooltip: {
                formatter: (info) => {
                    var value = info.value;
                    var name = info.name;
                    let percent =
                        '(' + Math.round((100 * value) / info.treeAncestors[0].value) + '%)';
                    return name + ' : ' + value + 'ha ' + percent;
                }
            },
            series: [
                {
                    type: 'treemap',
                    itemStyle: {
                        borderWidth: 0,
                        gapWidth: 2
                    },
                    name: title,
                    data: []
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
                value = Number.parseFloat(value);

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

        let parserFunction = this.buildParserFunction(option,
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));

        // Hack because JSON.Stringify would remove our formater function from the tooltip
        parserFunction = parserFunction.replace('"tooltip": {},', `tooltip: {
            formatter: (info) => {
                var value = info.value;
                var name = info.name;
                let percent =
                    '(' + Math.round((100 * value) / info.treeAncestors[0].value) + '%)';
                return name + ' : ' + value + 'ha ' + percent;
            }
        },`);

        return parserFunction;
    }

    getRotation(range) {
        const values = range.getValues();
        const bgColors = range.getBackgrounds();
        const richTextValues = range.getRichTextValues();

        const title = this.getChartValue("Titre", values);

        let option = {
            title: {
                text: title,
                left: 'center'
            },
            tooltip: {
                formatter: (item) => {
                    return item.data?.description ?? '';
                }
            },
            series: []
        };

        const headerRow = this.getChartRowIndex("Cultures/couverts", values);
        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        Logger.log(`header and footer : ${headerRow} - ${footerRow}`);

        // Build the crop ring
        let crops = {
            name: 'Rotation',
            type: 'pie',
            radius: ['70%', '90%'],
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

            // escape HTML because our extension tends to lose them
            description = description.replace(/&/g, "¤amp;")
                .replace(/</g, "¤lt;")
                .replace(/>/g, "¤gt;")
                .replace(/"/g, "¤quot;");

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
            radius: ['60%', '70%'],
            label: {
                position: 'inner',
                rotate: 'tangential'
            },
            tooltip: { show: false },
            itemStyle: {
                borderColor: '#555',
                color: '#FFFFFF',
                borderWidth: 1
            },
            data: []
        };
        let monthsPerYear = new Map();
        let currentDate = this.getChartValue("Date de démarrage", values);
        for (let month = 1; month <= totalMonths; month++) {
            let monthName = currentDate.toLocaleDateString(undefined, { month: 'short' });

            let item = { 'name': monthName, 'value': 1 };
            const year = currentDate.getFullYear();
            if (year % 2 == 0)
                item.itemStyle = { color: '#EEE' };

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
            radius: ['45%', '60%'],
            label: {
                position: 'inner',
                rotate: 'tangential'
            },
            tooltip: {
                show: false
            },
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

        let parserFunction = this.buildParserFunction(option,
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));

        // Hack because JSON.Stringify would remove our formater function from the tooltip
        parserFunction = parserFunction.replace('"tooltip":{},', `tooltip: {
            formatter: (item) => {
              return item.marker + "&lt;b&gt;" + item.name + "&lt;/b&gt;&lt;br&gt;" +
                 item.data.description
                    .replaceAll('¤amp;' , '&amp;')
                    .replaceAll('¤lt;'  , '&lt;')
                    .replaceAll('¤gt;'  , '&gt;')
                    .replaceAll('¤quot;', '&quot;');
            }
          },`);

        return parserFunction;
    }

    getRadar(range) {
        const values = range.getValues();
        const title = this.getChartValue("Titre", values);

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
                                "label": {"show": true}
                            },
                            "itemStyle": {"width": 3, "color": "#f1894c"},
                            "lineStyle": {"width": 3, "color": "#f1894c"},
                            "areaStyle": {"color": "#f1894c"}
                        },
                        {
                            "value": [],
                            "name": "Moyenne",
                            "emphasis": {
                                "title": {"show": true},
                                "label": {"show": true}
                            },
                            "lineStyle": {"width": 3}
                        }
                    ]
                }
            ]
        };

        const footerRow = this.getChartRowIndex("Fin du graphique", values);
        let hasMoyenne = false;
        for (let rowIndex = 1; rowIndex < footerRow; rowIndex++) {
            let [nomAxe, value, average, max] = values[rowIndex];

            if (average == "Moyenne")
            {
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

        return this.buildParserFunction(option,
            this.getChartValue("Largeur", values),
            this.getChartValue("Hauteur", values),
            this.getChartValue("Alignement", values));
    }

    buildParserFunction(option, width, height, align) {

        let bFloat = false;

        switch (align.trim().toLowerCase()) {
            case 'droite':
            case 'right':
                bFloat = true;
                align = "\n| align=right";
                break;

            case 'gauche':
            case 'left':
                bFloat = true;
                align = "\n| align=left";
                break;

            default:
                align = "";
                break;
        }

        if (String(width).trim().length == 0)
            width = bFloat ? "500px" : "100%";

        if (String(height).trim().length == 0)
            height = "400px";

        let content = `{{#echarts:
  width=${width}
| height=${height}${align}
| option = ${JSON.stringify(option).replaceAll('}}', '} }').replaceAll('{{', '{ {')};
}}`;
        if (bFloat)
            content += "\nVous pouvez ajouter le texte qui accompagne le graphique ici.\n\n{{Clear}}\n";

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
        if (!this.charts.includes(chartName))
            return false;

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

    }

    createBarChartPerYear() {
        let sheet = SpreadsheetApp.getActiveSheet();

        const insertRow = sheet.getLastRow() + 2;
        const totalStartRow = insertRow + 7;
        const totalEndRow = insertRow + 9;

        let values = [
            ["Graphique", "Histogramme par année", "", ""],
            ["Titre", "Votre titre", "", ""],
            ["Alignement", "Centrer", "Centrer / Droite / Gauche", ""],
            ["Largeur", "500px", "Par défaut : 500px", ""],
            ["Hauteur", "400px", "Par défaut : 400px", ""],
            ["", "", "", ""],
            ["Colonnes ➜", "2019", "2020", "2021"],
            ["Maïs", 30.0, 35.0, 40.0],
            ["Méteil", 15.0, 20.0, 15.0],
            ["Prairie permanente", 10.0, 8.0, 12.0],
            ["Total", `=sum(B${totalStartRow}:B${totalEndRow})`, `=sum(C${totalStartRow}:C${totalEndRow})`, `=sum(D${totalStartRow}:D${totalEndRow})`],
            ["", "", "", ""],
            ["Documentation", "", "", ""],
            ["Vous pouvez ajouter des colonnes et des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique.", "", "", ""],
            ["", "", "", ""],
            ["Fin du graphique", "(garder cette ligne intacte)", "", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Header
        sheet.getRange(insertRow + 6, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow + 10, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Totals
        sheet.getRange(insertRow + 15, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // End
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        sheet.getRange(insertRow + 2, 3, 3, 1).setFontStyle("italic"); // doc col

        sheet.getRange(insertRow + 1, 2, 1, 1).setFontWeight("bold").setFontSize(13); // Title

        sheet.getRange(insertRow + 7, 1, 1, 1).setBackground("#fdcf74");
        sheet.getRange(insertRow + 8, 1, 1, 1).setBackground("#f8b26d");
        sheet.getRange(insertRow + 9, 1, 1, 1).setBackground("#afd095");

        sheet.getRange(insertRow + 13, 1, 1, 4).merge().setFontStyle("italic").setWrap(true);
    }

    createTreeMap() {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = sheet.getLastRow() + 2;

        let values = [        
            ["Graphique", "Assolement", ""],
            ["Titre", "Mon assolement", ""],
            ["Alignement", "Centrer", "Centrer / Droite / Gauche"],
            ["Largeur", "", "Par défaut : 500px"],
            ["Hauteur", "", "Par défaut : 400px"],
            ["", "", ""],
            ["Catégorie", "Assolement", "Surface"],
            ["Surface fourragère", "Prairie permanente", "25 ha"],
            ["", "Prairie temporaires", "20 ha"],
            ["", "Méteil", "12 ha"],
            ["Cultures de vente", "Blé tendre", "3 ha"],
            ["", "Moha", "15 ha"],
            ["Jachère", "", "10 ha"],
            ["SIE", "", "5 ha"],
            ["", "", ""],
            ["Documentation", "", ""],
            ["Vous pouvez ajouter des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique."+
             "Il faut fusionner la première colonne des lignes dans une même catégorie.", "", ""],
            ["", "", ""],
            ["Fin du graphique", "(garder cette ligne intacte)", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Header
        sheet.getRange(insertRow + 6, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Columns titles
        sheet.getRange(insertRow + 18, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // End
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        
        sheet.getRange(insertRow + 2, 3, 3, 1).setFontStyle("italic"); // doc col
        sheet.getRange(insertRow + 16, 1, 1, 3).merge().setFontStyle("italic").setFontWeight("normal").setWrap(true); // doc

        sheet.getRange(insertRow + 1, 2, 1, 1).setFontWeight("bold").setFontSize(13); // Chart title

        sheet.getRange(insertRow + 7,  1, 7, 3).setVerticalAlignment("middle"); // values
        sheet.getRange(insertRow + 7,  1, 3, 1).merge().setBackground("#afd095"); // Surface fourragère
        sheet.getRange(insertRow + 10, 1, 2, 1).merge().setBackground("#ffe599"); // Cultures de vente
        sheet.getRange(insertRow + 12, 1, 1, 1).setBackground("#efefef"); // Jachère
        sheet.getRange(insertRow + 13, 1, 1, 1).setBackground("#ead1dc"); // SIE

        // Devise personnalisée pour 50 ha
        sheet.getRange(insertRow + 7, 3, 7, 1).setNumberFormat("# \\h\\a");
        sheet.getRange(insertRow + 6, 3, 8, 1).setHorizontalAlignment('right');
    }

    createRotation() {

        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = sheet.getLastRow() + 2;

        let values = [        
            ["Graphique", "Rotation", ""],
            ["Titre", "Ma rotation", ""],
            ["Alignement", "Centrer", "Centrer / Droite / Gauche"],
            ["Largeur", "", "Par défaut : 500px"],
            ["Hauteur", "", "Par défaut : 400px"],
            ["Date de démarrage", "15/03/2024", "Une date à partir de laquelle on démarre la rotation"],
            ["", "", ""],
            ["Cultures/couverts", "1 mois = 1 unité", "Actions menées (travail du sol, semis, couverts, mois ou sols nus)"],
            ["Colza", "3", ""],
            ["Blé dûr", "4", "Irrigation : 1500 m³/ha au total - arrosage tous les 10 jours"],
            ["Soja", "5", "Désherbage pré-levée : jusqu'à ce que le soja tombe en feuille"],
            ["Blé tendre", "6", ""],
            ["Moha", "2", ""],
            ["Jachère", "3", ""],
            ["", "", ""],
            ["Documentation", "", ""],
            ["Vous pouvez ajouter des lignes. Si les entêtes de ligne sont sur fond de couleur, alors cette couleur sera reprise dans le graphique."+
             "Vous pouvez mettre des retours chariot (ctrl-entrée), du gras et de l'italique dans la colonne Actions Menées.", "", ""],
            ["", "", ""],
            ["Fin du graphique", "(garder cette ligne intacte)", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Header
        sheet.getRange(insertRow + 7, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Columns titles
        sheet.getRange(insertRow + 18, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // End
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        
        sheet.getRange(insertRow + 2, 3, 4, 1).setFontStyle("italic"); // doc col
        sheet.getRange(insertRow + 16, 1, 1, 3).merge().setFontStyle("italic").setFontWeight("normal").setWrap(true); // doc

        sheet.getRange(insertRow + 1, 2, 1, 1).setFontWeight("bold").setFontSize(13); // Chart title

        sheet.getRange(insertRow + 8,  1, 6, 3).setVerticalAlignment("middle"); // values
        sheet.getRange(insertRow + 8,  1, 1, 1).setBackground("#ffd966"); // colza
        sheet.getRange(insertRow + 9,  1, 1, 1).setBackground("#fff2cc"); // Blé dûr
        sheet.getRange(insertRow + 10, 1, 1, 1).setBackground("#d9ead3"); // Soja
        sheet.getRange(insertRow + 11, 1, 1, 1).setBackground("#ffe599"); // Blé tendre
        sheet.getRange(insertRow + 12, 1, 1, 1).setBackground("#d9ead3"); // Moha
        sheet.getRange(insertRow + 13, 1, 1, 1).setBackground("#efefef"); // Jachère

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
            
        sheet.getRange(insertRow + 8, 3).setRichTextValue(richTextBuilder.build());
    }

    createRadar() {
        let sheet = SpreadsheetApp.getActiveSheet();
        const insertRow = sheet.getLastRow() + 2;

        let values = [
            ["Graphique", "Radar", "", ""],
            ["Titre", "Votre radar", "", ""],
            ["Alignement", "Centrer", "Centrer / Droite / Gauche", ""],
            ["Largeur", "500px", "Par défaut : 500px", ""],
            ["Hauteur", "400px", "Par défaut : 400px", ""],
            ["", "", "", ""],
            ["", "Une ferme", "Moyenne", "Max"],
            ["Un axe",                      8, 6, 10],
            ["Autre chose",                 7, 5, 10],
            ["Un super indicateur",         9, 5, 10],
            ["Quelque chose de pertinent", 10, 8, 10],
            ["Un autre indicateur",         6, 4, 10],
            ["", "", "", ""],
            ["Documentation", "", "", ""],
            ["Vous pouvez ajouter ou supprimer des lignes. La colonne max est obligatoire !", "", "", ""],
            ["", "", "", ""],
            ["Fin du graphique", "(garder cette ligne intacte)", "", ""]
        ];

        sheet.getRange(insertRow, 1, values.length, values[0].length).setValues(values);

        sheet.getRange(insertRow, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // Header
        sheet.getRange(insertRow + 6, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()).setHorizontalAlignment('right'); // Columns titles
        sheet.getRange(insertRow + 16, 1, 1, values[0].length).setFontWeight("bold").setBackground(getLightGrayColor()); // End
        sheet.getRange(insertRow, 1, values.length, 1).setFontWeight("bold"); // First col
        
        sheet.getRange(insertRow + 2, 3, 3, 1).setFontStyle("italic"); // doc col
        sheet.getRange(insertRow + 14, 1, 1, 4).merge().setFontStyle("italic").setFontWeight("normal").setWrap(true); // doc

        sheet.getRange(insertRow + 1, 2, 1, 1).setFontWeight("bold").setFontSize(13); // Title
    }

}