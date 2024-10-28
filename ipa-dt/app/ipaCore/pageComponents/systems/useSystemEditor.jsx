import React, {useState} from "react";
import _ from "lodash";

export const useSystemEditor = (onSave, system, currentSystemCategoryType) => { //TODO Analyze and remove the in-store duplicated storage of category/type
    const [systemName, setSystemName] = useState(_.get(system, 'System Name'));
    const [systemDescription, setSystemDescription] = useState(_.get(system, 'properties.System Description.val'));
    const [systemCategoryType, setSystemCategoryType] = useState(currentSystemCategoryType);
    const [systemStatus, setSystemStatus] = useState(_.get(system, 'properties.System Status.val'));
    const [systemInfoMessage, setSystemInfoMessage] = useState({message: '', error: false});
    const [systemColor, setSystemColor] = useState(_.get(system, 'properties.System Color.val'));

    const trySaveSystem = () => {
        setSystemInfoMessage({message: 'Saving...', error: false})
        try {
            onSave(systemName, systemDescription, systemCategoryType, systemStatus, systemColor)
            setSystemInfoMessage({message: '', error: false})
        } catch (e) {
            setSystemInfoMessage({message: e.message, error: true})
        }
    }

    return {
        systemName,
        setSystemName,
        systemDescription,
        setSystemDescription,
        systemCategoryType,
        setSystemCategoryType,
        systemStatus,
        setSystemStatus,
        systemInfoMessage,
        setSystemInfoMessage,
        trySaveSystem,
        systemColor,
        setSystemColor
    }
}
