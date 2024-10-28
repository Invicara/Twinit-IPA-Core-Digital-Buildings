---
title: Connectors
sidebar_position: 9
---

## SisenseConnect

```jsx
{
   name: 'SisenseConnect',
   config: {
      url: 'https://invicara.sisensepoc.com'
   }
 },
```

### Purpose

Loads the Sisense JS, allowing for embedding of one or more widgets without the use of an iframe.

### Configuration

- `url`: url to the Sisense instance

## SisenseIframe

```jsx
{
   name: 'SisenseIframe',
   config: {
      url: 'https://invicara.sisensepoc.com'
   }
 },
```

### Purpose

Loads the Sisense Embed SDK, allowing for embedding of entire Sisense dashboards in an iframe.

### Configuration

- `url`: url to the Sisense instance
