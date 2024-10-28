import React, { useEffect, useRef, useState } from "react";

export const ProgressLine = ({readingMapping, frequency}) => {

    const progressFraction = useRef(100/(10*60*frequency));

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const progressIntervalRef = setInterval(() => {
            if(progress < 100)
                setProgress((oldProgress) => Math.min(oldProgress + progressFraction.current, 100));
        }, 100)

        return () => clearInterval(progressIntervalRef);
    }, [])

    useEffect(() => setProgress(0), [readingMapping])

    return <div style={{height: "0.35vh", backgroundColor: "#f9c8e6"}}>
        <div style={{height: "100%", width: `${progress}%`, transition: `width ${progressFraction.current}s`, backgroundColor: "#C71784"}} />
    </div>
}
