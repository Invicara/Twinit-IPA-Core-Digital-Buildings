import React from "react";
import Select from 'react-select';

export const SystemsSelect = ({currentValue, onChange, options, title}) => <div className='scripted-selects-control'>
    <span className="select-title">{title}</span>
    <Select
        isMulti={false}
        value={currentValue ? {
            value: currentValue,
            label: currentValue,
            key: currentValue
        } : null}
        onChange={selected => onChange(selected.value)}
        options={options.map(opt => ({value: opt, label: opt, key: opt}))}
        className="select-element"
        closeMenuOnSelect={true}
        isClearable={false}
        placeholder={`Select a Status`}
        isDisabled={false}
        menuPlacement="auto"
        menuPosition="fixed"
    />
</div>;
