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

import React from "react"
import PropTypes from "prop-types"

import NavigatorModeless from "./NavigatorModeless";
import {
    EntityDataStack,
    EntitySelectionPanel,
    TreeSelectMode,
    withEntityAvailableGroups,
    withEntitySearch
} from "@invicara/ipa-core/modules/IpaPageComponents";
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
import { extractSpacesFromEntities } from "../../components/EntityEnabledIafViewer";


class NavigatorView extends React.Component {
    constructor(props) {
        super(props);
    }

    async componentDidMount() {
        //When the page mounts load the async data (script and other)
        //and then create the column info for the upload table
        this.setState({isPageLoading: true});
        this.props.setViewerSyncOn()
        this.setState({isPageLoading: false});
    }

    handleEntityIndexChange = (event, newIndex) => {
        this.props.clearEntities()
        this.props.updateEntityType(_.values(this.props.getPerEntityConfig())[newIndex])
    }

    handleEntityChange = (event, newEntityType) => {
        //this.props.clearEntities()
        this.props.updateEntityType(this.props.getPerEntityConfig()[newEntityType]);
    }

    getCurrentEntity = () => this.props.entitySingular;

    getCurrentEntityIndex = () => this.props.handler.config.type.findIndex(t => t.singular === this.getCurrentEntity());

    getCurrentEntityConfig = () => this.props.getPerEntityConfig()[this.getCurrentEntity()];

    getDetailEntityInstance = () => (this.props.selectedEntities && this.props.selectedEntities[0]);

    getDataGroups() {
        const dataGroups = this.props.availableDataGroups?.[this.getCurrentEntity()]
        return dataGroups ? Object.entries(dataGroups).filter(([k, v]) => v === true).map(([k, v]) => k) : []
    }

    getQueryParams = () => this.props.queryParams.entityType === this.getCurrentEntity() ? this.props.queryParams : null;

    render() {

        const {isolatedSpaces, isolatedRemainingEntities} = extractSpacesFromEntities(this.props.isolatedEntities)
        
        const isolatedElementIds = isolatedRemainingEntities
            .map(e => e.modelViewerIds[0])

        const spaceElementIds = isolatedSpaces
            .map(e => e.modelViewerIds[0])

        const sliceElementIds = this.props.isolatedEntities
        .map(e => e.modelViewerIds[0])
        .filter(e => e !== undefined)

        const config = this.getCurrentEntityConfig();
        const nonGroupableProps = config?.entitySelectionPanel?.nonGroupableProperties || [];
        const nonFilterableProps = config?.entitySelectionPanel?.nonFilterableProperties || [];
        const defaultGroups = config?.entitySelectionPanel?.defaultGroups || [];

        return (
            <div>
               <EnhancedIafViewer
                   name={'NavigatorViewer'}
                   model={this.props.selectedItems.selectedModel}
                   viewerResizeCanvas={true}
                   isolatedElementIds={isolatedElementIds}
                   sliceElementIds={sliceElementIds}
                   isolatedEntities={this.props.isolatedEntities}
                   spaceElementIds={spaceElementIds}
                   highlightedElementIds={
                       this.props.selectedEntities.map(e => e.modelViewerIds[0])
                   }
                   onSelect={
                       modelEntities => this.props.selectEntitiesFromModels(modelEntities)
                   }
                />
                {this.getCurrentEntity() &&
                <NavigatorModeless onModelReset={() => this.props.clearEntities()}
                                   isolatedEntities={this.props.isolatedEntities}
                                   isFetching={this.props.fetching}
                                   isSelectingEntity={this.props.isSelectingEntity}
                                   searchTab={<SearchModelessTab
                                       config={this.props.getPerEntityConfig()} fetch={this.props.getFetcher}
                                       queryParamsPerEntityType={this.props.queryParamsPerEntityType}
                                       currentTab={this.props.entitySingular}
                                       handleTabChange={this.handleEntityChange}
                                   />}
                                   treeComponent={<EntitySelectionPanel
                                       selectedGroups={this.props.groups}
                                       selectedFilters={this.props.appliedFilters}
                                       selectedEntities={this.props.selectedEntities}
                                       fetching={this.props.fetching}
                                       entities={this.props.allEntities}
                                       onGroupOrFilterChange={this.props.onGroupOrFilterChange}
                                       leafNodeRenderer={leafNodeRenderer}
                                       branchNodeRenderer={branchNodeRenderer}
                                       name={this.props.entitySingular + "_selection_panel"}
                                       onSelect={this.props.entitiesSelected}
                                       treeSelectMode={TreeSelectMode.NONE_MEANS_NONE}
                                       entitySingular={this.props.entitySingular}
                                       entityPlural={this.props.entityPlural}
                                       nonFilterableProperties={nonFilterableProps}
                                       nonGroupableProperties={nonGroupableProps}
                                       defaultGroups={defaultGroups}
                                   />}
                                   detailComponent={this.getDetailEntityInstance() && this.getCurrentEntityConfig() &&
                                   <div className="entity-nav-detail-panel">
                                       <h1>{this.getDetailEntityInstance()["Entity Name"]}</h1>
                                       <EntityDataStack
                                           config={this.getCurrentEntityConfig().data}
                                           entity={this.getDetailEntityInstance()}
                                           dataGroups={this.getDataGroups()}
                                           collapsable={true}
                                           getData={this.props.getEntityExtendedData(this.getCurrentEntityConfig().data)}
                                       /></div>}
                />
                }</div>
        )
    }
}

NavigatorView.contextTypes = {
    ifefPlatform: PropTypes.object,
    ifefSnapper: PropTypes.object,
    ifefNavDirection: PropTypes.string,
    ifefShowPopover: PropTypes.func,
    ifefUpdatePopover: PropTypes.func,
    ifefUpdatePopup: PropTypes.func,
    ifefShowModal: PropTypes.func
};

const {
    clearEntities,
    getAllCurrentEntities, getAppliedFilters,
    getFetchingCurrent, isSelectingEntities,
    setEntities,
    setViewerSyncOn, getIsolatedEntities, getSelectedEntities, getCurrentEntityType,
    selectEntitiesFromModels
} = Entities;

const mapStateToProps = state => ({
    allEntities: getAllCurrentEntities(state),
    fetching: getFetchingCurrent(state),
    isSelectingEntity: isSelectingEntities(state),
    appliedFilters: getAppliedFilters(state),
    isolatedEntities: getIsolatedEntities(state),
    selectedEntities: getSelectedEntities(state),
    currentEntityType: getCurrentEntityType(state),
});

const mapDispatchToProps = {
    setViewerSyncOn, setEntities, clearEntities, selectEntitiesFromModels
}

export default compose(
    withEntitySearch,
    withEntityAvailableGroups,
    connect(mapStateToProps, mapDispatchToProps),
)(NavigatorView)

