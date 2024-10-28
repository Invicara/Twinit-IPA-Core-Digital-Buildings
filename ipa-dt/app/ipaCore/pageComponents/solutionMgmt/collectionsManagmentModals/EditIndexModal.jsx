import React, { useState } from "react"
import _ from 'lodash'
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import { GenericModal } from "@invicara/ipa-core/modules/IpaDialogs";
import { Modals } from '@invicara/ipa-core/modules/IpaRedux';
import { connect } from "react-redux";
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import './Kanban.scss'
import TaskCard from './TaskCard';
import { useEffect } from "react";
import * as PlatformApi from '@dtplatform/platform-api'
import {IafScriptEngine} from '@dtplatform/iaf-script-engine';
import { ActionButton } from "../../../components/ActionButtons";
import { IafItemSvc } from '@dtplatform/platform-api';

const EditIndexModal = ({ row, data, collection, destroyModal, onStatusChange }) => {
  const [indexesList, setIndexesList] = useState([])
  const [currentIndexes, setCurrentIndexes] = useState() 
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    setColumnItems()
    onStatusChange()
  }, [])

  let currentIndexesCopy = currentIndexes

  async function getCollection(collection) {
    let ctx = {}
    if(collection._itemClass === 'NamedUserCollection') {
      let itemRes = await IafScriptEngine.getItems({
        query: {},
        collectionDesc: { 
          _userType: collection._userType,
          _userItemId: collection._userItemId
        },
        options: { 
          "page": {
            "_pageSize": 1,
            "_offset":0,
          } 
        } 
        }, ctx)
        return itemRes
    } else {
      return []
    }
    
  }

  let items = Object.keys(data._list.length === 0 ? [] : (_.isEmpty(data._list[0].properties) ? [] : data._list[0].properties ))

  const initalColumns = {
    ['NoIndex']: {
      title: 'No Index',
      items: items,
    },
    ['NormalIndex']: {
      title: 'Normal Index',
      items: [],
    },
    ['TextIndex']: {
      title: 'Text Index',
      items: [],
    },
  }

  const getKey = (key) => key.replace('properties.', '').replace('.val', '')

  async function setColumnItems() {
    const collectionRes = await getCollection(collection)
    let newColumns = initalColumns
    let indexes = await PlatformApi.IafItemSvc.getIndexes(collection._id, {})
    setIndexesList(indexes._list)

    let indexTypes = []
    indexes._list.map(index => {
      indexTypes.push(index.name)
    })
    setCurrentIndexes(indexTypes)

    // Setting each item to the correct column
    let itemProp = collectionRes[0]?.properties
    if(!itemProp) {
      setColumns(newColumns)
    } else {
      Object.entries(itemProp).map(([k, v]) => {
        if (itemProp[k]['indexColumn'] === 'Text Index') {
          const replacedName = itemProp[k]['dName']
          _.pull(newColumns.NoIndex.items, replacedName)
          if(!_.includes(newColumns.TextIndex.items, replacedName)) newColumns.TextIndex.items.push(replacedName)
        } else if (itemProp[k]['indexColumn'] === 'Normal Index') {
          const replacedName = itemProp[k]['dName']
          _.pull(newColumns.NoIndex.items, replacedName)
          if(!_.includes(newColumns.NormalIndex.items, replacedName)) newColumns.NormalIndex.items.push(replacedName)
        }
      })
      setColumns(newColumns)
    }
  }

  async function saveAndClose(collection) {
    destroyModal()
    const collectionRes = await getCollection(collection)
    let collectionCopy = _.cloneDeep(collectionRes)
    let userCollectionId = collection._id
    let relatedItemId = collectionRes[0]._id
    let collectionProps = collectionCopy[0].properties

    let textkeys = {}
    let textIndexReq

    // Ran for each item moved to the Text column
    columns.TextIndex.items.forEach(async item => {
      // For any item moved from the Normal column to the Text column, we remove the normal index
        if((!collectionProps[`${item}`]['indexColumn']) || (collectionProps[`${item}`]['indexColumn'] === 'Normal Index')) { 

          indexesList.map(async index => {
            if(index.name === `properties.${item}.val`) {
                await PlatformApi.IafItemSvc.dropIndex(collection._id, { name: `properties.${item}.val` }, {}).then(
                onStatusChange('success', `Normal index properties.${item}.val has been successfully deleted!`)
              )
            }
          })
        
          collectionProps[`${item}`]['indexColumn'] = 'Text Index'
          columns.TextIndex.items.map(item => {
            textkeys[`properties.${item}.val`] = 'text'
          })

          textIndexReq = {
            _id: collection._id,
            indexDefs: [
              {
                key: textkeys,
                options: {
                  name: "text_search_index",
                  default_language: "english"
                }
              }
            ]
          }
          if (columns.TextIndex.items.length > 0) {
            onStatusChange('loading')
            await IafScriptEngine.createOrRecreateIndex(textIndexReq, {}).then(
              onStatusChange('success', `Text index has been successfully created!`)
            )
            // We update the collection to include the new indexColumn property in the item
            await IafItemSvc.updateRelatedItem(userCollectionId, relatedItemId, collectionCopy[0]);
          }
        }
      })

    // For each item moved to the Normal column
    if (columns.NormalIndex.items.length > 0) {
      columns.NormalIndex.items.forEach(async item => {
        // For any item moved from the Text column to the Normal column
        if((!collectionProps[`${item}`]['indexColumn']) || (collectionProps[`${item}`]['indexColumn'] === 'Text Index')) {
          // If we remove all items from the Text column, we drop the Text Search Index completely
          if (_.isEmpty(columns.TextIndex.items) && _.includes(currentIndexesCopy, 'text_search_index')) {
            _.pull(currentIndexesCopy, 'text_search_index')
            await PlatformApi.IafItemSvc.dropIndex(collection._id, { name: 'text_search_index' }, {}).then(
              onStatusChange('success', `Text index has been successfully deleted!`)
            )
          }

          collectionProps[`${item}`]['indexColumn'] = 'Normal Index'
          let NormalIndexReq = {
            _id: collection._id,
            indexDefs: [
              {
                key: {
                  [`properties.${item}.val`]: 1
                },
                options: {
                  name: `properties.${item}.val`
                }
              }
            ]
          }

          onStatusChange('loading')
          await IafScriptEngine.createOrRecreateIndex(NormalIndexReq, {}).then(
            onStatusChange('success', `Normal ${item} index has been successfully created!`)
          )
          await IafItemSvc.updateRelatedItem(userCollectionId, relatedItemId, collectionCopy[0]); 
        }
       
      })
    }

    columns.NoIndex.items.map(async (item) => {
      let columnType = collectionCopy[0].properties[item].indexColumn

      if (columnType) {
        // We are deleting the indexColumn property from the item and updating the collection
        delete collectionCopy[0].properties[item]['indexColumn']
        await IafItemSvc.updateRelatedItem(userCollectionId, relatedItemId, collectionCopy[0]);

        // For each item we move from the Text column to the No Index column
        // When at least one item is still in the Text index column
        if(!_.isEmpty(columns.TextIndex.items) && columnType === 'Text Index') {
          let textkeys ={}
          columns.TextIndex.items.map(item => {
            textkeys[`properties.${item}.val`] = 'text'
          })

          let textIndexReq3 = {
            _id: collection._id,
            indexDefs: [
              {
                key: textkeys,
                options: {
                  name: "text_search_index",
                  default_language: "english"
                }
              }
            ]
          }

          // Creating a Text index for each item that is still in the Text column
          await IafScriptEngine.createOrRecreateIndex(textIndexReq3, {}).then(
            onStatusChange('success', `Text index ${collectionCopy[0].properties[item].dName} has been successfully deleted!`)
          )
        } else if (_.isEmpty(columns.TextIndex.items) && columnType === 'Text Index' && _.includes(currentIndexesCopy, 'text_search_index')){
          // If all items are moved from the Text column, we drop the Text Search Index completely
          _.pull(currentIndexesCopy, 'text_search_index')
          await PlatformApi.IafItemSvc.dropIndex(collection._id, { name: 'text_search_index' }, {}).then(
            onStatusChange('success', `Text index has been successfully deleted!`)
          )
        }
      }
    })

    if (columns.NoIndex.items.length > 0) {
      // For each item moved from the Normal column to the No Index column
      columns.NoIndex.items.forEach(
        async item => {
          indexesList.forEach(async idx => {
            const key = getKey(idx.name)
            if (item === key) {
              onStatusChange('loading')
              await PlatformApi.IafItemSvc.dropIndex(collection._id, { name: idx.name }, {}).then(
                onStatusChange('success', `Normal index ${item} has been successfully deleted!`)
              )
            }
          })
        }
      )
    }
  }

  const onDragEnd = async (result, columns, setColumns) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      const result = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      }
      setColumns(result);
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    }
  };

  return (
    <GenericModal
      title="Edit Index"
      barClasses="bark-light"
      customClasses="ipa-modal-collection-management ipa-modal-collection-management-index"
      closeText="Cancel"
      modalBody={
        <div>
          <div className="index-subtitle">Drag and drop your item inside “Normal Index” or “Text Index” and define your collection</div>
          <div className="index-name"><span>Name</span><input type='text' disabled value={row[0].val} /></div>
          <DragDropContext
            onDragEnd={(result) => onDragEnd(result, columns, setColumns)}
          >
            <div className='Container'>
              {Object.entries(columns).map(([columnId, column], index) => {
                return (
                  <Droppable key={columnId} droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div className='TaskList'
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <span className='Title'>{column.title}</span>
                        {column.items.map((item, index) => (
                          <TaskCard key={item} item={item} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
          <div className="action-buttons">
              
            </div>
          <div className="index-buttons-container"><div className="index-buttons action-buttons">
              <ActionButton onClick={() => destroyModal()} label={'Close'} className={'cancel-button'}/>
              <ActionButton onClick={() => saveAndClose(collection)} label={<><i className="fa fa-plus" />Save and Close</>} className={'apply-button'}/>
          </div></div>
        </div>
      }
      noPadding={true}
    />
  )
}


const mapStateToProps = (state) => ({
  modal: state.modal,
});

const mapDispatchToProps = {
  destroyModal: Modals.destroy
}


const ConnectedEditIndexModal = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter
)(EditIndexModal)

export default ConnectedEditIndexModal

export const EditIndexModalFactory = {
  create: ({ reduxStore, row, data, collection, onStatusChange }) => {
    reduxStore.dispatch(Modals.setModal({
      component: ConnectedEditIndexModal,
      props: { row, data, collection, onStatusChange },
      open: true
    }))
  }
}