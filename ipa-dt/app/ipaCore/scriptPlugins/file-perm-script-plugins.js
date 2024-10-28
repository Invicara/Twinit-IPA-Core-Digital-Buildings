
import { IafProj, IafFileSvc, IafFile, IafPermission, IafUserType, IafItemSvc } from '@dtplatform/platform-api'
import _ from 'lodash'

export const createUserGroupFoldersAndFileCollections = async (input) => {

    let permActions = IafPermission.PermConst.Action

    let allPermSet = [permActions.All]
    let readAllPermSet = [permActions.Read]
    let myPermSet = [permActions.Read, permActions.Create, permActions.Update]

    let operatorResults = []

    let project = await IafProj.getCurrent()

    let existingChildContainers = await IafFile.getChildContainers(project.rootContainer)
    existingChildContainers = existingChildContainers ? existingChildContainers : []

    let filesDirs = await IafFileSvc.getFiles({query: {_type: 'dir'}})
    filesDirs  = filesDirs ? filesDirs._list : []
    filesDirs = filesDirs.filter(f => f._type === 'dir')

    for (let i = 0; i < input.userGroups.length; i++) {

        let userGroup = input.userGroups[i]

        //create the user group folder if it doesn't already exist in the file service
        let folder = _.find(filesDirs, {_name: userGroup._name })
        if (!folder) {
            folder = await IafFileSvc.addFolder(userGroup._name, project._namespaces)
            console.log('created folder')
        }

        let permCriteria = {
            "_resourceDesc._irn": folder._irn,
            _namespace: project._namespaces[0]
        }

        /* create the applicable permissions on the folder
         * for each folder:
         * 1. Give each tierOne user group allPermSet permissions
         * 2. If userGroup is not an tierOne group, give the Usergroup myPermSet permissions
         * 3. If the userGroup is not an tierOne and not a tierTwo group, give each tierTwo group readAllPermSet
        */

        let isTierOne = !!_.find(input.tierOne, {_name: userGroup._name})
        let isTierTwo = !!_.find(input.tierTwo, {_name: userGroup._name})

        let newPerms = []

        // 1. Give each tierOne user group allPermSet permissions
        for (let i = 0; i < input.tierOne.length; i++) {
            newPerms.push({
                "_actions": allPermSet,
                "_namespace": project._namespaces[0],
                "_resourceDesc":{
                    "_irn": folder._irn,
                },
                "_user":{
                    "_id": input.tierOne[i]._id,
                    "_type": IafPermission.PermConst.UserType.UserGroup
                }
            })
        }

        // 2. If userGroup is not an tierOne group, give the Usergroup myPermSet permissions
        if (!isTierOne) {
            newPerms.push({
                "_actions": myPermSet,
                "_namespace": project._namespaces[0],
                "_resourceDesc":{
                    "_irn": folder._irn,
                },
                "_user":{
                    "_id": userGroup._id,
                    "_type": IafPermission.PermConst.UserType.UserGroup
                }
            })
        }

        // 3. If the userGroup is not an tierOne and not a tierTwo group, give each tierTwo group readAllPermSet
        if (!isTierOne && !isTierTwo) {
            for (let i = 0; i < input.tierTwo.length; i++) {
                newPerms.push({
                    "_actions": readAllPermSet,
                    "_namespace": project._namespaces[0],
                    "_resourceDesc":{
                        "_irn": folder._irn,
                    },
                    "_user":{
                        "_id": input.tierTwo[i]._id,
                        "_type": IafPermission.PermConst.UserType.UserGroup
                    }
                })
            }
        }

        let permRes = await IafFileSvc.updatePermissions(newPerms)
        if (permRes._failures.length > 0) {
            console.error(permRes)
        }

        let folderPermissions = await IafFileSvc.getPermissions(permCriteria)
        folderPermissions = folderPermissions._list.filter(p => p._user._type === IafPermission.PermConst.UserType.UserGroup)

        let fileContainer = _.find(existingChildContainers, {_name: userGroup._name})
        if (!fileContainer) {
            //create item service file container for the usergroup if it doesnt exist
            let newContainer = {
                _name: userGroup._name,
                _shortName: userGroup._shortName,
                _description: userGroup._name + " Files",
                _userType: IafUserType.FileContainer,
                folderId: folder._id

            }
            console.log('1', userGroup, newContainer)
            fileContainer = await IafFile.createContainer(project.rootContainer, newContainer)
            console.log('2', fileContainer)
        }

        /* create the applicable permissions on the file container
         * for each container:
         * 1. Give each tierOne user group allPermSet permissions
         * 2. If userGroup is not an tierOne group, give the Usergroup myPermSet permissions to their fileCollection
         *    And read to the rootContainer
         * 3. If the userGroup is not an tierOne and not a tierTwo group, give each tierTwo group readAllPermSet
        */
        let newContPerms = []

        // 1. Give each tierOne user group allPermSet permissions
        for (let i = 0; i < input.tierOne.length; i++) {
            newContPerms.push({
                "_actions": allPermSet,
                "_namespace": project._namespaces[0],
                "_resourceDesc":{
                    "_irn": fileContainer._irn,
                },
                "_user":{
                    "_id": input.tierOne[i]._id,
                    "_type": IafPermission.PermConst.UserType.UserGroup
                }
            })
        }

        // 2. If userGroup is not an tierOne group, give the Usergroup myPermSet permissions
        if (!isTierOne) {
            newContPerms.push({
                "_actions": myPermSet,
                "_namespace": project._namespaces[0],
                "_resourceDesc":{
                    "_irn": fileContainer._irn,
                },
                "_user":{
                    "_id": userGroup._id,
                    "_type": IafPermission.PermConst.UserType.UserGroup
                }
            }),
            newContPerms.push({
                "_actions": readAllPermSet,
                "_namespace": project._namespaces[0],
                "_resourceDesc":{
                    "_irn": project.rootContainer._irn,
                },
                "_user":{
                    "_id": userGroup._id,
                    "_type": IafPermission.PermConst.UserType.UserGroup
                }
            })
        }

        // 3. If the userGroup is not an tierOne and not a tierTwo group, give each tierTwo group readAllPermSet
        if (!isTierOne && !isTierTwo) {
            for (let i = 0; i < input.tierTwo.length; i++) {
                newContPerms.push({
                    "_actions": readAllPermSet,
                    "_namespace": project._namespaces[0],
                    "_resourceDesc":{
                        "_irn": fileContainer._irn,
                    },
                    "_user":{
                        "_id": input.tierTwo[i]._id,
                        "_type": IafPermission.PermConst.UserType.UserGroup
                    }
                })
            }
        }

        let permContRes = await IafItemSvc.updatePermissions(newContPerms)
        if (permContRes._failures.length > 0) {
            console.error(permContRes)
        }

        //get filecontainer permissions
        let query = {
            _namespace: fileContainer._namespaces[0],
            "_user._type": IafPermission.PermConst.UserType.UserGroup,
            "_resourceDesc._irn": fileContainer._irn
        }

        let fileContainerPermissions = await IafItemSvc.getPermissions(query);

        operatorResults.push({
            userGroup,
            folder,
            folderPermissions,
            folderPermissionFailures: permRes._failures.length > 0 ? permRes._failures : null,
            fileContainer,
            fileContainerPermissions,
            fileContainerPermissionFailures: permContRes._failures.length > 0 ? permContRes._failures : null
        })
    }

    return operatorResults
}

export const getMyPermissions = async (input) => {

    let project = await IafProj.getCurrent()

    let existingChildContainers = await IafFile.getChildContainers(project.rootContainer)
    existingChildContainers = existingChildContainers ? existingChildContainers : []
    existingChildContainers.push(project.rootContainer)

    let filesDirs = await IafFileSvc.getFiles({_type: 'dir'})
    filesDirs  = filesDirs ? filesDirs._list : []
    filesDirs = filesDirs.filter(f => f._type === 'dir')

    let allPermissions = {}

    for (let i = 0; i < filesDirs.length; i++){
        let permCriteria = {
            "_resourceDesc._irn": filesDirs[i]._irn,
            _namespace: project._namespaces[0]
        }
        let folderPermission = await IafFileSvc.getPermissions(permCriteria)
        allPermissions[filesDirs[i]._name] = {
            folder: filesDirs[i],
            folderPermissions: folderPermission._list
        }
    }

    for (let i = 0; i < existingChildContainers.length; i++) {
        let query = {
            _namespace: project._namespaces[0],
            "_user._type": IafPermission.PermConst.UserType.UserGroup,
            "_resourceDesc._irn": existingChildContainers[i]._irn
        }
        let fileContainerPermission = await IafItemSvc.getPermissions(query);

        if (!allPermissions[existingChildContainers[i]._name]) {
            allPermissions[existingChildContainers[i]._name] = {}
        }
            
        allPermissions[existingChildContainers[i]._name].fileContainer = existingChildContainers[i]
        allPermissions[existingChildContainers[i]._name].fileContainerPermissions = fileContainerPermission._list
    }

    return allPermissions
}

export const getRelatedItemsFromMultiResults = async (input) => {

    console.log('custom input', input)
    
    let combined = {}

    input.list.forEach((l) => {

        let keys = Object.keys(l._versions[0]._relatedItems)

        keys.forEach((k) => {
            if (!combined[k]) combined[k] = [...l._versions[0]._relatedItems[k]]
            else {
                l._versions[0]._relatedItems[k].forEach((v) => {
                    if (!combined[k].includes(v)) combined[k].push(v)
                })
            }
        })
    })

    let combKeys = Object.keys(combined)

    if (combKeys.length === 1)
        return combined[combKeys[0]]
    else
        return combined

}
