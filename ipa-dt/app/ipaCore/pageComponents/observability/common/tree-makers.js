import _ from "lodash";
import {calculateAverage, calculateRange, findRangeConfig, hexToRgb} from "./calculations";
import {IafScriptEngine} from "@dtplatform/platform-api";
//TODO: should we use material-ui instead?

/**
 * Returns the following tree:
 * [dtType][equipmentId][pointName].{last,min,max,showMinMax,band,modelViewerIds}
 *
 * @param collectionsWithReadings - readings - as per redux fetched readings
 * @param metricsConfig - list of display config - as per redux fetched metricsConfig
 * @param entities - Assets (these are sensors itself) or Spaces (must have sensors:[] property)
 * @param includeIfNoReadings
 * @returns {*}
 */
export const makeReadingsTree = (collectionsWithReadings, metricsConfig, entities, includeIfNoReadings = true) => {

    const assetsByDtType = {};
    entities.forEach(e=>{
        const assets = e.sensors || [e];
        assets.reduce((map,a)=>{
            const value = a?.properties?.dtType?.val
            if(value) {
                if(!map[value]) {
                    map[value] = []
                }
                map[value].push(a)
            } else {
                console.warn(`Warning: dtType does not exist in asset (${a}) in makeReadingsTree function`)
            }

            // map[a.properties.dtType.val] = map[a?.properties?.dtType?.val] || [];
            // map[a.properties.dtType.val].push(a);
            return map;
        },assetsByDtType);
    });

    const sensorsTree = collectionsWithReadings.reduce((result,obj)=>{
        const {coll,telItems} = obj;

        //check if we have assets needed for this dtType
        const dtType = coll._versions.find(v=>v._isTip==true)._userAttributes?.dtType;
        result[dtType] = result[dtType] || {};
        if(!assetsByDtType[dtType]){
            return result;
        }

        //if we recreated assets two telemetry items might hold readings to same asset, they will have same _sourceId and _equipmentId
        //we might have virtual assets without revitGUID, but they will keep the equipmentId (unchanged)
        //in this case _sourceId will equal to _equipmentId
        const readingsByEquipmentId = telItems.reduce((eqMap,{telItem,readings})=>{
            eqMap[telItem._equipmentId] = eqMap[telItem._equipmentId] || [];
            for(const r of readings){
                eqMap[telItem._equipmentId].push(r);
            }
            return eqMap;
        },{});

        for (const a of assetsByDtType[dtType]){
            const equipmentId = a.properties['Asset Equipment ID']?.val;
            const readingsPerEquipment = readingsByEquipmentId[equipmentId];
            if(!readingsPerEquipment){
                continue;
            }
            const readingsPerPointName = readingsPerEquipment.map(r=>[r._tsMetadata.type,r]).reduce((rMap,[type,reading])=>{
                const metricConfig = metricsConfig.find(mc=>mc.pointName==type && mc.dtTypes.includes(dtType));
                if(!metricConfig){
                    //not allowed
                    return rMap;
                }
                rMap[type] = rMap[type] || {};
                rMap[type].sensor = a;
                rMap[type].modelViewerIds = a.modelViewerIds;
                rMap[type].readings = rMap[type].readings || [];
                rMap[type].readings.push(reading);
                return rMap;
            },{});
            _.keys(readingsPerPointName).forEach((pointName)=>{
                const readingsGroup = readingsPerPointName[pointName]
                const metricConfig = metricsConfig.find(mc=>mc.pointName==pointName && mc.dtTypes.includes(dtType));
                let sorted = _.orderBy(readingsGroup.readings.filter(r=>typeof r.val!== 'undefined'), ['_ts'], ['desc']);
                const last = sorted?.[0];
                let min = Number.MAX_SAFE_INTEGER;
                let max = Number.MIN_SAFE_INTEGER;
                let band = undefined;//this will have colour and all other props
                //set last value
                for(const r of (readingsGroup.readings || [])){
                    if(r){
                        const range = calculateRange(r.val,metricConfig);
                        if(range){
                            band = {...range};
                            if(range.color) band.colorAsArray = hexToRgb(range.color);
                        }
                        if(r.val > max) max = r.val;
                        if(r.val < min) min = r.val;
                    }
                }
                readingsGroup.last = last;
                readingsGroup.min = min;
                readingsGroup.max = max;
                if(min!=max){
                    readingsGroup.showMinMax = true;
                }
            });
            result[dtType][equipmentId] = readingsPerPointName;
        }
        return result;
    },{});
    return sensorsTree;
}

/**
 * This will return a tree of entities (i.e. Assets, Spaces) with aggregated values based on the group;
 * Usually should return [pointName][calculated_range_name][group_such_as_Space-Name] = [grouped entities]
 * Usually should return [pointName][group_such_as_Space-Name] = [grouped entities]
 * @param filteredEntities
 * @param readingsTree
 * @param filteredMetrics simple array of point names ["Temp","Hum"]
 * @param metricsConfigArray
 * @param selectedGroups - how the aggregation should be performed
 * @returns {{numFilteredEntities: *, tree: *}}
 */
export const makeEntityTree = (filteredEntities, readingsTree, filteredMetrics = [], metricsConfigArray, selectedGroups) => {

    const spaceOccupancyPrcRanges = window?.__Invicara?.iaf_telemetry_vars?.spaceOccupancyPrcRanges;

    const group = (entities, groupProperty, getPropertyValue) => {
        return entities.reduce((result, a) => {
            if(groupProperty==="__telemetry_point_name"){
                //special group to be looked up among readings
                //same entity can go to more than 1 group from here
                const groupNames = [];
                const filteredPointNames = filteredMetrics.map(f=>f.pointName);
                const sensors = a.sensors || [a];
                for(const sensor of sensors){
                    if(!sensor?.properties?.dtType?.val){
                        console.warn("Incompatible sensor",sensor);
                        continue;
                    }
                    //same sensor can go to more than 1 group from here
                    //try {
                    //    pointNames = _.keys(readings[sensor.properties.dtType.val][sensor.properties['Asset Equipment ID'].val]);
                    //    //console.log("pointNames for "+sensor["Asset Name"],pointNames);
                    //} catch(e){}
                    let metricConfigs = metricsConfigArray.filter(mc=>mc.dtTypes.includes(sensor.properties.dtType.val));
                    if(filteredPointNames && filteredPointNames.length>0){
                        metricConfigs = metricConfigs.filter(mc=>filteredPointNames.includes(mc.pointName));
                    }
                    const pointNames = metricConfigs.map(mc=>mc.pointName);
                    for(const pointName of pointNames){
                        if(!groupNames.includes(pointName)){
                            groupNames.push(pointName);
                        }
                    }
                }
                groupNames.forEach(groupName => {
                    const metric = filteredMetrics.find(f=>f.pointName===groupName);
                    const displayGroupName = metric && metric.displayName ? metric.displayName : groupName
                    let groupContents = result[displayGroupName] || [];
                    const newEntity = _.cloneDeep(a);
                    newEntity.__telemetry_point_name=groupName;
                    groupContents.push(newEntity);
                    result[displayGroupName] = groupContents;
                })
            } else if(groupProperty==="__telemetry_range_name"){
                const groupNames = [];
                const dtTypesForGroupName = {};
                //const lastTimestampForGroupName = {};
                const aggregatedValuesForGroupName = {};
                const rangeConfigForGroupName = {};
                const __telemetry_point_name = a.__telemetry_point_name || '';//we should do ranges per metric
                const sensors = a.sensors || [a];
                //map sensors per dtType
                const sensorsMap = sensors.reduce((map,s)=>{
                    if(!s?.properties?.dtType?.val){
                        console.warn("Incompatible sensor",s)
                        return map;
                    }
                    map[s.properties.dtType.val] = map[s.properties.dtType.val] || [];
                    map[s.properties.dtType.val].push(s);
                    return map;
                },{});
                for(const [dtType,sensorsPerDtType] of Object.entries(sensorsMap)){
                    const metricConfig = metricsConfigArray.find(mc=>mc.pointName==__telemetry_point_name && mc.dtTypes.includes(dtType));
                    if(!metricConfig){
                        continue;
                    }
                    let aggregatedVal = calculateAverage(__telemetry_point_name,readingsTree,sensorsPerDtType,metricsConfigArray);
                    let groupName = "Range Not Set";
                    if(aggregatedVal && typeof aggregatedVal.val !== 'undefined'){

                        let range = calculateRange(aggregatedVal.val,metricConfig);

                        //special case - if we have "count" metric and we have space max availability,
                        // we should color it based on special range
                        if(__telemetry_point_name=="count" && a['Space Name'] && a['Entity Name']==a['Space Name'] && spaceOccupancyPrcRanges){
                            const maxOccupancy = Math.max(a.properties['Max Occupancy']?.val,0);
                            if(maxOccupancy>0) {
                                const partialValue = Math.max(0,aggregatedVal.val);
                                const prc = (/*100 * */ partialValue) / maxOccupancy;
                                const rangeConfig = findRangeConfig(prc,spaceOccupancyPrcRanges);
                                if(rangeConfig){
                                    range = rangeConfig;
                                }
                            }
                        }
                        groupName = range?.name || groupName;
                        //this unit is used in the ui, do not remove
                        range && (rangeConfigForGroupName[groupName] = {...range, unit : metricConfig.unit});
                    }
                    if(groupName=="Range Not Set"){
                        //console.log("Range Not Set for",__telemetry_point_name,dtType,sensorsPerDtType,aggregatedVal);
                    }
                    //set dt types
                    dtTypesForGroupName[groupName]=dtTypesForGroupName[groupName]||[];
                    dtTypesForGroupName[groupName].push(dtType);
                    //const ts = lastTimestampForGroupName[groupName] || 0;
                    //if(aggregatedVal.maxLastTimestamp > ts) {
                    //    lastTimestampForGroupName[groupName]=aggregatedVal.maxLastTimestamp;
                    //}
                    //set agg values
                    aggregatedValuesForGroupName[groupName] = aggregatedVal;
                    if(!groupNames.includes(groupName)){
                        groupNames.push(groupName);
                    }
                }
                groupNames.forEach(groupName => {
                    let groupContents = result[groupName] || [];
                    const newEntity = _.cloneDeep(a);
                    newEntity.__telemetry_range_name=groupName;
                    newEntity.__telemetry_range_dtTypes=dtTypesForGroupName[groupName];
                    newEntity.__telemetry_range_config=rangeConfigForGroupName[groupName];
                    //newEntity.__telemetry_range_lastTs=lastTimestampForGroupName[groupName];

                    newEntity.__telemetry_range_aggregatedVal=aggregatedValuesForGroupName[groupName];
                    groupContents.push(newEntity);
                    result[groupName] = groupContents
                })
            } else {
                let groupName = getPropertyValue(a, groupProperty) || `${groupProperty} not set`
                let groupContents = result[groupName] || [];
                const newEntity = _.cloneDeep(a);
                newEntity['__telemetry_aggregation'] = groupName;
                groupContents.push(newEntity);
                result[groupName] = groupContents
            }
            return result
        }, {})
    };


    const nestedGroup = (entities, groups, getPropertyValue) => {
        if (!groups.length) return entities
        let [ groupKey, ...remainingKeys ] = groups
        let entries = Object.entries(group(entities, groupKey, getPropertyValue))

        entries.sort((a,b) => {
            if(groupKey=="__telemetry_point_name"){
                return a[0].localeCompare(b[0]);
            } else {
                const mc = filteredMetrics.find(f=>f.pointName==a[1][0]?.__telemetry_point_name);
                const order = mc && mc.sortOrder=="asc" ? 1 : -1;//descending as default
                const valA = isNaN(a[1][0]?.__telemetry_range_aggregatedVal?.val)===true ? new Number(0) : new Number(a[1][0]?.__telemetry_range_aggregatedVal?.val);
                const valB = isNaN(b[1][0]?.__telemetry_range_aggregatedVal?.val)===true ? new Number(0) : new Number(b[1][0]?.__telemetry_range_aggregatedVal?.val);
                return order*(valA - valB);
            }
        })

        return entries.reduce( (result, [groupName, groupValues]) => {
            result[groupName] = nestedGroup(groupValues, remainingKeys, getPropertyValue)
            return result
        }, {})
    }

    let numFilteredEntities = filteredEntities.length
    let tree = {}
    let groups = selectedGroups;
    if (groups && groups.length)
        tree = nestedGroup(filteredEntities, groups, (a, p) => a.properties[p] ? a.properties[p].val : (a[p] ? a[p]: null))
    else
        tree = filteredEntities;
    //console.log("tree",tree,filteredEntities,groups);
    return {tree, numFilteredEntities}
}


export const addAllNodeDescendants = (node, allDescendants) => {
    if(Array.isArray(node)){
        node.forEach(child=>allDescendants.push(child))
    } else {
        _.values(node).forEach(child=>addAllNodeDescendants(child,allDescendants))
    }
    return allDescendants;
}