---
title: JSON Data for Digital Twin Objects
sidebar_position: 5
---

## Assets

```jsx
{
  _id : <id>
  "Asset Name": <name of the entity>,
  properties: [<array of properties>]
}
```

## Collections

```jsx
{
  _id: <id>,
  "Collection Name: <name of the collection>,
  public: true
  false ,
  properties: {
    Type: {
      type: 'text',
      val: <type of the collection>,
      dName: <display name of the Type property>
    },
    "Entity Types": {
      type: 'tags',
      val: [],
      dName: "Entity Types"
    }
    <other properties>
  }
}
```

* public is not yet used
* the Type property is required
* the Entity Types property represents the type of Entites in the collection and is required

## Entities

```jsx
{
  _id : <id>,
  "Entity Name": <name of the entity>,
  properties: [<array of properties>],
  modelViewerIds: [<array of element packageids>]
}
```

* Entities are a generic object understood by the DBM components and controls.
* Other types of objects (Assets, Spaces) can be transformed into Entities in order to be displayed in the DBM,, and then transformed back when making changes.

## File Attributes

```jsx
{
  _id : <id>,
  camelCaseAttributeName: [<array of string values>],
  camelCaseAttributeName: [<array of string values>]
}
```

:::caution
IMPORTANT: We plan to convert the FileAttributes to properties as part of MVPaaS. SO the file items going forward would have a properties key with the properties in it as opposed to simple string attributes.
:::

## File Items

```jsx
{
  _id : <id>,
  name: <name of fileitem>,
  fileAttributes: {
    camelCaseAttributeName: <string attrbite value>,
    camelCaseAttributeName: <string attrbite value>
  },
  versions: <version info of file in fileSvc>,
  tipVersionNumber: <tip version>,
  containerPath: <path in container to file, currently always / >,
  _fileId: <id of file in fileSvc>
}
```

:::caution
IMPORTANT: We plan to convert the FileAttributes to properties as part of MVPaaS. SO the file items going forward would have a properties key with the properties in it as opposed to simple string attributes.
:::

## Properties

```jsx
"Property Name": {
  type: <the data type of the property>
  val: <value of the property, if type date, the display formatted date>
  epoch: <unix epoch timestamp if type date>
  uom: <unit of measure for the property>
  dName: <display name to use as an alternate to the PropertyName>
  srcPropName: <name of the original property if from Revit>
}
```

Supported Prop types:

- `number`
- `text`
- `date` (val will be the text display representation of epoch)
- `datetime` (val will be the text display representation of epoch)
- `tags` (an array of values)
- `bool`
- `<<HIERARCHY>>`

## Spaces

```jsx
{
  _id : <id>,
  "Space Name": <name of the entity>,
  properties: [<array of properties>]
}
```

## Test Measures

```jsx
{
  date: <date of the last time of all measures>,
  measures: [
    {
      dName: <name of the test measure>,
      val: <value of the test measure>,
      type: <type of the value, see properties>,
      date: <timestamp of date measure was taken>,
      uom: <unit of measure>
    }
  ]
}
```

* Top level date is reflective of the report date and is in the property format.
* Measure dates are reflective when the individual measure was taken.
* For instance, it can take 3 days to complete all measures.
* Top level date would be the third day.
* Each measure could have a date on any of the 3 days.

:::note
Measure `name` has been changed to `dName` to be more consistent with Properties
:::

## Systems

Coming Soon

## System Elements

Coming Soon
