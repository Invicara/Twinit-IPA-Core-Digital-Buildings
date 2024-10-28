---
title: Entity Data Components
sidebar_position: 17
---

## HaystackPointReadingTable

Displays a table listing the readings from Haystack BMS points. Uses SimpleTable, but contains logic to be able to understand a point and its current value, unit, etc…

The first column of the table will contain the points navName.

The second column will contain the reading for the point, if one exists. The reading will include the unit if it is of kind “number”. If the point is of kind “Bool” the reading will display the correct value based on the points enum property.

The third column displays the points curStatus.   
If the status is “ok” it will display with a green ciricle.   
If the status is not “ok” but no error exists it will display with an orange exclamation triangle.   
If there is a curErr, then the status will display with a red bang and will have the error message appended.

Haystack Tag Documentation: [https://www.project-haystack.org/tag](https://www.project-haystack.org/tag)


### Configuration

|key|value|
|---|---|
|decimalPlaces (optional)|The number of places to round any values to in the table. Default: 3|
|columnNames (optional)|A list of three column name display values name:<ul><li>The column heading for the point name column. Default: “Name”</li><li> reading: The column heading for the point reading column. Default: “Reading”</li><li> status: The column heading for the point status column. Default: “Status”</li></ul>|

### Examples

```jsx
component: {
    name: "HaystackPointReadingTable",
    config: {
      decimalPlaces: 2,
      columnNames: {
        name: "Point Name",
        reading: "Point Reading",
        status: "Point Status"
      }
   }
}
```

## Matterport Viewer

A viewer for Matterport files hosted online.

### Configuration

|key|value|
|---|---|
|script|A script which will return any configuration such as url or options. If the script returns an options object it will complete replace any configured options (not combine).|
|height (optional)|Height of the viewer|
|width (optional)|Width fo the viewer|
|options|An object specifying any of the url parameter options that the Matterport viewer supports [Matterport URL Parameters](https://support.matterport.com/hc/en-us/articles/209980967-URL-Parameters)|
|allFullscreen (optional)|Whether to allow the user to go fullscreen|


### Examples

```jsx
Matterport: {
   script: "getMatterportConfig",
   component: {
    name: 'MatterportViewer',
    config: {
      height: '600',
      options: {
        brand: 0,
        help: 0,
        qs: 0,
        f: 0,
        vr: 0,
        mls: 0,
        hr: 0,
        gt: 0,
        play: 1
      }
    }
  }
},
```


## SisenseWidgets

A component that supports embedding one or more individual Sisense Widgets.

The SisenseConnect connector must be configured at the top level of the userConfig in order for the SisenseWidgets to function.


### Configuration

|key|value|
|---|---|
|name|SisenseWidgets|
|script (optional)|a script which returns a widgets configuration|


### Widget Configuration

|key|value|
|---|---|
|id|the id of the widget in Sisense. You can find this id by editing the widget in Sisense and taking it from the end of the url in the browser|
|style (optional)|optional styles to apply to the widget|
|showHeader (optional)|**true**/false, whether to show the header bar of the widget with the widget title and clear filter button, by default the title of the widget will be the title in Sisense|
|widgetTitle|a title to override the title of the widget in Sisense|
|showClearFilter|**true**/false, whether to show the clear filter button for the widget|


### Examples

```jsx
"IAQ": {
   script: "getRoomIAQWidget",
   component: {
      name: "SisenseWidgets",
      config: {
        showHeader: false
      }
   }
},
```

## HaystackPointReadingTableGroup

### Configuration

|key|value|
|---|---|
|refreshInterval (required)|interval at which we will refresh the data|
|columnNames (required)|column Names for the tables|
|decimalPlaces (required)|decimal places that the data will be displayed with|


### Examples

```json
"Realtime Readings": {
  "script": "getAllRealtimeAssetPointReadings",
  "scriptExpiration": 0,
  "refreshInterval": 5,
  "component": {
    "name": "HaystackPointReadingTableGroup",
    "config": {
    "decimalPlaces": 2,
    "columnNames": {
      "name": "Point Name",
      "readings": "Point Reading",
      "status": "Point Status"
      }
    }
  }
}
```
