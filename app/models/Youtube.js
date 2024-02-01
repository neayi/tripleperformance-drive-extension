class YoutubeModel {
    constructor() {
        this.apiTools = false;
        this.tripleperformanceURL = "";

        this.defGeneralites = {};

        this.columns = [
            "ID", "URL", "ThumbnailURL", "Vignette", "Titre", "Description", "Producteur", "Date de mise en ligne", 
            "Durée", "Sous-titres", "Vues", "Commentaires",
            "Titre corrigé", "Description courte", "Production", "Intervenants", "Mots clés", "ok pour wiki",
            "thumbnail", "wiki"
        ];

        this.tabs = ["Vidéos d'une chaîne", "Vidéos d'une playlist", "Intervenants"];
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

    /**
     * Get the missing IDs for the current channel and add them to the page
     * 
     * @returns 
     */
    fetchVideosFromYouTube() {
        let sheet = SpreadsheetApp.getActiveSheet();
        let ids  = [];

        let channelId = this.getSheetsChannelID(sheet);
        let playlistId = this.getSheetsPlaylistID(sheet);

        if (channelId) 
        {
            let sr = YouTube.Search.list("id", { 
                channelId: channelId,
                maxResults: 1000,
                order: 'date' });

            let vids = sr.items.filter(function (res) { return res.id.kind === "youtube#video" });

            ids = vids.map(function (v) { return v.id.videoId; });
        }
        else if (playlistId) 
        {
            let sr = YouTube.PlaylistItems.list("id,contentDetails,status",
                {
                    playlistId: playlistId
                });

            let vids = sr.items.filter(function (res) {
                return res.kind === "youtube#playlistItem" && 
                       res.status?.privacyStatus === "public"
                });

            ids = vids.map(function (v) { return v.contentDetails.videoId; });              
        }
        else
        {
            SpreadsheetApp.getUi().alert("Veuillez saisir un ID de chaîne valide");
            return;
        }
        
        sheet.getRange(3, 1, 1, this.columns.length).setValues([this.columns]).setFontWeight("bold");
        sheet.setFrozenRows(3);
        sheet.setFrozenColumns(4);

        if (ids.length == 0)
        {
            SpreadsheetApp.getUi().alert("Aucune vidéo trouvée. Veuillez vérifier l'ID de votre chaîne ou de votre playlist");
            return;
        }

        let existingValues = sheet.getDataRange().getValues();
        let existingYouTubeIds = existingValues.map(function (r) { return r[0]; }).filter(function (v) { return v != "" });

        let newVideosIds = ids.filter(videoId => !existingYouTubeIds.includes(videoId));

        if (newVideosIds.length == 0)
        {
            SpreadsheetApp.getUi().alert("Aucune nouvelle vidéo trouvée");
            return;
        }

        newVideosIds.forEach(id => {
            sheet.appendRow([id]);
        });

        SpreadsheetApp.getUi().alert(newVideosIds.length + " nouvelles vidéos ont été ajoutées");
    }
    
    fetchDetailsFromYoutube()
    {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;
        let ids = [];

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11)
                return;
            
            if (video.url.length > 0)
                return; // the details where already fetched for this video, skip
            
            ids.push(video.videoID);
        });

        Logger.log("Fetching the following videos:");
        Logger.log(ids);

        let videosDetails = this.fetchDetailsForVideoIDs(ids);

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11)
                return;

            if (video.url.length > 0)
                return; // the details where already fetched for this video, skip
            
            let details = videosDetails.get(video.videoID);
            if (details === undefined)
            {
                Logger.log(video.videoID + " not found in the results");
                return;
            }

            sheet.getRange(rowIndex + startRow, 2, 1, details.length).setValues([details]);
        });

        SpreadsheetApp.getUi().alert(`Détail des vidéos récupéré pour ${ids.length} vidéos`);
    }
    

    /**
     * From an array of ids, returns details for each video in a map
     * @param {*} ids 
     */
    fetchDetailsForVideoIDs(ids)
    {
        let part = ['id', 'snippet', 'contentDetails', 'statistics'];
        let sr = YouTube.Videos.list(part.join(','), {id:ids.join(',')});

        let vids = sr.items.filter(function (res) { return res.kind === "youtube#video" });
        
        let self = this;

        let data = new Map();
        
        vids.forEach((v) => { 
            let duration = v.contentDetails.duration; // PT5M45S
            let matches = duration.match(/^PT(([0-9]+)H)?(([0-9]+)M)?([0-9]+S)?$/);
            let minutes = (matches[2]??0) * 60 + Number(matches[4]??0);

            let publishedAt = new Date(v.snippet.publishedAt);

            let thumbnailURL = v.snippet?.thumbnails?.maxres?.url;
            if (!thumbnailURL)
                thumbnailURL = v.snippet.thumbnails.standard.url;
            
            data.set(v.id, [
                "https://www.youtube.com/watch?v=" + v.id,
                thumbnailURL,
                "=IMAGE(\""+thumbnailURL+"\")",
                v.snippet.title, 
                v.snippet.description,
                v.snippet.channelTitle,
                publishedAt,
                minutes,
                v.contentDetails.caption,
                v.statistics.viewCount,
                v.statistics.commentCount,
                self.fixTitle(v.snippet.title),
                self.getRelevantDescription(v.snippet.description),
                self.getProductionFromTitle(v.snippet.title),
                self.getIntervenantFromTitle(v.snippet.title).join(', ')
            ]);
        });

        return data;
    }

    /**
     * Go through all the videos of the current sheet,
     * check that the col 
     */
    addThumbnailsToWiki() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;
        const wikiCol = this.getColNumber("thumbnail");

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11 || !video.thumbnailURL.match(/^http/))
                return;
            
            if (video.thumbnail.length > 0)
                return;
            
            if (video.okForWiki !== "o")
                return;

            let apiTools = this.getApiTools();

            // Find the URL for this thumbnail
            const destName = `Thumbnail_youtube_${video.videoID}.jpg`;
            let comment = `Image accompagnant la vidéo [[${video.fixedTitle}]]`;

            Logger.log("Getting thumbnail for " + video.videoID + " " + video.thumbnailURL + " " + destName);
            let ret = apiTools.uploadImage(video.thumbnailURL, destName, comment);
            Logger.log(ret);

            let content = getHyperlinkedTitle(this.tripleperformanceURL, 'File:' + destName, destName);
            sheet.getRange(rowIndex + startRow, wikiCol, 1, 1).setValue(content);
        });

        SpreadsheetApp.getUi().alert("Vignettes mises à jour !");
    }

    syncYoutubeToWiki() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;
        const wikiCol = this.getColNumber("wiki");

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == this.columns[0])
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11)
                return;
            
            if (video.okForWiki !== "o")
                return;

            // if the video page is set (col in the excel), just skip (don't update)
            if (video.wiki.length > 0)
                return;

            let apiTools = this.getApiTools();

            // if the page is not set, try to find the page using the youtube URL
            let pages = apiTools.getPagesWithForSemanticQuery("[[A une URL de vidéo::" + video.url + "]]");
            if (pages.length > 0)
            {
                let pageTitle = pages[0];

                // if found, just set the page in the col and go the the next row
                let content = getHyperlinkedTitle(this.tripleperformanceURL, pageTitle);

                sheet.getRange(rowIndex + startRow, wikiCol, 1, 1).setValue(content);
                return;
            }

            // if not found, create it


            let params = new Map();
            params.set('Titre',         "Titre = " + video.fixedTitle);
            params.set('Producteur',    "Producteur = " + video.channelTitle);
            params.set('Vignette',      `Vignette = Thumbnail_youtube_${video.videoID}.jpg`);
            params.set('Date de mise en ligne', `Date de mise en ligne = ${video.publishedAt}`);
            params.set('Durée',         `Durée = ${video.duration} minutes`);
            params.set('Production',    "Production = " + video.mainProduction);
            params.set('Vidéo',         `Vidéo = https://www.youtube.com/watch?v=${video.videoID}`);
            
            video.speakers.split(',').forEach((intervenant, i) => {
                intervenant = intervenant.trim();
                if (intervenant.length == 0)
                    return;
                params.set('Intervenants ' + i, `Intervenants ${i} = ${intervenant}`);
            });
            
            video.tags.split(',').forEach((tag, i) => {
                tag = tag.trim();
                if (tag.length == 0)
                    return;
                params.set('Tag ' + i, `Tag ${i} = ${tag}`);
            });

            const wikipage = new wikiPage();
            let pageContent = wikipage.buildTemplateFromMap('vidéo', params);
            pageContent += "\n\n" + video.fixedDescription;

            let pageTitle = video.fixedTitle;
            apiTools.createWikiPage(pageTitle, pageContent, "Création de la page");

            let cellcontent = getHyperlinkedTitle(this.tripleperformanceURL, pageTitle);
            sheet.getRange(rowIndex + startRow, wikiCol, 1, 1).setValue(cellcontent);
        });
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

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11)
                return;
            
            if (video.okForWiki !== "o")
                return;

            video.speakers.split(',').forEach((intervenant, i) => {
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


    syncSpeakersToTriplePerformance() {
        // To do

        // Créer la redirection si le nom ne correspond pas au nom final

    }

    getVideoFromRow(row)
    {
        let video = {};
        let [videoID, url, thumbnailURL, Vignette, title, 
            description, channelTitle, publishedAt, duration,
            hasCaptions, viewCount, commentCount, fixedTitle, fixedDescription,
            mainProduction, speakers, tags, okForWiki, thumbnail, wiki, ...others] = row;
            
        video.videoID = videoID;
        video.url = url;
        video.thumbnailURL = thumbnailURL;
        video.title = title;
        video.description = description;
        video.channelTitle = channelTitle;
        if (publishedAt instanceof Date)
            video.publishedAt =  publishedAt.toISOString().substring(0, 10);
        else 
            video.publishedAt = "";

        video.duration = duration;
        video.hasCaptions = hasCaptions;
        video.viewCount = viewCount;
        video.commentCount = commentCount;
        video.fixedTitle = fixedTitle;
        video.fixedDescription = fixedDescription;
        video.mainProduction = mainProduction;
        video.speakers = speakers;
        video.tags = tags;
        video.okForWiki = okForWiki;
        video.thumbnail = thumbnail;
        video.wiki = wiki;
        
        return video;
    }

    getColNumber(colname) {
        return this.columns.indexOf(colname) + 1;
    }

    getSheetsChannelID(sheet) {
        let channelId = "";
        let values = sheet.getRange(1, 1, 1, 4).getValues();

        if (values[0][2] == "Channel ID") {
            channelId = values[0][3];
        }

        if (channelId == "") {
            Logger.log(values);
            return false;
        }

        return channelId;
    }

    getSheetsPlaylistID(sheet) {
        let playlistId = "";
        let values = sheet.getRange(1, 1, 1, 4).getValues();

        if (values[0][2] == "Playlist ID") {
            playlistId = values[0][3];
        }

        if (playlistId == "") {
            Logger.log(values);
            return false;
        }

        return playlistId;
    }    

    getTabs()
    {
        return this.tabs;
    }

    createTab(tabName)
    {
        if (!this.tabs.includes(tabName))
            return false;

        if (tabName == "Intervenants")
        {
            let speakM = new speakersModel();
            return speakM.createTab(tabName);
        }

        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();

        let cols = [];
        if (tabName == "Vidéos d'une chaîne")
        {
            sheet.setName("Vidéos de la chaîne quelquechose");
            cols = ["Chaîne", "Ver de Terre Production", "Channel ID", "UCUaPiJJ2wH9CpuPN4zEB3nA", "https://stackoverflow.com/a/76285153"];
        }
        else if (tabName == "Vidéos d'une playlist")
        {
            sheet.setName("Vidéos de la chaîne quelquechose");
            cols = ["Playlist", "https://www.youtube.com/playlist?list=PLQNBggapGeH_7kXfyelk_ShC1a8HCsQE7", "Playlist ID", "PLQNBggapGeH_7kXfyelk_ShC1a8HCsQE7"];
        }

        sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
        sheet.setFrozenRows(3);
        sheet.setFrozenColumns(4);      

        return sheet;
    }

    getRelevantDescription(description)
    {
        let stopStrings = [
            /^Engagé pour la transition agroécologique, Ver de Terre Production.*/i,
            /^Créé en 2017, Ver de terre production.*/i,
            /^Ver de terre production a été créé.*/i,
            /^Si vous voulez faire un don pour soutenir.*/i,
            /^Soutenez-nous sur Tipeee !.*/i,
            /^💙 Si vous voulez faire un don pour soutenir.*/i];

        let descriptionLines = description.split("\n");
        description = '';
        let bFoundAStopString = false;

        descriptionLines.forEach((aLine) => {
            if (bFoundAStopString)
                return;

            aLine = aLine.trim();
            stopStrings.forEach((aStopString) => {
                if (!bFoundAStopString && aLine.match(aStopString))
                    bFoundAStopString = true;
            });

            if (bFoundAStopString)
                return;

            // NB: double up the cariage returns so that the wiki considers those as new paragraphs
            aLine = aLine.replace(/^-/, '* ');
            description += aLine + "\n\n";
        });
        
        return description;
    }

    fixTitle(title)
    {
      // Remove cariage returns from the title:
      title = title.replace(/[\r\n]/m, '');
    
      // Fix the title in order to move the episode number to the end:
      let matches = title.match(/^([0-9]+\/[0-9]+)[ -]+(.*)/);
      if (matches)
          title = matches[2].replace(/^[ -]+/, '') + ' - ' + matches[1];
    
      // Remove any parts at the begining between parenthesis
      title = title.replace(/^\([^\)]+\)/, '');
      title = title.replace(/^\[[^\]]+\]/, '');
      title = title.replace(/^[ -#]+/, '');
      title = title.replace(/[ -#]+$/, '');
    
      title = title.replace('’', "'");
      title = title.replace('…', "...");
      title = title.replace('é', "é");
      title = title.replace('è', "è");
      title = title.replace('à', "à");
      title = title.replace('à', "à");
      title = title.replace('É', "É");
      title = title.replace('–', "-");
      title = title.replace('@', " - ");

      return title;
    }

    getProductionFromTitle(title)
    {
        if (title.match(/[ée]levage/i))
            return 'Polyculture-élevage';

        if (title.match(/grandes[ -]cultures/i) ||
            title.match(/blé/i) ||
            title.match(/orge/i) ||
            title.match(/colza/i)||
            title.match(/tournesol/i))
            return 'Grandes cultures';

        if (title.match(/mara[iî]chage/i) ||
            title.match(/mara[iî]cher/i))
            return 'Maraîchage';

        if (title.match(/viticulture/i) ||
            title.match(/vigne/i))
            return 'Viticulture';
        
        if (title.match(/arboriculture/i) ||
            title.match(/verger/i))
            return 'Arboriculture';
           
        if (title.match(/couverts/i))
            return 'Grandes cultures';

        return '';
    }

    getIntervenantFromTitle(title)
    {
      /**
       * If the title has the following form, lets assume the last two words are the author:
       * 
       * some title some title, firstname name (et firstname name)
       * some title avec firstname name (et firstname name)
       * some title par firstname name (et firstname name)
       * some title - firstname name (et firstname name)
       */
    
      let matches = title.match(/(,|par|avec|-|\?)\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)(\s+et\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\s+([A-Za-zÀ-ÖØ-öø-ÿ]+))?\s*$/);
      Logger.log(matches);
      let intervenants = [];
      if (matches)
      {
        intervenants.push(this.fixCase(matches[2]) + " " + this.fixCase(matches[3]));
    
        if (matches[5])
          intervenants.push(this.fixCase(matches[5]) + " " + this.fixCase(matches[6]));
      }
    
      return intervenants;
    }
    
    fixCase(str)
    {
      return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }    
}