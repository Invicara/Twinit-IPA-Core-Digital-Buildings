# Assets

Items of interest encompassed in a Space. Asset collections have a NamedUserItems `_userType` of `iaf_ext_asset_coll`.

### Relations
Each Asset is related to a Asset collection. Each Asset also has a direct relation to an Space where that Asset is contained.

###  JSON data structure of a Asset collection object
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

###  JSON data structure of a Asset item object
```json
{
  "_id" : <id>,
  "Asset Name": <name of the entity>,
  "properties": [<array of properties>]
}
```


### Asset properties
More information on properties can be found [here](./properties.md).