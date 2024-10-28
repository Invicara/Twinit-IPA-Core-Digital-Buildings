import React, { useState } from "react"
import _ from 'lodash'

import './NewCollectionModal.scss'
import { ActionButton } from '../../../components/ActionButtons'

import { GenericMatButton } from "@invicara/ipa-core/modules/IpaControls";
import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import { Modals } from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import * as PlatformApi from '@dtplatform/platform-api'
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';


const NewCollectionModal = ({ handler, destroyModal, fetchAgain, onStatusChange }) => {

  const initialValues = { name: '', description: '', shortName: '', userType: '', namespaces: '' }

  const [formValues, setFormValues] = useState(initialValues)
  const [formErrors, setFormErrors] = useState(false)
  const [inputSelected, setInputSelected] = useState(initialValues)

  const modalClickSuccess = async (e) => {
    e.preventDefault();

    const current_proj = await PlatformApi.IafProj.getCurrent({});
    const scriptName = handler?.config?.scripts?.createCollection
    const result = validation(formValues)
    setFormErrors(result);
    if (Object.keys(result).length === 0) {
      setFormValues(initialValues)
      formValues.namespaces = current_proj._namespaces

      if (scriptName) {
        try {
          onStatusChange('loading')
          destroyModal()
          
          await ScriptHelper.executeScript(scriptName, { formValues })
          onStatusChange('success', 'The collection has been successfully added!')
          await fetchAgain()
        } catch({error}) {
          onStatusChange('error', error)
        }  
      } else {
        onStatusChange('loading')
        destroyModal()
        
        try {
          await IafScriptEngine.createOrRecreateCollection({
            _name: formValues.name,
            _shortName: formValues.shortName,
            _namespaces: formValues.namespaces,
            _description: formValues.description,
            _userType: formValues.userType
          }, {}).then(async () => {
            onStatusChange('success', 'The collection has been successfully added!')
            await fetchAgain()
          })
        } catch({error}) {
          onStatusChange('error', error)
        }
      }
    }
  }

  const inputfocus = (e) => {
    const { name } = e.target;
    setInputSelected({ ...initialValues, [name]: true })
  }

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setInputSelected({ ...initialValues, [name]: true })
    setFormErrors({ ...formErrors, [name]: '' })
    setFormValues({ ...formValues, [name]: value });
  }

  const validation = ({ name, description, shortName, userType }) => {
    const errors = {}
    const regex = /[!@£€#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]+/;

    if (!name) {
      errors.name = "Name is required!"
    } else if (name.length < 3) {
      errors.name = "Name is too short!"
    } else if (name.length >= 100) {
      errors.name = "Name is too long!, must be less than 100 characters"
    } else if (regex.test(name)) {
      errors.name = "Name contains invalid characters!"
    }

    if (description.length > 255) {
      errors.description = 'Description is too long!'
    } else if (description.length < 3) {
      errors.description = "Description is too short!"
    }

    if (!shortName) {
      errors.shortName = "Short Name is required!"
    } else if (shortName.length < 3) {
      errors.shortName = "Short name is too short!"
    } else if (shortName.length > 255) {
      errors.shortName = "Short name is too long!"
    } else if (regex.test(shortName)) {
      errors.shortName = "Short Name contains invalid characters!"
    }

    if (!userType) {
      errors.userType = "User Type is required!"
    } else if (userType.length < 3) {
      errors.userType = "User type is too short!"
    } else if (userType > 255) {
      errors.userType = "User Type is too long!"
    } else if (regex.test(userType)) {
      errors.userType = "User Type contains invalid characters!"
    }
    return errors
  }

  return (
    <GenericModal
      title="Add new collection"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-new"
      closeText="Cancel"
      modalBody={
        <div className='success-modal'>
          <form onSubmit={modalClickSuccess}>

            <div className="input-container">
              <label className={formErrors.name ? 'label-error' : null} >Name</label>
              <input
                type="text"
                name="name"
                className={formErrors.name ? 'form-input-error' : inputSelected.name ? 'form-input-selected' : 'form-input'}
                placeholder="Enter a collection name"
                value={formValues.name}
                onClick={inputfocus}
                onChange={changeHandler}

              />
              <p className="error-tag">{formErrors.name}</p>
            </div>

            <div className="input-container">
              <label className={formErrors.description ? 'label-error' : null} >Description</label>
              <input
                type="text"
                name="description"
                className={formErrors.description ? 'form-textarea-error' : inputSelected.description ? 'form-textarea-selected' : 'form-textarea'}
                placeholder="Enter a description of this collection"
                value={formValues.description}
                onClick={inputfocus}
                onChange={changeHandler} />
              <p className="error-tag">{formErrors.description}</p>
            </div>

            <div className="input-container">
              <label className={formErrors.shortName ? 'label-error' : null} >Short Name</label>
              <input
                type="text"
                name="shortName"
                className={formErrors.shortName ? 'form-input-error' : inputSelected.shortName ? 'form-input-selected' : 'form-input'}
                placeholder="Enter a short name"
                value={formValues.shortName}
                onClick={inputfocus}
                onChange={changeHandler} />
              <p className="error-tag">{formErrors.shortName}</p>
            </div>

            <div className="input-container">
              <label className={formErrors.userType ? 'label-error' : null} >User Type</label>
              <input
                type="text"
                name="userType"
                className={formErrors.userType ? 'form-input-error' : inputSelected.userType ? 'form-input-selected' : 'form-input'}
                placeholder="Enter a user type"
                value={formValues.userType}
                onClick={inputfocus}
                onChange={changeHandler} />
              <p className="error-tag">{formErrors.userType}</p>
            </div>

          </form>
          
          <div className="action-buttons">
                <ActionButton onClick={() => {
                  setFormValues(initialValues)
                  destroyModal()
                }} label={'Cancel'} className={'cancel-button'}
                />
                <ActionButton onClick={modalClickSuccess} label={'Apply'} className={'apply-button'} />
              </div>
        </div>
      }
      noPadding={true}
      closeButtonHandler={()=>destroyModal()}
    />
  )
}

const mapStateToProps = state => ({
  modal: state.modal
})

const mapDispatchToProps = {
  destroyModal: Modals.destroy
}


const ConnectedNewCollectionModal = connect(mapStateToProps, mapDispatchToProps)(NewCollectionModal)
export default ConnectedNewCollectionModal

export const NewCollectionModalFactory = {
  create: ({ handler, reduxStore, fetchAgain, onStatusChange }) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedNewCollectionModal,
      props: { handler, fetchAgain, onStatusChange },
      open: true
    }))
  }
}