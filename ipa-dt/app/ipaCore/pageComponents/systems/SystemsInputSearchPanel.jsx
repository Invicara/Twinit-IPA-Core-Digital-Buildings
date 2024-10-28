import React, { useState } from "react";
import {EnhancedFetchControl, StackableDrawer, ScriptedSelects} from "@invicara/ipa-core/modules/IpaControls";
import {asSelectOption, asSelectOptions} from "../../components/controls/ScriptedOptionsSelect";
import {EntityGroupAndFilterTree} from "./EntityGroupAndFilterTree";
import Select from 'react-select';

const defaultAdvancedSearchConfig = {
    id: 'advsrch', query: "<<ADVANCED_SEARCH>>", display: "Advanced Search",
    searchable: {
        Mark: {type: "enum"},
        "BA Asset": {type: "text"},
        'Revit Family': {type: "text"},
        'Revit Type': {type: "text"}
    }
}

export const SystemsInputSearchPanel = ({
                                            currentEntityType, searchOptions, onEntitySelectChange, entities, groups, filters, filterError, hiddenEntities,
                                            onFilterChange, onGroupChange, onEntitiesHidden, onEntityFetch, searchConfig = defaultAdvancedSearchConfig, setSpaceMode, clearfilterModeEntities
                                        }) => {

    const hideEntities = (selectedEntities) => onEntitiesHidden(_.differenceBy(entities,selectedEntities, '_id'));
    const [isFetching, setIsFetching] = useState(false)
    const [sourceFiles, setSourceFiles] = useState()
    
    const onEntityFetching = async (selector, value) => {
        setIsFetching(true)
        setSpaceMode(false)
        clearfilterModeEntities()
        await onEntityFetch(selector, value)
        setIsFetching(false)
    }
    
    return <StackableDrawer level={1} iconKey={'fa-filter'} defaultOpen={false} isDrawerOpen={false} tooltip={'Filter Model'}>
        <div className='fetch-container' style={!isFetching ? {display: 'block'} : {display: "none"}}>
            <Select
                className="entity-select"
                options={asSelectOptions(searchOptions)}
                value={currentEntityType && asSelectOption(currentEntityType)}
                onChange={onEntitySelectChange}
                placeholder={'Select an entity type to filter on'}
            />
            {currentEntityType && <><EnhancedFetchControl key={currentEntityType.singular}
                selectors={[searchConfig]}
                doFetch={onEntityFetching}
            />
            {filterError && <p className="filter-error">{filterError.message}</p>}
            <EntityGroupAndFilterTree
                entities={entities}
                groups={groups}
                filters={filters}
                onFilterChange={onFilterChange}
                onGroupChange={onGroupChange}
                selectedEntities={_.differenceBy(entities,hiddenEntities, '_id')}
                onEntitiesSelected={hideEntities}
            />
            </>}
        </div> 
        {isFetching && <div className='drawer-spinner'>Retrieving data...<i className="fas fa-spinner fa-spin"/></div> }
    </StackableDrawer>
}
