import React, { useCallback, useEffect, useRef, useState } from "react"
import { ProgressLine } from "./ProgressLine";
import { DashboardCard } from "./DashboardCard";
import { ScriptHelper } from "@invicara/ipa-core/modules/IpaUtils";
import "../../../client/styles/pageComponents/PlainDashboard/_plainDashboard.scss";


const queryBuilder = (telemetryWindow=20, weatherCallWindow=60*1.5) => (isWeather) => {

    const maxTime = new Date();
    const minTime = new Date((maxTime - (!isWeather ? telemetryWindow : weatherCallWindow)*1000*60))

    return { _ts: { $gt: minTime.toISOString(), $lt: maxTime.toISOString() } }
}        

const PlainDashboard = (props) => {

    const { frequency=3, readingTypes, grid, telemetryWindow, weatherCallWindow } = props?.handler?.config || {}

    const { token, selectedItems} = props
    const { selectedModel, selectedProject } = selectedItems;
    const namespace = selectedProject?._namespaces[0];

    const [baseData, setBaseData] = useState();
    const [readingMapping, setReadingMapping] = useState([]);
    const [collectionsWithReadings, setCollectionsWithReadings] = useState()
    const [weatherInfo, setWeatherInfo] = useState();
    const intervalRef = useRef();

    useEffect(() => {
        (async () => {
            const bData = await ScriptHelper.executeScript("getBaseData", {});
            setBaseData(bData);
        })();
    }, [])

    const poll = useCallback(async () => {

        const defineQuery = queryBuilder(telemetryWindow, weatherCallWindow);
        const spaceNames = (grid?.cards || []).map(c => c?.spaceName)
        const {readingMappingValues, collectionsWithReadingValues} = await ScriptHelper.executeScript("getGeneralTelemetryInfo", {query: defineQuery(), spaceNames, token, namespace});
        const weather = await ScriptHelper.executeScript("getWeatherInfo", {query: defineQuery(true), token, namespace});

        setReadingMapping(readingMappingValues);
        setCollectionsWithReadings(collectionsWithReadingValues)
        setWeatherInfo(weather);

    }, [token, namespace])

    useEffect(() => {
        if(baseData && !intervalRef.current){
            (async () => await poll())();

            intervalRef.current = setInterval(() => {
                (async () => await poll())();
            }, 1000*60*frequency);
        }

        return () => clearInterval(intervalRef.current);
    }, [baseData])


    return <>
        {baseData && <ProgressLine {...{readingMapping, frequency}}/>}
        <div style={{...grid.shape}} className="dashboard-container">
            {(grid?.cards || []).map(c => {
                const {type, spaceName} = c;
                const data = type === "Room" ? readingMapping.find(r => Object.keys(r)[0] === spaceName) 
                    : type === "Weather" ? weatherInfo
                    : undefined

                return <DashboardCard infoType={type} {...{...c, selectedModel, data, weatherInfo, baseData, collectionsWithReadings, readingTypes}} />
            })}
        </div>
    </>
}

export default PlainDashboard;



