function SayThis(what, value) {
    console.log(what);
    console.log(value);
}

window.jsPDF = window.jspdf.jsPDF;

// specify all the report types
const report_types = {
    TotalPerHourThisDay: "Total customers per hour - This day",
    AVGHours: "Total customers per hour - Average",
    TotalPerDayThisWeek: "Total customers per day - Last week",
    AVGPerDay: "Average customers per day - Average"
}

// converts the day of the week from number to string
let days_of_the_week = new Array(7);
days_of_the_week[0]= "Sunday";
days_of_the_week[1]= "Monday";
days_of_the_week[2]= "Tuesday";
days_of_the_week[3]= "Wednesday";
days_of_the_week[4]= "Thursday";
days_of_the_week[5]= "Friday";
days_of_the_week[6]= "Saturday";

// defines the age that a customer should pass to be considered as adult
const AgeLimit = 15;

const chart_custom_backgrond = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

let DBData = null;
let reportsPDF = new jspdf.jsPDF();
let reportsPDFWidth = reportsPDF.internal.pageSize.getWidth();
let reportsPDFIsEmpty = true;

reportsPDF.text("Reports:", reportsPDFWidth/2, 10, {
    align: "center"
})

function httpGetAsync(theUrl, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

// the main loop of the page that updates the number of customers inside and outside of the store
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
            $('.store-status').addClass("border-good")
            $('.store-status').removeClass("border-bad")
        } else {
            $('.store-status').addClass("border-bad")
            $('.store-status').removeClass("border-good")
        }
    })
}

// draw a specific chart to a given canvas
function drawChart(chart_canvas, type) {
    loadDataFromDB((data) => {
        let myChart = new Chart(chart_canvas, {
            type: 'bar',
            data: {
                datasets: analyzeData(data, type)
            },
            options: {},
            plugins: [chart_custom_backgrond]
        });
    })
}

// adds a record to a dictionary (helps "analyzeData" function building the datasets)
function addToDict(customer_data, entrance_time, men, women, children) {
    if (customer_data.age <= AgeLimit) {
        if (children[entrance_time] !== undefined)
            children[entrance_time] += 1;
        else
            children[entrance_time] = 1;
    } else if (customer_data.gender === "m") {
        if (men[entrance_time] !== undefined) {
            men[entrance_time] = men[entrance_time] + 1;
        } else {
            men[entrance_time] = 1;
        }
    } else {
        if (women[entrance_time] !== undefined)
            women[entrance_time] += 1;
        else
            women[entrance_time] = 1;
    }
}

// builds the datasets for the reports
function analyzeData(DBData, type) {
    let datasets = [];
    let now = new Date();
    let men = new Map();
    let women = new Map();
    let children = new Map();
    switch (type) {
        case report_types.TotalPerHourThisDay:
            for (const dbDataKey in DBData) {
                let entrance_time = new Date(DBData[dbDataKey].entrance_time);
                now.setHours(5,59,59,0);
                // if (now.getDate() === entrance_time.getDate() && now.getMonth() === entrance_time.getMonth() &&
                //     now.getFullYear() === entrance_time.getFullYear()){
                if (now <= entrance_time) {
                        entrance_time = entrance_time.getHours().toString() + ":00";
                        addToDict(DBData[dbDataKey], entrance_time, men, women, children);
                }
            }
            break;
        case report_types.AVGHours:
            let firstDay = new Date(DBData[0].entrance_time);
            let lastDay = new Date(DBData[DBData.length - 1].entrance_time);
            let numberOfDays = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24));
            for (const dbDataKey in DBData) {
                let entrance_time = new Date(DBData[dbDataKey].entrance_time).getHours().toString() + ":00";
                addToDict(DBData[dbDataKey], entrance_time, men, women, children);
            }
            for (const mapKey in men) {
                men[mapKey] = men[mapKey] / numberOfDays
            }
            for (const mapKey in women) {
                women[mapKey] = women[mapKey] / numberOfDays
            }
            for (const mapKey in children) {
                children[mapKey] = children[mapKey] / numberOfDays
            }
            break;
        case report_types.TotalPerDayThisWeek:
            for (const dbDataKey in DBData) {
                let entrance_time = new Date(DBData[dbDataKey].entrance_time);
                let d = new Date();
                d.setDate(d.getDate() - 7);
                if (entrance_time > d.setDate(d.getDate() - 7)) {
                    addToDict(DBData[dbDataKey], days_of_the_week[entrance_time.getDay()], men, women, children);
                }
            }
            break;
        case report_types.AVGPerDay:
            // for (const dbDataKey in DBData) {
            //     let entrance_time = new Date(DBData[dbDataKey].entrance_time).getDay();
            //     addToDict(DBData[dbDataKey], entrance_time, men, women, children);
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

// loads the data from DB, since it may take a while - gets a callback function
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

// adds the statistics part to the admin page
function addStatistics() {
    for (const reportType in report_types) {
        $(".store-statistics .buttons").append("<button id=" + reportType + "></button>")
        let report_button = $(".store-statistics .buttons #" + reportType).text(report_types[reportType])
            .addClass("button is-outlined is-primary is-small")
        $(".store-statistics .charts").append("<canvas id=" + reportType + "></canvas>")
        let report_chart = $(".store-statistics .charts #" + reportType).addClass("is-hidden")
        // let chart_context = report_chart[0].getContext("2d");
        // chart_context.fillStyle = "#fff";
        // chart_context.fillRect(0, 0, report_chart[0].width, report_chart[0].height);
        drawChart(report_chart, report_types[reportType])
        report_button.on("click", function () {
            $(this).addClass("is-focused").siblings().removeClass("is-focused")
            report_chart.removeClass("is-hidden").siblings().addClass("is-hidden")
        })
    }
}

function setStoreStatusButtons() {
    $("#change-button").on("click", function () {
        $("#change-button").hide();
        $("#update-button").show();
        $("#cancel-button").show();
        $(".store-status input[type=number].editable").removeClass("is-static").removeAttr("readonly");
        clearInterval(pageRefresh);
    });
    $("#cancel-button").on("click", function () {
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number].editable").addClass("is-static").attr("readonly", "readonly");
        updatePage();
        pageRefresh = setInterval(updatePage, 5000);
    });
    $("#update-button").on("click", function () {
        $("body").addClass("is-loading");
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number].editable").addClass("is-static").attr("readonly", "readonly");
        let updatedStatus = {
            "allowed": $("#number_of_people_allowed").val(),
            "inside": $("#number_of_people_inside").val(),
            "outside": $("#number_of_people_outside").val()
        }
        $.post('/admin/updateStoreStatus', updatedStatus, function (data, status) {
            if (data === "OK") {
                $("body").removeClass("is-loading");
            } else {
                window.alert("Something went wrong!")
                location.reload();
            }
        })
        updatePage();
        pageRefresh = setInterval(updatePage, 5000);
    });
}

function exportReports(){
    for (const reportType in report_types) {
        if(!reportsPDFIsEmpty) {
            reportsPDF.addPage();
        } else {
            reportsPDFIsEmpty = false
        }
        reportsPDF.text(report_types[reportType], reportsPDFWidth/2, 30, {
            align: "center"
        })
        let report_chart = $(".store-statistics .charts #" + reportType)[0]
        let reportImage = report_chart.toDataURL("image/jpeg", 1.0)
        let imgWidth = reportsPDFWidth - 30;
        let imgHeight = (imgWidth / report_chart.width) * report_chart.height;
        reportsPDF.addImage(reportImage, 'JPEG', 15, 80, imgWidth, imgHeight)
    }
    reportsPDF.save("Reports.pdf")
}

// runs when page is finished loading, add functionality and starts main loop
$(function () {
    updatePage();
    let pageRefresh = setInterval(updatePage, 5000);
    setStoreStatusButtons();
    addStatistics();
    $(".store-statistics .buttons .button:first-child").trigger("click")
})
