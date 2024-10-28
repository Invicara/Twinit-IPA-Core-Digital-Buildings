import React from "react";
import { Card } from "@material-ui/core";
import { readingTypes } from "./utils";
import TelemetryIafViewer from "../observability/TelemetryIafViewer";



export class BigDashboardCard extends React.Component {

    ref = React.createRef();
    interval;

    state = {
        pointsToDisplay: readingTypes[0], 
        hasManuallySelected: false
    }

    componentDidMount(){
        this.interval = setInterval(() => {
            if(!this.state.hasManuallySelected){
                const {pointsToDisplay} = this.state;
                const newIndex = readingTypes.indexOf(pointsToDisplay) === readingTypes.length - 1 ? 0 : readingTypes.indexOf(pointsToDisplay) + 1;
                this.setState({pointsToDisplay: readingTypes[newIndex]});
            }
        }, 1000*12);
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    }
    
    render(){
        const {selectedModel, baseData, collectionsWithReadings} = this.props;

        const {assets, metricsConfig} = baseData || {};

        const { pointsToDisplay } = this.state;

        const displayConfig = metricsConfig?.find(c => c.pointName === pointsToDisplay)
        
        return <Card className="big-card" style={{padding: "2.1vh", gridColumnStart: 2, gridColumnEnd:7, gridRowStart: 4, gridRowEnd: 7, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", backgroundColor: 'white'}}>
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
                        setViewerCameraOnTop={true}
                        onSelect={() => {}}
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