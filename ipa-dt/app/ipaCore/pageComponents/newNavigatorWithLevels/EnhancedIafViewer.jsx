import {IafViewerDBM} from "@dtplatform/iaf-viewer";
import _ from 'lodash';
import React, {useCallback, useMemo} from 'react';
import KeepAlive, { withActivation } from 'react-activation';
import {listIncludes, listEquals} from "@invicara/ipa-core/modules/IpaUtils";
import {extractSpacesFromEntities} from "../../components/EntityEnabledIafViewer";

class ViewerWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            previouslyClickedModelIds: []
        };
        this.iafViewerDBMRef = React.createRef();
    }

    highlightedElementIds = _.memoize((_selectedEntities) => (_selectedEntities||[]).map(e => e.modelViewerIds[0]));
    extractSpacesFromEntitiesMemo = _.memoize((_isolatedEntities) =>(extractSpacesFromEntities||[])(_isolatedEntities));
    isolatedElementIds = _.memoize((_isolatedRemainingEntities) => (_isolatedRemainingEntities||[]).map(e => e.modelViewerIds[0]).filter(e => e !== undefined));
    sliceElementIds = _.memoize((_isolatedRemainingEntities) => (_isolatedRemainingEntities||[]).map(e => e.modelViewerIds[0]).filter(e => e !== undefined));
    spaceElementIds = _.memoize((_isolatedSpaces) => (_isolatedSpaces||[]).map(e => e.modelViewerIds[0]).filter(e => e !== undefined));

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
        if(this.props.isolatedEntities !== prevProps.isolatedEntities && _.isEmpty(this.props.isolatedEntities)){
            this.resetGlassMode();
        }
        if(this.props.selectedLevel !== prevProps.selectedLevel) {
            this.setCuttingPlane(this.props.selectedLevel)
        }
        /* leaving it here, might be useful for debugging later on
        Object.keys(prevProps)
            .filter(key => {
                return prevProps[key] !== this.props[key];
            }).map(key => {
                console.log('changed property:',key,'from',this.props[key],'to',prevProps[key]);
            });
         */
    }

    getModelEntities = async () => {
        let commands = _.get(this.iafViewerDBMRef, "current.iafviewerRef.current.commands");
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


    selectEntities = async () => {
        const modelSelectedEntities = await this.getModelEntities();
        const modelSelectedEntitiesIds = !modelSelectedEntities ? [] : modelSelectedEntities.map(({id}) => id);

        if(modelSelectedEntities && modelSelectedEntities.length > 0){
            //sync UI => take the model as single source of truth, and sync UI
            const highlightedElementIdsOutOfSync = !listIncludes(
                _.sortBy(this.highlightedElementIds(this.props.selectedEntities)),
                _.sortBy(modelSelectedEntitiesIds)
            );
            const previouslyClickedModelIdsOutOfSync = !listIncludes(
                _.sortBy(this.state.previouslyClickedModelIds),
                _.sortBy(modelSelectedEntitiesIds)
            );
            if(previouslyClickedModelIdsOutOfSync || highlightedElementIdsOutOfSync){
                this.props.onSelect(modelSelectedEntities);
                this.setState({previouslyClickedModelIds: modelSelectedEntitiesIds})
            }
        } else {
            //clear UI => if we are in assets view
            const {isolatedRemainingEntities} = this.extractSpacesFromEntitiesMemo(this.props.isolatedEntities);
            if(this.sliceElementIds(isolatedRemainingEntities).length>0 && this.state.previouslyClickedModelIds && this.state.previouslyClickedModelIds.length>0){
                this.props.onSelect(modelSelectedEntities);
                this.setState({previouslyClickedModelIds: modelSelectedEntitiesIds})
            }
        }
    }

    getCuttingPlane = async () => {
        let commands = _.get(this.iafViewerDBMRef, "current.iafviewerRef.current.commands");
        console.log("CuttingPlanes:", commands.getCuttingPlanes())
    }

    setCuttingPlane = async (zLevel) => {
        let viewer = _.get(this.iafViewerDBMRef, "current.iafviewerRef.current");
        const boundingBox = viewer.getModelBoundingBox()
        await viewer.iafCuttingPlanesUtils.updateCuttingPlanes(
            zLevel,
            boundingBox.min.z,
            boundingBox.min.x,
            boundingBox.min.x,
            boundingBox.min.y,
            boundingBox.min.y, 
        )
        await viewer.iafCuttingPlanesUtils.showCuttingPlaneGeometry(false)
        await viewer.iafCuttingPlanesUtils.enableCuttingPlanes(true)
    }

    render() {


        const {isolatedSpaces, isolatedRemainingEntities} = this.extractSpacesFromEntitiesMemo(this.props.isolatedEntities);


        //remove keepalive container details from passed props to avoid re-render
        const props = {...this.props, _container : undefined}

        return (<div onClick={this.selectEntities}>
                <IafViewerDBM ref={this.iafViewerDBMRef} {...props}
                    sliceElementIds={this.sliceElementIds(this.props.isolatedEntities)}
                    highlightedElementIds={this.highlightedElementIds(this.props.selectedEntities)}
                    isolatedElementIds={this.isolatedElementIds(isolatedRemainingEntities)}
                    spaceElementIds={this.spaceElementIds(isolatedSpaces)}
                    selection={this.highlightedElementIds(this.props.selectedEntities)}
                />
            </div>
        );
    }
}

const Viewer = withActivation(ViewerWrapper)

//TODO Remove repetition with SystemsViewer, try to make KeepAplive's 'name' work or else at least extract shared logic to a HOC
export const EnhancedIafViewer = ({
                                      model,
                                      isolatedEntities,
                                      selectedEntities,
                                      viewerResizeCanvas,
                                      onSelect,
                                      hiddenElementIds,
                                      themeColor,
                                      coloredElementIds,
                                      selectedLevel
                                  }) => {
    
    const saveSettingsCallback = useCallback((settings) => {localStorage.iafviewer_settings = JSON.stringify(settings)},[]);
    const emptyArray = useMemo(()=>[],[]);
    const viewerSettings = useMemo(()=>localStorage.iafviewer_settings  ? JSON.parse(localStorage.iafviewer_settings ) : undefined ,[localStorage.iafviewer_settings ]);

    const colorGroups = useMemo(() => [{
        "groupName": "SystemColor",
        "colors":
            [{
                "color": themeColor,
                "opacity": 0.9,
                "elementIds": coloredElementIds
            }]
    }],[]);

    const extra={
        model: model,
        serverUri: endPointConfig.graphicsServiceOrigin,
        hiddenElementIds: hiddenElementIds,//TODO
        viewerResizeCanvas: viewerResizeCanvas,
        settings: viewerSettings,
        saveSettings: saveSettingsCallback,
        // colorGroups:colorGroups(),
        onSelect: onSelect,
        isolatedEntities,
        selectedEntities : _.isEmpty(selectedEntities) ? emptyArray : selectedEntities, //trying to avoid re-render here
        selectedLevel: selectedLevel
    }


    return (
        <KeepAlive name={"Navigator"}>
            <Viewer {...extra} />
        </KeepAlive>
    );
};
