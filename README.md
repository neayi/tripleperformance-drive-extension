[![clasp](https://img.shields.io/badge/built%20with-clasp-4285f4.svg)](https://github.com/google/clasp)

This is the Triple Performance Add-On for Google Workspace. It allows to build Triple Performance farm portraits faster.

See https://tripleperformance.fr/

## Pushing to preprod

Pushing the add-on to Google is done though `clasp`:

```
clasp push
```

## Deploying a new version to production

In order to deploy a new version you first need to create a new version:

```
clasp deploy
```

Then copy the id of the new version to the [Apps Market API dashboard](https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk?project=triple-performance-add-on)

## Documentation
- Spreadsheet: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- YouTube API: https://developers.google.com/youtube/v3/docs
- Clasp: https://developers.google.com/apps-script/guides/clasp
- Google App Script extension for VSCode: https://marketplace.visualstudio.com/items?itemName=labnol.google-apps-script
- The Google card builder (which is lame): https://addons.gsuite.google.com/uikit/builder (the [old one](https://gw-card-builder.web.app/) was better)
- A good read the first time you need to publish to the App Store: https://gist.github.com/imthenachoman/6cff4a1170390f01c15d4da87110124a
- Another interesting blog: https://yagisanatode.com/
