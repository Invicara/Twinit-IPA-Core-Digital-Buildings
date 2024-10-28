import React, {useState} from "react"
import _ from 'lodash'
import { Tooltip } from "@material-ui/core";
import Select from "react-select";

import './ActionsPanel.scss';

import { useStore } from "react-redux";

const ActionsPanel = ({ handlerActions, handler, modalComponents, collectionSelected, collectionSelected2, fetchAgain, onStatusChange, titles, setCollectionSelected }) => {
  const [selectedOption, setSelectedOption] = useState()
  const reduxStore = useStore();

  const buttonNames = ['Add New Collection', 'Delete Collection']
  const modalPopup = (actionName) => {
      if (collectionSelected || buttonNames.includes(actionName)) {
      let ModalComponentFactory = modalComponents[actionName];
      return ModalComponentFactory.create({ handler, reduxStore, collectionSelected, collectionSelected2, fetchAgain, onStatusChange, setCollectionSelected })
    }
    else return
  }

  const customStyles = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      width: 200,
      border: state.isFocused ? '2px solid var(--app-accent-color)' : null,
      boxShadow: "none",
    }),
  }

  const chanegHandler = (selected) => {
    modalPopup(selected)
    setSelectedOption(selected)
  }

  const renderIcons = (icons) => {
   return (
      <div>
          <div className="actions-panel">
            {icons}
          </div>

        <div className="actions-dropdown">
          <Select
              labelProps={{text: 'Action Buttons'}}
              isMulti={false}
              styles={customStyles}
              onChange={selected => chanegHandler(selected.value)}
              options={titles}
              value={selectedOption}
              placeholder={'Select...'}
              isClearable 
              required={false}
              menuPlacement="auto"
              menuPosition="fixed"
            />
        </div>
      </div>
      )
    }

  let icons = []
  if (handlerActions) {
    Object.keys(handlerActions).forEach(actionName => {
      let action = handlerActions[actionName];
      if (action.allow)
        icons.push(
          <Tooltip key={"icon-" + actionName} title={actionName}>
            <i className={`${action.icon} ${collectionSelected || actionName === 'Add New Collection'? 'enabled' : 'disabled'}`} onClick={() => modalPopup(actionName)}><p>{actionName}</p></i>
          </Tooltip>
        )
    })
  }
  return renderIcons(icons);
}

export default ActionsPanel;