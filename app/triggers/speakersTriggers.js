
function onPushSpeakerPagesToWiki(event = null) {
    Logger.log('onPushSpeakerPagesToWiki');
    
    let speakears = new speakersModel();
    let counts = [0, 0, 0];

    try {
        speakears.pushSpeakersToWikiPrivate();
    } catch (e) {
        Logger.log(e);

        if (e == 'time up')
        {
            startTrigger('onPushSpeakerPagesToWiki');
            alert("Il reste des pages intervenants à créer sur le wiki, le processus se continuera en tâche de fond.");
            return;
        }

        throw(e);        
    }

    removeTrigger();
    alert(`${counts[0]} nouvelles pages, ${counts[1]} pages contributeur mises à jour (${counts[2]} n'ont pas été modifiées)`);
}
