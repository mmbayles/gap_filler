function find_query_parameter(name) {
    url = location.href;
    //name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}
// here we set up the configuration of the highCharts chart
var data = [];
var unit_tracker =[];
var counter = 0;
var unit1=null;
var unit2=null;
var resid_on = null;
counter1 =[];
// here we set up the configuration of the highCharts chart
var chart_options = {
    chart: {


        zoomType: 'x',
        resetZoomButton: {
            position: {
                align: 'left', // by default
                verticalAlign: 'bottom', // by default
                x: 0,
                y: 40
            }
        }
    },
    exporting:{
        buttons:{
            contextButton:{

                align: 'right',
                verticalAlign: 'top',

                text: 'print / export chart',
                symbol: 'url(/static/gap_filler_tool/images/print16.png)'
            }
        },
        chartOptions:{
            legend:{
                borderWidth: 0
            }
        },
        sourceWidth: 1200,
        sourceHeight: 600
    },
    title: {
        text: ''
    },
    xAxis: {
        type: 'datetime',
        lineWidth:2,
        lineColor: 'lightgray'
    },
    yAxis: [{
        title: {
            text: 'Data Value',
            style: {
                color: Highcharts.getOptions().colors[1],
                fontSize:'15px'
            }

        },
        lineWidth:2,
        lineColor: 'lightgray',

    },
        {
            // Secondary yAxis
            gridLineWidth: 1,
            title: {
                text: '',
                style: {
                    color: Highcharts.getOptions().colors[1],
                    fontSize:'15px'
                }
            },

            lineWidth:2,

            opposite: true
        }
    ],
    legend: {
    },



    plotOptions: {
        line: {
            color: Highcharts.getOptions().colors[90],
            marker: {
                radius: 2
            },
            size:'100%',
            lineWidth: 1,
            states: {
                hover: {
                    lineWidth: 1
                }
            },

        }
    }
};

// shows an error message in the chart title
function show_error(chart, error_message) {

    $('#loading').hide();
    console.log(error_message);

    $('#error-message').text(error_message);

}

var number2 = -1;
var unit_list =[];
var title = 0;
function add_series_to_chart(chart,res_id,number1) {
    current_url = location.href;
    index = current_url.indexOf("gap-filler-tool");
    base_url = current_url.substring(0, index);

    // the res_id can contain multiple IDs separated by comma

    // URL to get the WPS result (used for the scatter plot chart)


    // URL to get the script link
    var R_script_url = base_url + 'gap-filler-tool/r-script/' + res_id + '/' + 'gap-filler-tool.R';

    // setup the R script hyperlink at the bottom of the page
    $('.r-script').attr('href', R_script_url);



    data_url = base_url + 'gap-filler-tool/chart_data/' + res_id + '/';
    $.ajax({
        url: data_url,
        success: function(json) {
            // first of all check for the status
            var status = json.status;
            if (status !== 'success') {
                show_error(chart, "Error loading time series from " + res_id + ": " + status);
                $('#loading').hide();
                return;
            }
            // set the y axis title and units
            var units = json.units;
            units  = units.replace(/\s+/g, '');//removes any spaces in the units
            if(units==null) {
                units = "";
            }

            var unit_off_bool = false;
            unit_tracker.push(units);//tracks the units of the different time series
            //console.log(unit_tracker)

            unit_different2=null;
            same_unit = 1//goes to 2 when more than one unit type is graphed
            yaxis=0; //tracks which dataset set goes on which axis
            var y_title = 0;//tracks which variable to use for the yaxis title

            //
            var series =
            {
                id: res_id,
                zIndex: 2,
                name:  'Site: '+json.site_name
                +'. Variable: ' + json.variable_name,
                data: [],

                animation:false,
                color: '#0000FF'

            };
            //
            //// add the time series to the chart
            series.data = json.for_highchart;

            chart.addSeries(series);


            if (y_title ==0){//sets the y-axis title and flags that data should be plotted on this axis

                chart.yAxis[0].setTitle({ text: json.variable_name + ' (' + json.units+')' });


            }
            else if(y_title ==1){//sets the y-axis 2 title and flags that data should be plotted on this axis

                chart.yAxis[1].setTitle({text: json.variable_name + ' (' + json.units+')'})

            }


            chart.legend.group.hide();

            number2 = number2+1//keeps track of row number for stats table
            number  = number2;
            add_row(0,res_id)
            //end new table
            console.log(number)
            console.log(number1)
            if (number == number1-1)//checks to see if all the data is loaded before displaying
            {
                $(window).resize();
                chart.setTitle({ text: "CUAHSI Gap Filler Tool" });
                $(window).resize();
                finishloading();

            }



            $(window).resize();//This fixes an error where the grid lines are misdrawn when legend layout is set to vertical
        },
        error: function() {
            show_error("Error loading time series from " + res_id);
        }
    });;;



}
var unit3 ='';
var res = null;
$("#app-content").on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
    function(event)
    { if (event.originalEvent.propertyName == 'padding-right')
    { $(window).resize();} });
function myFunc(id,name)
{
    console.log("checking!!")
    var chart1 = $('#ts-chart').highcharts();
    var series = chart1.series[id];
    if (series.visible ==true) {
        series.hide();
    }
    else
    {
        series.show();
    }
}
function add_row(row_counter,res_id){
    data_url = base_url + 'gap-filler-tool/chart_data/' + res_id + '/';
    $.ajax({
        url: data_url,
        success: function(json) {
            var site_name = json.site_name;
            var variable_name = json.variable_name;
            var unit = json.units;
            var organization = json.organization;
            var quality = json.quality;
            var method = json.method;
            var datatype = json.datatype;
            var valuetype = json.valuetype;
            var samplemedium = json.samplemedium;
            var count = json.count;
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
            if(site_name==null){
                site_name = "N/A"
            }
            if(variable_name==null){
                variable_name= "N/A"
            }
            if(organization==null){
                organization= "N/A"
            }
            if(quality==null){
                quality= "N/A"
            }
            if(method==null){
                method= "N/A"
            }
            if(datatype==null){
                datatype= "N/A"
            }
            if(valuetype==null){
                valuetype= "N/A"
            }
            if(unit==null){
                unit= "N/A"
            }
            if(timesupport==null || timesupport ==''){
                timesupport= "N/A"
            }
            if(timeunit==null|| timeunit ==''){
                timeunit= "N/A"
            }
            if(sourcedescription==null){
                sourcedescription= "N/A"
            }
            if(samplemedium==null){
                samplemedium= "N/A"
            }


            //chart.setTitle({ text: "CUAHSI Data Series Viewer" });
            var legend = "<div style='text-align:center' '><input class = 'checkbox' id ="+row_counter +
                " type='checkbox' onClick ='myFunc(this.id,this.name);'checked = 'checked'>" + "</div>"

            var dataset = {legend:legend,organization:organization,name:site_name,variable:variable_name,unit:unit,samplemedium:samplemedium,count:count,//download:download,
                quality:quality,method:method,datatype:datatype,valuetype:valuetype, timesupport:timesupport,timeunit:timeunit,
                sourcedescription:sourcedescription,
                mean:mean,median:median,max:max,min:min,stdev:stdev,boxplot:boxplot,boxplot_count:boxplot_count};

            var table = $('#example2').DataTable();
            table.row.add(dataset).draw();
        }
    })

}

function clear_all(){
    $('#stat_div').hide();
    $('#ts-chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();

    $('#ts-chart').highcharts().destroy();
    var table = $('#example2').DataTable();
    table
        .clear()
        .draw();
    number2 = -1;
    test_counter = 0;
    addingseries();
}
test_counter =0
function gap_filler(){
    var chart = $('#ts-chart').highcharts();
    number_series = chart.series
    length_series = number_series.length

    console.log(length_series)
    if( length_series== 2){
        alert("Only one gap filled function allowed at a time.")
    }
    else {
        $('#ts-chart').hide();
        $('#stat_div').hide();
        $('#button').hide();
        $('#loading').show();
        $('#multiple_units').hide();
        $(window).resize();
        var gap_function = document.querySelector('input[name = "gap_function"]:checked').value;
        console.log(gap_function)
        //$('#app-navigation').hide();
        var res_id = find_query_parameter("res_id");
        var wps_url = base_url + 'gap-filler-tool/wps/' + res_id + '/' + gap_function;

        $.ajax({
            url: wps_url,
            success: function (gap) {
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
                    color: color
                };
                test_counter = test_counter + 1
                // this part seems to be taking lots of time ...
                chart.addSeries(series);
                add_row(1, res_id)
                finishloading()
            }
        })
    }
}
var popupDiv = $('#welcome-popup');
//end new table
$(document).ready(function (callback) {
    var res_id = find_query_parameter("res_id");
    if (res_id == null) {
        if (document.referrer == "https://apps.hydroshare.org/apps/") {
            $('#extra-buttons').append('<a class="btn btn-default btn" href="https://apps.hydroshare.org/apps/">Return to HydroShare Apps</a>');
        }
        popupDiv.modal('show');
    }
    //// initialize the chart and set chart height
    //$('#chartDiv').hide();
    $('#ts-chart').hide();
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

function box (number) {
    var name = '#container'+number;
    $(name).highcharts({
        chart: {

            type: 'boxplot'
        },
        legend:{
            enabled:false
        },
        xAxis: {
            categories: 1,
            title:{
                text:''
            },
            minRange: 1,
            labels:{enabled:false}

        },
        title:{
            align: 'center'
        },
        plotOptions: {
            series: {
                groupPadding: 0
            }
        },
    });
}
function finishloading(callback)
{
    $(window).resize();
    $('#stat_div').show();
    $('#ts-chart').show();
    $('#loading').hide();
    $('#multiple_units').show();
    $(window).resize()
}
function addingseries(){
    var res_id = find_query_parameter("res_id");
    var series_counter =0;

    var page_height = $(document).height();
    if (page_height > 500) {
        chart_options.chart.height = page_height - 225;
    }
    $('#ts-chart').highcharts(chart_options);
    var chart = $('#ts-chart').highcharts();

    if (res_id != null)
    {
        res_ids = res_id.split(",");
    }
    else
    {
        res_ids ='';
        $('#loading').hide();
    }
    for ( var r in res_ids)
    {
        series_counter = series_counter +1
    }
    counter2 = 0;
    for  (var  res_id in res_ids)
    {
        counter1.push(counter);
        console.log("add series")
        add_series_to_chart(chart,res_ids[res_id],series_counter); //highchart
        //add_series_to_chart1(chart, res_ids[res_id],series_counter); //zing chart
        counter2 = counter2+1;
        //console.log(counter2)
    }
}
function multipletime()
{
    var popupDiv = $('#hello');
    popupDiv.modal('hide');
    $('#stat_div').hide();
    $('#ts-chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();
    var unit_off = document.querySelector('input[name = "units"]:checked').value;
    unit1 = document.querySelector('input[name = "units"]:not(:checked)').value;
    unit2 = unit3;
    resid_on = res;
    number2 = -1;
    $('#ts-chart').highcharts().destroy();
    //var table = $('#example2').DataTable();
    //table
    //.clear()
    //.draw();
    $('#stat_div').hide();
    $('#ts-chart').hide();
    $('#multiple_units').hide();
    $('#loading').show();
    addingseries();

}

