---
title: Live Examples
description: ImageMapster Examples
---

The following sources can be used to view ImageMapster in action!

## ImageMapster Repository

Within the [ImageMapster Github Repository](https://github.com/jamietre/ImageMapster) there is a comprehensive set of examples with complete source code. To interact with the examples:

- Visit [ImageMapster Examples](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/index.html) to view them live.
- Visit [Development -> Examples](https://github.com/jamietre/ImageMapster/blob/main/README.md#examples) for details on running them on your local machine in order to review/change code.

## JSFiddle

These demos are all set up for you on [JSFiddle](https://www.jsfiddle.net).

- [Clean USA Map Demo](https://jsfiddle.net/rwpcbyLj/latest) - The USA Map set up, ready for you to play with.
- [Vegetable Tray Demo](https://jsfiddle.net/techfg/mn72ckyw/latest) - Shows using different area options, and capturing events

### How do I ...?

- Work with groups of areas?
  - [Area Groups](https://jsfiddle.net/techfg/mnco4ru8/latest) - Demo showing how to use multiple groups per area to create supergroups that you can control indepently from code
  - [Set up profiles that control the effects used to render groups of areas](https://jsfiddle.net/techfg/0sn28b3g/latest) - Without too much trouble you can create option profiles of options and apply them to groups of areas automatically.
- Pre-select certain areas on the map?
  - [Select areas in advance, and they can't be deselected by the user](https://jsfiddle.net/techfg/zbns5rt2/latest)
  - [Just select areas in advance](https://jsfiddle.net/techfg/efpzbxnk/latest)- The user can deselect them.
- Get the image map to adjust to the size of the browser window?
  - [Manually resize the map](https://jsfiddle.net/techfg/zh8bj47q/latest) when browser resizes
  - [Have ImageMapster automatically resize the map](https://jsfiddle.net/techfg/e4qg1knp/latest) when browser resizes
- Set up complex effects in advance as the background, and then activate the map using different effects?
  - [Use "snapshot"](https://jsfiddle.net/techfg/y6rqjtuz/latest) - to convert the current state of the map into the background
  - [Another example](https://jsfiddle.net/techfg/gnmeLx3b/latest) - using different effects on a specific area
- Darken the image when someone first mouses over it and show the current area undarkened, e.g. the inverse of the usual behavior?
  - [Use "snapshot"](https://jsfiddle.net/techfg/qu2kfpn3/latest) - like above to make the image dark, then use the canvas `toDataUrl` method to grab the dark image. `altImage` is used with the image itself to highlight over the darkened backdrop.
  - [Insert a filter](https://jsfiddle.net/techfg/d2neubaq/latest) - between ImageMapster's layers to create a darkening effect over the original image, without affecting the highlights.
- Use imagemapster to "fill in" areas on an image data sent from the server?
  - [This example](https://jsfiddle.net/techfg/e4sntmzb/latest) shows how to configure ImageMapster with external data.
- Track more than two states (unselected, selected1, selected2) for each area?
  - [Track three different selection states](https://jsfiddle.net/techfg/ec1tq5v8/latest) with this example. It can easily be adapted for more than three.
- Bind an external list?
  - [Use "boundList" option](https://jsfiddle.net/techfg/md24vcjh/latest) to associate map areas with items in a list
  - [Use "onGetList" option](https://jsfiddle.net/techfg/sgyrvtpj/latest) to dynamically build external list and associate with map areas
