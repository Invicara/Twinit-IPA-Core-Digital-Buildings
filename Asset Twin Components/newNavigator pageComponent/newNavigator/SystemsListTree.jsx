import React, {useCallback, useEffect, useMemo, useState, useReducer} from "react";
import _ from 'lodash'
import clsx from "clsx";
import {produce} from "immer";
import {TreeNodeStatus, TreeNodeActionName} from "@invicara/ipa-core/modules/IpaUtils";
import {withoutPropagation} from "@invicara/ipa-core/modules/IpaUtils";
import {ReactiveTreeControl, AlertIndicator} from "@invicara/ipa-core/modules/IpaControls";
import './SystemsListTree.scss'
import sortSystemElementIdsAsDisplayedInTree, {getElementId} from "../observability/sortSystemElements";
import {useDispatch, useSelector} from "react-redux";
import * as Systems from "../redux/systems";
import Switch from "@material-ui/core/Switch/Switch";
import {getFilteredSystemElementEntitiesBy, selectAppliedSystemElementIsolationFilters} from "../redux/systems";

const treeReducer = (state, action) => {
    switch (action.type) {
        case 'update_hidden': {
            const newNodeIndex = updateNodesVisibility(state.nodeIndex, action.isVisible, state.defaultExpandedDepth);
            return {
                ...state,
                showOnlyCritical: action.showOnlyCritical,
                nodeIndex: newNodeIndex
            }
        }
        case 'update_selectedStatus': {
            const newNodeIndex = updateNodesSelection(state.nodeIndex, action.selectedElements, action.isSelected);
            return {
                ...state,
                selectedElements: action.selectedElements,
                nodeIndex: newNodeIndex
            }
        }
        case 'update_alerts': {
            const newNodeIndex = updateNodesAlerts(state.nodeIndex, action.alerts);
            return {
                ...state,
                alerts: action.alerts,
                nodeIndex: newNodeIndex
            }
        }
        case 'update_nodeIndex': {
            return {
                ...state,
                nodeIndex: action.nodeIndex
            }
        }
        default:
            return state;
    }
}

const initialTreeState = {nodeIndex : {}};

const updateNodesVisibility = (nodeIndex, isVisible, defaultExpandedDepth) => {
    const newNodeIndex = _.mapValues(nodeIndex, node => {
        const expanded = _.get(nodeIndex, `${node.id}.expanded`, node.level<=defaultExpandedDepth ? true : false);
        //NOTE: isVisible depends on node's expanded property!
        const newNode = expanded === node. expanded ? node : {...node, expanded};
        const hidden =  !isVisible(newNode, nodeIndex);
        return hidden === newNode.hidden ? newNode : {...newNode, hidden}
    });
    return newNodeIndex;
};

const updateNodesSelection = (nodeIndex, selectedElements, isSelected)=>{
    const newNodeIndex = _.mapValues(nodeIndex, node => {
        const selectedStatus = selectedElements.find(selectedElement=>isSelected(node,selectedElement)) ? TreeNodeStatus.ON : TreeNodeStatus.OFF;
        return {
            ...node,
            selectedStatus
        }
    });
    return newNodeIndex;
};

const updateNodesAlerts = (aNodeIndex, alerts)=>{
    let entityIdsWithAlertsUtilArr = [];
    for (const [entityType, alertsPerEntityMap] of Object.entries(alerts || {})) {
        entityIdsWithAlertsUtilArr = entityIdsWithAlertsUtilArr.concat(_.keys(alertsPerEntityMap));
    }
    const newNodeIndex = _.mapValues(aNodeIndex, node => {
        const hasAlerts = _.intersection(entityIdsWithAlertsUtilArr, node.entityIds).length > 0;
        let currentAlerts = [];
        if (hasAlerts) {
            for (const [entityId, alertsArray] of Object.entries(alerts[node.systemElement.entityType])) {
                if (node.entityIds.includes(entityId)) {
                    currentAlerts = currentAlerts.concat(alertsArray);
                }
            }
        }
        const prevAlertIds = node.alerts && node.alerts.map(alert => alert._id);
        const currentAlertIds = currentAlerts.map(alert => alert._id);
        if (!_.isEqual(prevAlertIds, currentAlertIds)) {
            return {
                ...node,
                alerts: currentAlerts
            }
        } else {
            return node;
        }
    });
    return newNodeIndex;
};

export const SystemsListTree = ({system, selectedElements, onSelect, title, defaultExpandedDepth = 3, bottomPanelFocusMode, onBottomPanelFocusModeChanged}) => {

    const dispatch = useDispatch();

    const toggleStyle = {
        switchBase: {
            '&$checked': {
                color: "#00A693",
            },
            '&$checked + $track': {
                backgroundColor: "#efefef",
            },
        },
        checked: {
            color: "#00a693ba",
        },
        track: {},
    }

    const alerts = useSelector(Systems.selectSystemsAlerts);

    const isolatedFilteredEntityIdsBySystem = useSelector(Systems.selectFilteredIsolatedSystemElementEntityIds);
    const systemElementsIsolationFilters = useSelector(Systems.selectAppliedSystemElementIsolationFilters);

    const showOnlyCritical = systemElementsIsolationFilters?.['critical']?.['value']=='true';

    const getEntityIds = (systemElement) => {
        return (systemElement.entityInfo && systemElement.entityInfo.map(ei=>ei._id)) || [getElementId(systemElement)]
    };

    const isSelected = (node,selectedElement) => selectedElement && (node.id === getElementId(selectedElement) || node.entityIds.includes(getElementId(selectedElement)))

    const getLevel = (node, nodeIndex) => node?.parents && node.parents.length>0 ? getLevel(nodeIndex[node.parents[0]], nodeIndex) + 1 : 0;

    const isCritical = node => {
        const critical = _.get(node, 'nodeValue.critical')
        return critical
    }

    //WORK IN PROGRESS, THERE MIGHT BE WORK NEEDED ON CRITICAL TREE
    const isVisible = useCallback((node,nodeIndex) => {

        if(!node) return false;
        // controls showing or not showing nodes depending on expanded

        const critical = isCritical(node);
        const hasCriticalChildren = addAllNodeDescendants(node, nodeIndex, []).filter(n=>isCritical(n)).length>0;
        // show/hide decision table
        // will hide if: node is not critical && and "show only critical" switch is on && has no critical children
        // c | soc | show result
        // __|_____|_______
        // 1 |  0  |  1
        // 1 |  1  |  1
        // 0 |  0  |  1
        // 0 |  1  |  0
        const hide = (!critical && showOnlyCritical && !hasCriticalChildren);

        //if (_.isEmpty(node.parents)) return true; // top level always visible
        const parent = _.isEmpty(node.parents) ? undefined : _.get(nodeIndex, node.parents[0], {});
        if(hasCriticalChildren){
            return true;
        }
        return !hide;
        // TODO: ? if parent is not expanded but node is critical + show only critical switch is on: show anyway
    },[showOnlyCritical]);

    const getNodeName = nodeValue => nodeValue["Entity Name"]

    //const showNode = node => {
    //    const critical = isCritical(node);
    //    if (hideNonCritical) {
    //        return critical
    //    }
    //    return true
    //}

    const nodeIndexFromSystemElements = useMemo(() => {
        if(!system){
            return {};
        }
        const newBareNodeIndex = system.elements.map(se => {
            const el = {...se};
            const node = {
                "id": getElementId(se),
                "entityIds" :  getEntityIds(se),
                "order": el.localOrder,//order within this particular system
                //"parent": el.upstream,//TODO: deleted this property (Reactive Tree is using 'parents')
                "parents": el.upstream && /*prevent loop*/el.upstream!==getElementId(se) ? [el.upstream] : [],
                "children": el.downstream || system.elements.filter(ch=>!!ch.upstream && ch.upstream === getElementId(se) && /*prevent loop*/getElementId(ch)!==getElementId(se)).map(e=>e._id) || [],//TODO: fix that
                "critical": el.critical,
                "nodeValue": el,
                "systemElement" : se,
                "treeActions" : {
                    "selectedStatus" : {
                        [TreeNodeActionName.PROPAGATE_UP] : TreeNodeStatus.OFF,
                        //[TreeNodeActionName.PROPAGATE_DOWN] : TreeNodeStatus.OFF
                    }
                }
            };
            //new node properties that don't need the full nodeIndex yet
            node.alerts = false;
            node.isLeaf = _.isEmpty(node.children);
            node.selectedStatus = selectedElements.find(selectedElement=>isSelected(node,selectedElement)) ? TreeNodeStatus.ON : TreeNodeStatus.OFF;
            return node;
        }).reduce((index, current) => ({...index, [current.id]: current}), {})
        const unorderedNodeIndex =  _.mapValues(newBareNodeIndex, node => {
            const level = getLevel(node, newBareNodeIndex);
            return {
                ...node,
                //new node properties that need full nodeIndex to calculate a value
                level
            }
        });
        const {sortedSystemElementIds} = sortSystemElementIdsAsDisplayedInTree(system?.elements, getElementId);
        const newNodeIndex = {};
        sortedSystemElementIds.forEach(elementId => newNodeIndex[elementId] = unorderedNodeIndex[elementId]);
        console.log("RECALCULATING nodeIndex",newNodeIndex);
        return newNodeIndex;
    },[system,selectedElements]);

    const [treeState, treeDispatcher] = useReducer(treeReducer,{
        ...initialTreeState,
        nodeIndex: nodeIndexFromSystemElements,
        defaultExpandedDepth: defaultExpandedDepth,//TODO: currently we don't recalculate node when this chages
        //for the below there must be a matching useEffect
        selectedElements: selectedElements,//set = no need to initially recalculate, only on change
        showOnlyCritical: undefined,//undefined to always do initial recalculation (isVisible depends on expanded property)
        alerts: _.isEmpty(alerts) ? alerts : undefined //if empty do not initially recalculate
    });

    useEffect(()=>{
        if(treeState.showOnlyCritical!==showOnlyCritical) {
            treeDispatcher({type: "update_hidden", isVisible: isVisible, showOnlyCritical: showOnlyCritical});
        }
    },[showOnlyCritical]);

    useEffect(()=>{
        if(treeState.selectedElements!==selectedElements) {
            treeDispatcher({type: "update_selectedStatus", isSelected: isSelected, selectedElements: selectedElements});
        }
    },[selectedElements]);

    useEffect(()=>{
        if(treeState.alerts!==alerts) {
            treeDispatcher({type: "update_alerts", alerts: alerts});
        }
    },[alerts]);

    useEffect(()=>{
        if(treeState.nodeIndex!==nodeIndexFromSystemElements) {
            treeDispatcher({type: "update_nodeIndex", nodeIndex: nodeIndexFromSystemElements});
        }
    },[alerts]);

    const onNodeIndexChange = useCallback((newNodeIndex)=>{
        const nodeIndex = treeState.nodeIndex;
        const selected = _.values(newNodeIndex).filter(node=>node.selectedStatus===TreeNodeStatus.ON).map(node=>node.systemElement._id);
        //sort them so newly selected is last
        //const selectedStatusOnPreviously = _.values(nodeIndex).filter(node=>node.selectedStatus===TreeNodeStatus.ON).map(node=>node.systemElement);
        const changed = _.differenceBy(_.values(newNodeIndex), _.values(nodeIndex), node => node.id+''+node.selectedStatus).map(node=>node.systemElement._id);
        //const selectedStatusOnSorted = _.sortBy(selectedStatusOn,se=>selectedStatusOnPreviously.find(sep=>sep._id===se._id) ? se.localOrder : Number.MAX_SAFE_INTEGER);
        treeDispatcher({type: "update_nodeIndex", nodeIndex: nodeIndex});
        onSelect && onSelect(selected, changed);
    },[treeState.nodeIndex]);

    //const toggleExpandBranch = (node) => setNodeIndex(produce(nodeIndex, nodeIndex => {
    //    nodeIndex[node.id].expanded = !nodeIndex[node.id].expanded
    //}))

    //const getNodeChildren = (node, aNodeIndex) => node.children.map(childId => aNodeIndex[childId]);

    const addAllNodeDescendants = (node, aNodeIndex, allDescendants) => {
        if(node.children){
            node.children.forEach(childId => {
                const child = aNodeIndex[childId];
                allDescendants.push(child);
                addAllNodeDescendants(child);
            });
        }
        return allDescendants;
    }

    useEffect(() => {
        dispatch(Systems.setIsolationFilters({}))
    }, [system])

    const toggleCritical = useCallback(()=> {
        const newFilters = {...systemElementsIsolationFilters};
        const newCriticalValue = !newFilters['critical'];
        if(newCriticalValue){
            newFilters['critical'] = {
                op:"equals",
                value:'true',
                type:"boolean"
            };
        } else {
            delete newFilters['critical']
        }
        dispatch(Systems.setIsolationFilters(newFilters));
    },[systemElementsIsolationFilters]);

    const treeControlLeafNodeRenderer = ({nodeValue, alerts, hidden}, toggleCurrentNode) =>
            nodeValue && !hidden && <div>
                {alerts && !_.isEmpty(alerts) && <AlertIndicator classNames={"alert-indicator-danger"} descriptions={alerts.map(alert=>alert?.properties?.Description?.val).filter(d=>!!d)}></AlertIndicator>}
                {nodeValue["Entity Name"]}
                { nodeValue["EntityWarningMessage"] &&
                    <div className="tooltip-wrapper">
                        <div className="dbm-tooltip">
                            <i className="fas fa-exclamation-circle"/>
                            <span className="dbm-tooltiptext">{nodeValue["EntityWarningMessage"]}</span>
                        </div>
                    </div>}
            </div>;

    const treeControlBranchNodeRenderer = (group, childrenCount, toggleCurrentNode) => {
        const childCount = group.count;
        const hidden = group.hidden;
        return (
            <span>
            {group.alerts && !_.isEmpty(group.alerts) && <AlertIndicator classNames={"alert-indicator-danger"} descriptions={group.alerts.map(alert=>alert?.properties?.Description?.val).filter(d=>!!d)}></AlertIndicator>}
            {getNodeName(group.nodeValue)}
            {!!childCount && <span className="count" style={{fontSize: "0.8em"}}>{childCount}</span>}
          </span>
        )
    };

    const visibleNodeIndex = useMemo(()=>{
        const hiddenKeys = [];
        const onlyVisibleCopy = {};
        for (let k of Object.keys(treeState.nodeIndex)) {
            if (treeState.nodeIndex[k].hidden) {
                hiddenKeys.push(k);
            }
            else {
                onlyVisibleCopy[k] = {...treeState.nodeIndex[k]}
            }
        }
        for (let k of Object.keys(onlyVisibleCopy)) {
            if(!_.isEmpty(onlyVisibleCopy[k].children)){
                //remove hidden keys from children
                const children = onlyVisibleCopy[k].children.filter(ch => !hiddenKeys.includes(ch));
                const isLeaf = _.isEmpty(children);
                onlyVisibleCopy[k] = {...onlyVisibleCopy[k], children : isLeaf ? undefined : children, isLeaf}
            }
        }
        return onlyVisibleCopy;
    },[treeState.nodeIndex]);
   
    return <div className="tree-search systems-list-tree">

        {system && <div className={'viewer-toggle'}>
            <Switch style={toggleStyle} checked={bottomPanelFocusMode==false} onChange={onBottomPanelFocusModeChanged}/>Sync with Viewer
        </div>}

        {system && <div className={'viewer-toggle'}>
            <Switch style={toggleStyle} checked={systemElementsIsolationFilters?.['critical']?.['value']=='true'} onChange={toggleCritical}/>Show Only Critical
        </div>}

        {system && <label className='title'>Elements</label>}

        {
            !_.isEmpty(treeState.nodeIndex) ? <ReactiveTreeControl className="entity-tree"
                                                         renderLeafNode={treeControlLeafNodeRenderer}
                                                         renderBranchNode={treeControlBranchNodeRenderer}
                                                         nodeIndex={visibleNodeIndex}
                                                         onNodeIndexChange={onNodeIndexChange}
            /> : <p className="tree-search__loading">Loading tree...</p>
        }
    </div>;
}

