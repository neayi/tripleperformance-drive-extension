class wikiPage {
    /**
     * This class makes page modifications on the wiki easy. There's no communication with the wiki, only text manipulations
     */


    /**
     * Add value to a template in the page
     * String pageContent The content of the page (wikitext)
     * String template The template to look for. If the template is not found, the content is left untouched
     * String fieldname The name of the field to add to the template
     * String newValue The content to add for this field. If null, then the field is removed from the template.
     * Bool bIgnoreWhenExisting If true, the existing field will not be touched if already present. If false it'll be overwritten.
     *
     * Returns the new content is the content has been changed, false otherwise
     */
    addValueToTemplate(pageContent, template, fieldname, newValue, bIgnoreWhenExisting) {
        const re = new RegExp('{{' + template + '(\s*\|[^}]*)}}|{{' + template + '\s*}}', 'i');

        let new_args = new Map();

        let matches = pageContent.match(re);
        if (!matches || matches.length == 0) {
            console.log("Template '" + template + "' not found in page. Skipping.");
            return false;
        }

        if (matches[1] != "") {
          let templateContent = matches[1].trim();

          let existing_args = templateContent.match(/((\|[^|=]+=).*)+/gm);

          let fieldnames = [];
          existing_args.forEach(part => {
            part = part.replace(/=.*/, '');
            fieldnames.push(part.trim().replace(/^[| ]+/, ''));
            templateContent = templateContent.replace(part + '=', '¤@¤@');
          });
          let values = templateContent.split('¤@¤@').map((x) => x.trim());
          values.shift();

          fieldnames.forEach((field, i) => {
            new_args.set(field.toLowerCase(), field + " = " + values[i]);
          });
        }

        let key = fieldname.toLowerCase();

        if (newValue === null) // Remove the field from the template
        {
            if (!new_args.has(key))
                return false;

            new_args.delete(key);
        }
        else {
            if (new_args.has(key)) {
                if (bIgnoreWhenExisting)
                    return false;

                if (new_args.get(key) == fieldname + " = " + newValue)
                    return false; // Exists but is already the same
            }

            new_args.set(key, fieldname + " = " + newValue);
        }

        return this.replaceTemplate(template, template, new_args, pageContent);
    }

    /**
     * Replaces oldTemplate with newTemplate, using newParams
     * newParams must be a scalar array with values of the form : "fieldname = value"
     */
    replaceTemplate(oldTemplate, newTemplate, newParams, pageContent) {

        const re = new RegExp("{{" + oldTemplate + '(\s*\|[^}]*)}}|{{' + oldTemplate + "\s*}}", 'i');

        let newTemplateCode = this.buildTemplateFromMap(newTemplate, newParams);

        console.log("In replaceTemplate - " + newTemplateCode);
        return pageContent.replace(re, newTemplateCode);
    }


    /**
     * Build a template our of a list of parameters (already in the form "k=v")
     * @param {*} templateName 
     * @param {*} params 
     * @returns 
     */
    buildTemplateFromMap(templateName, params) {
        var newParameters = new Array();

        if (params instanceof Array) {
            newParameters = params;
        }
        else if (params instanceof Map) {
            for (let value of params.values()) {
                newParameters.push(value);
            }
        }
        else {
            for (let value of Object.values(params)) {
                newParameters.push(value);
            }
        }

        return '{{' + templateName + "\n| " + newParameters.join("\n| ") + "\n}}";
    }

    /**
     * If a template already exists, only updates the parameters that are passed in and leave the other params already in the template untouched.
     * If the template doesn't exist, add the template at the end of the content
     * 
     * @param {*} templateName the name of the template to look for
     * @param {*} newParams the new params to update. Expects a map of key value pairs
     * @param {*} pageContent the original page content
     * @param {*} keepExistingValues if false, the template will be emptied before being filled again
     * 
     * @returns String the new page content
     */
    updateTemplate(templateName, newParams, pageContent, keepExistingValues = true) {
        let matches = [];
        
        if (pageContent && pageContent.length > 0)
        {
            const re = new RegExp('{{' + templateName + '(\s*\|[^}]*)}}|{{' + templateName + '\s*}}', 'i');
            matches = pageContent.match(re);
        }
        else 
            pageContent = '';

        if (!matches || matches.length == 0) {
            // The template was not in the page yet
            let new_args = new Map();

            newParams.forEach((paramValue, paramName) => {
                let key = paramName.toLowerCase();
                new_args.set(key, paramName + " = " + paramValue);
            });

            return pageContent + this.buildTemplateFromMap(templateName, new_args);
        }
        else {
            let new_args = new Map();
            
            if (keepExistingValues)
            {
                // Update the existing array of parameters
                let existing_args = [];
                if (matches[1] != "")
                    existing_args = matches[1].split('|').map((x) => x.trim());

                existing_args.shift(); // Remove the template name

                existing_args.forEach(function (anArg) {
                    let parts = anArg.split('=');

                    if (parts.length == 1)
                        throw new Error("This template has unnamed parameters - cannot update");

                    let field = parts.shift().trim();
                    let value = parts.join('=').trim();
                    new_args.set(field.toLowerCase(), field + " = " + value);
                });
            }

            // If one of the new params is a Tag, then clear all 
            // the existing tags to override with the new ones only
            newParams.forEach((paramValue, paramName) => {
                let key = paramName.toLowerCase();

                if (key.match(/tag [0-9]+/)) {
                    // Remove all existing tags
                    new_args.forEach((param, existingkey) => {
                        if (existingkey.match(/tag [0-9]+/))
                            new_args.delete(existingkey);
                    });
                }
            });

            // Now add or replace the params with the new values
            newParams.forEach((paramValue, paramName) => {
                let key = paramName.toLowerCase();
                new_args.set(key, paramName + " = " + paramValue);
            });

            return this.replaceTemplate(templateName, templateName, new_args, pageContent);
        }
    }

    /**
     * Replaces oldTemplate with newTemplate, using newParams
     * newParams must be a scalar array with values of the form : "fieldname = value"
     */
    replaceParserFunction(parserFunctionName, newContent, pageContent) {

        const re = new RegExp('{{#' + parserFunctionName + '(\\s*:[^}]*)}}', 'i');

        return pageContent.replace(re, newContent);
    }

    /**
     * Replaces oldTemplate with newTemplate, using newParams
     * newParams must be a scalar array with values of the form : "fieldname = value"
     */
    hasParserFunction(parserFunctionName, pageContent) {

        const re = new RegExp('{{#' + parserFunctionName + '(\s*:[^}]*)}}', 'i');

        return pageContent.match(re);
    }


    /**
     * Removes oldTemplate
     */
    removeTemplate(oldTemplate, pageContent) {
        const re = new RegExp("{{" + oldTemplate + '(\s*\|[^}]*)}}|{{' + oldTemplate + "\s*}}", 'i');
        return pageContent.replace(re, '');
    }

    /**
     * Finds a template in the page a return the list of params
     */
    getTemplateParams(pageContent, template) {
        let args = new Map();

        const re = new RegExp("{{" + template + '(\s*\|[^}]*)}}|{{' + template + "\s*}}", 'i');
        let matches = pageContent.match(re);

        if (matches.length == 0)
            return {};

        let existing_args = matches[1] ? matches[1].split('|').map((x) => x.trim()) : [];
        let argCount = 1;

        existing_args.shift(); // Remove the template name

        existing_args.forEach(function (anArg) {
            if (anArg.includes('=')) {
                let parts = anArg.split('=');

                let field = parts.shift().trim();
                let value = parts.join('=').trim();
                args.set(field, value);
            }
            else
                args.set(argCount++, anArg);
        });

        return args;
    }

    /**
     * Checks if there is a template in a given page
     */
    hasTemplate(pageContent, template) {

        const templateRegex = new RegExp('{{' + template + '(\s*\|[^}]*)}}|{{' + template + '\s*}}', 'i');

        if (templateRegex.test(pageContent)) {
            return true;
        }

        return false;
    }

    insertKeywordInPage(pageContent, keyword) {
        Logger.log("insertKeywordInPage : " + keyword);
        let self = this;

        const templates = [
            "Auxiliaire",
            "Bioagresseur",
            "Exemple de mise en oeuvre",
            "Exemple de mise en œuvre",
            "Formation",
            "Livre",
            "Matériel",
            "Outil d'aide",
            "Portrait de ferme",
            "Pratique",
            "Programme",
            "Présentation",
            "Vidéo"
        ];

        templates.forEach((aTemplate) => {
            if (self.hasTemplate(pageContent, aTemplate)) {
                Logger.log("insertKeywordInPage : we have the template " + aTemplate);

                let params = self.getTemplateParams(pageContent, aTemplate);
                let keywords = keyword;
                if (params.has('Mots-clés')) {
                    keywords = params.get('Mots-clés') + ', ' + keyword;

                    keywords = Array.from(new Set(keywords.split(',').map(k => k.trim()))).join(', ');
                }
                
                Logger.log("insertKeywordInPage : new keywords " + keywords);

                params.set('Mots-clés', keywords);
                pageContent = self.updateTemplate(aTemplate, params, pageContent);
            }
        });

        return pageContent;
    }


    /**
     * Finds all charts in the page, and if one matches the given title, replace it with the one passed in parameter.
     * If none is found, then simply adds the chart at the end of the page.
     * @param {*} chartName 
     * @param {*} chartCode 
     * @param {*} content 
     */
    replaceOrAddChart(chartType, chartName, chartCode, pageContent) {

        chartName = chartName.trim().toLowerCase();
        
        const re = new RegExp('\{\{#' + chartType + '\s*:(.*?)\}\}', 'sgmi');

        let matches = pageContent.match(re);
        let originalChart = '';

        if (matches) {

            matches.forEach((chart) => {
                if (originalChart != "")
                    return;

                const re = new RegExp('\{\{#' + chartType + '\s*:', 'i');

                let chartcontent = chart.replace(re, '');
                let existing_args = chartcontent.split('|').map((x) => x.trim());

                existing_args.forEach((anArg) => {
                    let parts = anArg.split('=');

                    if (parts.length == 1)
                        return;

                    let field = parts.shift().trim().toLowerCase();
                    let value = parts.join('=').trim().toLowerCase();                    
                    if (field == 'title' && value == chartName) {
                        // Found !
                        originalChart = chart;
                        Logger.log(`Chart ${chartName} found`);

                    }
                });
            });
        }
        else
            Logger.log(`Chart ${chartName} not found - adding chart at the end of the page...`);
            

        if (originalChart != "")
            pageContent = pageContent.replace(originalChart, chartCode);
        else
            pageContent = pageContent + "\n\n" + chartCode;

        return pageContent;
    }

    /**
     * Analyze the page content, and adds the right translation tag at the end if missing (replace the existing one if already present)
     * @param {*} pageContent 
     * @param {*} targetLanguage 
     * @param {*} targetTranslation 
     */
    setTranslationForPage(pageContent, targetLanguage, targetTranslation) {

        if (String(pageContent).length == 0)
            return pageContent;

        // The translation tag is of the form [[fr:Title in French]] with fr the target language and Title in French the title of the page in that language
        const re = new RegExp('\\[\\[' + targetLanguage + ':(.*?)\\]\\]', 'i');
        let matches = pageContent.match(re); 
        if (matches && matches.length > 0) {
            // The translation tag is already present, replace it
            pageContent = pageContent.replace(matches[0], '[[' + targetLanguage + ':' + targetTranslation + ']]');
        }
        else {
            // The translation tag is not present, add it at the end of the page
            pageContent += '\n[[' + targetLanguage + ':' + targetTranslation + ']]';
        }
        return pageContent;
    }
}