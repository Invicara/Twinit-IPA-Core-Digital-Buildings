import React from "react";
import CollectionsTable from "../CollectionsTable";
import { TablePagination } from "@material-ui/core";
import { usePagination } from "../Pagination.jsx"

const ManageIndexes = ({headers, options, setCollectionSelected, originalPromiseResult, onStatusChange, allowEditIndex, setCollectionSelected2, displayCollections, allCollections}) => {

    const [page, rowsPerPage, selectedTab, setSelectedTab, handleChangePage, handlerTabChange, handleChangeRowsPerPage] = usePagination()

    return (
        <div className="table-container">
            <div className="">
                <h4>Item Service Collection</h4>
                <CollectionsTable
                    headers={headers}
                    rows={displayCollections(rowsPerPage, page, allCollections)} 
                    className="collection-table__table_index" 
                    options={options} 
                    setCollectionSelected={setCollectionSelected}
                    isIndexManagment={true}
                    originalPromiseResult={originalPromiseResult}
                    onStatusChange={onStatusChange}
                    allowEditIndex={allowEditIndex}
                    setCollectionSelected2={setCollectionSelected2}
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
    )
}

export default ManageIndexes;

