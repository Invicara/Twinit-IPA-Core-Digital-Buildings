import {
    createAsyncThunk,
    createEntityAdapter,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';
import {IafItemSvc, IafScriptEngine, IafFetch, IafSession, IafProj} from "@dtplatform/platform-api";
import { ScriptCache } from "@invicara/ipa-core/modules/IpaUtils/index.js";
import _ from "lodash";
const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)
export const generateCacheKey = entities => (entities ? hashCode((Array.isArray(entities) ? entities : [entities]).map(e=>e._id).join('')) : undefined)
export const TELEMETRY_FEATURE_KEY = 'telemetry';
export const telemetryAdapter = createEntityAdapter({
    //IDs are stored in a customized field ("_id")
    selectId: (telItem) => telItem._id,
    // Keep the "all IDs" array sorted based on names
    sortComparer: (a, b) => a._name.localeCompare(b._name),
});
/**
 * Redux Toolkit: https://redux-toolkit.js.org/api/createAsyncThunk
 */


export const fetchWellnessReadingsByEntities = createAsyncThunk(
    'fetchWellnessReadingsByEntities/fetchStatus',
    //readingsPayloadCreator
    async (args, thunkAPI)=> {
        const {script, scriptExpiration} = args || {};
        return ScriptCache.runScript(script ||  'fetchReadingsByEntities', {...args}, {scriptExpiration: scriptExpiration || 1})
    }
);

export const fetchReadingsByEntities = createAsyncThunk(
    'fetchReadingsByEntities/fetchStatus',
    //readingsPayloadCreator
    async (args, thunkAPI)=> {
        const {script, scriptExpiration} = args || {};
        return ScriptCache.runScript(script ||  'fetchReadingsByEntities', {...args}, {scriptExpiration: scriptExpiration || 1})
    }
);

export const fetchReadings24Hour = createAsyncThunk(
    'fetchReadings24Hour/fetchStatus',
    async (args, thunkAPI)=> {
        const {script, scriptExpiration} = args || {};
        return ScriptCache.runScript(script ||  'fetchReadings24Hour', {...args}, {scriptExpiration: scriptExpiration || 1})
    }
);

export const fetchMetricsConfig = createAsyncThunk(
    'fetchMetricsConfig/fetchStatus',
    async (args, thunkAPI) => {
        const {script, scriptExpiration, entities, entityType} = args || {};
        return ScriptCache.runScript(script ||  'getMetricsConfig', {entityInfo: entities, entityType: entityType}, {scriptExpiration: scriptExpiration || 1})
    }
);

export const fetchThemableElementsMappings = createAsyncThunk(
    'fetchThemableElementsMappings/fetchStatus',
    async (args, thunkAPI) => {
        const {script, scriptExpiration, entities, entityType} = args || {};
        return ScriptCache.runScript(script ||  'fetchThemableElementsMappings', {entityInfo: entities, entityType: entityType}, {scriptExpiration: scriptExpiration || 1})
    }
);

export const initialState = telemetryAdapter.getInitialState({
    groups : [],
    groupsLoadingStatus: 'not loaded',
    selectedGroup: undefined,

    wellnessReadings: [],//array [{coll,[{telItem, readings}]}]
    wellnessReadingsLoadingStatus: 'not loaded',

    readingsCache: {},
    readingsLoadingStatus: 'not loaded',

    readingsLast24HourAllSensors: {},
    readingsLastFetch24HourAllSensors: {},
    readingsLast24HourAllSensorsLoadingStatus: 'not loaded',

    cacheTime: 10000,



    metricsConfig: undefined,//array
    metricsConfigLoadingStatus: 'not loaded',
    error: null,

    themableElementsMappings: undefined,

    filteredPointNames: [],
    filteredMetricConfigs: [],
    filteredLevels: [],

    focusedEntity: undefined

});
export const telemerySlice = createSlice({
    name: TELEMETRY_FEATURE_KEY,
    initialState: initialState,
    reducers: {
        add: telemetryAdapter.addOne,
        remove: telemetryAdapter.removeOne,
        setAll: telemetryAdapter.setAll,
        // ...
        setFilteredMetricConfig: (
            state, action
        ) => {
            state.filteredPointNames = action.payload ? action.payload.map(mc=>mc.pointName) : [];
            state.filteredMetricConfigs = action.payload || [];
        },
        setFilteredLevels: (
            state, action
        ) => {
            state.filteredLevels = action.payload || [];
        },
        setFocusedEntity: (
            state, action
        ) => {
            state.focusedEntity = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReadingsByEntities.pending, (state) => {
                state.readingsLoadingStatus = 'loading';
            })
            .addCase(fetchReadingsByEntities.fulfilled, (state, action) => {
                //telemetryAdapter.updateOne(state, action.payload);
                const cacheKey = generateCacheKey(action.payload.entities || []);
                state.readingsCache = {...state.readingsCache, [cacheKey] : {collectionsWithReadings : action.payload.collectionsWithReadings, timestamp: new Date().getTime()} };
                state.readingsLoadingStatus = 'loaded';
            })
            .addCase(fetchReadingsByEntities.rejected, (state, action) => {
                state.readingsLoadingStatus = 'error';
                state.error = action.error.message;
            })

            .addCase(fetchWellnessReadingsByEntities.pending, (state) => {
                state.wellnessReadingsLoadingStatus = 'loading';
            })
            .addCase(fetchWellnessReadingsByEntities.fulfilled, (state, action) => {
                //telemetryAdapter.updateOne(state, action.payload);
                state.wellnessReadings = action.payload.collectionsWithReadings;
                const cacheKey = generateCacheKey(action.payload.entities || []);
                state.readingsCache = {...state.readingsCache, [cacheKey] : {collectionsWithReadings : action.payload.collectionsWithReadings, timestamp: new Date().getTime()} };
                state.wellnessReadingsLoadingStatus = 'loaded';
            })
            .addCase(fetchWellnessReadingsByEntities.rejected, (state, action) => {
                state.wellnessReadingsLoadingStatus = 'error';
                state.error = action.error.message;
            })

            .addCase(fetchMetricsConfig.pending, (state) => {
                state.metricsConfigLoadingStatus = 'loading';
            })
            .addCase(fetchMetricsConfig.fulfilled, (state, action) => {
                //telemetryAdapter.updateOne(state, action.payload);
                const config = action.payload;
                state.metricsConfig = action.payload;
                state.metricsConfigLoadingStatus = 'loaded';
            })
            .addCase(fetchMetricsConfig.rejected, (state, action) => {
                state.metricsConfigLoadingStatus = 'error';
                state.error = action.error.message;
            })


            .addCase(fetchThemableElementsMappings.pending, (state) => {
            })
            .addCase(fetchThemableElementsMappings.fulfilled, (state, action) => {
                //telemetryAdapter.updateOne(state, action.payload);
                state.themableElementsMappings = action.payload;
            })
            .addCase(fetchThemableElementsMappings.rejected, (state, action) => {
            })

            .addCase(fetchReadings24Hour.pending, (state) => {
                state.readingsLast24HourAllSensorsLoadingStatus = 'loading';
            })
            .addCase(fetchReadings24Hour.fulfilled, (state, action) => {

                let lastFetch = {...state.readingsLastFetch24HourAllSensors}

                const consolidatedNewReadingData = _.mergeWith({...state.readingsLast24HourAllSensors}, {...action.payload.readings}, (existingSensorData = {}, newSensorData = {}, sensorId, object, source, stack) => {

                    lastFetch[sensorId] = lastFetch[sensorId] || {}
                    lastFetch[sensorId][action.payload.pointName] = new Date().getTime()
                    const merged = {...existingSensorData,...newSensorData};


                    return merged;
                });

                console.log("24hour",consolidatedNewReadingData,state.readingsLast24HourAllSensors)
                state.readingsLast24HourAllSensors = consolidatedNewReadingData
                state.readingsLastFetch24HourAllSensors = lastFetch
                state.readingsLast24HourAllSensorsLoadingStatus = 'loaded'
            })
            .addCase(fetchReadings24Hour.rejected, (state, action) => {
                state.readingsLast24HourAllSensorsLoadingStatus = 'error';
                state.error = action.error.message;
            })
    },
});
/*
 * Export reducer for store configuration.
 */
export const telemetryReducer = telemerySlice.reducer;
export default telemetryReducer;

export const telemetryActions = telemerySlice.actions;
export const {setAll, setFilteredMetricConfig, setFocusedEntity, setFilteredLevels} = telemetryActions;

export const { selectAll, selectEntities, selectById } = telemetryAdapter.getSelectors();
export const getSlice = (rootState) => rootState[TELEMETRY_FEATURE_KEY];
const getWellnessReadings = (slice) => slice.wellnessReadings;
const getReadingsCache = (slice) => slice.readingsCache;
const getMetricsConfig = (slice) => slice.metricsConfig;


export const selectWellnessReadings = createSelector(
    getSlice,
    getWellnessReadings
);
export const selectWellnessReadingsLoadingStatus = createSelector(
    getSlice,
    (slice) => slice.wellnessReadingsLoadingStatus
);


export const selectReadingsByKey = createSelector(
    getSlice,
    (state,key)=>key,
    (slice,key) => slice.readingsCache[key]
);
export const selectReadingsLoadingStatus = createSelector(
    getSlice,
    (slice) => slice.readingsLoadingStatus
);


export const selectReadings24Hour = createSelector(
    getSlice,
    (slice) => slice.readingsLast24HourAllSensors
);
export const selectReadingsLastFetch24Hour = createSelector(
    getSlice,
    (slice) => slice.readingsLastFetch24HourAllSensors
);
export const selectReadingsLast24HourAllSensorsLoadingStatus = createSelector(
    getSlice,
    (slice) => slice.readingsLast24HourAllSensorsLoadingStatus
);


export const selectMetricsConfig = createSelector(
    getSlice,
    getMetricsConfig
);

export const selectGroupsLoadingStatus = createSelector(
    getSlice,
    (slice) => slice.groupsLoadingStatus
);
export const selectMetricsConfigLoadingStatus = createSelector(
    getSlice,
    (slice) => slice.metricsConfigLoadingStatus
);
export const selectFilteredPointNames = createSelector(
    getSlice,
    (slice) => slice.filteredPointNames
);
export const selectFilteredMetricConfigs = createSelector(
    getSlice,
    (slice) => slice.filteredMetricConfigs
);
export const selectFilteredLevels = createSelector(
    getSlice,
    (slice) => slice.filteredLevels
);
export const selectThemableElementsMappings = createSelector(
    getSlice,
    (slice) => slice.themableElementsMappings
);
export const selectFocusedEntity = createSelector(
    getSlice,
    (slice) => slice.focusedEntity
);

