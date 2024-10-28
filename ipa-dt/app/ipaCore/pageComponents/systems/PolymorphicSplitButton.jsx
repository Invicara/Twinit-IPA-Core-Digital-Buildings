import React from "react";
import {SplitButton} from "@invicara/ipa-core/modules/IpaControls";
import _ from "lodash";

export const PolymorphicSplitButton = ({options, ...props}) => {
    return <SplitButton options={_.keys(options)}
                        onClick={selectedButtonOption => options[selectedButtonOption]()}
                        {...props}
    />
}
