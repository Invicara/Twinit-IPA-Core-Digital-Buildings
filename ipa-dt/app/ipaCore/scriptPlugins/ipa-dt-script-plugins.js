import { IafProj, IafFileSvc, IafFile } from '@dtplatform/platform-api'
import _ from 'lodash'

export const parseModelIds = (stringIDs) => {
    const parsed =  stringIDs.map(s => parseInt(s)); //Just doing .map(parseInt) yields NaN values. No idea why
    return parsed.every(p => !isNaN(p)) ? parsed : []
}

export const getFileVersionsWithUserInfo = async (input) => {
  console.log('in op', input, input.fileItems)
  if (!input.fileItems ) {
   console.error("$getFileVersionsWithUserInfo requires an array of fileItems")
   return null
 }

 let project = await IafProj.getCurrent()
 let projectUsers = await IafProj.getUsers(project)

 let verPromises = []
 for (let i = 0; i < input.fileItems.length; i++) {
   let fileItem = input.fileItems[i]
   fileItem.original = Object.assign({}, fileItem)
   console.log('in op item', fileItem)
   
    if (input.getTipInfoOnly) {
      let version = _.find(fileItem.versions, {versionNumber: fileItem.tipVersionNumber})
      console.log('in op version', version)
      verPromises.push(IafFileSvc.getFileVersion(fileItem._fileId, version._fileVersionId))
    } else {
      for (let j = 0; j < fileItem.versions.length; j++) {
        let version = fileItem.versions[j]
        console.log('in op version', version)
        
        verPromises.push(IafFileSvc.getFileVersion(fileItem._fileId, version._fileVersionId))
       }
    }
 }

 await Promise.all(verPromises).then((verResults) => {
  console.log('verResults', verResults)

  for (let i = 0; i < verResults.length; i++) {
    let fileItem = _.find(input.fileItems, {_fileId: verResults[i]._fileId})
    let fileItemVersion = _.find(fileItem.versions, {_fileVersionId: verResults[i]._id})
    fileItemVersion.versionInfo = verResults[i]
    let createdByUser = _.find(projectUsers, {_id: fileItemVersion.versionInfo._metadata._createdById})
    fileItemVersion.versionInfo.createdByUser = createdByUser
    fileItemVersion.versionInfo.createdByUserName = createdByUser._firstname + " " + createdByUser._lastname
  }


})

 return input.fileItems
}