


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
import {GenericMatButton} from "@invicara/ipa-core/modules/IpaControls"
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import _ from 'lodash'

const AssetBimTypesProblemTable = (props) => {
  
  const [viewBy, setViewBy] = useState('problems')
  
  const asOptions = options => options.map(o => ({value: o, label: o, key: 0}))
  
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
                dtCategory: problem.dtCategory,
                dtType: problem.dtType,
                problemMessage: [probObj.name],
                problemAttr: problem.problemAttr,
                problemValue: problem.problemValue
            }]
          })
          
        } else {
          
          let existingProblem = _.find(problems, {name: problem.problemMessage})
          if (!existingProblem.problems[0].problemMessage.includes(probObj.name))
            existingProblem.problems[0].problemMessage.push(probObj.name)
        }
        
      })
      
    })
    
    console.log(problems)
    return problems
  }
  
  const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });
  
  function ProblemRow(row) {
    const [open, setOpen] = useState(false)
    const [dtCategory, setDtCategory] = useState(null)
    const [dtType, setDtType] = useState(null)
    const [typeOptions, setTypeOptions] = useState([])
    
    useEffect(() => {
      
      setDtCategory(row.problemObject.problems[0].dtCategory ? row.problemObject.problems[0].dtCategory : null)
      
    }, [])
    
    useEffect(() => {

      if (dtCategory && props.typeMap[dtCategory]) {
        
        setDtType(null)
        setTypeOptions(asOptions(props.typeMap[dtCategory].sort()))
      }
      
    }, [dtCategory])
    
    
    
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
                      <TableCell>Fix dtCategory</TableCell>
                      <TableCell>Fix dtType</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.problemObject.problems.map((probRow) => (
                      <TableRow key={probRow.problemAttr}>
                        <TableCell width='20%' component="th" scope="row">
                        <ul className="problem-files-message">
                          {probRow.problemMessage.map((assetname) => {
                            return <li key={assetname}>{assetname}</li>
                          })}
                        </ul>
                        </TableCell>
                        <TableCell width='10%'>{probRow.problemAttr}</TableCell>
                        <TableCell width='15%'>{probRow.problemValue}</TableCell>
                        <TableCell>
                          <Select options={asOptions(Object.keys(props.typeMap).sort())}
                                  defaultValue={probRow.dtCategory ? {value: probRow.dtCategory, label: probRow.dtCategory, key: probRow.dtCategory} : probRow.dtCategory}
                                  value={dtCategory ? asOptions([dtCategory]) : null}
                                  onChange={(e) => setDtCategory(e.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select options={typeOptions}
                                  value={dtType ? asOptions([dtType]) : null}
                                  onChange={(e) => setDtType(e.value)}
                          />
                        </TableCell>
                        <TableCell width='5%'>
                          <GenericMatButton onClick={() => props.handleCategorizationChangeMulti(probRow.problemMessage, {dtCategory: dtCategory, dtType: dtType})}>
                            Fix
                          </GenericMatButton>
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
  
  function AssetRow(row) {
    const [open, setOpen] = useState(false)
    const [dtCategory, setDtCategory] = useState(null)
    const [dtType, setDtType] = useState(null)
    const [typeOptions, setTypeOptions] = useState([])
    
    useEffect(() => {
      
      setDtCategory(row.problemObject.problems[0].dtCategory ? row.problemObject.problems[0].dtCategory : null)
      
    }, [])
    
    useEffect(() => {

      if (dtCategory && props.typeMap[dtCategory]) {
        
        setDtType(null)
        setTypeOptions(asOptions(props.typeMap[dtCategory].sort()))
      }
      
    }, [dtCategory])
    
    
    
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
                      <TableCell>Fix dtCategory</TableCell>
                      <TableCell>Fix dtType</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.problemObject.problems.map((probRow) => (
                      <TableRow key={probRow.problemAttr}>
                        <TableCell width='20%' component="th" scope="row">
                          {probRow.problemMessage}
                        </TableCell>
                        <TableCell width='10%'>{probRow.problemAttr}</TableCell>
                        <TableCell width='15%'>{probRow.problemValue}</TableCell>
                        <TableCell>
                          <Select options={asOptions(Object.keys(props.typeMap).sort())}
                                  defaultValue={probRow.dtCategory ? {value: probRow.dtCategory, label: probRow.dtCategory, key: probRow.dtCategory} : probRow.dtCategory}
                                  value={dtCategory ? asOptions([dtCategory]) : null}
                                  onChange={(e) => setDtCategory(e.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select options={typeOptions}
                                  value={dtType ? asOptions([dtType]) : null}
                                  onChange={(e) => setDtType(e.value)}
                          />
                        </TableCell>
                        <TableCell width='5%'>
                          <GenericMatButton onClick={() => props.handleCategorizationChange(row.problemObject.name, {dtCategory: dtCategory, dtType: dtType})}>
                            Fix
                          </GenericMatButton>
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
              <FormControlLabel labelPlacement="end" value="assets" control={<Radio />} label="Assets" />
              <FormControlLabel labelPlacement="end" value="problems" control={<Radio />} label="Problems" />
            </RadioGroup>
          </FormControl>
        </div>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Asset</TableCell>
              <TableCell align="right">Problem Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {viewBy === 'assets' && props.problemObjects.map((row) => (
                <AssetRow key={row.name} problemObject={row} />
            ))}
            {viewBy === 'problems' && getByProblems().map((row) => (
                <ProblemRow key={row.name} problemObject={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  
}

export default AssetBimTypesProblemTable