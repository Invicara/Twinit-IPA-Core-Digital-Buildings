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
import {
    EntityActionsPanel
} from "@invicara/ipa-core/modules/IpaPageComponents";
import {withGenericPageContext} from "./genericPageContext";

const EntityDetailBottomPanelTitle = ({/*props from HOC withEntityStore, HOC withEntitySearch, HOC withEntityConfig*/
                                      onEntityChange, doEntityAction, entitySingular, perEntityConfig,
                                      /*props from parent component*/
                                      detailedEntity, onReloadSearchTokenChanged, currentEntityType, showModal}) => {

    const actions = useMemo(() => {
        const onActionSuccess = (actionType, newEntity, result) => {
            onReloadSearchTokenChanged(Math.floor((Math.random() * 100) + 1));
            onEntityChange(actionType, newEntity, result);
        }
        const config = currentEntityType;
        if (config?.actions) {
            let actions = {...config.actions}
            actions.onSuccess = onActionSuccess
            actions.doEntityAction = doEntityAction
            return actions;
        }
    },[perEntityConfig[entitySingular], doEntityAction, onEntityChange, currentEntityType]);


    const context=null;// = useContext(AppContext);

    return <EntityActionsPanel
        context={context}
        showModal={showModal}
        actions={actions}
        entity={detailedEntity}
        type={perEntityConfig[entitySingular]}
        iconRenderer={icons => <div className="bottom-panel-actions">{icons}</div>}
    />
}

export default withGenericPageContext((EntityDetailBottomPanelTitle));