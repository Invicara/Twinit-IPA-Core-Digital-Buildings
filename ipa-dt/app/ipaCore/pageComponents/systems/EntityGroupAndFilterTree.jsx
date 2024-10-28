import React from "react";
import {GroupAndFilterControl} from '@invicara/ipa-core/modules/IpaControls' ;
import {ReactiveTreeControl} from "@invicara/ipa-core/modules/IpaControls";
import {useNodeIndexFromGroupAndFilter} from "./reactive-tree-control/useNodeIndexFromGroupAndFilter";
  
import './EntityGroupAndFilterTree.scss'

export const EntityGroupAndFilterTree = ({entities, groups, filters, onFilterChange, onGroupChange,
                                      nonFilterableProperties = [], nonGroupableProperties = [], fetching = false,  selectedEntities, onEntitiesSelected, useDiff
}) => {
    const [nodeIndex, handleNodeIndexChange] = useNodeIndexFromGroupAndFilter(groups,filters, entities, selectedEntities, onEntitiesSelected, useDiff);

    return <div>
            <GroupAndFilterControl
                fetchedEntities={entities}
                selectedGroups={groups}
                selectedFilters={filters}
                fetching={fetching}
                onFilterChange={onFilterChange}
                onGroupChange={onGroupChange}
                nonFilterableProperties={nonFilterableProperties}
                nonGroupableProperties={nonGroupableProperties}
            />
            <ReactiveTreeControl nodeIndex={nodeIndex} onNodeIndexChange={handleNodeIndexChange} />
    </div>
}
