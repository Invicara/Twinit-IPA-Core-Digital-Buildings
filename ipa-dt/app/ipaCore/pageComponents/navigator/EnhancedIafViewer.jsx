import {IafViewerDBM} from "@dtplatform/iaf-viewer";
import _ from 'lodash';
import React from 'react';
import KeepAlive, { withActivation } from 'react-activation';
import {listIncludes} from "@invicara/ipa-core/modules/IpaUtils";

class ViewerWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clickedModelIds: []
          };
        this.vRef = React.createRef()
    }
    resetGlassMode = async () => {
        let commands = _.get(this.iafViewerDBMRef, "current.iafviewerRef.current.commands");
        if (commands && commands.setDrawMode) {
            //reset glass mode
            await commands.setDrawMode(false /*glassMode*/, false /*glassModeFromToolbar*/, undefined /*newDrawMode*/);
        }
        if (commands && commands.resetAll) {
            //reset glass mode
            //await commands.resetAll(); not desired
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.isolatedEntities !== prevProps.isolatedEntities && _.isEmpty(this.props.isolatedEntities)) {
            this.resetGlassMode();
        }
    }
    render() {
        const getModelEntities = async () => {
            let commands = _.get(this.vRef, "current.iafviewerRef.current.commands");
            if (commands && commands.getSelectedEntities) {
                let pkgIds = await commands.getSelectedEntities();
                if (pkgIds && pkgIds.length > 0) {
                    let result = [];
                    for (const pkgId of pkgIds) {
                        if (isNaN(pkgId)) {
                            result.push({id: pkgId})
                        } else {
                            result.push({id: parseInt(pkgId)})
                        }
                    }
                    return result;
                } else {
                    return [];
                }
            }
        };
    
        const selectEntities = async () => {
            const modelSelectedEntities = await getModelEntities();
            const hasNewElementsSelected = !listIncludes(
                _.sortBy([...this.props.highlightedElementIds, this.state.clickedModelIds]),
                _.sortBy(modelSelectedEntities.map(({id}) => id))
                );
            if (modelSelectedEntities && modelSelectedEntities.length > 0 && hasNewElementsSelected) {
                this.state.clickedModelIds = modelSelectedEntities.map(({id}) => id)
                this.props.onSelect(modelSelectedEntities);
            }
        };

        return (<div onClick={selectEntities}>
                <IafViewerDBM ref={this.vRef} {...this.props} />
            </div>
        );
    }
}

const Viewer = withActivation(ViewerWrapper)

//TODO Remove repetition with SystemsViewer, try to make KeepAplive's 'name' work or else at least extract shared logic to a HOC
export const EnhancedIafViewer = ({
                                      model,
                                      isolatedElementIds, 
                                      sliceElementIds,
                                      isolatedEntities,
                                      spaceElementIds,
                                      highlightedElementIds,
                                      viewerResizeCanvas,
                                      onSelect,
                                      hiddenElementIds,
                                      themeColor,
                                      coloredElementIds,

                                  }) => {
    
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

    const extra = {
        model: model,
        serverUri: endPointConfig.graphicsServiceOrigin,
        sliceElementIds,
        isolatedEntities,
        isolatedElementIds,
        spaceElementIds,
        hiddenElementIds,
        selection: highlightedElementIds,
        highlightedElementIds,
        viewerResizeCanvas: viewerResizeCanvas,
        settings: viewerSettings,
        saveSettings: saveSettingsCallback,
        // colorGroups:colorGroups(),
        onSelect: onSelect,
    }

    return (
        <KeepAlive name={"Navigator"}>
            <Viewer {...extra} />
        </KeepAlive>
    )
};
