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

import React, {useCallback, useEffect, useMemo, useState} from "react";


import Select from 'react-select';
import _ from "lodash";
import {useDispatch, useSelector} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import {
    fetchMetricsConfig,
    fetchWellnessReadingsByEntities,
    selectMetricsConfig,
    selectMetricsConfigLoadingStatus,
    selectWellnessReadings,
    selectWellnessReadingsLoadingStatus,
    telemetryActions,
    selectFilteredLevels
} from "../../redux/telemetry";
import "./TelemetrySelectionPanel.scss";
import {TelemetryTabularTree} from "./TelemetryTabularTree";
import {makeReadingsTree} from "./common/tree-makers";
import {
    getSelectedEntities as fixedGetSelectedEntities,
    getSelectedEntities,
    getSelectedEntitiesIds
} from "./common/entities-fixes";
import {withGenericPageContext} from "./genericPageContext";
import {Box} from "@material-ui/core";


const TelemetrySelectionPanel =  ({perEntityConfig,entitySingular,onGroupOrFilterChange,project,availableTreeGroups, onEntitiesExpanded, onEntitiesSelected}) => {

    const config = perEntityConfig[entitySingular];
    const showLevelsDropdown = config?.telemetry?.showLevelsDropdown;

    const dispatch = useDispatch();
    const metricsConfigArray = useSelector(selectMetricsConfig);
    const telemetrySuffixGroups = ["__telemetry_point_name","__telemetry_range_name"];
    //const [availableGroups] = useState([{name:"Space Ref", displayName: "Space"},{name:"Asset Name",displayName:"Sensor"}]);

    const [selectedGroups, setSelectedGroups] = useState([availableTreeGroups[0].displayName]);
    useEffect(()=>{
        const newSelectedGroups = selectedGroups.filter(sg=>availableTreeGroups.find(ag=>ag.displayName==sg));
        if(newSelectedGroups.length==0 && availableTreeGroups.length>0){
            newSelectedGroups.push(availableTreeGroups[0].displayName)
        }
        setSelectedGroups(newSelectedGroups);
    },[availableTreeGroups]);

    const selectedGroupsForTree = useMemo(()=> {

            let selectedGroupsForView = selectedGroups.map(sg => availableTreeGroups.find(ag => ag.displayName == sg)?.name);
            if(entitySingular=="Sensor"){
                //test another group called Asset Location
                selectedGroupsForView = ["Asset Location"].concat(selectedGroupsForView);
            }

            return telemetrySuffixGroups.concat(selectedGroupsForView);

        }
        ,[selectedGroups,availableTreeGroups,entitySingular]);

    //const groupsChanged = useCallback((groups)=>setSelectedGroups(groups),[setSelectedGroups]);
    const groupsChanged = useCallback((selectedValue)=>{
        const groups = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        setSelectedGroups(groups.map(g=>g.label))
    },[setSelectedGroups]);

    const [selectableMetricNames, setSelectableMetricNames] = useState([]);
    const [selectedMetrics, setSelectedMetrics] = useState([]);

    // useEffect(()=>{
    //     let selectedMetricConfigs = [];
    //     if(metricsConfigArray && metricsConfigArray.length>0){
    //         selectedMetricConfigs = [metricsConfigArray[0]];
    //     }
    //     setSelectedMetrics(selectedMetricConfigs.map((mc)=>{
    //         return {...mc,
    //             displayName: mc.displayName || mc.pointName,
    //             pointName: mc.pointName
    //         }
    //     }))
    // },[metricsConfigArray,setSelectedMetrics]);

    const onSelectedMetrics = useCallback((selectedValue)=>{
        const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        let selectedMetricConfigs = [];
        if(metricsConfigArray){
            selectedMetricConfigs = values.map(v=>metricsConfigArray.find(mc=>mc.displayName==v.value||mc.pointName==v.value)).filter(p=>!!p);
        }
        setSelectedMetrics(selectedMetricConfigs.map((mc)=>{
            return {...mc,
                displayName: mc.displayName || mc.pointName,
                pointName: mc.pointName
            }
        }))
    },[metricsConfigArray,setSelectedMetrics]);

    useEffect(()=>{
        dispatch(telemetryActions.setFilteredMetricConfig(selectedMetrics))
    },[selectedMetrics,metricsConfigArray]);

    const isolatedEntitiesBySearch = useSelector(Entities.getIsolatedEntities);
    const allEntitiesBySearch = useSelector(Entities.getAllCurrentEntities);
    const selectedEntitiesIds = useSelector(getSelectedEntitiesIds);


    const metricsMapLoading = useSelector(selectMetricsConfigLoadingStatus);
    const readingsLoading = useSelector(selectWellnessReadingsLoadingStatus);

    const readings = useSelector(selectWellnessReadings);
    const readingsTree = useMemo(()=>makeReadingsTree(readings, metricsConfigArray, isolatedEntitiesBySearch),[readings, metricsConfigArray, isolatedEntitiesBySearch]);

    useEffect(() => {
        dispatch(fetchMetricsConfig());
    }, []);

    useEffect(() => {
        if(!metricsConfigArray){
            return;
        }
        //based on sensors and metrics map, populate the dropdown with allowable values
        const allowedSelectableMetricNames = {};
        const _dtTypeDone = [];
        for(const entity of isolatedEntitiesBySearch){
            const sensors = entity.sensors || [entity];
            for(const sensor of sensors){
                // if(!sensor.properties.dtType?.val) {
                //     break;
                // }

                if(_dtTypeDone.includes(sensor.properties.dtType?.val)){
                    continue;
                }
                const allowed = metricsConfigArray.filter(mc=>{
                    return mc.dtTypes.includes(sensor.properties.dtType.val)
                })
                allowed.forEach(mc => {
                    if(!allowedSelectableMetricNames[mc.pointName]){
                        allowedSelectableMetricNames[mc.pointName]=mc;
                    }
                });
                _dtTypeDone.push(sensor.properties.dtType?.val);
            }
        }
        setSelectableMetricNames(_.values(allowedSelectableMetricNames).map(mc=>{return {displayName:mc.displayName||mc.pointName,pointName:mc.pointName}}));

        //update selected
        let newSelectedMetrics = selectedMetrics.filter(sm=>allowedSelectableMetricNames[sm.pointName]).filter(sm=>!!sm);
        if(newSelectedMetrics.length==0 && Object.keys(allowedSelectableMetricNames).length>0){
            //push first
            newSelectedMetrics.push(allowedSelectableMetricNames[Object.keys(allowedSelectableMetricNames)[0]]);
        }
        setSelectedMetrics(newSelectedMetrics);

    }, [metricsConfigArray, isolatedEntitiesBySearch]);

    //TODO: level is a filter, introduce redux entity filters instead of the code below

    const [selectableLevels, setSelectableLevels] = useState([]);
    const selectedLevels = useSelector(selectFilteredLevels);


    useEffect(() => {
        if(!showLevelsDropdown){
            return;
        }
        const allLevels = isolatedEntitiesBySearch.map(e => e?.properties?.Level?.val).filter(l => !!l);
        let uniqueLevels = [...new Set(allLevels)];
        //console.log("uniqueLevels",uniqueLevels,allLevels);
        setSelectableLevels(uniqueLevels);

        if(uniqueLevels.length>0 && !uniqueLevels.includes(selectedLevels[0])) {
            dispatch(telemetryActions.setFilteredLevels([uniqueLevels[0]]));
        }

    }, [isolatedEntitiesBySearch]);

    const onSelectedLevels = useCallback((selectedValue)=>{
        const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        dispatch(telemetryActions.setFilteredLevels(values.map(v=>v.value).filter(v=>!!v)));
    },[]);

    useEffect(() => {
            dispatch(fetchWellnessReadingsByEntities({entities: isolatedEntitiesBySearch, entityType: entitySingular, project: project}));
    }, [isolatedEntitiesBySearch]);

    const filteredEntities = useMemo(()=>{
        const filtered = isolatedEntitiesBySearch.filter(entity=>{
            const sensors = entity.sensors || [entity];
            let match = false;
            for (const sensor of sensors){
                //TODO: maybe change this to check for readings?
                const allowed = metricsConfigArray?.find(mc=>{
                    const metricMatch = selectedMetrics.find((sm)=>sm.pointName==mc.pointName);
                    return metricMatch && mc.dtTypes.includes(sensor?.properties?.dtType?.val)
                })
                const levelAllowed = showLevelsDropdown ? (selectedLevels && !_.isEmpty(selectedLevels) ? selectedLevels.includes(sensor?.properties?.Level?.val): true) : true;
                if(allowed && levelAllowed){
                    match = true;
                }
            }
            return match;
        });
        return filtered;
    },[isolatedEntitiesBySearch, metricsConfigArray, /*readings,*/ selectedMetrics, entitySingular, selectedLevels]);

    //_.get(this.iafViewerDBMRef, "current.iafviewerRef.current.commands");

    const selectedMetricsForReactSelect = selectedMetrics ? selectedMetrics.map((sm)=>({label: sm.displayName, value: sm.displayName})) : [];
    const selectableLevelsForReactSelect = useMemo(()=>[{label: "All", value: undefined}].concat(selectableLevels.map(l => ({label: l, value: l}))),[selectableLevels]);
    const loading = metricsMapLoading=='loading' || readingsLoading=='loading';

    if (loading || !allEntitiesBySearch || allEntitiesBySearch.length==0) {
        return (
            <div className="telemetry-tree-panel">
                <Box display="flex" p={1}>
                    {loading ? "Retrieving data" : "No data"}
                </Box>
            </div>
        )
    }

    return (
        <div className="telemetry-tree-panel">
            {showLevelsDropdown &&
                <div className={"telemetry-tree-panel__levels"}>
                    <span className="title">Level</span>
                    <Select key={"telemetry_levels"}
                            value={selectedLevels && selectedLevels.map((l) => ({label: l || "All", value: l}))}
                            isMulti={false}
                            onChange={selected => onSelectedLevels(selected)}
                            options={selectableLevelsForReactSelect}
                            className="simple-select-element"
                            closeMenuOnSelect={true}
                            placeholder={"Select Level"}
                            isClearable={false}
                            isDisabled={false}
                    />
                </div>
            }

            <div className={"telemetry-tree-panel__category"}>
                <span className="title">Category</span>
                <Select key={"telemetry_category"}
                    value={selectedMetricsForReactSelect}
                    isMulti={false}
                    onChange={selected => onSelectedMetrics(selected)}
                    options={selectableMetricNames.map((n)=>n.displayName).map(s =>  ({label: s, value: s}))}
                    className="simple-select-element"
                    closeMenuOnSelect={true}
                    placeholder={"Select Category"}
                    isClearable={false}
                    isDisabled={false}
                />
            </div>

            {availableTreeGroups && availableTreeGroups.length>1 && <div className={"telemetry-tree-panel__group"}>
                <label className="title">Group By</label>
                {/*
                <GroupControl className="entity-group"
                              entitySingular={entitySingular}
                              styles={GROUP_SELECT_STYLES}
                              groups={availableTreeGroups.map(g=>g.displayName)}
                              selected={selectedGroups}
                              onChange={groupsChanged} />

                */}
                <Select key={"telemetry_group_"+entitySingular}
                    value={selectedGroups && selectedGroups.map((g)=>({label: g, value: g}))[0]}
                    isMulti={false}
                    onChange={selected => groupsChanged(selected)}
                    options={availableTreeGroups.map((n)=>n.displayName).map(s =>  ({label: s, value: s}))}
                    className="simple-select-element"
                    closeMenuOnSelect={true}
                    placeholder={"Select Group"}
                    isClearable={false}
                    isDisabled={false}
                />
            </div>}
            <TelemetryTabularTree
                filteredEntities={filteredEntities}
                metricsConfigArray={metricsConfigArray}
                selectedGroups={selectedGroupsForTree}
                readingsTree={readingsTree}
                filteredMetrics={selectedMetrics}
                onSelectedMetrics={onSelectedMetrics}
                entitySingular={entitySingular}
                setSelectedGroups={setSelectedGroups}
                onEntitiesExpanded={onEntitiesExpanded}
                onEntitiesSelected={onEntitiesSelected}></TelemetryTabularTree>
        </div>
    )

}

export default withGenericPageContext(TelemetrySelectionPanel);
