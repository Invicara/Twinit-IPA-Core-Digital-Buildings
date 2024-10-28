import React, { useState } from "react"
import _ from 'lodash'
import './UpdateCollectionModal.scss'
import { ActionButton } from "../../../components/ActionButtons";

import { BaseTextInput } from "@invicara/ipa-core/modules/IpaControls";
import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import * as PlatformApi from '@dtplatform/platform-api'
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import * as UiUtils from '@dtplatform/ui-utils'
import { ProcessXlsxFile } from './fileHelper'
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import {Modals} from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";
import {AttachFile} from "@material-ui/icons";

const UpdateCollectionModal = ({ actions, collectionSelected, handler, fetchAgain, destroyModal, onStatusChange}) => {
  const modelFilters = ['rvt_elements', 'rvt_element_props', 'rvt_type_elements', 'data_cache', 'bim_model_geomresources', 'bim_model_geomviews', 'bim_model_version']
  const [file, setFile] = useState();  
  const [column, setColumn] = useState();

  const handleFileSelect = async () => {
    let xlsxFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx, .csv"})
    if (!((xlsxFiles[0].fileObj.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || (xlsxFiles[0].fileObj.type == 'text/csv'))) {
      destroyModal()
      onStatusChange('error', "Only '.xlsx' or '.csv' files may be uploaded!") 
      return 
    }
    setFile(xlsxFiles)
  }

  const modalClickSuccess = async () => {
    if(file){
    let ctx = {}
    let current_proj = await PlatformApi.IafProj.getCurrent(ctx);
    const scriptName = handler?.config?.scripts?.updateCollection
    if(scriptName) {
      destroyModal()
      onStatusChange('loading')

      try{
        const result = await ScriptHelper.executeScript(scriptName, { collectionSelected, file, column })
        if(result?.updatedItems?.length > 0) {
          onStatusChange('success', 'The collection has been succuessfully updated!')
        } else if (result?.error){
          onStatusChange('error', `${result.error}`)
        } else {
          onStatusChange('warning', 'No items found that required an update.')
        }
        await fetchAgain()
      } catch(err) {
        onStatusChange('error', `${err}`)
      }
    } else {
        destroyModal()
        onStatusChange('loading')

        try {
          let workbooks = await UiUtils.IafDataPlugin.readXLSXFiles(file)
          let wbJSON = await UiUtils.IafDataPlugin.workbookToJSON(workbooks[0])

          let items = await IafScriptEngine.getItems({
            query: {},
            collectionDesc: { _userType: collectionSelected._userType, _userItemId: collectionSelected._userItemId },
            options: { page: { getAllItems: true } }
          }, ctx)

          await ProcessXlsxFile(wbJSON).then(async (data)=> {
            if(data.length > items.length) {
              onStatusChange('error', 'The item you are trying to update does not exist in the current collection')
              return
            }

            let updatedItems = []
            let foundItems = []

            _.each(data, (item)=> {
              let found = items.find(i => i.properties[column].val === item.properties[column].val)
              let updated = items.find(i => i.properties[column].val !== item.properties[column].val)
              
              if(found){
                found.properties = {...found.properties, ...item.properties}
                found.Name = item.Name
                foundItems.push(found)
              } else {
                updated.properties = {...updated.properties, ...item.properties}
                updated.Name = item.Name
                updatedItems.push(updated)
              }
            })
            let combinedItems = [...foundItems, ...updatedItems]

            await IafScriptEngine.updateItemsBulk(
              {
                _userItemId: collectionSelected._userItemId,
                _namespaces: current_proj._namespaces,
                items: combinedItems
              }, ctx
            )
            if(updatedItems?.length > 0) {
              onStatusChange('success', 'The collection has been succuessfully updated!')
            } else {
              onStatusChange('warning', 'No items found that required an update.')
            }
          })
        } catch(err) {
          onStatusChange('error', `${err}`)
        }
        await fetchAgain()
      }
    }
  }
  const removeFile = () => setFile(null)
  return (
    <GenericModal
      title="Update collection"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-update"
      closeText="Cancel"
      modalBody={
        <div>
          <p>This is allow a user to select a column in the spreadsheet that identifies items currently in the collection and to update those items with the items held in the spreadsheet. This update will occur in the following collection: </p>
          <li className="collection-name">{collectionSelected._name}</li>

          {modelFilters.includes(collectionSelected._userType) ?
            <div>
              <p className="alert-message">Model collections can not be altered!</p>
              <div className="alert-cancel-button">
                <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
              </div>
            </div>
            :
            <div className="input-container">
              <p className="column-text">Column in the spreadsheet</p>
              <div>
                <BaseTextInput
                  inputProps={{
                    placeholder: "Enter an identifier",
                    value: column,
                    onChange: (a)=>setColumn(a.target.value)
                  }}                  
                />
              </div>

              <p className="upload-text">Upload CSV or XLSX file</p>
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
      closeButtonHandler={()=>destroyModal()}
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


const ConnectedUpdateCollectionModal = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter
)(UpdateCollectionModal)

export default ConnectedUpdateCollectionModal

export const UpdateCollectionModalFactory = {
  create: ({ handler, reduxStore, collectionSelected, fetchAgain, onStatusChange}) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedUpdateCollectionModal, 
      props: {handler, collectionSelected, fetchAgain, onStatusChange}, 
      open: true
    }))
  }
}