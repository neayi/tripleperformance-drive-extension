
function testAPITools() {
    var apiTools = new api_tools('https://wiki.tripleperformance.fr', 'Bertrand Gorge@Triple_Performance_Robot', 'oggbeitecs3dgqtep18cbm3o5qhpakf2');

    var pageContent = apiTools.getPageContent("Sandbox");

    if (apiTools.hasTemplate(pageContent, "Article détaillé"))
        console.log("La template est bien dans la page.");
    else
        throw new Error("Template non trouvée");

    if (apiTools.hasTemplate(pageContent, "Template inexistante"))
        throw new Error("Template trouvée ?");
    else
        console.log("La template inéxistante n'est bien pas dans la page.");

    const newPageContent = apiTools.addValueToTemplate("Sandbox", pageContent, "Template de test", "test", "ok", true);
    console.log("Added the test parameter: " + newPageContent);

    // if (newPageContent)
    //   apiTools.updateWikiPage("Sandbox", newPageContent, "Ajout d'un paramètre à la template Template de test"); 

    const newerPageContent = apiTools.addValueToTemplate("Sandbox", newPageContent, "Template de test", "test", false, true);
    console.log("Removed the test parameter: " + newerPageContent);

    const withANewTemplate = apiTools.replaceTemplate('Template de test', 'Test template', ['test1 = 23', 'test2 = top'], newerPageContent);
    console.log("With the template fully replaced: " + withANewTemplate);

    const withoutANewTemplate = apiTools.removeTemplate('Test template', withANewTemplate);
    console.log("With the template fully removed: " + withoutANewTemplate);

    pageContent = apiTools.getPageContent("Abeille");
    var withNewKeyword = apiTools.insertKeywordInPage(pageContent, 'emberlificoter');
    withNewKeyword = apiTools.insertKeywordInPage(withNewKeyword, 'turlupiner');
    console.log("With keyword emberlificoter added: " + withNewKeyword);

    let pages = apiTools.getPagesForCategory("Category:Pollinisateurs");
    console.log("Pages dans la catégorie Pollinisateurs : " + pages);

    pages = apiTools.getPagesForTemplate("Template:Article détaillé");
    console.log("Pages dans avec la template Article détaillé : " + pages);

    pages = apiTools.getPagesWithForSemanticQuery("[[A un mot-clé::Transmettre sa ferme]]");
    console.log("Pages dans avec le mot clé Transmettre sa ferme : " + pages);

    pages = apiTools.getPagesWithTimestamp(10, true);
    console.log("Pages dans le namespace 10 (Timestamp de la template Bioagresseur) : " + pages.Bioagresseur);

    let templateParams = apiTools.getTemplateParams(pageContent, 'Auxiliaire');
    console.log("Paramètres de auxiliaires :" + [...templateParams.entries()]);

    let templates = apiTools.getUsedTemplates(false);
    console.log("Liste de toutes les templates utilisées sur le wiki :" + templates);

    // createwikiTitle
}
