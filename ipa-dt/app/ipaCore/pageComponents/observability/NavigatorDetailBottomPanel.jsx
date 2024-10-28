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

import React, {useEffect, useState, useCallback, useMemo, useContext, useRef} from "react";
import interact from "interactjs";
import _ from 'lodash'
import clsx from "clsx";
import {Button, ButtonGroup, Tooltip} from "@material-ui/core";
import NavigatorSource from "./NavigatorSource";
import EntityDetailBottomPanel from "./EntityDetailBottomPanel";
import EntityDetailBottomPanelTitle from "./EntityDetailBottomPanelTitle";
import SystemDetailBottomPanel from "../newNavigator/SystemDetailBottomPanel";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import EntityClearSearchButton from "./EntityClearSearchButton";
import sortSystemElementIdsAsDisplayedInTree, {getElementId} from "./sortSystemElements";
import { SimpleTextReducer } from "@invicara/ipa-core/modules/IpaControls";
import {getFilteredEntitiesBy} from "@invicara/ipa-core/modules/IpaUtils";
import './NavigatorDetailBottomPanel.scss';
import withGenericComponentErrorBoundary from "./GenericComponentErrorBoundary";
import EntityClearSelectionButton from "./EntityClearSelectionButton";
import {getFilteredSystemElementEntitiesBy} from "../../redux/systems";

const NavigatorDetailBottomPanel = ({activeItemId, itemType, items, defaultSort, overrideSort,
                                     filters, getItemProperty, selectedEntitiesBySearch,
                                     itemIdAccessor = "_id",itemNameAccessor = "Entity Name", onItemSelected,

                                     onEntityChange, entitySingular, perEntityConfig, doEntityAction, systemsEnabled = false,

                                     isSearchDrawerOpen, isFilterDrawerOpen, isDataDrawerOpen, isSystemDrawerOpen,
                                     toggleSearchDrawer, toggleFilterDrawer, toggleDataDrawer, toggleSystemDrawer,
                                     searchDrawerDisabled = false, filterDrawerDisabled = false, dataDrawerDisabled = false,
                                     searchDrawerIcon, filterDrawerIcon = "fa-filter", dataDrawerIcon,
                                     closeAllSearchDrawers, onClearSearchAndFilters, onClearSelected,
                                     viewerMode, onViewerModeChanged, onReloadSearchTokenChanged,
                                     _bottomPanelState, 
                                     isolatedEntitiesBySystem, currentTab, currentEntityType, actions}) => {

    const panel = useRef();

    const [currentSort, setCurrentSort] = useState(defaultSort);
    const [newSortedItems, setNewSortedItems] = useState()

    useEffect(()=> {
        if(overrideSort && !_.isEqual(overrideSort,currentSort)){
            setCurrentSort(overrideSort);
        }
    },[overrideSort]);

    const sortedItems = useMemo(() => {
        if(viewerMode===NavigatorSource.SYSTEM) {
            const {sortedSystemElementIds} = sortSystemElementIdsAsDisplayedInTree(items, getElementId);
            return sortedSystemElementIds.map(id=>items.find(item=>getElementId(item)===id));
        } else {
            return _.orderBy(items, currentSort.valueAccessor, currentSort.order);
        }
    },[items,currentSort,viewerMode]);

    const filteredItems = useMemo(() => {
        let newSortedItems = []

        let sortedItemsCopy = _.cloneDeep(sortedItems)
        sortedItemsCopy.map((item, idx) => {
            if(item?.entityInfo?.length > 1) {
                let destructuredElementFromBundle = []
                item.entityInfo.map(i => {
                    i.critical = sortedItems[idx].critical
                    destructuredElementFromBundle.push(i)
                }) 
                newSortedItems.push(...destructuredElementFromBundle)
            } else {
                newSortedItems.push(item)
            }
            setNewSortedItems(newSortedItems)
        })
        if(_.isEmpty(filters)){
            return newSortedItems;
        }
        if(viewerMode===NavigatorSource.SYSTEM && newSortedItems.length > 0) {
            let filteredSystem = getFilteredSystemElementEntitiesBy(newSortedItems, filters);
            setNewSortedItems(filteredSystem)
            return filteredSystem
        } else {
            return getFilteredEntitiesBy(newSortedItems,filters);
        } 
    },[sortedItems,filters]);

    const getIndexOfEntity = useCallback(() => {
        if(!activeItemId){
            return 0;
        }
        const i = filteredItems.findIndex(se=>se[itemIdAccessor]==activeItemId);
        const index = i<0 ? 0 : i;
        return index;
    },[itemIdAccessor,filteredItems]);

    //these two must always be updated by setState together
    const currentIndex = getIndexOfEntity();
    const [detailedEntityObject,setDetailedEntityObject] = useState({
        detailedEntityIndex: currentIndex,
        detailedEntity: filteredItems[currentIndex]
    });

    useEffect(()=> {
        const indexOfEntity = getIndexOfEntity();
        setDetailedEntityObject({
            detailedEntityIndex: indexOfEntity,
            detailedEntity: filteredItems[indexOfEntity]
        });
    },[getIndexOfEntity]);

    useEffect(()=> {
        onItemSelected && onItemSelected(detailedEntityObject.detailedEntity, itemType);
    },[detailedEntityObject]);


    const hasPreviousSelectedEntity = useCallback(() => detailedEntityObject.detailedEntityIndex > 0, [detailedEntityObject]);
    const hasNextSelectedEntity = useCallback(() => detailedEntityObject.detailedEntityIndex > -1 && detailedEntityObject.detailedEntityIndex < newSortedItems?.length-1, [detailedEntityObject,items]);

    const _handlePreviousEntity = (_detailedEntityIndex, _hasPreviousGuard, _sortedEntities) => {
        if(_hasPreviousGuard()) {
            const newIndex = _detailedEntityIndex - 1;
            setDetailedEntityObject((prevDEO) => ({
                detailedEntityIndex: newIndex,
                detailedEntity: _sortedEntities[newIndex]
            }));
        }
    }

    const _handleNextEntity = (_detailedEntityIndex, _hasNextGuard, _sortedEntities) => {
        if(_hasNextGuard()) {
                const newIndex = _detailedEntityIndex + 1;
                setDetailedEntityObject((prevDEO)=> ({
                    detailedEntityIndex: newIndex,
                    detailedEntity: _sortedEntities[newIndex]
                }));
        }
    }

    const handlePreviousEntity = useCallback(() => _handlePreviousEntity(detailedEntityObject.detailedEntityIndex, hasPreviousSelectedEntity, newSortedItems), [detailedEntityObject, newSortedItems]);
    const handleNextEntity = useCallback(() => _handleNextEntity(detailedEntityObject.detailedEntityIndex, hasNextSelectedEntity, newSortedItems), [detailedEntityObject, newSortedItems]);

    const shouldDisplayEntityPager = useMemo(() => (detailedEntityObject.detailedEntity !== undefined && newSortedItems?.length > 1 && detailedEntityObject.detailedEntityIndex > -1),[detailedEntityObject,newSortedItems?.length]);

    const allowedToBeOpened = useMemo(() => (detailedEntityObject.detailedEntity !== undefined),[detailedEntityObject]);

    const [bottomPanelState, setBottomPanelState] = useState(_bottomPanelState);//states: default, opened, closed

    const openBottomPanel = useCallback(()=>{

        console.log("panel ref", panel.current);
                    
        Object.assign(panel.current.style, {
            height: `250px`,
        });
        
        const panelInner = panel.current.querySelector('.bottom-panel-content');
        Object.assign(panelInner.style, {
            height: `210px`,
        });
                    
        setBottomPanelState('opened')
    }, [panel.current]);
    const closeBottomPanel = useCallback(()=>{
        Object.assign(panel.current.style, {
            height: `40px`,
        });
        
        const panelInner = panel.current.querySelector('.bottom-panel-content');
        Object.assign(panelInner.style, {
            height: `0px`,
        });
        setBottomPanelState('closed')
    },[panel.current]);

    const setViewerMode = useCallback((mode)=>{
        return ()=>{
            onViewerModeChanged(mode);}
    },[]);

    const bottomPanelContentComponent = () => {
        switch (viewerMode) {
            case NavigatorSource.SYSTEM:
                return <SystemDetailBottomPanel
                    entities={detailedEntityObject?.detailedEntity?.entityInfo || [detailedEntityObject.detailedEntity]}
                    entityType={detailedEntityObject?.detailedEntity?.entityType || itemType}
                    isolatedEntitiesBySystem={isolatedEntitiesBySystem}
                    viewerMode={viewerMode}
                    NavigatorSource={NavigatorSource}
                    selectedEntitiesBySearch={selectedEntitiesBySearch}
                    currentTab={currentTab}
                />;
            case NavigatorSource.TELEMETRY:
                return <EntityDetailBottomPanel
                    entitySingular={entitySingular}
                    perEntityConfig={perEntityConfig}
                    detailedEntity={detailedEntityObject.detailedEntity}
                    selectedEntitiesBySearch={selectedEntitiesBySearch}
                    viewerMode={viewerMode}
                    NavigatorSource={NavigatorSource}
                />;
            default:
                return <EntityDetailBottomPanel
                    entitySingular={entitySingular}
                    perEntityConfig={perEntityConfig}
                    detailedEntity={detailedEntityObject.detailedEntity}
                    selectedEntitiesBySearch={selectedEntitiesBySearch}
                    viewerMode={viewerMode}
                    NavigatorSource={NavigatorSource}
                />;
        }
    }

    const bottomPanelTitleComponent = () => {
        switch (viewerMode) {
            case NavigatorSource.SEARCH:
                return <EntityDetailBottomPanelTitle
                    onEntityChange={onEntityChange}
                    perEntityConfig={perEntityConfig}
                    detailedEntity={detailedEntityObject.detailedEntity}
                    onReloadSearchTokenChanged={onReloadSearchTokenChanged}
                    currentEntityType={currentEntityType}
                    doEntityAction={doEntityAction}
                    showModal={actions.showModal}
                />;
            default:
                return null;
        }
    }

    useEffect(()=> {
        // if d && closed => keep closed
        // if d && open => keep opened
        // if d && default => keep default (this will cause opening)
        // if !d && closed => keep closed
        // if !d && open => set to default (this will cause closing)
        if(!detailedEntityObject.detailedEntity && bottomPanelState=='opened'){
            setBottomPanelState("default");
        }
        // if !d && default => keep default (this will cause closing)
    },[detailedEntityObject]);

    useEffect(() => {
        interact(panel.current).resizable({
            edges: { left: false, right: false, bottom: false, top: '.bottom-panel.open .bottom-panel-title-bar' },
            listeners: {
                move (event) {
                    let {rect} = event.rect;//The edges of the element that are being changed
                    let {deltaRect} = event.deltaRect;//The change in dimensions since the previous event
                    let {edges} = event.edges;//An object with the new dimensions of the target

                    //show deltaReact in element for debugging purposes
                    let { x, y } = event.target.dataset;
                    x = (parseFloat(x) || 0) /*+ event.deltaRect.left*/;
                    y = (parseFloat(y) || 0) + event.deltaRect.top;
                    Object.assign(event.target.dataset, { x, y });

                    //update height as we move upwards only
                    if(event.rect.height>40 /*top panel size*/){
                        Object.assign(event.target.style, {
                            //width: `${event.rect.width}px`,
                            height: `${event.rect.height}px`,
                            //transform: `translate(${x}px, ${y}px)`
                        });
                        const panelInner = event.target.querySelector('.bottom-panel-content.open');
                        Object.assign(panelInner.style, {
                            height: `${event.rect.height - 40 /*minus title bar*/}px`,
                        });
                    }
                },
                start(event){
                },
                end(event){
                }
            },
        })
    }, [panel.current])

    const buttonStyle=useMemo(()=>{return {minWidth: '0px'} },[]);

    const activateSearchMode = useCallback(() => {
        setViewerMode(NavigatorSource.SEARCH);
        toggleSearchDrawer();
    },[toggleSearchDrawer,setViewerMode]);

const isPanelOpen = detailedEntityObject.detailedEntity && (bottomPanelState=='default' || bottomPanelState=="opened");
const isPanelClosed = !detailedEntityObject.detailedEntity || bottomPanelState=='closed';

return <div ref={panel} className={clsx("bottom-panel", {
    "open" : isPanelOpen,
    "closed" : isPanelClosed
    })}>
        <div className="bottom-panel-title-bar">
            <div className="navigator-bottom-first-col-wrap right-bar">
                <span className="p-h-5">
                    <ButtonGroup size="small" variant="contained">
                        <Button title={"Enable Search Mode"} disableElevation variant="text" styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active' : viewerMode===NavigatorSource.SEARCH})} onClick={setViewerMode(NavigatorSource.SEARCH)}>Search</Button>
                        {!searchDrawerDisabled && <Button title={"Toggle Search Panel"} disableElevation styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active-secondary' : isSearchDrawerOpen})} onClick={activateSearchMode}><i className="fas fa-search"/></Button>}
                        <Button title={"Toggle Filter and Group Panel"} disableElevation styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active-secondary' : isFilterDrawerOpen})} disabled={viewerMode===NavigatorSource.SYSTEM || (viewerMode===NavigatorSource.TELEMETRY && bottomPanelState=="opened")} onClick={toggleFilterDrawer}><i className={"fas "+filterDrawerIcon}/></Button>
                        {!dataDrawerDisabled && <Button title={"Toggle List Panel"} disableElevation styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active-secondary' : isDataDrawerOpen})} disabled={viewerMode!==NavigatorSource.SEARCH} onClick={toggleDataDrawer}><i className="fas fa-list"/></Button>}
                        {!dataDrawerDisabled && <Button title={"Close All Panels"}  disableElevation styles={buttonStyle} size="small" className="GenericMatGroupButton" disabled={viewerMode!==NavigatorSource.SEARCH} onClick={closeAllSearchDrawers}><i className="fas fa-angle-double-left"/></Button>}
                    </ButtonGroup>
                </span>
                <span className="p-h-5">
                    {NavigatorSource.TELEMETRY && <EntityClearSelectionButton
                        buttonStyle={buttonStyle}
                        viewerMode={viewerMode}
                        onClearSelected={onClearSelected}
                    />}
                    {(!NavigatorSource.TELEMETRY) && <EntityClearSearchButton
                        buttonStyle={buttonStyle}
                        viewerMode={viewerMode}
                        onClearSearchAndFilters={onClearSearchAndFilters}
                    />}
                </span>
            </div>
            {systemsEnabled && 
                <div className="p-h-10">
                    <ButtonGroup size="small" variant="contained">
                        <Button disableElevation variant="text" styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active' : viewerMode===NavigatorSource.SYSTEM})} disabled={!detailedEntityObject.detailedEntity} onClick={setViewerMode(NavigatorSource.SYSTEM)}>Systems</Button>
                        <Button disableElevation styles={buttonStyle} size="small" className={clsx('GenericMatGroupButton',{'active-secondary' : isSystemDrawerOpen})} disabled={viewerMode!==NavigatorSource.SYSTEM} onClick={toggleSystemDrawer}><i className="fas fa-search"/></Button>
                    </ButtonGroup>
                </div>
            }
            <div className="bottom-panel-title">
            {detailedEntityObject.detailedEntity && (
                <React.Fragment>
                    {shouldDisplayEntityPager && <div className="bottom-panel__entity-controls">
                        <i onClick={handlePreviousEntity} className={`fas fa-angle-left arrow arrow-left ${hasPreviousSelectedEntity ? "" : "arrow-disabled"}`}/>
                        <p className="text">{detailedEntityObject.detailedEntityIndex+1} of {newSortedItems.length}</p>
                        <i onClick={handleNextEntity} className={`fas fa-angle-right arrow arrow-right ${hasNextSelectedEntity ? "" : "arrow-disabled"}`}/>
                    </div>
                    }
                    {detailedEntityObject.detailedEntity[itemNameAccessor]|| detailedEntityObject.detailedEntity['Asset Name'] || detailedEntityObject.detailedEntity[itemType+' Name']}
                    <div>{bottomPanelTitleComponent()}</div>
                </React.Fragment>
            )}
            </div>
            <div className={'navigator-bottom-icons left-barx under-toolbarx'}>
                <div className={"navigator-bottom-right-icons"}>
                    <div className="p-h-5">
                        <ButtonGroup size="small" variant="contained" >
                            {detailedEntityObject.detailedEntity && (bottomPanelState=='closed') &&
                                <Button disableElevation styles={buttonStyle} size="small" className="GenericMatGroupButton" disabled={!detailedEntityObject.detailedEntity} onClick={openBottomPanel}><Tooltip key={"icon-expand-panel"} title="Expand panel"><i className="fas fa-angle-double-up"/></Tooltip></Button>
                            }
                            {(bottomPanelState=='opened' || (detailedEntityObject.detailedEntity && bottomPanelState=='default')) &&
                                <Button disableElevation styles={buttonStyle} size="small" className="GenericMatGroupButton" disabled={!detailedEntityObject.detailedEntity} onClick={closeBottomPanel}><Tooltip key={"icon-collapse-panel"} title="Collapse panel"><i className="fas fa-angle-double-down"/></Tooltip></Button>
                            }
                        </ButtonGroup>
                    </div>
                </div>
            </div>
        </div>
        {detailedEntityObject.detailedEntity &&
            <div className={clsx("bottom-panel-content", {
                "open" : detailedEntityObject.detailedEntity && (bottomPanelState=='default' || bottomPanelState=="opened"),
                "closed" : !detailedEntityObject.detailedEntity || bottomPanelState=='closed'
            })}>
                {bottomPanelContentComponent()}
            </div>
        }
    </div>
}

export default withGenericComponentErrorBoundary(NavigatorDetailBottomPanel)