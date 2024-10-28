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
import {GenericMatButton, StackableDrawer,FancyTreeControl} from "@invicara/ipa-core/modules/IpaControls"
import {ScriptHelper} from "@invicara/ipa-core/modules/IpaUtils"
import _ from 'lodash'
import FileListProblemTable from "./FileListProblemTable"
import FileAttProblemTable from "./FileAttProblemTable"
import BimTypesProblemTable from "./BimTypesProblemTable"
import FilesProblemTable from './FilesProblemTable'
import AssetsProblemTable from './AssetsProblemTable'
import AssetBimTypesProblemTable from './AssetBimTypesProblemTable'

const DataSheetValidationView = ({onLoadComplete, handler}) => {
  
  const [readingXlsx, setReadingXlsx] = useState(false)
  
  const [bimTypes, setBimTypes] = useState(null)
  const [bimTypesModified, setBimTypesModified] = useState(false)
  const [bimTypesSheetName, setBimTypesSheetName] = useState('Sheet1')
  const [typeMap, setTypeMap] = useState(null)
  
  const [fileAtts, setFileAtts] = useState(null)
  const [fileAttsModified, setFileAttsModified] = useState(false)
  const [fileAttsSheetName, setFileAttsSheetName] = useState('Document Attributes')
  
  const [fileList, setFileList] = useState(null)
  const [fileListModified, setFileListModified] = useState(false)
  const [fileListSheetName, setFileListSheetName] = useState('Sheet1')
  const [fileListFileCol, setFileListFileCol] = useState('File name')
  
  const [assets, setAssets] = useState(null)
  const [assetsModified, setAssetsModified] = useState(false)
  const [assetsSheetName, setAssetsSheetname] = useState('Assets')
  const [assetUniqueIdCol, setAssetUniqueIdCol] = useState('')
  
  const [fileNameProblems, setFilesNameProblems] = useState(null)
  const [fileNameProblemsOpen, setFileNameProblemsOpen] = useState(false)
  
  const [filesAttrProblems, setFileAttrProblems] = useState(null)
  const [filesAttrProblemsOpen, setFilesAttrProblemsOpen] = useState(false)
  
  const [filesVsAttributesProblems, setFilesVsAttributesProblems] = useState(null)
  const [filesVsAttributesOpen, setFilesVsAttributesOpen] = useState(false)
  
  const [filesVsTypeMapProblems, setFilesVsTypeMapProblems] = useState(null)
  const [filesVsTypeMapOpen, setFilesVsTypeMapOpen] = useState(false)
  
  const [assetProblems, setAssetProblems] = useState(null)
  const [assetProblemsOpen, setAssetProblemsOpen] = useState(false)
  
  const [assetsVsTypeMapProblems, setAssetsVsTypeMapProblems] = useState(null)
  const [assetsVsTypeMapOpen, setAssetsVsTypeMapOpen] = useState(false)
    
  useEffect(onLoadComplete, [])
  
  const anyModified = () => {
    return bimTypesModified || fileAttsModified || fileListModified || assetsModified
  }
  
  const findDuplicates = arr => { 
    
    let foundDupes = []
    let result = arr.filter((item, index) => {
      if (arr.indexOf(item) !== index && !foundDupes.includes(item)) {
        foundDupes.push(item)
        return true
      } else if (arr.indexOf(item) !== index && foundDupes.includes(item)) {
        return false
      } else
        return false
    })
    
    return result
  }
  
  const analyseFileAttributes = () => {
    
    let attributeNames = Object.keys(fileAtts)
   
    let problemAtts = []
    
    attributeNames.forEach((attName) => {
      
      let problemAtt = {
        name: attName,
        problems: []
      }
      
      let allCaps = fileAtts[attName].map((att) => att.toUpperCase())
      console.log('allCaps', allCaps, fileAtts)
      
      let dupes = findDuplicates(allCaps)
      console.log(dupes)
      
      if (dupes.length) {
        
        dupes.forEach((dupe) => {
          problemAtt.problems.push({
            problemMessage: attName + " contains duplicate options: " + dupe,
            problemAttr: attName,
            problemValue: dupe
          })
        })
        problemAtts.push(problemAtt)
      }
      
    })
    
    setFileAttrProblems(problemAtts)
  }
  
  const analyseFiles = () => {
    
    let filenames = []
    let problemFiles = []
    
    let firstFile = fileList[0]
    if (!firstFile[fileListFileCol]) {
      problemFiles.push({
        name: 'Spreadsheet is missing filename column: ' + fileListFileCol,
        problems: [{
            problemMessage: 'Spreadsheet is missing filename column: ' + fileListFileCol + '. Please check you have entered the correct Sheet Name and File name Field.',
            problemAttr: fileListFileCol,
            problemValue: 'column missing'
        }]
      })
    }
    
    fileList.forEach((file) => {
      if (file[fileListFileCol] && !filenames.includes(file[fileListFileCol]))
        filenames.push(file[fileListFileCol].toUpperCase())
    })
    
    
    
    let duplicateFilenames = findDuplicates(filenames)
    
    duplicateFilenames.forEach((dup) => {
      
      problemFiles.push({
        name: dup,
        problems: [{
            problemMessage: fileListFileCol + " '" + dup + "' found multiple times",
            problemAttr: fileListFileCol,
            problemValue: dup
        }]
      })
      
    })
    
    setFilesNameProblems(problemFiles)
    
  }
  
  const analyseFilesVsAttributes = () => {
    let attributes = Object.keys(fileAtts)

    let problemFiles = []
    
    fileList.forEach((file) => {
      
      let isProblemFile = false
      let problemFile = {
        name: file[fileListFileCol],
        problems: []
      }
      
      attributes.forEach((att) => {
        if (fileAtts[att][0] !== '<<TEXT>>' && fileAtts[att][0] !== '<<DYNAMIC>>') {
          
          if (file[att] && !fileAtts[att].includes(file[att])) {
            isProblemFile = true
            problemFile.problems.push({
              problemMessage: "Attribute '" + att + "' value '" + file[att] + "' not found in File Attributes",
              problemAttr: att,
              problemValue: file[att]
            })
          }
          
        }
        
      })
      
      if (isProblemFile) problemFiles.push(problemFile)
      
    })
    
    setFilesVsAttributesProblems(problemFiles)
  }
  
  const analyseFilesVsTypeMap = () => {
    
    let problemFiles = []
    
    fileList.forEach((file) => {
      
      let isProblemFile = false
      let problemFile = {
        name: file[fileListFileCol],
        problems: []
      }
      
      if (!file.dtCategory) {
        
        isProblemFile = true
        problemFile.problems.push({
          dtCategory: null,
          dtType: null,
          problemMessage: "dtCategory is not assigned to file",
          problemAttr: "dtCategory",
          problemValue: ""
        })
        
      } else {  
        
        let dtCategory = _.find(bimTypes, {dtCategory: file.dtCategory})
      
        if (!dtCategory) {
          isProblemFile = true
          problemFile.problems.push({
            dtCategory: null,
            dtType: null,
            problemMessage: "dtCategory '" + file.dtCategory + "' does not exist in BIM Types",
            problemAttr: "dtCategory",
            problemValue: file.dtCategory
          })
          
        } else if (file.dtType) {
          
          let dtType = _.find(bimTypes, {dtCategory: file.dtCategory, dtType: file.dtType})
        
          if (!dtType) {
            isProblemFile = true
            problemFile.problems.push({
              dtCategory: file.dtCategory,
              dtType: null,
              problemMessage: "dtType '" + file.dtType + "' for dtCategory '" + file.dtCategory + "' does not exist in BIM Types",
              problemAttr: "dtType",
              problemValue: file.dtType
            })
          }
          
        }
      }
      
      if (isProblemFile)
        problemFiles.push(problemFile)
      
    })
    
    setFilesVsTypeMapProblems(problemFiles)
    console.log(problemFiles)
  }
  
  const analyseAssets = () => {
    console.log('analysing assets')
    
    const getAssetsWithDuplicateUniqueIds = (value) => {
      
      return assets.filter(asset => !!asset[assetUniqueIdCol] && asset[assetUniqueIdCol].toUpperCase() === value).map(asset => asset['Asset Name'])
      
    }
    
    let problems = []
    
    let allAssetNames = []
    let allUniqueIds = [];
    
    let assignedAssets = assets.filter(asset => asset['Asset Name'])
    
    if (assignedAssets.length === 0)
      problems.push({
        name: "Assets xlsx is missing 'Asset Name' column or no assets have been assigned an Asset Name",
        problems: [{
            problemMessage: "Assets xlsx is missing 'Asset Name' column or no assets have been assigned an Asset Name",
            problemAttr: '',
            problemValue: ''
        }]
      })
    
    let assignedUniqueIds = assignedAssets.filter((asset) => asset[assetUniqueIdCol])
    
    if (assignedUniqueIds.length === 0)
      problems.push({
        name: "Assets xlsx is missing '" + assetUniqueIdCol + "' column or no assets have been assigned a " + assetUniqueIdCol,
        problems: [{
            problemMessage: "Assets xlsx is missing '" + assetUniqueIdCol + "' column or no assets have been assigned a " + assetUniqueIdCol,
            problemAttr: '',
            problemValue: ''
        }]
      })
    
    assignedAssets.forEach((asset) => {
      
      allAssetNames.push(asset['Asset Name'])
      
      if (!asset[assetUniqueIdCol])
        problems.push({
          name: "Asset '" + asset['Asset Name'] + "' is missing '" + assetUniqueIdCol + "' value",
          problems: [{
              problemMessage: "Asset '" + asset['Asset Name'] + "' is missing '" + assetUniqueIdCol + "' value",
              problemAttr: assetUniqueIdCol,
              problemValue: ''
          }]
        })
      
      if (assetUniqueIdCol !== 'Asset Name') {
        if (asset[assetUniqueIdCol]) allUniqueIds.push(asset[assetUniqueIdCol])
      }
      
    })
    
    console.log(allUniqueIds)
    
    let allCapsAssetNames = allAssetNames.map(name => name.toUpperCase())
    let allCapsUniqueIds = allUniqueIds.length ? allUniqueIds.map(id => id.toString().toUpperCase()) : []
    
    let nameDupes = findDuplicates(allCapsAssetNames)
    
    if (nameDupes.length) {
      
      nameDupes.forEach((dupe) => {
        
        problems.push({
          name: "Asset Name '" + dupe + "' is not unique",
          problems: [{
              problemMessage: "Asset Name '" + dupe + "' is not unique",
              problemAttr: '',
              problemValue: ''
          }]
        })
        
      })
      
    }
    
    if (assetUniqueIdCol !== 'Asset Name') {
      let idDupes = findDuplicates(allCapsUniqueIds)
      
      if (idDupes.length) {
      
        idDupes.forEach((dupe) => {

          problems.push({
            name: "Asset unique id '" + assetUniqueIdCol +"' value '"  + dupe + "' is not unique",
            problems: [{
                problemMessage: getAssetsWithDuplicateUniqueIds(dupe),
                problemAttr: assetUniqueIdCol,
                problemValue: dupe
            }]
          })

        })

      }
      
    }
    
    console.log(problems)
    console.log('analysing assets done')
    setAssetProblems(problems)
  }
  
  const analyseAssetsVsBimTypes = () => {
    
    let problems = []
    
    assets.forEach((asset) => {
      
      if (asset['Asset Name']) {
        
        if (!asset['dtCategory'])
          problems.push({
            name: asset['Asset Name'],
            problems: [{
                dtCategory: null,
                dtType: null,
                problemMessage: "Asset '" + asset['Asset Name'] + "' is missing dtCategory",
                problemAttr: "dtCategory",
                problemValue: ''
            }]
          })
        else {
          
          if (!Object.keys(typeMap).includes(asset['dtCategory']))
            problems.push({
              name: asset['Asset Name'],
              problems: [{
                  dtCategory: null,
                  dtType: null,
                  problemMessage: "Asset '" + asset['Asset Name'] + "' has incorrect dtCategory value '" + asset['dtCategory'] + "'",
                  problemAttr: "dtCategory",
                  problemValue: asset['dtCategory']
              }]
            })
          else {
            
            if (!asset['dtType'])
              problems.push({
                name: asset['Asset Name'],
                problems: [{
                    dtCategory: asset['dtCategory'],
                    dtType: null,
                    problemMessage: "Asset '" + asset['Asset Name'] + "' is missing dtType",
                    problemAttr: "dtType",
                    problemValue: ''
                }]
              })
            else {
              
              if (!typeMap[asset['dtCategory']].includes(asset['dtType']))
                problems.push({
                  name: asset['Asset Name'],
                  problems: [{
                      dtCategory: asset['dtCategory'],
                      dtType: null,
                      problemMessage: "Asset has incorrect dtType value '" + asset['dtType'] + "' for dtCategory '" + asset['dtCategory'] + "'",
                      problemAttr: "dtType",
                      problemValue: asset['dtType']
                  }]
                })
              
            }
          }
        }
      }
      
    })
    
    console.log(problems)
    setAssetsVsTypeMapProblems(problems)
    
  }
  
  const doAnalysis = () => {

    if (fileAtts) {
      analyseFileAttributes()
    }
    if (fileList) {
      analyseFiles()
    }
    if (fileAtts && fileList) {
      analyseFilesVsAttributes()
    }
    if (bimTypes && fileList) {
      analyseFilesVsTypeMap()
    }
    if (assets) {
      analyseAssets()
    }
    if (assets && bimTypes) {
      analyseAssetsVsBimTypes()
    }
    
  }
  useEffect(doAnalysis, [bimTypes, fileAtts, fileList, assets])
  
  const getTypeMap = (rows) => {
    
    let typeMap = {}
    let dtCategories = []
 
    rows.forEach((row) => {
      
      if (row.dtCategory && !dtCategories.includes(row.dtCategory)) {
        dtCategories.push(row.dtCategory)
        typeMap[row.dtCategory] =[]
      }
      
      if (row.dtCategory && row.dtType && !typeMap[row.dtCategory].includes(row.dtType))
        typeMap[row.dtCategory].push(row.dtType)
      
    })
    
    setTypeMap(typeMap)
    console.log(typeMap)
  }
  
  const getXlsAsJSON = (fileType) => {
    setReadingXlsx(true)
    
    let sheetName = null
    let asColumns = false
    let setFunc = null
    
    switch (fileType) {
      case 'bimtypes':
        setBimTypes(null)
        setTypeMap(null)
        setFilesVsTypeMapProblems(null)
        sheetName = bimTypesSheetName
        setFunc = setBimTypes
        break
      case 'attributes':
        setFileAtts(null)
        setFileAttrProblems(null)
        setFilesVsAttributesProblems(null)
        sheetName = fileAttsSheetName
        asColumns = true
        setFunc = setFileAtts
        break
      case 'filelist':
        setFileList(null)
        setFileListModified(false)
        setFilesNameProblems(null)
        setFilesVsAttributesProblems(null)
        setFilesVsTypeMapProblems(null)
        sheetName = fileListSheetName
        setFunc = setFileList
        break
      case 'assets':
        setAssets(null)
        setAssetsModified(false)
        sheetName = assetsSheetName
        setFunc = setAssets
        break
    }
    
    if (setFunc)
      ScriptHelper.executeScript(handler.config.scripts.importXls, {sheetName: sheetName, asColumns: asColumns}).then((imported) => {
        console.log(fileType, imported)
        setReadingXlsx(false)
        setFunc(imported)
        
        if (fileType === 'bimtypes') {
          getTypeMap(imported)
        }
      })
    else setReadingXlsx(false)
  }
  
  const toggleGroup = (setting, setFunc) => {
    setFunc(!setting)
  }
  
  const handleFileListChange = (filename, attribute, newValue) => {
    
    let tempFileList = [...fileList]
    let search = {}
    search[fileListFileCol] = filename
    let fileIndex = _.findIndex(tempFileList, search)
    
    tempFileList[fileIndex][attribute] = newValue
    
    setFileList(tempFileList)
    setFileListModified(true)
    
  }
  
  const handleCategorizationChange = (filename, attributesWithValues) => {
    
    let tempFileList = [...fileList]
    let search = {}
    search[fileListFileCol] = filename
    let fileIndex = _.findIndex(tempFileList, search)
    
    let attributesToUpdate = Object.keys(attributesWithValues)
    
    attributesToUpdate.forEach((attWithVal) => {
      tempFileList[fileIndex][attWithVal] = attributesWithValues[attWithVal]
    })
    
    setFileList(tempFileList)
    setFileListModified(true)
    
  }
  
  const handleCategorizationChangeMulti = (filenames, attributesWithValues) => {
    
    let tempFileList = [...fileList]
    
    filenames.forEach((filename) => {
      let search = {}
      search[fileListFileCol] = filename
      
      let fileIndex = _.findIndex(tempFileList, search)
    
      let attributesToUpdate = Object.keys(attributesWithValues)

      attributesToUpdate.forEach((attWithVal) => {
        tempFileList[fileIndex][attWithVal] = attributesWithValues[attWithVal]
      })
    })
    
    setFileList(tempFileList)
    setFileListModified(true)
    
  }
  
  const handleFileListChangeMulti = (attribute, replaceVal, newVal) => {
    console.log(attribute, replaceVal, newVal)
    
    let tempFileList = [...fileList]
    
    tempFileList.forEach((file) => {
      if (file[attribute] == replaceVal)
         file[attribute] = newVal
    })
    
    setFileList(tempFileList)
    setFileListModified(true)
    
  }
  
  const handleAssetCategorizationChange = (assetName, attributesWithValues) => {
    
    let tempAssetList = [...assets]
    let search = {'Asset Name': assetName}

    let fileIndex = _.findIndex(tempAssetList, search)
    
    let attributesToUpdate = Object.keys(attributesWithValues)
    
    attributesToUpdate.forEach((attWithVal) => {
      tempAssetList[fileIndex][attWithVal] = attributesWithValues[attWithVal]
    })
    
    setAssets(tempAssetList)
    setAssetsModified(true)
    
  }
  
  const handleAssetCategorizationChangeMulti = (assetNames, attributesWithValues) => {
    
    let tempAssetList = [...assets]
    
    assetNames.forEach((assetname) => {
      let search = {'Asset Name': assetname }
      
      let fileIndex = _.findIndex(tempAssetList, search)
    
      let attributesToUpdate = Object.keys(attributesWithValues)

      attributesToUpdate.forEach((attWithVal) => {
        tempAssetList[fileIndex][attWithVal] = attributesWithValues[attWithVal]
      })
    })
    
    setAssets(tempAssetList)
    setAssetsModified(true)
    
  }
  
  const downloadObjectsList = (e, objects, sheetName, filename, modifiedFunc) => {
    
    e.preventDefault()
    
    ScriptHelper.executeScript(handler.config.scripts.exportObjectsToXls, {objects: objects, sheetname: sheetName, filename: filename}).then(() => {
      modifiedFunc(false)
    })
    
  }
  
  const handleFileAttChange = (e, attribute, value) => {
    e.preventDefault()
    
    let tempFileAtts = {...fileAtts}
    
    tempFileAtts[attribute].push(value)
    
    setFileAtts(tempFileAtts)
    setFileAttsModified(true)
    
  }
  
  const replaceDuplicateAtts = (att, removeValues, addValue) => {
    
    let tempFileAtts = {...fileAtts}
    let tempAttValues = tempFileAtts[att]
    
    let withRemovedValues = tempAttValues.filter((att) => {
      return att.toUpperCase() !== removeValues
    })
    
    withRemovedValues.push(addValue)
    
    withRemovedValues.sort()
    
    tempFileAtts[att] = withRemovedValues
    
    setFileAtts(tempFileAtts)
    
  }
  
  const downloadFileAtts = (e) => {
    
    e.preventDefault()
    
    let attributeNames = Object.keys(fileAtts)
    
    let largestAttValues = 0;
    attributeNames.forEach((attName) => {
      if (fileAtts[attName].length > largestAttValues)
        largestAttValues = fileAtts[attName].length
    })
    
    let xlsxArray = []
    for (let i = 0; i <= largestAttValues; i++)
        xlsxArray.push([])
    
    for (let x = 0; x < attributeNames.length; x++) {
      
      xlsxArray[0].push(attributeNames[x])
  
      for (let y = 0; y < largestAttValues; y++) {
       
        if (fileAtts[attributeNames[x]][y])
          xlsxArray[y+1].push(fileAtts[attributeNames[x]][y])
        else
          xlsxArray[y+1].push(null)
        
      }
    }
    
    ScriptHelper.executeScript(handler.config.scripts.exportArraysToXls, {arrays: xlsxArray, sheetname: fileListSheetName, filename: "Updated File Attributes.xlsx"}).then(() => {
      setFileAttsModified(false)
    })
  }

  const leafNodeRenderer = (entity) => entity["dtType"]

  const branchNodeRenderer = (groupName, values) => {
    const sumChildren = (values, acc) => {
        if (Array.isArray(values)) {
            return acc + values.length
        }
        Object.keys(values).forEach(key => {
            acc = sumChildren(values[key], acc)
        })
        return acc
    }
    return (
        <span>
            {groupName}
            <span className="count" style={{fontSize: "0.8em"}}>{sumChildren(values, 0)}</span>
        </span>
    )
  }
  
  const makeTree = () => {
    
    let nextid = 0;
    let tree = {}
    
    let dtCategories = Object.keys(typeMap)
    
    dtCategories.sort().forEach((cat) => {
      
      tree[cat] = []
      
      typeMap[cat].sort().forEach((type) => {
        tree[cat].push({
          _id: nextid++,
          dtCategory: cat,
          dtType: type
        })
      })
      
    })
    console.log(tree)
    return tree
  }
  
  return <div className='bimTypesAndFilesView'>
    
    <StackableDrawer level={1} iconKey={'fa-file-excel'}>
      <div>
         <div className='button-container'>
         {readingXlsx && <div className="reading-xlsx-notice"><i className="fas fa-spinner fa-spin"></i> Reading xlsx file...</div>}
          <div>
            <div className='button-group'>
              <div className='button-group-label'>Sheet Name:</div>
              <input className='form-control' value={fileListSheetName} onChange={(e) => setFileListSheetName(e.target.value)} type='text' />
              <div className='button-group-label'>File name field:</div>
              <input className='form-control' value={fileListFileCol} onChange={(e) => setFileListFileCol(e.target.value)} type='text' />
              <div className='button-item'>
                {!fileList && <i className="far fa-square fa-2x"></i>}
                {fileList && <i className="fas fa-check-square fa-2x"></i>}
                <GenericMatButton onClick={(e) => getXlsAsJSON('filelist')}>
                  Select File List xlsx
                </GenericMatButton>
              </div>
            </div>
            <div className='button-group'>
              <div className='button-group-label'>Sheet Name:</div>
              <input className='form-control' value={fileAttsSheetName} onChange={(e) => setFileAttsSheetName(e.target.value)} type='text' />
              <div className='button-item'>
                {!fileAtts && <i className="far fa-square fa-2x"></i>}
                {fileAtts && <i className="fas fa-check-square fa-2x"></i>}
                <GenericMatButton onClick={(e) => getXlsAsJSON('attributes')}>
                  Select File Attributes xlsx
                  </GenericMatButton>
              </div>
            </div>
            <div className='button-group'>
              <div className='button-group-label'>Sheet Name:</div>
              <input className='form-control' value={bimTypesSheetName} onChange={(e) => setBimTypesSheetName(e.target.value)} type='text' />
               <div className='button-item'>
                {!bimTypes && <i className="far fa-square fa-2x"></i>}
                {bimTypes && <i className="fas fa-check-square fa-2x"></i>}
                <GenericMatButton onClick={(e) => getXlsAsJSON('bimtypes')}>
                  Select BIM Types xlsx
                  </GenericMatButton>
              </div>
            </div>
            <div className='button-group'>
              <div className='button-group-label'>Sheet Name:</div>
              <input className='form-control' value={assetsSheetName} onChange={(e) => setAssetsSheetName(e.target.value)} type='text' />
              <div className='button-group-label'>Column Containing Unique ID:</div>
              <input className='form-control' value={assetUniqueIdCol} onChange={(e) => setAssetUniqueIdCol(e.target.value)} type='text' />
               <div className='button-item'>
                {!assets && <i className="far fa-square fa-2x"></i>}
                {assets && <i className="fas fa-check-square fa-2x"></i>}
                <GenericMatButton onClick={(e) => getXlsAsJSON('assets')} disabled={!assetUniqueIdCol}>
                  Select Assets xlsx
                </GenericMatButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StackableDrawer>
    <StackableDrawer level={2} iconKey={'fa-sitemap'} defaultOpen={false}>
      <div className="typemap-container">
        {!typeMap && <div>Select a BIM Types file to display Type Map</div>}
        {typeMap && <FancyTreeControl className="entity-tree"
          name={"typemap_tree"}
          renderLeafNode={leafNodeRenderer}
          renderBranchNode={branchNodeRenderer}
          selectedIds={[]}
          tree={makeTree(typeMap)}
          singleSelect={true} />}
      </div>
    </StackableDrawer>
    
    
    <div className="content">
      <div className='result-container'>

      {(!filesVsAttributesProblems && !filesAttrProblems && !filesVsTypeMapProblems && !fileNameProblems) && <div className='select-message'>
        Please select data sheets on the left to start running validations
        </div>
      }

      {fileNameProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(fileNameProblemsOpen, setFileNameProblemsOpen)}>
            {fileNameProblemsOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!fileNameProblemsOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {!!fileNameProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>File Validation</div>
          <div>({fileNameProblems.length} {fileNameProblems.length === 1? 'file problem' : 'file problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates all file names are unique</span>
          </div>
        </div>
        {fileNameProblems.length && fileNameProblemsOpen ? <FilesProblemTable
            problemObjects={fileNameProblems}
        />: !fileNameProblems.length && fileNameProblemsOpen ? <span className='no-issues-msg'>"No problems found analysing Files"</span> : ""}
        </div>
      }

      {filesAttrProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(filesAttrProblemsOpen, setFilesAttrProblemsOpen)}>
            {filesAttrProblemsOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!filesAttrProblemsOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {filesAttrProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>Files Attributes Validation</div>
          <div>({filesAttrProblems.length} {filesAttrProblems.length === 1? 'attribute problem' : 'attribute problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates that File Attributes do not contain duplicates</span>
          </div>
        </div>
        {filesAttrProblems.length && filesAttrProblemsOpen ? <FileAttProblemTable
            problemObjects={filesAttrProblems}
            fileAtts={fileAtts}
            replaceDuplicateAtts={replaceDuplicateAtts}
            />: !filesAttrProblems.length && filesAttrProblemsOpen ? <span className='no-issues-msg'>"No problems found analysing File Attributes"</span> : ""}
        </div>
      }
      
      {assetProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(assetProblemsOpen, setAssetProblemsOpen)}>
            {assetProblemsOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!assetProblemsOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {assetProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>Asset Validation</div>
          <div>({assetProblems.length} {assetProblems.length === 1? 'asset problem' : 'asset problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates Assets have asset names, unique ids, unique asset names, and unique unique ids</span>
          </div>
        </div>
        {assetProblems.length && assetProblemsOpen ? <AssetsProblemTable
            problemObjects={assetProblems}
            />: !assetProblems.length && assetProblemsOpen ? <span className='no-issues-msg'>"No problems found analysing Assets"</span> : ""}
        </div>
      }

      {filesVsAttributesProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(filesVsAttributesOpen, setFilesVsAttributesOpen)}>
            {filesVsAttributesOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!filesVsAttributesOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {!!filesVsAttributesProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>Files vs. File Attributes</div>
          <div>({filesVsAttributesProblems.length} {filesVsAttributesProblems.length === 1? 'file problem' : 'file problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates all files have valid File Attribute values</span>
          </div>
        </div>
        {filesVsAttributesProblems.length && filesVsAttributesOpen ? <FileListProblemTable
            problemObjects={filesVsAttributesProblems}
            handleFileAttChange={handleFileAttChange}
            handleFileListChange={handleFileListChange}
            handleFileListChangeMulti={handleFileListChangeMulti}
            fileAtts={fileAtts}
        />: !filesVsAttributesProblems.length && filesVsAttributesOpen ? <span className='no-issues-msg'>"No problems found analysing Files and File Attributes"</span> : ""}
        </div>
      }

      {filesVsTypeMapProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(filesVsTypeMapOpen, setFilesVsTypeMapOpen)}>
            {filesVsTypeMapOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!filesVsTypeMapOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {!!filesVsTypeMapProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>Files vs. Type Map</div>
          <div>({filesVsTypeMapProblems.length} {filesVsTypeMapProblems.length === 1? 'mapping problem' : 'mapping problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates all files have valid dtCategories and dtTypes</span>
          </div>
        </div>
        {filesVsTypeMapProblems.length && filesVsTypeMapOpen ? <BimTypesProblemTable
            problemObjects={filesVsTypeMapProblems}
            typeMap={typeMap}
            handleCategorizationChange={handleCategorizationChange}
            handleCategorizationChangeMulti={handleCategorizationChangeMulti}
        />: !filesVsTypeMapProblems.length && filesVsTypeMapOpen ? <span className='no-issues-msg'>"No problems found analysing Files and Type Map"</span> : ""}
        </div>
      }
      
      {assetsVsTypeMapProblems && <div>
        <div className='table-title'>
          <div className='flipper' onClick={(e) => toggleGroup(assetsVsTypeMapOpen, setAssetsVsTypeMapOpen)}>
            {assetsVsTypeMapOpen && <i className='fas fa-chevron-down fa-2x'></i>}
            {!assetsVsTypeMapOpen && <i className='fas fa-chevron-right fa-2x'></i>}
          </div>
          <div>
            {!!assetsVsTypeMapProblems.length ? <span className='error-alert'><i className='fas fa-exclamation-circle fa-2x'></i></span> : ''}
          </div>
          <div className='table-title-name'>Assets vs. Type Map</div>
          <div>({assetsVsTypeMapProblems.length} {assetsVsTypeMapProblems.length === 1? 'mapping problem' : 'mapping problems'} found)</div>
          <div className="dbm-tooltip">
              <i className="far fa-question-circle fa-2x"></i>
              <span className="dbm-tooltiptext">Validates all files have valid dtCategories and dtTypes</span>
          </div>
        </div>
        {assetsVsTypeMapProblems.length && assetsVsTypeMapOpen ? <AssetBimTypesProblemTable
            problemObjects={assetsVsTypeMapProblems}
            typeMap={typeMap}
            handleCategorizationChange={handleAssetCategorizationChange}
            handleCategorizationChangeMulti={handleAssetCategorizationChangeMulti}
        />: !assetsVsTypeMapProblems.length && assetsVsTypeMapOpen ? <span className='no-issues-msg'>"No problems found analysing Assets and Type Map"</span> : ""}
        </div>
      }

      </div>

      <div className='download-container'>
        <div className='help-text'>
          Select Data Sheets on the left to begin running validations. You will be able to make changes to some of the data to correct it.
          If you do, you will be able to download updated data sheets with the corrections applied.
        </div>

        <div>
          <div className='download-header'>Downloads</div>
          {!anyModified() && <div>No changes have been made yet to download</div>}
          {anyModified() && <ul>
            {fileListModified && <li><a href='#' onClick={(e) => downloadObjectsList(e, fileList, fileListSheetName, "Updated File List.xlsx", setFileListModified)}>File List</a></li>}
            {fileAttsModified && <li><a href='#' onClick={downloadFileAtts}>File Attributes</a></li>}
            {assetsModified && <li><a href='#' onClick={(e) => downloadObjectsList(e, assets, assetsSheetName, "Updated Assets.xlsx", setAssetsModified)}>Assets</a></li>}
          </ul>}
        </div>

      </div>
    </div>
  </div>
    
}

export default DataSheetValidationView;
