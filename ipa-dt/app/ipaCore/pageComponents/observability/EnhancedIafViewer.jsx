import {IafViewerDBM} from "@dtplatform/iaf-viewer";
import _ from 'lodash';
import React, {useCallback, useMemo} from 'react';
import KeepAlive, { withActivation } from 'react-activation';
import {listIncludes, listEquals} from "@invicara/ipa-core/modules/IpaUtils";

class ViewerWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            previouslyClickedModelIds: []
        };
        this.iafViewerDBMRef = React.createRef();
    }

    highlightedElementIds = _.memoize((_selectedEntities) => (_selectedEntities||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));
    isolatedElementIds = _.memoize((_isolatedRemainingEntities) => (_isolatedRemainingEntities||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));
    sliceElementIds = _.memoize((_isolatedRemainingEntities) => (_isolatedRemainingEntities||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));
    spaceElementIds = _.memoize((_isolatedSpaces) => (_isolatedSpaces||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));
    //focusedElementIds = _.memoize((_focusedEntity) => (_focusedEntity ? [_focusedEntity] : []).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));
    hiddenElementIds = _.memoize((_hiddenEntities) => (_hiddenEntities||[]).reduce((acc,e) => acc.concat(e.modelViewerIds),[]).filter(id => id !== undefined));


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
    componentDidMount() {
        //When the page mounts load the async data (script and other)
        //and then create the column info for the upload table
        //this.setState({isPageLoading: true});
        this.props.onRefCreated && this.props.onRefCreated(this.iafViewerDBMRef);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.isolatedEntities !== prevProps.isolatedEntities && _.isEmpty(this.props.isolatedEntities)){
            this.resetGlassMode();
        }
        this.props.onRefCreated && this.props.onRefCreated(this.iafViewerDBMRef);
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
        console.log("VIEWER CLICKED >>>>",this)
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
            if(this.sliceElementIds(this.props.isolatedRemainingEntities).length>0 && this.state.previouslyClickedModelIds && this.state.previouslyClickedModelIds.length>0){
                this.props.onSelect(modelSelectedEntities);
                this.setState({previouslyClickedModelIds: modelSelectedEntitiesIds})
            }
        }
    }

    render() {
        //remove keepalive container details from passed props to avoid re-render
        const props = {...this.props, _container : undefined}

        //const isolatedElementIds = this.isolatedElementIds(this.props.isolatedEntities);
        //const isolatedElementIdsWithoutSpace = this.isolatedElementIds(this.props.isolatedRemainingEntities);

        return (<div onClick={this.selectEntities}>
                <IafViewerDBM ref={this.iafViewerDBMRef} {...props}
                    hiddenElementIds={this.hiddenElementIds(this.props.hiddenEntities)}
                    sliceElementIds={this.sliceElementIds(this.props.isolatedEntities)}
                    //isolatedElementIds={this.isolatedElementIds(this.props.isolatedRemainingEntities)}
                    isolatedElementIds={this.isolatedElementIds(this.props.isolatedEntities)}
                    //isolatedElementIds={isolatedElementIds.length==1 ? isolatedElementIds : isolatedElementIdsWithoutSpace}
                    spaceElementIds={this.spaceElementIds(this.props.isolatedSpaces)}
                    highlightedElementIds={this.highlightedElementIds(this.props.selectedEntities)}
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
                                      hiddenEntities,
                                      themeColor,
                                      coloredElements,
                                      coloredGroups,
                                      isolatedSpaces,
                                      isolatedRemainingEntities,
                                      focusedEntity,
                                      onRefCreated
                                  }) => {
    
    const saveSettingsCallback = useCallback((settings) => {localStorage.iafviewer_settings = JSON.stringify(settings)},[]);
    const emptyArray = useMemo(()=>[],[]);
    const viewerSettings = useMemo(()=>localStorage.iafviewer_settings  ? JSON.parse(localStorage.iafviewer_settings ) : undefined ,[localStorage.iafviewer_settings ]);

    const colorGroups = useMemo(() => {
        if(coloredGroups){
            return coloredGroups;
        }
        if(!coloredElements){
            return undefined;
        }
        return [{
        "groupName": "SystemColor",//or Chair Name
        "colors":
            [{
                "color": themeColor,
                "opacity": 1,
                "elementIds": coloredElements.reduce((acc,e) => acc.concat(e.modelViewerIds),[]) //chair package id
            }]
    }]},[coloredElements,coloredGroups]);

    const extra={
        model: model,
        serverUri: endPointConfig.graphicsServiceOrigin,
        hiddenEntities: hiddenEntities,
        viewerResizeCanvas: viewerResizeCanvas,
        settings: viewerSettings,
        saveSettings: saveSettingsCallback,
        colorGroups:colorGroups,
        onSelect: onSelect,
        isolatedEntities,
        selectedEntities : _.isEmpty(selectedEntities) ? emptyArray : selectedEntities, //trying to avoid re-render here
        isolatedSpaces: isolatedSpaces,
        isolatedRemainingEntities: isolatedRemainingEntities,
        focusedEntity: focusedEntity,
        onRefCreated: onRefCreated
    }


    return (
        <KeepAlive name={"TelemetryNavigator"}>
            <Viewer {...extra} />
        </KeepAlive>
    );
};
