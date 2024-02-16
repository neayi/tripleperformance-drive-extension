var cachedSecret = {
    wikiURL: "",
    username: "",
    password: ""
};

class tp_parameters {
    constructor() {

    }

    secrets() {
        return cachedSecret;
    }

    storeSecrets(secrets) {
        this.storeOneSecret('Wiki URL', secrets.wikiURL);
        this.storeOneSecret('Triple Performance Username', secrets.username);
        
        if (secrets.password.length > 0)
            this.storeOneSecret('Triple Performance Password', secrets.password);

        // Force reload the secrets
        this.loadSecrets(true);

        return true;
    }

    /**
     * Private
     */
    storeOneSecret(key, value) {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let metaData = spreadsheet.createDeveloperMetadataFinder().withKey(key).find();
        if (metaData.length > 0)
            metaData[0].setValue(value);
        else
            spreadsheet.addDeveloperMetadata(key, value, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
    }

    /**
     * Note : this call is pretty heavy (at least one sec) - do not mess with the bForce param !
     * @param {*} bForce 
     * @returns 
     */
    loadSecrets(bForce = false) {
        if (bForce == false && cachedSecret.wikiURL.length > 0)
            return; // secrets are already loaded

        cachedSecret.wikiURL = this.loadOneSecret('Wiki URL');

        if (cachedSecret.wikiURL.length == 0)
            cachedSecret.wikiURL = "https://wiki.tripleperformance.fr/";

        cachedSecret.username = this.loadOneSecret('Triple Performance Username');
        cachedSecret.password = this.loadOneSecret('Triple Performance Password');

        return;
    }

    /**
     * Makes sure that secrets are fully set before going further
     */
    checkSecrets() {
        
        if (cachedSecret.wikiURL.length == 0 ||
            cachedSecret.username.length == 0 ||
            cachedSecret.password.length == 0)
        {
            alert("Veuillez saisir les paramètres de l'add-on (identifiants et mots de passe du wiki)");
            return false;
        }

        return true;
    }

    /**
     * Private
     */
    loadOneSecret(key) {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let metaData = spreadsheet.createDeveloperMetadataFinder().withKey(key).find();
        if (metaData.length > 0)
            return metaData[0].getValue();

        return '';
    }
}

