var data =[]
/* Formatting function for row details - modify as you need */
//
//
//
//
//function format ( d ) {
//    // `d` is the original data object for the row
//    return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
//        '<tr>'+
//            '<td>Full name:</td>'+
//            '<td>'+d.name+'</td>'+
//        '</tr>'+
//        '<tr>'+
//            '<td>Extension number:</td>'+
//            '<td>'+d.extn+'</td>'+
//        '</tr>'+
//        '<tr>'+
//            '<td>Extra info:</td>'+
//            '<td>And any further details here (images etc)...</td>'+
//        '</tr>'+
//    '</table>';
//}
//
//$(document).ready(function() {
//    var table = $('#example1').DataTable( {
//
//        "columns": [
//            {
//                "className":      'details-control',
//                "orderable":      false,
//                "data":           null,
//                "defaultContent": ''
//            },
//            { "data": "name" },
//            { "data": "position" },
//            { "data": "office" },
//            { "data": "salary" }
//        ],
//        "order": [[1, 'asc']]
//    } );
//
//    // Add event listener for opening and closing details
//    $('#example1 tbody').on('click', 'td.details-control', function () {
//        var tr = $(this).closest('tr');
//        var row = table.row( tr );
//
//        if ( row.child.isShown() ) {
//            // This row is already open - close it
//            row.child.hide();
//            tr.removeClass('shown');
//        }
//        else {
//            // Open this row
//            row.child( format(row.data()) ).show();
//            tr.addClass('shown');
//        }
//    } );
//
//var dataset = {
//      name: "Tiger Nixon",
//      position: "System Architect",
//      salary: "$320,800",
//      start_date: "2011/04/25",
//      office: "Edinburgh",
//      extn: "5421"
//    }
//
//
//    var table = $('#example1').DataTable();
//    table.row.add(dataset).draw();
//} );
var counter = 0
$(document).ready(function (callback) {

    var table = $('#example2').DataTable({
        //destroy: true,
        //"bDestroy": true,
        //bRetrieve: true ,
        "createdRow": function (row, data, dataIndex) {
           color1 = null
            console.log(dataIndex)
            number = dataIndex
            if (number == 0 || number%10 ==0) {
                color1 = "#ec3131"
            }
            if (number == 1|| number%10 ==1) {
                color1 = "#2cc52e"
            }
            if (number == 2|| number%10 ==2) {
                color1 = "#313eec"
            }
            if (number == 3|| number%10 ==3) {
                color1 = "#dd25d5"
            }
            if (number == 4|| number%10 ==4) {
                color1 = "#0d0c0d"
            }
            if (number == 5|| number%10 ==5) {
                color1 = "#31cbec"
            }
            if (number == 6|| number%10 ==6) {
                color1 = "#fb8915"
            }
            if (number == 7|| number%10 ==7) {
                color1 = "#ffb8e7"
            }
            if (number == 8|| number%10 ==8) {
                color1 = "#fbfd07"
            }
            if (number == 9|| number%10 ==9) {
                color1 = "#660099"
            }

            //console.log("created")
            //console.log(row)
            //console.log(data)
            //console.log(dataIndex)
            $('td', row).eq(0).css("backgroundColor",color1)
           // if (dataIndex == 0){
           //      $('td', row).eq(0).css("backgroundColor", '#2cc52e')
           // }
           //else if(dataIndex ==1){
           //     $('td', row).eq(0).css("backgroundColor", '#FF0000')
           // }
           // else{
           //     $('td', row).eq(0).css("backgroundColor", '#006400')
           // }
            $('td', row).eq(1).each(function () {
                var sTitle;
                sTitle = "Click here to see more data"
                this.setAttribute('title', sTitle);
            });
            counter = counter =1

            var table = $('#example2').DataTable()
            table.$('td').tooltip({
                selector: '[data-toggle="tooltip"]',
                container: 'body',
                "delay": 0,
                "track": true,
                "fade": 100
            });


        },

        data: data,
        "columns": [
            {
                "className": "legend",
                "data": "legend"
            },
            {
                "className": 'details-control',
                "orderable": false,
                "data": null,
                "defaultContent": ''
            },
            {"data": "organization"},
            {"data": "name"},
            {"data": "variable"},
            {"data": "unit"},
            {"data": "samplemedium"},
            {"data": "count"},


            //{"data":"download"}
        ],
        "order": [[1, 'asc']]
    });
    // Add event listener for opening and closing details
    $('#example2 tbody').on('click', 'td.details-control', function () {
        console.log("click")
        var tr = $(this).closest('tr');
        var row = table.row(tr);
        if (row.child.isShown() == true) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            // console.log("afasfdfdsssfdfafdssafsddfsfdf!!!!!!!!!!!!!!!!")
            row.child(format(row.data())).show();
            box(row.data().boxplot_count);
            var series =
            {
                name: 'Site:' + row.data().name +
                ' Variable:' + row.data().variable,
                data: [],
                groupPadding: 0,
            }
            // add the time series to the chart
            series.data = [row.data().boxplot.map(Number)];

            var name_plot = '#container' + row.data().boxplot_count

            var chart = $(name_plot).highcharts();
            chart.setTitle({text: row.data().name});
            chart.yAxis[0].setTitle({text: row.data().variable + ' (' + row.data().unit + ')'})
            chart.xAxis[0].setTitle({
                text: 'Mean: ' + row.data().mean + ' Median: ' + row.data().median +
                ' Maximum: ' + row.data().max + '  Minimum : ' + row.data().min
            })

            chart.addSeries(series);

            tr.addClass('shown');
        }
    });
})
function format ( d ) {
    // `d` is the original data object for the row
    name ='container'+ d.boxplot_count
    console.log("hi world")

    return '<div id = "container'+ d.boxplot_count+'"class ="highcharts-boxplot" style = "float:right;height:250px;width:40%" ></div>'+

    '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:100px; margin-left:8.5%;font-size: 9pt">'+

        '<tr>'+
            '<td>Quality Control:</td>'+
            '<td>'+d.quality+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Method:</td>'+
            '<td>'+d.method+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Data Type:</td>'+
            '<td>'+ d.datatype+'</td>'+
        '</tr>'+
            '<tr>'+
            '<td>Value Type:</td>'+
            '<td>'+d.valuetype+'</td>'+
        '</tr>'+
            '<tr>'+
            '<td>Time Support:</td>'+
            '<td>'+d.timesupport+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Time Units:</td>'+
            '<td>'+d.timeunit+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Source Description:</td>'+
            '<td>'+d.sourcedescription+'</td>'+
        '</tr>'+
    '</table>';
}