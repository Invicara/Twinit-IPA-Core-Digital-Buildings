import React from "react";
import {SystemInput} from "./SystemInput";
import {SystemsPicklist} from "./SystemsPicklist";
import {SystemsSelect} from "./SystemsSelect";
import {SystemColor} from "./SystemColor";

export const SystemEditCreatePanel = ({systemName, setSystemName, systemDescription, setSystemDescription, systemCategoryType, setSystemCategoryType, systemStatus, setSystemStatus,
    systemColor, setSystemColor, picklistSelectsConfig, systemStatusConfig}) => {
    return <div>
        <SystemInput title={"System Name"} currentValue={systemName} onChange={setSystemName} id='system-name' label='System Name' />
        <SystemInput title={"System Description"} currentValue={systemDescription} onChange={setSystemDescription} id='system-description' label='System Description' />
        <SystemsPicklist
            currentValue={systemCategoryType}
            onChange={setSystemCategoryType}
            pickListConfig={picklistSelectsConfig} />
        <SystemsSelect
            title={"System Status"}
            currentValue={systemStatus}
            onChange={setSystemStatus}
            options={systemStatusConfig} />
        <SystemColor onChange={setSystemColor} color={systemColor} />

    </div>
}
