function httpGetAsync(theUrl, callback)
{
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function updatePage() {
    httpGetAsync('/status', function(res){
        res = JSON.parse(res)
        let currently = res.currently
        let allowed = res.allowed
        $('#number_of_people').text(currently)
        $('#number_of_people_allowed').text(allowed)
        if (currently <= allowed) {
            $('body').css("background-color", "lightgreen")
        } else {
            $('body').css("background-color", "lightcoral")
        }
    })
}

$().ready(function () {
    updatePage()
    setInterval(updatePage, 5000)

})