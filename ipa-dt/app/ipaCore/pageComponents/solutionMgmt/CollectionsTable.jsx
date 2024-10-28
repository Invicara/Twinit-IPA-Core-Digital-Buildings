import React, { useState, useEffect } from 'react'
import { CheckBoxOutlineBlank, CheckBox, Warning, Rowing } from "@material-ui/icons";
import { Tooltip } from "@material-ui/core";
import './CollectionsTable.scss'
import RelateFilesModal from './collectionsManagmentModals/RelateFilesModal'

import { Table } from "@invicara/ipa-core/modules/IpaControls";
import { EditIndexModalFactory } from './collectionsManagmentModals/EditIndexModal';
import { useStore, useDispatch } from "react-redux";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";

const CollectionsTable = ({ rows, headers, options, setCollectionsSelected, isIndexManagment, className, originalPromiseResult, tabName, setCollectionSelected2, collectionSelected2,
                            setCollectionSelected, collectionSelected, isRelateCollections, relateFilesAvailable, actions, fetchCollectionsAgain, onStatusChange, allowEditIndex, page, rowsPerPage}) => {
    


    //We compute which rows should be initially selected based on collectionSelected and collectionSelected2

    const idsToSelect = []
    if(collectionSelected?._id) idsToSelect.push(collectionSelected._id);
    if(collectionSelected2?._id) idsToSelect.push(collectionSelected2._id);

    const initialSelected = rows
        .filter((r) => r.some(c => idsToSelect.includes(c.key)))
        .map((_, id) => id);

    const [selected, setSelected] = useState(0)
    const [selectedRows, setSelectedRows] = useState(initialSelected);

        useEffect(() => {
            if(tabName === 'tab2') {
                setCollectionsSelected(0, false)
                setCollectionSelected2(undefined)
                setSelectedRows([0])
            } else {
                setSelected(0)
            }
        }, [tabName, page, rowsPerPage])
       
    const reduxStore = useStore();

    function relateFilesHandler(row) {
        actions.showModal(<RelateFilesModal actions={actions} collectionName={row[0].val} onStatusChange={onStatusChange} fetchCollectionsAgain={fetchCollectionsAgain} />)
    }

    const handleCheckboxChange = (idx) => {
        if(selectedRows.length >= 2) return
        let newRows = [...selectedRows, idx]
        setSelectedRows(newRows);
        setCollectionsSelected(idx, newRows.length === 2 ? true : false)
    }

    const handleRemoveCheck = (idx) => {
        if (selectedRows[0] === idx) {
            setCollectionSelected(undefined)
            if(selectedRows.length === 2) {
                setCollectionSelected(collectionSelected2)
                setCollectionSelected2(undefined)
            }
        }
        if (selectedRows[1] === idx) setCollectionSelected2(undefined)
        let newRows = selectedRows.filter(r => r !== idx)
        setSelectedRows(newRows)
    }

    const dispatch = useDispatch();

    function checkboxCell(idx) {
        return (
            <div className="checkbox-cell">
                {(idx === selectedRows[0]) || (idx === selectedRows[1]) ? 
                <CheckBox 
                    className="checkbox-checked" 
                    onClick={() => handleRemoveCheck(idx)}/> :
                <CheckBoxOutlineBlank 
                    className="checkbox-unchecked"
                    onClick={() => handleCheckboxChange(idx)} />}
            </div>
        )
    }

    const selectedCell = (idx) => {
        setCollectionsSelected(idx, false)
        setSelected(idx) 
      }

    function overViewCheckboxCell(idx) {
        return (
            <div className="checkbox-cell">
                {idx === selected ? <CheckBox className="checkbox-checked" /> :
                <CheckBoxOutlineBlank className="checkbox-unchecked" onClick={() => selectedCell(idx)}/>}
            </div>
          )
    }

    async function openEditIndexModal(row) {
        const collection = originalPromiseResult._list.find(e => e._name === row[0].val)
        const data = await dispatch(NamedUserItems.fetchNamedUserItemItems({undefined, ctx:{}, userType:collection._userType, userItemId:collection._userItemId})).unwrap()
        EditIndexModalFactory.create({reduxStore, row, data, collection, onStatusChange})
    }

    function editCell(row) {
        if (allowEditIndex) {
            return (
                <div onClick={() => openEditIndexModal(row)} className='edit_cell'>
                    <i className={'fa fa-pen'}></i><span>Edit Index</span>
                </div>
            )
        } else return (<div></div>)
    }

    function relateCollectionsCell(row) {
        return (
          <div className="relate-collections-cell" key={row}>
                <Tooltip title={
                    <div>
                        <b style={{fontSize: '13px', display: 'flex', justifyContent: 'center', paddingBottom: '3px'}}>Missing files</b>
                        <p style={{whiteSpace: 'pre-line', textAlign: 'center', color: '#DCDCDC'}}>{`There are some file missing, \nplease relate the items`}</p>
                    </div>
                }>
                    <div>
                        <Warning className="alert-icon" />
                        <span className="text" onClick={() => relateFilesHandler(row)}>Relate Files</span>
                    </div>
                </Tooltip>
          </div>
        ) 
    }

    const newRows = (rows) => {
        let rowsContainer = []

        rows.map((row, idx) => {
            let newRow = [...row]; 
            if (isRelateCollections && relateFilesAvailable.length >= 1) {
                relateFilesAvailable.map((collection) => {
                    if (collection === idx) {
                        Object.entries(row[3]).forEach(([key, value]) => {
                            if(key === 'val') return newRow[3] = {type: 'newText', val: [value, relateCollectionsCell(row)], className: 'related-cell'}

                        })
                    }
                })
            }

            if (!isIndexManagment && isRelateCollections) newRow.unshift({ type: '', val: checkboxCell(idx) })
            if (!isIndexManagment && !isRelateCollections) newRow.unshift({ type: '', val: overViewCheckboxCell(idx) })
            if (isIndexManagment) newRow.push({ type: '', val: editCell(row) })
            rowsContainer.push(newRow)
        })
        return rowsContainer
    }

    return (
            <Table
                headers={headers}
                rows={newRows(rows)}
                className={className}
                options={options}
            />
    );
};

export default CollectionsTable;