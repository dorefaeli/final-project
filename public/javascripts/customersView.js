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
        let inside = res.inside
        let allowed = res.allowed
        let outside = res.outside
        $('#number_of_people_inside').text(inside)
        $('#number_of_people_allowed').text(allowed)
        $('#number_of_people_outside').text(outside)
        if (inside <= allowed) {
            $('body').addClass("has-background-success")
            $('body').removeClass("has-background-warning")
        } else {
            $('body').addClass("has-background-warning")
            $('body').removeClass("has-background-success")
        }
    })
}

$().ready(function () {
    updatePage()
    setInterval(updatePage, 5000)

})