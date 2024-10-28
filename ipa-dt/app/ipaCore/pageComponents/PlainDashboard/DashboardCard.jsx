import { Card } from "@material-ui/core";
import React, { useMemo } from "react";
import { DisplyReadingValue } from "./DisplayValue";
import { ViewerCard } from "./ViewerCard";
import _ from "lodash"
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils"


export const DashboardCard = (props) => {

    const {columnPosition, columnWidth, rowPosition, rowWidth, data, infoType, baseData, readingTypes} = props
    const gridColumnEnd = columnPosition+columnWidth
    const gridRowEnd = rowPosition + rowWidth
    
    const cardStyling = {gridColumnStart: columnPosition, gridColumnEnd, gridRowStart: rowPosition, gridRowEnd};

    const { displayPoints, occupancyDictionary } = baseData || {};

    switch(infoType){
        case "Room":
            return <Card className="common-card" style={cardStyling} ><Room roomInformation={data} {...{baseData, occupancyDictionary, readingTypes}} /></Card>;
        case "Weather":
            return <Card className="common-card" style={cardStyling} ><Weather weatherInformation={data}/></Card>
        case "Units":
            return <Card className="common-card" style={cardStyling} ><Units {...{displayPoints}} /></Card>
        case "News":
            return <Card className="common-card" style={cardStyling} ><News /></Card>
        case "Viewer":
            return <ViewerCard {...props}/>
        default: 
            return <Card className="common-card" style={cardStyling} />
    }
}

class News extends React.Component{
    interval;

    state = {
        position: 0,
        news: []
    }

    componentDidMount(){
        (async () => {
            const news = await ScriptHelper.executeScript("getNews", {latest: true});
            this.setState({news});
        })()
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState?.news?.length === 0 && this?.state?.news?.length){
            this.interval = setInterval(() => {
                const {position, news} = this.state;
                const newIndex = position === news.length - 1 ? 0 : position + 1;
                this.setState({position: newIndex});
            }, 1000*14);
        }
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    } 

    render(){

        const {position, news} = this.state;

        if(!news?.length) return <></>

        const selectedNews = news[position];
        const header = selectedNews?.header || selectedNews?.properties["News Header"]?.val
        const content = selectedNews?.content || selectedNews?.properties?.Content?.val

        return <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%"}}>
            <>
                <div className="card-title" >Today's News</div>
                <div style={{height: "18vh", marginBottom: "1vh", overflow: "hidden", textOverflow: "ellipsis"}}>
                    <div className="card-sub-header">{header}</div>
                    <div className="card-text-content" >{content}</div>
                </div>
            </>
            <div style={{display: "flex", justifyContent: "right", padding: "5px 0px", top: 0}}>
                {[...Array(news.length).keys()].map(i => <div className="iterative-points" style={{opacity: i === position ? 1 : 0.6}}/>)}
            </div>
        </div>
    }
}


const Units = ({displayPoints}) => {

    const units = useMemo(() => {
        if(!displayPoints) return <></>;

        let joinedUnits = Object.entries(_.groupBy(Object.values(displayPoints), el => el.unit))
            .map(([k, v]) => `${v.map(t => {
                let displayName = t.displayName
                if(/Gradient/.test(displayName)) displayName = displayName.replace("Gradient Temp", "Temp.");
                
               return displayName;
            }).join(", ")}: (${k})`);

        return <>{joinedUnits.map((el) => <span className="card-text-content" style={{display: 'block', marginBottom: 1}}>{`${el}`}</span>)}</>
    }, [displayPoints]);

    return <>
        <div className="card-title">Units</div>
        {units}
    </>
}

const Weather = ({weatherInformation}) => {

    const {time, weatherInfoDetails, conditionIcon} = useMemo(() => {
        if(!weatherInformation) return {};
        const ts = new Date(weatherInformation?.Temp?._ts)
        const time = `${ts.toDateString()} ${ts.toTimeString().split(" ")[0]}`;

        const weatherInfoDetails = Object.entries(weatherInformation).filter(([k]) => ["Precipitation", "Humidity", "Feels Like", "Wind Speed"].indexOf(k) !== -1).map(([k, v]) => {
            return <div className="card-text-content">
                {`${k}: ${v.val} ${v.unit} `}
            </div>
        })

        let conditionIcon = <></>;
        const weatherCondition = weatherInformation?.Condition?.val;

        if(weatherCondition) conditionIcon = <object style={{marginLeft: "-0.7vh", width: "7vh", marginRight: "0.5vh"}} data={`https://apps.invicara.com/library/v1/obayashi/weather/${weatherCondition}.svg`} type="image/svg+xml"></object>;

        return {time, weatherInfoDetails, conditionIcon};
    }, [weatherInformation])

    if(!weatherInformation) return <></>

    return <>
        <div className="card-title">Outdoor</div>
        <div style={{display: "flex", justifyContent: 'space-between', marginTop: 10}}>

            <div style={{display: "flex", alignItems: "center", height: "70%", marginTop: "2vh"}}>
                {conditionIcon}
                <div style={{fontSize: "5vh", display: "flex"}}>
                    <div>{weatherInformation?.Temp?.val}</div>
                    <div style={{position: "relative"}}>
                        <span style={{fontSize: "1.5vh", top: "-1.5vh", left: 0, position: "absolute"}}>{weatherInformation?.Temp?.unit}</span>
                    </div>
                </div>
            </div>

            <div style={{width: '45%'}}>
                <div className="card-sub-header">{time}</div>
                {weatherInfoDetails}
            </div>
        </div>
    </>
}

const Room = ({roomInformation, baseData, occupancyDictionary, readingTypes}) => {

    const values = Object.entries(roomInformation || {})

    if(!roomInformation || !values?.length) return <></>;

    const [roomName, readigsByType] = values[0];

    const maxOccupancy = occupancyDictionary && occupancyDictionary[roomName]?.val

    const {readingValues, occupancy} = useMemo(() => {
        const readingValues = readingTypes.slice(0, 6).map(k => <DisplyReadingValue {...{baseData, maxOccupancy}} readingType={k} value={readigsByType[k]} />);

        const countVal = readigsByType["count"] && readigsByType["count"][0]?.val;
        const occupancy = countVal !== undefined && {text: `${countVal > 0 ? "Occupied" : "Vacant"} ${countVal}/${maxOccupancy}`, color: countVal > 0 ? "#ef5350" : "#8bc34a"}

        return {readingValues, occupancy}
    }, [roomName, readigsByType, maxOccupancy]);

    return  <>
        <div style={{display: "flex", justifyContent: "space-between"}}>
            <div className="card-title">{roomName}</div>
            {occupancy && <div style={{fontWeight: 700, color: occupancy.color, fontSize: "1.65vh"}}>{occupancy.text}</div>}
        </div>
        <div style={{display: 'flex', flexWrap: "wrap", marginTop: "1.5vh"}}>
            {readingValues}
        </div>
    </>
}