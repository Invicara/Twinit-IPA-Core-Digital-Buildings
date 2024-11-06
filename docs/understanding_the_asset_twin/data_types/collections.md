# Collections
Collections are the grouping of different data types such as Assets and Spaces. Collection collections have a NamedUserItems `_userType` of `iaf_ext_coll_coll`.

### Relations
Once an entity has been added to a Collection, a relation is created between the Collection and the entity where the Collection is the parent.

###  JSON data structure of a Collections collection object
```json
 {
    "_uri": <namedUserItem uri>,
    "_name": <name of the collection>,
    "_userType": <namedUserItem userType>,
    "_tipId": <tipId>,
    "_versions": [<array of collection versions>],
    "_irn": <itemsvc:nameduseritem:<id>>,
    "_namespaces": [<array of nameSpaces>],
    "_nextVersion": <number of the next version>,
    "_shortName": <collection shortname>,
    "_tipVersion": <current tip version>,
    "_versionsCount": <number of versions>,
    "_itemClass": <namedUserItems itemClass>,
    "_userItemId": <namedUserItems userItemId>,
    "_id": <id>,
    "_description": <collection description>,
    "_kind": <type of namedUserItem>
 }

 
```

###  JSON data structure of a Collection item object
```json
{
 "Collection Name": <name of the entity>,
 "public": boolean,
 "_id": <id>,
 "properties": {<object of properties>}
}
```

### Collections properties
Please view below, an example of a collection item including the porperties object.
```json
 {
 "Collection Name": "First Floor Chair's",
 "public": true,
 "_id": "16ecd0333dcdd119c0ed06c7",
 "properties": {
  "Type": {
    "val": "Chair's",
    "dName": "Type",
    "type": "text"
  }
 }
}
```
The entity `Type` property represents the type of entity in the collection and it is required. A user can add in more property objects as needed for their collection item.
