---
title: Example Entity Transforms
sidebar_position: 6
---

As mentioned in the Data Model overview, data can be stored in any format that makes sense for the data. However, when surfacing the data into the UI, it often needs to transformed into the `Entity` schema.

For an example we will show how a `FileItem` is transformed into an `Entity` and back.

This is an example `FileItem` in the file item collection.

```jsx
{
    _id: ObjectId('5ebab90df95e1865ac5b124f'),
    _updateLogs: [
        {
            _updatedBy: 'c0d01794-5066-46b1-b86a-1939bea18320',
            _updatedAt: 1589295373795
        }
    ],
    fileAttributes: {
        dtCategory: '',
        contributor: 'Ashdown Controls Group ',
        documentType: '2D drawing',
        dtType: '',
        levelsAndLocations: '01-FIRST FLOOR',
        stageDescription: 'Briefing',
        fileDiscipline: 'Acoustic Design',
        originator: 'Armatile ',
        building: 'IKON BUILDING',
        fileType: 'Archicad',
        manufacturer: 'asdf',
        revision: '1'
    },
    versions: [
        {
            fileSize: 89554,
            versionNumber: 1,
            _fileVersionId: '57fe9c26-b4c0-4d4a-80ef-c93ca95f3db6'
        }
    ],
    name: 'IKON.jpg',
    tipVersionNumber: 1,
    containerPath: '/',
    nextVersionNumber: 2,
    _metadata: {
        _updatedById: 'c0d01794-5066-46b1-b86a-1939bea18320',
        _createdAt: 1589295373795,
        _createdById: 'c0d01794-5066-46b1-b86a-1939bea18320',
        _updatedAt: 1589295373795
    },
    _fileId: '0fdd694e-7090-43ed-8d5b-e6a703e45493'
}
```

In order to transform the `FileItem` into an `Entity` we will need to do two things:

1. Provide an `Entity` Name
2. Provide the fileAttributes as Properties

For `Entity` Name we will just use the file name.

For the File Attributes we will convert each into a text type property, except for dtCategory and dtType which will be the special `<<HIERARCHY>>` type.

Here is a script which will take an array of `FileItems` and transform them into `Entities`.

```jsx
{$defscript: {"getFiles": [

    //get the raw file items based on the $entityInfo passed in
  {$wait:
    {$let: {"fileItems":
        {$getFileItems: {
            collectionDesc: {
        _userType: "$iaf_ext_files_coll._userType",
        _userItemId: "$iaf_ext_files_coll._userItemId"
        },
            query: "$entityInfo",
            options: {page: {getAllItems: true}}
          }}
        }}
  },

  {$let: {"filesAsEntities": {
    $map: {
      input: "$fileItems",
      as: "file",
      in: {
        _id: "$$file._id",
        "Entity Name": "$$file.name",
        properties: {$arrayToObject: {
          input: {$map: {
            input: "$iaf_attributeDisplayNames",
            as: "attr",
            in: {
              dName: "$$attr.dName",
              val: {$cond: [
                {$findone: [{$objectToArray: "$$file.fileAttributes"}, {k: "$$attr.prop"}]},
                {$value: ["$$attr.prop", "$$file.fileAttributes"]},
                null
              ]},
              type: {$cond: [
                {$or: [{$eq: ["dtCategory", "$$attr.prop"]}, {$eq: ["dtType", "$$attr.prop"]}]},
                "<<HIERARCHY>>",
                "text"
              ]}
            },
            out: {}
          }},
          keyField: "dName"
        }}
      }
    }
  }}}
]}},
```

This will produce the following which fits the `Entity` schema:

```jsx
{
    _id: ObjectId('5ebab90df95e1865ac5b124f'),
    _updateLogs: [
        {
            _updatedBy: 'c0d01794-5066-46b1-b86a-1939bea18320',
            _updatedAt: 1589295373795
        }
    ],
    fileAttributes: {
        dtCategory: '',
        contributor: 'Ashdown Controls Group ',
        documentType: '2D drawing',
        dtType: '',
        levelsAndLocations: '01-FIRST FLOOR',
        stageDescription: 'Briefing',
        fileDiscipline: 'Acoustic Design',
        originator: 'Armatile ',
        building: 'IKON BUILDING',
        fileType: 'Archicad',
        manufacturer: 'asdf',
        revision: '1'
    },
    versions: [
        {
            fileSize: 89554,
            versionNumber: 1,
            _fileVersionId: '57fe9c26-b4c0-4d4a-80ef-c93ca95f3db6'
        }
    ],
    name: 'IKON.jpg',
    tipVersionNumber: 1,
    containerPath: '/',
    nextVersionNumber: 2,
    _metadata: {
        _updatedById: 'c0d01794-5066-46b1-b86a-1939bea18320',
        _createdAt: 1589295373795,
        _createdById: 'c0d01794-5066-46b1-b86a-1939bea18320',
        _updatedAt: 1589295373795
    },
    _fileId: '0fdd694e-7090-43ed-8d5b-e6a703e45493',
    "Entity Name": 'IKON.jpg',
    properties: {
      dtCategory: {
        type: "<<HIERARCHY>>",
        val: "",
        dName: "dtCategory"
      },
      dtType: {
        type: "<<HIERARCHY>>",
        val: "",
        dName: "dtType"
      },
      contributor: {
        type: "text",
        val: "Ashdown Controls Group",
        dName: "Contributor"
      },
      documentType: {
        type: "text",
        val: "2D drawing",
        dName: "Document Type"
      },
      levelsAndLocations: {
        type: "text",
        val: "01-FIRST FLOOR",
        dName: "Levels and Locations"
      },
      ...
    }
}
```

Sometimes it is better to keep the entire original entity in a property separate from the `Entity` data.

```jsx
{
    _id: ObjectId('5ebab90df95e1865ac5b124f'),
    "Entity Name": 'IKON.jpg',
    properties: {
      dtCategory: {
        type: "<<HIERARCHY>>",
        val: "",
        dName: "dtCategory"
      },
      dtType: {
        type: "<<HIERARCHY>>",
        val: "",
        dName: "dtType"
      },
      contributor: {
        type: "text",
        val: "Ashdown Controls Group",
        dName: "Contributor"
      },
      documentType: {
        type: "text",
        val: "2D drawing",
        dName: "Document Type"
      },
      levelsAndLocations: {
        type: "text",
        val: "01-FIRST FLOOR",
        dName: "Levels and Locations"
      },
      ...
    },
    original: {
       _updateLogs: [
        {
            _updatedBy: 'c0d01794-5066-46b1-b86a-1939bea18320',
            _updatedAt: 1589295373795
        }
      ],
      fileAttributes: {
          dtCategory: '',
          contributor: 'Ashdown Controls Group ',
          documentType: '2D drawing',
          dtType: '',
          levelsAndLocations: '01-FIRST FLOOR',
          stageDescription: 'Briefing',
          fileDiscipline: 'Acoustic Design',
          originator: 'Armatile ',
          building: 'IKON BUILDING',
          fileType: 'Archicad',
          manufacturer: 'asdf',
          revision: '1'
      },
      versions: [
          {
              fileSize: 89554,
              versionNumber: 1,
              _fileVersionId: '57fe9c26-b4c0-4d4a-80ef-c93ca95f3db6'
          }
      ],
      name: 'IKON.jpg',
      tipVersionNumber: 1,
      containerPath: '/',
      nextVersionNumber: 2,
      _metadata: {
          _updatedById: 'c0d01794-5066-46b1-b86a-1939bea18320',
          _createdAt: 1589295373795,
          _createdById: 'c0d01794-5066-46b1-b86a-1939bea18320',
          _updatedAt: 1589295373795
      },
      _fileId: '0fdd694e-7090-43ed-8d5b-e6a703e45493',
    }
}
```

If edited `Entity` data needs to be saved back you must transform the `Entity` representation back to the its original form. This script returns an edited `Entity` back to the FileItem schema.

```jsx
{$defscript: {"editFile": [

  {$let: {"propNames": {$objectEntries: "$entityInfo.new.properties"}}},
  {$let: {"propArray": {
    $map: {
      input: "$propNames",
      as: "propInfo",
      in: [
        {$value: ["prop", {$findone: ["$iaf_attributeDisplayNames", {dName: "$$propInfo[0]"}]}]},
        "$$propInfo[1].val"
      ],
      out: {}
    }
  }}},

  {$let: {"updatedFileItem": [[{
    _id: "$entityInfo.new._id",
    name: "$entityInfo.new.name",
    fileAttributes: {$arrayToObject: "$propArray"},
    _fileId: "$entityInfo.new._fileId",
    containerPath: "$entityInfo.new.containerPath",
    nextVersionNumber: "$entityInfo.new.nextVersionNumber",
    tipVersionNumber: "$entityInfo.new.tipVersionNumber",
    versions: "$entityInfo.new.versions"
  }]]}},
      
  {$wait: {$setq: {"updateItemResult": {
    $updateItemsBulk: {
      _userItemId: "$iaf_ext_files_coll._userItemId",
      _namespaces: "$IAF_workspace._namespaces",
      items: "$updatedFileItem"
    }
  }}}},

  {$cond: [
    {$eq: ["$updateItemResult[0][0]", "ok: 204"]},
    {$let: {"res": {
      success: true,
      result: "$updateItemResult[0][0]"
    }}},
    {$let: {"res": {
      success: false,
      message: "Error updating File!"
    }}},
  ]}

]}},
```