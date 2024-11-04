# Spaces

Spaces are a bondable region such as a room or an area. Space collections have a NamedUserItems `_userType` of `iaf_ext_space_coll`.

### Relations
Each Space is related to a Space collection. Each Space also has a direct relation to an Asset that is contained in that space.
<!--- NOTE Would this be better as a table? NOTE --> 

###  JSON data structure of a Space collection object
```json
{
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
}
```

###  JSON data structure of a Space item object
```json
{
  "_id" : <id>,
  "Space Name": <name of the entity>,
  "properties": [<array of properties>]
}
```


### Space properties
More information on properties can be found [here](./properties.md).

<!---  Do I need to explain how the 'importModeledSpaces' script works and how we can edit it along with the .xlsx file to add in custom properties? -->