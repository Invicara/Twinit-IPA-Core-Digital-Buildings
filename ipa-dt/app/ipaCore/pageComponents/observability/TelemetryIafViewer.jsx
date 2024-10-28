/**
 * ****************************************************************************
 *
 * INVICARA INC CONFIDENTIAL __________________
 *
 * Copyright (C) [2012] - [2020] INVICARA INC, INVICARA Pte Ltd, INVICARA INDIA
 * PVT LTD All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains the property of
 * Invicara Inc and its suppliers, if any. The intellectual and technical
 * concepts contained herein are proprietary to Invicara Inc and its suppliers
 * and may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this information
 * or reproduction of this material is strictly forbidden unless prior written
 * permission is obtained from Invicara Inc.
 */

import React, {useState, useMemo, useEffect, useRef, useCallback, useContext} from "react";
import PropTypes from "prop-types";
import _ from 'lodash'
import {EnhancedIafViewer} from "./EnhancedIafViewer";
import {
    displayCircleWithText,
    removeGraphics,
    storeRef,
    setCameraOnTop,
    disableNavCube,
    displayShaded,
    addCameraCallback,
    getNodeIdFromPkgId,
    getStoredRef, displayNoLines, removeAllGraphics, setBackgroundColor, setClientTimeout, doZoom
} from "./common/bimViewerCustom";
import {extractSpacesFromEntities} from "../../components/EntityEnabledIafViewer";
import {fetchThemableElementsMappings, selectThemableElementsMappings} from "../../redux/telemetry";
import {useDispatch, useSelector} from "react-redux";
import {addAllNodeDescendants, makeEntityTree, makeReadingsTree} from "./common/tree-makers";
import {calculateAverage, calculateRange, findRangeConfig} from "./common/calculations";
import {v4} from 'uuid';
import {IafScriptEngine} from "@dtplatform/platform-api";


function hexToRgb(hex) {
    const res = hex.match(/[a-f0-9]{2}/gi);
    return res && res.length === 3
        ? res.map(function(v) { return parseInt(v, 16) })
        : null;
}

/**
 *
 * @param pointsToDisplay - Array of current pointNames to send to viewer
 * @param collectionsWithReadings - //array [{coll,[{telItem, readings}]}]
 * @param dataPointsConfig Array of properties like pointName, dtTypes, ranges, display name, format ect.
 * @param isolatedSpaces Array of entities with "Asset Name" and "modelViewerIds"
 * @param isolatedAssets Array of entities with "Space Name" and "modelViewerIds" and array of "sensors" (related assets)
 * @param iafViewerDBMRef
 * @param restOfProps
 * @returns {JSX.Element}
 * @constructor
 */
const TelemetryIafViewer =  ({pointsToDisplay = []/*make sure to use memo*/, collectionsWithReadings = [] /*from redux*/, metricsConfig = {}/*from redux*/, isolatedSpaces = [], isolatedAssets = [],areas = [], selectedEntities, disableViewerCube, setViewerCameraOnTop, backgroundColours, isDisplayShaded, onRefCreated, ...restOfProps}) => {
let selectedLevel

    const themablePointName = "occupied";
    const peopleCountPointName = "count";

    const allCoordinates = window?.__Invicara?.iaf_telemetry_vars?.allCoordinates;
    const spaceOccupancyPrcRanges = window?.__Invicara?.iaf_telemetry_vars?.spaceOccupancyPrcRanges;
    const defaultPointsToDisplay = useState([]);
    pointsToDisplay = pointsToDisplay || defaultPointsToDisplay;

    const EMPTY_ARRAY = useMemo(()=>[],[]);

    const readingsTree = useMemo(()=>{
        let sensors = isolatedAssets || [];
        if(_.isEmpty(sensors) && isolatedSpaces && !_.isEmpty(isolatedSpaces)){
            for(const space of isolatedSpaces){
                if(space.sensors){
                    sensors = sensors.concat(space.sensors);
                }
            }
        }
        return makeReadingsTree(collectionsWithReadings,metricsConfig,sensors);
    },[collectionsWithReadings, metricsConfig, isolatedAssets,isolatedSpaces]);

    const spaceTree = useMemo(()=>{
        //if spaces don't have sensors try to map them from assets by "Space Ref"
        const spacesWithSensors = isolatedSpaces.map(space=>{
            let spaceWithSensors = space;
            if(!spaceWithSensors.sensors){
                spaceWithSensors = _.cloneDeep(space);
                const sensors = isolatedAssets.filter(a=>a.properties['Asset Location']==space["Space Name"]);
                spaceWithSensors.sensors = sensors;
            }
            return spaceWithSensors;
        });
        const treeInfo = makeEntityTree(spacesWithSensors, readingsTree, [], metricsConfig, ["__telemetry_point_name", "Space Name"]);
        //console.log("space tree",treeInfo?.tree);
        return treeInfo?.tree;
    },[isolatedSpaces, readingsTree, metricsConfig, isolatedAssets]);

    const dispatch = useDispatch()
    //map of [pointName][source_id].{themableModelViewerIds}
    const themableElements = useSelector(selectThemableElementsMappings);
    useEffect(()=>{
        dispatch(fetchThemableElementsMappings());
    },[]);

    const viewerRef = useRef();

    const onReceivedRefFromViewer = useCallback((iafViewerRef)=>{
        viewerRef.current = iafViewerRef;
        onRefCreated && onRefCreated(iafViewerRef);
    },[onRefCreated]);


    const [viewerReady, setViewerReady] = useState(false);

    useEffect(()=>{

        const sceneReadyCheck = setInterval(function() {
            const ready = true;//viewerRef.current?.current?.iafviewerRef?.current?.isSceneReady;
            const modelLoaded = viewerRef.current?.current?.iafviewerRef?.current?.state?.isModelStructureReady
            if(ready && modelLoaded){
                //console.log("Viewer scene and model is ready",viewerRef.current);
                setViewerReady(true);
                clearInterval(sceneReadyCheck);
            }
        }, 100);

        //to be safe clear interval after 5 minutes anyway, not sure if needed, but why not?
        setTimeout(function() { clearInterval(sceneReadyCheck); }, 1000*60*5);

        return () => {
            clearInterval(sceneReadyCheck);
        };
    },[setViewerReady]);


    const graphicsCleanupTracker = useRef({})

    useEffect(()=>{

        if(!viewerReady){
            //TODO: can this be async and we could miss this?
            console.warn("Waiting for Viewer  scene to be ready");
            return;
        }

// You can clear a periodic function by uncommenting:
// clearInterval(intervalId);

        storeRef(viewerRef.current.current, viewerReady);

        addCameraCallback();

        if(setViewerCameraOnTop){
            setCameraOnTop();
        }

        if(disableViewerCube){
            disableNavCube();
        }

        if(isDisplayShaded){
            displayShaded();
        }

        setClientTimeout()

        if(backgroundColours){
            const [colorTop, colorBottom] = backgroundColours;
            setBackgroundColor(colorTop, colorBottom);
        }

        //if(pointsToDisplay.includes(themablePointName)){
        //    displayNoLines();
        //}

        const uuid = v4();
        graphicsCleanupTracker.current[uuid] = {
            abort: false,
            addedGraphics: []
        }
        //console.log("viewer scene to get graphics",pointsToDisplay,getStoredRef());

        const add = async () => {
            try {
                for (const [dtType,eqMap] of _.entries(readingsTree)){
                    if(graphicsCleanupTracker.current[uuid].abort){
                        break;
                    }
                    for(const eqId of _.keys(eqMap)) {
                        //console.log("viewer eqId",eqId);
                        if(graphicsCleanupTracker.current[uuid].abort){
                            break;
                        }
                        for(const displayPointName of pointsToDisplay){
                            if(displayPointName=="occupied"){
                                //there will be no circles for this point
                                continue;
                            }
                            const displayData = eqMap[eqId][displayPointName];
                            if(!displayData){
                                continue;
                            }
                            let coordinates = undefined;
                            //console.log("viewer displayPointName",displayPointName,displayData);
                            if(graphicsCleanupTracker.current[uuid].abort){
                                break;
                            }
                            if(!displayData?.modelViewerIds || displayData?.modelViewerIds.length==0){
                                //could this be virtual sensor?
                                if(displayData?.sensor && displayData?.sensor?.properties?.['Asset Location']?.val){
                                    coordinates = allCoordinates[displayData?.sensor?.properties?.['Asset Location']?.val];
                                }
                                if(!coordinates) {
                                    continue;
                                }
                            }
                            if(displayPointName=="count"){
                                //should we center the circle?
                                const assetLocation = displayData?.sensor && displayData?.sensor?.properties?.['Asset Location']?.val;
                                const centerSensorInSpace = Array.isArray(window?.__Invicara?.iaf_telemetry_vars?.centerSensorInSpace) ? window.__Invicara.iaf_telemetry_vars.centerSensorInSpace.includes(assetLocation) : undefined;
                                if(centerSensorInSpace){
                                    coordinates = allCoordinates[assetLocation];
                                }
                            }
                            let color = "#ffffff";
                            const metricConfig = metricsConfig.find(mc=>mc.pointName==displayPointName && mc.dtTypes.includes(dtType) && mc.pointName!=themablePointName);
                            if(!metricConfig){
                                continue;
                            }
                            if(metricConfig && metricConfig.ranges){
                                let r = displayData.last
                                if(r){
                                    const range = calculateRange(r.val,metricConfig);
                                    if(range){
                                        color = range.color
                                    }
                                }
                            }

                            const val = displayData?.last?.val;
                            let places = metricConfig?.places ? metricConfig?.places : 0;
                            const displayVal = typeof val === 'number' && isFinite(val) ? val.toFixed(places) : val;

                            //UPDATE SENSOR COORDINATES (or count color) BASED ON SPACE IT BELONGS TO
                            if(spaceTree && spaceTree[displayPointName]) {
                                const sensorLocation = displayData?.sensor?.properties?.['Asset Location']?.val;
                                let countAllSensorsForSpace = 0;
                                for(const eqId of _.keys(readingsTree[dtType])) {
                                    if(readingsTree[dtType][eqId][displayPointName].sensor?.properties?.['Asset Location']?.val==sensorLocation){
                                        countAllSensorsForSpace++;
                                    }
                                }
                                let spacesForCurrentSensor = addAllNodeDescendants(spaceTree[displayPointName], []);
                                spacesForCurrentSensor = spacesForCurrentSensor.filter(s=>s['Space Name']==sensorLocation);

                                for (const space of spacesForCurrentSensor) {
                                    const spaceName = space['Space Name'];
                                    //TODO: virtual sensors won't have modelViewerIds, we will need to match based on the Asset Location
                                    let spaceHasSensor = true;
                                    if(displayData?.modelViewerIds && displayData?.modelViewerIds.length>0) {
                                        //double check that this sensor really belongs to that space
                                       spaceHasSensor = space.sensors?.find(a=>a?.modelViewerIds?.includes(displayData.modelViewerIds[0]));
                                    }
                                    const centerSensorInSpace = countAllSensorsForSpace==1;
                                    //!centerSensorInSpace && console.log("will not centerSensorInSpace due to",spaceName,countAllSensorsForSpace);
                                    if(centerSensorInSpace){
                                        if(space?.modelViewerIds){
                                            let spaceNodeId = undefined;
                                            try {
                                                spaceNodeId = getNodeIdFromPkgId(space?.modelViewerIds[0]);
                                                coordinates = await getStoredRef().iafviewerRef.current._viewer.model.getNodeRealBounding(spaceNodeId)
                                                coordinates = coordinates.center()
                                                //console.log("spaceNodeId",spaceNodeId,groupName,coordinates);
                                            } catch(e){
                                                //console.error("No nodeid for",groupName,firstSpaceForCurrentSensor);
                                            }
                                        }
                                        //special case - if we have "count" metric and we have space max availability,
                                        // we should color it based on special range
                                        if(spaceOccupancyPrcRanges && displayPointName=="count"){
                                            const maxOccupancy = Math.max(space.properties['Max Occupancy']?.val,0);
                                            if(maxOccupancy>0) {
                                                const partialValue = Math.max(0,displayVal);
                                                const prc = (/*100 * */ partialValue) / maxOccupancy;
                                                const rangeConfig = findRangeConfig(prc,spaceOccupancyPrcRanges);
                                                if(rangeConfig){
                                                    color = rangeConfig.color;
                                                }
                                            }
                                        }
                                    }
                                    if (!coordinates && centerSensorInSpace && allCoordinates[spaceName]){
                                        coordinates = allCoordinates[spaceName]
                                    }
                                }
                            }

                            const markup = {
                                pkgId: displayData.modelViewerIds[0],
                                circleRadius: "15",
                                circleColor: hexToRgb(color ? color : "#ffffff"),
                                text: displayVal ? displayVal : '',
                                textColor: hexToRgb("#000000"),
                                textSize: 12,
                                textUnder: '',//displayData.showMinMax ? `${typeof displayData.last.val === 'number' && isFinite(displayData.last.val) ? displayData.min.toFixed() : ' '} - ${typeof displayData.last.val === 'number' && isFinite(displayData.last.val) ? displayData.max.toFixed() : ' '}` : " ",
                                textUnderColor: hexToRgb("#000000"),
                                textUnderSize: 12,
                                coordinates: displayData?.last?.coordinates || coordinates
                            }
                            //console.log("adding graphics",markup);
                            if(graphicsCleanupTracker.current[uuid].abort){
                                break;
                            }
                            try {
                                const markupIds = await displayCircleWithText(markup);
                                if(!markupIds){
                                    throw Error("No markup Ids returned");
                                }
                                graphicsCleanupTracker.current[uuid].addedGraphics.push(...markupIds);
                                //console.log("added graphics",markupIds,markup);
                                if(graphicsCleanupTracker.current[uuid].abort){
                                    console.warn("removing graphics added after abort",markupIds,graphicsCleanupTracker.current[uuid].addedGraphics);
                                    removeGraphics(markupIds);
                                    //!markupIds[0] ? removeAllGraphics() : removeGraphics(markupIds); //this was removing circles while other render was already painting them
                                }
                            } catch(e){
                                console.error("Error adding graphic",markup);
                                console.error(e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            }
        };

        add().catch(console.error);

        return () => {
            //console.log("will cleanup graphics for uuid",uuid);
            graphicsCleanupTracker.current[uuid].abort = true;
            const remove = async (_uuid) => {
                const _addedGraphics = graphicsCleanupTracker.current[uuid].addedGraphics;

                try {
                    await removeGraphics(_addedGraphics);
                    //!_addedGraphics[0] ? await removeAllGraphics() : await removeGraphics(_addedGraphics);//this was removing circles while other render was already painting them
                    //console.log("removed graphics",_addedGraphics);
                } catch(e){
                    console.error("Error removing graphic",_addedGraphics);
                    console.error(e);
                }
            }


            remove(uuid).catch(console.error);
        }
    //redo graphics every time one of the below changes
    },[pointsToDisplay, readingsTree, metricsConfig, viewerRef.current?.current,viewerReady]);


    const coloredElementsInfo = useMemo(() => {

        const themableItemsToIsolate = [];
        const group = {
            "groupName": themablePointName,
            "colors": []
        };

        console.log("calculating coloredGroups");

        ///////////////////////////////////////////////////////
        //1. if we have "occupancy" or "count" as point, colour the chairs
        if((pointsToDisplay.includes(themablePointName) || pointsToDisplay.includes("count")) && themableElements?.[themablePointName]){

            const rangesMapWithColorAndGuids = {};

            for (const [dtType,eqMap] of _.entries(readingsTree)){
                for(const eqId of _.keys(eqMap)) {
                    const displayData = eqMap[eqId][themablePointName];
                    if(!displayData?.modelViewerIds || displayData?.modelViewerIds.length==0){
                        continue;
                    }
                    const guid = displayData?.last?._tsMetadata?._sourceId;
                    const themableItem = themableElements[themablePointName]?.[guid];
                    if(!themableItem){
                        continue;
                    }
                    //const themableAsset = isolatedAssets.find(a=>a?.properties['revitGuid']?.val==themableGuid);
                    //if(!themableAsset){
                    //    continue;
                    //}
                    let color = "#000000";
                    const metricConfig = metricsConfig.find(mc=>mc.pointName==themablePointName && mc.dtTypes.includes(dtType));

                    if(!metricConfig){
                        continue;
                    }
                    if(metricConfig && metricConfig.ranges){
                        themableItemsToIsolate.push({_id:'',modelViewerIds:themableItem.themableModelViewerIds})
                        let r = displayData.last
                        if(r){
                            const range = calculateRange(r.val,metricConfig);
                            if(range) {
                                color = range.color;
                                rangesMapWithColorAndGuids[range.name]=rangesMapWithColorAndGuids[range.name] || {};
                                rangesMapWithColorAndGuids[range.name].color=color;
                                rangesMapWithColorAndGuids[range.name].modelViewerIds=rangesMapWithColorAndGuids[range.name].modelViewerIds || [];
                                for(let themableId of themableItem.themableModelViewerIds){
                                    rangesMapWithColorAndGuids[range.name].modelViewerIds.push(themableId);
                                }
                            }
                        }
                    }
                }
            }

            //console.log("rangesMapWithColorAndGuids",rangesMapWithColorAndGuids);


            Object.entries(rangesMapWithColorAndGuids).forEach(([key,rangeData])=>{
                group.colors.push({
                    "color": rangeData.color,
                    "opacity": 1,
                    "elementIds": rangeData.modelViewerIds
                })
            });
        }
        const markups = [];

        const isolatedColouredSpaceModelIds = [];
        /////////////////////////////////////////////////////                                                                                                                                                                                  v
        //2. if we need to colour spaces
        //if we are showing "occupancy" point, request was to paint spaces based on the "count" point
        let augmentedPointsToDisplay = pointsToDisplay;
        const occupiedSensorPointIndex = pointsToDisplay.indexOf('occupied');
        if(occupiedSensorPointIndex !== -1){
            augmentedPointsToDisplay = augmentedPointsToDisplay.concat(['count'])
        }
        for(const pointName of augmentedPointsToDisplay){
            if(spaceTree && spaceTree[pointName]){
                const spacesToColour = spaceTree[pointName];
                for(const [groupName,value] of Object.entries(spacesToColour)){
                    const spacesInGroup = addAllNodeDescendants(value, []);
                    const modelViewerIds = (spacesInGroup||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined);
                    const sensors = (spacesInGroup||[]).reduce((acc,e) => {
                        return acc.concat(e.sensors);
                    },[]).filter(s => s !== undefined);
                    const sensorsPerDtType = sensors.reduce((map,s)=>{
                        map[s.properties.dtType.val] = map[s.properties.dtType.val] || [];
                        map[s.properties.dtType.val].push(s);
                        return map;
                    },{});
                    for(const [dtType,sensorsForAvg] of Object.entries(sensorsPerDtType)){
                        const metricConfig = metricsConfig.find(mc=>mc.pointName==pointName && mc.dtTypes.includes(dtType));
                        if(!metricConfig){
                            continue;
                        }
                        let singleVal = calculateAverage(pointName, readingsTree, sensorsForAvg, metricsConfig);
                        if(typeof singleVal?.val === 'undefined'){
                            //do not color
                            continue;
                        }
                        //special case - if we have "count" metric and we have space max availability,
                        // we should color it based on special range
                        let rangeConfig = undefined;
                        if(spaceOccupancyPrcRanges && pointName=="count"){
                            const maxOccupancy = spacesInGroup.reduce((acc,s)=>acc + s.properties['Max Occupancy']?.val ? s.properties['Max Occupancy']?.val : 0,0);
                            if(maxOccupancy>0) {
                                const partialValue = Math.max(0,singleVal?.val);
                                const prc = (/*100 * */ partialValue) / maxOccupancy;
                                rangeConfig = findRangeConfig(prc,spaceOccupancyPrcRanges)
                            }
                        }
                        if(!rangeConfig){
                            rangeConfig = calculateRange(singleVal?.val,metricConfig);
                        }
                        if(rangeConfig && rangeConfig.color){
                            if(pointName=="occupied"){
                                const markup = {
                                    pkgId: !allCoordinates[groupName] ? modelViewerIds : undefined,
                                    circleRadius: "15",
                                    circleColor: hexToRgb(rangeConfig.color ? rangeConfig.color : "#ffffff"),
                                    text: singleVal?.displayVal ? singleVal?.displayVal : '',
                                    textColor: hexToRgb("#000000"),
                                    textSize: 12,
                                    textUnder: '',//displayData.showMinMax ? `${typeof displayData.last.val === 'number' && isFinite(displayData.last.val) ? displayData.min.toFixed() : ' '} - ${typeof displayData.last.val === 'number' && isFinite(displayData.last.val) ? displayData.max.toFixed() : ' '}` : " ",
                                    textUnderColor: hexToRgb("#000000"),
                                    textUnderSize: 12,
                                    coordinates: allCoordinates[groupName]
                                }
                                markups.push(markup);
                            } else {
                                group.colors.push({
                                    "color": rangeConfig.color,
                                    "opacity": 1,
                                    "elementIds": modelViewerIds
                                })
                                isolatedColouredSpaceModelIds.push(...modelViewerIds)
                            }
                        }
                    }
                }
            }
        }



        //fix to remove default dark blue isolation highlight
        //all spaces that are not coloured will be
        isolatedSpaces.forEach(s=>{
            const modelId = s.modelViewerIds?.[0];
            if(modelId && !isolatedColouredSpaceModelIds.includes(modelId)){
                group.colors.push({
                    "color": "#ffffff",
                    "opacity": 1,
                    "elementIds": s.modelViewerIds
                })
            }
        });




        return {coloredGroups: [group], themableItemsToIsolate: themableItemsToIsolate, markups}

    },[pointsToDisplay, readingsTree, themableElements, isolatedAssets,isolatedSpaces]);


    //add extra markups related to spaces
    useEffect(()=>{
        const uuid = v4();
        graphicsCleanupTracker.current[uuid] = {
            abort: false,
            addedGraphics: []
        }

        const add = async () => {

            for (const markup of coloredElementsInfo.markups) {
                try {
                    const markupIds = await displayCircleWithText(markup);
                    if (!markupIds) {
                        throw Error("No markup Ids returned");
                    }
                    graphicsCleanupTracker.current[uuid].addedGraphics.push(...markupIds);
                    //console.log("added graphics",markupIds,markup);
                    if (graphicsCleanupTracker.current[uuid].abort) {
                        console.warn("removing graphics added after abort", markupIds, graphicsCleanupTracker.current[uuid].addedGraphics);
                        removeGraphics(markupIds);
                        //!markupIds[0] ? removeAllGraphics() : removeGraphics(markupIds); //this was removing circles while other render was already painting them
                    }
                } catch (e) {
                    console.error("Error adding graphic", markup);
                    console.error(e);
                }
            }
        }

        add().catch(console.error);

        return () => {
            //console.log("will cleanup graphics for uuid",uuid);
            graphicsCleanupTracker.current[uuid].abort = true;
            const remove = async (_uuid) => {
                const _addedGraphics = graphicsCleanupTracker.current[uuid].addedGraphics;

                try {
                    await removeGraphics(_addedGraphics);
                    //!_addedGraphics[0] ? await removeAllGraphics() : await removeGraphics(_addedGraphics);//this was removing circles while other render was already painting them
                    //console.log("removed graphics",_addedGraphics);
                } catch(e){
                    console.error("Error removing graphic",_addedGraphics);
                    console.error(e);
                }
            }


            remove(uuid).catch(console.error);
        }

    },[coloredElementsInfo.markups]);


    const prevCuttingPlane = useRef();
    useEffect(()=> {

        if (!viewerReady) {
            return;
        }

        const setCuttingPlane = async (_selectedLevel) => {

            const viewer = viewerRef?.current?.current?.iafviewerRef?.current;
            if(!viewer){
                return;
            }

            const zLevel = _selectedLevel && levels ? levels[_selectedLevel] : undefined;
            if(!zLevel){
                console.error("TelemetryViewer selectedLevel has no zLevel",_selectedLevel);
                return;
            }

            const boundingBox = viewer.getModelBoundingBox();

            /*
            let commands = viewer.commands;
            const currentCuttingPlanes = commands.getCuttingPlanes();
            console.log("TelemetryViewer setCuttingPlane currentCuttingPlanes",currentCuttingPlanes);

            let planeObj= {
                "max": {
                    "x": boundingBox.max.x,
                    "y": boundingBox.max.y,
                    "z": -4184.27321854849,//zLevel,
                },
                "min": {
                    "x": boundingBox.min.x,
                    "y": boundingBox.min.y,
                    "z": boundingBox.min.z,
                }
            }

            await commands.setCuttingPlanes(planeObj);
             */

            await viewer.iafCuttingPlanesUtils.updateCuttingPlanes(
                zLevel,
                boundingBox.min.z,
                boundingBox.min.x,
                boundingBox.min.x,
                boundingBox.min.y,
                boundingBox.min.y,
            )

            await viewer.iafCuttingPlanesUtils.showCuttingPlaneGeometry(false)
            await viewer.iafCuttingPlanesUtils.enableCuttingPlanes(true)

            prevCuttingPlane.current = zLevel;
        }

        const removeCuttingPlane = async () => {
            const viewer = viewerRef?.current?.current?.iafviewerRef?.current;
            if(!viewer){
                return;
            }

            const boundingBox = viewer.getModelBoundingBox();

            /*
            let planeObj= {
                "max": {
                    "x": boundingBox.max.x,
                    "y": boundingBox.max.y,
                    "z": boundingBox.max.z,
                },
                "min": {
                    "x": boundingBox.min.x,
                    "y": boundingBox.min.y,
                    "z": boundingBox.min.z,
                }
            }

            await viewer.commands.setCuttingPlanes(planeObj);
             */

            await viewer.iafCuttingPlanesUtils.updateCuttingPlanes(
                boundingBox.min.z,
                boundingBox.min.z,
                boundingBox.min.x,
                boundingBox.min.x,
                boundingBox.min.y,
                boundingBox.min.y,
            )
            await viewer.iafCuttingPlanesUtils.showCuttingPlaneGeometry(false)
            await viewer.iafCuttingPlanesUtils.enableCuttingPlanes(true)
            prevCuttingPlane.current = undefined;
        }

        try {
            if(selectedLevel){
                setCuttingPlane(selectedLevel);
            } else {
                if(prevCuttingPlane.current){
                    removeCuttingPlane();
                }
            }
        } catch(e){
            console.error("Update cutting planes error",e)
        }

    },[viewerReady,selectedLevel]);



    //TODO: is this really needed?
    const isolatedEntities = useMemo(()=>isolatedAssets.concat(isolatedSpaces),[isolatedAssets,isolatedSpaces]);

    return (
                <EnhancedIafViewer {...restOfProps}
                    isolatedEntities={isolatedEntities.concat(coloredElementsInfo.themableItemsToIsolate)}
                    hiddenEntities={undefined}
                    coloredGroups={coloredElementsInfo.coloredGroups}
                    selectedEntities={selectedEntities || EMPTY_ARRAY}
                    isolatedSpaces={isolatedSpaces}
                    isolatedRemainingEntities={isolatedAssets}
                    hiddenElementIds={EMPTY_ARRAY}
                    onRefCreated={onReceivedRefFromViewer}
                />
    );

}

export default TelemetryIafViewer;

