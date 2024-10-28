import React from 'react';
import {connect} from 'react-redux';
import withRouter from "react-router/es/withRouter";
import {compose} from "@reduxjs/toolkit";

import { GenericMatButton } from "@invicara/ipa-core/modules/IpaControls";
import { GenericModal } from '@invicara/ipa-core/modules/IpaDialogs';
import { IafFileSvc, IafItemSvc } from "@dtplatform/platform-api";
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";
import './RelateFilesModal.scss'

const RelateFilesModal = ({actions, collectionName, namedUserItemEntities, onStatusChange, fetchCollectionsAgain}) => { 
 
function relateHandler() {
    onStatusChange('loading')
    actions.showModal(false)

    Object.entries(namedUserItemEntities).map(async entity => {
        if(collectionName === entity[1]._name && entity[1]._itemClass === 'NamedFileCollection') {
            const ctx = {}
            const NamedFileCollectionId = entity[1]._userItemId
            try {
                const allFileItems = await IafScriptEngine.getItems({query: {}, _userItemId: NamedFileCollectionId}, ctx)
                if (allFileItems.length === 0) {
                    onStatusChange('error', 'An error occurred, no fileItems found for this collection')
                }
                let counter = 0

                allFileItems.map(async fileItem => {
                    if(!fileItem._fileId) { 
                        const fileName = fileItem.filename || fileItem.name
                        const criteria = {"_name" : fileName}
                        let fileSvcRes = await IafFileSvc.getFiles(criteria, ctx);
                        if(fileSvcRes._list.length === 0 && counter < 1) {
                            onStatusChange('warning', `No related file found for the file item called "${fileName}" in the file service`)
                        }
                        
                        let fileId 
                        if(fileSvcRes._list.length > 1) { 
                            let fileSvcFileLatestVersion = fileSvcRes._list.slice(-1)
                            fileId = fileSvcFileLatestVersion[0]._id
                        } else {
                            fileId = fileSvcRes._list[0]._id
                        }                                                                           
                        
                        let body = {...fileItem, _fileId: fileId}
                        try {
                            await IafItemSvc.updateRelatedItem(NamedFileCollectionId, fileItem._id, body, ctx)
                            if (counter < 1) {
                                onStatusChange('success', 'The file has been successfully related!')
                                fetchCollectionsAgain()
                                counter++ 
                            }
                        } catch (err) {
                            onStatusChange('error', `An error occurred, please try again! ${err}`)
                        }
                    } else {
                        if (counter < 1) {
                             onStatusChange('error', 'FileItem does not have a related file in the fileSvc')
                             counter++
                        }
                    } 
                })
            } catch (err) {
                onStatusChange('error', `An error occurred, please try again! ${err}`)
            }
        }
    })
}

    return (
        <GenericModal
            title="Relate files"
            barClasses="bark-light"
            customClasses="ipa-modal-collection-management ipa-modal-collection-management-relate"
            closeText="Cancel"
            modalBody={
                <div>
                    <div className="relate-info">Are you sure you want to relate the file in <span className="collection-name">{collectionName}</span>?</div>
                    <p>By pressing the 'Relate files' button, you can relate the fileItems in this collection with the associated files in the file service.</p>
                    
                   <div className="action-buttons">
                        <button className="cancel-button" onClick={() => actions.showModal(false)}>Cancel</button>
                        <GenericMatButton customClasses="attention" onClick={relateHandler}>Apply</GenericMatButton>
                    </div>
                </div>
            } 
        />
    )
}

const mapStateToProps = (state) => ({
    namedUserItemEntities: NamedUserItems.selectNamedUserItemEntities(state)
});

export default compose(
    connect(mapStateToProps),
    withRouter
)(RelateFilesModal)
