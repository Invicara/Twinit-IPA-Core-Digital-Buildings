# Files
Files are documents that are held inside the file service.

### Relations
We can not create relations between resources outside the File Service. When a user uploads a File to the File Service, a 
[File Item](./file_items.md) is also created and stored in the Item Service. This File Item is a related item that represents a File in the File Service. We can use this File Item to create relations between Assets and Spaces.

###  JSON data structure of a File object
```json
 {
    "_name": <file name>,
    "_tipId": <tip id>,
    "_type": <object type>,
    "_tags": [<array of tag names>],
    "_irn": <irn>,
    "_status": <upload status>,
    "_parents": [<parents file id>],
    "_nextVersion": <next file version>,
    "_namespaces": [<array of namespaces>],
    "_tipVersion": <tip version>,
    "_id": <id>,
    "_uploadMeta": <metadata for upload>,
    "_metadata": <metadata>
}
```

### File properties
We can not add properties that specify anything more then tags to Files. We can however, add addition properties to [File Items](./file_items.md).