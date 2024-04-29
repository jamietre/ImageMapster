---
title: Terminology
description: ImageMapster terminology.
---

For many of the concepts and functionality described within the documentation, it will help to explain the basic terminology used:

- **area** - An area on an image map, specifically, defined by an `area` tag ([HTMLAreaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement)) in the HTML markup.
- **area group** - One or more areas that are grouped together logically, each defined by an `area` tag. Area groups can be manipulated as if they were a single area.
  Often when discussing functionality the documentation may use `area` and `area group` interchangeably. In most cases, functionality applies to an `area group`, which can be one or more areas.
  If the distinction is important, it will be referenced as `a specific area.`
- **map key** - A token used to identify an `area` or `area group`. While you can use ImageMapster to manipulate things by selecting actual `area`
  elements from your HTML, it is often more convenient to refer to an `area group`. The `map key` refers to an identifier that you provide via the [mapKey][cr-mapkey] option
  for each `area` and allows you to create groups (when you use the same identifier for multiple areas). If you don't want to create any groups and don't want to refer
  to areas other than via their HTML tags, you do not have to provide a map key.
- **primary key** - An `area` can contain more than one key in the attribute identified by `mapKey`, separated by commas.
  The first one is the `primary key` and defines what areas are higlighted together when an `area` is clicked.
  However, you can add more keys to create other groupings, which can be activated using the [set][ar-set] method.
- **select** - When you select something, it becomes active until deselected. Selecting is like checking a box. It remains selected until deselected.
- **highlight** - A highlight, unlike a selection, is temporary, and can only apply to a single `area` at once. Usually something is highlighted when the user
  moves their mouse pointer over it, but a highlight can be set programatically as well with the [highlight][ar-highlight] method.
- **static state** - Areas may also be in a [staticState][cr-staticstate] which means that their selection state cannot be changed. A static state can either be `true` or `false`;
  when `true`, an `area` appears selected, but can never be deselected. Static state _does not affect selection state._ When querying the state of a static state `area`,
  even if it appears selected (because it's static state is `true`), it's selection state will always be `false`.

[cr-mapkey]: ./configuration-reference.md#mapkey
[cr-staticstate]: ./configuration-reference.md#staticstate
[ar-set]: ./api-reference.md#set
[ar-highlight]: ./api-reference.md#highlight
