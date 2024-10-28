import React, {useState} from "react";
import {StackableDrawer} from "@invicara/ipa-core/modules/IpaControls";
import Select from 'react-select';
import Switch from "@material-ui/core/Switch/Switch";

const toggleStyle = {
    switchBase: {
        '&$checked': {
            color: "#00A693",
        },
        '&$checked + $track': {
            backgroundColor: "#efefef",
        },
    },
    checked: {
        color: "#00a693ba",
    },
    track: {},
}

export const SystemsFileVisibilityPanel = ({fileOptions, hiddenFiles, setHiddenSourceFiles, loadSourcefileIndex}) => {
    const [isFetching, setIsFetching] = useState(false)

    const fetchSourcefileIndex = async () => {
            setIsFetching(true)
            await loadSourcefileIndex()
            setIsFetching(false)
    }

    const toggleHiddenFile = (file, isVisible) =>{
        if(isVisible){
            setHiddenSourceFiles(hiddenFiles.filter(hf => hf !== file))
        } else {
            setHiddenSourceFiles([...hiddenFiles, file])
        }
    }

    //TODO: Maybe not hard-code drawer order in each component?
    return <StackableDrawer level={3} iconKey={'fa-eye-slash'} defaultOpen={false} onOpen={fetchSourcefileIndex} isDrawerOpen={false} tooltip={"Hide elements by file"}>
        <div className='fetch-container' style={!isFetching ? {display: 'block'} : {display: "none"}}>
            {fileOptions.map(file =>
                <div className={'file-toggle'}>
                    <div className={'file-toggle-name'}>{file}</div>
                    <Switch style={toggleStyle} checked={!hiddenFiles.includes(file)} onChange={(evt, val) => toggleHiddenFile(file, val)}/>
                </div>
            )}
        </div> 
        {isFetching && <div className='drawer-spinner'>Retrieving data...<i className="fas fa-spinner fa-spin"/></div> }
    </StackableDrawer>
}
