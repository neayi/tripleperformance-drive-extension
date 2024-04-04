
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

    const newPageContent = wiki.addValueToTemplate(pageContent, "Ma template", "test", "ok", true);
    console.log("Added the test parameter: " + newPageContent);

    // if (newPageContent)
    //   apiTools.updateWikiPage(newPageContent, "Ajout d'un paramètre à la template Template de test"); 

    const newerPageContent = wiki.addValueToTemplate(newPageContent, "Ma template", "test", false, true);
    console.log("Removed the test parameter: " + newerPageContent);

    const withANewTemplate = wiki.replaceTemplate('Ma template', 'Auxiliaire', ['test1 = 23', 'test2 = top'], newerPageContent);
    console.log("With the template fully replaced: " + withANewTemplate);

    const withoutANewTemplate = wiki.removeTemplate('Ma template', newerPageContent);
    console.log("With the template 'Ma template' fully removed: " + withoutANewTemplate);

    var withNewKeyword = wiki.insertKeywordInPage(withANewTemplate, 'emberlificoter');
    withNewKeyword = wiki.insertKeywordInPage(withNewKeyword, 'turlupiner');
    console.log("With keyword emberlificoter added: " + withNewKeyword);

    let templateParams = wiki.getTemplateParams(withNewKeyword, 'Auxiliaire');
    console.log("Paramètres de auxiliaires :" + [...templateParams.entries()]);

    let params = new Map();
    params.set("Tag 2", "toto");
    params.set("Image", "Une image.jpg");
    params.set("Rhinocéros", "Un rhino");

    Logger.log(wiki.updateTemplate("Ma template", params, pageContent));
}

function testAPITools() {
    var apiTools = new api_tools('https://wiki.tripleperformance.fr', 'redacted', 'redacted');

    let testValues = apiTools.getSemanticValuesWithForSemanticQuery("[[A un type de page::Personne]]", ['A un nom', 'Biographie', 'A une photo']);
    Logger.log(testValues);

    var pageContent = apiTools.getPageContent("Sandbox");
    console.log("Sandbox : " + pageContent);

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
