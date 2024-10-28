import React from "react"
import _ from 'lodash'
import { connect, useDispatch } from 'react-redux';
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import './AddToCollectionModal.scss'
import { ActionButton } from '../../../components/ActionButtons'

import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";

import * as PlatformApi from '@dtplatform/platform-api'
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';
import * as UiUtils from '@dtplatform/ui-utils'
import { ProcessXlsxFile } from './fileHelper'

import {Modals} from '@invicara/ipa-core/modules/IpaRedux';

const AddToCollectionModal = ({ actions, handler, collectionSelected, namedUserItemsErrorStatus, destroyModal, fetchAgain, onStatusChange }) => {

  const modelFilters = ['rvt_elements', 'rvt_element_props', 'rvt_type_elements', 'data_cache', 'bim_model_geomresources', 'bim_model_geomviews', 'bim_model_version']
  const dispatch = useDispatch();

  const modalClickSuccess = async () => {
    const importScriptName = handler.config?.scripts?.fileImport
    if (importScriptName) {
      try {
        destroyModal()
        const importFileResult = await dispatch(NamedUserItems.fileImport({ importScriptName })).unwrap()
        onStatusChange('loading')
        const valScriptName = handler.config?.scripts?.addToCollectionVal
        const validationScriptResult = await dispatch(NamedUserItems.importDataValidation({ valScriptName, importFileResult })).unwrap()

        const scriptName = handler?.config?.scripts?.addItemToCollection
        const itemArr = [validationScriptResult.success]
        const collectionSelectedId = collectionSelected._userItemId

        await ScriptHelper.executeScript(scriptName, { itemArr, collectionSelectedId })
        onStatusChange('success', 'The items have been successfully added!')
        await fetchAgain()
      } catch({error}) {
        onStatusChange('error', error)
      }
    } else {  
        destroyModal()
        let ctx = {}
        let current_proj = await PlatformApi.IafProj.getCurrent(ctx);

        try {
          let xlsxFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx, .csv" })
          if (!((xlsxFiles[0].fileObj.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || (xlsxFiles[0].fileObj.type == 'text/csv'))) {
            onStatusChange('error', "Only '.xlsx' or '.csv' files may be uploaded!") 
            return 
        }
          onStatusChange('loading')
          let workbooks = await UiUtils.IafDataPlugin.readXLSXFiles(xlsxFiles)
          let importFileResult = await UiUtils.IafDataPlugin.workbookToJSON(workbooks[0])

          const valScriptName = handler.config?.scripts?.addToCollectionVal
          const valRes = await dispatch(NamedUserItems.importDataValidation({ valScriptName, importFileResult })).unwrap()

          await ProcessXlsxFile(importFileResult).then(async data => {
            await IafScriptEngine.createItemsBulk(
              {
                _userItemId: collectionSelected._userItemId,
                _namespaces: current_proj._namespaces,
                items: data
              }, ctx
            )
            onStatusChange('success', 'The items have been successfully added!')
            await fetchAgain()
          })
      } catch({error}) {
        onStatusChange('error', error)
      }
    }
  }
 
  return (
    <GenericModal
      title="Add to collection"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-addto"
      closeText="Cancel"
      modalBody={
        <div>
          <p>This will allow you to add items to the following collection:</p>
          <li className="collection-title">{collectionSelected._name}</li>

          {modelFilters.includes(collectionSelected._userType) ?
            <div>
              <p className="alert-message">Model collections can not be altered!</p>
              <div className="alert-cancel-button">
                <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
              </div>
            </div>
            :
            <div className="action-buttons">
              <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
              <ActionButton onClick={modalClickSuccess} label={'Apply'} className={'apply-button'}/>
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


const ConnectedAddToCollectionModal = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter
)(AddToCollectionModal)

export default ConnectedAddToCollectionModal

export const AddToCollectionModalFactory = {
  create: ({ handler, reduxStore, collectionSelected, fetchAgain, onStatusChange}) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedAddToCollectionModal, 
      props: {handler, collectionSelected, fetchAgain, onStatusChange}, 
      open: true
    }))
  }
}