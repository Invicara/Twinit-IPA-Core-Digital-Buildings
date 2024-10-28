import React, {useState, useEffect} from "react"
import _ from 'lodash'
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import './RecreateCollectionModal.scss'
import { ActionButton } from '../../../components/ActionButtons'

import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import * as PlatformApi from '@dtplatform/platform-api';
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import {Modals} from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";

const RecreateCollectionModal = ({actions, handler, collectionSelected, destroyModal, fetchAgain, onStatusChange, setCollectionSelected}) => {
    const modelFilters = ['rvt_elements', 'rvt_element_props', 'rvt_type_elements', 'data_cache', 'bim_model_geomresources', 'bim_model_geomviews', 'bim_model_version']
    const [loadingStatus, setLoadingStatus] = useState(false)

    const modalClickSuccess = async () => {
      setLoadingStatus(true)
      const recreateScriptName = handler.config?.scripts?.recreateCollection
      if(recreateScriptName){
        try {
          onStatusChange('loading')
          let result = await ScriptHelper.executeScript(recreateScriptName, collectionSelected)
          await fetchAgain()
          setCollectionSelected(result)
          if(result) destroyModal()
          onStatusChange('success', 'The collection has been successfully recreated!')
        } catch ({error}) {
          destroyModal()
          onStatusChange('error', error)
        }
      } else {
          let ctx = {}
          let current_proj = await PlatformApi.IafProj.getCurrent(ctx);
          const {_name, _shortName, _description, _userType} = collectionSelected
          onStatusChange('loading')

          try {
            await IafScriptEngine.createOrRecreateCollection({
              _name: _name,
              _shortName: _shortName,
              _namespaces: current_proj._namespaces,
              _description: _description,
              _userType: _userType
              }, ctx).then(async ()=>{
                onStatusChange('success', 'The collection has been successfully recreated!')
                await fetchAgain()
                destroyModal()
              })
          } catch ({error}) {
            destroyModal()
            onStatusChange('error', error)
          }
        }
      }

    return (
      <GenericModal
        title="Recreate collection"
        barClasses="bark-light"
        customClasses="ipa-modal-collection-management ipa-modal-collection-management-recreate"
        modalBody={
          <div>
            <p>This will recreate the following collection to empty out the item service collection:</p>
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
                {loadingStatus ?
                  <div>
                    <ActionButton label={'Cancel'} className={'cancel-button'} disabled/> 
                    <ActionButton label={'Apply'} className={'apply-button'} disabled/>
                  </div> :
                  <div>
                    <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'}/>
                    <ActionButton onClick={modalClickSuccess} label={'Apply'} className={'apply-button'}/>  
                  </div> 
                }
              </div>
           }
          </div>
        }  
        closeButtonHandler={()=>{ loadingStatus ? null :  destroyModal()}}
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
  
  
  const ConnectedRecreateCollectionModal = compose(
    connect(mapStateToProps, mapDispatchToProps),
    withRouter
  )(RecreateCollectionModal)
  
  export default ConnectedRecreateCollectionModal
  
  export const RecreateCollectionModalFactory = {
    create: ({ handler, reduxStore, collectionSelected, fetchAgain, onStatusChange, setCollectionSelected}) => {
      reduxStore.dispatch(Modals.setModal({
        component: ConnectedRecreateCollectionModal, 
        props: {handler, collectionSelected, fetchAgain, onStatusChange, setCollectionSelected}, 
        open: true
      }))
    }
  }