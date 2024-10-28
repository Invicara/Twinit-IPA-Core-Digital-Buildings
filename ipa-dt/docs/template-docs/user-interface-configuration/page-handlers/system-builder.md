---
title: System Builder 
sidebar_position: 15
---

The following are page component configuration snippets used for configuration of the System Builder.

## `allowEntities`

### Syntax

```jsx
config: [
    {
        type: "Assets",
        script: "getAssets",
        default: true,
        isModel: false,
        plural: "Assets",
        singular: "Asset",
        entityFromModelScript: "getAssetFromModelSystems",
        searchConfig: {
            id: 'advsrch', query: "<<ADVANCED_SEARCH>>", display: "Advanced Search",
            searchable: {
                Mark: {type: "text"},
                "BA Name": {type: "text"},
                'Revit Family': {type: "text"},
                'Revit Type': {type: "text"}
            },
            queryLimit: 1000
        }
    }
]
```

### Purpose

**Required**

Specify the configuration of the entities that can be used to build System Elements and the search configuration for that type. It also specifies flags stating whether the entity should be the default selected one, whether it represents Model Elements instead of actual entities andthe corresponding scripts for searching and retrieving elements of the given type.

### queryLimit

The `queryLimit` attribute is being passed to the script as input while searching and filtering entities in the model. The script can then count the number of entities that should be returned by the query and return an error if it exceeds the limit.

The error should be a json object with this shape :
```js
{
    success: false, //false is required, otherwise it won't be treated as an error on the client
    message: "string"
    code: "string", //optional
}
```
The `success` attribute is required to be `false` to be treated as an error in the front end.

The error message is displayed on the client as an error in the search form.

## `picklistSelectsConfig`

### Syntax

```jsx
picklistSelectsConfig: {
    canCreateItems: true,
        pickListScript: "getPickList",
        createPickListScript: "updatePickList",
        initialPickListType: "SystemsCategories",
        selects: [
        {
            display: "System Category",
            createPickListOnUpdate: true
        },
        {
            display: "System Type",
            createPickListOnUpdate: false
        }
    ]
},
```

### Puropose

**Required**

Specifies the configuration of the pickLists used to create and edit the Systems attributes.


## `systemStatus`

### Syntax

```jsx
systemStatus: [
    "Active",
    "Inactive"
],
```

### Puropose

**Required**

Specifies the possible statuses a System can be in

## `canEditSystems`

### Syntax

```jsx
canEditSystems: true,
```

### Puropose

**Required**

Specifies whether the user can edit Systems or just its elements.


### Configuration


- `createSystemScript`: the script to use to create a System
- `getSystemScript`: the script to use to fetch an existing system.
- `editSystemScript`: the script to use to edit an existing system.
- `getSystemFromSchemaScript`: the script to use to fetch the systems schema.
- `createSystemElementScript`: the script to use to create a new system element.
- `getAllSystemsScript`: the script to use to retrieve all existing systems to list for edition.
- `updateSystemScript`: the script to use to update the relations of systems elements in a system.
- `sourceFileIndexScript`: the script to use to build the index for turning ond an of by source files in the viewer.
