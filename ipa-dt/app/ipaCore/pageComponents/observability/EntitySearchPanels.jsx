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
import PropTypes from "prop-types";

import {
    EntitySelectionPanel,
    TreeSelectMode, EntityListView
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
import {StackableDrawerContainer, StackableDrawer} from "@invicara/ipa-core/modules/IpaDialogs";
import NavigatorSource from "./NavigatorSource";
import {withGenericPageContext} from "./genericPageContext";
import TelemetrySelectionPanel from "./TelemetrySelectionPanel";
import {getSelectedEntities as fixedGetSelectedEntities} from "./common/entities-fixes";
import FetchEntityDropdown from "./FetchEntityDropdown";
import clsx from "clsx";

//TODO: add dispatcher instead of this.props.onDetailEntityChanged
class EntitySearchPanels extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isPageLoading: true
        }
    }

    async componentDidMount() {
        //When the page mounts load the async data (script and other)
        //and then create the column info for the upload table
        //this.setState({isPageLoading: true});
        this.props.setViewerSyncOn()
        this.setState({isPageLoading: false});
    }

    handleEntityChange = (event, newEntityType) => {
        this.props.setViewerSelectedEntitiesBySearch([])
        //this.props.clearEntities()
        this.props.updateEntityType(this.props.getPerEntityConfig()[newEntityType]);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //if we caught new entities clicked on the navigator, force selections to update
        if(this.props.viewerMode!==NavigatorSource.SYSTEM && (this.props.viewerSelectedEntities !== prevProps.viewerSelectedEntities)){
            this.handleEntitySelectionFromViewer(this.props.viewerSelectedEntities);
        }
    }

    getCurrentEntityConfig = () => {
        return this.props.getPerEntityConfig()[this.props.entitySingular] || this.props.perEntityConfig[this.props.entitySingular];
    }

    tableEntities = () => {
        // This is for when a user is selecting an entity through the search panels.
        if (this.props.filteredBySearchEntityIds.length > 0) {
            return this.props.allEntities.filter(entity => this.props.filteredBySearchEntityIds.includes(entity._id))
        } else {
        // This is for when a user selects an entity directly from the model.
            return _.isEmpty(this.props.isolatedEntities) ? this.props.allEntities : this.props.isolatedEntities;
        }
    }
      
    actionSuccess = (actionType, newEntity, result) => {
        this.props.onReloadSearchTokenChanged(Math.floor((Math.random() * 100) + 1));
        this.props.onEntityChange(actionType, newEntity, result);
    }

    getTableActions = () => {
        let actions = this.getCurrentEntityConfig()?.actions
        if (!_.isObject(actions)) {
            return undefined;
        }
        return {...actions, onSuccess: this.actionSuccess, doEntityAction: this.props.doEntityAction};
    }

    handleEntityFilterSelection = (entities) => {
        let updatedEntities = entities.map(e => ({...e, checked: true}))
        this.handleEntitySelection(updatedEntities)
        this.props.setIsolatedEntities(entities);
    }

    handleEntitySelection = (entities) => {
        const previouslySelected = this.props.selectedEntities;
        const checkedEntities = entities.filter(e => e.checked);
        let unchecked = previouslySelected.filter(e => !checkedEntities.includes(e));
        let checked = checkedEntities.filter(e => !previouslySelected.includes(e));
        if((unchecked.length>0) || (checked.length>0)) {
            //select or deselect
            this.props.onDetailEntityChanged(checked.length>1 ? checked[checked.length-1] : checked[0]);
        }
        this.props.setSelectedEntities(checkedEntities);
    }

    handleEntitySelectionOnDetail = (entity) => {
        const clickedEntity = {...entity,checked: !entity.checked};
        let unchecked = !clickedEntity.checked ? [clickedEntity] : [];
        let checked = unchecked.length>0 ? [] : [clickedEntity];
        if(clickedEntity.checked){
            //select
            this.props.onDetailEntityChanged(clickedEntity);
            this.props.setSelectedEntities(this.props.selectedEntities.concat([clickedEntity]));
        } else {
            //deselect
            const checkedEntities = this.props.selectedEntities.filter((e)=>e._id!==clickedEntity._id);
            this.props.onDetailEntityChanged(checkedEntities.length>0 ? checkedEntities[checkedEntities.length-1] : undefined);
            this.props.setSelectedEntities(checkedEntities);
        }
    }

    handleEntitySelectionFromViewer = viewerSelectedArrayOfIds => {
        this.props.selectEntitiesFromModels(viewerSelectedArrayOfIds);
        const mockEmptyEntities = viewerSelectedArrayOfIds.map(o=>{_id: o.id});
        //TODO: set new detail entity after the component updates?
        this.props.onDetailEntityChanged(mockEmptyEntities.length>0 ? mockEmptyEntities[mockEmptyEntities.length-1] : undefined);
    }

    onTelemetryGroupOrFilterChange = (change) => {
        this.props.onGroupOrFilterChange(change);
    }

    filteredEntities = () => this.props.selectedEntities.filter(obj1 => this.props.isolatedEntities.some(obj2 => obj1.id === obj2.id));

    render() {

        const config = this.getCurrentEntityConfig();

        const nonGroupableProps = config?.entitySelectionPanel?.nonGroupableProperties || [];
        const nonFilterableProps = config?.entitySelectionPanel?.nonFilterableProperties || [];
        const defaultGroups = config?.entitySelectionPanel?.defaultGroups || [];

        const availableGroups = this.props.entitySingular=="Sensor" ? [{name:"Asset Name",displayName:"Sensor"}] : [{name:"Space Name", displayName: "Space"}]

        return (
            <React.Fragment>
                <div className='navigator-view__drawers'>
                    {!this.props.isSearchDrawerDisabled && <div className='navigator-drawer-container'>
                        <div className='navigator-drawer-title-bar'>
                            <i className={"fas fa-search"}></i>
                        </div>
                        <StackableDrawer level={1} defaultOpen={false}
                                         isDrawerOpen={this.props.viewerMode === NavigatorSource.SEARCH && this.props.isSearchDrawerOpen}>
                            <div className='navigator-drawer-content'>
                                <SearchModelessTab
                                    config={this.props.perEntityConfig}
                                    fetch={this.props.getFetcher}
                                    /*queryParams={this.getQueryParams()}*/
                                    queryParamsPerEntityType={this.props.queryParams || this.props.queryParamsPerEntityType}
                                    currentTab={this.props.entitySingular}
                                    handleTabChange={this.handleEntityChange}
                                    reloadToken={this.props.reloadSearchToken}
                                    setViewerSelectedEntitiesBySearch={this.props.setViewerSelectedEntitiesBySearch}
                                />
                            </div>
                        </StackableDrawer>
                    </div>
                    }
                    {true && <div className={clsx('navigator-drawer-container', {'hidden' : this.props.isFilterDrawerDisabled})}>
                        <div className='navigator-drawer-title-bar'>
                            <i className={"fas " + (this.props.filterDrawerIcon ? this.props.filterDrawerIcon : "fa-filter")}></i>
                        </div>
                        <StackableDrawer level={3}
                                         defaultOpen={this.props.viewerMode == NavigatorSource.TELEMETRY ? true : false}
                                         isDrawerOpen={(this.props.viewerMode === NavigatorSource.SEARCH && this.props.isFilterDrawerOpen) || (this.props.viewerMode == NavigatorSource.TELEMETRY && this.props.bottomPanelState!="opened")}>
                            {!this.props.systemViewerEnabled ? 
                                <div className='navigator-drawer-content'>
                                
                                    <FetchEntityDropdown
                                        perEntityConfig={this.props.perEntityConfig}
                                        entitySingular={this.props.entitySingular}
                                        getFetcher={this.props.getFetcher}
                                        handleTabChange={this.handleEntityChange}
                                        reloadToken={this.props.reloadSearchToken}
                                        handler={this.props.handler}
                                    ></FetchEntityDropdown>

                                    <TelemetrySelectionPanel
                                        perEntityConfig={this.props.perEntityConfig}
                                        availableTreeGroups={availableGroups}
                                        onGroupOrFilterChange={this.onTelemetryGroupOrFilterChange}
                                        name={this.props.entitySingular + "_selection_panel"}
                                        entitySingular={this.props.entitySingular}
                                        entityPlural={this.props.entityPlural}
                                        project={this.props.selectedItems.selectedProject}
                                        iafViewerDBMRef={this.props.iafViewerDBMRef}
                                        onEntitiesSelected={this.props.onEntitiesSelected}
                                        onEntitiesExpanded={this.props.onEntitiesSelected}
                                    />
                                </div> : 
                                <div className='navigator-drawer-content'>
                                    <EntitySelectionPanel
                                         selectedGroups={this.props.groups}
                                         selectedFilters={this.props.appliedFilters}
                                         selectedEntities={this.filteredEntities()}
                                         fetching={this.props.fetching}
                                         entities={this.props.allEntities}
                                         onGroupOrFilterChange={this.props.onGroupOrFilterChange}
                                         leafNodeRenderer={leafNodeRenderer}
                                         branchNodeRenderer={branchNodeRenderer}
                                         name={this.props.entitySingular + "_selection_panel"}
                                         onSelect={this.handleEntityFilterSelection}
                                         treeSelectMode={TreeSelectMode.NONE_MEANS_NONE}
                                         entitySingular={this.props.entitySingular}
                                         entityPlural={this.props.entityPlural}
                                         nonFilterableProperties={nonFilterableProps}
                                         nonGroupableProperties={nonGroupableProps}
                                         defaultGroups={defaultGroups}
                                         isolatedEntities={this.props.isolatedEntities}
                                         setFilteredBySearchEntities={this.props.setFilteredBySearchEntities}
                                         filteredBySearchEntityIds={this.props.filteredBySearchEntityIds}
                                    />
                                </div>
                            }
                        </StackableDrawer>
                    </div>}
                    {!this.props.isDataDrawerDisabled && <div className='navigator-drawer-container'>
                        <div className='navigator-drawer-title-bar'>
                            <i className={"fas fa-list"}></i>
                        </div>
                        <StackableDrawer level={2} defaultOpen={false} isDrawerOpen={this.props.viewerMode===NavigatorSource.SEARCH && this.props.isDataDrawerOpen} fixedWidth={500}>
                            <div className='navigator-drawer-content'>

                                {/*//TODO: create new component that will call real time data */}

                                <EntityListView
                                    config={config?.tableView?.component}
                                    entities={this.tableEntities()}
                                    actions={this.getTableActions()}
                                    context={this.context}
                                    selectedEntities={this.props.selectedEntities}
                                    onChange={this.handleEntitySelection}
                                    onDetail={this.handleEntitySelectionOnDetail}
                                    entitySingular={this.props.entitySingular}
                                    onSortChange={this.props.onEntityListSortChange}
                                    showModal={this.props.actions.showModal}
                                />



                            </div>
                        </StackableDrawer>
                    </div>}
                </div>



            </React.Fragment>
        );
    }
};

const {
    clearEntities,
    getAllCurrentEntities,
    getAppliedFilters,
    getFetchingCurrent,
    isSelectingEntities,
    setIsolatedEntities,
    setEntities,
    setViewerSyncOn,
    getIsolatedEntities,
    //getSelectedEntities,
    getCurrentEntityType,
    selectEntitiesFromModels,
    getFilteredEntities
} = Entities;

const getSelectedEntities = fixedGetSelectedEntities;

const mapStateToProps = state => ({
    allEntities: getAllCurrentEntities(state),
    fetching: getFetchingCurrent(state),
    isSelectingEntity: isSelectingEntities(state),
    appliedFilters: getAppliedFilters(state),
    isolatedEntities: getIsolatedEntities(state),
    selectedEntities: getSelectedEntities(state),
    currentEntityType: getCurrentEntityType(state),
    currentEntities: getFilteredEntities(state),
});

const mapDispatchToProps = {
    setViewerSyncOn,
    setEntities,
    setIsolatedEntities,
    clearEntities,
    selectEntitiesFromModels,
}
//export default () => <React.Fragment></React.Fragment>;

export default compose(
    withGenericPageContext,
    connect(mapStateToProps, mapDispatchToProps),
)(EntitySearchPanels)
