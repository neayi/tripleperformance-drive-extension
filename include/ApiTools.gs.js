class api_tools {
  constructor(api, username, password) {
    this.wikiURL = api;

    this.api = new MediawikiAPI(api + "api.php", username, password);

    let logindata = this.api.login();
    if (!logindata.login.result || logindata.login.result != 'Success') {
      throw new Error("login returned an error: " + JSON.stringify(logindata));
    }
  }

  /**
   * Get the content of the page, without trying to redirect. If you want to follow redirects, use getPageContentWithRedirect !
   * @param {} page 
   * @returns 
   */
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
      'redirects': 'false' // do not follow redirects
    };

    let url = this.wikiURL + "api.php?" + this.objectToQueryParams(parameters);

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
   * Get the content of the page, and follows redirects
   * @param {} page 
   * @returns an object with both the page content and the final page title after redirects. If the page does not exist, returns false.
   * @see https://www.mediawiki.org/wiki/API:Redirects
   */
  getPageContentWithRedirect(page) {
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

    let url = this.wikiURL + "api.php?" + this.objectToQueryParams(parameters);

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

    return {
      content: pageContent,
      title: result['query']['pages'][0]['title']
    };
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

  createOrUpdateJsonPage(pageTitle, Json, reason) {
    const edittoken = this.api.getEditToken();

    if (edittoken === null) {
      throw new Error("Unable to acquire an edit token");
    }

    console.log("Creating JSON page " + pageTitle);

    let JsonString = JSON.stringify(Json);

    const editdata = {
      title: pageTitle,
      text: JsonString,
      summary: reason,
      contentformat: 'application/json',
      contentmodel: 'json',
      bot: true,
      md5: this.md5(JsonString),
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
      const url = `${this.wikiURL}api.php?${queryString}`;

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
   * Invoque with: getPagesWithForSemanticQuery("[[A un mot-clé::Pâturage]]", ["A un mot-clé"])
   * Values must be an array
   * 
   * Returns an array of arrays. The first item of each array is the page title, then the values. The values might be arrays !
   */
  getSemanticValuesWithForSemanticQuery(semanticQuery, values) {
    try {

      values = values.map((v) => { return '?' + v }).join('|');

      const ask = `${semanticQuery}|?=Page|${values}|limit=5000`;

      const parameters = {
        action: 'ask',
        api_version: '3',
        query: ask,
        format: 'json'
      };

      const queryString = this.objectToQueryParams(parameters);
      const url = `${this.wikiURL}api.php?${queryString}`;

      let options = {
        'method': 'get',
      };

      const response = UrlFetchApp.fetch(url, options);

      let unparsedJson = response.getContentText();
      const result = JSON.parse(unparsedJson);

      if (!result.query || !result.query.results) {
        return [];
      }

      return result.query.results.map(arg => {
        let pagename = Object.keys(arg)[0];

        let entries = [];
        for (const [key, value] of Object.entries(arg)) {
          if (value.printouts)
            entries = Object.entries(value.printouts).map((k, v) => {
              if (k[1].length >= 1) {
                let fulltextValues = k[1].map((vv) => {
                  return vv.fulltext ?? vv;
                });

                if (fulltextValues.length == 1)
                  return fulltextValues[0];
                else
                  return fulltextValues;
              }
              else // no entry for this attribute
                return '';
            });
        }

        return [pagename, ...entries];
      });
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

  /**
   * Uploads an image to the wiki, from a given URL
   * NB : it's ok to upload an image in PNG and asking a filename in JPG - it'll be converted on the fly
   * 
   * @param {*} imageURL 
   * @param {*} desFilename 
   * @param {*} comment 
   * @returns 
   */
  uploadImage(imageURL, desFilename, comment, text = "") {
    const edittoken = this.api.getEditToken();

    if (edittoken === null) {
      throw new Error("Unable to acquire an edit token");
    }

    const uploadData = {
      url: imageURL,
      filename: desFilename,
      comment: comment,
      text: text,
      token: edittoken
    };

    const r = this.api.upload(uploadData);

    if (r.error || !r.upload.result || r.upload.result !== 'Success') {

      if (r.upload?.result == 'Warning') {
        Logger.log("Warning on uploading the image: " + desFilename + " " + JSON.stringify(r));
        return JSON.stringify(r.upload.warnings);
      }

      throw new Error("Could not upload image: " + imageURL + "\n" + desFilename + "\n" + JSON.stringify(r));
    }

    Logger.log("Uploaded");

    return r.upload.filename;
  }

  /**
   * Check that a page exists
   * @param String or Array title 
   * @returns a Map with the requested pages, with true or false depending on existance
   */
  pageExists(title) {
    if (title instanceof Array)
      title = title.join('|');

    const args = { titles: title };
    const content = this.api.query(args);

    let ret = new Map();
    if (content.query?.pages) {
      for (const [key, value] of Object.entries(content.query.pages)) {
        ret.set(value.title, key > 0);
      }
    }

    return ret;
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

  /**
   * Rename a page
   * @see https://www.mediawiki.org/wiki/API:Move

   * @param {String} fromPage 
   * @param {String} toPage 
   */
  move(fromPage, toPage, reason) {
    const edittoken = this.api.getEditToken();

    if (edittoken === null) {
      throw new Error("Unable to acquire an edit token");
    }

    const moveData = {
      from: fromPage,
      to: toPage,
      reason: reason,
      token: edittoken
    };

    const r = this.api.move(moveData);

    if (r.error) {
      throw new Error("Could not move the page: " + JSON.stringify(r));
    }

    Logger.log("Moved page " + fromPage + " to " + toPage);

    return true;
  }

  /**
   * Performs a full search on the wiki
   * 
   * @param {String} term 
   * @returns Array of page titles
   */
  search(term) {
    try {
      const parameters = {
        action: 'query',
        list: 'search',
        srlimit: '500',
        srwhat: 'text',
        srnamespace: '*',
        format: 'json',
        srsearch: term
      };

      const results = this.api.query(parameters);

      const ret = [];

      results.query.search.forEach(result => {
        ret.push(result.title);
      });

      return ret;
    } catch (error) {
      console.error(error.message);
    }

    return [];
  }

  /**
   * Get translations for a page
   * @param {String} pageName
   * @returns {Object} An object with language codes as keys and page titles as values
   * @see https://www.mediawiki.org/wiki/API:Language#Get_translations_for_a_page
   */
  getTranslationsForPage(pageName) {
    try {
      const parameters = {
        action: 'query',
        prop: 'langlinks',
        titles: pageName,
        lllimit: '500',
        redirects: true,
        format: 'json'
      };

      const results = this.api.query(parameters);

      const pages = results.query.pages;
      if (!pages || Object.keys(pages).length === 0) {
        return {};
      }

      const page = pages[Object.keys(pages)[0]];
      if (!page.langlinks) {
        return {};
      }

      const translations = {};
      page.langlinks.forEach(link => {
        translations[link.lang] = link['*'];
      });

      return translations;
    } catch (error) {
      console.error(error.message);
    }

    return {};
  }

}