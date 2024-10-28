import React, {useMemo, useCallback, useRef, useState, useEffect} from "react";
import {Button, withStyles} from "@material-ui/core";
import {EnhancedFetchControl, RoundCheckbox} from "@invicara/ipa-core/modules/IpaControls";
import {propsEqual} from "@invicara/ipa-core/modules/IpaUtils";
import _ from 'lodash'
import clsx from "clsx";
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import {withGenericPageContext} from "./genericPageContext";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

const FetchEntityDropdown = ({handler, perEntityConfig, getFetcher, entitySingular, handleTabChange, queryParamsPerEntityType, reloadToken}) => {

    //console.log(handler,perEntityConfig,getFetcher);

    const config = perEntityConfig;

    console.log("FetchEntityDropdown render config", entitySingular, config);

    const selector = config[entitySingular].selectors.find(s=>s.id==handler.config.entityData[entitySingular].allSelector);

    const onClickSelect = useCallback((e)=>{
        return handleTabChange(e,e.target.value)
    },[handleTabChange]);

    const fetchingFunctionsMap = useMemo(()=>{
        const functions = new Map();
        _.values(config).forEach(cfg => {
            functions.set(cfg.singular,getFetcher(cfg.script, undefined, {ignoreCachedScriptResult: true}));
        })
        return functions;
    },[fetch,config]);

    useEffect(() => {
        let newSelector = {...selector, currentValue: ["ALL"], touched: false}
        fetchingFunctionsMap.get(entitySingular)(newSelector, ["ALL"]);
    },[entitySingular,reloadToken]);

    const menuProps = useMemo(()=>({
        getContentAnchorEl: null,
        anchorOrigin: {
            vertical: "bottom",
            horizontal: "left"
        },
        disablePortal: true
    }),[]);

    return (
        <div className={"telemetry-entity-panel "}>
            <FormControl variant="filled" className={"telemetry-entity-select-form"}>
                <Select
                    value={entitySingular}
                    onChange={onClickSelect}
                    className={clsx({"telemetry-entity-select": true})}
                    MenuProps={menuProps}
                >
                    {_.values(config).map(c =>
                        <MenuItem key={c.singular} value={c.singular}>{`${handler.config.entityData[c.singular].displayName} View`}</MenuItem>
                    )}
                </Select>
            </FormControl>
        </div>
    )
}


export default withGenericPageContext(FetchEntityDropdown);
