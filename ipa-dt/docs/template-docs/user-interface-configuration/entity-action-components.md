---
title: Entity Action Components
sidebar_position: 16
---

## ServiceRequestModal

A modal that will be used to send service requests (the actual service request is not implemented yet)

### Configuration

|key|value|
|---|---|
|properties|The property names that will be shown for every entity selected.|


### Examples

```json
"Service Request": {
  "allow": true,
  "icon": "fas fa-wrench",
  "showOnTable": true,
  "component": {
    "name": "ServiceRequestModal",
    "properties": [
      "Room Name",
      "Room Number",
      "Manufacturer",
      "Model Number"
    ]
  }
}
```
