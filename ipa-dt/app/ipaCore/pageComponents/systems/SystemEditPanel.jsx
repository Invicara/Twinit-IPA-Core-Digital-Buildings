import React, {useState} from "react";
import {GenericMatButton, SimpleTable} from "@invicara/ipa-core/modules/IpaControls";
import _ from "lodash";
import {SystemsOrderableTree} from "./SystemsOrderableTree";
import clsx from "clsx";
import {useSystemEditor} from "./useSystemEditor";
import {SystemEditCreatePanel} from "./SystemEditCreatePanel";

export const SystemEditPanel = ({
     currentSystem, selectedSystemCategories, picklistSelectsConfig, systemStatusConfig, canEditSystems = true,
     systemElements, changeLevel, changeOrder, removeElement, history, editSystemScript, createSystemElementScript,
     updateSystemElementsScript, showMessage, saveSystem, resetSystemBuilder, applyChanges, toggleCritical, selectedSystemElement, setSelectedSystemElement,
     hideNonCritical, setHideNonCritical
 }) => {

    const [editMode, setEditMode] = useState(false)

    const handleSave = (systemName, systemDescription, systemCategoryType, systemStatus, systemColor) => saveSystem(editSystemScript, systemName, systemDescription, systemCategoryType, systemStatus, systemColor)

    const {
        systemName, setSystemName, systemCategoryType, setSystemCategoryType, systemStatus, setSystemStatus, systemDescription, setSystemDescription, systemInfoMessage, trySaveSystem, systemColor, setSystemColor
    } = useSystemEditor(handleSave, currentSystem, selectedSystemCategories)

    const handleRemoveElement = element => {
        if(_.isEmpty(element.downstream)){
            setSelectedSystemElement(undefined);
            removeElement(element)
        } else {
            showMessage(<div>Cannot delete an element with downstream relations. Remove them and try again</div>, 2000)
        }

    }

    const tryApplyHierarchyChanges = async () => {
        try {
            showMessage(<div>System updating...</div>)
            await applyChanges(createSystemElementScript, updateSystemElementsScript)
            await trySaveSystem()
            showMessage(<div>System successfully updated!</div>, 2000)
        } catch (e) {
            console.error(e)
            showMessage(<div>There was an error updating the system. Please try again</div>, 2000)
        }
    }

    const backToCreate = () => {
        resetSystemBuilder();
        history.goBack()
    }

    const handleEdit = () => {
        if (!editMode) {
            setEditMode(true)
        } else {
            trySaveSystem()
            setEditMode(false)
        }
    };

    const handleLevelChange = (systemElement, newParentId, newOrder) => changeLevel({
        systemElement,
        newParentId,
        newOrder
    });

    const handleOrderChange = (systemElement, newOrder) => changeOrder({systemElement, newOrder});

    return <>
        <div className='system-info-table'>
            { editMode && <SystemEditCreatePanel systemName={systemName}
                setSystemName={setSystemName}
                systemCategoryType={systemCategoryType}
                setSystemCategoryType={setSystemCategoryType}
                systemStatus={systemStatus}
                setSystemStatus={setSystemStatus}
                systemDescription={systemDescription}
                setSystemDescription={setSystemDescription}
                systemColor={systemColor}
                setSystemColor={setSystemColor}
                picklistSelectsConfig={picklistSelectsConfig}
                systemStatusConfig={systemStatusConfig}/>}
            {canEditSystems && <div className="dbm-tooltip">
                <i className={"fas " + (!editMode ? 'fa-edit' : 'fa-save')} onClick={handleEdit}/>
                <span className="dbm-tooltiptext">{!editMode ? 'Edit' : 'Collapse'}</span>
            </div>}
        </div>
        {canEditSystems && <div className={clsx('editable-system-information-controls', !editMode && ' collapsed')}>
            <div className={clsx(systemInfoMessage.error && 'system-update-error')}>
                {systemInfoMessage.message}
            </div>
        </div>}
        <SystemsOrderableTree
            systemElements={systemElements}
            onLevelChange={handleLevelChange}
            onOrderChange={handleOrderChange}
            onElementRemoved={handleRemoveElement}
            selectedElement={selectedSystemElement}
            onSelect={setSelectedSystemElement}
            title={currentSystem['System Name']}
            toggleCritical={systemElement => toggleCritical({systemElement})}
            hideNonCritical={hideNonCritical} setHideNonCritical={setHideNonCritical}
        />
        <div className="systems-button-container">
            <GenericMatButton customClasses="systems-secondary-button" onClick={backToCreate}>Back to
                Create</GenericMatButton>
            <GenericMatButton customClasses="systems-main-button" onClick={tryApplyHierarchyChanges}>Apply
                Changes</GenericMatButton>
        </div>
    </>
}