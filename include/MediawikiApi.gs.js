class MediawikiAPI {
  constructor(api, username, password) { // class constructor
    this.api = api;
    this.username = username;
    this.password = password;

    this.cookie = "";

    this.noParameterNeeded = ['login', 'logout', 'rsd'];
  }

  /** Dynamic method server
   *
   * This builds dynamic api calls based on the protected apiMethods var.
   * If the method exists in the array then it is a valid api call and
   * based on some php5 magic, the call is executed.
   *
   * @param string method the api action to call
   * @param array  args   parameters for the api action
   *
   * @throws \BadMethodCallException if you are trying to call an invalid api action (aka not in \MediaWikiBot\MediaWikiBot::apiMethods)
   * @return mixed
   */
  __call(method, args) {
    return this.standard_process(method, args);
  }

  query(args) {
    return this.__call('query', args);
  }

  edit(args) {
    return this.__call('edit', args);
  }
  
  upload(args) {
    return this.__call('upload', args);
  }
  
  /**
   * Return edit token - if none is available try to get one from the api
   *
   * @return  string  the edit token
   */
  getEditToken(bForce = false) {
    if (bForce || this.editToken == null) {
      this.editToken = this.acquireEditToken();
    }
    return this.editToken;
  }

  /**
   * Log in and get the authentication tokens
   *
   * MediaWiki requires a dual login method to confirm authenticity. This
   * entire method takes that into account.
   *
   * @param bool init controls state in dual login process, do not provide manually!
   *
   * @return array    return result of login attempt. note: successful login is indicated via: data['login']['result'] == "Success"
   */
  login(init = null) {
    // build the url
    var url = this.api_url('login');

    // build the params
    var params = {
      'lgname': this.username,
      'lgpassword': this.password,
      'format': 'php'
    };

    // get initial login info
    var results = null;
    if (init == null) {
      results = this.login(true);
    }

    // pass token if not null
    if (results != null) {
      params['lgtoken'] = results['login']['token'];
    }

    // get the data
    var data = this.curl_post(url, params);

    // return data, success or not. let caller deal with flow handling
    return data;
  }

  /**
   * Enables or disables the debug mode
   *
   * @param bool debugMode
   */
  setDebugMode(debugMode) {
    this.debugMode = debugMode;
  }

  /**
   * Try to acquire an edit token from the api. If successful, return it
   *
   * @return string   the edit token
   */
  acquireEditToken() {
    let editToken = null;

    // see https://www.mediawiki.org/wiki/API:Tokens
    const data = {
      'type': 'csrf',
      'meta': 'tokens'
    };

    const ret = this.query(data);
    if (ret.query.tokens.csrftoken) {
      editToken = ret.query.tokens.csrftoken;
    }

    return editToken;
  }

  /**
   * Build the needed api url
   *
   * @param string function which action to use in url
   *
   * @return string beginning part of the api url including the action parameter
   */
  api_url(strFunction) {
    // return the url
    return this.api + "?action=" + strFunction + "&";
  }

  /**
   * Execute curl post
   *
   * @param string url       full url to api.php, followed by the action=<action> part
   * @param array  params    api parameters to use in the request
   * @param bool   multipart is this a multipart action/request?
   *
   * @return array|string     the formatted curl request result. format depends on `params['format']`
   */
  curl_post(url, params) {
    params['format'] = 'json';

    var options = {
      'method': 'post',
      'payload': params
    };

    if (this.cookie != "") {
      if (!options.headers) {
        options.headers = { Cookie: this.cookie };
      } else if (!options.headers["Cookie"]) {
        options.headers["Cookie"] = this.cookie;
      }
    }

    var results = UrlFetchApp.fetch(url, options);

    const returnHeaders = results.getAllHeaders();
    if (returnHeaders["Set-Cookie"])
      this.cookie = returnHeaders["Set-Cookie"];

    if (results === false) {
      strError = "request to " + url + "\n";
      strError += "with data " + params;
      strError += "posted as " + contentType + "\n\n";
      strError += "Error " + results.getResponseCode() + "\n";

      throw new Error("Error Processing Request\n" + strError, 1);
    }

    // return the un-serialized results
    try {
      var json = results.getContentText();

      return JSON.parse(json);

    } catch (th) {
      throw new Error("Unable to format results: " + results, 1);
    }
  }

  /**
   * Check for null params
   *
   * If needed params are not passed then kill the script.
   *
   * @param mixed params your parameter array
   *
   * @throws \BadMethodCallException if parameters array is not set or empty
   */
  check_params(params) {
    // check for null
    if (params == null || params.length == 0) {
      throw new Error("You did not pass any parameters for your action!");
    }
  }

  /**
   * Standard processing method
   *
   * The standard process methods calls the correct api url with params
   * and executes a curl post request.  It then returns processed data
   * based on what format has been set (default=php).
   *
   * @param string     method    the api action
   * @param array|null params    parameter array for the api request
   *
   * @return array|string     the result of the api request
   */
  standard_process(method, params = null) {
    // check for null params
    if (this.noParameterNeeded.find((element) => element == method) == undefined) {
      this.check_params(params);
    }

    // build the url
    var url = this.api_url(method);

    // get the data
    var data = this.curl_post(url, params);

    // set smwinfo
    // @FIXME deprecated?
    this.method = data;

    // return the data
    return data;
  }

  /**
   * Build a url string out of params (aka everything after api.php?action=<action>&; url-encodes the parameter keys and values
   *
   * @param array params your parameter array
   *
   * @return string the assembled, url-encoded and &-concatenated url string to append after the api-action
   */
  urlize_params(params) {
    // url-ify the data for POST
    urlString = "";

    params.forEach(function (value, key) {
      urlString += urlencode(key) + '=' + urlencode(value) + '&';
    });

    // pull the & off the end
    rtrim(urlString, '&');

    // return the string
    return urlString;
  }

}
