function find_query_parameter(name) {
    url = location.href;
    //name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}
// here we set up the configuration of the highCharts chart
var data = [];
var unit_tracker = [];
var counter = 0;
var unit1 = null;
var unit2 = null;
var resid_on = null;
counter1 = [];
var ymax = 0
var ymin = 0
var y2max = 0
var y2min = 0
// here we set up the configuration of the highCharts chart
var chart_options = {
    zoomEnabled: true,
    height: 600,
    legend: {
        cursor: "pointer",
        itemclick: function (e) {
            //console.log("legend click: " + e.dataPointIndex);
            //console.log(e);
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }

            e.chart.render();
        }
    },
    colorSet: 'greenShades',
    title: {
        fontSize: 20,
        text: "Gap Filler"
    },
    toolTip: {
        content: "{name}{y} <br>{x}"
    },
    data: [],
    axisX: {

        labelFontSize: 10
    },
    axisY: {
        fontSize: 15,
        labelFontSize: 10,
        titleWrap: true,
        titleMaxWidth: 150,
        gridThickness: 2,
        includeZero: false,
        //viewportMaximum:180,
        //interval: 50
    },
    axisY2: {
        title: "test2",
        fontSize: 15,
        labelFontSize: 10,
        titleWrap: true,
        gridThickness: 2,
        includeZero: false,
        //interval: 50
    }
};


// shows an error message in the chart title
function show_error(chart, error_message) {
    $('#loading').hide();
    console.log(error_message);
    $('#error-message').text(error_message);
}

var number2 = -1;
var unit_list = [];
var title = 0;
xtime = []
var series_counter =0
function add_series_to_chart(chart, res_id, number1, id_qms) {
    current_url = location.href;
    index = current_url.indexOf("gap-filler-tool");
    base_url = current_url.substring(0, index);
    xtime.length = 0
    xval = ''
    yvalu = ''
    length_master= -1
    master_id =[]
    // the res_id can contain multiple IDs separated by comma
    // URL to get the WPS result (used for the scatter plot chart)
    // URL to get the script link
    var R_script_url = base_url + 'gap-filler-tool/r-script/' + res_id + '/' + 'gap-filler-tool.R';
    // setup the R script hyperlink at the bottom of the page
    $('.r-script').attr('href', R_script_url);

    data_url = base_url + 'gap-filler-tool/chart_data/' + res_id + '/';
    $.ajax({
        url: data_url,
        success: function (json) {
            // first of all check for the status
            var status = json.status;
            if (status !== 'success') {
                show_error(chart, "Error loading time series from " + res_id + ": " + status);
                $('#loading').hide();
                return;
            }
            // set the y axis title and units
            var units = json.units;
            if (units != null) {

                units = units.replace(/\s+/g, '');//removes any spaces in the units
            }
            if (units == null) {
                units = "N/A";
            }
            var site_name = json.site_name;
            var variable_name = json.variable_name;
            var unit = json.units;
            var organization = json.organization;
            var quality = json.quality;
            var method = json.method;
            var datatype = json.datatype;
            var valuetype = json.valuetype;
            var samplemedium = json.samplemedium;

            var mean = json.mean;
            var median = json.median;
            var max = json.max;
            var min = json.min;
            var stdev = json.stdev;
            var timesupport = json.timesupport;
            var timeunit = json.timeunit;
            var sourcedescription = json.sourcedescription;
            var boxplot_count = number2;
            var boxplot = json.boxplot;
            var master_counter = json.master_counter;
            var master_times = json.master_times;
            var meta_dic = json.meta_dic;
            var master_boxplot = json.master_boxplot
            //var mean = json.mean
            //var median = json.median
            //var max = json.max
            //var min = json.min
            var master_stat = json.master_stat
            var bad_meta=false
            var bad_meta_counter = 0
            var units = json.units;
            var master_values= json.master_values;
            var master_counter = json.master_counter;
            var master_times = json.master_times;
            var meta_dic = json.meta_dic;
            var master_boxplot = json.master_boxplot
            if (site_name == null) {
                site_name = "N/A"
            }
            if (variable_name == null) {
                variable_name = "N/A"
            }
            if (organization == null) {
                organization = "N/A"
            }
            if (quality == null) {
                quality = "N/A"
            }
            if (method == null) {
                method = "N/A"
            }
            if (datatype == null) {
                datatype = "N/A"
            }
            if (valuetype == null) {
                valuetype = "N/A"
            }
            if (unit == null) {
                unit = "N/A"
            }
            if (timesupport == null || timesupport == '') {
                timesupport = "N/A"
            }
            if (timeunit == null || timeunit == '') {
                timeunit = "N/A"
            }
            if (sourcedescription == null) {
                sourcedescription = "N/A"
            }
            if (samplemedium == null) {
                samplemedium = "N/A"
            }
            var unit_off_bool = false;
            id_qms_a_split = id_qms.split('aa')
            for (val in master_values) {
                meta1 = val.split("aa");
                if (id_qms != 'meta') {
                    if (id_qms_a_split[0] == '') {
                        meta1[0] = ''
                    }
                    if (id_qms_a_split[1] == '') {
                        meta1[1] = ''
                    }
                    if (id_qms_a_split[2] == '') {
                        meta1[2] = ''
                    }
                }
                if (meta_dic['quality_code'][meta1[0]] == undefined) {
                    meta1[0] = ''
                    //id_qms_a_split[0]=''
                }
                else {
                    meta1[0] = meta_dic['quality_code'][meta1[0]]
                }
                id_qms_a = id_qms_a_split[0] + 'aa' + id_qms_a_split[1] + 'aa' + id_qms_a_split[2]
                val1 = meta1[0] + 'aa' + meta1[1] + 'aa' + meta1[2]
                console.log(val1)
                console.log(id_qms_a)

                if (val1 != id_qms_a) {
                    bad_meta_counter += 1
                }
            }
            if (bad_meta_counter == Object.keys(master_values).length) {
                bad_meta = true
            }
            id_qms_a_split = id_qms.split('aa')
            if (master_counter == true) {
                for (val in master_values) {
                    console.log(bad_meta)
                    if (bad_meta == true) {
                        val1 = ''
                        id_qms_a = ''
                    }
                    else {
                        meta1 = val.split("aa");
                        //console.log(val)
                        //console.log(meta1)
                        //console.log(meta_dic['quality_code'][meta1[0]])
                        //quality- data validation
                        console.log(meta_dic)
                        //console.log(meta1)
                        if (id_qms != 'meta') {

                            if (id_qms_a_split[0] == '') {
                                meta1[0] = ''
                            }
                            if (id_qms_a_split[1] == '') {
                                meta1[1] = ''
                            }
                            if (id_qms_a_split[2] == '') {
                                meta1[2] = ''
                            }

                        }

                        //console.log(meta1)
                        if (meta_dic['quality_code'][meta1[0]] == undefined) {
                            meta1[0] = ''
                            //id_qms_a_split[0]=''
                        }
                        else {
                            meta1[0] = meta_dic['quality_code'][meta1[0]]
                        }

                        //if(meta_dic['method'][meta1[1]]==undefined){
                        //    meta1[1] = ''
                        //    id_qms_a_split[1]=''
                        //}
                        //else{
                        //    meta1[1]= [meta1[1]]
                        //}
                        //
                        //if(meta_dic['source'][meta1[2]]==undefined){
                        //    meta1[2] = ''
                        //    id_qms_a_split[2]=''
                        //}
                        //else{
                        //    meta1[2]= meta1[2]
                        //}


                        id_qms_a = id_qms_a_split[0] + 'aa' + id_qms_a_split[1] + 'aa' + id_qms_a_split[2]
                        val1 = meta1[0] + 'aa' + meta1[1] + 'aa' + meta1[2]
                        //console.log(meta1)
                        //console.log(val)
                        console.log(val1)
                        console.log(id_qms_a)

                        id_qms_a_split = id_qms.split('aa')
                    }

                    if (id_qms_a == val1 || id_qms_a == 'meta') {
                        length_master = length_master + 1
                        master_id.push(val)
                        meta = val.split("aa");
                        console.log(meta)
                        code = meta_dic['quality_code'][meta[0]]
                        quality = meta_dic['quality'][code]
                        console.log(quality)
                        quality_code = [meta[0]]

                        method = meta_dic['method'][meta[1]]
                        sourcedescription = meta_dic['source'][meta[2]]
                        organization = meta_dic['organization'][meta[2]]
                        series_counter = length_master + series_counter - 1


                        unit_tracker.push(units);//tracks the units of the different time series
                        //console.log(unit_tracker)

                        unit_different2 = null;
                        same_unit = 1//goes to 2 when more than one unit type is graphed
                        yaxis = 0; //tracks which dataset set goes on which axis
                        var y_title = null;//tracks which variable to use for the yaxis title
                        //

                        max1 = json.max
                        min1 = json.min
                        m_yval = master_times[val]
                        m_xval = master_values[val]
                        boxplot = master_boxplot[val]
                        mean = master_stat[val][0]
                        median = master_stat[val][1]
                        max = master_stat[val][2]
                        min = master_stat[val][3]
                        count = m_xval.length

                        for (i = 0; i < m_xval.length; i++) {
                            //console.log("hello")
                            temp_date = new Date(m_yval[i])
                            xtime.push({x: temp_date.getTime(), y: m_xval[i]})
                        }


                        data1 = xtime

                        var chart = $("#chartContainer").CanvasJSChart()

                        var newSeries =
                        {
                            type: "line",
                            axisYType: "primary",
                            //axisYType:"secondary",
                            xValueType: "dateTime",
                            xValueFormatString: "MMM DD, YYYY: HH:mm",
                            showInLegend: false,
                            indexLabelFontSize: 1,
                            visible: true,
                            name: 'Site: ' + site_name + ' <br/> Variable: ' + json.variable_name + '<br/> Value: ',
                            dataPoints: data1
                        };
                        chart.options.axisY.title = json.variable_name + ' (' + json.units + ')'
                        chart.options.axisY.titleWrap = true
                        chart.options.data.push(newSeries);
                        chart.options.axisY.titleFontSize = 15
                        chart.render();
                        console.log(chart)

                        number2 = number2 + 1//keeps track of row number for stats table
                        number = number2;
                        add_row(0, res_id,count,boxplot)

                        console.log(number)
                        console.log(number1)
                        if (number == number1 - 1)//checks to see if all the data is loaded before displaying
                        {
                            finishloading();
                        }
                    }
                }
            }
        },
        error: function () {
            show_error("Error loading time series from " + res_id);
        }
    });

}
var unit3 = '';
var res = null;
//$("#app-content").on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
//    function(event)
//    { if (event.originalEvent.propertyName == 'padding-right')
//    { $(window).resize();} });
function myFunc(id, name) {
    console.log("checking!!")
    var chart1 = $("#chartContainer").CanvasJSChart()
    var series = chart1.options.data[id].visible
    console.log(series)
    if (series == true) {
        console.log("afsfadafsdfd")
        chart1.options.data[id].visible = false
        chart1.render();
    }
    else {
        chart1.options.data[id].visible = true
        chart1.render();
    }
}
function add_row(row_counter, res_id,count,boxplot) {
    data_url = base_url + 'gap-filler-tool/chart_data/' + res_id + '/';
    $.ajax({
        url: data_url,
        success: function (json) {
            var site_name = json.site_name;
            var variable_name = json.variable_name;
            var unit = json.units;
            var organization = json.organization;
            var quality = json.quality;
            var method = json.method;
            var datatype = json.datatype;
            var valuetype = json.valuetype;
            var samplemedium = json.samplemedium;
            var master_values= json.master_values;
            var mean = json.mean;
            var median = json.median;
            var max = json.max;
            var min = json.min;
            var stdev = json.stdev;
            var timesupport = json.timesupport;
            var timeunit = json.timeunit;
            var sourcedescription = json.sourcedescription;
            var boxplot_count = number2;

            //var boxplot = json.boxplot;
            //boxplot = master_boxplot[val]
            //mean = master_stat[val][0]
            //median = master_stat[val][1]
            //max = master_stat[val][2]
            //min = master_stat[val][3]
            if (site_name == null) {
                site_name = "N/A"
            }
            if (variable_name == null) {
                variable_name = "N/A"
            }
            if (organization == null) {
                organization = "N/A"
            }
            if (quality == null) {
                quality = "N/A"
            }
            if (method == null) {
                method = "N/A"
            }
            if (datatype == null) {
                datatype = "N/A"
            }
            if (valuetype == null) {
                valuetype = "N/A"
            }
            if (unit == null) {
                unit = "N/A"
            }
            if (timesupport == null || timesupport == '') {
                timesupport = "N/A"
            }
            if (timeunit == null || timeunit == '') {
                timeunit = "N/A"
            }
            if (sourcedescription == null) {
                sourcedescription = "N/A"
            }
            if (samplemedium == null) {
                samplemedium = "N/A"
            }
            //chart.setTitle({ text: "CUAHSI Data Series Viewer" });
            var legend = "<div style='text-align:center' '><input class = 'checkbox' id =" + row_counter +
                " type='checkbox' onClick ='myFunc(this.id,this.name);'checked = 'checked'>" + "</div>"
            var dataset = {
                legend: legend,
                organization: organization,
                name: site_name,
                variable: variable_name,
                unit: unit,
                samplemedium: samplemedium,
                count: count,//download:download,
                quality: quality,
                method: method,
                datatype: datatype,
                valuetype: valuetype,
                timesupport: timesupport,
                timeunit: timeunit,
                sourcedescription: sourcedescription,
                mean: mean,
                median: median,
                max: max,
                min: min,
                stdev: stdev,
                boxplot: boxplot,
                boxplot_count: boxplot_count
            };

            var table = $('#example2').DataTable();
            table.row.add(dataset).draw();
        }
    })

}

function clear_all() {
    $('#stat_div').hide();
    $('#chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();
    var chart = $("#chartContainer").CanvasJSChart()
    chart.options.data = []
    chart.render();

    var table = $('#example2').DataTable();
    table
        .clear()
        .draw();
    number2 = -1;
    test_counter = 0;
    addingseries();
}
test_counter = 0
function gap_filler() {
    xtime = []
    var chart = $("#chartContainer").CanvasJSChart()
    //number_series = chart.options.data
    //length_series = number_series.length
    length_series = 0
    //chart.options.data = []


    if (length_series == 2) {
        alert("Only one gap filled function allowed at a time.")
    }
    else {

        $('#chartContainer').hide();
        $('#stat_div').hide();
        $('#button').hide();
        $('#loading').show();
        $('#multiple_units').hide();
        $(window).resize();
        var gap_function = document.querySelector('input[name = "gap_function"]:checked').value;
        console.log(gap_function)
        //$('#app-navigation').hide();
        var res_id = $('#cuahsi_ids').text()
        res_id = trim_input(res_id)
        var wps_url = base_url + 'gap-filler-tool/wps/' + res_id + '/' + gap_function;

        $.ajax({
            url: wps_url,
            success: function (gap) {
                console.log(gap)
                number3 = number + 1;
                // here we must check if the WPS execution was successful

                // add the time series to the chart

                console.log(test_counter)
                if (test_counter == 0) {
                    color = '#FF0000'
                }
                else {
                    color = '#006400'
                }
                var series =
                {
                    id: res_id + "gap",
                    zIndex: 1,
                    name: gap_function + ' function',
                    data: gap.data,

                };
                xval = gap.xval
                yval = gap.yval
                //max1= gap.max
                //min1=gap.min
                //console.log(xval)
                count = xval.length
                for (i = 0; i < xval.length; i++) {
                    //console.log("hello")
                    //temp_date = new Date(xval[i])
                    xtime.push({x: xval[i], y: yval[i]})
                    //xtime.push({x:new Date(1438153200000),y:yval[i]})

                }
                //console.log(test2)
                var newSeries1 =
                {
                    type: "line",
                    axisYType: "primary",
                    //axisYType:"secondary",
                    xValueType: "dateTime",
                    xValueFormatString: "MMM DD, YYYY: HH:mm",
                    showInLegend: false,
                    indexLabelFontSize: 1,
                    visible: true,
                    name: "Gap Filled Series ",
                    //name: 'Site: ' + site_name + ' <br/> Variable: ' + json.variable_name + '<br/> Value: ',
                    //name: 'Site: ' + site_name + ' <br/> Variable: ' + json.variable_name + '<br/> Value: ',
                    dataPoints: xtime
                };

                chart.options.data.push(newSeries1);

                chart.render();
                console.log(chart)
                test_counter = test_counter + 1
                // this part seems to be taking lots of time ...

                number2 = -1;
                var table = $('#example2').DataTable();
                //table
                //    .clear()
                //    .draw();
                add_row(1, res_id,count)
                //addingseries();
                finishloading()
            }
        })
    }
}
var popupDiv = $('#welcome-popup');
//end new table
$(document).ready(function (callback) {
    //var res_id = find_query_parameter("res_id");
    var src = find_query_parameter("SourceId");
    var wu = find_query_parameter("WofUri");

    var source = $('#source').text()

    if (source == "['cuahsi']") {
        src = 'cuahsi'
    }
    else if (src == 'hydroshare') {
        src = 'hydroshare'
    }
    else {
        src = null
    }
    if (src == null) {
        if (document.referrer == "https://apps.hydroshare.org/apps/") {
            $('#extra-buttons').append('<a class="btn btn-default btn" href="https://apps.hydroshare.org/apps/">Return to HydroShare Apps</a>');
        }
        popupDiv.modal('show');
    }

    //// initialize the chart and set chart height
    //$('#chartDiv').hide();
    $('#chart').hide();
    $('#stat_div').hide();
    $('#button').hide();
    $('#loading').show();
    $('#multiple_units').hide();
    $('#example2_length').html("");
    $('#example2_filter').html("");
    // add the series to the chart
    addingseries();
    //hideplot(0);
    // change the app title
    document.title = 'Gap Filler Tool';
});

function box(number) {
    var name = '#container' + number;
    $(name).highcharts({
        chart: {

            type: 'boxplot'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            categories: 1,
            title: {
                text: ''
            },
            minRange: 1,
            labels: {enabled: false}

        },
        title: {
            align: 'center'
        },
        plotOptions: {
            series: {
                groupPadding: 0
            }
        },
    });
}
function finishloading(callback) {
    $(window).resize();
    $('#stat_div').show();
    $('#chartContainer').show();
    var chart = $("#chartContainer").CanvasJSChart()
    $("#chart").show();
    chart.render();

    $('#loading').hide();
    $('#multiple_units').show();
    $(window).resize()
}
function addingseries() {
    var src = find_query_parameter("src");
    var source = $('#source').text()
    if (source == "['cuahsi']") {
        src = 'cuahsi'
    }
    else if (source != "['cuahsi']") {
        src = 'hydroshare'

    }
    if (src == 'cuahsi') {

        var quality = $('#quality').text()
        var method = $('#method').text()
        var sourceid = $('#sourceid').text()
        var res_id = $('#cuahsi_ids').text()
        res_id = trim_input(res_id)
        quality = trim_input(quality)
        method = trim_input(method)
        sourceid = trim_input(sourceid)

    }
    else if (src == 'hydroshare') {
        var res_id = find_query_parameter("res_id");

        if (res_id != null) {
            res_ids = res_id.split(",");
            res_id = trim_input(res_id)
        }

        else {
            res_ids = ''
            $('#loading').hide();
        }

    }
    var series_counter = 0;

    var page_height = $(document).height();



    for (var r in res_id) {
        series_counter = series_counter + 1
    }
    var src = find_query_parameter("src");
    var source = $('#source').text()
    if (source == "['cuahsi']") {
        src = 'cuahsi'
    }
    else if (source != "['cuahsi']") {
        src = 'hydroshare'

    }
    if (src == 'cuahsi') {
        var res_id = $('#cuahsi_ids').text()
        var quality = $('#quality').text()
        var method = $('#method').text()
        var sourceid = $('#sourceid').text()

        res_id = trim_input(res_id)
        quality = trim_input(quality)
        method = trim_input(method)
        sourceid = trim_input(sourceid)

    }
    else if (src == 'hydroshare') {
        var res_id = find_query_parameter("res_id");

        if (res_id != null) {
            res_ids = res_id.split(",");
            res_id = trim_input(res_id)
        }

        else {
            res_ids = ''
            $('#loading').hide();
        }

    }
    CanvasJS.addColorSet("greenShades",
        [//colorSet Array

             "#ec3131",
            "#2cc52e",
            "#313eec",
            "#dd25d5",
            "#0d0c0d",
            "#31cbec",
            "#fb8915",
            "#ffb8e7",
            "#fbfd07",
            "#660099",

        ])
    $("#chartContainer").CanvasJSChart(chart_options);
    var chart = $("#chartContainer").CanvasJSChart()
    counter2 = 0;

    for (var id in res_id) {
        counter1.push(counter);
        //console.log(series_counter)
        if (src == 'cuahsi') {

            if (quality[id] == 'null' || quality[id] == 'None') {
                quality1 = ''
            }
            else {
                quality1 = quality[id]
            }
            if (method[id] == 'null' || method[id] == 'None') {
                method1 = ''
            }
            else {
                method1 = method[id]
            }

            if (sourceid[id] == 'null' || sourceid[id] == 'None') {
                sourceid1 = ''
            }
            else {
                sourceid1 = sourceid[id]
            }


            id_qms = quality1 + 'aa' + method1 + 'aa' + sourceid1
        }
        else {
            id_qms = "meta"
        }

        add_series_to_chart(chart, res_id[id], series_counter, id_qms);
        counter2 = counter2 + 1
    }
}
function multipletime() {
    var popupDiv = $('#hello');
    popupDiv.modal('hide');
    $('#stat_div').hide();
    $('#chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();
    var unit_off = document.querySelector('input[name = "units"]:checked').value;
    unit1 = document.querySelector('input[name = "units"]:not(:checked)').value;
    unit2 = unit3;
    resid_on = res;
    number2 = -1;
    $('#chart').highcharts().destroy();
    //var table = $('#example2').DataTable();
    //table
    //.clear()
    //.draw();
    $('#stat_div').hide();
    $('#chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();
    addingseries();

}

function trim_input(string){
    string = string.replace(']','')
    string = string.replace('[','')
    string = string.replace(/'/g,'')
    string = string.replace(/"/g,'')
    string = string.replace(/ /g,'')
    //string = string.replace('[','')
    string =string.split(',')
    return string
}