---
title: Overview
sidebar_position: 12
---

## Page Handlers

Not only are the pages configurable but so is each page handler. Where possible we make the page handler generic so that it can be reused (notice how all the entities have a common user experience for selecting, viewing and navigating), other handlers are very specific to a task (e.g. the navigator).

The page handler configurations are unique because they each support a unique feature set. However, they all follow a common pattern.

We currently support the following handlers:

- `NavigatorView` - the 3D model viewer - currently our in house version - but will be replaced by HOOPS.
- `KnackView` - a view to embed applications developed using [https://www.knack.com/](https://www.knack.com/)
- `ModelImportView` - a view that supports importing and versions of models (bimpks - to us old school folks)

Each page handler has its own page. Some handlers are very simple - but others like the Entity and Dashboard views are very configurable.