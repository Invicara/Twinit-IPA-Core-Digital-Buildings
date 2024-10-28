import React from "react";
import _ from "lodash";

import clsx from "clsx";

const defColumns = [
    {
        "name": "Name",
        "accessor": "System Name"
    },
    {
        "name": "Category",
        "accessor": "properties.System Category"
    }    
]

export const SystemsTable = ({columns = defColumns, systems, onClick}) => {

    return !_.isEmpty(systems) && <div className="entity-table">
        <div className="entity-table-header">
            {columns.map(col => <div key={col.name}>{col.name}</div>)}
        </div>
        <div className="entity-table-body">
        {systems.map((system, i) => <div key={i} className={clsx("entity-table-body-row", i % 2 ? 'even' : 'odd')}>
            {columns.map(col =>{
                const value = _.get(system, col.accessor) || "Unspecified";
                return <div key={col.name} onClick={() => onClick(system._id)}>{typeof value === 'object' ? value.val: value}</div>
            })}
        </div>)}
        </div>
    </div>
}
