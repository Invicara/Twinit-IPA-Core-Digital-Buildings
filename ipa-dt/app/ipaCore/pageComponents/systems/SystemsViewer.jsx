import {IafViewerDBM} from "@dtplatform/iaf-viewer";
import _ from 'lodash';
import React, {useEffect, useRef, useState} from 'react';
import {listEquals} from "@invicara/ipa-core/modules/IpaUtils";
import KeepAlive, { withActivation } from 'react-activation';
import Switch from "@material-ui/core/Switch/Switch";
import {ScriptCache} from '@invicara/ipa-core/modules/IpaUtils'
import interact from "interactjs";

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

const getAllSpaceModelIds = async () => {
    const allSpaces = await ScriptCache.runScript("getSpaces");
    return allSpaces.flatMap(space => space.modelViewerIds)
}

class ViewerWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clickedModelIds: []
        };
    }

    render() {
        const vRef = React.createRef()
        const getModelEntities = async () => {
            let commands = _.get(vRef, "current.iafviewerRef.current.commands", {});
            if (!commands.getSelectedEntities) {
                return []
            }
            let pkgIds = await commands.getSelectedEntities();
            if (!pkgIds ||!pkgIds.length) {
                return []
            }
            return pkgIds.map(id => isNaN(id) ? { id } : { id: parseInt(id) })
        };

        const selectEntities = async () => {
            const modelSelectedEntities = await getModelEntities();
            if (
                modelSelectedEntities &&
                modelSelectedEntities.length > 0 &&
                !listEquals(
                    _.sortBy(modelSelectedEntities.map(({id}) => id)),
                    _.sortBy(this.props.highlightedElementIds)
                )
            )
                this.props.onSelect(modelSelectedEntities);
        };

        return (<div onClick={_.debounce(selectEntities, 1000)}>
                <IafViewerDBM ref={vRef} {...this.props} />
            </div>
        );
    }
}

const Viewer = withActivation(ViewerWrapper)

export const SystemsViewer = ({
    model,
    isolatedElementIds,
    highlightedElementIds,
    viewerResizeCanvas,
    onSelect,
    hiddenElementIds,
    themeColor,
    coloredElementIds,
    clearfilterModeEntities,
    clearNonModelElements,
    spaceMode,
    setSpaceMode,
    setAddToWorkbenchOnSelect,
    addToWorkbenchOnSelect
}) => {
    const [allSpaceModelIds, setAllSpaceModelIds] = useState()
    const [isolateSystem, setIsolateSystem] = useState(false)
    const [viewerHeight, setViewerHeight] = useState()
    const viewer = useRef();

    useEffect(() => {
        interact(viewer.current).resizable({
            edges: {left: false, right: false, bottom: true, top: false},
            listeners: {
                move(event) {
                    let target = event.target;
                    event.target.style['height'] = `${event.rect.height}px`
                },
                start(event) {
                    event.target.style['transition'] = 'none'
                },
                end(event) {
                    event.target.style['transition'] = 'height 1s';
                    setViewerHeight(event.target.offsetHeight)
                }
            },
        })
    }, [viewer.current])

    useEffect(() => {
        getAllSpaceModelIds().then(setAllSpaceModelIds)
    }, [])

    const toggleSpaceMode = () => {
        if (isolateSystem) {
            setIsolateSystem(false)
        }
        setSpaceMode(!spaceMode)
        clearfilterModeEntities()
        clearNonModelElements()
    }

    const toggleIsolateSystem = () => {
        if (spaceMode) {
            setSpaceMode(false)
        }
        setIsolateSystem(isolate => !isolate)
    }

    const toggleAddToWorkbench = () => setAddToWorkbenchOnSelect(!addToWorkbenchOnSelect)

    const saveSettingsCallback = (settings) => {
        localStorage.iafviewer_settings = JSON.stringify(settings);
    };

    let viewerSettings = undefined;
    if (localStorage.iafviewer_settings) {
        viewerSettings = JSON.parse(localStorage.iafviewer_settings);
    }

    const colorGroups = () => [{
        "groupName": "SystemColor",
        "colors":
            [{
                "color": themeColor,
                "opacity": 0.9,
                "elementIds": coloredElementIds
            }]
    }]

    const getIsolatedOrSpaceModeIds = () => _.isEmpty(isolatedElementIds) ? [] : isolatedElementIds;

    const getIsolatedElementIds = () => isolateSystem ? coloredElementIds : getIsolatedOrSpaceModeIds();

    const selectElements = elements => {
        onSelect(elements, spaceMode)
    }

    const extra = {
        model: model,
        serverUri: endPointConfig.graphicsServiceOrigin,
        sliceElementIds: getIsolatedElementIds(),
        hiddenElementIds: hiddenElementIds,
        selection: highlightedElementIds,
        viewerResizeCanvas: viewerResizeCanvas,
        settings: viewerSettings,
        saveSettings: saveSettingsCallback,
        colorGroups:colorGroups(),
        onSelect: selectElements,
        highlightedElementIds: highlightedElementIds,
        spaceElementIds: spaceMode ? allSpaceModelIds : []
    }

    return (<>
            <div className={'viewer-toggles'}>
                <div className={'viewer-toggle'}>
                    Show spaces<Switch style={toggleStyle} checked={spaceMode} onChange={toggleSpaceMode}/>
                </div>
                <div className={'viewer-toggle'}>
                    Isolate System<Switch style={toggleStyle} checked={isolateSystem} onChange={toggleIsolateSystem}/>
                </div>
                <div className={'viewer-toggle'}>
                    Add to workbench on select <Switch style={toggleStyle} checked={addToWorkbenchOnSelect} onChange={toggleAddToWorkbench}/>
                </div>
            </div>
            <div className='systems-viewer' ref={viewer} style={{height: '60%'}}>
                <KeepAlive name={"Systems"}>
                    <Viewer {...extra}/>
                </KeepAlive>
            </div>
        </>
    );
};
