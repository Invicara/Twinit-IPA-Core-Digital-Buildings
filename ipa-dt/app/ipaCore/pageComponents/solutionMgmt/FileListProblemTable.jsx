


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

const FileListProblemTable = (props) => {
  
  const [viewBy, setViewBy] = useState('problems')
  
  const asOptions = options => options.map(o => ({value: o, label: o, key: 0}))
  
  const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });
  
  const handleViewByChange = (e) => {
    setViewBy(e.target.value)
  }
  
  const getByProblems = () => {
    
    let problems = []
    let problemMessages = []
    
    props.problemObjects.forEach((probObj) => {
      
      probObj.problems.forEach((problem) => {
        
        if (!problemMessages.includes(problem.problemMessage)) {
          problemMessages.push(problem.problemMessage)
          problems.push({
            name: problem.problemMessage,
            problems: [{
                problemMessage: [probObj.name],
                problemAttr: problem.problemAttr,
                problemValue: problem.problemValue,
                problemValues: [problem.problemValue]
            }]
          })
          
        } else {
          
          let existingProblem = _.find(problems, {name: problem.problemMessage})
          if (!existingProblem.problems[0].problemMessage.includes(probObj.name))
            existingProblem.problems[0].problemMessage.push(probObj.name)
          if (!existingProblem.problems[0].problemValues.includes(problem.problemValue))
            existingProblem.problems[0].problemValues.push(problem.problemValue)
        }
        
      })
      
    })
    
    console.log(problems)
    return problems
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
          <TableCell align="right">{row.problemObject.problems[0].problemMessage.length}</TableCell>
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
                      <TableCell>Files</TableCell>
                      <TableCell>Attribute</TableCell>
                      <TableCell>Problem Value</TableCell>
                      <TableCell>Fix Value</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.problemObject.problems.map((probRow) => (
                      <TableRow key={probRow.problemAttr}>
                        <TableCell width="20%" component="th" scope="row">
                          <ul className="problem-files-message">
                            {probRow.problemMessage.map((filename) => {
                              return <li key={filename}>{filename}</li>
                            })}
                          </ul>
                        </TableCell>
                        <TableCell width='15%'>{probRow.problemAttr}</TableCell>
                        <TableCell width='15%'>{probRow.problemValue}</TableCell>
                        <TableCell>
                          <Select options={asOptions(props.fileAtts[probRow.problemAttr])} 
                                  onChange={(newValue) => props.handleFileListChangeMulti(probRow.problemAttr, probRow.problemValue, newValue.value)}
                                  menuPortalTarget={document.body}
                                  />
                        </TableCell>
                        <TableCell width='15%'>
                          <a href='#' onClick={(e) => props.handleFileAttChange(e, probRow.problemAttr, probRow.problemValue)}>Add Problem Value to File Attributes</a>
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
                  Files
                </Typography>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Message</TableCell>
                      <TableCell>Attribute</TableCell>
                      <TableCell>Problem Value</TableCell>
                      <TableCell>Fix Value</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.problemObject.problems.map((probRow) => (
                      <TableRow key={probRow.problemAttr}>
                        <TableCell width='20%' component="th" scope="row">
                          <ul>
                            {probRow.problemMessage}
                          </ul>
                        </TableCell>
                        <TableCell width='15%'>{probRow.problemAttr}</TableCell>
                        <TableCell width='15%'>{probRow.problemValue}</TableCell>
                        <TableCell>
                          <Select options={asOptions(props.fileAtts[probRow.problemAttr])} 
                                  onChange={(newValue) => props.handleFileListChange(row.problemObject.name, probRow.problemValue, newValue.value)}
                                  menuPortalTarget={document.body}
                                  />
                        </TableCell>
                        <TableCell width='15%'>
                          <a href='#' onClick={(e) => props.handleFileAttChange(e, probRow.problemAttr, probRow.problemValue)}>Add Problem Value to File Attributes</a>
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
          <FormControlLabel labelPlacement="end" value="files" control={<Radio />} label="Files" />
          <FormControlLabel labelPlacement="end" value="problems" control={<Radio />} label="Problems" />
        </RadioGroup>
      </FormControl>
    </div>
    <Table aria-label="collapsible table">
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>{viewBy === 'files' ? 'File Name' : 'Problem'}</TableCell>
          <TableCell align="right">Problem Count</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {viewBy === 'files' && props.problemObjects.map((row) => (
          <FileRow key={row.name} problemObject={row} />
        ))}
        {viewBy === 'problems' && getByProblems().map((row) => (
          <ProblemRow key={row.name} problemObject={row} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
  
}

export default FileListProblemTable