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
    EntityDataContainer,
    EntityDataGroupContainer
} from "@invicara/ipa-core/modules/IpaPageComponents";
import _ from 'lodash'
import clsx from "clsx";

const EntityDetailBottomPanelContent = ({config, getData, loadingDataGroups, bottomPanelState, detailedEntity, filteredDataGroups, selectedDataGroup: focusedGroup, onSelectedGroupChanged}) => {

    //if selected group comes from different entity, make sure it's disregarded and using a default
    const selectedDataGroup = filteredDataGroups.indexOf(focusedGroup)>-1 ? focusedGroup : filteredDataGroups[0];
    const groupConfig = _.get(config, `data[${selectedDataGroup}]`);

    const {data,error,fetching} = EntityDataContainer.useEntityData(false, false, detailedEntity, groupConfig, getData, selectedDataGroup);

    return <div className={clsx("bottom-panel-content", (bottomPanelState!='closed') && "open")}>
        <div className="bottom-panel-content-left">
            {!loadingDataGroups && filteredDataGroups.map(dg =>
                <div
                    className={`bottom-panel__data-group-tab ${dg === selectedDataGroup && 'selected'}`}
                    onClick={() => {
                        onSelectedGroupChanged(dg)
                    }}
                    key={dg}
                >
                    {dg}
                </div>
            )}
        </div>
        <div className="bottom-panel-content-right">
            <div className="bottom-panel-data-group-title">{selectedDataGroup}</div>

            {!loadingDataGroups && config && error &&
                <div>
                    <p>An unexpected error happened, please try again later.</p>
                </div>
            }
            {!loadingDataGroups && config && !error &&
                <EntityDataGroupContainer.default
                    config={groupConfig}
                    collapsable={false}
                    data={data}
                    fetching={fetching}
                />
            }
        </div>
    </div>
}

export default EntityDetailBottomPanelContent