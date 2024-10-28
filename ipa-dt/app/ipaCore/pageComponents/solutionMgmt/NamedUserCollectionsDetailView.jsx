import React, {useEffect, useState} from "react"
import {connect, useDispatch} from 'react-redux';
import {compose} from "@reduxjs/toolkit";
import _ from "lodash";

import {NamedUserItems} from "@invicara/ipa-core/modules/IpaRedux";
import {JSONEditor} from "@invicara/ipa-core/modules/IpaPageComponents";
import { Toolbar, Typography } from "@material-ui/core";
import { SimpleTextReducer } from "@invicara/ipa-core/modules/IpaControls";

import ActionsPanel from "./ActionsPanel";
import './NamedUserCollectionDetailViews.scss'
import {RecreateCollectionModalFactory} from './collectionsManagmentModals/RecreateCollectionModal'
import {AddToCollectionModalFactory} from './collectionsManagmentModals/AddToCollectionModal'
import {ReplaceCollectionModalFactory} from './collectionsManagmentModals/ReplaceCollectionModal'
import {UpdateCollectionModalFactory} from './collectionsManagmentModals/UpdateCollectionModal'


const EntityTableToolbar = ({numSelected}) => {

    return (
        <React.Fragment>
        <Toolbar disableGutters={true} variant="dense">
            {numSelected > 0 ? (
                <Typography variant="overline" display="block" gutterBottom
                >{`Showing ${numSelected} ${numSelected > 1 ? 'items' : 'item'}`}
                </Typography>
            ) : 'No items found'}
        </Toolbar>
        </React.Fragment>
    );
};

const NamedUserCollectionsDetailView = ({onLoadComplete, handler, collectionSelected, fetchAgain, tabName, onStatusChange, secondCollection, reloadToken, setCollectionSelected}) => {
    const [fetchedData, setFecthedData] = useState({})

    useEffect( () => {
        if(onLoadComplete) onLoadComplete();
    }, []);

    const dispatch = useDispatch()
    useEffect( () => {
        async function fetchData() {
        const scriptName = handler?.config?.scripts?.getTopItems
        
            try {
                onStatusChange('loading')
                const originalPromiseResult = await dispatch(NamedUserItems.fetchNamedUserItemItems({scriptName, ctx:{}, userType:collectionSelected._userType, userItemId:collectionSelected._userItemId})).unwrap()
                setFecthedData(originalPromiseResult)
                onStatusChange('')
            } catch (rejectedValueOrSerializedError) {
                setFecthedData([])
                console.error("fetchAllNamedUserItems error");
                console.error(rejectedValueOrSerializedError)
            }
            if(onLoadComplete) onLoadComplete()
        }
        collectionSelected && fetchData()
    }, [dispatch, collectionSelected, reloadToken]);

    let titles = [ {key:"Recreate", label:"Recreate", value:"Recreate"}, {key:"Replace", label:"Replace", value:"Replace"}, {key:"Add To", label:"Add To", value:"Add To"}, {key:"Update", label:"Update", value:"Update"} ]

    return (
        collectionSelected ? <React.Fragment>
        <div className="row-1">
            <div className={secondCollection ? "collection-info-double" : tabName === 'tab2' ? "collection-info-single" :"collection-info"}>
                <SimpleTextReducer text={collectionSelected._name} limit={18} style={{font: 'caption'}}/>
                <div className='detail-collection-info'>
                    <EntityTableToolbar numSelected={fetchedData._pageSize}></EntityTableToolbar>
                </div>
            </div>
            {tabName === 'tab1' ? <div className='detail-actions-panel'>
            <ActionsPanel
                handlerActions={handler.actions?.detailedPage}
                handler={handler}
                modalComponents={{
                    'Recreate': RecreateCollectionModalFactory,
                    'Replace': ReplaceCollectionModalFactory,
                    'Add To': AddToCollectionModalFactory,
                    'Update': UpdateCollectionModalFactory 
                }}
                collectionSelected={collectionSelected}
                fetchAgain={fetchAgain}
                tabName={tabName}
                onStatusChange={onStatusChange}
                titles={titles}
                setCollectionSelected={setCollectionSelected}
            /> 
            </div> : null}
         </div> 

        <div className="row-2">
        {tabName === 'tab2' ?
            <div className="json-viewer">
                <JSONEditor jsonValue={JSON.stringify(fetchedData._list, null, 4)} readOnly={true} onChange={_.noop}></JSONEditor>
            </div> :
            <JSONEditor jsonValue={JSON.stringify(fetchedData._list, null, 4)} readOnly={true} onChange={_.noop}></JSONEditor>}
        </div>
         

        </React.Fragment> : null
    );
}

const mapStateToProps = (state, ownProps) => {
    return {
        namedUserItemEntities: NamedUserItems.selectNamedUserItemEntities(state),
}};

export default compose(
    connect(mapStateToProps)
)(NamedUserCollectionsDetailView)