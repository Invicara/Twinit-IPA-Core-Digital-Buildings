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
import PropTypes from "prop-types";

import {
    EntityDataContainer,
    EntityDataGroupContainer,
    EntitySelectionPanel,
    TreeSelectMode, EntityActionsPanel, EntityListView, useSortEntities as useSortEntities
} from "@invicara/ipa-core/modules/IpaPageComponents";
import * as IpaPageComponents from "@invicara/ipa-core/modules/IpaPageComponents";
import {
    branchNodeRendererOld as branchNodeRenderer,
    leafNodeRendererOld as leafNodeRenderer
} from "@invicara/ipa-core/modules/IpaUtils";
import SearchModelessTab from "./SearchModelessTab";
import {compose} from "redux";
import {connect} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import _ from 'lodash'
import {EnhancedIafViewer} from "./EnhancedIafViewer";
import {extractSpacesFromEntities} from "../../components/EntityEnabledIafViewer";
import {StackableDrawer} from "@invicara/ipa-core/modules/IpaControls";
import clsx from "clsx";
import { Button, Tooltip } from "@material-ui/core";
import EntityDetailBottomPanelContent from "./EntityDetailBottomPanelContent";

const EntityDetailBottomPanel = ({availableDataGroups, entityType, config, getData, loadingDataGroups, selectedEntities, entitySingular,
                                     handler, onEntityChange, onActionSuccess, doEntityAction, context,
                                     isSearchDrawerOpen, isFilterDrawerOpen, isDataDrawerOpen, isLevelDrawerOpen,
                                     toggleSearchDrawer, toggleFilterDrawer, toggleDataDrawer, toggleLevelDrawer,
                                     clearSearchAndFilters,
                                     entity, entityListSort}) => {

    const panel = useRef();

    const defaultSort = useSortEntities(entitySingular).currentSort;
    const [currentSort, setCurrentSort] = useState(defaultSort);
    const sortedEntities = useMemo(() => {
        return _.orderBy(selectedEntities, currentSort.valueAccessor, currentSort.order);
    },[selectedEntities,currentSort]);

    const getIndexOfEntity = useCallback(() => {
        if(!entity){
            return 0;
        }
        const i = sortedEntities.findIndex(se=>se._id==entity._id);
        return i<0 ? 0 : i;
    },[selectedEntities,entity]);

    const [detailedEntityIndex, setDetailedEntityIndex] = useState(getIndexOfEntity());

    const detailedEntity = sortedEntities[detailedEntityIndex];

    const filteredDataGroups = useMemo(() => availableDataGroups?.[entityType] ? Object.entries(availableDataGroups[entityType]).filter(([k, v]) => v === true).map(([k, v]) => k) : [], [availableDataGroups,entityType]);
    const [selectedDataGroup, setSelectedDataGroup] = useState(filteredDataGroups[0]);

    const hasPreviousSelectedEntity = useCallback(() => detailedEntityIndex > 0, [detailedEntityIndex]);
    const hasNextSelectedEntity = useCallback(() => detailedEntityIndex > -1 && detailedEntityIndex < selectedEntities.length-1, [detailedEntityIndex,selectedEntities.length]);

    const _handlePreviousEntity = (_detailedEntityIndex, _hasPreviousGuard) => {
        if(_hasPreviousGuard()) {
            setDetailedEntityIndex(_detailedEntityIndex - 1);
        }
    }

    const _handleNextEntity = (_detailedEntityIndex, _hasNextGuard) => {
        if(_hasNextGuard()) {
            setDetailedEntityIndex(_detailedEntityIndex + 1);
        }
    }

    const handlePreviousEntity = useCallback(() => _handlePreviousEntity(detailedEntityIndex, hasPreviousSelectedEntity), [detailedEntityIndex]);
    const handleNextEntity = useCallback(() => _handleNextEntity(detailedEntityIndex, hasNextSelectedEntity), [detailedEntityIndex, selectedEntities.length]);

    const actions = useMemo(() => {
        if (config.actions) {
            let actions = {...config.actions}
            actions.onSuccess = onActionSuccess
            actions.doEntityAction = doEntityAction
            return actions;
        }
    },[config, doEntityAction, onEntityChange]);

    const shouldDisplayEntityPager = useMemo(() => (detailedEntity !== undefined && selectedEntities?.length > 1 && detailedEntityIndex > -1),[detailedEntity,selectedEntities,detailedEntityIndex]);

    const allowedToBeOpened = useMemo(() => (detailedEntity !== undefined),[detailedEntity]);

    const [bottomPanelState, setBottomPanelState] = useState('default');//states: default, opened, closed
    //const [bottomPanelResizedY, setBottomPanelResizedY] = useState(0);

    const onSelectedGroupChanged = useCallback((dg)=>setSelectedDataGroup(dg),[]);


    const openBottomPanel = useCallback(()=>{

        console.log("panel ref", panel.current);
                    
        Object.assign(panel.current.style, {
            height: `250px`,
        });
        
        const panelInner = panel.current.querySelector('.bottom-panel-content');
        Object.assign(panelInner?.style, {
            height: `215px`,
        });
                    
        setBottomPanelState('opened')
    }, [panel.current]);
    const closeBottomPanel = useCallback(()=>{
        Object.assign(panel.current.style, {
            height: `35px`,
        });
        
        const panelInner = panel.current.querySelector('.bottom-panel-content');
        Object.assign(panelInner?.style, {
            height: `0px`,
        });
        setBottomPanelState('closed')
    },[panel.current]);

    useEffect(() =>{
        setDetailedEntityIndex(getIndexOfEntity())
    }, [filteredDataGroups])


    useEffect(()=> {
        setDetailedEntityIndex(0)
    },[sortedEntities,entity])

    useEffect(()=> {
        if(entityListSort && !_.isEqual(entityListSort,currentSort)){
            setCurrentSort(entityListSort);
        }
    },[entityListSort]);

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
                    if(event.rect.height>35 /*top panel size*/){
                        Object.assign(event.target.style, {
                            //width: `${event.rect.width}px`,
                            height: `${event.rect.height}px`,
                            //transform: `translate(${x}px, ${y}px)`
                        });
                      
                        const panelInner = event.target.querySelector('.bottom-panel-content.open');
                        Object.assign(panelInner?.style, {
                            height: `calc( ${event.rect.height}px - 35px)`,
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


    return <div ref={panel} className={clsx("bottom-panel", (bottomPanelState!='closed') && "open")}>
        <div className="bottom-panel-title-bar">
            <div className={'navigator-bottom-icons'}>
                <div className={"navigator-bottom-left-icons"}>
                    <div className={`navigator-bottom-search ${isSearchDrawerOpen ? 'selected' : 'unselected'}`}><i onClick={toggleSearchDrawer} className="fas fa-search"/></div>
                    <div className={`navigator-bottom-filter ${isFilterDrawerOpen ? 'selected' : 'unselected'}`}><i onClick={toggleFilterDrawer} className="fas fa-filter"/></div>
                    <div className={`navigator-bottom-data ${isDataDrawerOpen ? 'selected' : 'unselected'}`}><i onClick={toggleDataDrawer} className="fas fa-list"/></div>
                    <div className={`navigator-bottom-data ${isLevelDrawerOpen ? 'selected' : 'unselected'}`}><i onClick={toggleLevelDrawer} className="fas fa-layer-group"/></div>
                </div>
                <div className={"navigator-bottom-right-icons"}>
                    <div className={`navigator-bottom-reset unselected`}>
                        <Tooltip key={"icon-clear-filters"} title="Clear filters">
                            <i className="fas fa-undo" onClick={clearSearchAndFilters}/>
                        </Tooltip>
                    </div>
                </div>
            </div>
            {detailedEntity && (
                <div className="bottom-panel-title">
                    {shouldDisplayEntityPager && <div className="bottom-panel__entity-controls">
                        <i onClick={handlePreviousEntity} className={`fas fa-angle-left arrow arrow-left ${hasPreviousSelectedEntity ? "" : "arrow-disabled"}`}/>
                        <p className="text">{detailedEntityIndex+1} of {selectedEntities.length}</p>
                        <i onClick={handleNextEntity} className={`fas fa-angle-right arrow arrow-right ${hasNextSelectedEntity ? "" : "arrow-disabled"}`}/>
                    </div>
                    }
                    <div>{detailedEntity["Entity Name"]}</div>
                    <EntityActionsPanel
                        context={context}
                        actions={actions}
                        entity={detailedEntity}
                        type={handler.config.type.find(type => type.singular === entitySingular)}
                        iconRenderer={icons => <div className="bottom-panel-actions">{icons}</div>}
                    />
                    <div className={'bottom-panel__icons'}>
                        <div className={"bottom-panel__icons--right-icons"}>
                            <div>
                                {(allowedToBeOpened && bottomPanelState=='closed') &&
                                    <Tooltip key={"icon-expand-panel"} title="Expand panel">
                                        <i
                                            className={"bottom-panel__icon fas fa-arrow-up"}
                                            onClick={openBottomPanel}
                                        />
                                    </Tooltip>
                                }
                                {(bottomPanelState!='closed') &&
                                    <Tooltip key={"icon-collapse-panel"} title="Collapse panel">
                                        <i
                                            className={"bottom-panel__icon fas fa-window-minimize"}
                                            onClick={closeBottomPanel}
                                        />
                                    </Tooltip>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {detailedEntity && (
            <EntityDetailBottomPanelContent
                config={config}
                getData={getData}
                loadingDataGroups={loadingDataGroups}
                bottomPanelState={bottomPanelState}
                selectedDataGroup={selectedDataGroup}
                filteredDataGroups={filteredDataGroups}
                onSelectedGroupChanged={onSelectedGroupChanged}
                detailedEntity={detailedEntity}></EntityDetailBottomPanelContent>
        )}

    </div>
}

export default EntityDetailBottomPanel