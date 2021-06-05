let imagesUpdateTime = null;

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

function updateImages(images) {
    let imagesSection = $(".images");
    imagesSection.empty();
    let maskNotice = $('.mask-notice')
    maskNotice.addClass("is-hidden");
    for (const imageNumber in images){
        var imageWrapper = document.createElement('figure');
        imageWrapper.classList.add("image", "is-2", "is-128x128");
        var image = new Image();
        image.src = images[imageNumber];
        image.classList.add("is-rounded");
        imageWrapper.appendChild(image);
        imagesSection.append(imageWrapper);
        maskNotice.removeClass("is-hidden");
    }
}

function updatePage() {
    // update the status of the store
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
    // update the images
    httpGetAsync('/images', function(res) {
        res = JSON.parse(res);
        if (imagesUpdateTime === null || imagesUpdateTime !== res.imagesUpdateTime) {
            imagesUpdateTime = res.imagesUpdateTime;
            updateImages(res.images);
        }
    })
}

$(function () {
    updatePage()
    setInterval(updatePage, 1000)
})