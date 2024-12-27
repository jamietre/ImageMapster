---
title: Configuration Reference
description: Overview of all the available configuration options.
---

To activate all [image maps](https://en.wikipedia.org/wiki/Image_map) on the page with
the default options, after [installing](../overview//getting-started.md#installation), just add the following to your page:

```html
<script>
  $(function () {
    $('img[usemap]').mapster();
  });
</script>
```

Usually, you'll want to target a specific image by `id`, and maybe define some options for how the areas should
appear when highlighted. You do this by passing an object with options when you bind the image:

```js
$('#myimage').mapster({
  fillColor: 'ff0000',
  fillOpacity: 0.3
});
```

Once bound, in addition to responding to click events, you can manipulate the effects from Javascript. This would
choose all `area` elements that had a class `group1` and cause them to become [selected](#selected), as if they'd
been clicked by the user:

```js
$('area.group1').mapster('set', true);
```

You can also define your own keys to identify areas and group them together. Keys are just a value of an attribute on
each area. You tell ImageMapster the name of this attribute with the [mapKey](#mapkey) option, and then you can identify
areas or groups of areas by key:

```html
<!-- an image map of the U.S.A -->
<img src="..." usemap="#mymap" />
<map name="mymap">
  <area data-key="AZ" href="#" coords="..." />
  <area data-key="AK" href="#" coords="..." />
  <area data-key="AR" href="#" coords="..." />
  <area data-key="AL" href="#" coords="..." />
  <area data-key="CO" href="#" coords="..." />
  ...
</map>

<!-- bind using "data-key" as a mapKey, and select four states -->
<script>
  $('#myimage')
    .mapster({
      mapKey: 'data-key'
    })
    .mapster('set', true, 'AK,AZ,AR,AL');
</script>
```

There are a lot more options you can use to control how things appear so keep reading below and see our [API reference](./api-reference.md) for details on programmatically interacting with your image maps.

## General Options

General options control certain behaviors, general styling and allow for specific configuration to be applied to hotspot areas.

### altImages

**Type:** `object`<br/>
**Default:** `{}`<br/>
**See Also:** [`altImage`](#altimage)

A key/value pair of alternate images that can be applied to an area. This is a convenience option to simplify using alternate images within areas. In order to use one of these images, when specifying the [altImage](#altimage) option provide the value of the `key` in this object rather than a path to an image. Each `value` in this object should be a valid `URL` to the alternate image.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/altimages.html)

```js
// by default, all areas will use img3 for highlight/select
$('#myimage').mapster({
  altImages: {
    img3: '../examples/images/usa_map_720_alt_3.jpg'
  },
  altImage: 'img3'
});

// by default, areas will not use an altImage for highlight/select
$('#myimage').mapster({
  altImages: {
    img2: '../examples/images/usa_map_720_alt_2.jpg',
    img3: '../examples/images/usa_map_720_alt_3.jpg'
  },
  areas: [
    {
      // TX will use img3 for highlight/select
      key: `TX`,
      altImage: 'img3'
    },
    {
      // KS will use img2 for select
      // and img3 for highlight
      key: 'KS',
      render_select: {
        altImage: 'img2'
      },
      render_highlight: {
        altImage: 'img3'
      }
    },
    {
      // CO will use usa_map_720_alt_4.jpg for highlight/select
      key: 'CO',
      altImage: '../examples/images/usa_map_720_alt_4.jpg'
    }
  ]
});
```

### areas

**Type:** `object[]`<br/>
**Default:** `[]`

Define [area specific options](#area-options) which override default options (when a default option exists). Each object in the array must contain a `key` property corresponding with a valid [mapKey](#mapkey) value and any options that should be applied specific to the area.

By default, ImageMapster will automatically create hotspots for every `area` element defined in the `map` element except for `area` elements that do not contain an `href` attribute, and/or contain a `nohref` attribute. You can control how ImageMapster treats `area` elements via the [noHrefIsMask](#nohrefismask) and [isMask](#ismask) options.

You only need to provide `areas` configuration when you want to override the defaults for a particular `area`. For example, if you have 50 areas and want 3 of them to behave differently than the defaults, you only need to provide an `areas` configuration for those 3.

Each object provided in the array specified for this option must adhere to the properties listed in [area options](#area-options).

#### area options

:::note
Some options are only available at the default level while others are only available at an area specific level. If an option is available in one or the other (but not both), it will be identified as follows:

**Default Only** - Not supported in [`areas`](#areas) options.\
**Area Only** - Not supported in `default` options.
:::

- `key` - must correspond with value from [mapKey](#mapkey)
  - **Type:** `string`<br/>
  - **Required**
- Any option from the following unless the option indicates it is **Default Only**
  - [area state options](#area-state-options)
  - [area rendering options](#area-rendering-options)
  - [area tooltip options](#area-tooltip-options)

```js
$('#myimage').mapster({
  fillColor: '00FF00',
  strokeWidth: 2,
  fillOpacity: 0.5,
  areas: [
    {
      key: 'TX', // overrides for TX
      strokeWidth: 5, // highlight & select overrides
      render_highlight: {
        fillColor: 'bf5700' // highlight override
      },
      render_select: {
        fillOpacity: 0.7 // select override
      }
    },
    {
      key: 'WA', // overrides for WA
      fillColor: '4b2e83' // highlight & select overrides
    }
  ]
});
```

### clickNavigate

**Type:** `boolean`<br/>
**Default:** `false`<br/>
**See Also:** [`navigateMode`](#navigatemode), [`onClick`](#onclick)

:::note
When `true` and a url is followed, the `onClick` event will **NOT** fire.

When `false`, navigation can still be performed by returning `true` from `onClick` event.
:::

When `true`, clicking on a link should cause the browser to navigate to the `href` whenever it's not a hash sign (`#`) or empty.

By default, ImageMapster will prevent the default browser behavior in image maps, and `select` areas when they are clicked. If you want to navigate to the url for an area, use this option. When enabled, all areas that have an `href` attribute whose value is not empty or `#` will be followed.

When area grouping is used, if an `href` is present for any area in the `primary group`, the `href` of the first area in the group (in HTML order) will be used as the navigation target. This way you don't need to copy the url for every area in groups, rather, you can include it on just one, and clicking any area will cause the appropraite navigation.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/navigate-simple.html)

```js
$('#myimage').mapster({
  clickToNavigate: true
});
```

### configTimeout

**Type:** `integer`<br/>
**Default:** `10000`

Time in milliseconds to wait for images to load. If the images do not load in the specified period of time, mapster initialization will fail and an error will be thrown.

When first bound, ImageMapster has to wait for the source image and any [altImage](#altimage)/[altImages](#altimages) to load before it can finish binding. This is necessary because otherwise it's not always possible to know the native size of the images. After this period of time, ImageMapster will give up and fail initialization. If you have particularly large pages or images, you may want to increase this to account for long load times.

```js
$('#myimage').mapster({
  configTimeout: 30000
});
```

### mapKey

**Type:** `string`<br/>
**Default:** `''`

The name of an attribute found on `area` HTML elements used to identify it for any future operations and to create groups of areas that function together. When not assigned, all areas are activated as unique hotspots.

If specified, this refers to an attribute on the `area` elements that will be used to group them logically. Any areas containing the same `mapKey` will be considered part of a group, and rendered together when any of these areas is activated. If you don't want this functionality, ensure each key is unique. When `mapKey` is omitted or blank/empty, then each `area` is considered to be independent from the other and no grouping is applied.

When mapKey is present, any `area` HTML elements that are missing this attribute will be excluded from the image map entirely. This is functionally identical to specifying the `nohref` attribute on the `area` (see [areas](#areas), [noHrefIsMask](#nohrefismask) and [isMask](#ismask) for more details on how masks work).

ImageMapster will work with any attribute you identify as a key. If you wish to maintain HTML compliance, it's recommeded that you use attribute names starting with `data-`, for example, `data-statename`. Any such names are legal for the HTML5 document type. If you are using older document types, the class attribute is part of the HTML spec for area and will not cause any visual effects, so this is also a good choice. It is not recommended to use `id`, since the values of this attribute must be unique. `title` and `alt` also will cause possibly undesired side effects (e.g., they may contain a comma (`,`) which ImageMapster uses as a delimiter for area group keys).

You can specify more than one value in the `mapKey` attribute, separated by commas (`,`). This will cause an `area` to be a member of more than one group. The `area` may have different options in the context of each group. When the area is physically moused over, the **first key** listed will identify the group that's effective for that action.

```js
$('#myimage').mapster({
  mapKey: 'data-key'
});
```

### mouseoutDelay

**Type:** `integer`<br/>
**Default:** `0`

Time in milliseconds before removing highlight after mouse exits an area. Also applies to `area-mouseout` event of [toolTipClose](#tooltipclose).

Normally, when the user's mouse pointer exits an area, the highlight effect is removed immediately. This behavior can be changed with this option. Setting it to a positive number causes a delay of `n` milliseconds before the effect is removed. Setting to `-1` causes the effect to remain active until another hotspot is entered (e.g., it will only be removed when superceded by a different area being highlighted).

When using `mouseoutDelay`, the `onMouseover` event will still be fired at the time the user's mouse pointer leaves the area. However, the `onStateChange` event will be delayed until the highlight is actually removed.

Whether or not you are using `mouseoutDelay`, only one area can be highlighted at a time. That is, whenever the mouse pointer moves onto a new active area, any previously highlighted area will become un-highlighted, regardless of any delay in effect. Hovering over a new area will always supercede any delay and cause the new area (and only the new area) to be highlighted at that time. So, for dense image maps where most areas adjoin one another, this option may not have much effect within the boundaries of the image map. Rather, it is intended to help keep the higlights active for image maps that are sparse, or have very small areas.

```js
$('#myimage').mapster({
  mouseoutDelay: 1000
});
```

### navigateMode

**Type:** `'location' | 'open'`<br/>
**Default:** `'location'`<br/>
**See Also:** [`clickNavigate`](#clicknavigate), [`onClick`](#onclick)

Controls how navigation occurs when an `area` is clicked. The `destination` and the method to `navigate` are determined by the `navigation mode` specified. When the resolved `destination` is empty or `#`, no navigation occurs regardless of `navigationMode`.

- `location` - All navigation is performed by updating `window.location.href` to the `destination` determined as follows:
  :::caution
  As of [version 1.5.0-beta.0](https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md#version-150-beta0---20210126), `location` has been deprecated and will be [removed in the next major release](https://github.com/jamietre/ImageMapster/issues/355).
  :::

  - If `clickNavigate=true`, `href` for the area is the `destination` if not empty or `#`
  - If `clickNavigate=false` and return value of `onClick=true`, the `href` for the area group is the `destination` if not empty or `#`
  - If `clickNavigate=false` and return value of `onClick=false`, no update/navigation occurs.

- `open` - All navigation is performed using `window.open` to the `destination` determined as follows:

  - If `clickNavigate=true`, `href` for the area if not empty or `#` otherwise `href` for the area group if not empty or `#`
  - If `clickNavigate=false` and the return value of `onClick=true`, `href` for the area if not empty or `#` otherwise `href` for the area group if not empty or `#`
  - If `clickNavigate=false` and the return value of `onClick=false`, no update/navigation occurs.

  Provides the following benefits over `location` mode:

  - Allows for support of hyperlinks as well as `mailto`, etc.
  - If specified, the `target` property of area element will be retrieved and passed to `window.open` call. If no `target` is provided, a default of `_self` is used.
  - The `href` and `target` value will always look first at the specific `area` element clicked and if no `href` is specified and if the `area` is part of an area group, will use the area group default which is the first `area` element that ImageMapster found for the `primaryKey` identified via `mapKey`.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/navigate-simple.html) - Basic example of `location` and `open` modes<br/>
[Open Mode Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/navigate-full.html) - Detailed example of `open` mode

```js
$('#myimage').mapster({
  navigateMode: 'open'
});
```

### noHrefIsMask

**Type**: `boolean`<br/>
**Default:** `true`<br/>
**See Also:** [`isMask`](#ismask)

Treat `area` elements that do not contain `href` attributes and/or contain a `nohref` attribute as masks; if they fall within another area, they will be excluded from the group.

Set this to `false` to disable automatic masking of these areas. You can control them explicitly by creating independent groups for areas you wish to mask and assigning the [isMask](#ismask) area-specific option when using this option.

There are some things to be aware of when using `nohref` and masking:

- You must put the area that includes the `nohref` attribute before other areas that overlap it, or it will be ignored.
- You should also explicitly omit the `href` attribute when using `nohref`.
- Due to limitations in rendering with VML (e.g., Internet Explorer 6-8), it is not possible to create a true mask, which would allow the underlying image to show through the masked area. Instead, the "masked" areas are rendered on top of the highlighted area in a different color. This can be specified for each area (see the [fillColorMask](#fillcolormask)) to create the best possible effect.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/shapes.html)

```js
$('#myimage').mapster({
  noHrefIsMask: false,
  areas: [
    {
      // outer circle should be a mask
      key: 'outer-circle-mask',
      isMask: true
    }
  ]
});
```

### wrapClass

**Type:** `string | true`<br/>
**Default:** `null`

Add class(es) to the wrapper created around the image, or copy classes from the image if `true`.

```js
// add the class im-image to the class of the wrapper
$('#myimage').mapster({
  wrapClass: 'im-image'
});

// copy all classes on the img element to the wrapper
$('#myimage').mapster({
  wrapClass: true
});
```

### wrapCss

**Type:** `object`<br/>
**Default**: `null`

Add CSS to the wrapper created around the image. If provided, the [PlainObject](https://api.jquery.com/Types/#PlainObject) must contain valid CSS properties following the requirements in the [jQuery .css(properties)](https://api.jquery.com/css/#css-properties) api.

```js
$('#myimage').mapster({
  wrapCss: {
    border: '1px solid green',
    'margin-top': '5rem',
    marginBottom: '10rem'
  }
});
```

## Area State Options

Area state options control how mapster will maintain each areas state (e.g., highlight, select) based on events initiated by the user (e.g., `mouseover`) or programmatically.

### highlight

**Type:** `boolean`<br/>
**Default:** `true`

Highlight areas on mouseover.

```js
$('#myimage').mapster({
  highlight: false,
  areas: [
    // area TX allows highlight
    { key: 'TX', highlight: true }
  ]
});
```

### isDeselectable

**Type:** `boolean`<br/>
**Default:** `true`

Allow an area to be click-deselected. When `false`, an area can be selected but not unselected by clicking.

Normally `true`, this option can be used to prevent users from unselecting items once they have been selected. When combined with [singleSelect](#singleselect), the effect is that one and only one option can be selected at any given time. Users cannot deselect the active option. This provides a menu-like functionality. It is possible for zero items to be selected if this is the default state (or the only selected item is deselected programatically).

```js
$('#myimage').mapster({
  isDeselectable: false,
  areas: [
    // area TX is isDeselectable
    { key: 'TX', isDeselectable: true }
  ]
});
```

### isSelectable

**Type:** `boolean`<br/>
**Default:** `true`

Allow an area to be click-selected. When `false`, an area will still highlight but cannot be selected via clicking.

When `true`, the image map will function like a multiple-select menu. Users can click any `area` to select it. When applied to the entire map, it determines whether or not the click-selection functionality is enabled. When applied to an `area`, it determines whether that individual `area` (or area group) can be selected. By default, the map and all areas are selectable.

```js
$('#myimage').mapster({
  isSelectable: false,
  areas: [
    // area TX is isSelectable
    { key: 'TX', isSelectable: true }
  ]
});
```

### selected

**Type:** `boolean`<br/>
**Default:** `false`

Set an area to be initially selected.

```js
$('#myimage').mapster({
  areas: [
    // area TX is initially selected
    { key: 'TX', selected: true }
  ]
});
```

### singleSelect

**Type:** `boolean`<br/>
**Default:** `false`

:::note
Not supported in [`areas`](#areas) options.
:::

Only one area can be selected at a time.

When `true`, only one or zero areas can be selected at any given time. If an area is selected and the user selects another area, the previously selected area will become deselected. Unlike [staticState](#staticstate), this property cannot be overridden by setting areas programatically, only one (or zero) areas can ever be selected when this option is `true`.

```js
$('#myimage').mapster({
  // only allow one area to be selected at a time
  singleSelect: true
});
```

### staticState

**Type:** `boolean`<br/>
**Default:** `false`

Set an area or the entire map to be permanently selected or permanently deselected.

When `true` or `false`, the map or area to which this option applies will be permanently selected or deselected. Typically this is more useful applied to individual areas that you want to exclude from being selected.

`staticState` forces an area to be always selected or deselected. If set, this will supercede [isSelectable](#isselectable). Something with a `staticState` will always be in that state and it cannot be changed by the user. Note that when setting states programatically, this option will not be honored; it only affects user interaction.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/staticstate.html)

```js
$('#myimage').mapster({
  areas: [
    // area TX is always selected
    { key: 'TX', staticState: true }
  ]
});
```

## Area Rendering Options

Rendering options control the way areas are displayed during highlight and select. In addition to default option values, options can be set individually
for the highlight or select effect, by including them in special option object [render_select](#render_select) and [render_highlight](#render_highlight).
That is, if you put one of these options inside an option called `render_highlight`, it will only apply to the highlight effect. Both `render_select` and
`render_highlight` can be placed with [areas](#areas) option as well.

For example, the following code will cause the `stroke` effect for both highlights and selections to be applied to
all areas using the default stroke width for selections and a stroke width of `2` for highlights. For the specific area
with key `somearea`, the stroke is disabled, and for selections only, the fill opacity is 1 for that area. Finally, for
another area with key `someotherarea`, the fill effect is disabled for both highlight and select.

```js
$('#myimage').mapster({
  stroke: true,
  render_highlight: {
    strokeWidth: 2
  },
  areas: [
    {
      key: 'somearea',
      stroke: false,
      render_select: {
        fillOpacity: 1
      }
    },
    {
      key: 'someotherarea',
      fill: false
    }
  ]
});
```

### altImage

**Type:** `string`<br/>
**Default:** `null`</br>
**See Also:** [`altImages`](#altimages)

Use an alternate image of the same size as the image map as the source for highlight or select effects. Each `string` in the array should be either be a `key` present in [altImages](#altimages) or a valid `URL` to an alternate image.

When specified, the mapster will highlight/select areas using the image data obtained from the same area in an alternate image, instead of using a fill effect to highlight/select the area. This feature is currently available in browsers with HTML5 canvas support. In practical terms, this means it will work in all commonly used browsers except IE 8 or lower.

If this feature is enabled when an unsupported browser is used, it will fall back to the normal highlight method.

The fill, stroke and opacity effects can be specified independently from those used for the normal higlight/select effect. This ensures that when your page is viewed with a non-supported browser, you can still control the rendering as would be appropriate for a normal fill/stroke effect, which may be different from when you're using an alternate image.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/altimages.html)

```js
// by default, all areas will use usa_map_720_alt_4.jpg for highlight/select
$('#myimage').mapster({
  altImage: '../examples/images/usa_map_720_alt_4.jpg'
});

// by default, all areas will use img3 for highlight/select
$('#myimage').mapster({
  altImages: {
    img3: '../examples/images/usa_map_720_alt_3.jpg'
  },
  altImage: 'img3'
});

// by default, areas will not use an altImage for highlight/select
$('#myimage').mapster({
  altImages: {
    img2: '../examples/images/usa_map_720_alt_2.jpg',
    img3: '../examples/images/usa_map_720_alt_3.jpg'
  },
  areas: [
    {
      // TX will use img3 for highlight/select
      key: `TX`,
      altImage: 'img3'
    },
    {
      // KS will use img2 for select
      // and img3 for highlight
      key: 'KS',
      render_select: {
        altImage: 'img2'
      },
      render_highlight: {
        altImage: 'img3'
      }
    },
    {
      // CO will use usa_map_720_alt_4.jpg for highlight/select
      key: 'CO',
      altImage: '../examples/images/usa_map_720_alt_4.jpg'
    }
  ]
});
```

### altImageOpacity

**Type:** `number`<br/>
**Default:** `0.7`

The opacity of the fill for the alternate image. This is a number from 0 to 1.

```js
$('#myimage').mapster({
  altImages: {
    img2: '../examples/images/usa_map_720_alt_2.jpg',
    img3: '../examples/images/usa_map_720_alt_3.jpg'
  },
  altImage: 'img2',
  altImageOpacity: 0.5,
  areas: [
    {
      // TX uses img3 with 0.3 opacity for highlight/select
      key: `TX`,
      altImage: 'img3',
      altImageOpacity: 0.3
    }
  ]
});
```

### fade

**Type:** `boolean`<br/>
**Default:** `true`

:::note
Not available in [`render_select`](#render_select)
:::

Use a fade effect when highlighting areas on mouseover (does not apply to select).

```js
$('#myimage').mapster({
  // any overrides to fade option must be
  // configured in render_highlight option
  render_highlight: {
    fade: true
  }
});
```

### fadeDuration

**Type:** `integer`<br/>
**Default:** `150`

Time in milliseconds of the fade-in effect.

```js
$('#myimage').mapster({
  fadeDuration: 500
});
```

### fill

Areas should be flood-filled when highlighted/selected.

**Type:** `boolean`<br/>
**Default:** `true`

```js
$('#myimage').mapster({
  fill: false,
  render_select: {
    // only fill on select
    fill: true
  }
});
```

### fillColor

**Type:** `string`<br/>
**Default:** `000000`

The color used for flood-fill. Value should be the color hex code without the hash (`#`).

```js
$('#myimage').mapster({
  fillColor: '00FF00'
});
```

### fillColorMask

**Type:** `string`<br/>
**Default:** `FFFFFF`<br/>
**See Also:** [`noHrefIsMask`](#nohrefismask), [`isMask`](#ismask)

:::note
Only applies when `VML` elements are used (e.g., IE 6-8)
:::

The color used for flood-fill on `masked` areas. Value should be the color hex code without the hash (`#`).

```js
$('#myimage').mapster({
  fillColorMask: '00FF00'
});
```

### fillOpacity

**Type:** `number`<br/>
**Default:** `0.7`

The opacity of the fill. This is a number from 0 to 1.

```js
$('#myimage').mapster({
  fillOpacity: 0.3
});
```

### includeKeys

**Type:** `string`<br/>
**Default:** `'`

:::note
Not supported in `default` options.
:::

A comma-separated list of other areas, identified by their [mapKey](#mapkey), that should be activated whenever this area is activated.

This is an area-specific option that allows you to create supergroups. A supergroup is a collection of groups that will all be highlighted simultaneously, but only when the area that defines the supergroup is moused over or activated through code.

When the area for which this option has been set is activated, all the areas specified in the `includeKeys` list will also be rendered. This is a one-way relationship. Defining a supergroup in an area causes all the other groups to be highlighted, but not the other way around.

A typical use of this is to define areas that you want to be highlighted when the mouse enters some specific area, but that you do not want to be highlighted on their own if the target area is moused over. This could be a hidden menu, for example: you want the menu to display when the hotspot is moused over, but when it's hidden, mousing over the menu area itself should have no effect.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/includekeys.html)

```js
$('#myimage').mapster({
  // NC & SC are a group and will be
  // highlighted/selected together
  areas: [
    {
      key: 'NC',
      includeKeys: 'SC'
    },
    {
      key: 'SC',
      includeKeys: 'NC'
    }
  ]
});
```

### isMask

**Type:** `boolean`<br/>
**Default:** `false`<br/>
**See Also:** [`noHrefIsMask`](#nohrefismask)

:::note
Not supported in `default` options.
:::

Identifies this area as a mask; that is, instead of being rendered, it will be exluded from a surrounding area.

Normally, every area in an image map is an active area, and would be highlighted when moused over. The `isMask` option allows you to identify an area as being a mask. When a mask is part of an area group, the masked area will be specifically excluded from the rendering of a highlight or selected state.

This is usually used in conjunction, or instead of, the `nohref` attribute of the `area` tag. When `nohref` is specified on an area tag, that area is specifically excluded from the hotspot of any area that encompasses it. It will not respond to mouse events, and will not be highlighted. This can be used to create "holes" in hotspots. By default, ImageMapster will treat any area with the `nohref` attribute or that does not include an `href` attribute as masks, the same as if this option had been applied.

Sometimes you won't be able to use `nohref` to identify something as a mask, for example, if you intend to re-use an area as both a mask and an independent hotspot. This would be typical if you wanted a selectable area that was completely included within another selectable area, but functioned independently, such as concentric circles. In this case, you would need to identify the inner circle as both a mask, and a hotspot. The `nohref` attribute would make it not act as a hotspot, and only function as a mask. You couldn't also select the inner area. You can solve this problem by including the inner circle in two different groups - one group which is a mask for the main area, and another which is an independent selectable area. You can specify different options for each group, so even though it's just one area, it can function as
two completely independent ones.

For example, the markup for two concentric circles, both of which are selectable, might look like:

```html
<area shape="circle" group="outer-circle" coords="100,81,59" href="#" />
<area
  shape="circle"
  group="inner-circle,outer-circle-mask"
  coords="101,81,36"
  href="#"
/>
```

```js
$('#myimage').mapster({
  areas: [
    {
      key: 'outer-circle',
      includeKeys: 'outer-circle-mask' // causes the mask to be included when this area is highlighted
    },
    {
      key: 'outer-circle-mask',
      isMask: true // causes the inner circle to be treated as a mask, but only in the context of the "outer-circle-mask" group
    }
    // no special options needed for "inner-circle" - we want it to be treated normally on mouseover
  ]
});
```

### render_select

**Type:** `object`<br/>
**Default:** `undefined`

:::note
Any [rendering option](#resize-options) can be specified except [render_highlight](#render_highlight).
:::

A key/value pair of [rendering options](#resize-options) to override default rendering options when area is selected.

```js
$('#myimage').mapster({
  // apply defaults
  strokeWidth: 5,
  fillColor: 'FFFFFF',
  render_select: {
    // override for select
    strokeWidth: 2,
    fillColor: '00FF00'
  }
});
```

### render_highlight

**Type:** `object`<br/>
**Default:** `undefined`

:::note
Any [rendering option](#resize-options) can be specified except [render_select](#render_select).
:::

A key/value pair of [rendering options](#resize-options) to override default rendering options when area is highlighted.

```js
$('#myimage').mapster({
  // apply defaults
  strokeWidth: 5,
  fillColor: 'FFFFFF',
  render_highlight: {
    // override for highlight
    strokeWidth: 2,
    fillColor: '00FF00'
  }
});
```

### stroke

**Type:** `boolean`<br/>
**Default:** `false`

Areas should be outlined when highlighted/selected.

```js
$('#myimage').mapster({
  stroke: true
});
```

### strokeColor

**Type:** `string`<br/>
**Default:** `FF0000`

The color used for stroke. Value should be the color hex code without the hash (`#`).

```js
$('#myimage').mapster({
  strokeColor: '00FF00'
});
```

### strokeOpacity

**Type:** `number`<br/>
**Default:** `1.0`

The opacity of the stroke. This is a number from 0 to 1.

```js
$('#myimage').mapster({
  strokeOpacity: 0.5
});
```

### strokeWidth

**Type:** `number`<br/>
**Default:** `1.0`

The width of the stroke.

```js
$('#myimage').mapster({
  strokeWidth: 3
});
```

## Area Tooltip Options

ImageMapster will display a tooltip for an area/area group.

### showToolTip

**Type:** `boolean`<br/>
**Default:** `false`

:::note
Not supported in [`areas`](#areas) options.
:::

Enable tooltips for the image map. When `true`, mapster will look for a property called [toolTip](#tooltip) in the [areas](#areas) option for the area falling back to the defaults. If present and `truthy` (e.g., not null/empty), a tooltip dialog will be shown on mouseover for that area. It will automatically be closed according to the behavior specified by [toolTipClose](#tooltipclose). This option does not apply at the area level, but rather controls the display of tooltips for the entire map.

```js
$('#myimage').mapster({
  showToolTip: true,
  toolTip: function (data) {
    return $(data.target).attr('data-name');
  }
});
```

### toolTip

**Type:** `html | jQueryObject | HTMLElement | function({ key: string, target: HTMLAreaElement | HTMLElement[] })`<br/>
**Default:** `null`

When `truthy` (e.g., not null/empty) and [showToolTip](#showtooltip) is `true`, a [toolTipContainer](#tooltipcontainer) will be created and the content specified in this property inserted into it, either as inner text (if only text is specified) or as an element if HTML, jQuery or HTMLElement is provided. In order to pass anything other than `plain text` using this option you must provide valid `HTML` as a string, a valid [jQueryObject](https://api.jquery.com/Types/#jQuery) or `HTMLElement`. Any string will be treated as plain text (and special characters rendered correctly).

When specifying a function, the `data` parameter will contain:

- `key`: The [mapKey](#mapkey) of the area associated to the tooltip. If the tooltip was invoked programmatically on an HTMLElement not associated with the map, the value will be `null`.
- `target`: An [HTMLAreaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement) if tooltip was triggered by mouseover or an array of [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) if the tooltip was programmatically invoked. When programmatically invoked, the array of HTMLElements will contain all HTMLElements associated with the `key` that was specified in [tooltip](./api-reference.md#tooltip) API call.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/tooltips.html)

```js
$('#myimage').mapster({
  showToolTip: true,
  toolTip: function (data) {
    // use the data attribute name as the default tooltip for all areas
    // returning a string (plain text) value
    return $(data.target).data('name');
  },
  areas: [
    {
      // override the default for Texas using a static string (plain text)
      key: 'TX',
      toolTip: 'Texas has a custom toolTip'
    },
    {
      // override using a jQuery object and apply a style
      key: 'WA',
      toolTip: $('<div style="color: blue;">Washington uses jQuery</div>')
    }
  ]
});
```

### toolTipClose

**Type:** `string[]`<br/>
**Default:** `['area-mouseout', 'image-mouseout', 'generic-mouseout']`

Specify the behavior that causes a toolTip to close.

This option should be passed an array of strings that define the events that cause active tooltips to close. The array can include one or more of the following strings or be empty if the tooltip should not close (e.g., you control it programmatically).

- `area-mouseout` - tooltips close when the mouse pointer leaves the area that activated it. This is the default.
- `area-click` - tooltips close when another area (or the same one) is clicked
- `generic-mouseout` - tooltips on generic HTML elements close when mouse pointer leaves the element
- `generic-click` - tooltips on generic HTML elements close when element is clicked-
- `image-click` - tooltips close when image is clicked
- `image-mouseout` - tooltips close when the mouse pointer leaves the image itself.
- `tooltip-click` - tooltips close when the tooltip itself is clicked anywhere

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/tooltips.html)

```js
$('#myimage').mapster({
  showToolTip: true,
  // only close when mouse leaves the image
  toolTipClose: ['image-mouseout']
});
```

### toolTipContainer

**Type:** `html | jQueryObject | HTMLElement`<br/>
**Default:** `'<div style="border: 2px solid black; background: #EEEEEE; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353;-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px;'border-radius: 6px 6px 6px 6px; opacity: 0.9;"></div>'`

:::note
Not supported in [`areas`](#areas) options.
:::

HTML describing the popup that will be created to wrap tooltips. A `div` with some simple styling is included as the default tooltip container, however it can be replaced using this option. When tooltips are rendered, the code attempts to determine the best place for it. It will try to position it in near the top-left part of the area, and continue to try other corners in order to render it within the confines of the container where the image map resides. If it can't be placed within the image, it will be placed in the lower-right corner and extend outside the image.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/usa.html)

```js
$('#myimage').mapster({
  showToolTip: true,
  toolTipContainer:
    '<div style="padding: 10px; background-color: green; color: orange;"></div>'
});
```

### toolTipFade

**Type:** `boolean`<br/>
**Default:** `true`

:::note
Not supported in [`areas`](#areas) options.
:::

Use a fade effect when displaying tooltips.

```js
$('#myimage').mapster({
  toolTipFade: false
});
```

## Resize Options

Resize options influence how and when maps are resized. By default, ImageMapster will not automatically resize images, however as of [version 1.5.0](https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md#version-150---20210129), support for automatic resizing was added. Whether or not you elect to enable automatic resize support, you can always use the [resize API](./api-reference.md#resize) to control the size of the image map.

### autoResize

**Type:** `boolean`<br/>
**Default:** `false`<br/>
**See Also:** [`enableAutoResizeSupport`](#enableautoresizesupport)

:::note
You must enable `enableAutoResizeSupport` for `autoResize` to have an effect.
:::

Automatically resize image maps when the image is resized (e.g., browser window is resized).

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/autoresize.html)

```js
$('#myimage').mapster({
  enableAutoResizeSupport: true,
  autoResize: true
});
```

### autoResizeDelay

**Type:** `integer`<br/>
**Default:** `0`

Time in milliseconds delay resizing the images.

```js
$('#myimage').mapster({
  enableAutoResizeSupport: true,
  autoResize: true,
  autoResizeDelay: 150
});
```

### autoResizeDuration

**Type:** `integer`<br/>
**Default:** `0`

Time in milliseconds for the resize animation.

```js
$('#myimage').mapster({
  enableAutoResizeSupport: true,
  autoResize: true,
  autoResizeDelay: 150
});
```

### enableAutoResizeSupport

**Type:** `boolean`<br/>
**Default:** `false`<br/>
**See Also:** [`autoResize`](#autoresize)

:::caution
`enableAutoResizeSupport` was added in [version 1.5.0](https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md#version-150---20210129) to allow for adding automatic resize support while remaining backwards compatibile. It is a deprecated option and will be [removed in the next major release](https://github.com/jamietre/ImageMapster/issues/361).

If enabled, you must also enable `autoResize` if you want automatic resizing on your image maps.
:::

Controls whether or not ImageMapster supports automatic resizing.

```js
$('#myimage').mapster({
  enableAutoResizeSupport: true,
  autoResize: true
});
```

### scaleMap

**Type:** `boolean`<br/>
**Default:** `true`<br/>
**See Also:** [`scaleMapBounds`](#scalemapbounds)

Automatically scale image maps to the current display size of the image.

When you render an image, you can optionally define a size through CSS or using the `height` and `width` attributes. If omitted, the image will be displayed in its native size. If included, browsers will automatically resize the image to display in the dimensions you have provided.

Starting with [version 1.2.0](https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md#version-12), ImageMapster will automatically recalculate all area data to match the effective size of the image. This means that you can set the size of your image to anything you want and ImageMapster will work with no changes at all needed to the "area" data.

If this behavior is not desired for some reason, this can be disabled by setting this option to `false`.

```js
$('#myimage').mapster({
  scaleMap: false
});
```

### scaleMapBounds

**Type:** `false | { below: number, above: number }`<br/>
**Default:** `{ below: 0.98, above: 1.02 }`<br/>
**See Also:** [`scaleMap`](#scalemap)

The boundary to restrict scaling when [scaleMap](#scalemap) is enabled.

When an image map is resized, it's map area coordinates are scaled to correspond with the displayed image size.

When the percentage of the displayed image size relative to the natural image size is between `below` and `after` (not inclusive), the map area coordinates will be scaled based on 100% of the natural image size. When the percentage is outside of this boundary (inclusive), map area coordinates will be scaled based on the displayed image size.

By default, scaling will occur when the displayed image size is 98% (or less) or 102% (or more) of its natural image size.

Setting this value to `false` will scale the map areas based on displayed image size without any restrictions.

```js
$('#myimage').mapster({
  // scale down to any size but restrict scaling up to 105% or greater
  scaleMapBounds: { below: 1, above: 1.05 }
});
```

## Bound List Options

ImageMapster supports assocating an image map to an external list in order to simplyfing synchronization of the map and the list. This allows for things such as selecting an item in a list and having the corresponding area in the image map become selected. You can provide a static collection of list items via the [boundList](#boundlist) option or generate the list items dynamically using the data provided in the [onGetList](#ongetlist) callback which supplies the list of all `area` elements ImageMapster found for the image map.

### boundList

**Type:** `jQueryObject`<br/>
**Default:** `null`<br/>
**See Also:** [`onGetList`](#ongetlist)

A [jQueryObject](https://api.jquery.com/Types/#jQuery) containing a collection of elements bound to the image map that will be updated when areas are selected or deselected.

`boundList` can be a collection of any type of element(s). To be bound to the map, they must contain an attribute whose name is identified by the option [listKey](#listkey), and whose value matches the value in an area tag's [mapKey](#mapkey) attribute. If more than one element in the list has the same value, the action will affect all matching elements.

[JSFiddle Example](https://jsfiddle.net/techfg/md24vcjh/latest)

```js
$('#myimage').mapster({
  boundList: $('#my-list').find('li')
});
```

### listKey

**Type:** `string`<br/>
**Default:** `'value'`

An attribute found on elements in the `boundList` (or the list returned in `onGetList`) that corresponds to the value of the `mapKey` attributes.

This is used to synchronize the actions on the image map with the actions on a `boundList`. Each value should match a value from the corresponding image map `mapKey` attribute. Any item in the `boundList` with missing or mis-matched data will be ignored.

```js
$('#myimage').mapster({
  listKey: 'data-state'
});
```

### listSelectedAttribute

**Type:** `string`<br/>
**Default:** `'selected'`

An element [property](https://api.jquery.com/prop/) that will be updated with a `boolean` value when an area is selected or deselected.

If `boundList` is present (or provided via `onGetList`), when a map area is selected, will update this property on the list element that matches that area based on their respective keys.

```js
$('#myimage').mapster({
  listSelectedAttribute: 'checked'
});
```

### listSelectedClass

**Type:** `string`<br/>
**Default:** `null`

A className (one or more space-separated classes) to add or remove when an area is selected or deselected.

If a `boundList` is present (or provided via `onGetList`), when a map area is selected, this class is added or removed from the corresponding list element. This can be used to style the elements and/or easily create any kind of associated action when areas on the map are changed.

```js
$('#myimage').mapster({
  listSelectedClass: 'isselected'
});
```

### mapValue

**Type:** `string`<br/>
**Default:** `''`

:::note
This option is applicable only when using `onGetList`.
:::

The name of an attribute found on `area` HTML elements used to identify it for any future operations and to create groups of areas that function together.

When set, the data provided to `onGetList` callback will include the value of this attribute for each group. This can be used to simplify building a list with associated information, without having to match against another resource. It also ties this information to the image map itself. It is not required to use this option when using `onGetList`.

For example, you could set `mapValue: 'data-statename'` to an image map of the United States, and add an attribute to your areas that provided the full name of each state (e.g., `data-statename="Alaska"`). The text `Alaska` would be included in the `onGetList` callback, and so you could use it to construct an external list of states.

If there are grouped areas (areas with the same key), then the value from the first area found with data in this attribute will be used.

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/boundlist.html)

```js
$('#myimage').mapster({
  mapValue: 'data-description'
});
```

### sortList

**Type:** `boolean | 'asc' | 'desc'`<br/>
**Default:** `false`

:::note
This option is applicable only when using `onGetList`.
:::

When `truthy`, sort the data passed to [onGetList](#ongetlist) by the value corresponding to [mapValue](#mapvalue).

Data will be sorted by the area value from `mapValue` in ascending order unless the `desc` is specified for `sortList` in which case it will be sorted in descending order.

```js
$('#myimage').mapster({
  sortList: 'desc'
});
```

## Event Options

The following are `events` or callbacks - these options can be assigned functions to take various actions when the event occurs.

### onAutoResize

**Type:** `function()`<br/>
**Default:** `null`<br/>
**See Also:** [`autoResize`](#autoresize)

Callback after the image map has been automatically resized.

```js
$('#myimage').mapster({
  enableAutoResizeSupport: true,
  autoResize: true,
  onAutoResize: function () {
    // ...
  }
});
```

### onClick

**Type:** `function(data: { e: JQueryEventObject, list_target: JQueryObject, key: string, selected: boolean })`<br/>
**Default:** `null`<br/>
**See Also:** [`clickNavigate`](#clicknavigate), [`navigateMode`](#navigatemode)

Callback when a hotspot `area` is clicked. Return `false` to cancel default select action, or `true` to navigate to the `href`.

This event occurs when the usual click event happens and includes data from the mapster about the area. It can be used to perform additional actions on a click without binding another event and having to obtain information manually.

```js
$('#myimage').mapster({
  onClick: function (data) {
    var $me = $(this), // HTMLAreaElement element clicked
      e = data.e, // jQueryEventObject - see https://api.jquery.com/category/events/event-object/
      item = data.list_target, // JQueryObject from boundList (if applicable)
      key = data.key, // mapKey for this area
      selected = data.selected; // true or false based on current area state

    // ...
  }
});
```

### onConfigured

**Type:** `function(success: boolean)`<br/>
**Default:** `null`

Callback when the mapster has finished initialization.

When control execution continues after a first-time bind operation, the mapster is not guaranteed to be configured, because images are loaded asynchronously by web browsers. If a mapster is bound to an image that is not yet loaded, it will continue to check for completion every 50 milliseconds. This event will be fired when it is eventually successful or the length of time specified by [configTimeout](#configtimeout) is exceeded (default of ten seconds) at which point an error will be thrown.

Note that use of the [altImage](#altimage)/[altImages](#altimages) options will increase the amount of time required to complete initialization because the alternate image is loaded by the client at configure time to ensure it is available immediately when needed.

```js
$('#myimage').mapster({
  onConfigured: function (success) {
    var $me = $(this); // HTMLImageElement of the bound image

    // success will always be true because ImageMapster will
    // throw an error if configuration fails and/or
    // configTimeout is exceeded
  }
});
```

### onGetList

**Type:** `function(data: AreaData[])`<br/>
**Default:** `null`<br/>
**See Also:** [`Bound List Options`](#bound-list-options)

Callback during mapster initialization that provides summary data about the image map and expects a jQueryObject containing the corresponding html elements in the external list.

This callback allows you to dynamically provide a [boundList](#boundlist) based on summary data from the image map itself, rather than providing the list up front. The event parameter `data` contains an array of AreaData objects for each `area` that mapster found in the \`map with the following structure:

```js
var data = {
  key: `string`, // primary mapKey for this area or area group
  value: `string`, // mapValue for this area or group
  options: `object`, // area specific options defined for this group
  areas: `function()` // function that will return an array of MapArea objects that make up this group
};
```

The client should return a `jQueryObject` containing all the elements that make up the bound list, the same as if it was assigned manually via [boundList](#boundlist).

[Live Example](https://html-preview.github.io/?url=https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/boundlist.html)

```js
$('#myimage').mapster({
  onGetList: function (data) {
    var $me = $(this), // HTMLImageElement of the bound image,
      items = data, // array of AreaData objects
      listItems = items.map(function (item) {
        return buildListItem(item.key, item.value);
      });

    // return only the input elements
    return $('#my-list').empty().append(listItems).find('input');
  }
});
```

### onHideToolTip

**Type:** `function()`<br/>
**Default:** `null`

Callback when a tooltip is closed.

```js
$('#myimage').mapster({
  onHideToolTip: function () {
    // ...
  }
});
```

### onMouseout

**Type:** `function(data: { e: JQueryEventObject, options: object, key: string, selected: boolean })`<br/>
**Default:** `null`

Callback when mouse pointer leaves a bound area.

```js
$('#myimage').mapster({
  onMouseout: function (data) {
    var $me = $(this), // HTMLAreaElement element clicked
      e = data.e, // jQueryEventObject - see https://api.jquery.com/category/events/event-object/
      options = data.options, // area specific options defined for this area/area group
      key = data.key, // mapKey for this area
      selected = data.selected; // true or false based on current area state

    // ...
  }
});
```

### onMouseover

**Type:** `function(data: { e: JQueryEventObject, options: object, key: string, selected: boolean })`<br/>
**Default:** `null`

Callback when mouse pointer enters a bound area.

```js
$('#myimage').mapster({
  onMouseover: function (data) {
    var $me = $(this), // HTMLAreaElement element clicked
      e = data.e, // jQueryEventObject - see https://api.jquery.com/category/events/event-object/
      options = data.options, // area specific options defined for this area/area group
      key = data.key, // mapKey for this area
      selected = data.selected; // true or false based on current area state

    // ...
  }
});
```

### onShowToolTip

**Type:** `function(data: { toolTip: jQueryObject, areaOptions: object, key: string, selected: boolean })`<br/>
**Default:** `null`

Callback when a tooltip is displayed.

```js
$('#myimage').mapster({
  onShowToolTip: function (data) {
    var $me = $(this), // HTMLAreaElement element bound to the tooltip (null when triggered programmatically)
      tooltip = data.toolTip, // jQueryObject of the tooltip container
      areaOptions = data.areaOptions, // area specific options defined for this area/area group
      key = data.key, // mapKey for this area
      selected = data.selected; // true or false based on current area state
  }
});
```

### onStateChange

**Type:** `function(data: { key: string, state: string, selected: boolean })`<br/>
**Default:** `null`

Callback when an `area` changes state, either highlight or select.

```js
$('#myimage').mapster({
  onStateChange: function (data) {
    var $me = $(this), // HTMLImageElement of the bound image
      key = data.key, // mapKey for this area
      state = data.state; // "highlight" | "select",
    selected = data.selected; // true or false based on current area state
  }
});
```
