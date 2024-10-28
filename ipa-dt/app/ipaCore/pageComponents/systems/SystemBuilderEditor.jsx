import React, {useEffect, useState} from "react";
import {compose} from "redux";
import {connect} from "react-redux";
import {Overlay} from "@invicara/ipa-core/modules/IpaControls";
import {
    addSystemElement,
    applyChanges,
    changeLevel,
    changeOrder,
    clearEntities,
    clearfilterModeEntities,
    clearNonModelElements,
    createSystemElement,
    addSystemElements,
    addAssetFromModelElements,
    fetchAllSystems,
    fetchSystem,
    getAllSystems,
    getAppliedFilters,
    getCheckedEntities,
    getCurrentEntityType,
    getCurrentSystem,
    getEntities,
    getFilterModeError,
    getFilteredEntities,
    getNonModelElements,
    getNonModelElementsFilters,
    getNonModelElementsGroups,
    getSelectedNonModelElements,
    getSelectedNonModelElementsIds,
    getGroups,
    getHiddenEntities,
    getIsolatedEntities,
    getSelectedEntities,
    getSelectedEntitiesIds,
    getSelectedSystemCategories,
    getSystemElements,
    getSystemElementsRelations,
    onSystemElementCreated,
    removeElement,
    resetSystemBuilder,
    saveSystem,
    selectEntitiesFromModels,
    setChecked,
    setCurrentEntityType,
    setCurrentSystem,
    setFilters,
    setGroups,
    setHiddenEntities,
    setSelectedEntities,
    setSelectedSystemCategories,
    setSystemFromSchema,
    setSystemName,
    setSystemStatus,
    updateChecked,
    toggleCritical,
    fetchEntities,
    fetchNonModelElements,
    getNonCriticalHidden,
    setHideNonCritical,
    setNonModelElementsFilters,
    setNonModelElementsGroups,
    setNonModelElementsSelectedIds,
    getElementNotFound, setElementNotFound,
    getAllSelectedElements,
    setSpaceMode, 
    getSpaceMode,
    removeEntities, 
    shouldAddToWorkbenchOnSelect,
    setAddToWorkbenchOnSelect,
    fetchSourceFileIndex,
    getSourceFileNames,
    getHiddenFileNames, setHiddenSourceFiles, getHiddenModelsByFile
} from "../../redux/system-builder";
import _ from "lodash";
import withRouter from "react-router/es/withRouter";
import {SystemNonModelAssetPanel} from "./SystemNonModelAssetPanel";
import {SystemsInputSearchPanel} from "./SystemsInputSearchPanel";
import {SystemElementCreatePanel} from "./SystemElementCreatePanel";
import {SystemSpinner} from "./SystemSpinner";
import {SystemEditPanel} from "./SystemEditPanel";
import {SystemsFileVisibilityPanel} from "./SystemsFileVisibilityPanel";

export const SystemBuilderEditor = ({
     handler, filters, groups, setFilters, setGroups, selectedItems, setCurrentEntityType,
     selectedEntities, isolatedEntities, selectEntitiesFromModels, clearEntities, clearfilterModeEntities, clearNonModelElements, hiddenEntities,
     setHiddenEntities, checkedEntities, setChecked, updateChecked, currentEntityType, selectedSystemCategories,
     currentSystem, changeLevel, changeOrder, removeElement, systemElements, createSystemElement, addSystemElements, addAssetFromModelElements,
     history, saveSystem, onLoadComplete, match, fetchSystem, resetSystemBuilder, applyChanges, toggleCritical, fetchEntities, filteredEntities,
     filterModeError, fetchNonModelElements, nonModelElements, hideNonCritical, setHideNonCritical, 
     setNonModelElementsFilters, setNonModelElementsGroups, nonModelElementsGroups, nonModelElementsFilters, setNonModelElementsSelectedIds, nonModelElementsSelected, allSelectedElements, 
     setAddToWorkbenchOnSelect, addToWorkbenchOnSelect, removeEntities, spaceMode, setSpaceMode,
     sourceFileNames, hiddenFileNames, fetchSourceFileIndex, setHiddenSourceFiles, hiddenModelIds, elementNotFound, setElementNotFound
}) => {
    const [overlay, setOverlay] = useState({show: false});
    const [selectedSystemElement, setSelectedSystemElement] = useState(undefined);

    useEffect(() => {
        //commenting this due this deffect DBM-1540
        //resetSystemBuilder()
        onLoadComplete();
        fetchSystem(match.params.systemId, handler.config.getSystemScript, handler.config.picklistSelectsConfig.initialPickListType);
    }, []);

    const setOverlayMessage = (content, duration) => setOverlay({
        show: true,
        duration,
        onFadeOut: () => setOverlay({show: false}),
        content
    })

    const hideOverlayMessage = () => setOverlay({
        show: false
    })

    const onEntitySelectChange = ({value}) => {
        const entityType = handler.config.allowEntities.find(e => value.type === e.type)
        setCurrentEntityType(entityType)
        clearfilterModeEntities()
   }

    const getColumns = () => _.get(handler.config.allowEntities.find(
        e => [_.get(currentEntityType, 'plural'), _.get(currentEntityType, 'singular')].includes(e.type)
    ), 'tableConfig');

    return <div className='systems-builder-view'>
        <Overlay config={overlay}/>
        <SystemsInputSearchPanel
            searchOptions={handler.config.allowEntities}
            currentEntityType={currentEntityType}
            onEntitySelectChange={onEntitySelectChange}
            entities={filteredEntities}
            groups={groups}
            filters={filters}
            filterError={filterModeError}
            onFilterChange={setFilters}
            onGroupChange={setGroups}
            hiddenEntities={hiddenEntities}
            onEntitiesHidden={setHiddenEntities}
            onEntityFetch={fetchEntities}
            searchConfig={currentEntityType?.searchConfig}
            setSpaceMode={setSpaceMode}
            clearfilterModeEntities={clearfilterModeEntities}
        />
        <SystemNonModelAssetPanel nonModelElements={nonModelElements}
                        groups={nonModelElementsGroups}
                        filters={nonModelElementsFilters}
                        onFilterChange={setNonModelElementsFilters}
                        onGroupChange={setNonModelElementsGroups}
                        onNonModelElementFetch={fetchNonModelElements}
                        clearNonModelElements={clearNonModelElements}
                        onNonModelElementSelect={setNonModelElementsSelectedIds}
                        selectedEntities={nonModelElementsSelected}
                        />
        <SystemsFileVisibilityPanel
            fileOptions={sourceFileNames}
            hiddenFiles={hiddenFileNames}
            setHiddenSourceFiles={setHiddenSourceFiles}
            loadSourcefileIndex={fetchSourceFileIndex}
        />
        <div className='content'>
            {!currentSystem?._id ? <SystemSpinner/> :
                <>
                    <SystemElementCreatePanel
                        model={selectedItems.selectedModel}
                        isolatedEntities={isolatedEntities}
                        allSelectedElements={allSelectedElements}
                        hiddenEntities={hiddenEntities}
                        onViewerSelect={selectEntitiesFromModels}
                        elementNotFound={elementNotFound}
                        setElementNotFound={setElementNotFound}
                        createSystemElement={createSystemElement}
                        addSystemElements={addSystemElements}
                        addAssetFromModelElements={addAssetFromModelElements}
                        selectedSystemElement={selectedSystemElement}
                        checkedEntities={checkedEntities}
                        updateChecked={updateChecked}
                        setChecked={setChecked}
                        columns={getColumns()}
                        systemColor={_.get(currentSystem, "properties.System Color.val", "FF0000")}
                        systemElements={systemElements}
                        showMessage={setOverlayMessage}
                        hideMessage={hideOverlayMessage}
                        scriptName={handler.config.getSystemFromSchemaScript}
                        clearfilterModeEntities={clearfilterModeEntities}
                        clearNonModelElements={clearNonModelElements}
                        spaceMode={spaceMode}
                        setSpaceMode={setSpaceMode}
                        removeEntities={removeEntities}
                        setAddToWorkbenchOnSelect={setAddToWorkbenchOnSelect}
                        addToWorkbenchOnSelect={addToWorkbenchOnSelect}
                        hiddenModelIds={hiddenModelIds}
                    />
                    <div className='right-content'>
                        <SystemEditPanel
                            showMessage={setOverlayMessage}
                            currentSystem={currentSystem}
                            selectedSystemCategories={selectedSystemCategories}
                            picklistSelectsConfig={handler.config.picklistSelectsConfig}
                            systemStatusConfig={handler.config.systemStatus}
                            canEditSystems={handler.config.canEditSystems}
                            systemElements={systemElements}
                            changeLevel={changeLevel}
                            changeOrder={changeOrder}
                            removeElement={removeElement}
                            history={history}
                            editSystemScript={handler.config.editSystemScript}
                            createSystemElementScript={handler.config.createSystemElementScript}
                            updateSystemElementsScript={handler.config.updateSystemScript}
                            saveSystem={saveSystem}
                            resetSystemBuilder={resetSystemBuilder}
                            applyChanges={applyChanges}
                            toggleCritical={toggleCritical}
                            selectedSystemElement={selectedSystemElement}
                            setSelectedSystemElement={setSelectedSystemElement}
                            hideNonCritical={hideNonCritical}
                            setHideNonCritical={setHideNonCritical}
                        />
                    </div>
                </>
            }
        </div>
    </div>
}

const mapStateToProps = state => ({
    entities: getEntities(state),
    groups: getGroups(state),
    filters: getAppliedFilters(state),
    filteredEntities: getFilteredEntities(state),
    filterModeError: getFilterModeError(state),
    nonModelElementsGroups: getNonModelElementsGroups(state),
    nonModelElementsFilters: getNonModelElementsFilters(state),
    nonModelElements: getNonModelElements(state),
    nonModelElementsSelected: getSelectedNonModelElements(state),
    nonModelElementsSelectedIds: getSelectedNonModelElementsIds(state),
    isolatedEntities: getIsolatedEntities(state),
    selectedEntities: getSelectedEntities(state),
    selectedEntitiesIds: getSelectedEntitiesIds(state),
    hiddenEntities: getHiddenEntities(state),
    checkedEntities: getCheckedEntities(state),
    currentEntityType: getCurrentEntityType(state),
    systemElements: getSystemElements(state),
    selectedSystemCategories: getSelectedSystemCategories(state),
    systemElementRelations: getSystemElementsRelations(state),
    currentSystem: getCurrentSystem(state),
    allSystems: getAllSystems(state),
    hideNonCritical: getNonCriticalHidden(state),
    allSelectedElements: getAllSelectedElements(state),
    spaceMode: getSpaceMode(state),
    addToWorkbenchOnSelect: shouldAddToWorkbenchOnSelect(state),
    sourceFileNames: getSourceFileNames(state),
    hiddenFileNames: getHiddenFileNames(state),
    hiddenModelIds: getHiddenModelsByFile(state),
    elementNotFound: getElementNotFound(state)
});


const mapDispatchToProps = {
    setHideNonCritical,
    setAddToWorkbenchOnSelect,
    setGroups,
    setFilters,
    setCurrentEntityType,
    clearEntities,
    clearNonModelElements,
    clearfilterModeEntities,
    setNonModelElementsSelectedIds,
    setNonModelElementsFilters,
    setNonModelElementsGroups,
    selectEntitiesFromModels,
    setSelectedEntities,
    setHiddenEntities,
    setChecked,
    updateChecked,
    setSelectedSystemCategories,
    setSystemName,
    setSystemStatus,
    setCurrentSystem,
    changeLevel,
    changeOrder,
    removeElement,
    addSystemElement,
    onSystemElementCreated,
    setSystemFromSchema,
    fetchAllSystems,
    fetchSystem,
    applyChanges,
    resetSystemBuilder,
    createSystemElement,
    addSystemElements,
    addAssetFromModelElements,
    saveSystem,
    toggleCritical,
    fetchEntities,
    fetchNonModelElements,
    setSpaceMode,
    removeEntities,
    fetchSourceFileIndex,
    setHiddenSourceFiles,
    setElementNotFound
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withRouter
)(SystemBuilderEditor)