$().ready(function () {
    updatePage()
    setInterval(updatePage, 5000)
})

function updatePage() {
    var currently = parseInt($('#number_of_people').text())
    var allowed = parseInt($('#number_of_people_allowed').text())
    if (currently <= allowed) {
        $('body').css("background-color", "lightgreen")
    } else {
        $('body').css("background-color", "lightcoral")
    }
}