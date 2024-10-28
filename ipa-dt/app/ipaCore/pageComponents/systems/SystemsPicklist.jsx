import React from "react";
import {EnhancedPickListSelect} from "@invicara/ipa-core/modules/IpaControls";


export const SystemsPicklist = ({currentValue, onChange, pickListConfig, compact = false}) => {
    return <EnhancedPickListSelect
        currentValue={currentValue}
        onChange={onChange}
        compact={compact}
        selects={pickListConfig.selects}
        pickListScript={pickListConfig.pickListScript}
        initialPickListType={pickListConfig.initialPickListType}
        canCreateItems={pickListConfig.canCreateItems}
        updateScript={pickListConfig.createPickListScript}/>
}
