import React from "react";
import {GenericMatButton} from '@invicara/ipa-core/modules/IpaControls';

export const QuestionDuplicateOverlay = ({onConfirm, onCancel, elements}) => {
    return <div>
    <div className="systems-overlay-message">
        <span className="systems-overlay-question">
            Looks like some selected entities or model elements are already part of the system. Do you want to add them anyway?
        </span>
        <ul className="systems-overlay-list">
            <li className="systems-overlay-list-header">Duplicated entities:</li>
            {elements.map(e=><li className="systems-overlay-list-item">{`• ${e["Entity Name"]}`}</li>)}
        </ul>
    </div>
    <div className="systems-overlay-buttons">
            <GenericMatButton
                customClasses="systems-main-button"
                onClick={onConfirm}>Yes
            </GenericMatButton>
            <GenericMatButton
                customClasses="systems-secondary-button"
                onClick={onCancel}>No
            </GenericMatButton>
        </div>
    </div>
}

export const QuestionAssetOverlay = ({onConfirm, onCancel, onHide, elements}) => {
    return <div>
        <div className="systems-overlay-message">
        <div className="systems-overlay-close"><i onClick={onHide} title='Close' className='info-icon fas fa-times'></i></div>
        <span className="systems-overlay-question">
            The following Model Elements represent Assets. Do you want to add the Asset instead?
        </span>
            <ul className="systems-overlay-list">
                <li className="systems-overlay-list-header">Model Elements representing assets:</li>
                {elements.map(e=><li className="systems-overlay-list-item">{`• ${e["Entity Name"]}`}</li>)}
            </ul>
        </div>
        <div className="systems-overlay-buttons">
            <GenericMatButton
                customClasses="systems-main-button"
                onClick={onConfirm}>Add related asset
            </GenericMatButton>
            <GenericMatButton
                customClasses="systems-secondary-button"
                onClick={onCancel}>Add model element
            </GenericMatButton>
        </div>
    </div>
}