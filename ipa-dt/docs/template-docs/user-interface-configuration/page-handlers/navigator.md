---
title: Navigator View
sidebar_position: 14
---

The following are page component configuration snippets used for configuration of the Navigator View.

## `type`

### Syntax

```jsx
type: [
  {singular: 'Asset', plural: 'Assets'},
  {singular: 'Space', plural: 'Spaces'}
],
```

### Purpose

**Required**

Specify the singular and plural name of the types being represented in the NavigatorView. This will be used in the user interface to indicate which objects a user is viewing and acting on.

## `entityData`

### Syntax

```jsx
entityData: {
  Asset: {
	  script: 'getAssets',
	  getEntityFromModel: 'getAssetFromModel'
  },
  Space: {
	  script: 'getSpaces',
	  getEntityFromModel: 'getSpaceFromModel'
  }
},
```

### Purpose

**Required**

Specifies the scripts to use to fetch entities.

### Configuration

- `script`: the script to use to fetch the entities when queried.
- `getEntityFromModel`: the script to use to fetch an entities data when selected in the 3D viewer. Must use the revit element id.

### Notes

Properties must match the singular types.

## data

### Syntax

```jsx
data: {
  Asset: {},
  Space: {}
}
```

### Configuration

Configuration for extended data on each type. This is configured identically to extended data in the EntityView.

### Notes

Properties must match the singular types.
