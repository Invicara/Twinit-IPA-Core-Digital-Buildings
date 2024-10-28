export const readingTypes = ['Temp', 'Hum', 'CO2', 'Lux', 'Noise', 'VOC', 'count'];

export const minutes = 3
export const progressFraction = 100/(10*60*minutes);


export const groupBy = (arr, cb) => {
    const grouped = {};

    arr?.filter(el => cb(el)).forEach(el => {
        const val = cb(el);
        if(!grouped[val]) grouped[val] = [];
        grouped[val].push(el);
    });

    return grouped;
}

export const defineQuery = (isWeather) => {

    const maxTime = new Date();
    const minTime = new Date(maxTime - (!isWeather ? 1000*60*20 : 1000*60*60*1.5))

    return { _ts: { $gt: minTime.toISOString(), $lt: maxTime.toISOString() } }
}        
