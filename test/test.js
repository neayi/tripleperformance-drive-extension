
function testUpdate() {
    var wiki = new wikiPage();

    let pageContent = `Du blah blah...

    Au milieu, soudain, une template !

    {{Ma template | Nom = un nom
| Tag 1 = titi
| Image = Une autre image.png
| Elephant = un éléphant
}}

Et encore un peu de texte...`;

    if (wiki.hasTemplate(pageContent, "Ma template"))
        console.log("La template est bien dans la page.");
    else
        throw new Error("Template non trouvée");

    if (wiki.hasTemplate(pageContent, "Template inexistante"))
        throw new Error("Template trouvée ?");
    else
        console.log("La template inéxistante n'est bien pas dans la page.");

    const newPageContent = wiki.addValueToTemplate(pageContent, "Template de test", "test", "ok", true);
    console.log("Added the test parameter: " + newPageContent);

    // if (newPageContent)
    //   apiTools.updateWikiPage(newPageContent, "Ajout d'un paramètre à la template Template de test"); 

    const newerPageContent = wiki.addValueToTemplate(newPageContent, "Template de test", "test", false, true);
    console.log("Removed the test parameter: " + newerPageContent);

    const withANewTemplate = wiki.replaceTemplate('Template de test', 'Test template', ['test1 = 23', 'test2 = top'], newerPageContent);
    console.log("With the template fully replaced: " + withANewTemplate);

    const withoutANewTemplate = wiki.removeTemplate('Test template', withANewTemplate);
    console.log("With the template fully removed: " + withoutANewTemplate);

    pageContent = wiki.getPageContent("Abeille");
    var withNewKeyword = wiki.insertKeywordInPage(pageContent, 'emberlificoter');
    withNewKeyword = wiki.insertKeywordInPage(withNewKeyword, 'turlupiner');
    console.log("With keyword emberlificoter added: " + withNewKeyword);

    let templateParams = wiki.getTemplateParams(pageContent, 'Auxiliaire');
    console.log("Paramètres de auxiliaires :" + [...templateParams.entries()]);

    let params = new Map();
    params.set("Tag 2", "toto");
    params.set("Image", "Une image.jpg");
    params.set("Rhinocéros", "Un rhino");

    Logger.log(wiki.updateTemplate("Ma template", params, pageContent));
}

function testAPITools() {
    var apiTools = new api_tools('https://wiki.tripleperformance.fr', 'Bertrand Gorge@Triple_Performance_Robot', 'oggbeitecs3dgqtep18cbm3o5qhpakf2');

    var pageContent = apiTools.getPageContent("Sandbox");
    
    let pages = apiTools.getPagesForCategory("Category:Pollinisateurs");
    console.log("Pages dans la catégorie Pollinisateurs : " + pages);

    pages = apiTools.getPagesForTemplate("Template:Article détaillé");
    console.log("Pages dans avec la template Article détaillé : " + pages);

    pages = apiTools.getPagesWithForSemanticQuery("[[A un mot-clé::Transmettre sa ferme]]");
    console.log("Pages dans avec le mot clé Transmettre sa ferme : " + pages);

    pages = apiTools.getPagesWithTimestamp(10, true);
    console.log("Pages dans le namespace 10 (Timestamp de la template Bioagresseur) : " + pages.Bioagresseur);

    let templates = apiTools.getUsedTemplates(false);
    console.log("Liste de toutes les templates utilisées sur le wiki :" + templates);

    // createwikiTitle
}
