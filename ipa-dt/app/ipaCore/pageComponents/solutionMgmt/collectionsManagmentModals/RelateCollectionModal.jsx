import React, { useState, useEffect, useRef } from "react"
import _, { forEach } from 'lodash'

import './RelateCollectionModal.scss'

import { BaseTextInput, GenericMatButton, PinkCheckbox } from "@invicara/ipa-core/modules/IpaControls";
import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import { Modals } from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { IafScriptEngine } from '@dtplatform/iaf-script-engine';
import { IafProj } from '@dtplatform/platform-api'
import { ActionButton } from "../../../components/ActionButtons";
import { Checkbox, FormControlLabel, Popover } from "@material-ui/core";

const RelateCollectionModal = ({ handler, destroyModal, fetchAgain, collectionSelected, collectionSelected2, onStatusChange }) => {
  const [childCollection, setChildCollection] = useState(!_.isEmpty(collectionSelected) ? collectionSelected : undefined)
  const [parentCollection, setParentCollection] = useState(!_.isEmpty(collectionSelected2) ? collectionSelected2 : undefined)
  const [propertiesRelated, setPropertiesRelated] = useState([{ field1: "", field2: "" }])
  const [ignoreChildWithNoParent, setIgnoreChildWithNoParent] = useState(false)
  const [allowMultipleParents, setallowMultipleParents] = useState(false)
  const [relateErrors, setRelateErrors] = useState([]);
  const [childData, setChildData] = useState([])
  const [parentData, setParentData] = useState([])

  const [showItemsWithoutParent, setShowItemsWithoutParent] = useState(false)
  const [showItemsWithMultipleParent, setShowItemsWithMultipleParent] = useState(false)

  async function fetchRelated() {
    await IafScriptEngine.getRelations(
      {
        collectionDesc: { _userItemId: parentCollection ? parentCollection._userItemId : childCollection._userItemId },
        query: { _relatedUserType: childCollection ? childCollection._userType : parentCollection._userType },
        options: { page: { getAllItems: true } }
      }, {}
    ).then((result) => {
      console.log('get relations result', result)
    })
    await IafScriptEngine.getItems({
      _userItemId: childCollection._userItemId,
      options: {
        page: {
          getAllItems: true
        }
      }
    }, {}).then(async (childData) => {
      setChildData(childData)
    })
    if (parentCollection != undefined) {
      await IafScriptEngine.getItems({
        _userItemId: parentCollection._userItemId,
        options: {
          page: {
            getAllItems: true
          }
        }
      }, {}).then(async (parentData) => {
        setParentData(parentData)
      })
    } else {
      setParentData(childData)
    }
  }
  useEffect(() => {
    fetchRelated()
  }, [])

  function addNewRelate() {
    let newProps = [...propertiesRelated]
    newProps.push({ field1: '', field2: '' })
    setPropertiesRelated(newProps)
  }
  function removeRelate(prop) {
    let newProps = [...propertiesRelated]
    _.pull(newProps, prop)
    setPropertiesRelated(newProps)
  }
  function swapCollections() {
    if (parentCollection === collectionSelected2) {
      setChildCollection(collectionSelected2)
      setParentCollection(collectionSelected)
    } else {
      setChildCollection(collectionSelected)
      setParentCollection(collectionSelected2)
    }
  }

  const getProperties = (item) => item?.properties || _.mapValues(item?.fileAttributes, (attr, key) => ({name: key, val: attr})) 


  const matchArrays = (parentArray, childArray, matchProperties) => {
    let childResult = [];
    let parentResult = [];
    let childArrayTransformer = childArray ? childArray : [...parentArray]
    _.forEach(parentArray, item1 => {
      let children = [];
      _.forEach(childArrayTransformer, item2 => {
        if (_.every(matchProperties, matchProp => {
          const prop1 = getProperties(item1)[matchProp.field1]
          const prop2 = getProperties(item2)[matchProp.field2]
          return prop1 && prop2 && prop1.val === prop2.val
        })
          && item1._id !== item2._id) {
          children.push(item2);
        }
      });
      item1.children = children;
      childResult.push(item1);
    });
    _.forEach(childArrayTransformer, item1 => {
      let parent = [];
      _.forEach(parentArray, item2 => {
        if (_.every(matchProperties, matchProp => {
          const prop1 = getProperties(item1)[matchProp.field1]
          const prop2 = getProperties(item2)[matchProp.field2]
          return prop1 && prop2 && prop1.val === prop2.val
        })
          && item1._id !== item2._id) {
          parent.push(item2);
        }
      });
      item1.parent = parent;
      parentResult.push(item1);
    });
    return { childResult: childResult, parentResult: parentResult }
  };


  const createRelations = async (items, parentColl, childColl = undefined) => {
    let relatedItems = _.map(items, (item) => {
      let obj = {
        parentItem: { _id: item._id },
        relatedItems: _.map(item.children, (child) => { return { _id: child._id } })
      }
      return obj
    })
    let current_proj = await IafProj.getCurrent({});
    await IafScriptEngine.createRelations(
      {
        parentUserItemId: parentColl._userItemId,
        _userItemId: childColl ? childColl._userItemId : parentColl._userItemId,
        _namespaces: current_proj._namespaces,
        relations: relatedItems
      }, {}
    ).then((result) => {
      return result
    })
  }

 async function testAndSave() {
    onStatusChange('loading')
    try {

      let canCreateRelations = true
      let arraysMatched = parentCollection != undefined ? 
        matchArrays(parentData, childData, propertiesRelated) : 
        matchArrays(childData, undefined, propertiesRelated)

      let relateErrors = [];

      let itemsToRelate = arraysMatched.childResult.filter(items => items.children.length > 0)
      let itemsWithoutParentObj = arraysMatched.childResult.filter(items => items.children.length === 0)
      let itemsWithMultipleParentObj = arraysMatched.parentResult.filter(items => items.parent.length > 1)
      if (itemsWithoutParentObj.length > 0) {
        if (!ignoreChildWithNoParent) {
          relateErrors.push({type: "NO_PARENT", payload: itemsWithoutParentObj})
          canCreateRelations = false
        }
      }
      if (itemsWithMultipleParentObj.length > 0) {
        if (!allowMultipleParents) {
          relateErrors.push({type: "MULTIPLE_PARENTS", payload: itemsWithMultipleParentObj})
          canCreateRelations = false
        }
      }
  
      setRelateErrors(relateErrors);
      if(canCreateRelations === true) {
        if(itemsToRelate.length > 0) {
          await createRelations(itemsToRelate, childCollection, undefined)
          destroyModal()
          onStatusChange('success', `Relations have been successfully created!`)
        } else {
          destroyModal()
          onStatusChange('warning', `No relations created base on given criteria!`)
        }
      } else {
        onStatusChange()
      }
    } catch (error) {
      destroyModal()
      onStatusChange('warning', error.message)
    }
  }


  const [matchingOptions, setMatchingOptions] = useState([]);
  const [showOptions, setShowOptions] = useState({idx: undefined, secondField: false, anchor: null});

  const getFieldVars = (secondField = false) => ({
    fieldName: secondField ? "field2" : "field1",
    collection: secondField ? (_.isEmpty(parentData) ? childData : parentData) : childData,
  })

  const handleInputChange = (e, idx, secondField) => {

    let newProps = [...propertiesRelated]
    newProps[idx][getFieldVars(secondField).fieldName] = e.target.value
    setPropertiesRelated(newProps)
    // Find matching options

    const matches = Object.keys(getProperties(getFieldVars(secondField).collection[0]) || []).filter((option) =>
      option.toLowerCase().includes(e.target.value.toLowerCase())
    );

    setMatchingOptions(matches);
    if(idx !== showOptions.idx || secondField !== showOptions.secondField) {
      setShowOptions({idx, secondField, anchor: e.currentTarget});
    }

  };

  const handleOptionClick = (option, idx, secondField) => {
    let newProps = [...propertiesRelated]
    newProps[idx][getFieldVars(secondField).fieldName] = option
    setPropertiesRelated(newProps)
    setMatchingOptions([]);
    setShowOptions({idx: undefined, secondField: false, anchor: null});
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowOptions({idx: undefined, secondField: false, anchor: null});
    }, 200);
  };


  return (
    <GenericModal
      title="Relate Items"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-relate"
      closeText="Cancel"
      modalBody={
        <div className="relate-modal">
          {parentCollection ? <div className="relate-hierarchy">
            <div className="relate-hierarchy-title-container">
              <div className="relate-hierarchy-title">Related items hierarchy</div>
              <div className="relate-hierarchy-subtitle"><span className="relate-required">* </span>Required Information</div>
            </div>
            <div className="relate-hierarchy-collection">
              <div>Child item collection<span className="relate-required"> *</span></div>
              <BaseTextInput inputProps={{
                  onChange: () => { },
                  value: childCollection._name,
                }}
              />
            </div>
            <div className="relate-hierarchy-arrows">
              <i className={'fa fa-arrow-down'}></i>
              <i className={'fa fa-arrow-down'}></i>
              <i className={'fa fa-arrow-down'}></i>
            </div>
            <div className="relate-hierarchy-collection relate-hierarchy-collection__bottom">
              <div>Parent item collection<span className="relate-required"> *</span></div>
              <BaseTextInput inputProps={{
                  onChange: () => { },
                  value: parentCollection._name,
                }}
              />
            </div>
            <div className="relate-hierarchy-swap">
              <GenericMatButton customClasses="relate-hierarchy-swap-button" onClick={() => swapCollections()}>Swap Items</GenericMatButton>
            </div>
          </div> : null}
          <div className="relate-form">
            <div className="relate-match">
              <div className="relate-match-title-container">
                <div className="relate-match-title">Match child items to parent items</div>
                <div className="relate-match-subtitle">Match one or more child item properties to a parent item property</div>
              </div>
              <div className="relate-match-properties-container">
                {propertiesRelated.length > 1 && <div className="relate-match-properties-and relate-match-properties-and--placeholder"></div>}
                <div className="relate-match-properties-title relate-match-properties-title--left">{`${childCollection._name} item property`}<span className="relate-required"> *</span></div>
                <div className="relate-match-properties-title relate-match-properties-title--right">{`${parentCollection != undefined ? parentCollection._name : childCollection._name} item property`}<span className="relate-required"> *</span></div>
                <div className="relate-match-properties">
                  {propertiesRelated.map((prop, idx) => {
                    
                    return <>
                      {propertiesRelated.length > 1 && idx != 0 && <div className="relate-match-properties-and"> <span>and</span></div>}
                      <span className="relate-match-properties-typeahead-container relate-match-properties-typeahead-container--left">
                        <BaseTextInput inputProps={{
                            onChange: (e) => handleInputChange(e, idx),
                            value: prop.field1,
                            onBlur: handleInputBlur
                          }}
                        />
                         <Popover
                            id={idx}
                            anchorEl={showOptions.anchor}
                            disablePortal={true}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            onClose={handleInputBlur}
                            open={showOptions.idx === idx && !showOptions.secondField}
                            disableAutoFocus={true}
                            disableEnforceFocus={true}
                            className="relate-options-popover"
                            PaperProps={{style: {width: showOptions.anchor?.offsetWidth}}}
                          >
                            <ul className="options-list">
                              {matchingOptions.map((option) => {
                                const index = option.toLowerCase().indexOf(prop.field1.toLowerCase());
                                return (
                                  <li key={option} onClick={() => handleOptionClick(option, idx)}>
                                    {option.substring(0, index)}
                                    <span className="match">{option.substring(index, index + prop.field1.length)}</span>
                                    {option.substring(index + prop.field1.length)}
                                  </li>
                                );
                              })}
                              {!matchingOptions || matchingOptions.length === 0 && <p className="option-empty">No recommendations</p>}
                            </ul>
                        </Popover>
                      </span>
                      <i className={'relate-match-arrow-right fa fa-arrow-right'}></i>
                      <span className="relate-match-properties-typeahead-container relate-match-properties-typeahead-container--right">
                        <BaseTextInput inputProps={{
                            onChange: (e) => handleInputChange(e, idx, true),
                            value: prop.field2,
                            onBlur: handleInputBlur
                          }}
                        />
                          <Popover
                            id={idx}
                            anchorEl={showOptions.anchor}
                            disablePortal={true}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            onClose={handleInputBlur}
                            open={showOptions.idx === idx && showOptions.secondField}
                            disableAutoFocus={true}
                            disableEnforceFocus={true}
                            className="relate-options-popover"
                            PaperProps={{style: {width: showOptions.anchor?.offsetWidth}}}
                          >
                            <ul className="options-list">
                              {matchingOptions.map((option) => {
                                const index = option.toLowerCase().indexOf(prop.field2.toLowerCase());
                                return (
                                  <li key={option} onClick={() => handleOptionClick(option, idx, true)}>
                                    {option.substring(0, index)}
                                    <span className="match">{option.substring(index, index + prop.field2.length)}</span>
                                    {option.substring(index + prop.field2.length)}
                                  </li>
                                );
                              })}
                              {!matchingOptions || matchingOptions.length === 0 && <p className="option-empty">No recommendations</p>}
                            </ul>
                        </Popover>
                      </span>
                      {idx < propertiesRelated.length-1 && <div className={'relate-match-properties-trash'}><i className={'fa fa-trash'} onClick={() => { removeRelate(prop) }}></i></div>}
                      {idx === propertiesRelated.length-1 && <div className="relate-match-addmore" onClick={() => { addNewRelate() }}><i className={'fa fa-plus'}></i><span>Add More</span></div>}
                    </>
                  })}
                </div>
              </div>
              <div className="relate-match-checkboxes">
                <div>
                  <FormControlLabel 
                    control={
                      <PinkCheckbox
                        sx={{
                          padding: 0
                        }}
                        checked={ignoreChildWithNoParent}
                        onChange={e => setIgnoreChildWithNoParent(!ignoreChildWithNoParent)}
                        size="small"
                      />
                    }
                    label={<span>Ignore child items with no related parent item</span>}
                  />
                </div>
                <div>
                  <FormControlLabel 
                    control={
                      <PinkCheckbox
                        checked={allowMultipleParents}
                        onChange={e => setallowMultipleParents(!allowMultipleParents)}
                        size="small"
                      />
                    }
                    label={<span>Allow child items to relate to multiple parent items</span>}
                  />
                </div>
            </div>
              {relateErrors.length > 0 && <div className="relate-match-errors">{relateErrors.map(err => {
                let component;
                switch(err.type) {
                  case "NO_PARENT":
                    component = <div>
                      <div>Warning: Some child items have no related items <span onClick={() => { setShowItemsWithoutParent(showItemsWithoutParent => !showItemsWithoutParent) }}>Show {showItemsWithoutParent ? "Less" : "More"}</span></div>
                      {showItemsWithoutParent && <div className="relate-match-error-items">
                        {err.payload.map((item, i) => {
                          return <span>{item.Name || "index: " + i}</span>
                        })}
                      </div>}
                    </div>
                    break;
                  case "MULTIPLE_PARENTS":
                    component = <div>
                      <div>Error: Some child items are related to multiple parents <span onClick={() => { setShowItemsWithMultipleParent(showItemsWithMultipleParent => !showItemsWithMultipleParent) }}>Show {showItemsWithMultipleParent ? "Less" : "More"}</span></div>
                      {showItemsWithMultipleParent && <div className="relate-match-error-items">
                        {err.payload.map(item => {
                          return <span>{item.Name}</span>
                        })}
                      </div>}
                    </div>
                    break;
                  default:
                    component = <p>err.payload</p>
                    break;
                }
                return component
              })}</div>}
            </div>
            <div className={"relate-buttons"}>
              <ActionButton onClick={() => destroyModal()} label={'Cancel'} className={'cancel-button'} />
              <ActionButton onClick={() => testAndSave()} label={'Run a Test & Save'} className={'apply-button'} />
            </div>
          </div>
        </div>
      }
      closeButtonHandler={() => destroyModal()}
      noPadding={true}
    />
  )
}

const mapStateToProps = state => ({
  modal: state.modal
})

const mapDispatchToProps = {
  destroyModal: Modals.destroy
}


const ConnectedRelateCollectionModal = connect(mapStateToProps, mapDispatchToProps)(RelateCollectionModal)
export default ConnectedRelateCollectionModal

export const RelateCollectionModalFactory = {
  create: ({ handler, reduxStore, collectionSelected, collectionSelected2, fetchAgain, onStatusChange }) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedRelateCollectionModal,
      props: { handler, fetchAgain, collectionSelected, collectionSelected2, onStatusChange },
      open: true
    }))
  }
}