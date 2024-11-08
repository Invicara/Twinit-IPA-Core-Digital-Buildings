# File Attributes
File Attributes are extra information that we can assoicate with a file. Once a user uploads a file, we can add attributes to the file item. When displaying the file data in the Asset Twin, the file item object is transformed into an [entity](./entities.md) object. When this transformation happens, the file Atrributes are converted into a text type [property](./properties.md). File Attributes have a NamedUserItems `_userType` of `iaf_cde_file_attrib_coll`.

###  JSON data structure of a File attributes collection
```json
{
 "_uri": <uri>,
 "_name": <collection name>,
 "_userType": <userType>,
 "_tipId": <tipid>,
 "_versions": [<array of versions>],
 "_irn": <irn>,
 "_namespaces": [<array of namespaces>],
 "_nextVersion": <next colleciton version>,
 "_shortName": <collection shortname>,
 "_tipVersion": <tip version>,
 "_versionsCount": <number of versions>,
 "_itemClass": <itemClass>,
 "_userItemId": <user item id>,
 "_id": <colleciton id>,
 "_description": <collection description>,
 "_metadata": {<metadata>},
 "_kind": <kind>
}
```

###  JSON data structure of a File attributes
```json
"fileAttributes": {
    "dtCategory": "Bim Elements",
    "contributor": "",
    "dtType": "AC Room Controller",
    "documentType": "",
    "levelsAndLocations": "02-SECOND FLOOR",
    "stageDescription": "Concept",
    "fileDiscipline": "Architecture",
    "originator": "",
    "building": "IKON East Block",
    "fileType": "",
    "manufacturer": "",
    "revision": ""
}
```

### File properties
More information on properties can be found [here](./properties.md).