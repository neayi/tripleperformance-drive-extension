

class tp_parameters {
    constructor() {
        this.parameterSheetName = 'Paramètres';

        this.secrets = {
            wikiURL: "",
            username: "",
            password: ""
        };
    }
   
    storeSecrets(secrets) {
        this.storeOneSecret('Wiki URL', secrets.wikiURL);
        this.storeOneSecret('Triple Performance Username', secrets.username);
        
        if (secrets.password.length > 0)
            this.storeOneSecret('Triple Performance Password', secrets.password);

        // Force reload the secrets
        this.loadSecrets(true);

        SpreadsheetApp.getUi().alert("Secrets enregistrés");
        
        return true;
    }

    storeOneSecret(key, value) {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let metaData = spreadsheet.createDeveloperMetadataFinder().withKey(key).find();
        if (metaData.length > 0)
            metaData[0].setValue(value);
        else
            spreadsheet.addDeveloperMetadata(key, value, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
    }

    loadSecrets(bForce = false) {
        if (bForce == false && this.secrets.wikiURL.length > 0)
            return; // secrets are already loaded

        this.secrets.wikiURL = this.loadOneSecret('Wiki URL');

        if (this.secrets.wikiURL.length == 0)
            this.secrets.wikiURL = "https://wiki.tripleperformance.fr/";

        this.secrets.username = this.loadOneSecret('Triple Performance Username');
        this.secrets.password = this.loadOneSecret('Triple Performance Password');

        return;
    }

    /**
     * Makes sure that secrets are fully set before going further
     */
    checkSecrets() {
        
        if (this.secrets.wikiURL.length == 0 ||
            this.secrets.username.length == 0 ||
            this.secrets.password.length == 0)
        {
            SpreadsheetApp.getUi().alert("Veuillez saisir les paramètres de l'add-on (identifiants et mots de passe du wiki)");
            return false;
        }

        return true;
    }

    loadOneSecret(key) {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let metaData = spreadsheet.createDeveloperMetadataFinder().withKey(key).find();
        if (metaData.length > 0)
            return metaData[0].getValue();

        return '';
    }
}

