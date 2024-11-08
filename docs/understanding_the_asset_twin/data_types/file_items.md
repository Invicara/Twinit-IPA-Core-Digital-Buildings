# File items

File items are stored in the Item service. They are created when a user uploads a document to the File Service. It is essentially a related item that represents a File in the File Service.

### Relations
File items have a direct relation to Assets and Spaces where the Assets and Spaces are the parent to the File Item.


###  JSON data structure of a File Item object
```json
{
 "fileAttributes": {<file attributes>},
 "versions": [<array of file versions>],
  "name": <file name>,
  "tipVersionNumber": <tip version>,
  "_id": <id>,
  "containerPath": <path to container>,
  "nextVersionNumber": <next file version>,
  "_metadata": {<metadata>},
 "_fileId": <file id>
}
```

### File items properties
You can find out more information about file item properties [here](./file_attributes.md).