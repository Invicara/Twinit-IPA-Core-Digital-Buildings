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

import {
    /*withEntityConfig,*/ useSortEntities
} from "@invicara/ipa-core/modules/IpaPageComponents";
import {useDispatch, useSelector} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import _ from 'lodash'
import {EnhancedIafViewer} from "./EnhancedIafViewer";
import EntitySearchPanels from "./EntitySearchPanels";
import NavigatorSource from "./NavigatorSource";
import { extractSpacesFromEntities } from "../../components/EntityEnabledIafViewer";
import NavigatorDetailBottomPanel from "./NavigatorDetailBottomPanel";
import {GenericPageContext} from './genericPageContext'
import TelemetryIafViewer from "./TelemetryIafViewer";
import {selectFilteredPointNames, selectMetricsConfig, selectWellnessReadings, setFocusedEntity} from "../../redux/telemetry";
import {getSelectedEntities as fixedGetSelectedEntities} from "./common/entities-fixes";
import withEntitySearch from "./WithEntitySearch";
import {resetAll, setCameraPosition} from "./common/bimViewerCustom";
import "../../../client/styles/pageComponents/ObservabilityView/ObservabilityView.scss";


const ObservabilityView =  (props) => {
    const [viewerMode, setViewerMode] = useState(NavigatorSource.TELEMETRY);

    const iafViewerDBMRef = useRef();
    const onRefCreated = useCallback((refFromViewer)=>{
        iafViewerDBMRef.current = refFromViewer;
    },[]);

    const EMPTY_ARRAY = useMemo(()=>[],[]);

    const [bottomPanelFocusMode, setBottomPanelFocusMode] = useState(viewerMode == NavigatorSource.SEARCH ? true : false);

    const [reloadSearchToken,setReloadSearchToken] = useState(Math.floor((Math.random() * 100) + 1));
    const onReloadSearchTokenChanged = useCallback((token)=>setReloadSearchToken(token),[])

    const searchEntityType = useSelector(Entities.getCurrentEntityType);

    const [viewerSelectedEntitiesBySearch, setViewerSelectedEntitiesBySearch] = useState([]);
    //const [viewerSelectedEntitiesBySystems, setViewerSelectedEntitiesBySystems] = useState([]);

    const isolatedEntitiesBySearch = useSelector(Entities.getIsolatedEntities);
    const allEntitiesBySearch = useSelector(Entities.getAllCurrentEntities);
    const selectedEntitiesBySearch = useSelector(fixedGetSelectedEntities);

    const filteredPointNames = useSelector(selectFilteredPointNames);
    const collectionsWithReadings = useSelector(selectWellnessReadings);
    const metricsConfig = useSelector(selectMetricsConfig)


    const [isSearchDrawerOpen, setSearchDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [isDataDrawerOpen, setDataDrawerOpen] = useState(false);

    //REACT TO BOTTOM PANEL BUTTON CLICK - VIEWER MODE CHANGE
    const onBottomPanelFocusModeChanged = () => {
        setBottomPanelFocusMode(!bottomPanelFocusMode);
    }

    const openSearchDrawer = () => {!isSearchDrawerOpen && setSearchDrawerOpen(true)};
    const openFilterDrawer = () => {!isFilterDrawerOpen && setFilterDrawerOpen(true)};
    const openDataDrawer = () => {!isDataDrawerOpen && setDataDrawerOpen(true)};

    const toggleSearchDrawer = () => {setSearchDrawerOpen(!isSearchDrawerOpen)};
    const toggleFilterDrawer = () => {setFilterDrawerOpen(!isFilterDrawerOpen)}
    const toggleDataDrawer = () => {setDataDrawerOpen(!isDataDrawerOpen)}

    const closeAllSearchDrawers = () => {
        isDataDrawerOpen && toggleDataDrawer();
        isFilterDrawerOpen && toggleFilterDrawer();
        isSearchDrawerOpen && toggleSearchDrawer();
    }

    const clearSearchAndFilters = () => {
        isDataDrawerOpen && toggleDataDrawer();
        isFilterDrawerOpen && toggleFilterDrawer();
        props.entitiesSelected([]);
    }

    const clearSelected = () => {
        props.entitiesSelected([]);
        closeBottomPanel();
        resetAll();
    }

    const [entitiesListSort, setEntitiesListSort] = useState({});
    const onEntityListSortChange = (newSort) => {
        const entityType = searchEntityType.singular;
        setEntitiesListSort({...entitiesListSort,[entityType]:newSort})
    }

    //const initialDrawerState = useRef(true);
    const prev_allEntitiesBySearch = useRef(allEntitiesBySearch);
    const prev_entityType = useRef(searchEntityType.singular);
    useEffect(()=>{
        let shouldSearchDrawerBeOpened = isSearchDrawerOpen; //|| initialDrawerState.current;
        let shouldFilterDrawerBeOpened = isFilterDrawerOpen;
        let shouldDataDrawerBeOpened = isDataDrawerOpen;
        //if same viewer mode but entities fetched
        if(_.isEmpty(allEntitiesBySearch)){
            shouldSearchDrawerBeOpened = true;
            shouldFilterDrawerBeOpened = false;
            shouldDataDrawerBeOpened = false;
        } else if((_.isEqual(prev_entityType.current,searchEntityType.singular) && !_.isEqual(allEntitiesBySearch, prev_allEntitiesBySearch.current)) && _.isEmpty(selectedEntitiesBySearch)) {
            //if same entity fetch changed, and nothing is selected yet
            shouldSearchDrawerBeOpened = false;
            shouldDataDrawerBeOpened = true;
            shouldFilterDrawerBeOpened = true;
        } else if (NavigatorSource.TELEMETRY) {
            //do not reopen drawers if they are closed on purpose
            //shouldSearchDrawerBeOpened = false;
            //shouldDataDrawerBeOpened = true;
            //shouldFilterDrawerBeOpened = isFilterDrawerOpen;
        }
        //now set the drawers state accordingly
        if(shouldSearchDrawerBeOpened){
            openSearchDrawer();
        } else {
            isSearchDrawerOpen && toggleSearchDrawer();
        }
        if(shouldFilterDrawerBeOpened){
            openFilterDrawer();
        } else {
            isFilterDrawerOpen && toggleFilterDrawer();
        }
        if(shouldDataDrawerBeOpened){
            openDataDrawer();
        } else {
            isDataDrawerOpen && toggleDataDrawer();
        }
        //initialDrawerState.current=false;
        prev_allEntitiesBySearch.current = allEntitiesBySearch;
        prev_entityType.current = searchEntityType.singular;
    },[allEntitiesBySearch]);

    useEffect(()=>{
       console.log("selection changed: ",selectedEntitiesBySearch);
    },[selectedEntitiesBySearch]);

    useEffect(()=>{
        console.log("all entities changed: ",allEntitiesBySearch);
    },[allEntitiesBySearch]);

    const resetToTopView = () => {
        const topView = window?.__Invicara?.iaf_telemetry_vars?.topView;
        topView && setCameraPosition(topView);
    }

    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////////SYNC VIEWER////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    /*REACT TO DETAIL ENTITY FOCUSED IN SEARCH PANELS (redux selection is handled separately)*/
    const onDetailSearchEntityChanged = (detailEntity) => {
        //search panels are now focusing on this entity
    }
    const onEntitiesSelected = useCallback((entities) => {
        const currentlySelectedIds = selectedEntitiesBySearch.map(e=>e._id);
        const newIds =  entities.map(e=>e._id);
        const intersec = _.intersection(currentlySelectedIds,newIds);
        if(intersec.length!=currentlySelectedIds.length || intersec.length!=newIds.length){
            console.log("will dispatch: ",entities);
            if(entities.length==0){
                //reset to top view //TODO: move to config
                resetToTopView();
            }
            props.entitiesSelected(entities);
        }
    },[selectedEntitiesBySearch]);

    const prev_searchEntityType = useRef(undefined);
    useEffect(()=>{
        //help viewer to reset itself
        if(prev_searchEntityType.current!==searchEntityType.singular){
            //resetToTopView
            resetToTopView();
        }
        prev_searchEntityType.current = searchEntityType.singular;
    },[searchEntityType]);

    /*REACT TO ENTITY CHANGED IN BOTTOM PANEL*/
    const onBottomPanelItemChanged = (detail, detailType) => {
        //dispatch(setFocusedEntity(detail))
    }
    //////////////////////////////////////////////////////////////////////////////


    //TODO:
    const [themeColor, setThemeColor] = useState(undefined);


    /*REACT TO ENTITY CHANGED IN VIEWER*/
    const dispatch = useDispatch();
    const handleModelIdsSelectionFromViewer = viewerSelectedEntities => {
        setViewerSelectedEntitiesBySearch(viewerSelectedEntities);
    }

    const onViewerModeChanged = (newViewerMode) => {
        setViewerMode(newViewerMode);
    }

    const {isolatedSpaces: isolatedSpacesBySearch, isolatedRemainingEntities: isolatedRemainingEntitiesBySearch} = useMemo(()=>{
        const {isolatedSpaces, isolatedRemainingEntities} = extractSpacesFromEntities(isolatedEntitiesBySearch||[]);
        let sensors = isolatedRemainingEntities || [];
        if(isolatedSpaces && isolatedSpaces.length > 0 && _.isEmpty(sensors)){
            for (const space of isolatedSpaces) {
                if (space.sensors) {
                    sensors = sensors.concat(space.sensors);
                }
            }
        }
        return {isolatedSpaces, isolatedRemainingEntities: sensors};

    },[isolatedEntitiesBySearch]);

    const detailEntityBySearch = useMemo(()=>{
        if(selectedEntitiesBySearch.length>0 && detailEntityBySearch?.entityInfo?.[0]===selectedEntitiesBySearch[selectedEntitiesBySearch.length-1]){
            return detailEntityBySearch;
        }
        else if(selectedEntitiesBySearch.length>0){
            const entity = selectedEntitiesBySearch[selectedEntitiesBySearch.length-1];
            //make it compatible with bottom panel acceptable entities format
            return {...entity, entityInfo: [entity], entityType: searchEntityType.singular};
        }
        return undefined;
    },[selectedEntitiesBySearch]);

    //entity for bottom panel
    const currentBottomPanelEntity = detailEntityBySearch;
    const currentBottomPanelEntityType = currentBottomPanelEntity?.entityType || searchEntityType.singular;
    const currentBottomPanelItems = selectedEntitiesBySearch;

    const entitiesSortHook = useSortEntities(searchEntityType.singular).currentSort;
    const defaultBottomPanelSort = entitiesSortHook;
    const overrideSort = entitiesListSort[currentBottomPanelEntityType];


    const [bottomPanelState, setBottomPanelState] = useState('default');//states: default, opened, closed
    const openBottomPanel = useCallback(()=>setBottomPanelState('opened'),[]);
    const closeBottomPanel = useCallback(()=>setBottomPanelState('closed'),[]);


    //add all the properties coming from EntitySearchHOC and EntityStoreHOC
    const genericPageContext = {
        ...props,
        perEntityConfig : props.getPerEntityConfig()
    };

    const actualComponent =
        (
        <div className='navigator-view'>
            <div className='navigator-viewer'>
                <TelemetryIafViewer
                    name={'NavigatorViewer'}
                    model={props.selectedItems.selectedModel}
                    viewerResizeCanvas={true}
                    hiddenEntities={undefined}
                    selectedEntities={selectedEntitiesBySearch}
                    isolatedSpaces={isolatedSpacesBySearch}
                    isolatedAssets={isolatedRemainingEntitiesBySearch}
                    hiddenElementIds={EMPTY_ARRAY}
                    onSelect={handleModelIdsSelectionFromViewer}
                    onRefCreated={onRefCreated}
                    pointsToDisplay = {filteredPointNames}
                    collectionsWithReadings = {collectionsWithReadings || EMPTY_ARRAY}
                    metricsConfig = {metricsConfig}
                />
            </div>
            <div className='navigator-view__panels'>
                <EntitySearchPanels
                    {...props}
                    viewerMode={NavigatorSource.SEARCH}
                    viewerSelectedEntities={viewerSelectedEntitiesBySearch}
                    onDetailEntityChanged={onDetailSearchEntityChanged}
                    onEntitiesSelected={onEntitiesSelected}
                    isSearchDrawerOpen={isSearchDrawerOpen}
                    isDataDrawerOpen={isDataDrawerOpen}
                    isFilterDrawerOpen={bottomPanelState!="opened"}
                    isSearchDrawerDisabled={true}
                    isFilterDrawerDisabled={bottomPanelState=="opened"}
                    isDataDrawerDisabled={true}
                    filterDrawerIcon={"fa-chart-bar"}
                    clearSystems={_.noop}
                    onEntityListSortChange={onEntityListSortChange}
                    entitySingular={searchEntityType.singular}
                    reloadSearchToken={reloadSearchToken}
                    onReloadSearchTokenChanged={onReloadSearchTokenChanged}
                    iafViewerDBMRef={iafViewerDBMRef.current}
                    bottomPanelState={bottomPanelState}
                    setViewerSelectedEntitiesBySearch={setViewerSelectedEntitiesBySearch}
                />

                <NavigatorDetailBottomPanel
                    activeItemId={currentBottomPanelEntity?._id}
                    itemType={currentBottomPanelEntityType}
                    items={currentBottomPanelItems}

                    defaultSort={defaultBottomPanelSort}
                    overrideSort={overrideSort}
                    filters={undefined}

                    onItemSelected={onBottomPanelItemChanged}
                    onReloadSearchTokenChanged={onReloadSearchTokenChanged}

                    viewerMode={viewerMode}
                    onViewerModeChanged={onViewerModeChanged}
                    isDataDrawerOpen={isDataDrawerOpen}
                    isFilterDrawerOpen={isFilterDrawerOpen}
                    isSearchDrawerOpen={isSearchDrawerOpen}
                    toggleDataDrawer={toggleDataDrawer}
                    toggleFilterDrawer={toggleFilterDrawer}
                    toggleSearchDrawer={toggleSearchDrawer}
                    dataDrawerDisabled={true}
                    searchDrawerDisabled={true}
                    filterDrawerIcon={"fa-chart-bar"}
                    closeAllSearchDrawers={closeAllSearchDrawers}
                    onClearSearchAndFilters={clearSearchAndFilters}
                    onClearSelected={clearSelected}
                    clearSystems={_.noop}
                    _bottomPanelState={bottomPanelState}
                    openBottomPanel={openBottomPanel}
                    closeBottomPanel={closeBottomPanel}

                ></NavigatorDetailBottomPanel>


            </div>
        </div>
    );


    //looks like handler is "calculated" only when component mounts and never changes
    return <GenericPageContext.Provider value={genericPageContext}>{actualComponent}</GenericPageContext.Provider>

}

ObservabilityView.contextTypes = {
    ifefPlatform: PropTypes.object,
    ifefSnapper: PropTypes.object,
    ifefNavDirection: PropTypes.string,
    ifefShowPopover: PropTypes.func,
    ifefUpdatePopover: PropTypes.func,
    ifefUpdatePopup: PropTypes.func,
    ifefShowModal: PropTypes.func
};


export default withEntitySearch(/*withEntityConfig*/(ObservabilityView));

