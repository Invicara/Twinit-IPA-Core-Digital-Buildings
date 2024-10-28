---
title: Dashboard Components
sidebar_position: 15
---

## PropertyInfoTable

Designed to be displayed in a `grid` and displays information of the Property that is the subject of the DBM

## Matterport Viewer

Displays a Matterport Viewer in an iframe on the dashboard

### Configuration

|component|the MatterportViewer component name|
|---|---|
|url|the url to the matterport file to embed|
|width (optional)|width in pixels of the viewer|
|height (optional)|height in pixels of the viewer|
|options|an object specifying any of the url parameter options that the Matterport viewer supports [MatterPort URL Parameters](https://support.matterport.com/hc/en-us/articles/209980967-URL-Parameters)|
|allowFullScreen (optional)|whether to allow the user to go fullscreen|

### Examples

```
matterport: {
   position: {top: 1, left: 2, bottom: 2, right: 3},
   component: "MatterportViewer",
   url: "https://my.matterport.com/show/?m=CA9stBspvL2",
   height: 600,
   options: {
    play: 1,
    qs: 0
  }
},
```

## SisenseIframe

An iframe embed of a Sisense dashboard.

The SisenseIframe connector must be configured at the top level of the userConfig in order for the SisenseIframe to function.

### Configuration

|component|SisenseIframe|
|---|---|
|dashboardId|the id of the dashboard in Sisense. You can find this id by editing the dashboard in Sisense and taking it from the end of the url in the browser|

### Examples

```
{
  component: "SisenseIframe",
  dashboardId: "5f55c8ae7433fb002cf75ba5"
}
```

## SisenseWidgets

A component that supports embedding one or more individual Sisense Widgets.

The SisenseConnect connector must be configured at the top level of the userConfig in order for the SisenseWidgets to function.

### Configuration

|component|SisenseWidgets|
|---|---|
|dashboardId (optional)|the id of the dashboard in Sisense. You can find this id by editing the dashboard in Sisense and taking it from the end of the url in the browser|
|widgets|an array of widget configurations|

### Widget Configuration

|id|the id of the widget in Sisense. You can find this id by editing the widget in Sisense and taking it from the end of the url in the browser|
|---|---|
|style (optional)|optional styles to apply to the widget|
|showHeader (optional)|**true**/false, whether to show the header bar of the widget with the widget title and clear filter button, by default the title of the widget will be the title in Sisense|
|widgetTitle|a title to override the title of the widget in Sisense|
|showClearFilter|**true**/false, whether to show the clear filter button for the widget|

### Examples

```
component: "SisenseWidgets",
 widgets: [
    {
      id: '5f63113d7433fb002cf76266',
      style: {height: '25%', width: "100%"},
      showHeader: false,
      showClearFilter: false
   },
   {
      id: '5f63113d7433fb002cf76268',
      style: {height: '37%', width: "100%"},
      showHeader: true,
      showClearFilter: true
   },
   {
      id: "5f63113d7433fb002cf76267",
      style: {height: '37%', width: "100%"},
      showHeader: true,
      showClearFilter: true
    }
],
```

## HaystackPointReadingTableGroup

Displays a group of haystack point reading tables

### Configuration

|component|`HaystackPointReadingTableGroup`|
|---|---|
|panelClass|`"auto-overflow-y"` will allow us to scroll, in case there are too many tables in the dashboard|
|decimalPlaces|amount of decimal places that will be displayed in the table|
|refreshInterval|sets a timer to re fetch data|
|columnNames|names for the columns (will be passed down to each table)|
|equipment|array of objects, that must have the equipmentId and equipmentPoints that will then be fetched by the control|

### Examples

```json
"hayStacks": {
  "position": {
    "top": 1,
    "left": 2,
    "bottom": 3,
    "right": 4
  },
  "panelClass": "auto-overflow-y",
  "component": "HaystackPointReadingTableGroup",
  "equipment": [
    {
      "equipmentId": "IKON - KINGSPAN EF04_DisToilet_L2",
      "equipmentPoints": [
        "Fan Start",
        "Fan Alarm"
      ]
    },
    {
      "equipmentId": "IKON - KINGSPAN EF01_Public Toilet_L0",
      "equipmentPoints": [
        "Fan Start",
        "Fan Alarm"
      ]
    },
    {
      "equipmentId": "IKON - KINGSPAN EM_ACCELERATED AGING RIG 01",
      "equipmentPoints": [
        "TOTAL ENERGY"                  
      ]
    },
    {
      "equipmentId": "IKON - KINGSPAN EM_DB_0.1 GROUND FLOOR DB",
      "equipmentPoints": [
        "TOTAL ENERGY"                  
      ]
    },
    {
      "equipmentId": "IKON - KINGSPAN EM_DB_1.1 FIRST FLOOR DB",
      "equipmentPoints": [
        "TOTAL ENERGY"
      ]
    },
    {
      "equipmentId": "IKON - KINGSPAN FAS Panel",
      "equipmentPoints": [
        "Fire Alarm"
      ]
    }
  ],
  "refreshInterval": 5,
  "decimalPlaces": 2,
  "columnNames": {
    "name": "Point Name",
    "readings": "Point Reading",
    "status": "Point Status"
  },
  "script": "getEquipmentPointReadings"
},
```