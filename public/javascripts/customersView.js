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
        if (inside < allowed) {
            $('body').addClass("has-background-success").removeClass("has-background-warning");
            $('.may-enter').removeClass("is-hidden");
            $('.please-wait').addClass("is-hidden");
        } else if (inside === allowed) {
            $('body').addClass("has-background-success").removeClass("has-background-warning");
            $('.may-enter').addClass("is-hidden");
            $('.please-wait').removeClass("is-hidden");
        } else {
            $('body').addClass("has-background-warning").removeClass("has-background-success");
            $('.may-enter').addClass("is-hidden");
            $('.please-wait').removeClass("is-hidden");
        }
    })
}

$().ready(function () {
    updatePage()
    setInterval(updatePage, 5000)

})