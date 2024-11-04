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
<!---  NOTE Is the below required? NOTE -->
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
### Entity properties
More information on properties can be found [here](./properties.md).