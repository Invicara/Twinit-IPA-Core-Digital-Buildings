import React, {useMemo,useCallback,useRef, useState} from "react";
import {Tab, Tabs} from "@material-ui/core";
import {EnhancedFetchControl} from "@invicara/ipa-core/modules/IpaControls";
import {propsEqual} from "@invicara/ipa-core/modules/IpaUtils";
import _ from 'lodash'
import clsx from "clsx";

const SearchModelessTab = ({config, fetch, currentTab, handleTabChange, queryParamsPerEntityType, reloadToken, shouldClearToken}) => {

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
            let selectors = cfg.selectors.map((selector, index) => {
                if(queryParams && queryParams.entityType === cfg.singular && index === queryParams?.query?.id) {
                    return {...selector, currentValue: queryParams?.query?.value, currentState : queryParams?.selector?.currentState}
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
            contents.set(cfg.singular, <EnhancedFetchControl initialValue={queryParams && queryParams.entityType === cfg.singular ? queryParams.query : null}
                                                             selectors={selectorsMap.get(cfg.singular)}
                                                             doFetch={fetchingFunctionsMap.get(cfg.singular)}
                                                             reloadToken={reloadToken}
                                                             shouldClearToken={shouldClearToken}
            />);
        });
        return contents;
    },[config, queryParamsPerEntityType, fetch, reloadToken, shouldClearToken]);

    const onClickTab = useCallback((e)=>{
        return handleTabChange(e,e.target.textContent)
    },[]);

    return <div className='modless-search-tab'>
        <div className={'general-title'}>Search For</div>
        <Tabs
            value={currentTab}
            onChange={handleTabChange}
        >
            {_.values(config).map(c => <Tab key={c.singular} label={c.plural} value={c.singular}/>)}
        </Tabs>
        <div className='fetch-container'>
            {tabContents.get(currentTab)}
        </div>
    </div>
};

export default SearchModelessTab;