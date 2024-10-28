import React, {useState, useEffect} from "react"
import { RadioButtonUnchecked, RadioButtonChecked} from "@material-ui/icons";
import { Tooltip } from "@material-ui/core";

import './TemplateDownloadModal.scss'
import { ActionButton } from "../../../components/ActionButtons";

import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import {IafProj, IafFileSvc} from '@dtplatform/platform-api';
import {IafScriptEngine} from '@dtplatform/iaf-script-engine'

const TemplateDownloadModal = ({actions, templateUploadResult, onStatusChange}) => {
  const [templates, setTemplates] = useState()
  const [selected, setSelected] = useState(0)
  const [reloadToken, setReloadToken] = useState(false)

   async function fetchTemplateData() {
    const ctx = {}
    const criteria = {_tags: "collection_mgmt_template"}
    const defaultTemplate = {_name: 'collection_mgmt_default_template.xlsx'}

    let res = await IafFileSvc.getFiles(criteria, ctx)
    res._list.unshift(defaultTemplate)
    setTemplates(res._list)
  }

  useEffect(() => {
    fetchTemplateData()
  },[templateUploadResult, reloadToken])

  const downloadHandler = async() => {
    if (templates[selected]._name === 'collection_mgmt_default_template.xlsx') {
      const uri = "https://lib.invicara.io/digitalTwin/collectionMgmt/collection_import_template.xlsx" 
      const name = "collection_mgmt_default_template";

      try {
        const link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onStatusChange('success', 'Collections template file downloaded!')
        actions.showModal(false)
      } catch(err) {
        onStatusChange('error', 'Download has failed, please try again')
        actions.showModal(false)
      }
    } 
    else {
        let ctx = {}
        let proj = await IafProj.getCurrent(ctx)
        try {
            const getFileVersion = await IafFileSvc.getFileVersions(templates[selected]._id);
            const latestVersion = getFileVersion._list.length
            let fileId
            
            getFileVersion._list.map((file) => {
              if(file._version === latestVersion) {
                fileId = {
                _fileId: file._fileId,
                _fileVersionId: file._id
              }
            }  
            })
            onStatusChange('loading')
            
            let downloadFile = await IafScriptEngine.downloadFile(fileId, proj)
            onStatusChange('success', 'Collections template file downloaded!')
            actions.showModal(false)
        } catch(err) {
            onStatusChange('error', 'Download has failed, please try again')
            actions.showModal(false)
        }
    }
  }

  const deleteHandler = async() =>   {
    let ctx ={}
    try {
      if(templates[selected]._name === 'collection_mgmt_default_template.xlsx' && selected === 0) {
        onStatusChange('error', 'This template cannot be deleted!')
        actions.showModal(false)
        return
      }
      
      onStatusChange('loading')
      actions.showModal(false)
      let id = templates[selected]._id
      let result = await IafFileSvc.deleteFile(id, ctx)
      onStatusChange('success', `The file '${templates[selected]._name}' has been successfully deleted!`)
      setReloadToken(!reloadToken)
    } catch(err) {
      console.log('Error has occured', err)
      onStatusChange('error', 'Download has failed, please try again')
      actions.showModal(false)
    }
}
  
    return (
      <GenericModal
        title="Template download"
        barClasses="bark-light"
        customClasses="ipa-modal-collection-management ipa-modal-collection-management-template"
        closeText="Cancel"
        modalBody={
          <div className='template-download-modal'>
            <div className='scroll'>
              <p>Select from the following templates:</p>
              <ul>
                {templates?.map((template, idx) => {
                    return (
                      <div key={idx} className='radio-buttons'>
                        {idx === selected ? <RadioButtonChecked style={{color: '#C71784'}}/> :
                          <RadioButtonUnchecked  onClick={() => setSelected(idx)}/>
                        }
                        <Tooltip title={template._name}>
                          <li className='template-list'>{template._name}</li>
                        </Tooltip>
                      </div>
                      )
                })}
              </ul>
            </div>

            <div className='template-action-buttons'>
              <div className='column-1'>
                <ActionButton onClick={deleteHandler} label={'Delete Template'} className={'delete-button'} />
              </div>
              <div className='column-2'>
                <ActionButton onClick={() => actions.showModal(false)} label={'Cancel'} className={'cancel-button'} />
                <ActionButton onClick={downloadHandler} label={'Download template'} className={'apply-button'} />
              </div> 
            </div>
          </div>
        }
      />
    )
  }

  export default TemplateDownloadModal