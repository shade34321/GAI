$(function () {
    require([
        "js/timeline.js",
        "js/charts.js",
        "js/data.js",
        "js/map.js",
        "js/osm_heatmap.js",
        "js/utils.js",
        "data.js"
    ], function () {

        var charts = [],
            dynamics = [],
            titles = ["Общее количество ДТП", "Кол-во ДТП на 10тыс. ед. ТС", "Общее число погибших и раненных", "Число пострадавших на 100 тыс. жителей"],
            datasets = {
            };

        initMap();
        tx_map.init_done = true;
        //timeLine.activate(2013);
        $('#switchView').tabs().removeClass('ui-widget ui-widget-content ui-corner-all');
        // приводим вкладки к нужному виду
        $(".tabs-bottom .ui-tabs-nav, .tabs-bottom .ui-tabs-nav > *")
            .removeClass("ui-corner-all ui-corner-top")
            .addClass("ui-corner-bottom");
        $(".ui-tabs-nav").removeClass("ui-widget-header ui-corner-bottom");
        $(".ui-state-default").addClass('ui-corner-all');

        Highcharts.getOptions().colors = $.map(Highcharts.getOptions().colors, function (color) {
            return {
                radialGradient:{ cx:0.5, cy:0.3, r:0.7 },
                stops:[
                    [0, color],
                    [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                ]
            };
        });



        dynamics.push(createStackedChart('dynamicsChart0'));
        dynamics.push(createAlcoChart('dynamicsChart1'));
        /*$.each(window.reportdata, function(i, val) {
            datasets[i] = getChartDataFromJSON(val);
        });*/
        var onTimeLineChange = function (event, data) {
                        for (var i = 0; i < 4; i++) {
                            $.each(charts[i].series, function (j, val) {
                                val.setData(datasets[data]['chart' + i], false);
                            });
                            charts[i].redraw(true);
                        }
                        console.log(data);
                    };
        var timeLine = new TimeLine("#timeline", "#dates", "#issues", onTimeLineChange);

                //timeLine.addDate('2010');


        for (var i = 2004; i < 2013; i++) {
            datasets[i + ''] = getChartDataFromJSON(window.reportdata[i + '']);
            timeLine.addDate(i);
        }


        for (var i = 0; i < 4; i++)
            charts.push(createChart('testChart' + i, titles[i], datasets["2012"]['chart' + i]));

        timeLine.update();
        timeLine.activate('2012');


        window.charts = charts;
        // привязываем данные к листам
        $('#chartsList').data('charts', charts);
        $('#dynamicsList').data('charts', dynamics);
        $.each(charts, function(i, val) {
            $('#chartsList').children(':nth-child(' + (i + 1) +')').children().data('chart', val);
            $('#dynamicsList').children(':nth-child(' + (i + 1) +')').children().data('chart', dynamics[i]);
        });

        $('.chartsList').children().children().children().on('click', function () {
            console.log('clicked');
            var parent = $(this).parent().parent(),
                currCharts = parent.parent().data('charts'),
                $container = $(this).parent(),
                chart = $container.data('chart');
            if ($container.hasClass('selected')) {
                $container.removeClass('selected');
                parent.siblings().children().removeClass('notselected');
                $.each(currCharts, function (i, val) {
                    val.setSize(400, 250);
                });
            }
            else {
                parent.prependTo(parent.parent());
                parent.siblings().children().removeClass('selected').addClass('notselected');
                $container.removeClass('notselected').addClass('selected');
                chart.setSize(800, 400);
                $.each(currCharts, function (i, val) {
                    if (val != chart) {
                        val.setSize(260, 80);
                    }
                });
            }
        });
    })
});

function getChartDataFromJSON(json) {
    var rtcTotal = [],
        rtcTotalCount = 0,
        rtcBy10k = [],
        rtcBy10kCount = 0,
        injury = [],
        injuryCount = 0,
        vehicle = [],
        vehicleCount = 0;
    $.each(json.data, function (i, val) {
        if (val.region != "Российская Федерация") {
            rtcTotalCount += parseInt(val.rtc_total);
            rtcBy10kCount += parseInt(val.rtc_by10kk_abs);
            injuryCount += parseInt(val.injury_total);
            vehicleCount += parseInt(val.vehicle_total);

            rtcTotal.push([val.region, parseInt(val.rtc_total)]);
            rtcBy10k.push([val.region, parseInt(val.rtc_by10kk_abs)]);
            injury.push([val.region, parseInt(val.injury_total)]);
            vehicle.push([val.region, parseInt(val.vehicle_total)]);
        }
        /*else {
         rtcTotalCount = parseInt(val.rtc_total);
         rtcBy10kCount = parseInt(val.rtc_by10kk_abs);
         injuryCount = parseInt(val.injury_total);
         injuryBy100kCount = parseInt(val.injury_by100kk_abs);
         }*/
    });
    return {
        chart0:addThreshHold(rtcTotal, 2, rtcTotalCount),
        chart1:addThreshHold(rtcBy10k, 1.2, rtcBy10kCount),
        chart2:addThreshHold(injury, 2, injuryCount),
        chart3:addThreshHold(vehicle, 2, vehicleCount)
    }
}

function addThreshHold(data, percent, total) {
    var newData = [],
        others = ['Другие', 0];
    $.each(data, function (i, val) {
        if (val[1] * 100 / total < percent) {
            others[1] += val[1];
        }
        else
            newData.push(val);
    });
    newData.push(others);
    return _.sortBy(newData, function (obj) {
        return obj[1]
    });
}
