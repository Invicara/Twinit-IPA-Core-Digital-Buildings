/**
 * Aggregator of sensor readings into one number
 * @param pointName point to aggregate on
 * @param readingsTree readings tree to read the telemetry from
 * @param sensorsToAggregate sensors (assets) that should be aggregated
 * @param metricsConfigArray this will be used to read info on how to format the value
 * @returns {{val: undefined, displayVal: (string|undefined)}}
 */
export const calculateAverage = (pointName, readingsTree, sensorsToAggregate, metricsConfigArray) => {
    let aggregatedVal = undefined;
    let i = 0;
    let places = 0;
    let aggregationType = 'avg';
    let maxLastTimestamp = 0;
    for(const sensor of sensorsToAggregate){
        const metricConfig = metricsConfigArray.find(mc=>mc.pointName==pointName && mc.dtTypes.includes(sensor.properties.dtType.val));
        if(!metricConfig){
            continue;
        }
        aggregationType = metricConfig?.aggregation || aggregationType;
        places = metricConfig?.places && metricConfig?.places!=places ? metricConfig?.places : places;
        let r = undefined;
        try {
            r = readingsTree[sensor.properties.dtType.val][sensor.properties['Asset Equipment ID'].val][pointName].last;
            let timestamp = r._ts;
            if(typeof  timestamp === 'string'){
                timestamp = new Date(timestamp).getTime();
            }
            if (timestamp instanceof Date) {
                timestamp = timestamp.getTime();
            }
            if(timestamp>maxLastTimestamp) maxLastTimestamp = timestamp;
        } catch(e){}
        if(r && typeof r.val !== 'undefined'){
            i++;
            aggregatedVal = typeof aggregatedVal === 'undefined' ? 0 : aggregatedVal;
            const val = typeof r.val === 'boolean' ? (r.val==true ? 1 : 0): r.val;
            aggregatedVal=(aggregatedVal+val);
        } else {
            //console.error("No readings value in last for",sensor, readings);
        }
    }
    if(aggregationType=="avg"){
        aggregatedVal=aggregatedVal ? aggregatedVal/i : aggregatedVal;
    }
    return {
        val: aggregatedVal,
        maxLastTimestamp,
        displayVal: typeof aggregatedVal === 'number' && isFinite(aggregatedVal) ? aggregatedVal.toFixed(places) : aggregatedVal
    };
}


/**
 * Aggregator of sensor readings into one number
 * @param pointName point to aggregate on
 * @param readingsPerSensor map of [sensorId][pointName] = readings; this map will come from charts
 * @param sensorsToAggregate sensors (assets) that should be aggregated
 * @param metricsConfigArray this will be used to read info on how to format the value
 * @returns {{val: undefined, displayVal: (string|undefined)}}
 */
export const calculateAveragePerBucket = (pointName, readings, metricConfig, interval = 5*60*1000) => {
    if(!metricConfig){
        return undefined;
    }

    let places = 0;
    let aggregationType = 'avg';

    aggregationType = aggregationType || metricConfig?.aggregation;
    places = metricConfig?.places && metricConfig?.places!=places ? metricConfig?.places : places;

    //re-map readings into a 5min bucket // map[pointName][bucket]
    const bucketMap = {};
    for(const r of readings){
        let timestamp = r._ts;
        if(typeof  timestamp === 'string'){
            timestamp = new Date(timestamp).getTime();
        }
        if (timestamp instanceof Date) {
            timestamp = timestamp.getTime();
        }
        const bucket = (Math.floor(timestamp/interval))*interval;
        bucketMap[bucket] = bucketMap[bucket] || {};
        bucketMap[bucket].readings = bucketMap[bucket].readings || [];
        bucketMap[bucket].readings .push(r);
    }
    for(const [bucket,bucketData] of Object.entries(bucketMap)){

        let aggregatedVal = undefined;
        let i = 0;
        for(const r of bucketData.readings){
            if(r && typeof r.val !== 'undefined'){
                i++;
                aggregatedVal = typeof aggregatedVal === 'undefined' ? 0 : aggregatedVal;
                const val = typeof r.val === 'boolean' ? (r.val==true ? 1 : 0): r.val;
                aggregatedVal=(aggregatedVal+val);
            } else {
                //console.error("No readings value in last for",sensor, readings);
            }
        }
        if(aggregationType=="avg"){
            aggregatedVal=aggregatedVal ? aggregatedVal/i : aggregatedVal;
        }

        bucketData.aggregatedVal = {
            val: aggregatedVal,
            displayVal: typeof aggregatedVal === 'number' && isFinite(aggregatedVal) ? aggregatedVal.toFixed(places) : aggregatedVal
        };
    }
    return bucketMap;
}

/**
 * Convenient way to get the range based on raw value (number) and ranges config
 * @param rawVal
 * @param metricConfig
 * @returns {undefined}
 */
export const calculateRange = (rawVal, metricConfig) => {
    if(typeof rawVal === 'undefined'){
        return undefined;
    }
    if(!metricConfig){
        return undefined;
    }
    return findRangeConfig(rawVal, metricConfig.ranges);
}

export const findRangeConfig = (rawVal, ranges) => {
    let rangeConfig = undefined;
    for(const [i, range] of ranges.entries()){
        if(typeof range.value !== 'undefined'){
            //we use == sign as we might be comparing booleans to numbers
            //in case of occupancy we might have range.value set to "true" and aggregated occupancy 3 => true == 3
            if(range.value == rawVal){
                rangeConfig = range;
            }
        } else {
            const min = range.from || Number.MIN_SAFE_INTEGER;
            const max = range.to || Number.MAX_SAFE_INTEGER;
            if(rawVal >= min && (i == ranges.length-1 ? rawVal <= max : rawVal < max)){
                rangeConfig = range;
            }
        }
    }
    return rangeConfig;
}

const isValidHex = (hex) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex)

const getChunksFromString = (st, chunkSize) => st.match(new RegExp(`.{${chunkSize}}`, "g"))

const convertHexUnitTo256 = (hexStr) => parseInt(hexStr.repeat(2 / hexStr.length), 16)

const getAlphafloat = (a, alpha) => {
    if (typeof a !== "undefined") {return a / 255}
    if ((typeof alpha != "number") || alpha <0 || alpha >1){
        return 1
    }
    return alpha
}

export const hexToRgb = (hex, alpha) => {
    try {
        if (!isValidHex(hex)) {throw new Error("Invalid HEX")}
        const chunkSize = Math.floor((hex.length - 1) / 3)
        const hexArr = getChunksFromString(hex.slice(1), chunkSize)
        const [r, g, b, a] = hexArr.map(convertHexUnitTo256);
        //return `rgba(${r}, ${g}, ${b}, ${getAlphafloat(a, alpha)})`
        return [r, g, b, a];
    } catch(e) {
        return [255, 255, 255, 255];
    }
}