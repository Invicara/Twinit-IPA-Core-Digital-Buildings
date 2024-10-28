import {useState} from "react"

export const usePagination = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [selectedTab, setSelectedTab] = useState('tab1')

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
      };

      const handlerTabChange = (tab) => {
        setSelectedTab(tab)
        setRowsPerPage(25)
        setPage(0)
      }

      const handleChangeRowsPerPage = (event) => {
        const res = parseInt(event.target.value, 10)
        setRowsPerPage(res);
        setPage(0);
    };

  return [page, rowsPerPage, selectedTab, setSelectedTab, handleChangePage, handlerTabChange, handleChangeRowsPerPage]
}