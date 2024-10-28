import React from "react";
import { Card } from "@material-ui/core";
import TelemetryIafViewer from "../observability/TelemetryIafViewer";


export class ViewerCard extends React.Component {

    ref = React.createRef();
    readingTypeInterval;
    levelsInterval;

    state = {
        pointsToDisplay: this.props.readingTypes[0], 
        hasManuallySelected: false,
        selectedLevel: undefined
    }

    componentDidMount(){
        const { readingTypes, interval=12, levels } = this.props;

        this.readingTypeInterval = setInterval(() => {
            if(!this.state.hasManuallySelected){
                const { pointsToDisplay } = this.state;
                const newIndex = readingTypes.indexOf(pointsToDisplay) === readingTypes.length - 1 ? 0 : readingTypes.indexOf(pointsToDisplay) + 1;
                this.setState({pointsToDisplay: readingTypes[newIndex]});
            }
        }, interval*1000);

        if(levels){
            this.levelsInterval = setInterval(() => {
                const {selectedLevel} = this.state;
                const newIndex = levels.indexOf(selectedLevel) === levels.length ? 0 : levels.indexOf(selectedLevel) + 1;
                this.setState({selectedLevel: levels[newIndex]})
            }, (interval/levels.length)*1000);
        }
    }

    componentWillUnmount(){
        clearInterval(this.readingTypeInterval);
        if(levelsInterval) clearInterval(levelsInterval);
    }
    
    render(){
        const {selectedModel, columnPosition, columnWidth, rowPosition, rowWidth, baseData, collectionsWithReadings, readingTypes, topView=true} = this.props;

        const {assets, metricsConfig} = baseData || {};

        const { pointsToDisplay, selectedLevel } = this.state;

        const displayConfig = metricsConfig?.find(c => c.pointName === pointsToDisplay)
        
        const gridColumnEnd = columnPosition + columnWidth
        const gridRowEnd = rowPosition + rowWidth

        return <Card className="big-card" style={{padding: "2.1vh", gridColumnStart: 2, gridColumnEnd, gridRowStart: 4, gridRowEnd, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", backgroundColor: 'white'}}>
            <>
                {displayConfig?.displayName && <div className="card-title">{`Overall ${displayConfig?.displayName}`} <span style={{opacity: 0.5, fontWeight: 500, fontSize: "1.7vh"}}>{`(${displayConfig?.unit})`}</span></div>}
                <div style={{display: "block", height: "calc(51vh - 62px)", marginBottom: "1vh"}}>
                    {metricsConfig && <TelemetryIafViewer
                        name={'NavigatorViewer'}
                        model={selectedModel}
                        viewerResizeCanvas={true}
                        hiddenEntities={undefined}
                        selectedEntities={[]}
                        isolatedSpaces={[]}
                        isolatedAssets={assets}
                        hiddenElementIds={[]}
                        disableViewerCube={true}
                        setViewerCameraOnTop={topView}
                        onSelect={() => {}}
                        selectedLevel={selectedLevel}
                        isDisplayShaded={true}
                        backgroundColours={[[255, 255, 255], [255, 255, 255]]}
                        iafViewerDBMRef={this.ref}
                        pointsToDisplay = {[pointsToDisplay]}
                        collectionsWithReadings = {collectionsWithReadings}
                        metricsConfig = {metricsConfig}
                    />}
                </div>
            </>
            {metricsConfig && <>
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                    <div style={{display: "flex", padding: "5px 0px", top: 0}}>
                        {readingTypes.map((t, i) => <div onClick={() => this.setState({pointsToDisplay: readingTypes[i], hasManuallySelected: true})} className="iterative-points" style={{opacity: t === pointsToDisplay ? 1 : 0.6}}/>)}
                    </div>

                    <RangesBar {...{displayConfig}}/>
                </div>
            </>}
        </Card>
    }
}

const RangesBar = ({displayConfig}) => {

    if(!displayConfig) return null;

    return <div style={{width: "25%"}}>
        <div style={{display: "flex"}}>
            {displayConfig?.ranges?.map(r => <div style={{height: "0.5vh", backgroundColor: r?.color, width: `${100 / displayConfig.ranges.length}%`}} />)}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
            {displayConfig?.ranges?.slice(0, -1)?.map(r => <div className="card-text-content" >{r.to}</div>)}
        </div>
    </div>
}