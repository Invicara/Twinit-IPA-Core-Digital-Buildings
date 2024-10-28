/**
 * ****************************************************************************
 *
 * INVICARA INC CONFIDENTIAL __________________
 *
 * Copyright (C) [2012] - [2019] INVICARA INC, INVICARA Pte Ltd, INVICARA INDIA
 * PVT LTD All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains the property of
 * Invicara Inc and its suppliers, if any. The intellectual and technical
 * concepts contained herein are proprietary to Invicara Inc and its suppliers
 * and may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this information
 * or reproduction of this material is strictly forbidden unless prior written
 * permission is obtained from Invicara Inc.
 */

import React, {useEffect, useState} from "react"
import {GenericMatButton, StackableDrawer, FancyTreeControl} from "@invicara/ipa-core/modules/IpaControls"
import {ScriptHelper} from "@invicara/ipa-core/modules/IpaUtils"
import _ from 'lodash'
import TypeMapBuilderTable from "./TypeMapBuilderTable"
import {makeStyles, useTheme} from '@material-ui/core/styles'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import ListItemText from '@material-ui/core/ListItemText'
import Select from '@material-ui/core/Select'
import Checkbox from '@material-ui/core/Checkbox'


const TypeMapBuilder = ({onLoadComplete, handler}) => {
  
  const useStyles = makeStyles({
    formControl: {
      width: '100%'
    }
  })

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8; 
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };
  
  const theme = useTheme();
  const classes = useStyles();
  
  const [readingXlsx, setReadingXlsx] = useState(false)
  
  const [bimTypes, setBimTypes] = useState(null)
  const [bimTypesModified, setBimTypesModified] = useState(false)
  const [bimTypesSheetName, setBimTypesSheetName] = useState('Sheet1')
  const [typeMap, setTypeMap] = useState(null)
  const [columns, setColumns] = useState(null)
  const [tree, setTree] = useState(null)
  
  const [filters, setFilters] = useState(null)
  const [filterOptions, setFilterOptions] = useState({})
  const [filteredBimTypes, setFilteredBimTypes] = useState(null)
  
  const [copyFromSheetName, setCopyFromSheetName] = useState('Sheet1')
  
  useEffect(onLoadComplete, [])
  
  const getColumns = (imported) => {
    
    let columnNames = Object.keys(imported[0]).sort()
    let columns = []
    columnNames.forEach((col) => {
      if (col !== "rowId")
        columns.push(col)
    })
    return columns
    
  }
 
  useEffect(() => {
    const getTypeMap = async () => {
    
      if (bimTypes) {

        let typeMap = {}
        let dtCategories = []

        bimTypes.forEach((row) => {

          if (row.dtCategory && !dtCategories.includes(row.dtCategory)) {
            dtCategories.push(row.dtCategory)
            typeMap[row.dtCategory] =[]
          }

          if (row.dtCategory && row.dtType && !typeMap[row.dtCategory].includes(row.dtType))
            typeMap[row.dtCategory].push(row.dtType)

        })

        setTypeMap(typeMap)
        makeTree(typeMap)
      }
    }
    
    const getFilterData = async () => {
      
      if (columns && bimTypes) {
      
        let newFilters = {}
        columns.forEach(col => newFilters[col] = [])
        if(!filters) {
          setFilters(newFilters)
        }

        let newFilterOptions = _.cloneDeep(newFilters)
        bimTypes.forEach((row) => {

          columns.forEach((col) => {

            if (row[col] && !newFilterOptions[col].includes(row[col]))
              newFilterOptions[col].push(row[col])

          })

        })
        
        columns.forEach(c => newFilterOptions[c].sort())
        
        setFilterOptions(newFilterOptions)
      }
    }
    setTypeMap(null)
    setTree(null)
    getFilterData()
    getTypeMap()
    getFilteredBimTypes()

  }, [bimTypes])
  
  const getXlsAsJSON = () => {
    setReadingXlsx(true)
    
    return ScriptHelper.executeScript(handler.config.scripts.importXls, {sheetName: bimTypesSheetName}).then((imported) => {

        let keys = Object.keys(imported[0])
        imported = imported.filter((row) => {
          
          for (let i = 0; i < keys.length; i++) {
            if (row[keys[i]]) return true
          }
          return false
        })
        
        let rowId = 0
        imported.forEach((row) => {
          row.rowId = rowId++
        })
        
        setReadingXlsx(false)
        return imported
    })
    
  }
  
  const getBimTypesXlsx = async () => {
    if (bimTypes) {
      setBimTypes(null)
      setFilteredBimTypes(null)
      setTypeMap(null)
    }
    
    getXlsAsJSON().then((imported) => {
      let columns = getColumns(imported)
      setColumns(columns)
      setBimTypes(imported)
      setFilteredBimTypes(imported)
      
    })
  }
  
  const copyBimTypes = async () => {
    let imported = await getXlsAsJSON()
    
    let tempBimTypes = [...bimTypes]
    tempBimTypes.forEach((bt) => {
      let copyThis = _.find(imported, {"Revit Category": bt["Revit Category"], "Revit Family": bt["Revit Family"], "Revit Type": bt["Revit Type"]})
      console.log(bt, imported, copyThis)
      if (copyThis) {
        bt["dtCategory"] = copyThis["dtCategory"]
        bt["dtType"] = copyThis["dtType"]
      }
      
    })
    
    setBimTypes(tempBimTypes)
    setBimTypesModified(true)
  }
  
  const replaceValues = (att, oldVal, newVal, parent) => {
    console.log(att, oldVal, newVal)
    let tempBimTypes = [...bimTypes]
    
    tempBimTypes.forEach((bt) => {
      if (bt[att] === oldVal) {
        
        if (parent && bt.dtCategory === parent)
          bt[att] = newVal
        else if (!parent) bt[att] = newVal
      }
        
    })
    
    setBimTypes(tempBimTypes)
  }
  
  const downloadTypeMap = (e) => {
    
    e.preventDefault()
    
    let clonedBimTypes = _.cloneDeep(bimTypes)
    
    clonedBimTypes.forEach((bt) => delete bt.rowId)
    
    ScriptHelper.executeScript(handler.config.scripts.exportObjectsToXls, {objects: clonedBimTypes, sheetname: bimTypesSheetName, filename: "Updated Bim Types.xlsx"}).then(() => {
      setBimTypesModified(false)
    })
    
  }
  
  const LeafNode = (props) => {
    const [editable, setEditable] = useState(false)
    const [newValue, setNewValue] = useState(props.value)
    
    const onChange = (newVal) => {
      setNewValue(newVal)
    }
    
    return <span>
    {editable && <span>
      <i className='fas fa-save' onClick={() => props.onChange(props.att, props.value, newValue, props.parent)}></i>
      <input type='text' value={newValue} onChange={(e) => onChange(e.target.value)}/>
    </span>}
    {!editable && <span onClick={(e) => setEditable(!editable)}>{newValue}</span>}
    </span>
    
    
  }

  const leafNodeRenderer = (entity) => <LeafNode att='dtType' value={entity["dtType"]} parent={entity["dtCategory"]} onChange={replaceValues}/>
  
  const BranchNode = ({groupName, values}) => {
    const [editable, setEditable] = useState(false)
    const [newValue, setNewValue] = useState(groupName)
    
    const onChange = (newVal) => {
      setNewValue(newVal)
    }
    
    const onSave = () => {
      setEditable(false)
      replaceValues('dtCategory', groupName, newValue)
    }
    
    const sumChildren = (values, acc) => {
        if (Array.isArray(values)) {
            return acc + values.length
        }
        Object.keys(values).forEach(key => {
            acc = sumChildren(values[key], acc)
        })
        return acc
    }
    
    return <span>
    
      {!editable && <span onClick={(e) => setEditable(!editable)}>
            {groupName}
            <span className="count" style={{fontSize: "0.8em"}}>{sumChildren(values, 0)}</span>
      </span>}
      
      {editable && <span>
        <i className='fas fa-save' onClick={onSave}></i>
        <input type='text' value={newValue} onChange={(e) => onChange(e.target.value)}/>
      </span>}
      
      
    </span>
  
  }

  const branchNodeRenderer = (groupName, values) => {
    
    return <BranchNode groupName={groupName} values={values} replaceValues={replaceValues}/>
    
  }
  
  const makeTree = (typeMapInfo) => {
    setTree(null)
    
    let nextid = 0;
    let tree = {}
    
    let dtCategories = Object.keys(typeMapInfo)
    
    dtCategories.sort().forEach((cat) => {
      
      tree[cat] = []
      
      typeMapInfo[cat].sort().forEach((type) => {
        tree[cat].push({
          _id: nextid++,
          dtCategory: cat,
          dtType: type
        })
      })
      
    })
    console.log(tree)
    setTree(tree)
  }
  
  const onChange = (row, atts, matchInfo) => {
    
    let tempBimTypes = [...bimTypes]
    
    let search = {}
    if (matchInfo) {
      matchInfo.forEach((info) => {
        search[info] = row[info]
      })
    } else
      search.rowId = row.rowId
    
    let matches = _.filter(tempBimTypes, search)
    
    matches.forEach((match) => {
    
      let origMatch = _.findIndex(tempBimTypes, {rowId: match.rowId})
    
     tempBimTypes[origMatch].dtCategory = atts.dtCategory
      
      if (match.rowId === row.rowId)
        tempBimTypes[origMatch].dtType = atts.dtType
    })
    
    setBimTypes(tempBimTypes)
    setBimTypesModified(true)
  }
  
  const onAdd = (cat, type) => {
    console.log(cat, type)
    
    if (cat && type) {
      let comboExists = _.find(bimTypes, {dtCategory: cat, dtType: type})
      
      if (!comboExists) {
        let tempBimTypes = [...bimTypes]
        tempBimTypes.push({dtCategory: cat, dtType: type})
        let tempFilteredBimTypes = [...filteredBimTypes]
        tempFilteredBimTypes.push({dtCategory: cat, dtType: type})
        setBimTypes(tempBimTypes)
        setBimTypesModified(true)
      }

    }
  }
  
  const onFilterChange = (filter, value) => {
    
    let tempFilters = Object.assign({}, filters)
    tempFilters[filter] = value
    
    setFilters(tempFilters)
    
  }
  
  const getFilteredBimTypes = () => {
    
    const allFiltersEmpty = () => {
      let allEmpty = true
      let filterNames = filters ? Object.keys(filters) : []
      if (filterNames.length === 0) return allEmpty
      for (let i = 0; i < filterNames.length; i++) {
        if (filters[filterNames[i]].length > 0) {
          allEmpty = false
          break
        }
      }
      return allEmpty
    }
    
    const filtersWithValues = () => {
      let filterNames = Object.keys(filters)
      let filterNamesWithValues = []
      
      filterNames.forEach((fil) => {
        if (filters[fil].length > 0)
          filterNamesWithValues.push(fil)
      })
      return filterNamesWithValues
    }
    
    let newFilteredBimTypes
    if (allFiltersEmpty()) 
      newFilteredBimTypes = bimTypes
    else {

      let filtersToApply = filtersWithValues()

      newFilteredBimTypes = _.filter(bimTypes, (row) => {

          let compRes = filtersToApply.map((f) => {
            return _.includes(filters[f], row[f]) || (filters[f].includes('Not Set') && !row[f])

          })

          return compRes.every(Boolean)
      })
    }

    setFilteredBimTypes(newFilteredBimTypes)
    
  }
  
  const clearAllFilters = (e) => {
    if (e) e.preventDefault()
    
    let newFilters = {}
    columns.forEach(col => newFilters[col] = [])
    setFilters(newFilters)
    setFilteredBimTypes(bimTypes)
  }
  
  const getTreeControl = () => {
    
    if (typeMap && tree)
      return <FancyTreeControl className="entity-tree"
          name={"typemap_tree"}
          renderLeafNode={leafNodeRenderer}
          renderBranchNode={branchNodeRenderer}
          selectedIds={[]}
          tree={tree}
        />
    else return null
    
    
  }
  
  
  return <div className='typeMapBuilderView'>
    
    <StackableDrawer level={1} iconKey={bimTypesModified ? 'fa-file-download' : 'fa-file-excel'}>
      <div>
        <div className='button-container'>
        {readingXlsx && <div className="reading-xlsx-notice"><i className="fas fa-spinner fa-spin"></i> Reading xlsx file...</div>}
          <div className='button-group'>
            <div className='button-group-label'>Sheet Name:</div>
            <input className='form-control' value={bimTypesSheetName} onChange={(e) => setBimTypesSheetName(e.target.value)} type='text' />
            <div className='button-item'>
              {!bimTypes && <i className="far fa-square fa-2x"></i>}
              {bimTypes && <i className="fas fa-check-square fa-2x"></i>}
              <GenericMatButton onClick={getBimTypesXlsx}>
                Select BIM Types xlsx
              </GenericMatButton>
            </div>
          </div>
          <div className='button-group'>
            <div className='button-group-label'>Sheet Name:</div>
            <input className='form-control' value={copyFromSheetName} onChange={(e) => setCopyFromSheetName(e.target.value)} type='text' />
            <div className='button-item'>
              <GenericMatButton onClick={copyBimTypes}>
                Copy from...
              </GenericMatButton>
            </div>
          </div>
        </div>
        <div className='download-container'>
          <div className='help-text'>
            Select a BIM Types file to begin or continue assigning dtCategories and dtTypes to the Type Map.
          </div>
          <div>
            <div className='download-header'>Downloads</div>
            {!bimTypesModified && <div>No changes have been made yet to download</div>}
            {bimTypesModified && <ul>
              {bimTypesModified && <li><a href='#' onClick={downloadTypeMap}>Type Map</a></li>}
            </ul>}
          </div>
        </div>
      </div>
    </StackableDrawer>
    <StackableDrawer level={2} iconKey={'fa-sitemap'} defaultOpen={false}>
      <div className="typemap-container">
        {!typeMap && <div>Select a BIM Types file to display Type Map</div>}
        {(typeMap && !Object.keys(typeMap).length) && <div>Type Map is empty</div>}
        {getTreeControl()}
      </div>
    </StackableDrawer>
    <StackableDrawer level={3} iconKey={'fa-filter'} defaultOpen={false}>
      {typeMap && <div className='filter-container'>
      <div className='filter-header'>Filters:<hr/></div>
      <div className='filter-filters'>
        {filters && Object.keys(filters).map(f => <FormControl className={classes.formControl} key={f+'formcontrol'}>
          <InputLabel id={f+'filteridlabel'}>{f}</InputLabel>
          <Select
            labelId={f+'filteridlabel'}
            id={f+'filterid'}
            multiple
            value={filters[f]}
            onChange={(e) => onFilterChange(f, e.target.value)}
            input={<Input />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
          >
            <MenuItem key={'notset'} value={'Not Set'}>
                <Checkbox checked={filters[f].indexOf('Not Set') > -1} />
                <ListItemText primary='Not Set' />
            </MenuItem>
            {filterOptions[f].map((name) => (
              <MenuItem key={name} value={name}>
                <Checkbox checked={filters[f].indexOf(name) > -1} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>)}
      </div>
      <div className='filter-button'>
        <a href="#" onClick={clearAllFilters}>Clear All</a>
        <GenericMatButton onClick={getFilteredBimTypes}>Filter</GenericMatButton>
      </div>
    </div>}
      
    </StackableDrawer>
    
    <div className="content">
      
      <TypeMapBuilderTable 
        columns={columns}
        rows={filteredBimTypes} 
        typeMap={typeMap}
        onChange={onChange}
        onAdd={onAdd}
      />
      
      
    </div>

</div>
    
}

export default TypeMapBuilder;
