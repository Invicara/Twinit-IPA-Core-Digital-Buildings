# Extended data
Extended data is extra data that we want to associate with an Asset.

### Relations
Extended data has a direct relation to Assets, where the Assest is the parent to the Extended data.

### Extended data userTypes
<table>
  <tbody>
    <tr>
      <th>Data Types</th>
      <th>Collection _userTypes</th>
    </tr>
    <tr>
      <td>Specification Data</td>
      <td align="left">iaf_dt_spec_data_coll</td>
    </tr>
    <tr>
      <td>Design Performance Data</td>
      <td align="left">iaf_dt_desperf_data_coll</td>
    </tr>
    <tr>
      <td>Ironmongery Data</td>
      <td align="left">iaf_dt_iron_data_coll</td>
    </tr>
     <tr>
      <td>Commissioning Data</td>
      <td align="left">iaf_dt_commtest_coll</td>
    </tr>
     <tr>
      <td>Asset Test Data</td>
      <td align="left">iaf_dt_assettest_coll</td>
    </tr>
     <tr>
      <td>BMS Assets</td>
      <td align="left">	bms_assets</td>
    </tr>
    <tr>
      <td>Supplier Data</td>
      <td align="left">	iaf_dt_sup_data_coll</td>
    </tr>
    <tr>
      <td>Maintenance History</td>
      <td align="left">	iaf_mhist_coll</td>
    </tr>
    <tr>
      <td>Traceability Data</td>
      <td align="left">	iaf_dt_trace_coll</td>
    </tr>
    <tr>
      <td>Contractor Data</td>
      <td align="left">	iaf_dt_contractor_coll</td>
    </tr>
    <tr>
      <td>Installer Data</td>
      <td align="left">	iaf_dt_installer_coll</td>
    </tr>
    <tr>
      <td>Warranty Data</td>
      <td align="left">	iaf_dt_warranty_coll</td>
    </tr>
  </tbody>
</table>

###  JSON data structure of a Extended data collection object
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
###  JSON data structure of a Extended data item object
```json
{
  "_id" : <id>,
  "properties": [<array of properties>]
}
```

### Extended data properties
More information on properties can be found [here](./properties.md).