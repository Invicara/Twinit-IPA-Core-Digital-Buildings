import React, {useCallback, useEffect, useMemo, useState, useReducer, useRef} from "react";
import _ from 'lodash'
import './TelemetryTabularTree.scss'
import {SlimRoundCheckbox, TelemetryTabularTreeBranch} from "./TelemetryTabularTreeBranch";
import {makeEntityTree,addAllNodeDescendants} from "./common/tree-makers";
import {calculateAverage} from "./common/calculations";
import Chart from "./Chart";
import {useChecked} from "@invicara/ipa-core/modules/IpaControls";
import {useSelector} from "react-redux";
import {getSelectedEntities as fixedGetSelectedEntities} from "./common/entities-fixes";
import {Box} from "@material-ui/core";
import {Entities} from "@invicara/ipa-core/modules/IpaRedux";

export const TelemetryTabularTree = ({filteredEntities, entitySingular, selectedGroups, metricsConfigArray, readingsTree, filteredMetrics=[], onEntitiesSelected, onEntitiesExpanded, onSelectedMetrics}) => {

    const treeRoot = useMemo(()=>{
        return makeEntityTree(filteredEntities,readingsTree,filteredMetrics,metricsConfigArray,selectedGroups)
    },[filteredEntities,readingsTree,filteredMetrics,metricsConfigArray,selectedGroups]);

    const allNodes = useMemo(()=>{
        return addAllNodeDescendants(treeRoot.tree,[]);
    },[treeRoot.tree]);

    const selectedEntitiesBySearch = useSelector(fixedGetSelectedEntities);
    const isolatedEntitiesBySearch = useSelector(Entities.getIsolatedEntities);

    const [expandedNodesMap, setExpandedNodesMap] = useState({});
    const [selectedNodesMap, setSelectedNodesMap] = useState({});

    const previousProps = useRef({});

    useEffect(()=>{
        //when data underpinning the tree changes, the only single source of truth is "selectedEntitiesBySearch"
        //well... ESD-829 - unless you want to ignore the single source of truth
        //so, when your new category does not contain selectedEntitiesBySearch, ignore the truth :)

        //determine what exactly has changed:
        let treeHasNewEntities = false;
        const previousEntities = previousProps.current.filteredEntities ? previousProps.current.filteredEntities.map(e=>e._id) : [];
        const currentlyFilteredEntities =  filteredEntities.map(e=>e._id);
        const intersectingEntities = _.intersection(previousEntities,currentlyFilteredEntities);
        if(intersectingEntities.length!=previousEntities.length || intersectingEntities.length!=currentlyFilteredEntities.length) {
            treeHasNewEntities = true;
        }

        let treeHasNewMetrics = false;
        const previousMetrics = previousProps.current.filteredMetrics ? previousProps.current.filteredMetrics.map(m=>m.pointName) : [];
        const currentlyFilteredMetrics =  filteredMetrics.map(m=>m.pointName);
        const intersectingMetrics = _.intersection(previousMetrics,currentlyFilteredMetrics);
        if(intersectingMetrics.length!=previousMetrics.length || intersectingMetrics.length!=currentlyFilteredMetrics.length) {
            treeHasNewMetrics = true;
        }

        const selectedIds = selectedEntitiesBySearch.map(e=>e._id);
        if(_.isEmpty(selectedIds)){
            //if we need to clear selection
            !_.isEmpty(expandedNodesMap) && setExpandedNodesMap({});
        } else {
            //if we need to add selection
            const newExpandedNodes = allNodes.filter(nv=>selectedIds.includes(nv._id));
            if(!_.isEmpty(newExpandedNodes)){
                const newExpandedNodesMap = newExpandedNodes.reduce((map,nv)=>{
                    map[nv['__telemetry_aggregation']]=nv;
                    return map;
                },{});
                setExpandedNodesMap(newExpandedNodesMap);
            } else {
                //do we need to change category?
                const otherExpandedEntities = isolatedEntitiesBySearch.filter(nv=>selectedIds.includes(nv._id));
                if(!_.isEmpty(otherExpandedEntities)){
                    const entity = otherExpandedEntities[0];
                    const sensors = entity?.sensors || [entity];
                    if(sensors && sensors.length>0){
                        const dtType = sensors[0]?.properties?.dtType?.val;
                        const mc = metricsConfigArray?.find(mc=>mc.dtTypes.includes(dtType));
                        //force category to change and re-render the tree => but only if we are not doing that already! (!treeHasNewMetrics)
                        !treeHasNewMetrics && mc && onSelectedMetrics({value:mc.pointName})
                    }
                }
            }
        }
        previousProps.current.filteredEntities=filteredEntities;
        previousProps.current.filteredMetrics=filteredMetrics;

    },[filteredEntities,filteredMetrics,selectedEntitiesBySearch,setExpandedNodesMap,setSelectedNodesMap]);


    useEffect(()=>{
        let entities = [];
        for(const [nn,nv] of Object.entries(expandedNodesMap)){
            if(!nv){
                continue;
            }
            entities = entities.concat(nv);
            onEntitiesExpanded(entities);
        }
    },[]);

    const expandBranch = useCallback((e, _nodeName, _nodeValue, forcedState) => {
        const map = expandedNodesMap || {};
        const currentExpandedState = map[_nodeName];
        let newExpandedState = !currentExpandedState;
        if(typeof forcedState !== 'undefined'){
            newExpandedState = forcedState;
        }
        if(newExpandedState!=currentExpandedState){
            const newMap = {...map,[_nodeName]:newExpandedState ? _nodeValue : false};
            setExpandedNodesMap(newMap);
            let entities = [];
            for(const [nn,nv] of Object.entries(newMap)){
                if(!nv){
                    continue;
                }
                entities = entities.concat(nv);
            }
            onEntitiesExpanded(entities);
        }
    },[expandedNodesMap,setExpandedNodesMap])

    const selectNode = useCallback((e, _nodeName, _nodeValue) => {
        const map = selectedNodesMap || {};
        const currentState = map[_nodeName];
        const newState = !currentState;
        if(newState!=currentState){
            const newMap = {...map,[_nodeName]:newState ? _nodeValue : false};
            setSelectedNodesMap(newMap);

            let entities = [];
            for(const [nn,nv] of Object.entries(newMap)){
                if(!nv){
                    continue;
                }
                entities = entities.concat(nv);
            }
            onEntitiesSelected(entities);
        }
    },[selectedNodesMap,setSelectedNodesMap]);

    const getNodes = (tree, depth, parentExpanded) => {
        if (!tree) return
        let children
        if (Array.isArray(tree)) {
            children = []
        }
        else {
            children = []
            let currentDepth = depth;
            depth++;
            Object.entries(tree).forEach(([nodeName, nodeValue]) => {
                let cn = "branch"
                //if (selectedNodeNames.includes(nodeName)) cn += " selected";
                //if (expandedNodeNames.includes(nodeName)) cn += " expanded"
                //if (partialNodeNames.includes(nodeName)) cn += " partial"
                const isLast = selectedGroups[selectedGroups.length - 1] === selectedGroups[currentDepth-1];
                children.push(
                    <li className={cn} key={nodeName} data-branch-name={nodeName} >
                        <TelemetryTabularTreeBranch
                            nodeName={nodeName}
                            nodeValue={nodeValue}
                            currentDepth={currentDepth}
                            selectedGroups={selectedGroups}
                            readings={readingsTree}
                            allDescendants={addAllNodeDescendants(nodeValue, [])}
                            getNodes={getNodes}
                            metricsConfigArray={metricsConfigArray}
                            selectNode={selectNode}
                            selectedNodesMap={selectedNodesMap}
                            expandBranch={expandBranch}
                            expandedNodesMap={expandedNodesMap}
                        ></TelemetryTabularTreeBranch>
                    </li>)
            })
        }
        return children
    }


    return (
    <React.Fragment>
        <div className={"telemetry-tree-panel__control"}>
            <Box display="flex" p={1}>
                <Box p={1} >
                    <SlimRoundCheckbox checked={Object.values(expandedNodesMap).filter(nv=>!!nv).length==0} onChange={()=>onEntitiesExpanded([])}/>
                </Box>
                <Box p={1} flexGrow={1}>
                    <span>{`Overall ${entitySingular} View`}</span>
                </Box>
            </Box>
        </div>
        <div className={"telemetry-tree"}>
            <ul>
                {getNodes(treeRoot.tree, 1)}
            </ul>
        </div>
    </React.Fragment>
    );
}
