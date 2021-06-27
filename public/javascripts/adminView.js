function SayThis(what, value) {
    console.log(what);
    console.log(value);
}

const report_types = {
    TotalPerHourThisDay: "Total customers per hour - This day",
    AVGHours: "Total customers per hour",
    TotalPerDayThisWeek: "Total customers per day - This week",
    AVGPerDay: "Average customers per day"
}

let days_of_the_week = new Array(7);
days_of_the_week[0]= "Sunday";
days_of_the_week[1]= "Monday";
days_of_the_week[2]= "Tuesday";
days_of_the_week[3]= "Wednesday";
days_of_the_week[4]= "Thursday";
days_of_the_week[5]= "Friday";
days_of_the_week[6]= "Saturday";

const AgeLimit = 15;

let DBData = null

function httpGetAsync(theUrl, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function updatePage() {
    httpGetAsync('/status', function (res) {
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

function drawChart(type) {
    loadDataFromDB((data) => {
        let ctx = document.getElementById('myChart');
        let myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: analyzeData(data, type)
            },
            options: {}
        });
    })
}

function addToDict(customer_data, entrence_time, men, women, children) {
    if (customer_data.age <= AgeLimit) {
        if (children[entrence_time] !== undefined)
            children[entrence_time] += 1;
        else
            children[entrence_time] = 1;
    } else if (customer_data.gender === "m") {
        if (men[entrence_time] !== undefined) {
            men[entrence_time] = men[entrence_time] + 1;
        } else {
            men[entrence_time] = 1;
        }
    } else {
        if (women[entrence_time] !== undefined)
            women[entrence_time] += 1;
        else
            women[entrence_time] = 1;
    }
}

function analyzeData(DBData, type) {
    let datasets = [];
    let men = new Map();
    let women = new Map();
    let children = new Map();
    switch (type) {
        case report_types.TotalPerHourThisDay:
            for (const dbDataKey in DBData) {
                let entrence_time = new Date(DBData[dbDataKey].entrence_time).getHours();
                addToDict(DBData[dbDataKey], entrence_time, men, women, children);
            }
            break;
        case report_types.TotalPerDayThisWeek:
            for (const dbDataKey in DBData) {
                let entrence_time = new Date(DBData[dbDataKey].entrence_time);
                let d = new Date();
                d.setDate(d.getDate() - 7);
                if (entrence_time > d.setDate(d.getDate() - 7)) {
                    addToDict(DBData[dbDataKey], days_of_the_week[entrence_time.getDay()], men, women, children);
                }
            }
            break;
        case report_types.AVGPerDay:
            // for (const dbDataKey in DBData) {
            //     let entrence_time = new Date(DBData[dbDataKey].entrence_time).getDay();
            //     addToDict(DBData[dbDataKey], entrence_time, men, women, children);
            // }
            break;
    }
    let men_dataset = {
        label: "Men",
        backgroundColor: 'rgb(177,255,99)',
        data: []
    }
    for (const man in men) {
        men_dataset.data.push({x: man, y: men[man]})
    }
    datasets.push(men_dataset)
    let women_dataset = {
        label: "Women",
        backgroundColor: 'rgb(255, 99, 132)',
        data: []
    }
    for (const woman in women) {
        women_dataset.data.push({x: woman, y: women[woman]})
    }
    datasets.push(women_dataset)
    let children_dataset = {
        label: "children",
        backgroundColor: 'rgb(99,255,206)',
        data: []
    }
    for (const child in children) {
        children_dataset.data.push({x: child, y: children[child]})
    }
    datasets.push(children_dataset)
    return datasets;
}

function loadDataFromDB(callback) {
    if (DBData != null) {
        callback(DBData);
    } else {
        httpGetAsync('/DBData', function (res) {
            res = JSON.parse(res);
            DBData = res;
            callback(DBData);
        });
    }
}

$(function () {
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
            "allowed": $("#number_of_people_allowed").val(),
            "inside": $("#number_of_people_inside").val(),
            "outside": $("#number_of_people_outside").val()
        }
        $.post('/admin/updateStoreStatus', updatedStatus, function (data, status) {
            if (data === "OK") {
                $("body").removeClass("is-loading");
            } else {
                // window.alert("Something went wrong!")
                console.log(data)
                // location.reload();
            }
        })
        updatePage();
        pageRefresh = setInterval(updatePage, 5000);
    });
    drawChart(report_types.TotalPerDayThisWeek);
})