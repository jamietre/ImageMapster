---
title: API Reference
description: ImageMapster API Reference
---

The ImageMapster API allows you to control the image maps through code. This can compliment the default behavior of ImageMapster (e.g., highlight on mouseover) or you can completely disable the default behavior and control everything yourself (or a combination of both).

## Initialization

```js
$('img').mapster(options);
```

All images in the jQuery collection that contain a [usemap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#usemap`) attribute that references a valid [map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map) element will be bound using the `options` specified.

For details on the available options, see [Configuration Reference][cr-base].

In the example above, ImageMapster will evaluate all images present on the page and bind to those with a `usemap` attribute that references a valid `map` element. However, because pages often contain many images, it will be faster to select just the image(s) you are targeting using a more specific selector.

For example:

```js
// images with a usemap attribute
$('img[usemap]').mapster(options);

// element with the id of myimage
$('#myimage').mapster(options);

// images with a class of image-map
$('img.image-map').mapster(options);
```

Images are often not completely loaded when script execution begins. ImageMapster will ensure that all images are loaded before it permits interaction from the client. If an [alternate image][cr-altimage] is specified, this will also be preloaded.

Because images are loaded asynchronously, code execution will often return to your script before the ImageMapster is available. If you apply other methods to it (such as selecting or deselecting areas), these commands will be queued until the image has been loaded, and then executed in the order called automatically. So you don't need to worry about using callbacks for initial configuration. If you need to be know when ImageMapster initialization is complete, you can use the [onConfigured][cr-onconfigured] event.

## Methods

### deselect

Set an area to **not** be [selected][cr-selected]. This is similar to a user click, but will not cause a click event to be fired.

This method will force an area to be become unselected regardless of its current [selected][cr-selected] state and any other configuration options (e.g., [staticState][cr-staticstate], [isSelectable][cr-isselectable], [isDeselectable][cr-isdeselectable], etc.).

**Usage:** `$('area').mapster('deselect');`

```js
// deselect area
$('#somearea').mapster('deselect');
```

### get

Get keys for all selected areas for the first element in the set of matched elements.

When called on a bound image with no `key` parameter included, returns a comma-separated list of keys representing the areas currently selected. If `key` is specified or if called on a bound area, returns `true` or `false` indicating whether the area specified is selected.

**Usage:**

- `$('area').mapster('get');`
- `$('img').mapster('get', [key ]);`
  - `key`: A single value identifying an area or area group corresponding to a value in [mapKey][cr-mapkey]
    - Type: `string`
    - Default: `undefined`

```js
// returns true/false for selected status of area
$('#somearea').mapster('get');
// returns comma-separated list of keys for currently selected areas
$('#someimage').mapster('get');
// returns true/false for area with key of TX
$('#someimage').mapster('get', 'TX');
```

### get_options

Get current or effective options for a bound image map.

When called with no parameters, returns the options that the mapster was configured using. When called with a single key it returns the area-specific options assigned to that area. The final parameter effective determines whether the actual options in effect for this area, or the specific options assigned are returned.

Areas inherit the global options assigned, but can be overridden by area-specific options. The `effective` options contain all options including those that are inherited, as well as any specifically assigned to the area.

**Usage:**

- `$('area').mapster('get_options');`
- `$('area').mapster('get_options' [, effective ]);`
  - `effective`: When `true`, returns effective rather than assigned options
  - Type: `boolean`
  - Default: `false`
- `$('img').mapster('get_options');`
- `$('img').mapster('get_options', key [, effective ]);`
  - `key`: A single value identifying an area or area group corresponding to a value in [mapKey][cr-mapkey]
    - Type: `string`
    - Required
  - `effective`: When `true`, returns effective rather than assigned options
    - Type: `boolean`
    - Default: `false`

```js
// returns configured options specific to area
$('#somearea').mapster('get_options');
// returns all current effective options for area
$('#somearea').mapster('get_options', true);
// returns configured options for image
$('#someimage').mapster('get_options');
// returns configured options for area with key of TX
$('#someimage').mapster('get_options', 'TX');
// returns all current effective options for area with key of TX
$('#someimage').mapster('get_options', 'TX', true);
```

### highlight

Highlight, clear, or return highlight state for a bound `area`.

This method is used to control or obtain the current highlight state. Setting the highlight does not mimic a mouseover, rather, it only sets the highlight. Events and tooltips will not be activated. Even using these methods, it is not possible to highlight more than one area at a time. If another area is highlighted programatically, any existing highlight will be removed.

Once set this way, the highlight will be removed when any user-event that would normally cause a highlight to be removed occurs (e.g., moving the mouse into any other area), or it is removed programatically.

**Usage:**

- `$('area').mapster('highlight');`
- `$('img').mapster('highlight', [key ]);`
  - `key` A single value identifying an area or area group corresponding to a value in [mapKey][cr-mapkey]
    - Type: `string`
    - Default: `undefined`
- `$('img').mapster('highlight', false);`
  - `false` Remove the current highlight (if any) from the map
    - Type: `boolean`
    - Required - must be the value `false`, otherwise will return the `mapKey` of the current highlighted `area` (if any)

```js
// highlight area
$('#somearea').mapster('highlight');
// returns the mapKey of current highlighted area (if any)
$('#someimage').mapster('highlight');
// highlight area with key of TX
$('#someimage').mapster('highlight', 'TX');
// remove highlight from image
$('#someimage').mapster('highlight', false);
```

### keys

Get the primary [mapKey][cr-mapkey] (or comma-separated list of keys) for an area, set of areas, or key group.

This method allows you to obtain the primary `mapKey` (or keys) associated with another `mapKey`, or one or more areas. If the `all` parameter is `true`, the method returns all keys or groups that include the area.

When using area groups, it is possible for more than one key to be associated with a map area. It's also possible for an area to be highlighted from code as part of a group, but be inaccessible to the end-user. This is because area groups are separate physical entities from the areas defined by their primary key. They can have different options, and are highlighted independently. Note: the way area groups work is not well documented here. In lieu of documentation, please see [this example](https://jsfiddle.net/techfg/ev06tcmr/latest) which describes area groups in detail, and shows how they work through an active demonstration.

There are reasons you may want to be able to access the primary keys that make up an area group directly. Perhaps you want to select a group of areas using the options from a group - but not as a separate group. Perhaps you want to be able to compare the area clicked against a group you have defined to take some action if the area is a member of a certain group. This method provides access to that information.

This method allows working with groups in a variety of ways by providing access to a complete list of primary keys in any group, or all keys which contain a given primary key.

**Usage:**

- `$('area').mapster('keys' [, all ]);`
  - `all`: When `true`, returns ALL keys and not just the primary keys.
    - Type: `boolean`
    - Default: `false`
- `$('img').mapster('keys', key [, all ]);`
  - `key`: A single value identifying an area or area group corresponding to a value in [mapKey][cr-mapkey]
    - Type: `string`
    - Required
  - `all`: When `true`, returns ALL keys and not just the primary keys.
    - Type: `boolean`
    - Default: `false`

```js
// returns primary key for area
$('#somearea').mapster('keys');
// returns comma-separated list of all keys/groups associated to area
$('#somearea').mapster('keys', true);
// returns comma-separated list of all area primary keys associated to key of TX
$('#someimage').mapster('keys', 'TX');
// returns comma-separated list of all keys/groups associated to key of TX
$('#someimage').mapster('keys', 'TX', true);
```

### rebind

Replace existing options and redraw the image map using the new options (does not merge with existing options, performs a full replacement).

This method is similar to [set_options](#set_options), in that its purpose is to change options for an existing bound map. However, unlike `set_options`, `rebind` will do a full replace of options (will not merge) and immediately apply all the new options to the existing map. This means that state will be reset and the image map rendered with the new options. If you pass [area-specific options][cr-areas], these will also be applied (e.g., you could cause new areas to be selected by passing `selected: true` in an area specific option).

`set_options`, in contrast, only changes the options, it does not apply them to any existing data. When using `set_options` the new options only apply to future actions.

**Usage:** `$('img').mapster('rebind' [, options ]);`

- `options`: A JavaScript object containing [ImageMapster options][cr-base]
  - Type: `object`
  - Default: `{}` (all ImageMapster defaults will be applied)

```js
// rebind map replacing all current options
// with ImageMapster defaults overridden by
// the options specified
$('#someimage').mapster('rebind', {
  fillColor: '00FF00',
  fillOpacity: 0.5
  // ...
});
```

### resize

Change the size of the image and map.

This will resize the image map to the dimensions specified. Note that either width or height should be passed, and the other will be calculated in the same aspect ratio as the original image. If you pass both, only the width will be used to calculate the new dimensions: the proportions must remain the same as the original image.

This method will recalculate and re-render the entire image map, so it will work exactly the same under the new sizing scheme. When the image is unbound, the image map will be restored to its original condition.

When using HTML5 canvases, any existing selections, etc. will be preserved during the animation. VML data cannot be resized dynamically, however, so in IE < 9 the selections will be erased, then redrawn when the animation is complete.

**Usage:**

- `$('img').mapster('resize', width [, height ]);`
  - `width`: New width of the image
    - Type: `integer | null | undefined`
    - Required
  - `height`: New height of the image
    - Type: `integer | null | undefined`
    - Default: `undefined`
- `$('img').mapster('resize', width, height [, duration ] [, callback ]);`
  - `width`: New width of the image
    - Type: `integer | null | undefined`
    - Required
  - `height`: New height of the image
    - Type: `integer | null | undefined`
    - Required
  - `duration`: How long the animation will run (milliseconds)
    - Type: `integer`
    - Default: `0`
  - `callback`: A function to invoke when the operation finishes
    - Type: `function()`
    - Default: `undefined`

```js
// set width to 500 (height will be autocalculated
// based on aspect ratio)
$('#someimage').mapster('resize', 500);
// set height to 500 (width will be autocalculated
// based on aspect ratio)
$('#someimage').mapster('resize', null, 500);
// set width to 500 (height will be autocalculated
// based on aspect ratio) using an animiation duration
// of 1000 and invoking the callback once complete
$('#someimage').mapster('resize', 500, null, 1000, function () {
  $('#log').append('resize complete');
});
// set height to 500 (width will be autocalculated
// based on aspect ratio) using an animiation duration
// of 1000 and invoking the callback once complete
$('#someimage').mapster('resize', null, 500, 1000, function () {
  $('#log').append('resize complete');
});
```

### select

Set an area to be [selected][cr-selected]. This is similar to a user click, but will not cause a click event to be fired.

This method will force an area to be become selected regardless of its current [selected][cr-selected] state and any other configuration options (e.g., [staticState][cr-staticstate], [isSelectable][cr-isselectable], [isDeselectable][cr-isdeselectable], etc.).

**Usage:** `$('area').mapster('select');`

```js
// select area
$('#somearea').mapster('select');
```

### set

[Select](#select) or [deselect](#deselect) elements based on truthiness of `selected` parameter. If the area represents a
bound area on an image map, it will be selected or deselected. The method can be called from a bound `area`, or, when providing a value for the `key` parameter that corresponds with a value from [mapKey][cr-mapkey], from a bound `img`.

If the `selected` parameter is omitted (or contains any value other than `true` or `false`) then the state of each area will be toggled.

You can optionally include an object containing rendering options in the `options` parameter. When present, these will override the current [area rendering options][cr-arearenderingoptions] for the `area`.

**Usage:**

- `$('area').mapster('set' [, selected ]);`
  - `selected`: Whether the area should be selected, deselected or toggled
    - Type: `boolean | undefined | null` (if not `true` or `false`, the state will be toggled)
    - Default: `undefined`
- `$('area').mapster('set', selected [, options ]);`
  - `selected`: Whether the area should be selected or deselected
    - Type: `boolean | undefined | null` (if not `true` or `false`, the state will be toggled)
    - Required
  - `options`: Override the currently configured rendering options for [selected][cr-selected] state. Note that this will only override them for this operation, any subsequent changes to `selected` state will use the currently configured options. If you want to permanently change the `selected` state rendering options, use the [set_options](#set_options) method.
    - Type: `object` (see [area rendering options][cr-arearenderingoptions])
    - Default: `undefined`
- `$('img').mapster('set', selected, key [, options ]);`
  - `selected`: Whether the area should be selected or deselected
    - Type: `boolean` (if not `true` or `false`, the state will be toggled)
    - Required
  - `key`: A string, comma-separated string, or array of strings corresponding to the values in [mapKey][cr-mapkey] indicating the areas to select or deselect
    - Type: `string | string[]`
    - Required
  - `options`: Override the currently configured rendering options for [selected][cr-selected] state. Note that this will only override them for this operation, any subsequent changes to `selected` state will use the currently configured options. If you want to permanently change the `selected` state rendering options, use the [set_options](#set_options) method.
    - Type: `object` (see [area rendering options][cr-arearenderingoptions])
    - Default: `undefined`

```js
// toggle the area
$('#somearea').mapster('set');
// select the area
$('#somearea').mapster('set', true);
// deselect the area
$('#somearea').mapster('set', false);
// toggle the area and apply rendering overrides
$('#somearea').mapster('set', null, { fillColor: '00FF00' });
// toggle the area with key 'TX'
$('#someimage').mapster('set', null, 'TX');
// select the area with key 'TX'
$('#someimage').mapster('set', true, 'TX');
// deselect the area with key 'TX'
$('#someimage').mapster('set', false, 'TX');
// toggle the area with key `TX` and apply rendering overrides
$('#someimage').mapster('set', null, 'TX', { fillColor: '00FF00' });
```

### set_options

Change options without redrawing.

The active options are updated for the image map and any area options are merged with existing area options. Unlike [rebind](#rebind), this will not re-draw with the updated options, but only update the state. This may affect future actions, but it will not change any existing state information.

**Usage:** `$('img').mapster('set_options', options);`

- `options`: A JavaScript object containing [ImageMapster options][cr-base]
  - Type: `object`
  - Required

```js
// update (merge) options
$('#someimage').mapster('set_options', {
  fillColor: '00FF00',
  areas: [
    {
      key: 'TX',
      render_highlight: {
        fillOpacity: 0.3
      }
    }
  ]
});
```

### snapshot

Take a "snapshot" of the current selection state, and reset ImageMapster.

This option is similar to unbind with preserveState. After a snapshot, any active selections will still appear as they did at the time of the snapshot, but they are no longer part of the ImageMapster. This is useful for configuring an initial state, or creating complex representations that may not be easily accomplished with area configuration options.

For example, you could bind in image with a specific set of options; programatically select some areas; and take a snapshot; then set new options that cause a different rendering mode. This way you could have certain areas appear differently from the selection highlight, but be "highlighted again" using the new rendering options. Any effects in place at the time of the snapshot essentially become part of the image and are not affected by future operations.

**Usage:** `$('img').mapster('snapshot');`

```js
$('#someimage').mapster('snapshot');
```

### tooltip

Show or hide tooltips.

See the [tooltip options][cr-tooltipoptions] section for information on controlling how tooltips appear and are dismissed.

This method can be used to manipulate tooltips from code. If the global [showToolTip][cr-showtooltip] option is `false`, these methods will still work, so you have the ability to control tooltips bound to areas completely using your own logic, if desired. These methods can also be used to have better control over events needed to close the tooltip (e.g., you could have no tooltip closing event, but add a `close` button to your container that will cause the tooltip to close when clicked).

**Usage:**

- `$('area').mapster('tooltip')`
- `$('img').mapster('tooltip', key)`
  - `key`: A single value identifying an area or area group corresponding to a value in [mapKey][cr-mapkey]
    - Type: `string`
    - Required
- `$('img').mapster('tooltip');`

```js
// activate tooltip bound to the applied area
$('#somearea').mapster('tooltip');
// activate tooltip for area identified by "key"
$('#someimg').mapster('tooltip', 'key');
// remove active tooltip
$('#someimg').mapster('tooltip');
```

### unbind

Removes the ImageMapster binding from an image and restores it to its original state. All visible elements (selections, tooltips) will be removed.

If the optional `preserveState` parameter is `true`, the selection overlay and any active tooltips will be preserved. Tooltips can still be dismissed by a user click, but once unbound, the selection states can no longer be controlled either by the user or programatically. To remove them, the actual DOM elements must be removed.

Notes: When a mapster is first bound, several things happen. A div element is created which wraps the image. A copy is made of the original image, and the original image is set be transparent. This allows creating visible elements for the selections & highlights without interfering with the image map. Additionally, canvas elements are created (for HTML5 browsers), or a VML elements are created for Internet Explorer, to render the effects. Profile information about each bound image map is stored in memory, and finally, event handlers are bound to the image map.

The `unbind` method cleans up these resources: it removes the wrapper, restores the image to its original visibility state, and releases internal resources. When using `preserveState`, the internal resources are cleaned up and event handling is disabled, but HTML elements are not removed. Each element created by ImageMapster is assigned a class of `mapster_el`, which can be used to target them for later removal, though it is not easy to complete this process manually because of the wrapper and styles applied during configuration, which will be left intact when using `preserveState`.

**Usage:** `$('img').mapster('unbind' [, preserveState ]);`

- `preserveState` When `true`, will preserve the selection overlay per the method described above.
  - Type: `boolean`
  - Default: `false`

```js
// unbind the image
$('#someimg').mapster('unbind');
// unbind the image, preserving state
$('#someimg').mapster('unbind', true);
```

[cr-base]: ./configuration-reference.md
[cr-altimage]: ./configuration-reference.md#altimage
[cr-mapkey]: ./configuration-reference.md#mapkey
[cr-onconfigured]: ./configuration-reference.md#onconfigured
[cr-selected]: ./configuration-reference.md#selected
[cr-isselectable]: ./configuration-reference.md#isselectable
[cr-isdeselectable]: ./configuration-reference.md#isdeselectable
[cr-staticstate]: ./configuration-reference.md#staticstate
[cr-arearenderingoptions]: ./configuration-reference.md#area-rendering-options
[cr-areas]: ./configuration-reference.md#areas
[cr-tooltipoptions]: ./configuration-reference.md#area-tooltip-options
[cr-showtooltip]: ./configuration-reference.md#showtooltip
