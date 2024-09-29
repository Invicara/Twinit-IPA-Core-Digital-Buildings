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
    EntitySelectionPanel,
    TreeSelectMode,
    withEntitySearch, EntityListView
} from "@invicara/ipa-core/modules/IpaPageComponents";
import {
    branchNodeRendererOld as branchNodeRenderer,
    leafNodeRendererOld as leafNodeRenderer
} from "@invicara/ipa-core/modules/IpaUtils";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";
import _ from 'lodash'
import {StackableDrawerContainer, StackableDrawer} from "@invicara/ipa-core/modules/IpaDialogs";
import {AlertIndicator, SimpleSelect} from "@invicara/ipa-core/modules/IpaControls";
import EntityDetailBottomPanel from "./EntityDetailBottomPanel";
import NavigatorSource from "../observability/NavigatorSource";
import {EnhancedFetchControl, GroupAndFilterControl, ReactiveTreeControl} from "@invicara/ipa-core/modules/IpaControls";
import {useNodeIndexFromGroupAndFilter} from "../systems/reactive-tree-control/useNodeIndexFromGroupAndFilter";
import {
    setIsolatedSystemElementEntities,
} from "../redux/systems";
import {Divider, List, ListItem, ListItemText} from "@material-ui/core";
import * as Systems from "../redux/systems";
import {SystemsListTree} from "./SystemsListTree";

const SystemAlertsList = ({system}) => {

    const alertsLoadingStatus = useSelector(Systems.selectSystemsAlertsLoadingStatus);
    const alerts = useSelector(Systems.selectSystemsAlerts);

    const isolatedAlerts = useMemo(()=>{
        let uniqueAlertsMap = {};
        for (const [entityType, alertsPerEntity] of Object.entries(alerts || {})) {
            for (const [entityId, alertsArray] of Object.entries(alertsPerEntity)) {
                alertsArray.forEach(alert=>{
                    if(!uniqueAlertsMap[alert._id]){
                        uniqueAlertsMap[alert._id] = alert;
                    }
                });
            }
        }
        return uniqueAlertsMap;
    },[alerts]);

    return <div className="p-h-10 p-v-10">
        {alertsLoadingStatus == 'loading' ? <span><i className="fas fa-spinner fa-spin"></i> Loading alerts...</span> :
        (<div>
            {!_.isEmpty(isolatedAlerts) ? <span><AlertIndicator classNames={"alert-indicator-danger"} descriptions={_.values(isolatedAlerts).map(alert=>alert?.properties?.Description?.val).filter(d=>!!d)}></AlertIndicator>Found {_.keys(isolatedAlerts).length} alerts.</span> : <span>No alerts found</span>}
        </div>)}
        </div>
}

export default SystemAlertsList

