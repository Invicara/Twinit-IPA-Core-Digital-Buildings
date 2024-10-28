import React, { useState, useEffect } from "react";
import { LinearProgress, makeStyles } from "@material-ui/core";
import '../NamedUserCollectionsView.scss'
import ActionsPanel from "../ActionsPanel";
import CollectionsTable from "../CollectionsTable";
import NamedUserCollectionsDetailView from "../NamedUserCollectionsDetailView";
import { NewCollectionModalFactory } from '../collectionsManagmentModals/NewCollectionModal'
import { RelateCollectionModalFactory } from '../collectionsManagmentModals/RelateCollectionModal'
import './tabs.scss'
import EntityTableToolbar from "../EntityTableToolbar";
import { usePagination } from "../Pagination.jsx"
import { TablePagination } from "@material-ui/core";

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
        color: "#C71784"
    },
    customTabIndicator: {
        backgroundColor: "#C71784"
    }
}));

const RelateCollections = ({ handler, actions, fetchCollectionsAgain, totalNumOfItems, options, collectionSelected2, headers, tabName, setCollectionSelected2, onStatusChange, 
                             relateFilesAvailable, originalPromiseResult, allCollections, displayCollections, namedUserItemEntities }) => {

    const classes = useStyles();
    let titles = [ {key:"Add New Collection", label:"Add New Collection", value:"Add New Collection"}, {key:"Relate Collection", label:"Relate Collection", value:"Relate Collection"} ]

    const [page, rowsPerPage, selectedTab, setSelectedTab, handleChangePage, handlerTabChange, handleChangeRowsPerPage] = usePagination()

    const [currentDisplayedCollections, setCurrentDisplayedCollections] = useState()
    const [collectionSelected, setCollectionSelected] = useState();

    useEffect(() => {
        const totalRowsDisplayed = page * rowsPerPage
        let displayCollections = allCollections?.slice(totalRowsDisplayed, totalRowsDisplayed + rowsPerPage)
        if(displayCollections) {
            setCurrentDisplayedCollections(displayCollections)
            setCollectionSelected(displayCollections[0])}
    }, [rowsPerPage, page]);

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

    return (
        <div className="table-container">
            <div className="col1">
                <div className="row1">
                    <h4>Collections</h4>
                    <div className="collection-actions">
                        <div className="collection-total">
                            <EntityTableToolbar numSelected={rowsPerPage}></EntityTableToolbar>
                        </div>
                        <ActionsPanel
                            handlerActions={handler.actions?.relatePage}
                            handler={handler}
                            modalComponents={{
                                "Add New Collection": NewCollectionModalFactory,
                                "Relate Collection": RelateCollectionModalFactory
                            }}
                            fetchAgain={fetchCollectionsAgain}
                            collectionSelected={collectionSelected}
                            collectionSelected2={collectionSelected2}
                            onStatusChange={onStatusChange}
                            titles={titles}
                        />
                    </div>
                </div>

                <div className="row2">
                    {!totalNumOfItems ? <LinearProgress classes={{ colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary }} /> : null}
                        <CollectionsTable
                            headers={headers}
                            rows={displayCollections(rowsPerPage, page, allCollections)}
                            className="collection-table__table"
                            options={options}
                            setCollectionsSelected={setCollectionsSelected}
                            tabName={tabName}
                            collectionSelected={collectionSelected || {...collectionSelected}}
                            setCollectionSelected={setCollectionSelected}
                            collectionSelected2={collectionSelected2 || {...collectionSelected2}}
                            setCollectionSelected2={setCollectionSelected2}
                            isRelateCollections={true}
                            relateFilesAvailable={relateFilesAvailable}
                            actions={actions}
                            onStatusChange={onStatusChange}
                            fetchCollectionsAgain={fetchCollectionsAgain}
                            page={page}
                            rowsPerPage={rowsPerPage}
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
            </div>
            <div className={collectionSelected2 ? 'colrelate' : 'col2'}>
                <h4>Collection contents</h4>
                <NamedUserCollectionsDetailView tabName={'tab2'} onLoadComplete={() => { }} handler={handler} actions={actions} collectionSelected={collectionSelected} fetchAgain={fetchCollectionsAgain} secondCollection={collectionSelected2} onStatusChange={onStatusChange} />
            </div>
            {collectionSelected2 && <div className='colrelate'>
                <h4>Collection contents</h4>
                <NamedUserCollectionsDetailView tabName={'tab2'} onLoadComplete={() => { }} handler={handler} actions={actions} collectionSelected={collectionSelected2} fetchAgain={fetchCollectionsAgain} secondCollection={collectionSelected2} onStatusChange={onStatusChange} />
            </div>}
        </div>)
}

export default RelateCollections;