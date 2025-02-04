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

import React, {useState, useEffect} from "react";
import PropTypes from "prop-types";
import {StackableDrawerContainer, StackableDrawer} from "@invicara/ipa-core/modules/IpaDialogs";
import NavigatorSource from "../observability/NavigatorSource";
import SystemSearchPanel from "./SystemSearchPanel";
import {useSelector} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";

const SystemSearchPanels = (props) => {
    const [multipleSystemsSelected, setMultipleSystemsSelected] = useState()
    const selectedEntitiesBySearch = useSelector(Entities.getSelectedEntities)

    useEffect(() => {
        let newSystemObj = {}
        selectedEntitiesBySearch.map((system) => {
            newSystemObj[system._id] = {...system}
        })
        setMultipleSystemsSelected(newSystemObj)
    }, []);

    return <StackableDrawerContainer anchor="left" className={"systems-drawer"}>
        <StackableDrawer minWidth={200} anchor={'left'} level={1} defaultOpen={false} isDrawerOpen={props.viewerMode===NavigatorSource.SYSTEM && props.isSystemDrawerOpen} tooltip={"Systems"}>
            <div className="modless-search-tab" style={{padding:'0px 15px'}}>
                <div className='fetch-container'>
                {props.rootEntity && multipleSystemsSelected ? <SystemSearchPanel {...props} multipleSystemsSelected={multipleSystemsSelected}/> : <p className="p-h-10">Select Entity First</p>}
                </div>
            </div>
        </StackableDrawer>
    </StackableDrawerContainer>
}

export default SystemSearchPanels;

