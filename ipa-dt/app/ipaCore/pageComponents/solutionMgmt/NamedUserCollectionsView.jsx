import React, { useState, useEffect } from "react";
import { connect, useDispatch } from 'react-redux';
import withRouter from "react-router/es/withRouter";
import { compose } from "@reduxjs/toolkit";
import _ from "lodash";
import { Tab, Tabs, Box, Toolbar, Typography, makeStyles, LinearProgress, TablePagination } from "@material-ui/core";
import { Cancel } from "@material-ui/icons";

import './NamedUserCollectionsView.scss'
import ActionsPanel from "./ActionsPanel";
import CollectionsTable from "./CollectionsTable";
import RelateCollections from './collectionManagmentTabs/RelateCollections'
import ManageIndexes from './collectionManagmentTabs/ManageIndexes'
import DataValidation from './collectionManagmentTabs/DataValidation'
import NamedUserCollectionsDetailView from "./NamedUserCollectionsDetailView";
import { NewCollectionModalFactory } from './collectionsManagmentModals/NewCollectionModal'
import { DeleteCollectionModalFactory } from './collectionsManagmentModals/DeleteCollectionModal'
import { NamedUserItems } from "@invicara/ipa-core/modules/IpaRedux";
import { ToastContainer, useToast, Toast, SuccessToast, ErrorToast, WarningToast } from "@invicara/ipa-core/modules/IpaControls";
import {IafScriptEngine} from '@dtplatform/iaf-script-engine'
import { usePagination } from "./Pagination.jsx"

const EntityTableToolbar = ({ numSelected }) => {

    return (
        <React.Fragment>
            <Toolbar disableGutters={true} variant="dense">
                {numSelected > 0 ? (
                    <Typography variant="overline" display="block" gutterBottom className="toolbar-collcetion-total"
                    >{`Showing ${numSelected} ${numSelected > 1 ? 'collections' : 'collection'}`}
                    </Typography>
                ) : 'No collections found'}
            </Toolbar>
        </React.Fragment>
    );
};

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1
    },
    colorPrimary: {
        background: '#C71784'
    },
    barColorPrimary: {
        background: 'white'
    },
    customTabRoot: {
        color: ' #3E3E3E',
        "& .Mui-selected": {
            color: "#C71784",
          },
    },
    customTabIndicator: {
        backgroundColor: "#C71784"
    }
}));

const ValErrorToast = ({ message }) => {
    return (<Toast className={'error-toast'}>
        <Cancel className="icon" />
        <div>
            <p style={{ display: 'inline', fontWeight: 'bold' }}>Data validation has failed!</p>
            <div>{message}</div>
        </div>
    </Toast>)
}

const DEFAULT_ERROR_MESSAGE = "An unexpected error happened."

const NamedUserCollectionsView = ({ onLoadComplete, handler, namedUserItemEntities = {}, namedUserItemsLoadingStatus, masterPage, detailPage, history, actions }) => {
    const [columns, setColumns] = useState([
        {
            id: '_name',
            accessor: '_name',
            name: 'Name',
            minWidth: 170,
            align: 'left',
            format: (value) => value.toLocaleString('en-US'),
        },
        {
            id: '_items',
            accessor: '_items',
            name: 'Items',
            minWidth: 170,
            align: 'left',
            format: (value) => value.toLocaleString('en-US'),
        },
        {
            id: '_description',
            accessor: '_description',
            name: 'Description',
            minWidth: 170,
            align: 'left',
            format: (value) => value.toLocaleString('en-US'),
        },
        {
            id: '_userType',
            accessor: '_userType',
            name: 'User Type',
            minWidth: 170,
            align: 'left',
            format: (value) => value.toLocaleString('en-US'),
        }
    ]);
    const [totalNumOfItems, setTotalNumOfItems] = useState()
    const [isLoading, setIsLoading] = useState(false);
    const [relateFilesAvailable, setRelateFilesAvailable] = useState([])
    const [reloadToken, setReloadToken] = useState(false);
    const [collectionSelected, setCollectionSelected] = useState();
    const [collectionSelected2, setCollectionSelected2] = useState();
    const [allCollections, setAllCollections] = useState()
    const [currentDisplayedCollections, setCurrentDisplayedCollections] = useState()

    const [toasts, addToast] = useToast()
    const [page, rowsPerPage, selectedTab, setSelectedTab, handleChangePage, handlerTabChange, handleChangeRowsPerPage] = usePagination()

    const onStatusChange = (status, message) => {
        switch (status) {
            case 'loading':
                setIsLoading(true);
                break;
            case 'success':
                addToast({toast: <SuccessToast message={message}/>, delay: 7000})
                break;
            case 'error':
                addToast({toast: <ErrorToast message={message || DEFAULT_ERROR_MESSAGE}/>, delay: 7000})
                break;
            case 'warning':
                addToast({toast: <WarningToast message={message}/>, delay: 7000})
                break;
            case 'val-error':
                addToast({toast: <ValErrorToast message={message || DEFAULT_ERROR_MESSAGE}/>, delay: 7000})
        }

        if (status !== 'loading') {
            setIsLoading(false);
        }
    }

    const [originalPromiseResult, setOriginalPromiseResult] = useState();
    const fetchCollectionsAgain = () => setReloadToken(!reloadToken);

    const dispatch = useDispatch();

    async function fetchAllFileItems(entity, ctx) {
        try {
            const result = await IafScriptEngine.getItems({ query: {}, _userItemId: entity._userItemId }, ctx)
            return result
        } catch (rejectedValueOrSerializedError) {
            console.error("fetchAllNamedUserItems error", rejectedValueOrSerializedError)
        }
    }

        async function fetchCollectionsData(options) {
        const scriptName = handler?.config?.scripts?.getAllCollections

        try {
            setIsLoading(true)
            const originalPromiseResult = await dispatch(NamedUserItems.fetchAllNamedUserItems({ scriptName, ctx: {}, options })).unwrap()
            setOriginalPromiseResult(originalPromiseResult)
            setAllCollections(originalPromiseResult._list)
            const collectionsArray = originalPromiseResult._list
            const totalItemsResult = await dispatch(NamedUserItems.fetchNamedUserTotalAmountOfItems({ ctx: {}, collectionsArray })).unwrap()
            setTotalNumOfItems(totalItemsResult)
            
            if(selectedTab !== 'tab1') setCollectionSelected(collectionsArray[0])
            const collections = Object.entries(originalPromiseResult)
            collections.map(async (collection, idx) => {
                if (collection[1]._itemClass === "NamedFileCollection") {
                    const ctx = {}
                    const fileItems = await fetchAllFileItems(collection[1], ctx)
                    const fileSvcRes = await dispatch(NamedUserItems.fetchAssocitedFileSvcData({ fileItems, idx, ctx: {}, options })).unwrap()
                    setRelateFilesAvailable(fileSvcRes)
                }
            })
            setIsLoading(false)
        } catch (rejectedValueOrSerializedError) {
            console.error("fetchAllNamedUserItems error", rejectedValueOrSerializedError);
        }
        if (onLoadComplete) onLoadComplete();
    }

    useEffect(() => {
    fetchCollectionsData();
}, [dispatch, reloadToken, selectedTab]);

    let headers = ['']
    let headersForIndex = []
    columns.forEach((col) => {
        headers.push(col.name)
        headersForIndex.push(col.name)
    })
    headersForIndex.push('')
    const options = {
        emptyMessage: "No data found"
    }

    // Used for setting the current collections displayed in the Collections Table. Used for selecting a new collection via checkbox
    useEffect(() => {
        const totalRowsDisplayed = page * rowsPerPage
        let displayCollections = allCollections?.slice(totalRowsDisplayed, totalRowsDisplayed + rowsPerPage)
        if(displayCollections) {
            setCurrentDisplayedCollections(displayCollections)
            setCollectionSelected(displayCollections[0])}
    }, [rowsPerPage, page]);

    // This works for the Mange Indexes and Related Coollections tabs
    function displayCollections  (rowsPerPage, page, allCollections) {
        const totalRowsDisplayed = page * rowsPerPage
        let displayCollections = allCollections?.slice(totalRowsDisplayed, totalRowsDisplayed + rowsPerPage)
        if(!displayCollections){
            return
        }
        return buildTableCell(displayCollections, columns, totalNumOfItems)
    }

    const buildTableCell = (displayCollections, columns, totalNumOfItems) => {
        let rowsContainer = []
        const entites = Object.entries(displayCollections)
        entites.map((entity, idx) => {
            let nestedRow = []
            columns.map((col) => {
                if (col.accessor === '_items') {
                    if (totalNumOfItems) {
                        if (totalNumOfItems[idx] != undefined) {
                            const value = totalNumOfItems[idx]._total
                            nestedRow.push({ type: 'text', val: value })
                        }
                    } else {
                        nestedRow.push({ type: 'text', val: '' })
                    }
                } else {
                    const value = _.get(entity[1], col.accessor);
                    let dispValue = value && typeof value === 'string' ? value : value ? value.val : null
                    nestedRow.push({ type: 'text', val: dispValue })
                }

                /** 
                 * We put the id of the collection into the first column of the row 
                 * to be able to use it later for searching a row based on it collection key.
                 * */
                if(nestedRow[0]) {
                    nestedRow[0].key = entity[1]._id
                }
            })
            rowsContainer.push(nestedRow)
        })
        return rowsContainer
    }

    const classes = useStyles();
    const setCollectionsSelected = (idx, isSecondCollection) => {
        // This if statement is for the first render of the Collections Table.
        if(!currentDisplayedCollections) {
            const entites = Object.entries(namedUserItemEntities)
            const entity = entites[idx][1]
        if (!isSecondCollection) setCollectionSelected(entity)
        else setCollectionSelected2(entity)
        // The else below is used for everytime a user switches pages after 'currentDisplayedCollections' is created
        } else {
            const entity = currentDisplayedCollections[idx]
            if (!isSecondCollection) {
                setCollectionSelected(entity)
            } else {
                setCollectionSelected2(entity)
            }
        }
    }

    let titles = [ {key:"Add New Collection", label:"Add New Collection", value:"Add New Collection"}, {key:"Delete Collection", label:"Delete Collection", value:"Delete Collection"} ]

    return (
        <div>
            {isLoading || !totalNumOfItems === 'loading' ? <LinearProgress classes={{ colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary }} /> : null}

            <div className={'NamedUserCollectionsView'}>
                <ToastContainer toasts={toasts} />

                <h4>Collection Management</h4>

                <Box sx={{ width: '660px', borderBottom: '1px solid lightGrey' }} >
                    <Tabs
                        value={selectedTab}
                        aria-label="tabs"
                        classes={{
                            root: classes.customTabRoot,
                            indicator: classes.customTabIndicator
                        }}
                        centered={true}
                    >
                        <Tab value="tab1" label="Overview" disableRipple style={{textTransform: 'capitalize', fontSize: '15px'}} onClick={() => {
                            handlerTabChange('tab1')
                        }} />
                        <Tab value="tab2" label="Relate Collections" disableRipple style={{textTransform: 'capitalize', fontSize: '15px'}} onClick={() => {
                            handlerTabChange('tab2')
                        }} />
                        <Tab value="tab3" label="Manage Indexes" disableRipple style={{textTransform: 'capitalize', fontSize: '15px'}} onClick={() => {
                            handlerTabChange('tab3')
                        }} />
                        {handler.actions?.dataValidation?.allow ? <Tab value="tab4" label="Data validation" disableRipple style={{textTransform: 'capitalize', fontSize: '15px'}} onClick={() => setSelectedTab('tab4')} /> : null}
                    </Tabs>
                </Box>

                {selectedTab === 'tab1' &&
                    <div className="table-container">
                        <div className="col1">
                            <div className="row1"> 
                                <h4>Item Service Collection</h4>
                                <div className="collection-actions">
                                    <div className="collection-total">
                                         <EntityTableToolbar numSelected={rowsPerPage}></EntityTableToolbar> 
                                    </div>
                                    <ActionsPanel
                                        handlerActions={handler.actions?.mainPage}
                                        handler={handler}
                                        modalComponents={{
                                            "Add New Collection": NewCollectionModalFactory,
                                            "Delete Collection": DeleteCollectionModalFactory
                                        }}
                                        fetchAgain={fetchCollectionsAgain}
                                        collectionSelected={collectionSelected}
                                        collectionSelected2={collectionSelected2}
                                        onStatusChange={onStatusChange}
                                        titles={titles}
                                    />
                                </div>
                            </div>
                            {allCollections ? 
                            <div className="row2">
                                    <CollectionsTable
                                        headers={headers}
                                        rows={displayCollections(rowsPerPage, page, allCollections)} 
                                        className="collection-table__table"
                                        options={options}
                                        setCollectionsSelected={setCollectionsSelected}
                                        tabName={selectedTab}
                                        setCollectionSelected={setCollectionSelected}
                                        setCollectionSelected2={setCollectionSelected2}
                                        page={page}
                                    />
                                <TablePagination
                                        component="div"
                                        count={originalPromiseResult?._total}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        rowsPerPageOptions={[25, 50, 75, 100]}
                                    />
                                </div>
                            : null }
                        </div>
                        <div className='col2'>
                            <h4>Collection contents</h4>
                            <NamedUserCollectionsDetailView 
                                tabName={selectedTab} 
                                onLoadComplete={() => { }} 
                                handler={handler} 
                                actions={actions} 
                                collectionSelected={collectionSelected} 
                                fetchAgain={fetchCollectionsAgain} 
                                onStatusChange={onStatusChange} 
                                reloadToken={reloadToken} 
                                setCollectionSelected={setCollectionSelected} 
                            />
                        </div>
                    </div>
                }

                {selectedTab === 'tab2' &&
                    <RelateCollections 
                        actions={actions}
                        handler={handler}
                        fetchCollectionsAgain={fetchCollectionsAgain}
                        totalNumOfItems={totalNumOfItems}
                        options={options}
                        collectionSelected={collectionSelected}
                        collectionSelected2={collectionSelected2}
                        headers={headers}
                        tabName={selectedTab}
                        setCollectionSelected={setCollectionSelected}
                        setCollectionSelected2={setCollectionSelected2}
                        onStatusChange={onStatusChange}
                        rows={buildTableCell(namedUserItemEntities, columns, totalNumOfItems)}
                        relateFilesAvailable={relateFilesAvailable}
                        originalPromiseResult={originalPromiseResult}
                        allCollections={allCollections}
                        displayCollections={displayCollections}
                        namedUserItemEntities={namedUserItemEntities}
                    />
                }

                {selectedTab === 'tab3' &&
                    <ManageIndexes headers={headersForIndex}
                        options={options}
                        originalPromiseResult={originalPromiseResult}
                        onStatusChange={onStatusChange}
                        allowEditIndex={handler.actions?.manageIndex?.allow} 
                        setCollectionSelected2={setCollectionSelected2}
                        allCollections={allCollections}
                        displayCollections={displayCollections}
                    />
                }

                {selectedTab === 'tab4' &&
                    <DataValidation
                        handler={handler}
                        actions={actions}
                        onStatusChange={onStatusChange}
                    />
                }
            </div>
        </div>
    )
}

const mapStateToProps = (state) => ({
    namedUserItemEntities: NamedUserItems.selectNamedUserItemEntities(state),
    namedUserItemsLoadingStatus: NamedUserItems.selectNamedUserItemsLoadingStatus(state)
});

const mapDispatchToProps = {
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withRouter
)(NamedUserCollectionsView)