class api_tools {
  constructor(api, username, password) {
    this.wikiURL = api;

    this.api = new MediawikiAPI(api + "/api.php", username, password);

    let logindata = this.api.login();
    if (!logindata.login.result || logindata.login.result != 'Success') {
      throw new Error("login returned an error: ".logindata);
    }
  }

  getPageContent(page) {
    // https://wiki.tripleperformance.fr/api.php?action=query&prop=revisions&titles=Pratiquer%20l%27agroforesterie|Pratiquer%20la%20vitiforesterie&rvslots=*&rvprop=content&formatversion=2

    let parameters = {
      "action": "query",
      "prop": "revisions",
      "titles": page,
      "rvslots": "*",
      "rvprop": "content",
      "formatversion": "2",
      "format": 'json',
      'redirects': 'true'
    };

    let url = this.wikiURL + "/api.php?" + this.objectToQueryParams(parameters);

    let options = {
      'method': 'get',
      'payload': parameters
    };

    let results = UrlFetchApp.fetch(url, options);

    let json = results.getContentText();

    let result = JSON.parse(json);

    if (!result.query.pages || 
        result.query.pages.length == 0 || 
        !result.query.pages[0].revisions ||
        result.query.pages[0].revisions.length == 0) {
      return false;
    }

    let pageContent = result['query']['pages'][0]['revisions'][0]['slots']['main']['content'];

    return pageContent;
  }

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
  addValueToTemplate(pagetitle, pageContent, template, fieldname, newValue, bIgnoreWhenExisting) {
    const re = new RegExp('{{' + template + '(\s*\|[^}]*)}}|{{' + template + '\s*}}', 'i');

    let matches = pageContent.match(re);
    if (!matches || matches.length == 0) {
      console.log("Template '" + template + "' not found in page " + pagetitle + ". Skipping.");
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

      let field = parts[0].trim();
      let value = parts[1].trim();
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

    var newParameters = new Array();

    if (newParams instanceof Array) {
      newParameters = newParams;
    }
    else if (newParams instanceof Map) {
      for (let value of newParams.values()) {
        newParameters.push(value);
      }
    }
    else {
      for (let value of Object.values(newParams)) {
        newParameters.push(value);
      }
    }

    newTemplate = '{{' + newTemplate + "\n| " + newParameters.join("\n| ") + "\n}}";

    const re = new RegExp("{{" + oldTemplate + '(\s*\|[^}]*)}}|{{' + oldTemplate + "\s*}}", 'i');

    return pageContent.replace(re, newTemplate);
  }

  /**
   * Replaces oldTemplate with newTemplate, using newParams
   * newParams must be a scalar array with values of the form : "fieldname = value"
   */
  replaceParserFunction(parserFunctionName, newContent, pageContent) {

    const re = new RegExp('{{#' + parserFunctionName + '(\s*:[^}]*)}}', 'i');

    return pageContent.replace(re, newContent);
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

        let field = parts[0].trim();
        let value = parts[1].trim();
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
    const lcKeyword = keyword.toLowerCase();

    const regex = /\|\s*Tag\s+([0-9]+)\s*=\s*([^|}]+)/gi;
    const matches = pageContent.matchAll(regex);
    const tagNumbers = [];
    let newTagNumber = 0;
    const keywords = [];

    for (const match of matches) {
      tagNumbers.push(parseInt(match[1], 10));
      keywords.push(match[2].trim().toLowerCase());
    }

    if (tagNumbers.length > 0) {
      newTagNumber = Math.max(...tagNumbers) + 1;

      if (keywords.includes(lcKeyword)) {
        return false;
      }
    }

    const templates = [
      '{{Exemple de mise en œuvre',
      '{{Exemple de mise en oeuvre',
      '{{Pratique',
      '{{Vidéo',
      '{{Portrait de ferme',
      '{{Auxiliaire'
    ];

    const templateRegex = new RegExp(templates.join('|'), 'i');

    if (!templateRegex.test(pageContent)) {
      const matches = pageContent.match(/{{\s*[^|}]+/g);
      console.log(matches);
      console.log(pageContent);

      throw new Error("Template not found.");
    }

    for (const template of templates) {
      const templateRegex = new RegExp(template + '(\s*\|[^}]*)}}', 'i');
      const matches = pageContent.match(templateRegex);

      if (!matches || matches.length == 0)
        continue;

      const args = matches[1].split('|').map(arg => arg.trim());
      args.push(`Tag ${newTagNumber} = ${keyword}`);

      const firstArgs = [];
      const tagArgs = [];

      for (const arg of args) {
        if (arg.match(/Tag [0-9]+\s*=\s*$/)) {
          continue;
        }

        if (arg.match(/Tag [0-9]+\s*=@/)) {
          tagArgs.push(arg);
        } else {
          firstArgs.push(arg);
        }
      }

      tagArgs.sort();
      const sortedArgs = firstArgs.concat(tagArgs);

      const newTemplate = `${template} ${sortedArgs.join('\n| ')} }}`;
      pageContent = pageContent.replace(templateRegex, newTemplate);

      break;
    }

    return pageContent;
  }

  updateWikiPage(pageName, newContent, reason) {
    const edittoken = this.api.getEditToken();

    if (edittoken === null) {
      throw new Error("Unable to acquire an edit token");
    }

    const editdata = {
      title: pageName,
      text: newContent,
      summary: reason,
      bot: true,
      minor: true,
      nocreate: true,
      md5: this.md5(newContent),
      token: edittoken
    };

    const r = this.api.edit(editdata);

    if (r.error || !r.edit.result || r.edit.result !== 'Success') {
      throw new Error("Could not update page: " + JSON.stringify(r));
    }

    console.log("Updated");
  }

  createWikiPage(pageName, newContent, reason) {
    const edittoken = this.api.getEditToken();

    if (edittoken === null) {
      throw new Error("Unable to acquire an edit token");
    }

    console.log("Creating page " + pageName);

    const editdata = {
      title: pageName,
      text: newContent,
      summary: reason,
      bot: true,
      md5: this.md5(newContent),
      token: edittoken
    };

    const r = this.api.edit(editdata);

    if (r.error || !r.edit || !r.edit.result || r.edit.result !== 'Success') {
      throw new Error("Could not create page: " + JSON.stringify(r) + JSON.stringify(editdata));
    }

    console.log("Created");
  }

  /**
   * pagesWithTemplate = apiToolsInstance.getPagesForTemplate("Template:Pages liées");
   */
  getPagesForTemplate(templateName) {
    try {
      const args = { list: 'embeddedin', eititle: templateName, eilimit: '1000' };
      const content = this.api.query(args);

      const ret = [];

      if (content.query && content.query.embeddedin) {
        for (const aPage of content.query.embeddedin) {
          ret.push(aPage.title);
        }
      }

      return ret;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }

  // getPagesForWithWikiText(wikitext) {
  //   try {
  //     const parameters = { action: 'query', srlimit: '1000', list: 'search', srsearch: '*'+wikitext+'*' };
  //     const content = this.api.query(parameters);

  //     const ret = [];

  //     if (content.query && content.query.search) {
  //       for (const aPage of content.query.search) {
  //         ret.push(aPage.title);
  //       }
  //     }

  //     return ret;
  //   } catch (error) {
  //     console.error(error.message);
  //     return [];
  //   }
  // }

  getPagesForCategory(categoryName) {
    try {
      const args = { list: 'categorymembers', cmtitle: categoryName, cmlimit: '1000' };
      const content = this.api.query(args);

      const ret = [];

      if (content.query && content.query.categorymembers) {
        for (const aPage of content.query.categorymembers) {
          ret.push(aPage.title);
        }
      }

      return ret;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }

  /**
   * Invoque with: getPagesWithForSemanticQuery("[[A un mot-clé::Pâturage]]")
   */
  getPagesWithForSemanticQuery(semanticQuery) {
    try {
      const ask = `${semanticQuery}|?=Page|limit=5000`;

      const parameters = {
        action: 'ask',
        api_version: '3',
        query: ask,
        format: 'json'
      };

      const queryString = this.objectToQueryParams(parameters);
      const url = `${this.wikiURL}/api.php?${queryString}`;

      let options = {
        'method': 'get',
      };

      const response = UrlFetchApp.fetch(url, options);

      let unparsedJson = response.getContentText();
      const result = JSON.parse(unparsedJson);

      if (!result.query || !result.query.results) {
        return [];
      }

      return result.query.results.map(arg => Object.keys(arg)[0]);
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }


  /**
   * Returns a list of pages (key) with their date of last modification (value)
   * namespace String The namespace of the pages to return (0 for main, 10 for templates)
   */
  getPagesWithTimestamp(namespace = '', bRemoveNamespace = false) {
    try {
      const parameters = {
        action: 'query',
        generator: 'allpages',
        gaplimit: '5000',
        gapfilterredir: 'nonredirects',
        prop: 'revisions',
        rvprop: 'timestamp',
      };

      if (namespace !== '') {
        parameters.gapnamespace = String(namespace);
      }

      const content = this.api.query(parameters);

      const ret = {};

      if (content.query && content.query.pages) {
        for (const pageId in content.query.pages) {
          const aPage = content.query.pages[pageId];
          let pageTitle = aPage.title;

          if (bRemoveNamespace) {
            const parts = pageTitle.split(':');
            parts.shift();
            pageTitle = parts.join(':');
          }

          ret[pageTitle] = new Date(aPage.revisions[0].timestamp);
        }
      }

      return ret;
    } catch (error) {
      console.error(error.message);
      return {};
    }
  }


  /**
   * Returns a list of templates that are actually used on the wiki
   */
  getUsedTemplates(bRemoveNamespace = false) {
    try {
      const parameters = {
        action: 'query',
        list: 'alltransclusions',
        atlimit: '5000',
        atunique: '',
      };

      const content = this.api.query(parameters);

      const ret = [];

      if (content.query && content.query.alltransclusions) {
        for (const aPage of content.query.alltransclusions) {
          let pageTitle = aPage.title;

          if (bRemoveNamespace) {
            const parts = pageTitle.split(':');
            parts.shift();
            pageTitle = parts.join(':');
          }

          ret.push(pageTitle);
        }
      }

      return ret;
    } catch (error) {
      console.error(error.message);
      return {};
    }
  }

  objectToQueryParams(obj) {
    return (
      Object.entries(obj)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    );
  }

  md5(inputString) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, inputString, Utilities.Charset.UTF_8)
      .reduce((output, byte) => output + (byte & 255).toString(16).padStart(2, '0'), '');
  }
}