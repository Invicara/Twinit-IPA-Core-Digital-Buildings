import React from "react"
import _ from 'lodash'
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import './RecreateCollectionModal.scss'
import { ActionButton } from '../../../components/ActionButtons'

import { GenericMatButton } from "@invicara/ipa-core/modules/IpaControls";
import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import * as PlatformApi from '@dtplatform/platform-api';
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import {Modals} from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";

import {IafItemSvc, IafHelper} from '@dtplatform/platform-api';

const DeleteCollectionModal = ({actions, handler, collectionSelected, destroyModal, fetchAgain, onStatusChange}) => {

    const modalClickSuccess = async () => {
      const deleteScriptName = handler.config?.scripts?.deleteCollection 
      if(deleteScriptName){
        try {
          onStatusChange('loading')
          destroyModal()

          await ScriptHelper.executeScript(deleteScriptName, collectionSelected)
          await fetchAgain()
          onStatusChange('success', `The collection '${collectionSelected._name}' has been successfully deleted!`)
        } catch ({error}) {
          onStatusChange('error', error)
        }
      } else {
          let ctx = {}
          onStatusChange('loading')
          destroyModal()
          
          try {
            let req = {
                "_shortName": collectionSelected._shortName,
                 "_itemClass": collectionSelected._itemClass,
                "_userType": collectionSelected._userType
            };

            let reqClone = _.cloneDeep(req);
            let coll = await IafItemSvc.getNamedUserItems(IafHelper.addItemClassToCriteria({query:reqClone}, IafItemSvc.ItemClass.UserCollection), ctx);
       
            if (IafHelper.resultExists(coll)) {
              let collID = Array.isArray(coll._list) ? coll._list[0] : coll._list;
              if (coll._list.length && coll._list.length > 1) {
                console.warn("expecting a unique collection in createOrRecreateCollection")
              }
              await IafItemSvc.deleteNamedUserItem(collID._id, ctx);
            }

            await fetchAgain()
            onStatusChange('success', `The collection '${collectionSelected._name}' has been successfully deleted!`)
          } catch ({error}) {
            onStatusChange('error', error)
          }
        }
      }
  
    return (
      <GenericModal
        title="Delete collection"
        barClasses="bark-light"
        customClasses="ipa-modal-collection-management ipa-modal-collection-management-recreate"
        closeText="Cancel"
        modalBody={
          <div>
            <p>This will delete and remove the following collection:</p>
            <li className="collection-title">{collectionSelected._name}</li>
              <div className="action-buttons">
                <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/> 
                <ActionButton onClick={modalClickSuccess} label={'Apply'} className={'apply-button'}/>            
              </div>
           
          </div>
        }
        closeButtonHandler={()=>destroyModal()}
        noPadding={true}
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
  
  const ConnectedDeleteCollectionModal = compose(
    connect(mapStateToProps, mapDispatchToProps),
    withRouter
  )(DeleteCollectionModal)
  
  export default ConnectedDeleteCollectionModal
  
  export const DeleteCollectionModalFactory = {
    create: ({ handler, reduxStore, collectionSelected, fetchAgain, onStatusChange}) => {
      reduxStore.dispatch(Modals.setModal({
        component: ConnectedDeleteCollectionModal, 
        props: {handler, collectionSelected, fetchAgain, onStatusChange}, 
        open: true
      }))
    }
  }