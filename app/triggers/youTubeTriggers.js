function onFetchNewVideos(event = null)
{
    Logger.log('onFetchNewVideos');
        
    let ytModel = new YoutubeModel();

    // First lets check if we have a list of tabs to look for. If not, build it.
    let nextTab = ytModel.getNextTabInQueue();
    if (!nextTab)
    {
        alert("Les nouvelles vidéos ont été importées");
        return;
    }
    
    try {
        // Then for each tab, look for new videos
        while (nextTab) {
            ytModel.checkTime();

            ytModel.fetchNewVideosForTab(ytModel.getSheetByName(nextTab));

            nextTab = ytModel.shiftQueue();
        }
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            startTrigger('onFetchNewVideos');
            alert("Il reste des vidéos à importer, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);
    }

    removeTrigger();
    alert("Les nouvelles vidéos ont été importées");
}

function onFetchVideosDetails(event = null)
{
    Logger.log('onFetchVideosDetails');
    
    let ytModel = new YoutubeModel();

    // First lets check if we have a list of tabs to look for. If not, build it.
    let nextTab = ytModel.getNextTabInQueue();
    if (!nextTab)
    {
        alert(`Détail des vidéos récupéré pour les vidéos`);
        return;
    }

    // Then for each tab, look for new videos
    try {
        while (nextTab) {
            ytModel.checkTime();
            ytModel.fetchVideosDetailsForTab(ytModel.getSheetByName(nextTab));
            nextTab = ytModel.shiftQueue();
        } 
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            startTrigger('onFetchVideosDetails');
            alert("Il reste des vidéos à importer, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    removeTrigger();
    alert(`Détail des vidéos récupéré pour les vidéos`);
}

function onPushThumbnailsToWiki(event = null) {
    Logger.log('onPushThumbnailsToWiki');
    
    let ytModel = new YoutubeModel();

    // First lets check if we have a list of tabs to look for. If not, build it.
    let nextTab = ytModel.getNextTabInQueue();
    if (!nextTab)
    {
        alert("Vignettes exportées");
        return;
    }

    // Then for each tab, look for new videos
    try {
        while (nextTab) {
            ytModel.checkTime();
            ytModel.pushThumbnailsToWikiForSheet(ytModel.getSheetByName(nextTab));
            nextTab = ytModel.shiftQueue();
        } 
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            startTrigger('onFetchVideosDetails');
            alert("Il reste des vignettes à déposer sur le wiki, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    removeTrigger();
    alert("Vignettes exportées");
}

function onPushYoutubePagesToWiki(event = null) {
    Logger.log('onPushYoutubePagesToWiki');
    
    let ytModel = new YoutubeModel();

    // First lets check if we have a list of tabs to look for
    let nextTab = ytModel.getNextTabInQueue();
    if (!nextTab)
    {
        alert("Pages wiki créées");
        return;
    }

    // Then for each tab, look for new videos
    try {
        while (nextTab) {
            ytModel.checkTime();
            ytModel.pushYoutubePagesToWikiForSheet(ytModel.getSheetByName(nextTab));
            nextTab = ytModel.shiftQueue();
        } 
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            startTrigger('onPushYoutubePagesToWiki');
            alert("Il reste des pages wiki à créer sur le wiki, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    removeTrigger();
    alert("Pages wiki créées");
}
