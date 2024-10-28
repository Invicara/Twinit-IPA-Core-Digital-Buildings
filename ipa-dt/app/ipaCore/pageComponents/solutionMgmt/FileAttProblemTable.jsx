


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
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import _ from 'lodash'

const FileAttProblemTable = (props) => {
  
  const [viewBy, setViewBy] = useState('attributes')
  
  const asOptions = options => options.map(o => ({value: o, label: o, key: 0}))
  
  const getDuplicateValues = (att, value) => {
    console.log(att, value, props.fileAtts)
    
    let valueArray = props.fileAtts[att]
    console.log(valueArray)
    return valueArray.filter((val) => {
      return val.toUpperCase() === value
    })

  }
  
  const getByProblems = () => {
    
    let problems = []
    let problemMsgs = []
    
    props.problemObjects.forEach((probObj) => {
      console.log(probObj)
      
      probObj.problems.forEach((prob) => {
        if (!problemMsgs.includes(prob.problemMessage)) {
          problems.push({
            name: prob.problemMessage,
            problems: [{
                problemMessage: prob.problemMessage,
                problemAttr: prob.problemAttr,
                problemValue: prob.problemValue,
                problemValues: getDuplicateValues(prob.problemAttr, prob.problemValue)
            }]
          })
        }
      })
    })
    
    console.log(problems)
    return problems
    
  }
  
  
  
  const handleViewByChange = (e) => {
    setViewBy(e.target.value)
  }
  
  const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });
  
  function FileRow(row) {
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
                        <TableCell width='15%'>{probRow.problemValue}</TableCell>
                        <TableCell>
                          <Select options={asOptions(getDuplicateValues(probRow.problemAttr, probRow.problemValue))}
                                  onChange={(newValue) => props.replaceDuplicateAtts(probRow.problemAttr, probRow.problemValue, newValue.value)}
                                  menuPortalTarget={document.body}/>
                        </TableCell>
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
                      <TableCell>Problem Values</TableCell>
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
                        <TableCell width='15%'>{probRow.problemValues.join(', ')}</TableCell>
                        <TableCell>
                          <Select options={asOptions(probRow.problemValues)}
                                  onChange={(newValue) => props.replaceDuplicateAtts(probRow.problemAttr, probRow.problemValue, newValue.value)}
                                  menuPortalTarget={document.body}/>
                        </TableCell>
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
        <div className="viewby-container">
          <div className="viewby-label">View by:</div>
          <FormControl component="fieldset">
            <RadioGroup aria-label="viewby" name="viewby" value={viewBy} onChange={handleViewByChange} row={true}>
              <FormControlLabel labelPlacement="end" value="attributes" control={<Radio />} label="Attributes" />
              <FormControlLabel labelPlacement="end" value="problems" control={<Radio />} label="Problem" />
            </RadioGroup>
          </FormControl>
        </div>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>{viewBy === 'attributes' ? 'Attribute Name' : 'Problem'}</TableCell>
              <TableCell align="right">Problem Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {viewBy === 'attributes' && props.problemObjects.map((row) => (
              <FileRow key={row.name} problemObject={row} />
            ))}
            {viewBy === 'problems' && getByProblems().map((row) => (
              <ProblemRow key={row.name} problemObject={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  
}

export default FileAttProblemTable