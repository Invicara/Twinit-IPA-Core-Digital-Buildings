import React, {useEffect, useState} from "react";
import _ from 'lodash'
import clsx from "clsx";
import {produce} from "immer";
import {withoutPropagation} from "@invicara/ipa-core/modules/IpaUtils";
import {SquareInSquareCheckbox} from "@invicara/ipa-core/modules/IpaControls"
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import Switch from "@material-ui/core/Switch";
import {withStyles} from "@material-ui/styles";

const style = {
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

export const SystemsOrderableTree = ({systemElements, onLevelChange, onOrderChange, onElementRemoved,  selectedElement, onSelect, title, toggleCritical, hideNonCritical, setHideNonCritical, currentEntityType}) => {

    const [nodeIndex, setNodeIndex] = useState({});
    const [orderedNodeIds, setOrderedNodeIds] = useState({});    

    const onNonCriticalCheck = () => setHideNonCritical(!hideNonCritical)

    useEffect(() => {
        const newNodeIndex = nodeIndexFromSystemElements();
        setNodeIndex(newNodeIndex)
        setOrderedNodeIds(sortedAsDisplayed(newNodeIndex).map(node => node.id))
    }, [systemElements])

    const nodeIndexFromSystemElements = () => {
        const neweBareNodeIndex = systemElements.map(el => (
            {
                "id": el._id,
                "order": el.localOrder,
                "parent": el.upstream,
                "children": el.downstream,
                "isLeaf": _.isEmpty(el.downstream),
                "expanded": _.get(nodeIndex, `${el._id}.expanded`, false),
                "critical": el.critical,
                "nodeValue": el
            }
        )).reduce((index, current) => ({...index, [current.id]: current}), {})
        return _.mapValues(neweBareNodeIndex, node => ({
            ...node,
            level: getLevel(node, neweBareNodeIndex)
        }));

    }

    const sortedAsDisplayed = aNodeIndex => _.sortBy(_.values(aNodeIndex).filter(node => node.level === 1), node => node.order)
        .flatMap(getSortedChildren(aNodeIndex))

    const getSortedChildren = aNodeIndex => node => [node, ..._.sortBy(getNodeChildren(node, aNodeIndex), node => node.order)
        .flatMap(getSortedChildren(aNodeIndex))
    ]
    
    const getLevel = (node, nodeIndex) => node.parent ? getLevel(nodeIndex[node.parent], nodeIndex) + 1 : 1;

    const isSelected = (node) => _.get(node, 'id') === _.get(selectedElement, '_id');

    const getNodeClasses = (node, snapshot, baseClasses = '') => clsx(baseClasses,
        !isVisible(node) && 'hidden',
        snapshot.combineTargetFor && 'dragging-over',
        snapshot.isDragging && 'being-dragged',
        isSelected(node) && "selected",
        orderedNodeIds.indexOf(node.id) % 2 ? "even" : "odd",
        _.get(node, 'expanded', false) && "expanded",
    )

    //TODO DRY this code once it is more tested and consolidated and abstractions are clearer
    const levelUp = node => {
        const nodeParent = nodeIndex[node.parent];
        if (nodeParent) {
            const newParent = nodeParent.parent;
            const parentSiblings = _.pickBy(nodeIndex, other => other.parent === nodeParent.parent);
            const orderedParentSiblingIds = orderedNodeIds.filter(id => _.has(parentSiblings, id))
            const newPrevious = parentSiblings[orderedParentSiblingIds[orderedParentSiblingIds.indexOf(nodeParent.id) - 1]]
            const newOrder = (_.get(newPrevious, 'order', nodeParent.order - 1) + nodeParent.order) / 2
            onLevelChange(node.nodeValue, newParent, newOrder);
        } else {
            const siblings = _.pickBy(nodeIndex, other => other.parent === node.parent)
            const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
            const prevNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) - 1]]
            const newParent =  prevNode;
            if (newParent) {
                const siblings = _.pickBy(nodeIndex, other => other.parent === newParent.id)
                const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
                const lastSibling = siblings[_.last(orderedSiblingIds)]
                setNodeIndex(produce(nodeIndex => {
                    nodeIndex[newParent.id].expanded = true
                }))
                onLevelChange(node.nodeValue, newParent.id, _.get(lastSibling, 'order', 0) + 1);
            }
        }
    }

    const orderUp = node => {
        const siblings = _.pickBy(nodeIndex, other => other.parent === node.parent);
        const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
        const prevNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) - 1]]
        const prevPrevNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) - 2]]
        const newOrder = (_.get(prevPrevNode, 'order', node.order - 2) + _.get(prevNode, 'order', node.order - 1)) / 2
        onOrderChange(node.nodeValue, newOrder)
    }

    const orderDown = node => {
        const siblings = _.pickBy(nodeIndex, other => other.parent === node.parent)
        const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
        const nextNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) + 1]]
        const nextNextNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) + 2]]
        const newOrder = (_.get(nextNextNode, 'order', node.order + 2) + _.get(nextNode, 'order', node.order + 1)) / 2
        onOrderChange(node.nodeValue, newOrder)
    }

    const levelDown = node => {
        const siblings = _.pickBy(nodeIndex, other => other.parent === node.parent)
        const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
        const nextNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) + 1]]
        const prevNode = siblings[orderedSiblingIds[orderedSiblingIds.indexOf(node.id) - 1]]
        const newParent = nextNode || prevNode;
        if (newParent) {
            const siblings = _.pickBy(nodeIndex, other => other.parent === newParent.id)
            const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
            const lastSibling = siblings[_.last(orderedSiblingIds)]
            setNodeIndex(produce(nodeIndex => {
                nodeIndex[newParent.id].expanded = true
            }))
            onLevelChange(node.nodeValue, newParent.id, _.get(lastSibling, 'order', 0) + 1);
        }
    }

    const removeElement = node => onElementRemoved(node.nodeValue)

    const toggleExpandBranch = (node) => setNodeIndex(produce(nodeIndex, nodeIndex => {
        nodeIndex[node.id].expanded = !nodeIndex[node.id].expanded
    }))

    const getNodeChildren = (node, aNodeIndex) =>
        node.children.map(childId => aNodeIndex[childId]);

    const onDragEnd = ({source, destination, draggableId, combine}) => {
        if (combine) handleDropOnOther(nodeIndex[draggableId], combine.draggableId)
        const indexChanged = destination && destination.index !== source.index;
        if (indexChanged) handleDropNexToOther(nodeIndex[draggableId], destination.index, destination.index > source.index)
    }

    const onBeforeCapture = ({draggableId}) => {
        setNodeIndex(produce(nodeIndex => {
            nodeIndex[draggableId].expanded = false
        }))
    }

    const areSiblings = (node, other) => node.parent === other.parent


    const isVisible = (node) => {
        // controls showing or not showing nodes depending on expanded

        // top level always visible
        if (!node.parent) return true 

        const parent = _.get(nodeIndex, node.parent, {})

        const isCritical = _.get(node, 'nodeValue.critical', false)

        const showBecauseIsCritical = (isCritical && hideNonCritical)

        if (!isVisible(parent) && parent.expanded) {
            return showBecauseIsCritical
            // will hide if: 
            // parent is not visible, and node is not critical, and "show only critical" switch is off
        }
        
        return parent.expanded 
        // if parent is not expanded but node is critical + show only critical switch is on: show anyway
    }

    const findVisibleParent = node => {
        const nodeParent = nodeIndex[node.parent];
        return isVisible(nodeParent) ? nodeParent : findVisibleParent(nodeParent)
    }

    const handleDropOnOther = (node, droppedOntoOId) => {
        const siblings = _.pickBy(nodeIndex, other => other.parent === droppedOntoOId)
        const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
        const lastSibling = siblings[_.last(orderedSiblingIds)]
        onLevelChange(node.nodeValue, droppedOntoOId, _.get(lastSibling, 'order', 0) + 1);
    }

    const canReceiveChildrenBelow = node => !node || (node.expanded && !node.isLeaf)

    const handleDropNexToOther = (node, newIndex, movedDownwards) => {
        const newPrevious = movedDownwards ? nodeIndex[orderedNodeIds[newIndex]] : nodeIndex[orderedNodeIds[newIndex - 1]];
        const movedAmongSiblings = newPrevious && areSiblings(newPrevious, node);
        const movedBelowSameParent = _.get(newPrevious,'id') === node.parent;
        if (movedAmongSiblings) {
            const newNext = movedDownwards ? nodeIndex[orderedNodeIds[newIndex + 1]] : nodeIndex[orderedNodeIds[newIndex]];
            const newOrder = (newNext && areSiblings(node, newNext)) ? (newPrevious.order + newNext.order) / 2 : newPrevious.order + 1
            onOrderChange(node.nodeValue, newOrder)
        } else if (movedBelowSameParent) {
            const newNext = movedDownwards ? nodeIndex[orderedNodeIds[newIndex + 1]] : nodeIndex[orderedNodeIds[newIndex]];
            const newOrder = areSiblings(node, newNext) ? newNext.order - 1 : 1
            onOrderChange(node.nodeValue, newOrder)
        } else {
            const visibleNewPrevious = newPrevious && (isVisible(newPrevious) ? nodeIndex[newPrevious.id] : findVisibleParent(newPrevious))
            if (canReceiveChildrenBelow(visibleNewPrevious)) {
                //Save as child

                const newParentId = _.get(visibleNewPrevious, 'id')
                const siblings = _.pickBy(nodeIndex, other => other.parent === newParentId)
                const orderedSiblingIds = orderedNodeIds.filter(id => _.has(siblings, id))
                const firstSibling = siblings[_.first(orderedSiblingIds)]
                onLevelChange(node.nodeValue, newParentId, _.get(firstSibling, 'order', 0) - 1);
            } else {
                //Save as sibling
                const newNext = nodeIndex[orderedNodeIds[orderedNodeIds.indexOf(visibleNewPrevious.id) + 1]];
                const newOrder = newNext ? (visibleNewPrevious.order + newNext.order) / 2 : visibleNewPrevious.order + 1
                onLevelChange(node.nodeValue, visibleNewPrevious.parent, newOrder);
            }
        }
    }
    
    const getNodeName = node => node.nodeValue["System Element Name"] // modifying this function to get first the system element updated from the getsystem
 
    const showNode = node => {
        const isCritical = _.get(node, 'nodeValue.critical')
        if (hideNonCritical) {
            return isCritical
            
            /* if (node.isLeaf && isCritical) {
                return true
            } else {
                if (!node.parent && isCritical) {
                    return true
                } else { // o sea if (node.isLeaf && node.parent || isCritical)
                    return false
                }
            } */
        }
        return true
    }

    const renderNodes = () => orderedNodeIds.map((id, index) => {
        const node = nodeIndex[id]

        let rootClassName = showNode(node) ? 'show-node' : 'hide-node'

        return <div className={rootClassName} key={id}>
            <Draggable draggableId={node.id} index={index}>{(provided, snapshot) =>

                <div {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}
                     className={getNodeClasses(node, snapshot, 'tree-row')}
                     onClick={withoutPropagation(() => isSelected(node) ? onSelect(null) : onSelect(node.nodeValue))}
                >
                    <div>
                        <span style={{paddingLeft: node.level * 15}}/>
                        <i className={node.isLeaf ? "fas fa-circle bullet" : `fas ${node.expanded ? 'fa-caret-up' : 'fa-caret-down'} expander` }
                           onClick={withoutPropagation(() => !node.isLeaf && toggleExpandBranch(node))}/>
                        {getNodeName(node)}
                    </div>
                    {isSelected(node) && <span className={'system-element-actions'}>
                        {index <= 0 ? null : <i className="fas fa-level-up-alt flipped" onClick={withoutPropagation(() => levelUp(node))} />}
                        {index <= 0 ? null : <i className="fas fa-chevron-up" onClick={withoutPropagation(() => orderUp(node))} />}
                        {index === orderedNodeIds.length -1 ? null : <i className="fas fa-chevron-down" onClick={withoutPropagation(() => orderDown(node))} />}
                        {index === orderedNodeIds.length -1 ? null : <i className="fas fa-level-down-alt" onClick={withoutPropagation(() => levelDown(node))} />}
                        <i className="fas fa-times" onClick={withoutPropagation(() => removeElement(node))}/>
                    </span>}
                    <i className={clsx("fas fa-exclamation critical-mark", node.critical && 'marked')} onClick={withoutPropagation(() => toggleCritical(node.nodeValue))}/>
                </div>}
            </Draggable>
        </div>
    })



    return <div className={'orderable-tree-root'}>
        <div className={'tree-title'}>{title}</div>
        <div className={'tree-sub-title'}>
            Show only critical (<span className={'critical-text'}>!</span>) elements
            <Switch style={style} checked={hideNonCritical} onChange={onNonCriticalCheck} />
        </div>
        <DragDropContext onDragEnd={onDragEnd} onBeforeCapture={onBeforeCapture}>
            <Droppable droppableId={'systems-tree-dropzone'} isCombineEnabled>
                {provided => <div {...provided.droppableProps} ref={provided.innerRef}>
                    {!_.isEmpty(nodeIndex) ? renderNodes() : null}
                    {provided.placeholder}
                </div>}
            </Droppable>

        </DragDropContext>
    </div>
}
