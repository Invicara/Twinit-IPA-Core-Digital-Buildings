import React, {useMemo,useCallback,useRef, useState} from "react";
import {Button} from "@material-ui/core";
import {EnhancedFetchControl} from "@invicara/ipa-core/modules/IpaControls";
import {propsEqual} from "@invicara/ipa-core/modules/IpaUtils";
import _ from 'lodash'
import clsx from "clsx";

const SearchModelessTab = ({config, fetch, currentTab, handleTabChange, queryParamsPerEntityType, reloadToken, setViewerSelectedEntitiesBySearch}) => {

    const fetchingFunctionsMap = useMemo(()=>{
        const functions = new Map();
        _.values(config).forEach(cfg => {
            functions.set(cfg.singular,fetch(cfg.script, undefined, {ignoreCachedScriptResult: true}));
        })
        return functions;
    },[fetch,config]);

    const selectorsMap = useMemo(()=>{
        const _selectorsMap = new Map();
        _.values(config).forEach(cfg => {
            const queryParams = queryParamsPerEntityType[cfg.singular];
            let selectors = cfg.selectors?.map((selector, index) => {

                console.log("selectorsMap "+index,selector);

                const initialValue = undefined;//selector.value ? {id:selector.id,value:selector.value} : undefined;
                const query = queryParams && queryParams.entityType === cfg.singular && (index === queryParams?.query?.id || selector.id === queryParams?.query?.id) ? queryParams?.query : undefined;

                if(query || initialValue) {
                    return {...selector, currentValue: query?.value || initialValue?.value, currentState : queryParams?.selector?.currentState}
                } else return selector
            })
            _selectorsMap.set(cfg.singular,selectors);
        })
        return _selectorsMap;
    },[config,queryParamsPerEntityType]);

    const tabContents = useMemo(()=>{
        const contents = new Map();
        _.values(config).forEach(cfg => {
            const queryParams = queryParamsPerEntityType[cfg.singular];
            const selectorWithValue = selectorsMap.get(cfg.singular)?.find((selector, index)=>!!selector.value);
            const initialValue = undefined;//selectorWithValue ? {id:selectorWithValue.id,value:selectorWithValue.value} : undefined;
            //initialValue is the value this selector will use to reset itself to in case other selector is used
            // (it will always keep query in mind not reset to zero)
            contents.set(cfg.singular, <EnhancedFetchControl initialValue={queryParams && queryParams.entityType === cfg.singular ? queryParams.query : initialValue}
                                                             selectors={selectorsMap.get(cfg.singular)}
                                                             doFetch={fetchingFunctionsMap.get(cfg.singular)}
                                                             reloadToken={reloadToken}
                                                             setViewerSelectedEntitiesBySearch={setViewerSelectedEntitiesBySearch}
            />);
        });
        return contents;
    },[config, queryParamsPerEntityType, fetch, reloadToken,selectorsMap,fetchingFunctionsMap]);

    const onClickTab = useCallback((e)=>{
        return handleTabChange(e,e.target.textContent)
    },[handleTabChange]);

    return <div className='modless-search-tab'>
        <div className={'general-title'}>Search For</div>
        <div className="entity-tab-group">
            {_.values(config).map(c =>
                <Button key={c.singular}
                        label={c.plural}
                        value={c.singular}
                        onClick={onClickTab}
                        className={clsx({"entity-tab-button": true, "active-entity": currentTab==c.singular})}
                >{c.singular}</Button>
            )}
        </div>
        <div className='fetch-container'>
            {tabContents.get(currentTab)}
        </div>
    </div>
};

export default SearchModelessTab;
