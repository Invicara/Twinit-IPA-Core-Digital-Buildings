
import React, {useEffect, useMemo, useState} from "react"
import { ResponsiveLine } from '@nivo/line'
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMetricsConfig,
    fetchReadings24Hour, selectMetricsConfig,
    selectReadings24Hour, selectReadingsLast24HourAllSensorsLoadingStatus, selectReadingsLastFetch24Hour,
} from "../../redux/telemetry";

import { withGenericPageContext } from "../../pageComponents/observability/genericPageContext";
import {calculateAveragePerBucket} from "./common/calculations";
import './Chart.scss'

const Chart = ({ sensors = [], pointName, metricConfig, customChartConfig, handler, bucketInterval }) => {

    const config = customChartConfig || handler?.config?.chart;

    const [chartData, setChartData] = useState();
    const [chartColor, setChartColor] = useState();

    const metricsConfig = useSelector(selectMetricsConfig);
    useEffect(() => {
        if(!metricsConfig) {
            dispatch(fetchMetricsConfig());
        }
    }, []);
    const rangeLineStyles = useMemo(()=>{
        const rangeStyles = {
            "default": {
                strokeWidth: 2,
                stroke: '#000000',
                strokeOpacity: 1,
            },
            "line": {
                strokeWidth: 2,
                stroke: config.component.chartConfig.lineColor,
                strokeOpacity: 1,
            }
        };
        metricsConfig.forEach(mc=>{
            mc.ranges.forEach(range=>{
                rangeStyles[`${pointName}_${range.name}`]={
                    strokeWidth: 1,
                    stroke: '#774dd7',
                    strokeOpacity: 0.8,
                };
            })
        });
        return rangeStyles;
    },[metricsConfig]);

    const reading24Hour = useSelector(selectReadings24Hour);
    const reading24HourLastFetch = useSelector(selectReadingsLastFetch24Hour);

    const loading = useSelector(selectReadingsLast24HourAllSensorsLoadingStatus);

    const dispatch = useDispatch();

    const [max,setMax] = useState(new Date());
    const last24h = new Date(max.getTime() - (24 * 60 * 60 * 1000));
    const [min] = useState(last24h);

    useEffect(() => {
        if (!sensors || sensors.length==0 || !pointName) return;
        const now = new Date();
        const last5min = new Date(now.getTime() - (1 * 5 * 60 * 1000));

        let refetch = false;
        for(const sensor of sensors){
            if(!reading24HourLastFetch[sensor._id] || !reading24HourLastFetch[sensor._id][pointName] || reading24HourLastFetch[sensor._id][pointName]<last5min){
                refetch = true;
            }
        }
        refetch && dispatch(fetchReadings24Hour({sensors: sensors, pointName: pointName}));
    }, [sensors, pointName])

    
    useEffect(() => {

        const fetchAndFormatReadings = async (readings, ss, pn) => {
            if (!readings) return;

            //console.log("fetchAndFormatReadings",readings);

            let formatedData = [];
            const allReadings = ss.reduce((arr,s)=>arr.concat(readings?.[s._id]?.[pn]||[]),[]);
            const interval = bucketInterval || 10*60*1000;//10min
            const avgPerBucket = calculateAveragePerBucket(pn, allReadings, metricConfig, interval);

            const chartBuckets = [];
            for(let ts = min.getTime();ts<=max.getTime();ts=ts+interval){
                const bucket = (Math.floor(ts/interval))*interval;
                chartBuckets.push(bucket);
            }

            //console.log("chartBuckets",chartBuckets);

            const chartBucketData = {};
            let overallMin = Number.MAX_SAFE_INTEGER;
            let overallMax = Number.MIN_SAFE_INTEGER;
            for(const [bucket,bucketData] of Object.entries(avgPerBucket)){
                let timestamp = bucket;
                if(typeof timestamp === 'string'){
                    timestamp = parseInt(timestamp);
                }
                //depending on xScale config x should be:
                //if useUTC is TRUE - then it should be string that comes from platform endpoint
                //if useUTC is FALSE - then it should be a Date object
                const data = {x: new Date(timestamp), y: bucketData.aggregatedVal.val};
                chartBucketData[timestamp] = data;
                //formatedData.push({ x: new Date(timestamp), y: bucketData.aggregatedVal.val})
                if(typeof bucketData.aggregatedVal.val !== 'undefined' && bucketData.aggregatedVal.val<overallMin){
                    overallMin = bucketData.aggregatedVal.val;
                }
                if(typeof bucketData.aggregatedVal.val !== 'undefined' && bucketData.aggregatedVal.val>overallMax){
                    overallMax = bucketData.aggregatedVal.val;
                }
            }

            //console.log("chartBucketData",chartBucketData);

            for (const [i, bucket] of chartBuckets.entries()) {
                let data = chartBucketData[bucket];
                if(data){
                    formatedData.push(data)
                }
                //else if(i==0 || i==chartBuckets.length-1) {
                    //formatedData.push({ x: new Date(bucket), y: null})
                //}
            }

            //console.log("chart line data",formatedData)

            let chartData = []
            let colors = []

            //console.log("overallMin",overallMin)


            if(formatedData.length>0) {
                for (const [i, range] of metricConfig.ranges.entries()) {
                    //console.log("overallMin<range.to",overallMin<range.to,overallMin,range.to)
                    //console.log("overallMax>range.from",overallMax>range.from,overallMax,range.from)
                    if (i == 0) {
                        //only add first range if we have readings is in that rage
                        if(overallMin<range.to) {
                            colors.push(range.color)
                            chartData.push({
                                id: `${pointName}_${range.name}`,
                                data: [{x: new Date(chartBuckets[0]), y: range.from}, {
                                    x: new Date(chartBuckets[chartBuckets.length - 1]),
                                    y: range.from
                                }]
                            });
                        }
                    } else if (i == metricConfig.ranges.length - 1) {
                        //only add last range if we have readings is in that rage
                        if(overallMax>range.from) {
                            colors.push(range.color)
                            chartData.push({
                                id: `${pointName}_${range.to}`,
                                data: [{x: new Date(chartBuckets[0]), y: range.from}, {
                                    x: formatedData[formatedData.length - 1].x,
                                    y: range.from
                                }]
                            })
                        }
                    } else {
                        colors.push(range.color)
                        //const mean = (range.from + range.to) / 2
                        chartData.push({id: `${pointName}_${range.name}`,
                            data: [{x: new Date(chartBuckets[0]), y: range.from}, {
                                x: new Date(chartBuckets[chartBuckets.length-1]),
                                y: range.from
                            }]
                        })
                    }
                }
            }
            //console.log("chart line data",chartData)

            chartData.push({
                id: 'line',
                data: formatedData
            })

            colors.push(config.component.chartConfig.lineColor);

            setChartColor(colors)
            setChartData(chartData)
        }



        fetchAndFormatReadings(reading24Hour, sensors, pointName);



    }, [reading24Hour, sensors, pointName])

    const chartConfig = {...config.component.chartConfig};
    chartConfig.curve = pointName=="occupancy" || pointName=="count" ? chartConfig.curve : "natural";
    chartConfig.enableCrosshair = true;

    const CustomizedDataLine = ({ series, lineGenerator, xScale, yScale }) => {
        return series.map(({ id, data, color }) => (
            <path
                key={id}
                d={lineGenerator(
                    data.map(d => ({
                        x: xScale(d.data.x),
                        y: yScale(d.data.y),
                    }))
                )}
                fill="none"
                stroke={rangeLineStyles[id] || rangeLineStyles.default.stroke}
                style={rangeLineStyles[id] || rangeLineStyles.default}
            />
        ))
    }

    return (
        <div className={"telemetry-chart-container"} style={config.component.style}>
            {loading=='loading' && <div className="spinningLoadingIcon"></div>}
            {
                chartData && (
                    <LineChart
                        data={chartData}
                        chartConfig={{...chartConfig, colors: chartColor}}
                        layers={[CustomizedDataLine,'axes', 'legends']}
                    />
                )
            }
        </div>
    )
}

export default withGenericPageContext(Chart);


const LineChart = ({ chartConfig, data }) => {
    return (
        <ResponsiveLine
            data={data}
            {...chartConfig}
        />
    )
}