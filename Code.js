function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp, SlidesApp or FormApp.
  ui.createMenu('Triple Performance')
    .addItem('Synchroniser les formations', 'syncTrainings')
    .addSeparator()
    .addSubMenu(ui.createMenu('Autres outils')
      .addItem('Créer des utilisateurs', 'createUsers'))
    .addSeparator()
    .addItem('Afficher les paramètres', 'showParameters')
      .addToUi();
}

function showParameters()
{
  let parameters = new tp_parameters();
  parameters.showSecrets();

  let toto = 4;
}
