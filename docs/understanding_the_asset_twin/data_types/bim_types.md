# BIM Type / Type Map

Type maps are intended to categorize and organise modeled elements. It is used to relate modeled elements to documents at the type level. Type Map collections have a NamedUserItems `_userType` of `iaf_dt_type_map_defs_coll`.

###  JSON data structure of a Asset Type Map collection object
```json
{
 "_uri": <uri>,
 "_name": <collection name>,
 "_userType": <collection usertype>,
 "_tipId": <tipid>,
 "_versions": [<array of versions>],
 "_irn": <irn>,
 "_namespaces": [<array of namespaces>],
 "_nextVersion": <next version>,
 "_shortName": <collection shortname>,
 "_tipVersion": <tip version>,
 "_versionsCount": <number of versions>,
 "_itemClass": <itemClass>,
 "_userItemId": <userItemId>,
 "_id": <id>,
 "_description": <collection description>,
 "_metadata": {<metadata>},
 "_kind": <object kind>
}
```
###  JSON data structure of a Asset Type Map item object
```json
{
 "Revit Type": <revit ytpe>,
 "dtCategory": <dtCategory>,
 "dtType": <dtType>,
 "_id": <id>,
 "Revit Family": <revit family>,
 "_metadata": {<matedata>},
 "Revit Category": <revit category>
}
```

Please refer to page 4 of the [Digital_Buildings_Workflow_Document.pdf](../../example_asset_twin/Digital_Buildings_Workflow_Document.pdf) to show how wew can import the Type Maps using the Config_Sheet.xlsx.