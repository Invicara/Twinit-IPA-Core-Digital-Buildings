import React from "react";
import {TreeNodeStatus, withoutPropagation} from "@invicara/ipa-core/modules/IpaUtils";

const isVisible = (node) => node.visibilityStatus !== TreeNodeStatus.OFF

export const leafRendererWithVisibility = (node, toggleCurrentNode) =>
    node.nodeValue && <div>{node.nodeValue["Entity Name"]}
      {node.canToggleViewer ? <i className={isVisible(node) ? "fas fa-eye" : "fas fa-eye-slash"}
      onClick={withoutPropagation(() => toggleCurrentNode('visibilityStatus'))}
      /> : null}   
      { node.nodeValue["EntityWarningMessage"] &&
      <div className="tooltip-wrapper">
        <div className="dbm-tooltip">
          <i className="fas fa-exclamation-circle"/>
          <span className="dbm-tooltiptext">{node.nodeValue["EntityWarningMessage"]}</span>
        </div>
      </div>}
    </div>;

export const branchRendererWithVisibility = (node, childrenCount, toggleCurrentNode) => {
  return (
      <span>
        {node.nodeValue}
        <span className="count" style={{fontSize: "0.8em"}}>{childrenCount}
            <i className={isVisible(node) ? "fas fa-eye" : "fas fa-eye-slash"}
                onClick={withoutPropagation(() => toggleCurrentNode('visibilityStatus'))}/>
        </span>
      </span>
  )
};
