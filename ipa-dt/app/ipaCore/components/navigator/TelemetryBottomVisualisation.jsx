
import React, {useCallback, useEffect, useMemo, useState} from "react"
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMetricsConfig,
    fetchReadings24Hour, fetchReadingsByEntities, fetchWellnessReadingsByEntities, generateCacheKey, hashCode,
    selectFilteredMetricConfigs,
    selectFilteredPointNames,
    selectFocusedEntity,
    selectMetricsConfig,
    selectReadings24Hour, selectReadingsByKey,
    selectReadingsLastFetch24Hour, selectReadingsLoadingStatus, setFilteredMetricConfig,
    telemetryActions,
} from "../../redux/telemetry";

import Chart from "../../pageComponents/observability/Chart";
import _ from "lodash";
import {Button, Box, ButtonGroup, createStyles, makeStyles} from "@material-ui/core";
import LoopIcon from "@material-ui/icons/Loop";
import clsx from "clsx";
import produce from "immer";
import {makeEntityTree, makeReadingsTree} from "../../pageComponents/observability/common/tree-makers";
import {SlimRoundCheckbox} from "../../pageComponents/observability/TelemetryTabularTreeBranch";

const EMPTY_ARRAY = [];

const useButtonStyles = makeStyles({
    root: {
        background: '#ffffff',
        borderRadius: 0,
        border: 0,
        height: 48,
        padding: '0 30px',
        //boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    },
});


export const useSpinIconStyles = makeStyles(() =>
    createStyles({
        rotateIcon: {
            animation: "$spin 2s linear infinite",
            fontSize: "small"
        },
        "@keyframes spin": {
            "0%": {
                transform: "rotate(360deg)"
            },
            "100%": {
                transform: "rotate(0deg)"
            }
        }
    })
);


const TelemetryBottomVisualisation = ({extendedData, chart}) => {

    //console.log("loading TelemetryBottomVisualisation",extendedData,chart);

    const focusedEntity = useSelector(selectFocusedEntity);
    const focusedSensors = focusedEntity ? (focusedEntity.sensors || [focusedEntity]) : EMPTY_ARRAY;

    //due to bug in ipa core, we might get extendedData from previous group for a couple of renders
    const extendedDataEntities = useMemo(()=>extendedData && Array.isArray(extendedData) ? extendedData.filter(ed=>!!ed.properties) : (extendedData && extendedData.properties ? [extendedData] : EMPTY_ARRAY),[extendedData]);
    const extendedDataSensors = useMemo(()=>extendedDataEntities.reduce((arr,e)=>arr.concat(e.sensors || [e]),[]),[extendedDataEntities]);

    const currentEntity = useMemo(()=>extendedDataSensors ? extendedDataEntities[0] : focusedEntity,[extendedDataEntities,focusedEntity]);

    if(!currentEntity) {
        return null;
    }

    const [sensors, setSensors] = useState(extendedDataSensors ? extendedDataSensors : (focusedSensors || EMPTY_ARRAY));

    useEffect(()=>{
        const newSensors = extendedDataSensors || focusedSensors || EMPTY_ARRAY;
        if(newSensors!==sensors){
            setSensors(newSensors);
        }
    },[extendedDataSensors,focusedSensors]);

    const filteredMetricConfigs = useSelector(selectFilteredMetricConfigs);
    const metricsConfig = useSelector(selectMetricsConfig);

    const [metricConfig, setMetricConfig] = useState(undefined)

    const readingsLoading = useSelector(selectReadingsLoadingStatus);
    const cacheKey = useMemo(()=>generateCacheKey(currentEntity),[currentEntity]);
    const readingsCache = useSelector(state => selectReadingsByKey(state,cacheKey));
    const [reloadToken, setReloadToken] = useState(new Date().getTime());

    //[dtType][equipmentId][pointName].{last,min,max,showMinMax,band,modelViewerIds}
    const readingsTree = useMemo(()=> {
        if(!metricsConfig){
            return undefined;
        }
        return makeReadingsTree(readingsCache?.collectionsWithReadings || EMPTY_ARRAY, metricsConfig, sensors)
        },[readingsCache, metricsConfig, sensors]);
    const [selectedGroups] = useState(["Entity Name","__telemetry_point_name","__telemetry_range_name"]);
    //[group_such_as_Space-Name][pointName][calculated_range_name] = [grouped entities with {__telemetry_range_aggregatedVal,__telemetry_range_name,__telemetry_range_config}]
    const entityTree = useMemo(()=> {
            if(!metricsConfig){
                return undefined;
            }
            return makeEntityTree([currentEntity], readingsTree, metricsConfig, metricsConfig, selectedGroups)
        },[currentEntity,readingsTree,metricsConfig]);
    const aggValPerPoint = {};
    if(entityTree?.tree[currentEntity['Entity Name']]) {
        for (const [pointName, map] of Object.entries(entityTree?.tree[currentEntity['Entity Name']])) {
            const [rangeName, group] = Object.entries(map)[0];
            const augmentedEntityItself = group[0];
            aggValPerPoint[pointName] = augmentedEntityItself;
        }
    }

    useEffect(() => {
        const now = new Date();
        const last5min = new Date(now.getTime() - (1 * 5 * 60 * 1000));

        if(!readingsCache || readingsCache.timestamp<last5min.getTime()) {
            dispatch(fetchReadingsByEntities({
                entities: [currentEntity],
                entityType: currentEntity['Asset Name'] ? "Asset" : "Space"
            }));
        }
    }, [sensors]);

    useEffect(() => {
        dispatch(fetchReadingsByEntities({
            entities: [currentEntity],
            entityType: currentEntity['Asset Name'] ? "Asset" : "Space"
        }));
    }, [reloadToken]);

    useEffect(() => {
        if(!metricsConfig) {
            dispatch(fetchMetricsConfig());
        }
    }, []);

    useEffect(() => {
        if(!metricsConfig){
            return;
        }
        if(!_.isEmpty(sensors)) {
            //console.log("metricsConfig",metricsConfig)
            const sensorsPerDtType = sensors.reduce((map,s)=>{
                map[s.properties.dtType.val] = map[s.properties.dtType.val] || [];
                map[s.properties.dtType.val].push(s);
                return map;
            },{});
            const dtTypes = Object.keys(sensorsPerDtType);
            const availableMetricConfigs = metricsConfig.filter(mc=>!!mc.dtTypes.find(dt=>dtTypes.includes(dt)));
            let preferedPointNames = [];
            let selected;
            if(!_.isEmpty(filteredMetricConfigs)){
                preferedPointNames = filteredMetricConfigs.map(fmc=>fmc.pointName);
                selected = availableMetricConfigs.find(amc=>preferedPointNames.includes(amc.pointName));
            }
            if(!selected && availableMetricConfigs){
                selected = availableMetricConfigs[0]
            }
            if(selected!==metricConfig){
                setMetricConfig(selected);
            }
        }
    }, [metricsConfig,sensors]);


    const dispatch = useDispatch();
    const onClickPointName = useCallback((c)=>{
        console.log("onClickPointName",c);
        setMetricConfig(c);
        //TODO: should we update the whole screen?
        //dispatch(telemetryActions.setFilteredMetricConfigs([c]))
    },[setMetricConfig]);

    const dtTypes = useMemo(()=>{
        const types = sensors.reduce((map,s)=>{
            map[s.properties.dtType.val] = true;
            return map;
        },{});
        return Object.keys(types);
    },[sensors]);

    const customChartConfig = produce(chart, (chartConfig) => {
        chartConfig.component.style.height = "250px";
    });

    const buttonClasses = useButtonStyles();
    const spinIconClasses = useSpinIconStyles();

    const lastTimestamp = _.values(aggValPerPoint).reduce((ts,e)=>
        e?.__telemetry_range_aggregatedVal?.maxLastTimestamp>ts ? e?.__telemetry_range_aggregatedVal?.maxLastTimestamp : ts,0);

    return (
        <React.Fragment>
            <Box display="flex" bgcolor="background.paper">
                <Box className="telemetry-tab-group" >
                    <Box display="flex">
                        <Box flexGrow={1}>
                            {lastTimestamp>0 && <span style={{
                                fontSize: "small",
                                color: "#747474",
                                lineHeight:"37px"
                            }}>{new Date(lastTimestamp).toLocaleString()}</span>}
                        </Box>
                        <Box>
                            <Button className="telemetry-tab-status" onClick={()=>setReloadToken(!reloadToken)}>Refresh</Button>
                        </Box>
                    </Box>
                    <ButtonGroup
                        orientation="vertical"
                        variant="text"
                    >
                        {metricsConfig && metricsConfig.filter(c=>c.dtTypes.find(dt=>dtTypes.includes(dt))).map(c =>
                            <Button key={c._id}
                                    label={`${c.displayName} ${c.unit}`}
                                    value={c}
                                    onClick={()=>onClickPointName(c)}
                                    className={clsx({"point-name-tab-button": true, "active-point-name": metricConfig && metricConfig._id==c._id})}
                                    classes={{
                                        root: buttonClasses.root,
                                    }}
                                    styles={{
                                        background: (aggValPerPoint[c.displayName]?.__telemetry_range_config?.color || "inherit")
                                    }}
                            >

                                <Box display="flex" p={1}>
                                    <Box p={1} flexGrow={1}>
                                        <span>{c.displayName}</span>
                                    </Box>
                                    <Box p={1} >
                                        {readingsLoading=='loading' && <LoopIcon className={spinIconClasses.rotateIcon} />}
                                        {[aggValPerPoint[c.displayName]?.__telemetry_range_aggregatedVal?.displayVal, aggValPerPoint[c.displayName]?.__telemetry_range_config?.unit].join('\u00A0' /*it's non-breaking space*/)}
                                    </Box>
                                </Box>
                            </Button>
                        )}
                    </ButtonGroup>
                </Box>
                <Box flexGrow={1}>
                    <div className='chart-container'>
                        {!_.isEmpty(sensors) && metricConfig && <Chart
                            sensors={sensors}
                            pointName={metricConfig.pointName}
                            metricConfig={metricConfig}
                            customChartConfig={customChartConfig}
                        />}
                    </div>
                </Box>
            </Box>


        </React.Fragment>
    )
}


export const TelemetryBottomVisualisationFactory = {
    create: (props) => {
        const {config, data} = props;
        console.log("config TelemetryBottomVisualisation",props);


        return <TelemetryBottomVisualisation {...config.config} extendedData={data}/>

    }
}

export default TelemetryBottomVisualisation