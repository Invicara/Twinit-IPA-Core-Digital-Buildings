import React, { useState } from "react"
import _ from 'lodash'
import {AttachFile} from "@material-ui/icons";

import './ReplaceCollectionModal.scss'
import { ActionButton } from '../../../components/ActionButtons'

import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import { IafScriptEngine } from '@dtplatform/iaf-script-engine';
import * as UiUtils from '@dtplatform/ui-utils'
import { ProcessXlsxFile } from './fileHelper'
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import { Modals } from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import * as PlatformApi from '@dtplatform/platform-api'

const ReplaceCollectionModal = ({ actions, collectionSelected, handler, fetchAgain, destroyModal, onStatusChange }) => {
  const modelFilters = ['rvt_elements', 'rvt_element_props', 'rvt_type_elements', 'data_cache', 'bim_model_geomresources', 'bim_model_geomviews', 'bim_model_version']
  const [file, setFile] = useState();

  const handleFileSelect = async () => {
    let xlsxFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx, .csv" })
    if (!((xlsxFiles[0].fileObj.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || (xlsxFiles[0].fileObj.type == 'text/csv'))) {
      destroyModal()
      onStatusChange('error', "Only '.xlsx' or '.csv' files may be uploaded!") 
      return 
    }
    setFile(xlsxFiles)
  }
  
  const modalClickSuccess = async () => {
    if(file){
      onStatusChange('loading')
      destroyModal()
      let ctx = {}
      let current_proj = await PlatformApi.IafProj.getCurrent(ctx);
      const scriptName = handler?.config?.scripts?.replaceCollection
      const { _name, _shortName, _description, _userType } = collectionSelected

      if(scriptName) { 
        try {
          await ScriptHelper.executeScript(scriptName, {
            _name, _shortName, _description, _userType, file
          })
          await fetchAgain()
          onStatusChange('success', 'The collection has been successfully updated!') 
        } catch({error}) {
          onStatusChange('error', error)
        }
      } else {
        try {
          let collection = await IafScriptEngine.createOrRecreateCollection({
            _name: _name,
            _shortName: _shortName,
            _namespaces: current_proj._namespaces,
            _description: _description,
            _userType: _userType
            }, ctx)
            let workbooks = await UiUtils.IafDataPlugin.readXLSXFiles(file)
            let wbJSON = await UiUtils.IafDataPlugin.workbookToJSON(workbooks[0])
            await ProcessXlsxFile(wbJSON).then(async (data)=>{
              await IafScriptEngine.createItemsBulk(
                {
                  _userItemId: collection._userItemId,
                  _namespaces: current_proj._namespaces,
                  items: data
                }, ctx
              )
            })
            await fetchAgain()
            onStatusChange('success', 'The collection has been successfully updated!') 
        } catch({error}) {
          onStatusChange('error', error)
        }
      }
    }
  }
  const removeFile = () => setFile(null)
  return (
    <GenericModal
      title="Replace collection"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-replace"
      closeText="Cancel"
      modalBody={
        <div>
          <p>This will recreate the following collection to add new items to the item service collection:</p>
          <li className="collection-name">{collectionSelected._name}</li>

          {modelFilters.includes(collectionSelected._userType) ?
            <div>
              <p className="collection-not-compatible">Model collections can not be altered!</p>
              <div className="collection-not-compatible-message">
                <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
              </div>
            </div>
            :
            <div>
              <p className="upload-text">Upload a CSV or XLSX file</p>
              <div className="upload-actions">
                <button className="browse-button" onClick={() => { handleFileSelect() }}>
                  <AttachFile className="file-icon" /><p className="button-text">Browse File</p></button>

                <div className="selected-file">
                  {file ? <span>{file[0].name}<span> <i className="fas fa-times cancel-icon" onClick={() => removeFile()}/></span></span> : <p className="no-file-selected">No file selected yet</p>}
                  </div>
              </div>
              <div className="action-buttons">
                <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
                {file ? <ActionButton onClick={modalClickSuccess} label={'Apply'} className={'apply-button'}/>
                : <ActionButton label={'Apply'} className={'apply-button'} disabled/> }
              </div>
            </div>
          }
        </div>
      }
      noPadding={true}
      closeButtonHandler={() => destroyModal()}
    />
  )
}

const mapStateToProps = (state) => ({
  modal: state.modal,
  namedUserItemsErrorStatus: NamedUserItems.SelectNamedUserItemsErrorStatus(state)
});

const mapDispatchToProps = {
  destroyModal: Modals.destroy
}


const ConnectedReplaceCollectionModal = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter
)(ReplaceCollectionModal)

export default ConnectedReplaceCollectionModal

export const ReplaceCollectionModalFactory = {
  create: ({ handler, reduxStore, collectionSelected, fetchAgain, onStatusChange }) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedReplaceCollectionModal,
      props: { handler, collectionSelected, fetchAgain, onStatusChange },
      open: true
    }))
  }
}