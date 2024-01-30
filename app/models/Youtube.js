class YoutubeModel {
    constructor() {
        this.apiTools = false;

        this.defGeneralites = {};
    }

    fetchVideosFromYouTube() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let channelId = this.getSheetsChannelID(sheet);
        if (!channelId) {
            SpreadsheetApp.getUi().alert("Veuillez saisir un ID de chaîne valide");
            return;
        }

        let existingValues = sheet.getDataRange().getValues();
        let existingYouTubeIds = existingValues.map(function (r) { return r[0]; }).filter(function (v) { return v != "" });

        sheet.getRange(3, 1, 1, 16).setValues([
            ["ID", "URL", "Titre", "Description", "Producteur", "Date de mise en ligne", 
             "Durée", "Sous-titres", "Vues", "Commentaires",
             "Titre corrigé", "Description courte", "Production", "Intervenants", "Mots clés",
             "wiki"
            ]]);

        let sr = YouTube.Search.list("snippet, id", { 
            channelId: channelId,
            maxResults: 10,
            order: 'date' });

        let vids = sr.items.filter(function (res) { return res.id.kind === "youtube#video" });

        let ids = vids.map(function (v) { return v.id.videoId; });

        let newVideosIds = ids.filter(function (videoId) { return existingYouTubeIds.indexOf(videoId) == -1 });
        
        if (newVideosIds.length == 0)
        {
            SpreadsheetApp.getUi().alert("Aucune vidéo trouvée");
            return;
        }

        let videosDetails = this.fetchDetailsForVideoIDs(ids);

        Logger.log(videosDetails);

        videosDetails.forEach(row => {
            sheet.appendRow(row);
        });

        SpreadsheetApp.getUi().alert("Liste des vidéos mise à jour");
    }

    findVideosForChannel(channelID)
    {


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

        let data = vids.map(function (v) { 
            
            let duration = v.contentDetails.duration; // PT5M45S
            let matches = duration.match(/^PT(([0-9]+)H)?(([0-9]+)M)?([0-9]+S)?$/);
            let minutes = (matches[2]??0) * 60 + Number(matches[4]??0);

            let publishedAt = new Date(v.snippet.publishedAt);

            return [
                v.id,
                "https://www.youtube.com/watch?v=" + v.id,
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
            ]
        });

        return data;
    }

    syncYoutubeToWiki() {
        let sheet = SpreadsheetApp.getActiveSheet();

        let data = sheet.getDataRange();
        let startRow = data.getRow();

        let idFound = false;

        data.getValues().forEach((row, rowIndex) => {
            if (!idFound && row[0] == "ID")
            {
                idFound = true;
                return;
            }

            if (!idFound)
                return;

            let [videoID, url, title, description, channelTitle, publishedAt, duration,
                   hasCaptions, viewCount, commentCount, fixedTitle, fixedDescription, 
                   production, intervenants, tags, ...others] = row;
            
            publishedAt = publishedAt.toISOString().substring(0, 10);

            if (videoID.length != 11)
                return;

            let params = new Map();
            params.set('Titre',         "Titre = " + fixedTitle);
            params.set('Producteur',    "Producteur = " + channelTitle);
            params.set('Vignette',      `Vignette = thumbnail_youtube_${videoID}.jpg`);
            params.set('Date de mise en ligne', `Date de mise en ligne = ${publishedAt}`);
            params.set('Durée',         `Durée = ${duration} minutes`);
            params.set('Production',    "Production = " + production);
            params.set('Vidéo',         `Vidéo = https://www.youtube.com/watch?v=${videoID}`);
            
            intervenants.split(',').forEach((intervenant, i) => {
                intervenant = intervenant.trim();
                if (intervenant.length == 0)
                    return;
                params.set('Intervenants ' + i, `Intervenants ${i} = ${intervenant}`);
            });
            
            tags.split(',').forEach((tag, i) => {
                tag = tag.trim();
                if (tag.length == 0)
                    return;
                params.set('Tag ' + i, `Tag ${i} = ${tag}`);
            });

            const wikipage = new wikiPage();
            let content = wikipage.buildTemplateFromMap('vidéo', params);

            content += "\n\n" + fixedDescription;

            sheet.getRange(rowIndex + startRow, 17, 1, 1).setValue(content);
        });
    }

    getSheetsChannelID(sheet) {
        let channelId = "";
        let values = sheet.getRange(1, 1, 1, 4).getValues();

        if ((values[0][0] == "Chaîne" || values[0][0] == "Chaine" || values[0][0] == "Channel")
            && values[0][2] == "Channel ID") {
            channelId = values[0][3];
        }

        if (channelId == "") {
            Logger.log(values);
            return false;
        }

        return channelId;
    }

    createNewSheet() {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet();
        sheet.setName("Vidéos de la chaîne quelquechose");

        sheet.getRange(1, 1, 1, 5).setValues([["Chaîne", "", "Channel ID", "", "https://stackoverflow.com/a/76285153"]]);
        sheet.getRange(3, 1, 1, 4).setValues([["ID", "URL", "Titre", "Description"]]);
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