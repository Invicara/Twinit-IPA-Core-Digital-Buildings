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

import React from "react";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";

import NavigatorSource from "./NavigatorSource";
import {useDispatch, useSelector} from "react-redux";
import {Button, ButtonGroup} from "@material-ui/core";
import {withGenericPageContext} from "./genericPageContext";
import {getSelectedEntities as fixedGetSelectedEntities} from "./common/entities-fixes";

const EntityClearSearchButton = ({buttonStyle, viewerMode, onClearSelected}) => {

    const selectedEntitiesBySearch = useSelector(fixedGetSelectedEntities);
    const dispatch = useDispatch();

    const clear = () => {
        // If this button is used with the Navigator, we want to clear the entities.
        // If this button is used with the IEQDashboard, we do not want to clear the entities.
        if(viewerMode !== NavigatorSource.TELEMETRY) dispatch(Entities.clearEntities([]));
        onClearSelected();
    }


    return <ButtonGroup size="small" variant="contained" >
        <Button title={"Clear"}  disableElevation styles={buttonStyle} size="small" className="GenericMatGroupButton" disabled={_.isEmpty(selectedEntitiesBySearch)} onClick={clear}><i className="fas fa-eraser"/></Button>
    </ButtonGroup>
}

export default withGenericPageContext((EntityClearSearchButton));