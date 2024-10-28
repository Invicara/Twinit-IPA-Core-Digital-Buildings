import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import _ from 'lodash'
import {AddRow, BimRow} from './BimRow'

const useStyles = makeStyles({
  formControl: {
    minWidth: 300,
    maxWidth: 600
  },
  container: {
    maxHeight: '100%'
  }
})

const TypeMapBuilderTable = ({rows, columns, typeMap, onChange, onAdd}) => {
  
  const [tableRows, setTableRows] = useState(null)
  const [sortCol, setSortCol] = useState('foo')
  const [sortDesc, setSortDesc] = useState(true)
  
  const createBimRows = (rows, columns, typeMap, onChange) => {
    
    if (rows) {
      let bimRows = rows.map((row, index) => (
              <BimRow key={index} row={row} index={index} columns={columns} typeMap={typeMap} onChange={onChange}/>
      ))
      return bimRows
    }
    else return []
  }
  
  const setSort = (col) => {

    if (sortCol === col) {
      setSortDesc(!sortDesc)
    }
    else {
      setSortCol(col.slice(0))
      setSortDesc(true)
    }
  }
  
  useEffect(() => {

    if (rows) {
      let tempRows = _.cloneDeep(rows)
      console.log(sortCol, sortDesc)
      tempRows.sort((a,b) => {
        
        if (!a[sortCol] && !b[sortCol]) return 0
        
        if (sortDesc) {
          if (!a[sortCol]) return -1
          if (!b[sortCol]) return 1
          return a[sortCol].toUpperCase() > b[sortCol].toUpperCase() ? 1 : a[sortCol].toUpperCase() < b[sortCol].toUpperCase() ? -1 : 0
        }
        else {
          if (!a[sortCol]) return 1
          if (!b[sortCol]) return -1
          return a[sortCol].toUpperCase() < b[sortCol].toUpperCase() ? 1 : a[sortCol].toUpperCase() > b[sortCol].toUpperCase() ? -1 : 0
        }

      })

      let tableRows = createBimRows(tempRows, columns, typeMap, onChange)
      setTableRows(tableRows)
    }

  }, [sortCol, sortDesc])
  
  useEffect(() => {
    
    if (columns && rows) {
      let tableRows = createBimRows(rows, columns, typeMap, onChange)
      setTableRows(tableRows)
    }
    
  }, [rows, typeMap, columns])
  
  const classes = useStyles();
  
  const HeaderCell = ({col, children}) => {
    
    return <TableCell key={'head'+col}>
              <span onClick={() => setSort(col)}>
              {sortCol === col ? sortDesc ? <i className="fas fa-long-arrow-alt-down"></i> : <i className="fas fa-long-arrow-alt-up"></i> : null}
                {children}
              </span>
          </TableCell>
  }

  return (
    <TableContainer component={Paper} className={classes.container}>
      <Table stickyHeader className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            {columns && columns.filter((col) => col === 'dtCategory' || col === 'dtType').map((col) => <HeaderCell key={'head'+col} col={col}>{col}</HeaderCell>)}
            <TableCell key='apply-col'></TableCell>
            {columns && columns.filter((col) => col !== 'dtCategory' && col !== 'dtType').map(col => <HeaderCell key={'head'+col} col={col}>{col}</HeaderCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          <AddRow columns={columns} typeMap={typeMap} onAdd={onAdd} />
          {tableRows}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TypeMapBuilderTable