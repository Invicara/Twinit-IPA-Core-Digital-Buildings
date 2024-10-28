import React, {useState} from "react";
import Select from "react-select";
import _ from "lodash";
import {ScriptCache} from "@invicara/ipa-core/modules/IpaUtils";
import { useEffect } from "react";

export const selectStyles = (provided, {isFocused, isDisabled}) => ({
    backgroundColor: isDisabled ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 100%)",
    border: `2px solid ${isFocused && !isDisabled ? 'var(--app-accent-color);' : '#E6E6E6'}`,
    borderRadius: '5px',
    display: 'flex'
});

export const asSelectOption = option => ({value: option, label: option.plural, key: option.plural})

export const asSelectOptions = options => options.map(asSelectOption)

export const ScriptedOptionsSelect = ({onChange, selectOverrideStyles, selectOptions, disabled, placeholder, label, selectedOption}) => {

    const [fetching, setFetching] = useState(false);
    
    const runOptionScript = async (selected) => {            
        const scriptResult = selected ? await ScriptCache.runScript(selected.value.script) : [];
        onChange({scriptResult: scriptResult, selected: selected.value})
        setFetching(false);
    };
    
    const handleChange = (selected) => {        
        setFetching(true);        
        runOptionScript(selected);        
    };

    return (
            <div className='scripted-options-select'>
                {label && <label>{label}</label>}
                <Select
                        styles={selectOverrideStyles || {control: selectStyles}}
                        isMulti={false}
                        value={selectedOption}
                        onChange={selected => handleChange(selected)}
                        options={asSelectOptions(selectOptions)}
                        className="select-element"
                        closeMenuOnSelect={true}
                        isClearable={false}
                        placeholder={placeholder}
                        isDisabled={_.isEmpty(selectOptions) || disabled || fetching}
                        menuPlacement="auto"
                        menuPosition="fixed"
                    />
            </div>
            )
};
