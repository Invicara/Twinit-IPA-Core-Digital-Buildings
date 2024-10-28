import React, {useEffect, useState} from "react";

import {
  getFilteredEntitiesBy,
  nestedGroup,
  propagateNodeStatusUp,
  TreeNodeStatus
} from "@invicara/ipa-core/modules/IpaUtils"
import _ from 'lodash'
import {produce} from "immer";


export const useNodeIndexFromGroupAndFilter = (groups, filters, entities, selectedEntities, onEntitiesSelected, useDiff = false) => {
  const [nodeIndex, setNodeIndex] =  useState({})

  useEffect(() => {
    setNodeIndex(produce({},nodeIndex => {
      loadIntoNodeIndex(nodeIndex, makeTree(), 0, [])
    }))
  }, [filters,groups, entities]);

  const computeNodeIndex = (nodeIndex, selectedEntities) => {
    return produce(nodeIndex,nodeIndex => {
      _.values(nodeIndex).forEach(node => {
        const isNodeSelected = selectedEntities.some(el => el._id === _.get(node, 'nodeValue._id'))
        node.selectedStatus = isNodeSelected ? TreeNodeStatus.ON : TreeNodeStatus.OFF;
        propagateNodeStatusUp('selectedStatus')(nodeIndex, node.id)
      })
  })};

  const loadIntoNodeIndex = (nodeIndex, tree, level, parents = []) => {
    const nodes = Array.isArray(tree) ? tree : _.keys(tree);
    const nodeIdFor = (index) => `${_.last(parents) || 'root'}-${index}`;
    nodes.forEach((node, index) => {
      const nodeId = nodeIdFor(index);
      nodeIndex[nodeId] = {
        id: nodeId,
        level: level,
        parents,
        children: [],
        isLeaf: Array.isArray(tree),
        expanded: false,
        selectedStatus: TreeNodeStatus.ON,
        nodeValue: node,
        canToggleViewer: !_.isEmpty(node.modelViewerIds)
      }
      if(!Array.isArray(tree)) loadIntoNodeIndex(nodeIndex, tree[node], level + 1, [...parents, nodeId])
    });
    if (!_.isEmpty(parents)) nodeIndex[_.last(parents)].children = nodes.map((_, i) => nodeIdFor(i))
  }

  const makeTree = () => !_.isEmpty(groups) ?
      nestedGroup(getFilteredEntitiesBy(entities, filters), groups, (a, p) => a.properties[p] ? a.properties[p].val : null) : getFilteredEntitiesBy(entities, filters);

  const getSelectedEntities = (nodeIndex) => {
    return _.values(nodeIndex).filter(node => node.isLeaf && node.selectedStatus === TreeNodeStatus.ON).map(n => n.nodeValue);
  }

  const handleNodeIndexChange = (newNodeIndex) => {
    setNodeIndex(newNodeIndex)
    onEntitiesSelected(getSelectedEntities(newNodeIndex), selectedEntities, ({_id}) => _id)
  }

  return [computeNodeIndex(nodeIndex, selectedEntities) , handleNodeIndexChange]
}