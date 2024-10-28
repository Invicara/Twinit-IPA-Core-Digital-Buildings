import React from "react";
import { CirclePicker  } from 'react-color';

export const SystemColor = ({color, onChange}) => {
    return <div className='system-color-select'>
    <div className="system-color-title">
        <span className="select-title">System Color</span>
        <span className="select-desc">Items in this system with be shaded with the selected color</span>
    </div>
    <CirclePicker width={"100%"} color={color} onChange={(color) => onChange(color.hex)} />
</div>}
