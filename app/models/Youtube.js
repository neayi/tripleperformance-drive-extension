
class YoutubeModel {
    constructor() {

        this.startTime = new Date();

        this.rowIndexForYoutubeId = new Map();

        this.columns = [
            "ID", "URL", "ThumbnailURL", "Vignette", "Titre", "Description", "Producteur", "Date de mise en ligne", 
            "Durée", "Sous-titres", "Vues", "Commentaires",
            "Titre corrigé", "Description courte", "Production", "Intervenants", "Mots clés", "ok pour wiki",
            "thumbnail", "wiki", "Date de création de la page"
        ];

        this.tabs = ["Vidéos d'une chaîne", "Vidéos d'une playlist", "Intervenants"];
    }

    /**
     * Get the missing IDs for the current channel and add them to the page
     * 
     * @returns 
     */
    fetchVideosFromYouTube() {
        let sheet = SpreadsheetApp.getActiveSheet();
        this.fetchNewVideosForTab(sheet);
    }
    
    fetchNewVideosForTab(sheet) {
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
            let sr = YouTube.PlaylistItems.list("id,contentDetails,status", {
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
            return;
        }
        
        if (ids.length == 0)
            return;

        let existingValues = sheet.getDataRange().getValues();
        let existingYouTubeIds = existingValues.map(function (r) { return r[0]; }).filter(function (v) { return v != "" });

        let newVideosIds = ids.filter(videoId => !existingYouTubeIds.includes(videoId));

        if (newVideosIds.length == 0)
            return;

        let values = newVideosIds.map((id) => [id]);

        const insertRow = sheet.getLastRow() + 1;
        sheet.getRange(insertRow, 1, values.length, 1).setValues(values);

        Logger.log(newVideosIds.length + " nouvelles videos trouvées");
    }
    
    fetchNewVideos() {
        Logger.log('fetchNewVideos');

        // Remove any existing trigger first
        removeTrigger();
        this.getYouTubeTabsNames();

        // Proceed !
        onFetchNewVideos();
    }
    
    fetchVideoDetails() {

        Logger.log('fetchVideoDetails');

        // Remove any existing trigger first
        removeTrigger();
        this.getYouTubeTabsNames();

        onFetchVideosDetails();
    }
    
    /**
     * Go through all the videos of the current sheet,
     * check that the col 
     */
    pushThumbnailsToWiki() {
        Logger.log('pushThumbnailsToWiki');

        // Remove any existing trigger first
        removeTrigger();
        this.getYouTubeTabsNames();

        onPushThumbnailsToWiki();
    }

    pushYoutubePagesToWiki() {
        Logger.log('pushYoutubePagesToWiki');

        // Remove any existing trigger first
        removeTrigger();
        this.getYouTubeTabsNames();

        onPushYoutubePagesToWiki();
    }

    getNextTabInQueue()
    {
        const documentProperties = PropertiesService.getDocumentProperties();
        const tabs = documentProperties.getProperty('queuedTabsForTrigger');
        let tabNames = tabs.split('|');
    
        if (tabNames.length == 0)
        {
            // We are done, kill the trigger and exit
            removeTrigger();
            return false;
        }

        Logger.log("Get next tab in queue : " + tabNames[0]);

        return tabNames[0];
    }

    shiftQueue()
    {
        const documentProperties = PropertiesService.getDocumentProperties();
        const tabs = documentProperties.getProperty('queuedTabsForTrigger');
        let tabNames = tabs.split('|');
    
        if (tabNames.length == 0)
            return false;

        tabNames.shift();
        documentProperties.setProperty('queuedTabsForTrigger', tabNames.join('|'));
        Logger.log("shifting queue. New queue is : " + tabNames.join(', '));

        if (tabNames.length == 0)
            return false;
        
        return tabNames[0];
    }

    getYouTubeTabsNames() {
        const self = this;

        let tabNames = [];

        var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
        sheets.forEach((sheet) => {
            
            let channelId = self.getSheetsChannelID(sheet);
            let playlistId = self.getSheetsPlaylistID(sheet);

            if (!channelId && !playlistId)
                return;

            tabNames.push(sheet.getName());
        });

        PropertiesService.getDocumentProperties().setProperty('queuedTabsForTrigger', tabNames.join('|'));
    }

    checkTime() {
        Logger.log("checkTime " + this.startTime + new Date());
        if (new Date().getTime() - this.startTime.getTime() > 43000) // 45 seconds from start of the script
            throw("time up");
    }
    
    fetchVideosDetailsForTab(sheet) {

        Logger.log("fetchVideosDetailsForTab");

        const sheetName = sheet.getName();
        let data = sheet.getDataRange();
        let startRow = data.getRow();

        const self = this;

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

            self.rowIndexForYoutubeId.set(sheetName + video.videoID, rowIndex + startRow);
        });

        Logger.log("Fetching the following videos:");
        Logger.log(ids);

        this.fetchDetailsForVideoIDs(ids, sheet);
    }

    fetchDetailsFromYoutube()
    {
        let sheet = SpreadsheetApp.getActiveSheet();
        this.fetchVideosDetailsForTab(sheet);
        alert(`Détail des vidéos récupéré pour les vidéos`);
    }
    
    /**
     * From an array of ids, returns details for each video in a map
     * @param {*} ids 
     */
    fetchDetailsForVideoIDs(ids, sheet)
    {
        Logger.log("fetchDetailsForVideoIDs " + ids.join(', '));

        let part = ['id', 'snippet', 'contentDetails', 'statistics'];
        let sr = YouTube.Videos.list(part.join(','), {id:ids.join(',')});

        let vids = sr.items.filter(function (res) { return res.kind === "youtube#video" });
        
        let self = this;
        
        vids.forEach((v) => { 

            self.checkTime();

            let duration = v.contentDetails.duration; // PT5M45S
            let minutes = 0;

            if (duration != "P0D") // Not yet streamed probably
            {
                let matches = duration.match(/^PT(([0-9]+)H)?(([0-9]+)M)?([0-9]+S)?$/);
                minutes = (matches[2]??0) * 60 + Number(matches[4]??0);
            }

            let publishedAt = new Date(v.snippet.publishedAt);

            let thumbnailURL = v.snippet?.thumbnails?.maxres?.url;
            if (!thumbnailURL)
                thumbnailURL = v.snippet.thumbnails.standard.url;
            
            let detail = [
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
            ];

            this.setValuesForVideo(v.id, detail, sheet);
            SpreadsheetApp.flush();
        });
    }

    setValuesForVideo(videoId, videoDetail, sheet)
    {
        let videoRow = this.rowIndexForYoutubeId.get(sheet.getName() + videoId)

        if (videoRow)
            sheet.getRange(videoRow, 2, 1, videoDetail.length)
                .setValues([videoDetail]);
    }

    pushThumbnailsToWikiForSheet(sheet) {

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        const wikiCol = this.getColNumber("thumbnail");

        const self = this;

        data.getValues().forEach((row, rowIndex) => {

            self.checkTime();

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11 || !video.thumbnailURL.match(/^http/))
                return;
            
            if (video.thumbnail.length > 0)
                return; // Already on the wiki
            
            if (video.okForWiki !== "o")
                return; // Not to be pushed

            let apiTools = getApiTools();

            // Find the URL for this thumbnail
            const destName = `Thumbnail_youtube_${video.videoID}.jpg`;
            let comment = `Image accompagnant la vidéo [[${video.fixedTitle}]]`;

            Logger.log("Getting thumbnail for " + video.videoID + " " + video.thumbnailURL + " " + destName);
            let ret = apiTools.uploadImage(video.thumbnailURL, destName, comment);

            let content = getHyperlinkedTitle(getTriplePerformanceURL(), 'File:' + destName, destName);
            sheet.getRange(rowIndex + startRow, wikiCol).setValue(content);
            SpreadsheetApp.flush();
        });
    }

    pushYoutubePagesToWikiForSheet(sheet) {
        let data = sheet.getDataRange();
        let startRow = data.getRow();

        const wikiCol = this.getColNumber("wiki");

        const self = this;

        data.getValues().forEach((row, rowIndex) => {
            self.checkTime();

            let video = this.getVideoFromRow(row);
   
            if (video.videoID.length != 11)
                return; // Not a video
            
            if (video.okForWiki !== "o")
                return; // Not ok to push

            // if the video page is set (col in the excel), just skip (don't update)
            if (video.wiki.length > 0)
                return; // Already on the wiki

            let apiTools = getApiTools();

            // if the page is not set, try to find the page using the youtube URL
            let pages = apiTools.getPagesWithForSemanticQuery("[[A une URL de vidéo::" + video.url + "]]");
            if (pages.length > 0)
            {
                let pageTitle = pages[0];

                // if found, just set the page in the col and go the the next row
                let content = getHyperlinkedTitle(getTriplePerformanceURL(), pageTitle);

                sheet.getRange(rowIndex + startRow, wikiCol).setValue(content);
                return;
            }

            self.checkTime();

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

            let cellcontent = getHyperlinkedTitle(getTriplePerformanceURL(), pageTitle);
            sheet.getRange(rowIndex + startRow, wikiCol, 1, 2).setValues([[cellcontent, new Date()]]);
        });
    }

    buildSpeakersList() {
        const self = this;
        let speakers = [];

        let sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
        sheets.forEach((sheet) => {
            
            let channelId = self.getSheetsChannelID(sheet);
            let playlistId = self.getSheetsPlaylistID(sheet);

            if (!channelId && !playlistId)
                return; // Not a youtube Sheet

            sheet.getDataRange().getValues().forEach((row, rowIndex) => {
    
                let video = this.getVideoFromRow(row);
       
                if (video.videoID.length != 11)
                    return; // Not a video
                
                if (video.okForWiki !== "o")
                    return; // Not marked for import
    
                video.speakers.split(',').forEach((intervenant, i) => {
                    intervenant = intervenant.trim();
                    if (intervenant.length == 0)
                        return;
    
                    speakers.push(intervenant);
                });
            });
        });

        let speakersManager = new speakersModel();
        speakersManager.getAllSpeakersFromWiki();
        let newSpeakers = speakersManager.addSpeakers(speakers);

        alert(`Terminé - ${newSpeakers} intervenants ajoutés (veuillez compléter leur bio)`);
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
            return false;
        }

        return channelId;
    }

    getSheetsPlaylistID(sheet) {

        let values = sheet.getRange(1, 1, 1, 2).getValues();

        // https://www.youtube.com/playlist?list=PLQNBggapGeH_7kXfyelk_ShC1a8HCsQE7

        let playlistId = values[0][1];
        let matches = playlistId.match(/list=([^&]+)/);

        if (matches && matches[1].length > 1)
            return matches[1];

        return false;
    }    

    getTabs()
    {
        return this.tabs;
    }

    createPlaylistTab() {
        const cols = ["Playlist", "https://www.youtube.com/playlist?list=PLQNBggapGeH_7kXfyelk_ShC1a8HCsQE7"];
        return this.createCommonTab(cols);   
    }

    createChannelTab() {
        const cols = ["Chaîne", "Ver de Terre Production", "Channel ID", "UCUaPiJJ2wH9CpuPN4zEB3nA", "https://stackoverflow.com/a/76285153"];        
        return this.createCommonTab(cols);
    }

    createCommonTab(cols) {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();

        sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
        sheet.getRange(3, 1, 1, this.columns.length).setValues([this.columns]).setFontWeight("bold");

        sheet.setFrozenRows(3);
        sheet.setFrozenColumns(4);      

        sheet.setRowHeightsForced(4, 900, 70);
        sheet.getRange(4, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        sheet.getRange(4, this.getColNumber("Titre"), 900, 1).setWrap(true).setFontWeight("bold");
        sheet.getRange(4, this.getColNumber("Description"), 900, 1).setWrap(true);
        sheet.getRange(4, this.getColNumber("Titre corrigé"), 900, 1).setWrap(true).setFontWeight("bold");
        sheet.getRange(4, this.getColNumber("Description courte"), 900, 1).setWrap(true);
        sheet.getRange(4, this.getColNumber("Intervenants"), 900, 1).setWrap(true);
        sheet.setColumnWidth(this.getColNumber("Titre"), 300);
        sheet.setColumnWidth(this.getColNumber("Description"), 300);
        sheet.setColumnWidth(this.getColNumber("Titre corrigé"), 300);
        sheet.setColumnWidth(this.getColNumber("Description courte"), 300);
        sheet.setColumnWidth(this.getColNumber("Intervenants"), 300);

        var range = sheet.getRange(4, this.getColNumber("ok pour wiki"), 900, 1).setHorizontalAlignment("center");
        var ruleImportRow = SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo("o")
          .setBackground("#B7E1CD")
          .setRanges([range])
          .build();    
        var ruleDoNotImportRow = SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo("n")
          .setBackground("#F4C7C3")
          .setRanges([range])
          .build();    
        var rules = sheet.getConditionalFormatRules();
        rules.push(ruleImportRow);
        rules.push(ruleDoNotImportRow);
        sheet.setConditionalFormatRules(rules);

        return sheet;
    }

    /**
     * Deprecated
     * @param {*} tabName 
     * @returns 
     */
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
            cols = ["Chaîne", "Ver de Terre Production", "Channel ID", "UCUaPiJJ2wH9CpuPN4zEB3nA", "https://stackoverflow.com/a/76285153"];
        }
        else if (tabName == "Vidéos d'une playlist")
        {
            cols = ["Playlist", "https://www.youtube.com/playlist?list=PLQNBggapGeH_7kXfyelk_ShC1a8HCsQE7"];
        }

        sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
        sheet.getRange(3, 1, 1, this.columns.length).setValues([this.columns]).setFontWeight("bold");

        sheet.setFrozenRows(3);
        sheet.setFrozenColumns(4);      

        sheet.setRowHeightsForced(4, 900, 70);
        sheet.getRange(4, 1, 900, sheet.getMaxColumns()).setVerticalAlignment("middle");

        // Wrap the description cols
        sheet.getRange(4, this.getColNumber("Titre"), 900, 1).setWrap(true).setFontWeight("bold");
        sheet.getRange(4, this.getColNumber("Description"), 900, 1).setWrap(true);
        sheet.getRange(4, this.getColNumber("Titre corrigé"), 900, 1).setWrap(true).setFontWeight("bold");
        sheet.getRange(4, this.getColNumber("Description courte"), 900, 1).setWrap(true);
        sheet.getRange(4, this.getColNumber("Intervenants"), 900, 1).setWrap(true);
        sheet.setColumnWidth(this.getColNumber("Titre"), 300);
        sheet.setColumnWidth(this.getColNumber("Description"), 300);
        sheet.setColumnWidth(this.getColNumber("Titre corrigé"), 300);
        sheet.setColumnWidth(this.getColNumber("Description courte"), 300);
        sheet.setColumnWidth(this.getColNumber("Intervenants"), 300);

        var range = sheet.getRange(4, this.getColNumber("ok pour wiki"), 900, 1).setHorizontalAlignment("center");
        var ruleImportRow = SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo("o")
          .setBackground("#B7E1CD")
          .setRanges([range])
          .build();    
        var ruleDoNotImportRow = SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo("n")
          .setBackground("#F4C7C3")
          .setRanges([range])
          .build();    
        var rules = sheet.getConditionalFormatRules();
        rules.push(ruleImportRow);
        rules.push(ruleDoNotImportRow);
        sheet.setConditionalFormatRules(rules);

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

    getSheetByName(sheetName)
    {
        let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        let sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet)
            Throw (`Tab ${sheetName} not found...?`);

        return sheet;
    }


}