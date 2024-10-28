import React, {useCallback} from "react";
import { ScriptCache } from "@invicara/ipa-core/modules/IpaUtils";


const StaticContentLoader = () => {

    const refCallback = useCallback(async ref => {

        const content = await ScriptCache.runScript("getStaticContent", {});
        if(!content.includes("script")) ref.innerHTML = content;
    })

    return <span ref={refCallback}></span>
}

export default StaticContentLoader;
