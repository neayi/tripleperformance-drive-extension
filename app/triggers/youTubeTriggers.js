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
            ytModel.startTrigger('onFetchNewVideos');
            alert("Il reste des vidéos à importer, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);
    }

    ytModel.removeTrigger();
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
            ytModel.startTrigger('onFetchVideosDetails');
            alert("Il reste des vidéos à importer, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    ytModel.removeTrigger();
    alert(`Détail des vidéos récupéré pour les vidéos`);
}

function onAddThumbnailsToWiki(event = null) {
    Logger.log('onAddThumbnailsToWiki');
    
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
            ytModel.addThumbnailsToWikiForSheet(ytModel.getSheetByName(nextTab));
            nextTab = ytModel.shiftQueue();
        } 
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            ytModel.startTrigger('onFetchVideosDetails');
            alert("Il reste des vignettes à déposer sur le wiki, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    ytModel.removeTrigger();
    alert("Vignettes exportées");
}
