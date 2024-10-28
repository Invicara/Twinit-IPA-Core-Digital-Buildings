import React, { useState} from "react";
import {useDispatch} from 'react-redux';

import {NamedUserItems} from "@invicara/ipa-core/modules/IpaRedux";
import {IafProj, IafFileSvc} from '@dtplatform/platform-api';
import * as UiUtils from '@dtplatform/ui-utils'

import TemplateDownloadModal from "../collectionsManagmentModals/TemplateDownloadModal";
import './DataValidation.scss'

import Button from '@material-ui/core/Button';

const DataValidation = ({handler, actions, onStatusChange}) => {
    const [templateUploadResult, setTemplateUploadResult] = useState()

    const dispatch = useDispatch();

    const templateValidationHandler = async() => {
        try {
            const importScriptName = handler.config?.scripts?.fileImport
            const importFileResult = await dispatch(NamedUserItems.fileImport({importScriptName})).unwrap()
            onStatusChange('loading')
            if(importFileResult.error) return onStatusChange('error', "Only '.xlsx' or '.csv' files may be uploaded!")
            
            const valScriptName = handler.config?.scripts?.fileUploadVal
            const validationScriptResult = await dispatch(NamedUserItems.importDataValidation({valScriptName, importFileResult})).unwrap()
            onStatusChange('success', 'The file has been Validated!')  
        } catch (err) {
            onStatusChange('val-error', err.error)
        }
    }

    const uploadTemplateHandler = async() => {
        let ctx = {}
        let proj = await IafProj.getCurrent(ctx)
        let selectFiles 
        try {
            selectFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: true, accept: ".xlsx, .csv" })
            if (!ctx._namespaces) {
                ctx._namespaces = proj._namespaces
            }
        } catch(err) {
            console.log('Error found...', err)
            onStatusChange('error', err)
        }

        onStatusChange('loading')
            selectFiles.map(async(file, idx) => {
                if (!((file.fileObj.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || (file.fileObj.type == 'text/csv'))) {
                    onStatusChange('error', "Only '.xlsx' or '.csv' files may be uploaded!")
                    return
                }
                
                let uploadProps = {}
                uploadProps.onComplete = (file) =>  {
                    console.log('upload success')
                    onStatusChange('success', `The file '${file._name}' has been successfully uploaded!`)
                };
            
                uploadProps.onProgress = (bytesUploaded, bytesTotal) => {
                let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                console.log(file.name, bytesUploaded, bytesTotal, percentage + "%");
                }
            
                uploadProps.onError = (error) => {
                    console.log('Failed to upload:',error)
                    onStatusChange('error', 'Upload failed!. Please try again.')
                }
            try {
                let tags = ['collection_mgmt_template']
                let result = await IafFileSvc.addFileResumable(file.fileObj, proj._namespaces, undefined, tags, ctx, uploadProps)
                setTemplateUploadResult(result)
            } catch (err){
                console.log('Error', err)
                onStatusChange('error', 'Upload failed!. Please try again.')
            }   
        })
    return 'success'
    }

    const downloadHandler = async() =>   {
        return actions.showModal(<TemplateDownloadModal actions={actions} templateUploadResult={templateUploadResult} onStatusChange={onStatusChange} />)
    }

    return (
        <div className="dv-table-container">
             <div className="dv-col1">
                <div className="dv-row1">
                    <h4>Download or upload a collections template file</h4>
                    <div style={{lineHeight: '4px'}}>
                        <p>Click <span>Upload CSV or XLSX file</span> to upload a new custom CSV or XLSX template.</p>
                        <p>Click <span>Download CSV or XLSX file</span> to download a CSV or XLSX template file.</p>
                    </div>
                    <div className="buttons">
                        <Button className="template-button" onClick={uploadTemplateHandler}><i className="fa fa-upload"/>Upload CSV or XLSX file</Button>
                        <Button className='template-button' onClick={downloadHandler}><i className="fa fa-download" style={{color: '#C71784'}}/>Download CSV or XLSX file</Button>
                    </div>
                </div>

                <div className="dv-row2">
                    <h4>Validate your collections template file</h4>
                    <p>To upload and validate a collections template file, click <span>Upload & Validate</span>, and wait for a validation confirmation message. This process will not import your file.</p>
                    <button className="upload-button" onClick={templateValidationHandler}><i className="fa fa-upload"/>Upload & validate file</button>
               </div>
            </div>
        </div>
    )
}

export default DataValidation;