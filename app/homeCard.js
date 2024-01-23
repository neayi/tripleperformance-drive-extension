// called by the add on when it is opened
function card_onHomepage(event)
{
    return card_buildHomepageCard();
}

function showImportCard()
{
    Logger.log('showImportCard');
}

function showParametersCard()
{
    return parametersbuildCard();
}

function showSyncCard()
{
    return syncTabsBuildCard();
}

function showTestCard()
{
    Logger.log('showTestCard');
}

function createFarmPortraitCreateTabsCard()
{
    return fermeCreateTabsBuildCard();
}

function UnhandledEvent(call)
{
    Logger.log(call);
}

/**
 * Built with https://gw-card-builder.web.app/#gahzZWN0aW9uc5GBp3dpZGdldHOZgqRncmlkhKtjb2x1bW5Db3VudAGldGl0bGWgq2JvcmRlclN0eWxlgqR0eXBlqU5PX0JPUkRFUqxjb3JuZXJSYWRpdXMApWl0ZW1zkYWlaW1hZ2WCqGltYWdlVXJp2VZodHRwczovL3dpa2kudHJpcGxlcGVyZm9ybWFuY2UuZnIvc2tpbnMvc2tpbi1uZWF5aS9mYXZpY29uL2xvZ28tdHJpcGxlLXBlcmZvcm1hbmNlLnN2Z6ljcm9wU3R5bGWCpHR5cGWwUkVDVEFOR0xFX0NVU1RPTathc3BlY3RSYXRpbwOmbGF5b3V0qlRFWFRfQkVMT1eldGl0bGWgrXRleHRBbGlnbm1lbnSlU1RBUlSoc3VidGl0bGWgs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSCrXRleHRQYXJhZ3JhcGiBpHRleHS5PGI+Q3LDqWVyIGxlcyBvbmdsZXRzPC9iPrNob3Jpem9udGFsQWxpZ25tZW50pVNUQVJUgqpidXR0b25MaXN0gadidXR0b25zk4KkdGV4dLFQb3J0cmFpdCBkZSBmZXJtZadvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSzTGlzdGUgZGUgZm9ybWF0aW9uc6dvbkNsaWNrgaZhY3Rpb26CqGZ1bmN0aW9upFRPRE+qcGFyYW1ldGVyc5CCpHRleHSvQ2hhw65uZSB5b3V0dWJlp29uQ2xpY2uBpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkKdjb2x1bW5zgatjb2x1bW5JdGVtc5GBp3dpZGdldHOQgadkaXZpZGVygIGtdGV4dFBhcmFncmFwaIGkdGV4dK48Yj5BY3Rpb25zPC9iPoKtZGVjb3JhdGVkVGV4dISodG9wTGFiZWygpHRleHSzVGVzdGVyIGxhIGNvbm5leGlvbqZidXR0b26DpHRleHSpRMOpbWFycmVyp29uQ2xpY2uCpmFjdGlvboKoZnVuY3Rpb26kVE9ET6pwYXJhbWV0ZXJzkLVvcGVuRHluYW1pY0xpbmtBY3Rpb26CqGZ1bmN0aW9urHNob3dUZXN0Q2FyZKpwYXJhbWV0ZXJzkKRpY29ugqlrbm93bkljb26qVklERU9fUExBWadhbHRUZXh02StUZXN0ZXIgbGEgY29ubmV4aW9uIGF2ZWMgVHJpcGxlIFBlcmZvcm1hbmNlq2JvdHRvbUxhYmVst1Rlc3RlciBsZXMgaWRlbnRpZmlhbnRzs2hvcml6b250YWxBbGlnbm1lbnSlU1RBUlSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0r1N5bmNocm9uaXNlci4uLqZidXR0b26EpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26sc2hvd1N5bmNDYXJkqnBhcmFtZXRlcnOQpGljb26DqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHSsU3luY2hyb25pc2VyqWltYWdlVHlwZaZTUVVBUkWoZGlzYWJsZWTCq2JvdHRvbUxhYmVs2SRTeW5jaHJvbmlzZXIgdmVycyBUcmlwbGUgUGVyZm9ybWFuY2WBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0qEltcG9ydGVyq2JvdHRvbUxhYmVsuEltcG9ydGVyIGxlcyBkb25uw6llcy4uLqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26uc2hvd0ltcG9ydENhcmSqcGFyYW1ldGVyc5CkaWNvboKpa25vd25JY29uqlZJREVPX1BMQVmnYWx0VGV4dKZpbXBvcnSBrWRlY29yYXRlZFRleHSEqHRvcExhYmVsoKR0ZXh0q1BhcmFtw6h0cmVzq2JvdHRvbUxhYmVsuFBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbqZidXR0b26DpHRleHSoQ2xpY2sgbWWnb25DbGlja4KmYWN0aW9ugqhmdW5jdGlvbqRUT0RPqnBhcmFtZXRlcnOQtW9wZW5EeW5hbWljTGlua0FjdGlvboKoZnVuY3Rpb26yc2hvd1BhcmFtZXRlcnNDYXJkqnBhcmFtZXRlcnOQpGljb26CqWtub3duSWNvbqpWSURFT19QTEFZp2FsdFRleHTZIVZvaXIgbGVzIHBhcmFtw6h0cmVzIGRlIGNvbm5leGlvbg==
 * 
 * @returns 
 */
function card_buildHomepageCard() {
    let cardSection1Grid1Item1Image1CropStyle1 = CardService.newImageCropStyle()
        .setAspectRatio(3)
        .setImageCropType(CardService.ImageCropType.RECTANGLE_CUSTOM);

    let cardSection1Grid1Item1Image1 = CardService.newImageComponent()
        .setImageUrl(
            'https://wiki.tripleperformance.fr/skins/skin-neayi/favicon/logo-triple-performance.svg'
        )
        .setCropStyle(cardSection1Grid1Item1Image1CropStyle1);

    let cardSection1Grid1Item1 = CardService.newGridItem()
        .setTextAlignment(CardService.HorizontalAlignment.START)
        .setLayout(CardService.GridItemLayout.TEXT_BELOW)
        .setImage(cardSection1Grid1Item1Image1);

    let cardSection1Grid1BorderStyle1 = CardService.newBorderStyle()
        .setType(CardService.BorderType.NO_BORDER)
        .setCornerRadius(0);

    let cardSection1Grid1 = CardService.newGrid()
        .setNumColumns(1)
        .setBorderStyle(cardSection1Grid1BorderStyle1)
        .addItem(cardSection1Grid1Item1);

    let cardSection1TextParagraph1 = CardService.newTextParagraph()
        .setText('<b>Créer les onglets</b>');

    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('createFarmPortraitCreateTabsCard');

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText('Portrait de ferme')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(cardSection1ButtonList1Button1Action1);

    let cardSection1ButtonList1Button2Action1 = CardService.newAction()
        .setFunctionName('UnhandledEvent')
        .setParameters({call: 'cardSection1ButtonList1Button2Action1'});

    let cardSection1ButtonList1Button2 = CardService.newTextButton()
        .setText('Liste de formations')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(cardSection1ButtonList1Button2Action1);

    let cardSection1ButtonList1Button3Action1 = CardService.newAction()
        .setFunctionName('UnhandledEvent')
        .setParameters({call: 'cardSection1ButtonList1Button3Action1'});

    let cardSection1ButtonList1Button3 = CardService.newTextButton()
        .setText('Chaîne youtube')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(cardSection1ButtonList1Button3Action1);

    let cardSection1ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection1ButtonList1Button1)
        .addButton(cardSection1ButtonList1Button2)
        .addButton(cardSection1ButtonList1Button3);

    let cardSection1Divider1 = CardService.newDivider();

    let cardSection1TextParagraph2 = CardService.newTextParagraph()
        .setText('<b>Actions</b>');

    let cardSection1DecoratedText1Button1Action1 = CardService.newAction()
        .setFunctionName('showTestCard')
        .setParameters({});

    let cardSection1DecoratedText1Button1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('Tester la connexion avec Triple Performance')
        .setOnClickAction(cardSection1DecoratedText1Button1Action1);

    let cardSection1DecoratedText1 = CardService.newDecoratedText()
        .setText('Tester la connexion')
        .setBottomLabel('Tester les identifiants')
        .setButton(cardSection1DecoratedText1Button1);

    let cardSection1DecoratedText2Button1Action1 = CardService.newAction()
        .setFunctionName('showSyncCard')
        .setParameters({});

    let cardSection1DecoratedText2Button1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('Synchroniser')
        .setOnClickAction(cardSection1DecoratedText2Button1Action1);

    let cardSection1DecoratedText2 = CardService.newDecoratedText()
        .setText('Synchroniser...')
        .setBottomLabel('Synchroniser vers Triple Performance')
        .setButton(cardSection1DecoratedText2Button1);

    let cardSection1DecoratedText3Button1Action1 = CardService.newAction()
        .setFunctionName('showImportCard')
        .setParameters({});

    let cardSection1DecoratedText3Button1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('import')
        .setOnClickAction(cardSection1DecoratedText3Button1Action1);

    let cardSection1DecoratedText3 = CardService.newDecoratedText()
        .setText('Importer')
        .setBottomLabel('Importer les données...')
        .setButton(cardSection1DecoratedText3Button1);

    let cardSection1DecoratedText4Button1Action1 = CardService.newAction()
        .setFunctionName('showParametersCard')
        .setParameters({});

    let cardSection1DecoratedText4Button1 = CardService.newImageButton()
        .setIcon(CardService.Icon.VIDEO_PLAY)
        .setAltText('Voir les paramètres de connexion')
        .setOnClickAction(cardSection1DecoratedText4Button1Action1);

    let cardSection1DecoratedText4 = CardService.newDecoratedText()
        .setText('Paramètres')
        .setBottomLabel('Paramètres de connexion')
        .setButton(cardSection1DecoratedText4Button1);

    let cardSection1 = CardService.newCardSection()
        .addWidget(cardSection1Grid1)
        .addWidget(cardSection1TextParagraph1)
        .addWidget(cardSection1ButtonList1)
        .addWidget(cardSection1Divider1)
        .addWidget(cardSection1TextParagraph2)
        .addWidget(cardSection1DecoratedText1)
        .addWidget(cardSection1DecoratedText2)
        .addWidget(cardSection1DecoratedText3)
        .addWidget(cardSection1DecoratedText4);

    let card = CardService.newCardBuilder()
        .addSection(cardSection1)
        .build();

    return card;
}