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
import PropTypes from "prop-types";
import {
    branchNodeRendererOld as branchNodeRenderer,
    leafNodeRendererOld as leafNodeRenderer
} from "@invicara/ipa-core/modules/IpaUtils";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import _ from 'lodash'
import {StackableDrawerContainer, StackableDrawer} from "@invicara/ipa-core/modules/IpaDialogs";
import {SimpleSelect} from "@invicara/ipa-core/modules/IpaControls";
import EntityDetailBottomPanel from "./EntityDetailBottomPanel";
import NavigatorSource from "../observability/NavigatorSource";
import {EnhancedFetchControl, GroupAndFilterControl, ReactiveTreeControl} from "@invicara/ipa-core/modules/IpaControls";
import {useNodeIndexFromGroupAndFilter} from "../systems/reactive-tree-control/useNodeIndexFromGroupAndFilter";
import {
    setIsolatedSystemElementEntities,
} from "../../redux/systems";
import {Divider, List, ListItem, ListItemText} from "@material-ui/core";
import * as Systems from "../../redux/systems";
import {SystemsListTree} from "./SystemsListTree";
import SystemAlertsList from "./SystemAlertsList";
import Switch from "@material-ui/core/Switch/Switch";
import {withGenericPageContext} from "@invicara/ipa-core/modules/IpaPageComponents";
import withGenericErrorBoundary from "../../components/GenericErrorBoundary";

const SystemSearchPanel = ({rootEntity, rootEntityType, viewerMode, isSystemDrawerOpen, onSystemChanged, bottomPanelFocusMode, onBottomPanelFocusModeChanged, handler, multipleSystemsSelected}) => {


    const dispatch = useDispatch();

    //before start make sure we have all the scripts set
    handler?.config?.panels?.Systems && dispatch(Systems.updateConfig(handler?.config?.panels?.Systems));

    const loadingStatus = useSelector(Systems.selectSystemsLoadingStatus);
    const selectedEntitiesBySystem = useSelector(Systems.selectedSystemElementEntities);

    const systems = useSelector(Systems.selectSystemEntitiesMap);
    const isEntityTypeSystem = rootEntity.entityType === "System"
    const systemNameOptions = useMemo(()=> isEntityTypeSystem ? Object.values(multipleSystemsSelected).map(s=>s['System Name']) : Object.values(systems).map(s=>s['System Name']),[systems])

    const [system, setSystem] = useState(undefined);

    const [selectedSystemName, setSelectedSystemName] = useState(system ? system['System Name'] : undefined);
    const onSelectedSystemNameChanged = useCallback((systemName)=>setSelectedSystemName(systemName),[]);

    const onSelectedSystemElements = useCallback((selected, changed)=>{
        if(!_.isEmpty(changed)) {
            dispatch(Systems.setSelectedSystemElementEntitiesFromIds(selected, changed));
            //dispatch(Systems.setFocusedSystemElementEntity(undefined));
        }
    },[]);


    useEffect(() => {
        dispatch(Systems.fetchByEntityTypeAndId({entityInfo: rootEntity.entityInfo || rootEntity, entityType : rootEntityType}))
    }, [dispatch, rootEntity, rootEntityType]);

    useEffect(() => {
        if(!systems){
            if(system) setSystem(undefined);
            return;
        }
        let newSystem;
        if(selectedSystemName) {
            newSystem = isEntityTypeSystem ? Object.values(multipleSystemsSelected).find(s => s['System Name'] == selectedSystemName) : Object.values(systems).find(s => s['System Name'] == selectedSystemName)
        }
        if(!newSystem) {
            newSystem = isEntityTypeSystem ? Object.values(multipleSystemsSelected)[0] : Object.values(systems)[0] 
        }
        if(newSystem!==system) {
            setSystem(newSystem);
        }
    }, [systems,selectedSystemName]);

    useEffect(() => {
        if(system && selectedSystemName!=system['System Name']){
            setSelectedSystemName(system['System Name']);
        }
        const isolation = system ? system.elements : [];
        dispatch(setIsolatedSystemElementEntities(isolation));
        //initially select all elements that correspond to rootEntity model ids
        const selection = isolation.filter(e=>_.intersection(e.modelViewerIds, rootEntity.modelViewerIds).length>0);
        dispatch(Systems.setSelectedSystemElementEntities(selection));
        onSystemChanged && onSystemChanged(system)
    }, [system]);

    useEffect(() => {
        dispatch(Systems.fetchAlertsBySystem({system}));
    }, [system]);




    const getEntityName = (rootEntity, rootEntityType) => {
        if(rootEntity.entityInfo){
            return rootEntity.entityInfo[rootEntityType+' Name'] || rootEntity.entityInfo['Entity Name'];
        }
        return rootEntity[rootEntityType+' Name'] || rootEntity['Entity Name'];
    }

    return <div>
        <div className={'general-title'}>{getEntityName(rootEntity, rootEntityType)}<br/>Systems</div>

        {loadingStatus == 'loading' ? <p className="p-h-10">Loading systems...</p> :

            (<div>
                <SimpleSelect
                    className={'entity-select'}
                    placeholder={`Select System to View`}
                    options={systemNameOptions}
                    handleChange={onSelectedSystemNameChanged}
                    value={selectedSystemName}
                />
                <Divider />
                {system && <SystemAlertsList system={system}/>}
                {system && <SystemsListTree system={system} title="Test" selectedElements={selectedEntitiesBySystem} onSelect={onSelectedSystemElements} onBottomPanelFocusModeChanged={onBottomPanelFocusModeChanged} bottomPanelFocusMode={bottomPanelFocusMode}/>}
            </div>)
        }
    </div>
}

export default withGenericErrorBoundary(withGenericPageContext(SystemSearchPanel));

