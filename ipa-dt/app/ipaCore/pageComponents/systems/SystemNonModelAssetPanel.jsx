import React, { useState } from "react";
import {StackableDrawer} from "@invicara/ipa-core/modules/IpaControls";
import {EntityGroupAndFilterTree} from "./EntityGroupAndFilterTree";

export const SystemNonModelAssetPanel = ({
    nonModelElements, groups, filters, onFilterChange, onGroupChange, onNonModelElementFetch, onNonModelElementSelect, selectedEntities, clearNonModelElements
}) => {
    const [isFetching, setIsFetching] = useState(false)
    
    const fetch = async () => {
        setIsFetching(true)
        await onNonModelElementFetch()
        setIsFetching(false)
    }
    return (<StackableDrawer level={2} iconKey={'fa-cube'} defaultOpen={false} onOpen={fetch} onClose={()=>clearNonModelElements()} isDrawerOpen={false} tooltip={"Non-modeled Elements"}>
       <div className='fetch-container'>
            {isFetching ? <div className='drawer-spinner'>Retrieving data...<i className="fas fa-spinner fa-spin"/></div>  :
            <EntityGroupAndFilterTree
                entities={nonModelElements}
                groups={groups}
                filters={filters}
                onFilterChange={onFilterChange}
                onGroupChange={onGroupChange}
                selectedEntities={selectedEntities}
                onEntitiesSelected={onNonModelElementSelect}
                useDiff={true}
            />}
        </div>
    </StackableDrawer>)
}
