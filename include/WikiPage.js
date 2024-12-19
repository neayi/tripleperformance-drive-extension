class wikiPage {
    /**
     * This class makes page modifications on the wiki easy. There's no communication with the wiki, only text manipulations
     */


    /**
     * Add value to a template in the page
     * String pagetitle The name of the page we are currently changing
     * String pageContent The content of the page (wikitext)
     * String template The template to look for. If the template is not found, the content is left untouched
     * String fieldname The name of the field to add to the template
     * String newValue The content to add for this field. If empty, then the field is removed from the template.
     * Bool bIgnoreWhenExisting If true, the existing field will not be touched if already present. If false it'll be overwritten.
     *
     * Returns true is the content has been changed
     */
    addValueToTemplate(pageContent, template, fieldname, newValue, bIgnoreWhenExisting) {
        const re = new RegExp('{{' + template + '(\s*\|[^}]*)}}|{{' + template + '\s*}}', 'i');

        let matches = pageContent.match(re);
        if (!matches || matches.length == 0) {
            console.log("Template '" + template + "' not found in page. Skipping.");
            return false;
        }

        let existing_args = [];
        if (matches[1] != "")
            existing_args = matches[1].split('|').map((x) => x.trim());

        let new_args = new Map();

        existing_args.shift(); // Remove the template name

        existing_args.forEach(function (anArg) {
            let parts = anArg.split('=');

            if (parts.length == 1)
                throw new Error("This template has unnamed parameters - cannot update");

            let field = parts.shift().trim();
            let value = parts.join('=').trim();
            new_args.set(field.toLowerCase(), field + " = " + value);
        });

        let key = fieldname.toLowerCase();

        if (!newValue) // Remove the field from the template
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

        return pageContent = this.replaceTemplate(template, template, new_args, pageContent);
    }

    /**
     * Replaces oldTemplate with newTemplate, using newParams
     * newParams must be a scalar array with values of the form : "fieldname = value"
     */
    replaceTemplate(oldTemplate, newTemplate, newParams, pageContent) {

        const re = new RegExp("{{" + oldTemplate + '(\s*\|[^}]*)}}|{{' + oldTemplate + "\s*}}", 'i');

        return pageContent.replace(re, this.buildTemplateFromMap(newTemplate, newParams));
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

throw new Error("This is broken, please fix with Mots Clés first");


        // const templates = [
        //     "{{Auxiliaire",
        //     "{{Bioagresseur",
        //     "{{Exemple de mise en oeuvre",
        //     "{{Exemple de mise en œuvre",
        //     "{{Formation",
        //     "{{Livre",
        //     "{{Matériel",
        //     "{{Outil d'aide",
        //     "{{Portrait de ferme",
        //     "{{Pratique",
        //     "{{Programme",
        //     "{{Présentation",
        //     "{{Vidéo"
        // ];

        // let self = this;

        // templates.forEach(aTemplate, {

        //     const self.getTemplateParams(pageContent, aTemplate);


        // });
        
        // const lcKeyword = keyword.toLowerCase();

        // const regex = /\|\s*Tag\s+([0-9]+)\s*=\s*([^|}]+)/gi;
        // const matches = pageContent.matchAll(regex);
        // const tagNumbers = [];
        // let newTagNumber = 0;
        // const keywords = [];

        // for (const match of matches) {
        //     tagNumbers.push(parseInt(match[1], 10));
        //     keywords.push(match[2].trim().toLowerCase());
        // }

        // if (tagNumbers.length > 0) {
        //     newTagNumber = Math.max(...tagNumbers) + 1;

        //     if (keywords.includes(lcKeyword)) {
        //         Logger.log("Keyword already in page : " + keyword);
        //         return pageContent;
        //     }
        // }

        // const templates = [
        //     "{{Auxiliaire",
        //     "{{Bioagresseur",
        //     "{{Exemple de mise en oeuvre",
        //     "{{Exemple de mise en œuvre",
        //     "{{Formation",
        //     "{{Livre",
        //     "{{Matériel",
        //     "{{Outil d'aide",
        //     "{{Portrait de ferme",
        //     "{{Pratique",
        //     "{{Programme",
        //     "{{Présentation",
        //     "{{Vidéo"
        // ];

        // const templateRegex = new RegExp(templates.join('|'), 'i');

        // if (!templateRegex.test(pageContent)) {
        //     const matches = pageContent.match(/{{\s*[^|}]+/g);
        //     Logger.log("Compatible template not found.");
        //     return pageContent;
        // }

        // for (const template of templates) {
        //     const templateRegex = new RegExp(template + '(\s*\|[^}]*)}}', 'i');
        //     const matches = pageContent.match(templateRegex);

        //     if (!matches || matches.length == 0)
        //         continue;

        //     const args = matches[1].split('|').map(arg => arg.trim());
        //     args.push(`Tag ${newTagNumber} = ${keyword}`);

        //     const firstArgs = [];
        //     const tagArgs = [];

        //     for (const arg of args) {
        //         if (arg.match(/Tag [0-9]+\s*=\s*$/)) {
        //             continue;
        //         }

        //         if (arg.match(/Tag [0-9]+\s*=@/)) {
        //             tagArgs.push(arg);
        //         } else {
        //             firstArgs.push(arg);
        //         }
        //     }

        //     tagArgs.sort();
        //     const sortedArgs = firstArgs.concat(tagArgs);

        //     const newTemplate = `${template} ${sortedArgs.join('\n| ')} }}`;
        //     pageContent = pageContent.replace(templateRegex, newTemplate);

        //     break;
        // }

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
}