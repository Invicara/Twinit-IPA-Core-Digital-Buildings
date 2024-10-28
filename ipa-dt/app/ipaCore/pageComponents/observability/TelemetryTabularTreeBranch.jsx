import React, {useCallback, useEffect, useMemo, useState, useReducer, useRef} from "react";
import _ from 'lodash'
import './TelemetryTabularTree.scss'
import clsx from "clsx";
import {calculateAverage, calculateRange, findRangeConfig} from "./common/calculations";
import {RoundCheckbox} from "@invicara/ipa-core/modules/IpaControls";
import Chart from "./Chart";
import {useDispatch, useSelector} from "react-redux";
import {Box, withStyles} from "@material-ui/core";
import {getSelectedEntities as fixedGetSelectedEntities} from "./common/entities-fixes";
import {IafScriptEngine} from "@dtplatform/platform-api";

export const TelemetryTabularTreeBranch = ({nodeName, nodeValue, currentDepth, selectedGroups, readings, allDescendants, getNodes, metricsConfigArray, expandBranch, expandedNodesMap, selectNode, selectedNodesMap}) => {

    const isFirst = selectedGroups[0] === selectedGroups[currentDepth-1];
    const isLast = selectedGroups[selectedGroups.length - 1] === selectedGroups[currentDepth-1];

    const expanded = expandedNodesMap?.[nodeName] ? true : false;
    const selected = selectedNodesMap?.[nodeName] ? true : false;

    const spaceOccupancyPrcRanges = window?.__Invicara?.iaf_telemetry_vars?.spaceOccupancyPrcRanges;

    const groupedValue = useMemo(()=>{
        let value;
        let range;
        let sensorsForValue;
        let pointName;
        let dtTypes;
        let metricConfig;
        const groupDef = selectedGroups[currentDepth-1];
        let sensors = [];
        for(const descendant of allDescendants){
            sensors = sensors.concat(descendant.sensors || [descendant]);
        }
        //allDescendants might have 2 different dtTypes (i.e. "Temp" point name in 2 dtTypes)
        //in this case we should get the colours from the first dtType
        const sensorsPerDtType = sensors.reduce((map,s)=>{
            map[s.properties.dtType.val] = map[s.properties.dtType.val] || [];
            map[s.properties.dtType.val].push(s);
            return map;
        },{});

        if(!["__telemetry_point_name","__telemetry_range_name"].includes(groupDef)){
            //__telemetry_point_name group has been already done
            //and we can safely assume allDescendants belong to the same point
            pointName = allDescendants[0].__telemetry_point_name;
            dtTypes = allDescendants[0].__telemetry_range_dtTypes;
            metricConfig = metricsConfigArray.find(mc=>mc.pointName==pointName && mc.dtTypes.find(dt=>dtTypes.includes(dt)));
            sensorsForValue = dtTypes.reduce((arr,dtType)=>{
                return sensorsPerDtType[dtType] ? arr.concat(sensorsPerDtType[dtType]) : arr;
            },[]);
            value = calculateAverage(pointName, readings, sensorsForValue, metricsConfigArray);
            if(value && value.displayVal){
                range = calculateRange(value.val, metricConfig);
            }

            //special case - if we have "count" metric and we have space max availability,
            // we should color it based on special range
            const testNodeForSpace = Array.isArray(nodeValue) ? nodeValue[0] : nodeValue;
            //console.log("testNodeForSpace",testNodeForSpace,pointName);
            if(spaceOccupancyPrcRanges && pointName=="count" && testNodeForSpace['Space Name'] && testNodeForSpace['Entity Name']==testNodeForSpace['Space Name']){
                const maxOccupancy = Array.isArray(nodeValue) ? (nodeValue.reduce((acc,nv)=>acc+(Math.max(nv?.properties?.['Max Occupancy']?.val,0)),0)) : nodeValue?.properties?.['Max Occupancy']?.val;
                //console.log("testNodeForSpace maxOccupancy",testNodeForSpace,maxOccupancy);
                if(maxOccupancy>0) {
                    const partialValue = Math.max(0,value.val);
                    const prc = (/*100 * */ partialValue) / maxOccupancy;
                    const rangeConfig = findRangeConfig(prc,spaceOccupancyPrcRanges);
                    if(rangeConfig){
                        range = rangeConfig;
                    }
                }
            }
        } else if (groupDef=="__telemetry_point_name"){
            //__telemetry_point_name group has been already done
            //and we can safely assume allDescendants belong to the same point
            pointName = allDescendants[0].__telemetry_point_name;
            dtTypes = Object.keys(sensorsPerDtType);
            metricConfig = metricsConfigArray.find(mc=>mc.pointName==pointName && mc.dtTypes.find(dt=>dtTypes.includes(dt)));
            value = {
                displayValue: ""
            }
        }
        //console.log("renderBranchNode groupedValue",nodeName,nodeValue,value,range);
        return {value: value, range: range, sensorsForValue, pointName, metricConfig};
    },[readings,allDescendants,selectedGroups,currentDepth,metricsConfigArray]);

    //console.log("debugging groupedValue?.value?",groupedValue?.value);

    return (
        <React.Fragment>
            <a className={"basic-row depth-"+currentDepth} style={{ width: '100%' }}>
                <Box display="flex" p={1}>
                    <Box p={1} >
                        {isLast && <SlimRoundCheckbox checked={expanded} onChange={()=>expandBranch(null, nodeName, nodeValue)}/>}
                    </Box>
                    <Box p={1} flexGrow={1}>
                        <span>{nodeName}
                            {false && isLast && <i className="fas fa-chart-bar branch-expander" onClick={e => expandBranch(e, nodeName, nodeValue)} />}</span>
                    </Box>
                    <Box p={1}>
                        {isLast && groupedValue?.value?.displayVal && <span className={"telemetry-value"} title={!groupedValue?.value?.maxLastTimestamp ? "" : new Date(groupedValue?.value?.maxLastTimestamp).toLocaleTimeString()}>
                              <span style={{color: groupedValue?.range?.color}}>{groupedValue.value.displayVal}</span>
                              <span style={{color: groupedValue?.range?.color}}>&nbsp;{groupedValue?.metricConfig?.unit}</span>
                          </span>}
                    </Box>
                </Box>
            </a>
                {isLast && expanded && groupedValue?.sensorsForValue && <Chart
                    sensors={groupedValue.sensorsForValue}
                    pointName={groupedValue.pointName}
                    metricConfig={groupedValue.metricConfig}
                />}
            <ul key={nodeName+"_children"} className={clsx(isLast && 'expandable', expanded && 'expanded')}>
                {getNodes(nodeValue, currentDepth+1, expanded)}
            </ul>
        </React.Fragment>
    );
}

export const SlimRoundCheckbox = withStyles({
    root: {
        padding: 0,
    },
    indeterminate: {
        padding: 0,
    },
    checked: {
        padding: 0,
    },
})((props) => <RoundCheckbox {...props} />)



