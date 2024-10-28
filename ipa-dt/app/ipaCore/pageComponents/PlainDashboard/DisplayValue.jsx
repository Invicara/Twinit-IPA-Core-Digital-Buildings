import { Box } from "@material-ui/core";
import TouchRipple from "@material-ui/core/ButtonBase/TouchRipple";
import React, { useEffect, useMemo, useRef } from "react";
import { mean, round, sum } from "../utils/common-utils";
import { GenericEmoji } from "./GenericEmoji";



export const DisplyReadingValue = ({readingType, value, baseData, maxOccupancy}) => {

    const rippleRef = useRef();
    const {metricsConfig} = baseData || {};

    const mainValue = useMemo(() => {
        if(!value) return;
        const displayConfig = metricsConfig?.find(c => c?.pointName === readingType);

        return readingType === 'count' ? sum(value.map(el => el?.val)) : round(mean(value.map(el => el.val)), displayConfig.places)
    }, [value, readingType, maxOccupancy, metricsConfig]);

    const {readingInfo, condition} = useMemo(() => {
        const readingInfo = metricsConfig?.find(c => c.pointName === readingType);
        // const comparingValue = readingType === "count" && maxOccupancy ? mainValue / maxOccupancy : mainValue;

        const condition = readingInfo?.ranges?.find(r => mainValue >= r.from && mainValue < r.to);

        return {readingInfo, condition}
    }, [mainValue, value, readingType, maxOccupancy]);

    useEffect(() => {
        rippleRef?.current?.start({}, { center: true });
        setTimeout(() => rippleRef?.current?.stop({}), 320);
    }, [value])

    if(!readingInfo || !condition) return null;

    const displayName = readingInfo.displayName === "Temperature" ? "Temp." : readingInfo.displayName;

    return <Box  style={{width: "33.33%", position: "relative", marginBottom: "3vh"}}>
        <TouchRipple ref={rippleRef} center/>
        <div style={{marginLeft: '12%', display: 'flex', alignItems: "center"}}>
            <div style={{borderRadius: 50, padding: 0, marginRight: 4}}>
                <GenericEmoji color={condition.color} feeling={condition.feeling} />
            </div>
            <div>
                <div className="card-text-content">{displayName}</div>
                <div style={{fontSize: "2vh", fontWeight: 700}}>{readingType === "count" && maxOccupancy ? `${mainValue}/${maxOccupancy}` : mainValue}</div>
            </div>
        </div>
    </Box>
}