import React, {useState, useEffect, useMemo} from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import {GenericMatButton} from "@invicara/ipa-core/modules/IpaControls"
import CreatableSelect from "react-select/creatable";
import _ from 'lodash'

const useStyles = makeStyles({
  formControl: {
    minWidth: 300,
    maxWidth: 600
  },
  container: {
    maxHeight: '100%'
  }
})

const asOptions = options => options.map(o => ({value: o, label: o, key: 0}))

const BimRow = (props) => {
  const [editable, setEditable] = useState(false)
  const [dtCategory, setDtCategory] = useState(null)
  const [dtType, setDtType] = useState(null)
  const [dtCatMatch, setDtCatMatch] = useState([])

  useEffect(() => {
    setDtCategory(props.row.dtCategory)
    setDtType(props.row.dtType)

  }, [props.row, props.typeMap])

  const theme = useTheme();
  const classes = useStyles();

  const handleDtCatMatchChange = (event) => {
    setDtCatMatch(event.target.value)
  }

  const onChange = (att, value) => {
    if (att === 'dtCategory') setDtCategory(value)
    else setDtType(value)
  }
  
  const onApply = () => {
    setEditable(false)
    props.onChange(props.row, {dtCategory: dtCategory, dtType: dtType}, dtCatMatch.length ? dtCatMatch : null)
  }
  
  const cancelEdit = () => {
    setEditable(false)
    setDtCategory(null)
    setDtType(null)
  }

  const getCellWidth = (att) => att === 'dtCategory' || att === 'dtType' ? 300 : 100

  const getTableCell = (columns, row, col, index, colIndex) => {

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

    if (!editable && (col === 'dtCategory' || col === 'dtType'))
      return <TableCell key={index+"-"+colIndex} width={getCellWidth(col)} onClick={() => setEditable(!editable)}>{row[col]}</TableCell>
    else if (col !== 'dtCategory' && col !== 'dtType')
      return <TableCell key={index+"-"+colIndex} width={getCellWidth(col)}>{row[col]}</TableCell>
    else if (col === 'dtCategory') {

      return <TableCell key={index+"-"+colIndex}>
        <CreatableSelect
          value={dtCategory ? asOptions([dtCategory]) : null}
          onChange={(opt) => onChange('dtCategory', opt.value)}
          options={asOptions(Object.keys(props.typeMap))}
          className="select-element"
          placeholder={`Select dtCategory`}
          menuPlacement="auto"
        />
        <FormControl className={classes.formControl}>
          <InputLabel id="apply-to-all-match">Apply to Matching:</InputLabel>
          <Select
            labelId="apply-to-all-match"
            id="dtCat-match-change"
            multiple
            value={dtCatMatch}
            onChange={handleDtCatMatchChange}
            input={<Input />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
          >
            {columns.filter(col => col !== 'dtCategory' && col !== 'dtType').map((name) => (
              <MenuItem key={name} value={name}>
                <Checkbox checked={dtCatMatch.indexOf(name) > -1} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

      </TableCell>

    }

    else if (col === 'dtType') {

      return <TableCell key={index+"-"+colIndex}>
        <CreatableSelect
          value={dtType ? asOptions([dtType]) : null}
          onChange={(opt) => onChange('dtType', opt.value)}
          options={props.typeMap[dtCategory] ? asOptions(props.typeMap[dtCategory].sort()) : []}
          className="select-element"
          placeholder={`Select dtType`}
          menuPlacement="auto"
        />

      </TableCell>

    }
  }

  return <TableRow key={'BimRow_'+props.index}>
    {props.columns.filter((col) => col === 'dtCategory' || col === 'dtType').map((col, colIndex) => getTableCell(props.columns, props.row, col, props.index, colIndex))}
    <TableCell key={'apply_'+props.index}>
    {editable && <div className="bimrow-apply-ctrls"><GenericMatButton onClick={onApply}>
          Apply
      </GenericMatButton>
      <span className="apply-cancel" onClick={cancelEdit}><i className="fas fa-times-circle fa-2x"></i></span></div>}
    </TableCell>  
    {props.columns.filter((col) => col !== 'dtCategory' && col !== 'dtType').map((col, colIndex) => getTableCell(props.columns, props.row, col, props.index, colIndex))}
  </TableRow>

}

const AddRow = ({columns, typeMap, onAdd}) => {
  
  const [dtCategory, setDtCategory] = useState(null)
  const [dtType, setDtType] = useState(null)
  
  const onChange = (att, value) => {
    if (att === 'dtCategory') setDtCategory(value)
    else setDtType(value)
  }
  
  const onApplyAdd = () => {
    
    onAdd(dtCategory, dtType)
    setDtCategory(null)
    setDtType(null)
    
  }
  
  return typeMap && onAdd ? <TableRow key='AddRow'>
    <TableCell key="add-dtcategory">
      <CreatableSelect
        value={dtCategory ? asOptions([dtCategory]) : null}
        onChange={(opt) => onChange('dtCategory', opt.value)}
        options={asOptions(Object.keys(typeMap))}
        className="select-element"
        placeholder={`Add or Select dtCategory`}
        menuPlacement="auto"
      />
    </TableCell>
    <TableCell key="add-dttype">
      <CreatableSelect
          value={dtType ? asOptions([dtType]) : null}
          onChange={(opt) => onChange('dtType', opt.value)}
          options={typeMap[dtCategory] ? asOptions(typeMap[dtCategory].sort()) : []}
          className="select-element"
          placeholder={`Add dtType`}
          menuPlacement="auto"
        />
    </TableCell>
    <TableCell>
      <GenericMatButton onClick={onApplyAdd} disabled={!dtCategory || !dtType}>
          Add
      </GenericMatButton>
    </TableCell>
    {columns.map((col) => {
        if (col !== 'dtCategory' && col !== 'dtType')
          return <TableCell key={col+'_forblankaddrow'}></TableCell>
    })}
  </TableRow> : null
}
  
  
export {BimRow, AddRow}