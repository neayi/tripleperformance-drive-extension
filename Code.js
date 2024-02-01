function onOpen() {
 
}

function testUploadImages()
{
    let imageURL = 'https://import.cdn.thinkific.com/457832/courses/1566768/nWkex2ZlSGGRx3s3BuVk_Atelier%20visuel%20vignette%20EL%20Thinkific%20-%20760%20x%20420%20%2819%29.png';
    let desFilename = 'Illustration Formation cl-ag-prati.jpg';
    let comment = "Image accompagnant la formation [[Diagnostiquer l'impact des pratiques agricoles avec le redox (formation)]]";
    let apiTools = new api_tools('https://wiki.tripleperformance.fr', 'Bertrand Gorge@Triple_Performance_Robot', 'oggbeitecs3dgqtep18cbm3o5qhpakf2');

    let ret = apiTools.uploadImage(imageURL, desFilename, comment);

    Logger.log(ret);
}