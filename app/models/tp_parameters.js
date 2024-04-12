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

        try {
            let userProperties = PropertiesService.getUserProperties();

            let newProperties = {
                'Triple Performance Wiki URL': secrets.wikiURL,
                'Triple Performance Username': secrets.username.trim()
            };

            if (secrets.password.length > 0)
            {
                newProperties = {
                    'Triple Performance Wiki URL': secrets.wikiURL,
                    'Triple Performance Username': secrets.username.trim(),
                    'Triple Performance Password': secrets.password.trim(),
                };
            }

            userProperties.setProperties(newProperties);
        } catch (error) {
            Logger.log(error);
        }
        
        // Force reload the secrets
        this.loadSecrets(true);

        return true;
    }


    /**
     * Note : this call is pretty heavy (at least one sec) - do not mess with the bForce param !
     * @param {*} bForce 
     * @returns 
     */
    loadSecrets(bForce = false) {
        if (bForce == false && cachedSecret.wikiURL.length > 0)
            return; // secrets are already loaded

        try
        {
            const userProperties = PropertiesService.getUserProperties();
            cachedSecret.wikiURL = userProperties.getProperty('Triple Performance Wiki URL');
            cachedSecret.username = userProperties.getProperty('Triple Performance Username');
            cachedSecret.password = userProperties.getProperty('Triple Performance Password');

            if (cachedSecret.username == null)
            {
                this.getSecretsFromMetadata();
            }
            
        } catch (err) {
            Logger.log('Failed with error %s', err.message);
        }

        if (cachedSecret.wikiURL.length == 0)
            cachedSecret.wikiURL = "https://wiki.tripleperformance.fr/";

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
     * 
     * Try to retrieve the properties from the DeveloperMetadata store, and 
     * store them in the UserProperties
     */
    getSecretsFromMetadata() {
        
        cachedSecret.wikiURL = this.loadOneSecret('Wiki URL');
        cachedSecret.username = this.loadOneSecret('Triple Performance Username');
        cachedSecret.password = this.loadOneSecret('Triple Performance Password');

        if (cachedSecret.wikiURL.length > 0 ||
            cachedSecret.username.length > 0 ||
            cachedSecret.password.length > 0)
        {
            try {
                let userProperties = PropertiesService.getUserProperties();
                let newProperties = {
                    'Triple Performance Wiki URL': cachedSecret.wikiURL,
                    'Triple Performance Username': cachedSecret.username,
                    'Triple Performance Password': cachedSecret.password,
                };
    
                userProperties.setProperties(newProperties);
            } catch (error) {
                Logger.log(error);
            }

        }
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

