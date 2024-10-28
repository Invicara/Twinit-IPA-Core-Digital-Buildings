import React from "react";

export const SystemInput = ({currentValue, onChange, title, id, label}) => <div className={id}>
    <div className={`${id}-label`}>{title}</div>
    <input type="text" value={currentValue}
           onChange={e => onChange(e.target.value)}
           placeholder={`Create a ${label}`} className={`${id}-input`} />
</div>;
