[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp)

This is the Triple Performance Add-On for Google Workspace. It allows to build Triple Performance farm portraits faster.
Marketplace : https://workspace.google.com/marketplace/app/triple_performance/427792115089  

### Documentation on usage
Installation: https://wiki.tripleperformance.fr/wiki/Aide:Utiliser_l%27add-on_Triple_Performance_pour_Google_Spreadsheet
Usage: https://wiki.tripleperformance.fr/wiki/Aide:Ins%C3%A9rer_des_graphiques_dans_une_page
 
## Setup Clasp
`clasp`  lets you to develop your Apps Script projects locally. You can write code on your own computer and upload it to Apps Script when you're done. You can also download existing Apps Script projects so that you can edit them when you're offline. Since the code is local, you can use your favorite development tools like  [`git`](https://git-scm.com/)  when building Apps Script projects.
https://developers.google.com/apps-script/guides/clasp

## Pushing to preprod
Pushing the add-on to Google is done though `clasp`:

```
clasp push
```
## Deploying a new version to production

 1. In order to deploy a new version you first need to create a new version:
```
clasp deploy
```

 2. Then copy the id of the new version to the [Apps Market API dashboard](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=triple-performance-add-on)

 3. Then publish the new version for other users on the [Marketplace tab](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=triple-performance-add-on)  

### Publishing issues
Sometimes publishing fails with no apparent reason. Here are a few things we've learned over time:
* **Look at the console log**: the publish button calls an API that pushes and returns JSON that might explain things. Use LLM to analyse those. Once the issue was that the icons and screenshots that were uploaded in the [Marketplace tab](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish?project=triple-performance-add-on) were no longer valid, so we had to reupload them in order to be able to publish.
* Make sure the OAuth scopes are consistent between your .clasp.json file and the [Apps Market API dashboard](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=triple-performance-add-on).

## Documentation
- Spreadsheet: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- YouTube API: https://developers.google.com/youtube/v3/docs
- Clasp: https://developers.google.com/apps-script/guides/clasp
- Google App Script extension for VSCode: https://marketplace.visualstudio.com/items?itemName=labnol.google-apps-script
- The Google card builder (which is lame): https://addons.gsuite.google.com/uikit/builder (the [old one](https://gw-card-builder.web.app/) was better)
- A good read the first time you need to publish to the App Store: https://gist.github.com/imthenachoman/6cff4a1170390f01c15d4da87110124a
- Another interesting blog: https://yagisanatode.com/