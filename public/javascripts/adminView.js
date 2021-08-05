function SayThis(what, value) {
    console.log(what);
    console.log(value);
}

// the main loop of the page that updates the number of customers inside and outside of the store
class pageMainLoop {
    constructor() {
        this.isUpdating = true;
        this.loop();
        this.updatePage();
    }
    startUpdating() {
        this.isUpdating = true;
        this.updatePage();
    }
    stopUpdating() {
        this.isUpdating = false;
    }
    updatePage() {
        httpGetAsync('/status', function (res) {
            res = JSON.parse(res)
            $('#number_of_people_inside').val(res.inside)
            $('#number_of_people_allowed').val(res.allowed)
            AgeLimit = res.age_threshold
            $('#age_threshold').val(AgeLimit)
            $('#masks_needed').val(res.masks_needed)
            $('#number_of_people_outside').val(res.outside)
            if (res.inside <= res.allowed) {
                $('.store-status').addClass("border-good").removeClass("border-bad")
            } else {
                $('.store-status').addClass("border-bad").removeClass("border-good")
            }
            if (res.masks_needed && res.noMask) {
                $("#mask_alert").show();
            } else {
                $("#mask_alert").hide();
            }
        })
    }
    loop() {
        setInterval(()=>{
            if (this.isUpdating) {
                this.updatePage()
            }
        }, 5000);
    }
}

// init a new pdf file that will contain the charts
window.jsPDF = window.jspdf.jsPDF;

// specify all the report types
const report_types = {
    TotalPerHourThisDay: "Total customers per hour - This day",
    AVGHours: "Total customers per hour - Average",
    TotalPerDayThisWeek: "Total customers per day - Last week",
    AVGPerDay: "Average customers per day - Average"
}

// array that converts the day of the week from number to string
let days_of_the_week = new Array(7);
days_of_the_week[0] = "Sunday";
days_of_the_week[1] = "Monday";
days_of_the_week[2] = "Tuesday";
days_of_the_week[3] = "Wednesday";
days_of_the_week[4] = "Thursday";
days_of_the_week[5] = "Friday";
days_of_the_week[6] = "Saturday";

// defines the age that a customer should pass to be considered as adult
let AgeLimit = 15;

const chart_custom_background = {
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

reportsPDF.text("Reports:", reportsPDFWidth / 2, 10, {
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

function sortDataByHours(data) {
    // let sorted = []
    // console.log(data !== data.sort()) todo remove
    return data
}

function reorder(datasets, type) {
    for (const dataset in datasets) {
        switch (type) {
            case report_types.AVGHours:
            case report_types.TotalPerHourThisDay:
                datasets[dataset].data = sortDataByHours(datasets[dataset].data)
                break;
            case report_types.AVGPerDay:
                break;
            case report_types.TotalPerDayThisWeek:
                break;
        }
    }
}

// draw a specific chart to a given canvas
function drawChart(chart_canvas, type) {
    loadDataFromDB((data) => {
        let datasets = analyzeData(data, type);
        reorder(datasets, type);
        let myChart = new Chart(chart_canvas, {
            type: 'bar',
            data: {
                datasets: datasets
            },
            options: {},
            plugins: [chart_custom_background]
        });
    })
}

// adds a record to a dictionary (helps "analyzeData" function building the datasets)
function addToDict(customer_data, entrance_time, men, women, children) {
    if (customer_data.age <= AgeLimit) {
        console.log(customer_data.age)
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
    if (DBData.length === 0) {
        return [];
    }
    let datasets = [];
    let now = new Date();
    let men = new Map();
    let women = new Map();
    let children = new Map();
    let firstEntrance = new Date(DBData[0].entrance_time);
    let lastEntrance = new Date(DBData[DBData.length - 1].entrance_time);
    let numberOfDays = Math.ceil((lastEntrance - firstEntrance) / (1000 * 60 * 60 * 24));
    switch (type) {
        case report_types.TotalPerHourThisDay:
            for (const dbDataKey in DBData) {
                let entrance_time = new Date(DBData[dbDataKey].entrance_time);
                now.setHours(5, 59, 59, 0);
                // if (now.getDate() === entrance_time.getDate() && now.getMonth() === entrance_time.getMonth() &&
                //     now.getFullYear() === entrance_time.getFullYear()){
                if (now <= entrance_time) {
                    entrance_time = entrance_time.getHours().toString() + ":00";
                    addToDict(DBData[dbDataKey], entrance_time, men, women, children);
                }
            }
            break;
        case report_types.AVGHours:
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
            let numberOfWeeks = Math.floor(numberOfDays / 7)
            let numberOfSpecificDays = {}
            for (const dayOfTheWeek in days_of_the_week) {
                numberOfSpecificDays[days_of_the_week[dayOfTheWeek]] = numberOfWeeks
            }
            let firstDay = firstEntrance.getDay()
            let lastDay = lastEntrance.getDay()
            // add partial weeks
            if ((firstDay - 1) % 7 !== lastDay) {
                while (firstDay !== lastDay) {
                    numberOfSpecificDays[days_of_the_week[firstDay]] += 1;
                    firstDay += 1;
                    firstDay %= 7;
                }
                numberOfSpecificDays[days_of_the_week[firstDay]] += 1;
            }
            for (const dbDataKey in DBData) {
                let entrance_time = days_of_the_week[new Date(DBData[dbDataKey].entrance_time).getDay()];
                addToDict(DBData[dbDataKey], entrance_time, men, women, children);
            }
            for (const man in men) {
                men[man] /= numberOfSpecificDays[man]
            }
            for (const woman in women) {
                women[woman] /= numberOfSpecificDays[woman]
            }
            for (const child in children) {
                children[child] /= numberOfSpecificDays[child]
            }
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
function addStatistics(callback) {
    loadDataFromDB((DBdata) => {
        if (DBdata.length === 0) {
            $(".store-statistics .charts").append("<h1 class='title is-1'> No data yet! </h1>")
            $(".export-data .buttons button").attr("disabled", "disabled")
        } else {
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
            callback();
        }
    })
}

function setStoreStatusButtons() {
    $("#change-button").on("click", function () {
        $("#change-button").hide();
        $("#update-button").show();
        $("#cancel-button").show();
        $(".store-status input[type=number].editable").removeClass("is-static").removeAttr("readonly");
        $(".store-status select").removeAttr("disabled")
        window.mainLoop.stopUpdating();
    });
    $("#cancel-button").on("click", function () {
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number].editable").addClass("is-static").attr("readonly", "readonly");
        $(".store-status select").attr("disabled", "disabled")
        window.mainLoop.startUpdating();
    });
    $("#update-button").on("click", function () {
        $("body").addClass("is-loading");
        $("#change-button").show();
        $("#update-button").hide();
        $("#cancel-button").hide();
        $(".store-status input[type=number].editable").addClass("is-static").attr("readonly", "readonly");
        $(".store-status select").attr("disabled", "disabled")
        let updatedStatus = {
            "allowed": Math.min($("#number_of_people_allowed").val(), 0),
            "inside": $("#number_of_people_inside").val(),
            "age_threshold": $("#age_threshold").val(),
            "masks": $("#masks_needed").val()
        }
        $.post('/admin/updateStoreStatus', updatedStatus, function (data, status) {
            if (data === "OK") {
                $("body").removeClass("is-loading");
            } else {
                window.alert("Something went wrong!")
                location.reload();
            }
        })
        location.reload();
    });
}

function convertToCSVTime(entrance_time) {
    return entrance_time.replace('T', ' ').substring(0, entrance_time.length - 5);
}

// function ageToRange(age) {
//     if (age < 7) return "0-6";
//     if (age < 13) return "7-12";
//     if (age < 17) return "13-16";
//     if (age < 22) return "17-21";
//     if (age < 30) return "22-29";
//     if (age > 69) return "70+";
//     let startOfRange = Math.floor(age / 10) * 10;
//     let endOfRange = startOfRange + 9;
//     return startOfRange.toString() + "-" + endOfRange.toString();
// } TODO remove!

function beautifyDataForCSV(data) {
    let new_data = []
    for (const dataKey in data) {
        let old_data_piece = data[dataKey];
        let new_data_piece = {
            "Time of entrance": convertToCSVTime(old_data_piece.entrance_time),
            "Gender": (old_data_piece.gender === "m") ? "Male" : "Female",
            "Age": old_data_piece.age
        }
        new_data.push(new_data_piece);
    }
    return new_data;
}

function exportAllData() {
    loadDataFromDB((data) => {
        let new_data = beautifyDataForCSV(data);
        let fields = Object.keys(new_data[0])
        let replacer = function (key, value) {
            return value === null ? '' : value
        }
        let csv = new_data.map(function (row) {
            return fields.map(function (fieldName) {
                return JSON.stringify(row[fieldName], replacer)
            }).join(',')
        })
        csv.unshift(fields.join(',')) // add header column
        csv = csv.join('\r\n');
        // Downloads the CSV file
        let pom = document.createElement('a');
        let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        let url = URL.createObjectURL(blob);
        pom.href = url;
        pom.setAttribute('download', 'raw_data.csv');
        pom.click();
    })
}

function exportReports() {
    for (const reportType in report_types) {
        if (!reportsPDFIsEmpty) {
            reportsPDF.addPage();
        } else {
            reportsPDFIsEmpty = false
        }
        reportsPDF.text(report_types[reportType], reportsPDFWidth / 2, 30, {
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
    window.mainLoop = new pageMainLoop()
    setStoreStatusButtons();
    addStatistics(function () {
        $(".store-statistics .buttons .button:first-child").trigger("click")
    });
})
