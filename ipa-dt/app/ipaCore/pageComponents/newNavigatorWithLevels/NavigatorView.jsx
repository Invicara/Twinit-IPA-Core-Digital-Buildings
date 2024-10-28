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
    TreeSelectMode,
    withEntitySearch,
    EntityListView, withEntityAvailableGroups
} from "@invicara/ipa-core/modules/IpaPageComponents";
//import withEntitySearch from "../observability/WithEntitySearch";
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
import {StackableDrawer} from "@invicara/ipa-core/modules/IpaControls";
import EntityDetailBottomPanel from "./EntityDetailBottomPanel";

import {ScriptCache} from "@invicara/ipa-core/modules/IpaUtils";

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

class NavigatorView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSearchDrawerOpen: false,
            isFilterDrawerOpen: false,
            isDataDrawerOpen: false,
            isLevelDrawerOpen: false,
            displayedEntityIndex: undefined,
            reloadSearchToken: Math.floor((Math.random() * 100) + 1),
            detailEntity: undefined,
            entityListSort: {},
            isPageLoading: true,
            levels: undefined,
            levelsCuttingPlane: {},
            selectedLevel: undefined,
        }
    }

    async componentDidMount() {
        //When the page mounts load the async data (script and other)
        //and then create the column info for the upload table
        //this.setState({isPageLoading: true});
        this.props.setViewerSyncOn()

        const levels = await ScriptCache.runScript("getAssetLevels", {})
        const levelsCuttingPlane = await ScriptCache.runScript("getAssetCuttingPlaneValue", {})

        this.setState({
            levels: levels,
            levelsCuttingPlane: levelsCuttingPlane,
            isPageLoading: false
        });
    }


    handleEntityIndexChange = (event, newIndex) => {
        //this.props.clearEntities()
        this.props.updateEntityType(_.values(this.props.getPerEntityConfig())[newIndex])
    }

    handleEntityChange = (event, newEntityType) => {
        //this.props.clearEntities()
        this.props.updateEntityType(this.props.getPerEntityConfig()[newEntityType]);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if((this.props.allEntities !== prevProps.allEntities)){
            if(_.isEmpty(this.props.allEntities) && _.isEmpty(prevProps.allEntities)){
                this.openSearchDrawer();
            } else {
                this.openFilterDrawer();
            }
            //reset detail entity
            if(this.state.detailEntity) {
                this.setState({detailEntity : undefined});
            }
        }

    }

    getCurrentEntity = () => this.props.entitySingular;

    getCurrentEntityConfig = () => {
        return this.props.getPerEntityConfig()[this.getCurrentEntity()];
    }

    getCurrentEntityExtendedDataConfig = () => {

        if(!this.getCurrentEntity()) return

        let newCurrentConfig = {...this.getCurrentEntityConfig()}

        const defaultExtendedDataConfig = this.props.userConfig.entityDataConfig?.[this.getCurrentEntity()];
        if(defaultExtendedDataConfig) {
            const newCurrentConfigDataAsEntries = Object.entries(defaultExtendedDataConfig)
                .map((defaultDataConfig, key) => {
                    if(newCurrentConfig.data) {
                        return {...defaultDataConfig, ...newCurrentConfig.data?.[key]}
                    } else {
                        return {...defaultDataConfig}
                    }
                })

            newCurrentConfig.data = Object.fromEntries(newCurrentConfigDataAsEntries)
        }
        
        return newCurrentConfig;
    }

    //this assumes `this.props.getPerEntityConfig()` never changes, so it's a long shot
    getCurrentEntityConfigMemo = _.memoize((_currentEntity) => this.props.getPerEntityConfig()[_currentEntity]);

    getDetailEntityInstance = () => (this.props.selectedEntities && this.props.selectedEntities[0]);

    getQueryParams = () => this.props.queryParams.entityType === this.getCurrentEntity() ? this.props.queryParams : null;

    openSearchDrawer = () => this.setState({isSearchDrawerOpen: this.state.isSearchDrawerOpen ? this.state.isSearchDrawerOpen : !this.state.isSearchDrawerOpen})
    toggleSearchDrawer = () => this.setState({isSearchDrawerOpen: !this.state.isSearchDrawerOpen})

    openFilterDrawer = () => this.setState({isFilterDrawerOpen: this.state.isFilterDrawerOpen ? this.state.isFilterDrawerOpen : !this.state.isFilterDrawerOpen})
    toggleFilterDrawer = () => this.setState({isFilterDrawerOpen: !this.state.isFilterDrawerOpen})

    openDataDrawer = () => this.setState({isDataDrawerOpen: this.state.isDataDrawerOpen ? this.state.isDataDrawerOpen : !this.state.isDataDrawerOpen})
    toggleDataDrawer = () => this.setState({isDataDrawerOpen: !this.state.isDataDrawerOpen})

    openLevelDrawer = () => this.setState({isLevelDrawerOpen: this.state.isLevelDrawerOpen ? this.state.isLevelDrawerOpen : !this.state.isLevelDrawerOpen})
    toggleLevelDrawer = () => this.setState({isLevelDrawerOpen: !this.state.isLevelDrawerOpen})

    tableEntities = () => _.isEmpty(this.props.isolatedEntities) ? this.props.allEntities : this.props.isolatedEntities;

    actionSuccess = (actionType, newEntity, result) => {
        this.reloadSearchToken()
        this.props.onEntityChange(actionType, newEntity, result);
    }

    getTableActions = () => { 
        let actions = this.getCurrentEntityConfig().actions
        if (!_.isObject(actions)) {
            return undefined;
        }
        return {...actions, onSuccess: this.actionSuccess, doEntityAction: this.props.doEntityAction};
    }

    handleEntityFilterSelection = (entities) => {
        let intersectionOfSelectedandIsolatedEntities = this.props.selectedEntities.filter((entity) => entities.includes(entity));
        intersectionOfSelectedandIsolatedEntities = intersectionOfSelectedandIsolatedEntities.map(e => ({...e, checked: true}))
        this.handleEntitySelection(intersectionOfSelectedandIsolatedEntities);
        this.props.setIsolatedEntities(entities);
    }

    chooseDetailEntity = (checked, unchecked) => {
        if((unchecked.length>0) || (checked.length>0)) {
            //select or deselect
            this.setState({detailEntity: checked.length>1 ? checked[checked.length-1] : checked[0]});
        }
    }

    handleEntitySelection = (entities) => {
        const previouslySelected = this.props.selectedEntities;
        const checkedEntities = entities.filter(e => e.checked);
        let unchecked = previouslySelected.filter(e => !checkedEntities.includes(e));
        let checked = checkedEntities.filter(e => !previouslySelected.includes(e));
        if((unchecked.length>0) || (checked.length>0)) {
            //select or deselect
            this.setState({detailEntity: checked.length>1 ? checked[checked.length-1] : checked[0]});
        }
        this.props.setSelectedEntities(checkedEntities);
    }

    handleEntitySelectionOnDetail = (entity) => {
        const clickedEntity = {...entity,checked: !entity.checked};
        let unchecked = !clickedEntity.checked ? [clickedEntity] : [];
        let checked = unchecked.length>0 ? [] : [clickedEntity];
        if(clickedEntity.checked){
            //select
            this.setState({detailEntity: clickedEntity});
            this.props.setSelectedEntities(this.props.selectedEntities.concat([clickedEntity]));
        } else {
            //deselect
            const checkedEntities = this.props.selectedEntities.filter((e)=>e._id!==clickedEntity._id);
            this.setState({detailEntity: checkedEntities.length>0 ? checkedEntities[checkedEntities.length-1] : undefined});
            this.props.setSelectedEntities(checkedEntities);

        }
    }

    handleEntitySelectionFromModel = modelEntities => {
        this.props.selectEntitiesFromModels(modelEntities);
        this.setState({detailEntity: modelEntities.length>0 ? modelEntities[modelEntities.length-1] : undefined});
    }

    clearSearchAndFilters = () => {
        this.props.onGroupOrFilterChange({entityType: this.getCurrentEntity(), query: null, groups: null, filters: null})
        this.props.clearEntities([])
    }

    onEntityListSortChange = (currentSort) => {
        this.setState({entityListSort : currentSort});
    }

    handleLevelChange = (e) => {
        this.setState({selectedLevel: e.target.value});
    }

    
    render() {

        const config = this.getCurrentEntityConfig();
        
        const nonGroupableProps = config?.entitySelectionPanel?.nonGroupableProperties || [];
        const nonFilterableProps = config?.entitySelectionPanel?.nonFilterableProperties || [];
        const defaultGroups = config?.entitySelectionPanel?.defaultGroups || [];

        return (
            <div className='navigator-view'>
                <div className='navigator-viewer'>
                    <EnhancedIafViewer
                        name={'NavigatorViewer'}
                        model={this.props.selectedItems.selectedModel}
                        viewerResizeCanvas={true}
                        isolatedEntities={this.props.isolatedEntities}
                        selectedEntities={this.props.selectedEntities}
                        onSelect={this.handleEntitySelectionFromModel}
                        selectedLevel={this.state.levelsCuttingPlane[this.state.selectedLevel]}
                    />
                </div>
                <div className='navigator-view__panels'>
                    <div className='navigator-view__drawers'>
                        <div className='navigator-drawer-container'>
                            <StackableDrawer level={1} defaultOpen={false} isDrawerOpen={this.state.isSearchDrawerOpen}>
                                <div className='navigator-drawer-content'>
                                    <SearchModelessTab
                                        config={this.props.getPerEntityConfig()} 
                                        fetch={this.props.getFetcher}
                                        /*queryParams={this.getQueryParams()}*/
                                        queryParamsPerEntityType={this.props.queryParamsPerEntityType}
                                        currentTab={this.props.entitySingular}
                                        handleTabChange={this.handleEntityChange}
                                        reloadToken={this.state.reloadSearchToken}
                                    />
                                </div>
                            </StackableDrawer>
                        </div>
                        <div className='navigator-drawer-container'>
                            <StackableDrawer level={2} defaultOpen={false} isDrawerOpen={this.state.isFilterDrawerOpen}>
                                <div className='navigator-drawer-content'>
                                    <EntitySelectionPanel
                                        selectedGroups={this.props.groups}
                                        selectedFilters={this.props.appliedFilters}
                                        selectedEntities={this.props.isolatedEntities}
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
                                    />
                                </div>
                            </StackableDrawer>
                        </div>
                        <div className='navigator-drawer-container'>
                            <StackableDrawer level={3} defaultOpen={false} isDrawerOpen={this.state.isDataDrawerOpen} fixedWidth={500}>
                                <div className='navigator-drawer-content'>
                                <EntityListView
                                        config={this.getCurrentEntityConfig().tableView.component}
                                        entities={this.tableEntities()}
                                        actions={this.getTableActions()}
                                        context={this.context}
                                        selectedEntities={this.props.selectedEntities}
                                        onChange={this.handleEntitySelection}
                                        onDetail={this.handleEntitySelectionOnDetail}
                                        entitySingular={this.props.entitySingular}
                                        onSortChange={this.onEntityListSortChange}
                                    />
                                </div>
                            </StackableDrawer>
                        </div>
                        <div className='navigator-drawer-container'>
                            <StackableDrawer level={4} defaultOpen={false} isDrawerOpen={this.state.isLevelDrawerOpen} fixedWidth={300}>
                                <div className='navigator-drawer-content'>
                                    <div className='drawer-title'>Select a level</div>
                                    <hr />
                                    <RadioGroup aria-label="viewby" name="viewby" value={this.state.selectedLevel ?? " "} onChange={this.handleLevelChange} >
                                        {
                                            this.state.levels?.map(level => 
                                                <FormControlLabel labelPlacement="end" value={level} control={<Radio />} label={level} />
                                            )
                                        }
                                    </RadioGroup>
                                </div>
                            </StackableDrawer>
                        </div>
                    </div>
                    <EntityDetailBottomPanel
                        loadingDataGroups={this.props.loadingAvailableDataGroups}
                        availableDataGroups={this.props.availableDataGroups}
                        entityType={this.getCurrentEntity()}
                        config={this.getCurrentEntityConfig()}
                        getData={this.props.getEntityExtendedData(this.getCurrentEntityExtendedDataConfig()?.data)}
                        selectedEntities={this.props.selectedEntities}
                        handler={this.props.handler}
                        clearSearchAndFilters={this.clearSearchAndFilters}
                        doEntityAction={this.props.doEntityAction}
                        onEntityChange={this.props.onEntityChange}
                        entitySingular={this.props.entitySingular}
                        isDataDrawerOpen={this.state.isDataDrawerOpen}
                        isFilterDrawerOpen={this.state.isFilterDrawerOpen}
                        isSearchDrawerOpen={this.state.isSearchDrawerOpen}
                        isLevelDrawerOpen={this.state.isLevelDrawerOpen}
                        toggleDataDrawer={this.toggleDataDrawer}
                        toggleFilterDrawer={this.toggleFilterDrawer}
                        toggleSearchDrawer={this.toggleSearchDrawer}
                        toggleLevelDrawer={this.toggleLevelDrawer}
                        entity={this.state.detailEntity}
                        context={this.context}
                        entityListSort={this.state.entityListSort}
                        onActionSuccess={this.actionSuccess}
                    />
                </div>
            </div>
       );
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
    getAllCurrentEntities, 
    getAppliedFilters,
    getFetchingCurrent, 
    isSelectingEntities,
    setIsolatedEntities,
    setEntities,
    setViewerSyncOn,
    getIsolatedEntities,
    getSelectedEntities,
    getCurrentEntityType,
    selectEntitiesFromModels,
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
    setViewerSyncOn,
    setEntities, 
    setIsolatedEntities, 
    clearEntities, 
    selectEntitiesFromModels,
}

export default compose(
    withEntitySearch,
    withEntityAvailableGroups,
    connect(mapStateToProps, mapDispatchToProps),
)(NavigatorView)

