import {createSelector} from '@reduxjs/toolkit';
import _ from 'lodash';
import {Entities} from '@invicara/ipa-core/modules/IpaRedux/index.js'
import {getFilteredEntitiesBy} from "@invicara/ipa-core/modules/IpaUtils";

const sliceName = 'entitiesGeneral';
const getEntitiesSlice = store => store[sliceName]
export const getSelectedEntitiesIds = createSelector(getEntitiesSlice, entitiesSlice => entitiesSlice.selectedIds || [])

const baseSelectedEntitiesArray = _.memoize((_ids) => []);

const fromIDs_fixed = (entities, ids) => {
    const base = baseSelectedEntitiesArray(ids);
    entities.forEach(e => {
        if(_.includes(ids, e._id)){
            base.push(e);
        }
    })
    return base;
}

const getFilteredEntities = createSelector([Entities.getAllCurrentEntities, Entities.getAppliedFilters], (currentEntities, appliedFilters) =>
    _.isEmpty(Entities.getAppliedFilters) ? currentEntities : getFilteredEntitiesBy(currentEntities, appliedFilters)
)

export const getSelectedEntities = createSelector([getFilteredEntities, getSelectedEntitiesIds], fromIDs_fixed);
export const getAppliedGroups = createSelector(getEntitiesSlice, entitiesSlice => entitiesSlice.appliedGroups)



