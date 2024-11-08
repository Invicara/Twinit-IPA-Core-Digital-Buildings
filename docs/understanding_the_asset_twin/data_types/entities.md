# Entities
Entities are a generic object that is understood by the Digital Building Manual (DBM) components and controls. 

Other types of objects such as Assets and Spaces, can be transformed into Entities in order to be displayed in the Asset Twin, and then transformed back when making changes.

Here is an example of an Entity object:
```json
{
  "_id" : <id>,
  "Entity Name": <name of the entity>,
  "properties": [<array of properties>],
  "modelViewerIds": [<array of element packageids>]
}
```

Example of Asset Entity object:
```json
{
    "Asset Name": <asset name>,
    "revitElementIds": { <revit elemement> },
    "_id": <id>,
    "properties": [<array of properties>]
    "original": <original asset object>
    "Entity Name": <entity name>,
    "modelViewerIds": <array of id's>,
    "modelData": { "id": <id> }
}
```

Example of File Item object before transformation to entity object:
```json
{
 "fileAttributes": {
   "dtCategory": "Bim Elements",
   "contributor": "",
   "dtType": "AC Room Controller",
   "documentType": "",
   "levelsAndLocations": "02-SECOND FLOOR",
   "stageDescription": "Concept",
   "fileDiscipline": "Architecture",
   "originator": "",
   "building": "Kingspan Group Office ",
   "fileType": "",
   "manufacturer": "",
   "revision": ""
 },
  "versions": [<array of file versions>],
  "name": <file name>,
  "tipVersionNumber": <current version number>,
  "containerPath": <path to container>,
  "nextVersionNumber": <number of the next version>,
  "_metadata": {<metadata>},
  "_fileId": <fileId>
}
```
With File Items, the fileAttributes are converted into an properties object. Example of File Item object after transformation to entity object:
```json
{
"_id": "6718e5028e642122fb23cbde",
"_fileId": "72a1cb07-7980-444a-be72-b683b665b9e6",
"fileAttributes": {<file attributes as decalred above>},
"versions": [<array of versions>],
"name": <file name>,
"tipVersionNumber": <tip version>,
"containerPath": <path to container>,
"nextVersionNumber": <next file version>,
"_metadata": {<metadata>},
"Entity Name": <entity name, same as file name>,
"properties": {
  "dtCategory": {
    "dName": "dtCategory",
    "type": "<HIERARCHY>",
    "val": "Bim Elements"
  },
  "Contributor": {
    "dName": "Contributor",
    "type": "text",
    "val": null
  },
  "dtType": {
    "dName": "dtType",
    "type": "<HIERARCHY>",
    "val": "AC Room Controller"
  },
  "Document Type": {
    "dName": "Document Type",
    "type": "text",
    "val": null
  },
  "Levels and Locations": {
    "dName": "Levels and Locations",
    "type": "text",
    "val": "02-SECOND FLOOR"
  },
  "Stage Description": {
    "dName": "Stage Description",
    "type": "text",
    "val": "Concept"
  },
  "File Discipline": {
    "dName": "File Discipline",
    "type": "text",
    "val": "Architecture"
  },
  "Originator": {
    "dName": "Originator",
    "type": "text",
    "val": null
  },
  "Building": {
    "dName": "Building",
    "type": "text",
    "val": "Kingspan Group Office "
  },
  "File Type": {
    "dName": "File Type",
    "type": "text",
    "val": null
  },
  "Manufacturer": {
    "dName": "Manufacturer",
    "type": "text",
    "val": null
  },
  "Revision": {
    "dName": "Revision",
    "type": "text",
    "val": null
   }
 }
}
```

### Entity properties
More information on properties can be found [here](./properties.md).