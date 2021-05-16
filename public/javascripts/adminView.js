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
        $('#number_of_people_inside').val(inside)
        $('#number_of_people_allowed').val(allowed)
        $('#number_of_people_outside').val(outside)
        if (inside <= allowed) {
            $('.store-status').addClass("has-background-info")
            $('.store-status').removeClass("has-background-warning")
        } else {
            $('.store-status').addClass("has-background-warning")
            $('.store-status').removeClass("has-background-info")
        }
    })
}

$( function () {
    updatePage();
    let pageRefresh = setInterval(updatePage, 5000);
    $("#change-button").on("click", function () {
        $("#change-button").hide();
        $("#update-button").show();
        $("#cancel-button").show();
        $(".store-status input[type=number]").removeClass("is-static").removeAttr("readonly");
        clearInterval(pageRefresh);
    });
    $("#cancel-button").on("click", function () {
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number]").addClass("is-static").attr("readonly", "readonly");
        updatePage();
        pageRefresh = setInterval(updatePage, 5000);
    });
    $("#update-button").on("click", function () {
        $("body").addClass("is-loading");
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number]").addClass("is-static").attr("readonly", "readonly");
        let updatedStatus = {
            "allowed":$("#number_of_people_allowed").val(),
            "inside":$("#number_of_people_inside").val(),
            "outside":$("#number_of_people_outside").val()
        }
        $.post('/admin/updateStoreStatus', updatedStatus, function (data, status) {
            if(data === "OK") {
                $("body").removeClass("is-loading");
            } else {
                window.alert("Something went wrong!")
                location.reload();
            }
        })
        updatePage();
        pageRefresh = setInterval(updatePage, 5000);
    });
})