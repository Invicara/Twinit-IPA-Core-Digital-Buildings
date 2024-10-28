


import React, {useEffect, useRef, useState} from "react"
import Select from "react-select"
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Collapse from '@material-ui/core/Collapse'
import IconButton from '@material-ui/core/IconButton'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'

const FilesProblemTable = (props) => {
  
  const asOptions = options => options.map(o => ({value: o, label: o, key: 0}))
  
  const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });
  
  function ProblemRow(row) {
    const [open, setOpen] = React.useState(false)
    const classes = useRowStyles()
    return (
      <React.Fragment>
        <TableRow className={classes.root} onClick={() => setOpen(!open)}>
          <TableCell>
            <IconButton aria-label="expand row" size="small">
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            {row.problemObject.name}
          </TableCell>
          <TableCell align="right">{row.problemObject.problems.length}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="h6" gutterBottom component="div">
                  Problems
                </Typography>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Message</TableCell>
                      <TableCell>Attribute</TableCell>
                      <TableCell>Problem Value</TableCell>
                      <TableCell>Fix Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.problemObject.problems.map((probRow) => (
                      <TableRow key={probRow.problemAttr}>
                        <TableCell width='20%' component="th" scope="row">
                          {probRow.problemMessage}
                        </TableCell>
                        <TableCell width='15%'>{probRow.problemAttr}</TableCell>
                        <TableCell>{probRow.problemValue}</TableCell>
                        <TableCell width='15%'>File name problems cannot be fixed here</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }
  
  return <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>File Name</TableCell>
              <TableCell align="right">Problem Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.problemObjects.map((row) => (
              <ProblemRow key={row.name} problemObject={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  
}

export default FilesProblemTable