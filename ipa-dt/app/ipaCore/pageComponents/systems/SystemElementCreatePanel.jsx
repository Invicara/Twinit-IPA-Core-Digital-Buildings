import React, {useEffect, useMemo, useState} from "react";
import _ from "lodash";
import { EntityDetailTable } from "./EntityDetailTable";
import { GenericMatButton, SplitButton } from "@invicara/ipa-core/modules/IpaControls";
import { QuestionAssetOverlay, QuestionDuplicateOverlay } from "./SystemQuestionOverlay";
import Switch from "@material-ui/core/Switch";
import { SystemsViewer } from "./SystemsViewer";
import { element } from "prop-types";


export const SystemElementCreatePanel = ({
    model, isolatedEntities, hiddenEntities, onViewerSelect, systemColor, systemElements,
    createSystemElement, addSystemElements, addAssetFromModelElements, selectedSystemElement, checkedEntities,
    updateChecked, setChecked, columns, showMessage, hideMessage, scriptName, allSelectedElements, clearfilterModeEntities, clearNonModelElements,
    spaceMode, setSpaceMode, setAddToWorkbenchOnSelect, addToWorkbenchOnSelect, removeEntities, hiddenModelIds, elementNotFound, setElementNotFound
}) => {

    const [generic, setGeneric] = useState(false)
    const [comprise, setComprise] = useState(false)

    const [genericName, setGenericName] = useState("")

    const entitiesHaveSameType = () => checkedEntities.every(entity => entity.type?.type === checkedEntities[0].type?.type)

    const checkModelElementAssets = (parent) => {
        const checkedModelElementsWithAssets = checkedEntities.filter(e => e.isModelElement && !_.isEmpty(e.relatedActualEntities))
        if (!_.isEmpty(checkedModelElementsWithAssets)) {
            showMessage(<QuestionAssetOverlay
                onConfirm={() => {
                    if (comprise) {
                        //This check kinda repeats checkSameTypeEntities. TODO to DRY the code
                        if (checkedModelElementsWithAssets.length === checkedEntities.length) {
                            addAssetFromModelElements(scriptName, parent, comprise, genericName);
                            resetControlsState()
                            hideMessage()
                        }
                        else showMessage(<div>Looks like selected model elements are mixed type. Please select same type entities in order create system element.</div>, 2000)
                    }
                    else {
                        addAssetFromModelElements(scriptName, parent, comprise, genericName);
                        resetControlsState()
                        hideMessage()
                    }
                }}
                onCancel={() => {
                    addSystemElements(scriptName, parent, comprise, genericName)
                    resetControlsState()
                    hideMessage()
                }}
                onHide={() => {
                    hideMessage()
                }}
                elements={checkedModelElementsWithAssets} />)
        } else {
            addSystemElements(scriptName, parent, comprise, genericName)
        }
    }

    const getEntitiesDuplicated = () => checkedEntities.filter(entity => isDuplicate(entity))

    const isDuplicate = (entity) => systemElements.some(element => hasDuplicatedRelatedEntities(element, entity) || hasDuplicatedModelViewers(element, entity))

    const hasDuplicatedRelatedEntities = (element, entity) => element.relatedEntities.some(related => entity._id === related._id)

    const hasDuplicatedModelViewers = (element, entity) => element.modelViewerIds.some(model => entity.modelViewerIds.some(entityModel => entityModel === model))

    const checkEntitiesDuplicated = (parent) => {
        const checkedEntitiesDuplicated = getEntitiesDuplicated()
        if (!_.isEmpty(checkedEntitiesDuplicated)) {
            showMessage(<QuestionDuplicateOverlay
                onConfirm={() => {
                    hideMessage()
                    checkModelElementAssets(parent)
                }}
                onCancel={() => {
                    hideMessage()
                }}
                elements={checkedEntitiesDuplicated} />)
        } else {
            checkModelElementAssets(parent)
        }
    }

    const addAsDownstreamOf = (parent) => {
        try {
            if (!generic)
                if (!comprise || (comprise && entitiesHaveSameType())) checkEntitiesDuplicated(parent)
                else showMessage(<div>Looks like selected entities are mixed type. Please select same type entities in order create system element.</div>, 2000)
            else {
                createSystemElement(scriptName, parent, genericName, [], [])
                resetControlsState()
             }
        } catch (e) {
            console.error(e)
            showMessage(<div>{e.message}</div>, 2000)
        }
    }

    const addElement = () => addAsDownstreamOf(selectedSystemElement)

    const handleCheck = (checkedInstance) => {
        updateChecked({ id: checkedInstance.modelViewerIds[0], checked: !checkedInstance.checked })
    }

    const allChecked = checkedEntities.length === allSelectedElements.length;

    const handleAllCheck = () => setChecked(allChecked ? [] : allSelectedElements.map(e => e._id));

    const onGenericCheck = () => { setGeneric(generic => !generic); if (generic) { setGenericName("") } }

    const isElementSelected = () => !!selectedSystemElement

    const COMPRISE_TEXT = `ADD ALL AS ONE ${isElementSelected() ? "CHILD " : ""}ELEMENT`;

    const buttonOptions = [
        COMPRISE_TEXT,
        (checkedEntities.length === 1 ? `ADD ${isElementSelected() ? "CHILD " : ""}ELEMENT` : `ADD AS SEPARATE ${isElementSelected() ? "CHILDREN " : ""}ELEMENTS`)
    ];

    const [isFetching, setIsFetching] = useState(false)

    const onSelectElements = async (elements, areSpaces) => {
        setIsFetching(true)
        await onViewerSelect(elements, areSpaces)
        setIsFetching(false)
    }

    const resetControlsState = () => {
        setGeneric(false)
        setComprise(false)
        setGenericName("")
    }

    useEffect(() => {
        if (elementNotFound) showMessage(<div>Looks like selected element are not found.</div>, 2000)
        setElementNotFound(false)
    }, [elementNotFound])


    const isolatedElementIds = React.useMemo(
        () =>
            isolatedEntities.map(e => e.modelViewerIds[0]),
        [isolatedEntities]
    );

    const highlightedElementIds = React.useMemo(
        () =>
            allSelectedElements.map(e => e.modelViewerIds[0]),
        [allSelectedElements]
    );

    const hiddenElementIds = React.useMemo(
        () =>
            hiddenEntities.map(e => e.modelViewerIds[0]).concat(hiddenModelIds),
        [hiddenEntities,hiddenModelIds]
    );

    const coloredElementIds = React.useMemo(
        () =>
            systemElements.reduce((els, e) => [...els, ...e.modelViewerIds], []),
        [systemElements]
    );

    return <div className='middle-content'>
        <SystemsViewer
            model={model}
            viewerResizeCanvas={true}
            isolatedElementIds={isolatedElementIds}
            highlightedElementIds={highlightedElementIds}
            hiddenElementIds={hiddenElementIds}
            onSelect={onSelectElements}
            themeColor={systemColor}
            coloredElementIds={coloredElementIds}
            clearfilterModeEntities={clearfilterModeEntities}
            clearNonModelElements={clearNonModelElements}
            spaceMode={spaceMode}
            setSpaceMode={setSpaceMode}
            setAddToWorkbenchOnSelect={setAddToWorkbenchOnSelect}
            addToWorkbenchOnSelect={addToWorkbenchOnSelect}
        />
        <div className='selected-elements-action-panel'>
            <div>
                <Switch checked={generic} onChange={onGenericCheck} />Generic
            </div>
            {generic && <>
                <input type="text" value={genericName}
                    onChange={e => setGenericName(e.target.value)}
                    placeholder={'Provide an element name'} className={'system-generic-input'}
                />
                <GenericMatButton disabled={_.isEmpty(genericName)} customClasses={`add-generic-button ${_.isEmpty(genericName) ? 'add-generic-button-disabled' : ''}`} onClick={addElement}>
                    Add generic element
                </GenericMatButton>
            </>}
        </div>
        {(!generic && !isFetching) && <>
            <div className={'entity-detail-table-container'}>
                <EntityDetailTable
                    entities={allSelectedElements.map(e => ({ ...e, checked: checkedEntities.some(c => c._id === e._id) }))}
                    onCheck={handleCheck} onAllCheck={handleAllCheck} allChecked={allChecked}
                    columns={columns}
                    onDelete={removeEntities}
                />
            </div>
            <div className={"add-element-button-bar"}>
                {!_.isEmpty(allSelectedElements) && <>
                    {comprise && <input type="text" value={genericName}
                        onChange={e => setGenericName(e.target.value)}
                        placeholder={'Provide an element name'} className={'system-generic-input'}
                    />}
                    <SplitButton options={buttonOptions}
                        onClick={addElement}
                        disabled={generic ? _.isEmpty(genericName) : comprise ? _.isEmpty(genericName) || _.isEmpty(checkedEntities) : _.isEmpty(checkedEntities)}
                        buttonClass={'pink-button'}
                        containerClass={'split-button-container'}
                        airaLabel={'Select an option'}
                        onOptionChange={option => setComprise(option === COMPRISE_TEXT)}
                    />
                </>}
            </div>
        </>}
        {isFetching && <div className='drawer-spinner'>Retrieving data...<i className="fas fa-spinner fa-spin" /></div>}
    </div>
}
