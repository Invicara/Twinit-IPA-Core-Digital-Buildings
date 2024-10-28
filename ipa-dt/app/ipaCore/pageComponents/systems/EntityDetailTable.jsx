import React from "react";
import {SquareInSquareCheckbox} from "@invicara/ipa-core/modules/IpaControls"
import _ from "lodash";
import clsx from "clsx";
import {InfoViewer} from "./InfoViewer";

const columns = [
    {
        "name": "Name",
        "accessor": "Entity Name"
    },
    {
        "name": "Entity Type",
        "accessor": "type.singular"
    }
]


export const EntityDetailTable = ({entities, allChecked, onCheck, onAllCheck, onDelete}) => {

    const getInfoForModel = (modelElement) => <>
        {_.isEmpty(modelElement.relatedActualEntities) ? null : <InfoViewer iconClass={"fas fa-info"} entity={modelElement.relatedActualEntities[0]}/>}  {/*So far there's always only one*/}
        <InfoViewer iconClass={"fas fa-cubes"} entity={modelElement}/>
    </>

    const getInfoForEntity = (entity) => <>
        <InfoViewer iconClass={"fas fa-info"} entity={entity}/>
        {_.isEmpty(entity.modelData) ? null : <InfoViewer iconClass={"fas fa-cubes"} entity={entity.modelData}/>}
    </>

    return !_.isEmpty(entities) && <table className="entity-table">
        <thead>
        <tr className="entity-table-header">
            <th className="short">
                <SquareInSquareCheckbox checked={allChecked} onChange={onAllCheck}/>
            </th>
            {columns.map(col => <th key={col.name}>{col.name}</th>)}
            <th className={'info-column'} key={'info'}>Element Information</th>
        </tr>
        </thead>
        <tbody>
        {entities.map((entity, i) => <tr key={i} className={clsx("entity-table-body", i % 2 ? 'even' : 'odd')}>
            <td className="short">
                <SquareInSquareCheckbox checked={entity.checked} onChange={() => onCheck(entity)}/>
            </td>
            {columns.map(col =>{
                const value = _.get(entity, col.accessor);
                return <td key={col.name}>{typeof value === 'object' ? value.val: value}</td>
            })}
            <td key={'info'}>
                <div className={'info-cell'}>
                    {entity.isModelElement? getInfoForModel(entity) : getInfoForEntity(entity)}
                    <div><i onClick={()=>onDelete([entity])} title='Delete' className='info-icon fas fa-trash'></i></div>
                </div>
            </td>
        </tr>)}
        </tbody>
    </table>
}
