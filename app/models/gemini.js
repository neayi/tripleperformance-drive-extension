class tp_gemini {
  constructor() {

  }

  getModels() {
    return  [
      {
        "Variant": "Preview de Gemini 2.5 Pro",
        "Model": "gemini-2.5-pro-preview-03-25",
        "Description": "Pensée et raisonnement améliorés, compréhension multimodale, codage avancé, etc.",
        "RPM": "5",
        "TPM": "1 000 000",
        "RPD": "25"
      },
      {
        "Variant": "Gemini 2.0 Flash",
        "Model": "gemini-2.0-flash",
        "Description": "Fonctionnalités de nouvelle génération, vitesse, réflexion, streaming en temps réel et génération multimodale",
        "RPM": "15",
        "TPM": "1 000 000",
        "RPD": "1 500"
      },
      {
        "Variant": "Gemini 2.0 Flash-Lite",
        "Model": "gemini-2.0-flash-lite",
        "Description": "Efficacité économique et faible latence",
        "RPM": "30",
        "TPM": "1 000 000",
        "RPD": "1 500"
      },
      {
        "Variant": "Gemini 1.5 Flash",
        "Model": "gemini-1.5-flash",
        "Description": "Performances rapides et polyvalentes pour diverses tâches",
        "RPM": "15",
        "TPM": "1 000 000",
        "RPD": "1 500"
      },
      {
        "Variant": "Gemini 1.5 Flash-8B",
        "Model": "gemini-1.5-flash-8b",
        "Description": "Tâches à fort volume et à faible intelligence",
        "RPM": "15",
        "TPM": "1 000 000",
        "RPD": "1 500"
      },
      {
        "Variant": "Gemini 1.5 Pro",
        "Model": "gemini-1.5-pro",
        "Description": "Tâches de raisonnement complexes nécessitant plus d'intelligence",
        "RPM": "2",
        "TPM": "32 000",
        "RPD": "50"
      }
    ];
  }

  /**
   * Selects the API model and sets relevant properties.
   * @param {string} modelName - The model name to select.
   */
  selectModel(modelName) {
    PropertiesService.getUserProperties().setProperty('geminiModelName', modelName);
  }

  getSelectedModel() {
    let storedModelName = PropertiesService.getUserProperties().getProperty('geminiModelName');
    if (!storedModelName) {
      storedModelName = 'gemini-1.5-flash-8b'; // Default model
      PropertiesService.getUserProperties().setProperty('geminiModelName', storedModelName);
    }

    return storedModelName;
  }

  getGeminiApiKey() {
    const apiKey = PropertiesService.getUserProperties().getProperty('geminiApiKey');
    if (!apiKey) {
      throw new Error('API key not set. Please set it before using.');
    }
    return apiKey.trim();
  }

  callGeminiAPI(inputText) {
    // Checks and sets a default model if not already set.
    const storedModelName = this.getSelectedModel();

    // try {
    //   // Retrieves the API key and throws an error if it is not set.
    //   const apiKey = this.getGeminiApiKey();
     

    //   // Constructs the request URL, setting a default if no specific URL is stored.
    //   const baseModelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${storedModelName}:generateContent`;
    //   const url = `${baseModelUrl}?key=${apiKey}`;

    //   console.log("Calling " + baseModelUrl);

    //   // Sets the request options, including payload and HTTP headers.
    //   const options = {
    //     method: "post",
    //     contentType: 'application/json',
    //     payload: JSON.stringify({
    //       contents: [{role: "user", parts: [{text: inputText}]}],
    //       safetySettings: [
    //         { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    //         { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    //         { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    //         { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    //       ]
    //     }),
    //     muteHttpExceptions: true
    //   };

    //   // Sends the API request and handles the response.
    //   const response = UrlFetchApp.fetch(url, options);
    //   if (response.getResponseCode() !== 200) {
    //     throw new Error(`API request failed with status ${response.getResponseCode()}`);
    //   }

    //   console.log("ok");

    //   // Parses the response and returns the generated content.
    //   const responseData = JSON.parse(response.getContentText());
    //   return responseData.candidates[0].content.parts[0].text.trim();
    // } catch (error) {
    //   console.log(error.message);
    //   throw new Error("Failed to reach Gemini API: " + error.message);
    // }
  }

  /**
   * Executes batch processing on a selection of cells in the active spreadsheet,
   * applying a specified delay between processing each cell.
   * 
   * @param {number} delay - The delay in seconds between processing each cell.
   */
  runGeminiOnSelection() {
    console.log("runGeminiOnSelection");

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const range = sheet.getActiveRange();
    const values = range.getValues();

    // First, mark all cells as 'pending' for processing
    values.forEach((row, i) => {
      row.forEach((_, j) => {
        const cell = range.getCell(i + 1, j + 1);
        cell.setBackground('#ffcc00');  // Temporary color indicating processing
      });
    });

    SpreadsheetApp.flush();
    const currentModel = this.getSelectedModel();
    const models = this.getModels();
    let currentModelRPM = 1;
    models.forEach(model => {
      if (model.Model == currentModel)
        currentModelRPM = model.RPM;
    });

    console.log("Running batch at " + currentModelRPM + " RPM");
    let startTime = new Date();

    let callCount = 0;

    // Process each cell with a delay
    values.forEach((row, i) => {
      row.forEach((value, j) => {
        const cell = range.getCell(i + 1, j + 1);
        cell.clearNote();
        cell.setComment('Processing now...');

        try {
          const result = this.callGeminiAPI(value);
          cell.setValue(result);
          cell.setBackground(null);  // Reset background after processing
        } catch (e) {
          cell.setValue(e.message);
          cell.setBackground('#ff0000');  // Red background on error
        }

        cell.clearNote();
        SpreadsheetApp.flush();

        callCount++;

        if (callCount >= currentModelRPM) {
          
          const endTime = new Date();

          const elapsedTime = endTime - startTime;

          if (elapsedTime < 600000) // less than a minute, in milliseconds
            Utilities.sleep(60000 - elapsedTime);

          startTime = new Date();
          callCount = 0;
        }      
      });
    });
  }


  /**
   * Adds input text to a processing queue and returns the state of the queue.
   * If the queue reaches a predefined batch size, it triggers a batch processing.
   *
   * @param {string} inputText - The text to be added to the processing queue.
   * @returns {string} - A message indicating the processing state: either waiting for more inputs ("Loading...")
   *                     or starting the batch processing ("Processing..."). If no input text is provided, 
   *                     it prompts the user to provide text.
   */
  gemini_api(inputText) {
    const batchSize = 1; // Number of entries in the queue required to trigger processing
    const queue = CacheService.getScriptCache(); // Access to the script's cache service
    const cacheKey = "geminiQueue"; // Key under which the queue is stored in the cache

    if (!inputText) return "Please provide input text."; // Check for empty input and prompt for text

    // Retrieve the current queue from cache, or initialize it if not present
    let currentQueue = queue.get(cacheKey) || JSON.stringify([]);
    currentQueue = JSON.parse(currentQueue);
    currentQueue.push(inputText); // Add new input text to the queue
    queue.put(cacheKey, JSON.stringify(currentQueue), 21600); // Update the queue in the cache with a 6-hour expiration

    // Check if the queue length is equal to the batch size to trigger processing
    if (currentQueue.length % batchSize === 0) {
      const batch = currentQueue.splice(0, batchSize); // Remove processed items from the queue
      queue.put(cacheKey, JSON.stringify(currentQueue), 21600); // Update the cache after removing processed items
      return "Processing..."; // Return processing message when batch size is met
    }

    return "Loading..."; // Return loading message if batch size is not yet met
  }
}
