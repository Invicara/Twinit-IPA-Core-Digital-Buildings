---
title: Top Level User Configuration
sidebar_position: 8
---

## connectors

```jsx
connectors: [
  {
    name: 'SisenseIframe',
    config: {
      url: 'https://invicara.sisensepoc.com'
    }
  },
  {
    name: 'SisenseConnect',
    config: {
     url: 'https://invicara.sisensepoc.com'
    }
  }
],
```

### Purpose

Enable front end integrations to other systems. Connectors do things like load 3rd party javascript.

### Configuration

An array of connector configuration objects.

- `name`: name of the connector to load
- `config`: configuration for the specific connector

### Notes

See Connectors for documentation on individual connector configurations.