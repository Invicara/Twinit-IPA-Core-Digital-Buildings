import {createSelector, createSlice} from '@reduxjs/toolkit'

import _ from 'lodash'
import {
    getEntityFromModel,
    getFilteredEntitiesBy,
    ScriptCache,
    ScriptHelper,
    setIncludesBy
} from "@invicara/ipa-core/modules/IpaUtils"
import {ControlProvider} from "@invicara/ipa-core/modules/IpaControls";

let initialState = {
    currentEntityType: null,
    addToWorkbenchOnSelect: true,
    entities: [],
    filterModeEntities: [],
    filterModeError: undefined,
    appliedFilters: {},
    groups: [],
    selectedIds: [],
    selectingEntities: false,
    isolatedIds: [],
    hiddenEntitiesIds: [],
    checkedIds: [],
    selectedSystemCategories: undefined,
    //TODO consider further slicing this slice
    currentSystem: {
        'System Name': '',
        properties: {
            'System Category': {
                val: ''
            },
            'System Type': {
                val: ''
            },
            'System Status': {
                val: ''
            },
            'System Color': {
                val: ''
            }
        }
    },
    systemElementsById: {},
    relations: [],
    allSystems: undefined,
    hideNonCritical: true,
    nonModelElementsFilters: {},
    nonModelElementsGroups: [],
    nonModelElementsSelectedIds: [],
    spaceMode: false,
    sourceFileIndex: {},
    hiddenSourceFiles: [],
    elementNotFound: false
};

const mapIds = entities => entities.map(({_id}) => _id)

const MODEL_ELEMENT_PROPERTIES = ["Revit Category",
    "Revit Family",
    "Revit Type",
    "BA Name",
    "Containing Floor",
    "Room Number",
    "Mark",
    "Type Mark",
]
const getModelProperties = (modelElement) =>
    _.pick({...modelElement["Revit Type Properties"], ...modelElement["Revit Element Properties"]}, MODEL_ELEMENT_PROPERTIES)

const asEntity = modelElement => ({
    _id: modelElement.id,
    "Entity Name": `${_.get(modelElement, "Revit Element Properties.BA Name.val", "")} ${_.get(modelElement, "Revit Element Properties.Mark.val", "")} ${_.get(modelElement, "Revit Element Properties.Type Mark.val", "")}`,
    relatedActualEntities: _.get(modelElement, 'relatedAssets', []).map(a => ({...a, "Entity Name": a["Asset Name"], type: { type: "Assets", singular: "Asset", plural: "Assets" }})),
    properties: {
        "dtCategory": {
            type: "text",
            val: modelElement.dtCategory,
            dName: "dtCategory"
        },
        "dtType": {
            type: "text",
            val: modelElement.dtType,
            dName: "dtType"
        },
        "isAsset": {
            type: "boolean",
            val: !_.isEmpty(modelElement.relatedAssets) ? "Yes" : "No", //Looks like we have no filter support for boolean properties!
            dName: "isAsset"
        },
        "Source File": {
            type: "text",
            val: modelElement.source_filename,
            dName: "Source File"
        },
        ...getModelProperties(modelElement)
    },
    modelViewerIds: [modelElement.id],
    isModelElement: true,
    type: { type: "ModelElements", singular: "Model Element", plural: "Model Elements" }
})

function getEntitiesOrModels(isModel, loadedEntities, typeConfig) {
    return isModel ? loadedEntities.map(asEntity) : loadedEntities.map(e => ({
        ...e,
        modelData: e.modelData && asEntity( e.modelData),
        type: {
            type: typeConfig.type,
            singular: typeConfig.singular,
            plural: typeConfig.plural
        }
    }));
}

const systemBuilderSlice = createSlice({
    name: 'systemBuilder',
    initialState,
    reducers: {
        resetSystemBuilder: () => initialState,
        addEntities: (state, {payload: {entities: loadedEntities, isModel, type}}) => { //TODO: Maybe consider merging with the idea of 'selected' entities since it seems to have lost any meaning by itself
            const entitiesToAdd = getEntitiesOrModels(isModel, loadedEntities, type)
            const newEntities = _.uniqBy([...state.entities, ...entitiesToAdd], entity => entity._id);
            const newIds = mapIds(newEntities)

            state.selectedIds = newIds;
            state.entities = newEntities;
        },
        removeEntities: (state, {payload: entities}) => {
            _.remove(state.selectedIds, id => entities.some(e => e._id === id))
            _.remove(state.nonModelElementsSelectedIds, id => entities.some(e => e._id === id))
            _.remove(state.entities, existingEntity => entities.some(e => e._id === existingEntity._id))
        },
        setFilterModeEntities: (state, {payload: {entities: loadedEntities, isModel}}) => {
            const entities = getEntitiesOrModels(isModel, loadedEntities, state)
            state.filterModeEntities = entities;
        },
        setFilterModeError: (state, { payload: { error } }) => {
            state.filterModeError = error;
        },
        resetFilterModeError: (state) => {
            state.filterModeError = undefined;
        },
        setNonModelElements: (state, {payload: {nonModelElements: loaded}}) => {
            state.nonModelElements = loaded;
        },
        setNonModelElementsFilters: (state, {payload: filters}) => {
            state.nonModelElementsFilters = filters;
        },
        setNonModelElementsGroups: (state, {payload: groups}) => {
            state.nonModelElementsGroups = groups;
        },
        setNonModelElementsSelectedIds: (state, {payload: element}) => {
            state.nonModelElementsSelectedIds = mapIds(element)
        },
        setFilters: (state, {payload: filters}) => {
            state.appliedFilters = filters;
        },
        setGroups: (state, {payload: groups}) => {
            state.groups = groups;
        },
        setSelectedEntities: (state, {payload: entities}) => {
            state.selectedIds = mapIds(entities)
            state.hiddenEntitiesIds = state.hiddenEntitiesIds.filter(e => !state.selectedIds.includes(e))
        },
        setCurrentEntityType: (state, {payload: type}) => {
            state.currentEntityType = type
        },
        clearfilterModeEntities: (state) => {
            state.entities = [];
            state.filterModeEntities = [];
            state.appliedFilters = {};
            state.isolatedIds = [];
            state.hiddenEntitiesIds = [];
            state.groups = [];
        },
        clearEntities: (state) => {
            state.entities = [];
            state.filterModeEntities = [];
            state.appliedFilters = {};
            state.selectedIds = [];
            state.isolatedIds = [];
            state.hiddenEntitiesIds = [];
            state.groups = [];
            state.checkedIds = [];
        },
        clearNonModelElements: (state) => {
            state.nonModelElements = [];
            state.nonModelElementsSelectedIds = [];
            state.nonModelElementFilters = {};
            state.nonModelElementsGroups = [];
        },
        setHiddenEntities: (state, {payload: hiddenEntities}) => {
            state.hiddenEntitiesIds = mapIds(hiddenEntities)
        },
        setChecked: (state, {payload: checkedIds}) => {
            state.checkedIds = checkedIds;
        },
        updateChecked: (state, {payload: {id, checked}}) => {
            if (checked)
                state.checkedIds.push(id)
            else
                _.remove(state.checkedIds, checkedId => checkedId === id);
        },
        setSelectedSystemCategories: (state, {payload: selectedCategories}) => {
            state.currentSystem.properties['System Category'].val = selectedCategories['System Category'][0]?.display
            state.currentSystem.properties['System Type'].val = selectedCategories['System Type'][0]?.display,
                state.selectedSystemCategories = selectedCategories
        },
        setSystemName: (state, {payload: systemName}) => {
            state.currentSystem['System Name'] = systemName
        },
        setSystemDescription: (state, { payload: systemDescription }) => {
            _.set(state, 'currentSystem.properties.System Description.val', systemDescription)
        },
        setSystemStatus: (state, {payload: systemStatus}) => {
            state.currentSystem.properties['System Status'].val = systemStatus
        },
        setCurrentSystem: (state, {payload: system}) => {
            state.currentSystem = system
        },
        setSystemColor: (state, {payload: systemColor}) => {
            state.currentSystem.properties['System Color'] = { val: systemColor }
        },
        setAllSystems: (state, {payload: systems}) => {
            state.allSystems = _.orderBy(systems, ["_metadata._createdAt"], "desc")
        },
        changeLevel: (state, {payload: {systemElement, newParentId, newOrder}}) => {
            if (newParentId === systemElement._id) return;
            const oldParentalRelation = state.relations.find(rel => rel.childId === systemElement._id && rel.parentId !== state.currentSystem._id && !rel.removed)
            if (oldParentalRelation) {
                oldParentalRelation.removed = true;
                if (oldParentalRelation.isNew) _.remove(state.relations, r => r === oldParentalRelation)
            }
            state.systemElementsById[systemElement._id].localOrder = newOrder
            if (newParentId) state.relations.push({childId: systemElement._id, parentId: newParentId, isNew: true})
        },
        changeOrder: (state, {payload: {systemElement, newOrder}}) => {
            state.systemElementsById[systemElement._id].localOrder = newOrder
        },
        removeElement: (state, {payload: systemElement}) => {
            const oldParentalRelation = state.relations.find(rel => rel.childId === systemElement._id && rel.parentId !== state.currentSystem._id && !rel.removed)
            const oldSystemToElementRelation = state.relations.find(rel => rel.childId === systemElement._id && rel.parentId === state.currentSystem._id && !rel.removed)
            if (oldParentalRelation) oldParentalRelation.removed = true;
            if (oldSystemToElementRelation) oldSystemToElementRelation.removed = true;
            delete state.systemElementsById[systemElement._id]
        },
        addSystemElement: (state, { payload: {systemElement, parent} }) => {
            //Add relation to system
            state.relations.push({childId: systemElement._id, parentId: state.currentSystem._id, isNew: true});
            //Add relation to other system elements
            if (parent) state.relations.push({childId: systemElement._id, parentId: parent._id, isNew: true});
            state.systemElementsById[systemElement._id] = {...systemElement, isNew: true};
        },
        onSystemElementCreated(state, {payload: {oldId, systemElement}}) {
            delete state.systemElementsById[oldId]
            state.systemElementsById[systemElement._id] = systemElement
            let systemElementRelations = state.relations.filter(e => e.parentId === oldId || e.childId === oldId).map(r => ({
                childId: r.childId === oldId ? systemElement._id : r.childId,
                parentId: r.parentId === oldId ? systemElement._id : r.parentId,
                isNew: true
            }))
            state.relations = state.relations.filter(e => !(e.parentId === oldId || e.childId === oldId)).concat(systemElementRelations);
        },
        setSystemWithRelations(state, {payload: {system, systemElements, selectedCategories}}) {
            state.currentSystem = system
            systemElements.forEach((element) => {
                let {assets, spaces, relatedSystemElements, ...systemElement} = element;
                //Add relation to system
                state.relations.push({childId: systemElement._id, parentId: state.currentSystem._id});
                //Add relations to other elements
                Array.prototype.push.apply(state.relations, relatedSystemElements._list.map(el => ({
                    childId: el._id,
                    parentId: systemElement._id
                })));

                state.systemElementsById[systemElement._id] = {
                    ...systemElement,
                    localOrder: systemElement["Local Orders"] && Array.isArray(systemElement["Local Orders"]) && parseInt(systemElement["Local Orders"].find(lo => lo.systemId === state.currentSystem._id).localOrder),
                    relatedEntities: assets._list.concat(spaces._list)
                };
            })
            state.selectedSystemCategories = selectedCategories
        },
        consolidateOrders(state) {
            const elemToElemRelations = state.relations.filter(r => r.parentId !== state.currentSystem._id && !r.removed)
            const relationsByParent = _.values(_.groupBy(elemToElemRelations, r => r.parentId))
            const elementsByParent = relationsByParent.map(relationGroup => relationGroup.map(r => state.systemElementsById[r.childId]))
            const rootElements = _.values(state.systemElementsById).filter(elem => !elemToElemRelations.some(r => r.childId === elem._id))
            const newlyOrderedElements = [rootElements, ...elementsByParent].map(siblingGroup =>
                _.sortBy(siblingGroup, s => s.localOrder).map((s, i) => ({...s, localOrder: i}))
            )
            newlyOrderedElements.flat().forEach(el => {
                if (state.systemElementsById[el._id].localOrder !== el.localOrder) {
                    state.systemElementsById[el._id].localOrder = el.localOrder;
                    state.systemElementsById[el._id].orderUpdated = true;
                }
            })
        },
        removeFlags(state) {
            state.relations.filter(r => r.isNew).forEach(r => {
                delete r.isNew
            });
            state.relations = state.relations.filter(r => !r.removed)
            _.values(state.systemElementsById).filter(e => e.orderUpdated).forEach(e => {
                delete e.orderUpdated
            })
        },
        toggleCritical(state, {payload: {systemElement}}){
            state.systemElementsById[systemElement._id].critical = !state.systemElementsById[systemElement._id].critical;
        },
        setHideNonCritical(state, {payload: hide}){
            state.hideNonCritical = hide
        },
        setSpaceMode(state, {payload: spaceMode}){
            state.spaceMode = spaceMode
        },
        setAddToWorkbenchOnSelect(state, {payload: shouldAdd}){
            state.addToWorkbenchOnSelect = shouldAdd;
        },
        setSourceFileIndex(state, {payload: index}){
            state.sourceFileIndex = index;
        },
        setHiddenSourceFiles(state, {payload: files}){
            state.hiddenSourceFiles = files;
        },
        setElementNotFound(state, {payload: found}){
            state.elementNotFound = found;
        },
    },
});

const {actions, reducer} = systemBuilderSlice
export default reducer

//Private selectors
const getSystemBuilderSlice = store => store.systemBuilder

const getIsolatedEntitiesIds = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.isolatedIds || [])

const fromIDs = (entities, ids) => entities.filter(e => _.includes(ids, e._id))

const allSelected = (entities, nonmodels) => entities.concat(nonmodels)

const getCheckedIds = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.checkedIds);

const getHandlersConfig =  store => store.userConfig.handlers;//TODO  move to user-config slice in ipa-core

//Public Selectors

export const getEntities = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.entities);

export const getFilterModeEntities = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.filterModeEntities);

export const getFilterModeError = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.filterModeError);

export const getCurrentEntityType = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.currentEntityType)

export const getGroups = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.groups);

export const getAppliedFilters = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.appliedFilters)

export const getFilteredEntities = createSelector([getFilterModeEntities, getAppliedFilters], (currentEntities, appliedFilters) =>
    _.isEmpty(getAppliedFilters) ? currentEntities : getFilteredEntitiesBy(currentEntities, appliedFilters)
)

export const getNonModelElements = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.nonModelElements || [])

export const getNonModelElementsFilters = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.nonModelElementsFilters || {})

export const getNonModelElementsGroups = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.nonModelElementsGroups || [])

export const getSelectedEntitiesIds = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.selectedIds || [])

export const getHiddenEntitiesIds = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.hiddenEntitiesIds || [])

export const getIsolatedEntities = createSelector([getFilteredEntities, getIsolatedEntitiesIds], fromIDs)

export const getSelectedEntities = createSelector([getEntities, getSelectedEntitiesIds], fromIDs)

export const getSelectedNonModelElementsIds = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.nonModelElementsSelectedIds || [])

export const getSelectedNonModelElements = createSelector([getNonModelElements, getSelectedNonModelElementsIds], fromIDs)

export const getAllSelectedElements = createSelector([getSelectedEntities, getSelectedNonModelElements], allSelected)

export const getHiddenEntities = createSelector([getFilteredEntities, getHiddenEntitiesIds], fromIDs);

export const getSelectedSystemCategories = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.selectedSystemCategories);

export const getCurrentSystem = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.currentSystem);

export const getAllSystems = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.allSystems);

export const getSystemElementsRelations = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.relations);

export const getSystemBuilderConfig = createSelector(getHandlersConfig, handlers => handlers.systemBuilder.config)

export const getAllowedEntitiesConfig = createSelector(getSystemBuilderConfig, sysBuildConf => sysBuildConf.allowEntities)

export const getSourceFileNames = createSelector(getSystemBuilderSlice, slice => _.keys(slice.sourceFileIndex))

export const getHiddenFileNames = createSelector(getSystemBuilderSlice, slice => slice.hiddenSourceFiles)

export const getHiddenModelsByFile = createSelector(getSystemBuilderSlice, slice =>
    _.values(_.pick(slice.sourceFileIndex, slice.hiddenSourceFiles)).flat()
)

export const getSystemElements = createSelector(getSystemBuilderSlice, ({relations, currentSystem, systemElementsById}) => {
    const allElements = _.values(systemElementsById);
    const upstreamDowntreamRelations = relations.filter(rel => !rel.removed && rel.parentId !== currentSystem._id);
    return allElements.map(e => ({
        ...e,
        upstream: upstreamDowntreamRelations.filter(rel => rel.childId === e._id).map(rel => rel.parentId)[0],
        downstream: upstreamDowntreamRelations.filter(rel => rel.parentId === e._id).map(rel => rel.childId)
    }))
});

export const getNonCriticalHidden = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.hideNonCritical)

export const getSpaceMode = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.spaceMode)

export const shouldAddToWorkbenchOnSelect = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.addToWorkbenchOnSelect)

export const getElementNotFound = createSelector(getSystemBuilderSlice, systemBuilderSlice => systemBuilderSlice.elementNotFound)

//Thunks
export const fetchEntities = (selector, value, additionalFilters) => async (dispatch, getState) => {
    const query = ControlProvider.getQuery(value, selector);
    const currentEntityType = getCurrentEntityType(getState());

    let result = await ScriptCache.runScript(currentEntityType.script, {
        entityInfo: selector.altScript ? value : query,
        limit: currentEntityType.searchConfig?.queryLimit
    });

    if(!result.length) {
        dispatch(setFilterModeError({ error: "No entities returned!"}));
    } else {
        dispatch(resetFilterModeError());
        const sorted = _.sortBy(result, a => a["Entity Name"]);
        dispatch(setFilterModeEntities({ entities: sorted, isModel: currentEntityType.isModel }));
    }

}

export const fetchSourceFileIndex = () => async (dispatch, getState) => {
    const allModels = await ScriptCache.runScript("getAllModels");
    const sourceFileIndex = _.mapValues(_.groupBy(allModels, 'source_filename'), models => models.map(m => m.package_id))
    dispatch(setSourceFileIndex(sourceFileIndex));
}

export const fetchNonModelElements = () => async (dispatch, getState) => {
    let nonModelElements = await ScriptCache.runScript("getNonModelAssets");
    const sorted = _.sortBy(nonModelElements, a => a["Entity Name"]);
    dispatch(setNonModelElements({nonModelElements: sorted}));
}

const getAllowedEntitiesTypeConfig = (getState, type) =>
    getAllowedEntitiesConfig(getState()).find(entityConfig => entityConfig.type === type);


const elementAlreadyRetrieved = (state, modelEntities) =>
    setIncludesBy(getSelectedEntities(state).flatMap(se => se.modelViewerIds), modelEntities.map(me => me.id));


export const selectEntitiesFromModels = (modelEntities, areSpaces) => async (dispatch, getState) => {
    const currentState = getState()

    const addOnSelect = shouldAddToWorkbenchOnSelect(currentState)
    if (!addOnSelect) {
        return
    }

    const retrieved = elementAlreadyRetrieved(currentState, modelEntities)
    if (retrieved) {
        return
    }
    // const searchType = getAllowedEntitiesTypeConfig(getState, areSpaces ? "Spaces" : "Assets");
    // @see DBM-1481
    // when using "Spaces" always it works for both Assets and Spaces
    // while using "Assets" doesnt work for Spaces
    const searchType = getAllowedEntitiesTypeConfig(getState, "Spaces");

    if (!modelEntities.length) {
        return
    }
    let entitiesToSelect = await Promise.all(modelEntities.map(modelEntity => getEntityFromModel(searchType.entityFromModelScript, modelEntity)));
    entitiesToSelect = entitiesToSelect?.filter(e => e); //filtering out undefined items
    let modelEntitiesWithDataResult = await Promise.all(modelEntities.map(modelEntity => getEntityFromModel(getAllowedEntitiesTypeConfig(getState, "ModelElements").entityFromModelScript, modelEntity)));
    modelEntitiesWithDataResult = modelEntitiesWithDataResult.map((entity) => entity[0]);

    let action = setElementNotFound(true)
    
    if (!_.isEmpty(entitiesToSelect)) {
        action = addEntities({entities: [entitiesToSelect['0']['0']], type: searchType })
    } else if (!_.isEmpty(modelEntitiesWithDataResult)){
        action = addEntities({entities: modelEntitiesWithDataResult, isModel: true})
    }
    dispatch(action)
};

export const getCheckedEntities = createSelector([getSelectedEntities, getSelectedNonModelElements, getCheckedIds],
    (entities, nonModelElements, ids) => entities.filter(e => ids.includes(e._id)).concat(nonModelElements.filter(e => ids.includes(e._id)))
);

export const setSystemFromSchema = (script) => async (dispatch, getState) => {
    const emptySystem = await ScriptHelper.executeScript(script, {entityType: 'system'});
    dispatch(setCurrentSystem(emptySystem));
}

export const fetchAllSystems = (script) => async (dispatch, getState) => {
    const systems = await ScriptHelper.executeScript(script);
    dispatch(setAllSystems(systems));
}

export const saveSystem = (script, systemName, systemDescription, systemCategoryType, systemStatus, systemColor) => async (dispatch, getState) => {
    await dispatch(setSystemName(systemName));
    await dispatch(setSystemDescription(systemDescription));
    await dispatch(setSelectedSystemCategories(systemCategoryType))//TODO Analyze and refactor this weird back & forth with the 'selected categories', they should just be stored in the system object
    await dispatch(setSystemStatus(systemStatus))
    await dispatch(setSystemColor(systemColor))
    const saveResponse = await ScriptHelper.executeScript(script, {system: getCurrentSystem(getState())});
    if (!saveResponse.success) {
        return saveResponse
    } else {
        const savedSystem = _.isObject(saveResponse.result) ? saveResponse.result : getCurrentSystem(getState());
        dispatch(setCurrentSystem(savedSystem))
        return savedSystem
    }
}

export const fetchSystem = (systemId, script, initialCategoriesType) => async (dispatch, getState) => {
    let result = await ScriptHelper.executeScript(script, {systemId: systemId})
    let selectedCategories = {
        'System Category': [{
            display: result.system.properties['System Category'].val,
            value: result.system.properties['System Category'].val + initialCategoriesType
        }], //TODO Analyze this and probably refactor so it's not necessary anymore
        'System Type': [{
            display: result.system.properties['System Type'].val,
            value: result.system.properties['System Type'].val
        }]
    };
    let systemElementsUpdated = result.systemElements._list
    dispatch(setSystemWithRelations({system: result.system, systemElements: systemElementsUpdated, selectedCategories:selectedCategories}))
}

export const applyChanges = (createScript, updateScript) => async (dispatch, getState) => {
    await dispatch(createElements(createScript, getCurrentSystem(getState()), getSystemElements(getState())))
    await dispatch(consolidateOrders())
    await dispatch(updateRelations(updateScript, getCurrentSystem(getState()), getSystemElements(getState()), getSystemElementsRelations(getState())))
}

const asDatabaseElement = (currentSystem) => (elem) => ({
    ..._.omit(elem, 'localOrder', 'relatedEntities'),
    "Local Orders": [{systemId: currentSystem._id, localOrder: elem.localOrder}]
})

export const createElements = (createScript, currentSystem, systemElements) => async (dispatch) => {
    return Promise.all(systemElements.filter(s => s.isNew).map(async (systemElement) => {
        let {_id, isNew, upstream, downstream, relatedEntities, ...elem} = systemElement
        let res = await ScriptHelper.executeScript(createScript,
            {
                systemElement: asDatabaseElement(currentSystem)(elem),
                relatedEntities: relatedEntities,
                system: currentSystem
            });
        await dispatch(onSystemElementCreated({
            oldId: _id,
            systemElement: {...res[0], relatedEntities: relatedEntities, localOrder: elem.localOrder}
        }))
    }))
}

const getSystemToElementRelationObjects = (currentSystem, newSystemToElementRelations) =>
    _.isEmpty(newSystemToElementRelations) ?
        [] :
        [{
            parentItem: {_id: currentSystem._id},
            relatedItems: newSystemToElementRelations.map(r => ({_id: r.childId}))
        }]

const getElementToElementRelationObjects = (currentSystem, newElementToElementRelations) => _.values(_.mapValues(
    _.groupBy(newElementToElementRelations, r => r.parentId),
    (children, parentId) => ({
        parentItem: {_id: parentId},
        customAttributes: {
            systemId: currentSystem._id
        },
        relatedItems: children.map(c => ({_id: c.childId}))
    })
));

export const updateRelations = (updateScript, currentSystem, systemElements, elementsRelations) => async (dispatch) => {
    const newRelations = elementsRelations.filter(s => s.isNew);
    const removedRelations = elementsRelations.filter(s => s.removed);
    const [newSystemToElementRelations, newElementToElementRelations] = _.partition(newRelations, s => s.parentId === currentSystem._id);
    const [removedSystemToElementRelations, removedElementToElementRelations] = _.partition(removedRelations, s => s.parentId === currentSystem._id);
    const newSystemToElementRelationObjects = getSystemToElementRelationObjects(currentSystem, newSystemToElementRelations);
    const newElementToElementRelationObjects = getElementToElementRelationObjects(currentSystem, newElementToElementRelations);
    const removedSystemToElementRelationObjects = getSystemToElementRelationObjects(currentSystem, removedSystemToElementRelations);
    const removedElementToElementRelationObjects = getElementToElementRelationObjects(currentSystem, removedElementToElementRelations);
    const reorderedElements = systemElements.filter(e => e.orderUpdated).map(asDatabaseElement(currentSystem));
    await ScriptHelper.executeScript("updateSystemRelations", {
        newSystemToElementRelationObjects,
        newElementToElementRelationObjects,
        removedSystemToElementRelationObjects,
        removedElementToElementRelationObjects,
        reorderedElements
    });
    dispatch(removeFlags())
}

const getTemporaryId = () => '_' + Math.random().toString(36).substr(2, 9);

const isAssetOrSpace = (entity) => (entity.type?.type === "Assets") || (entity.type?.type === "Spaces")

export const createSystemElement = (script, parent, name, relatedEntities, modelIds) => async (dispatch, getState) => {
    const siblings = _.get(parent, 'downstream', getSystemElements(getState()).filter(e => !e.upstream));
    const previousSibling = _.last(_.sortBy(siblings, e => e.localOrder))
    const systemElementSchema = await ScriptCache.runScript(script, { entityType: 'system-element' });
    const critical = relatedEntities.some(isAssetOrSpace);
    const newElement = Object.assign(systemElementSchema, {
        "_id": getTemporaryId(),
        "System Element Name": name,
        localOrder: !_.isEmpty(previousSibling) ? previousSibling.localOrder + 1 : 1,
        relatedEntities: relatedEntities || [],
        modelViewerIds: modelIds || [],
        critical
    });
    if(!critical){
        dispatch(setHideNonCritical(false))
    }
    await dispatch(addSystemElement({ systemElement: newElement, parent: parent }))
}

//Looks like we're re-checking a lot of conditions we previously checked in the UI components (comprise, having asset, etc).
//TODO keep those check outside and move the system element creation outside the store
export const addAssetFromModelElements = (script, parent, comprise, genericName) => async (dispatch, getState) => {
    const checkedEntities = getCheckedEntities(getState());
    dispatch(removeEntities(checkedEntities))
    if (!comprise) {
        checkedEntities.forEach(e => {
            if(!_.isEmpty(e.relatedActualEntities))
                e.relatedActualEntities.forEach(actualEntity => {
                    dispatch(createSystemElement(script, parent, actualEntity["Entity Name"], [actualEntity], e.modelViewerIds))
                })
            else dispatch(createSystemElement(script, parent, actualEntity["Entity Name"], [], e.modelViewerIds))
        })}
    else dispatch(addComprisedElements(checkedEntities,script, parent, genericName, true))
}

export const addSystemElements = (script, parent, comprise, genericName) => async (dispatch, getState) => {
    const checkedEntities = getCheckedEntities(getState());
    dispatch(removeEntities(checkedEntities))
    if (!comprise)
        checkedEntities.forEach(e => {
            dispatch(createSystemElement(script, parent, e["Entity Name"], e?.isModelElement ? [] : [e], e.modelViewerIds))
        })
    else dispatch(addComprisedElements(checkedEntities, script, parent, genericName, false))
}

const addComprisedElements = (checkedEntities, script, parent, genericName, addAsset) => async (dispatch, getState) => {
    const modelIds = _.flattenDeep(checkedEntities.map(e => e.modelViewerIds))
    const relatedEntities =  !addAsset ? checkedEntities : _.flattenDeep(checkedEntities.map(e => e.relatedActualEntities))
    dispatch(createSystemElement(script, parent, genericName, relatedEntities, modelIds))
}

//Action creators
export const {
    resetSystemBuilder,
    addEntities,
    removeEntities,
    setFilterModeEntities,
    setFilterModeError,
    resetFilterModeError,
    setNonModelElements,
    setFilters,
    setGroups,
    setCurrentEntityType,
    setSelectedEntities,
    clearEntities,
    clearfilterModeEntities,
    clearNonModelElements,
    setNonModelElementsSelectedIds,
    setHiddenEntities,
    setChecked,
    updateChecked,
    setSelectedSystemCategories,
    setSystemName,
    setSystemDescription,
    setSystemStatus,
    setSystemColor,
    addSystemElement,
    onSystemElementCreated,
    setCurrentSystem,
    setAllSystems,
    changeLevel,
    changeOrder,
    removeElement,
    consolidateOrders,
    removeFlags,
    setSystemWithRelations,
    toggleCritical,
    setHideNonCritical,
    setNonModelElementsFilters,
    setNonModelElementsGroups,
    setSpaceMode,
    setAddToWorkbenchOnSelect,
    setSourceFileIndex,
    setHiddenSourceFiles,
    setElementNotFound
} = actions;