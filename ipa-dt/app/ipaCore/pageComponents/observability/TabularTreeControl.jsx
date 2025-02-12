import React from "react";
import _ from 'lodash'
import clsx from "clsx";
import {produce} from "immer";
import {
    defaultBranchRenderer,
    defaultLeafRenderer,
    propagateNodeStatusDown, propagateNodeStatusUp, TreeNodeStatus,
    withoutPropagation, curriedFlip
} from "@invicara/ipa-core/modules/IpaUtils/index.js";

const TabularTreeControl = ({nodeIndex, onNodeIndexChange, renderBranchNode = defaultBranchRenderer, renderLeafNode = defaultLeafRenderer}) => {

    const getNodeClasses = (node, baseClasses = '') => {
        return clsx(baseClasses,
        _.get(node,'selectedStatus', TreeNodeStatus.OFF) === TreeNodeStatus.ON && "selected",
        _.get(node,'selectedStatus', TreeNodeStatus.OFF) === TreeNodeStatus.PARTIAL && "partial",
        _.get(node,'expanded', false) && "expanded",
        _.get(node,'hidden', false) && "hidden",
    )}

    const expandBranch = (node) => onNodeIndexChange(produce(nodeIndex, nodeIndex => {
        nodeIndex[node.id].expanded = !nodeIndex[node.id].expanded
    }))

    const toggleNode = (property) =>  (node) => onNodeIndexChange(produce(nodeIndex, nodeIndex => {
        const wasOn = nodeIndex[node.id][property] === TreeNodeStatus.ON
        propagateNodeStatusDown(property)(nodeIndex, node.id, wasOn ?  TreeNodeStatus.OFF : TreeNodeStatus.ON);
        propagateNodeStatusUp(property)(nodeIndex, node.id);
    }))

    const getNodeChildren = (node) => node.children.map(childId => nodeIndex[childId]);

    const getChildrenCount = (node) => _.values(nodeIndex).filter(n => n.isLeaf && n.parents.includes(node.id)).length

    const renderBranch = (node) =>
        <li className={getNodeClasses(node, 'branch')} onClick={withoutPropagation(() => toggleNode('selectedStatus')(node))} key={node.id}>
            <a>
            <span>
              <i className="fa fa-angle-down branch-expander" onClick={withoutPropagation(() => expandBranch(node))}/>
                {renderBranchNode(node, getChildrenCount(node), curriedFlip(toggleNode)(node))}
            </span>
            </a>
            <ul key={node.id + "_children"}>{renderNodes(getNodeChildren(node))}</ul>
        </li>

    const renderLeaf = (node) =>
        <li className={getNodeClasses(node, 'leaf')} key={node.id} onClick={withoutPropagation(() => toggleNode('selectedStatus')(node))} >
            <a>
                <span>{renderLeafNode(node, curriedFlip(toggleNode)(node))}</span>
            </a>
        </li>


    const renderNodes = (treeNodes) => treeNodes.map(node => {

        if(!node) {
            return <p>No node to render</p>
        }

        return node.isLeaf ? renderLeaf(node) : renderBranch(node)
    })

    return (
        <div className={"tabular-reactive-tree"}>
            {!_.isEmpty(nodeIndex) ? <ul>{renderNodes(_.values(nodeIndex).filter(node => node.level === 0))}</ul> : null}
        </div>
    )
}

export default TabularTreeControl
