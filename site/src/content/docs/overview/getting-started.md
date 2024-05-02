---
title: Getting Started
description: How to install and use ImageMapster.
---

ImageMapster activates the areas in [HTML Image Maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map) so you can highlight and select them. It has lots of other features including tooltips, automatic resizing, and more. See ImageMapsters [introduction](./introduction.mdx) to learn more about it's features and history.

## Installation

ImageMapster can be used with either jQuery or Zepto.

### jQuery

#### NPM

This package can be installed via NPM:

```sh
npm install jquery imagemapster --save
```

#### Browser

:::caution
As of ImageMapster v1.3.0, if targeting ES5 browers, you must include a Promise polyfill such as [es6-promise](https://www.npmjs.com/package/es6-promise). See [Issue 341](https://github.com/jamietre/ImageMapster/issues/341) for details.
:::

Download the latest version of ImageMapster from the [Releases](https://github.com/jamietre/ImageMapster/releases) page and include in your webpage:

```html
<!-- Optional: If targeting ES5 browers, as of ImageMapster v1.3.0, a Promise polyfill is required! -->
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/es6-promise/dist/es6-promise.auto.min.js"
></script>
<script
  language="text/javascript"
  src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"
></script>
<script language="text/javascript" src="jquery.imagemapster.min.js"></script>
```

Alternatively, you can include ImageMapster from one of the following CDNs:

1. [jsDelivr](https://www.jsdelivr.com/package/npm/imagemapster) - <https://www.jsdelivr.com/package/npm/imagemapster>
2. [cdnjs](https://cdnjs.com/libraries/imagemapster) - <https://cdnjs.com/libraries/imagemapster>

### Zepto

:::caution
[Zepto](https://zeptojs.com/) is no longer being maintained and therefore ImageMapsters support for Zepto has been deprecated as of [version 1.3.2](https://github.com/jamietre/ImageMapster/blob/main/CHANGELOG.md#version-132---20210121) and will be [removed in the next major release](https://github.com/jamietre/ImageMapster/issues/343).
:::

As of ImageMapster v1.3.2, ImageMapster contains full support for Zepto v1.2.0. The latest Zepto compatible version of ImageMapster is [1.8.0](https://github.com/jamietre/ImageMapster/releases/tag/v1.8.0).

Prior to ImageMapster v1.3.2 and with any version of Zepto except v1.2.0, ImageMapster is unlikely to work as expected. In the early versions of ImageMapster, Zepto support was maintained, however due to changes in Zepto, as of v1.2.5 of ImageMapster, support for Zepto compatability fell behind as it required too much effort and pushing ImageMapster forward with jQuery was the priority.

To use ImageMapster >= v1.3.2 < 2.0.0 with Zepto v.1.2.0, Zepto must contain the following [Zepto Modules](https://github.com/madrobby/zepto#zepto-modules) at a minimum:

- zepto
- event
- ie
- fx
- touch
- selector (required as of v1.5.0)

#### NPM - Zepto

The maintainers of Zepto decided not to support any module loaders so there is no official support of Zepto using AMD/CJS/etc. Given this, the Zepto version of ImageMapster expects a dependency of `jquery` when using a module loader. The Zepto version of ImageMapster will work with jQuery or Zepto. If you'd like to utilize Zepto, there are some projects that wrap Zepto and support UMD such as [zepto-modules](https://www.npmjs.com/package/zepto-modules). In order to use Zepto, you will need to configure your bundler to map `jquery` to your Zepto build.

Using `webpack` and `zepto-modules` as an example:

##### Install from NPM

```sh
npm install zepto-modules imagemapster@1.8.0 --save
```

##### src/yourzepto.js

<!-- eslint-disable-next-line @typescript-eslint/no-var-requires -->

```js
var $ = require('zepto-modules/zepto');

require('zepto-modules/event');
require('zepto-modules/ie');
require('zepto-modules/fx');
require('zepto-modules/touch');
require('zepto-modules/selector');

module.exports = $;
```

##### src/yourmodule.js

```js
import $ from './yourzepto.js';
import im from 'imagemapster/dist/jquery.imagemapster.zepto.js';

$(yourImage).mapster({
  // your config here
});
```

##### webpack.config.js

```js
module.exports = {
  resolve: {
    alias: {
      jquery: path.resolve('./src/yourzepto')
    }
  }
};
```

#### Browser - Zepto

:::caution
As of ImageMapster v1.3.0, if targeting ES5 browers, you must include a Promise polyfill such as [es6-promise](https://www.npmjs.com/package/es6-promise). See [Issue 341](https://github.com/jamietre/ImageMapster/issues/341) for details.
:::

Download the latest Zepto version of ImageMapster from the [Releases](https://github.com/jamietre/ImageMapster/releases) page and include in your webpage **making sure to use `jquery.imagemapster.zepto.min.js` or `jquery.imagemapster.zepto.js`**:

```html
<!-- Optional: If targeting ES5 browers, as of ImageMapster v1.3.0, a Promise polyfill is required! -->
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/es6-promise/dist/es6-promise.auto.min.js"
></script>
<script
  language="text/javascript"
  src="/path/to/your/custom/zeptodist"
></script>
<script
  language="text/javascript"
  src="/path/to/cdn/for/v1.8.0/dist/jquery.imagemapster.zepto.min.js"
></script>
```

Alternatively, you can include the Zepto version of ImageMapster from one of the following CDNs:

1. [jsDelivr](https://www.jsdelivr.com/package/npm/imagemapster?version=1.8.0) - <https://www.jsdelivr.com/package/npm/imagemapster?version=1.8.0>
2. [cdnjs](https://cdnjs.com/libraries/imagemapster/1.8.0) - <https://cdnjs.com/libraries/imagemapster/1.8.0>

## Basic Usage

Activate all image maps on the page with default options: on mouseover areas are highlighted with a gray fill with no border, and clicking an area causes it to become selected.

```js
$('img[usemap]').mapster();
```

Activate all image maps on the page with some specific options.

```js
$('img[usemap]').mapster({
  fillColor: 'ff0000',
  stroke: true,
  singleSelect: true
});
```

### Methods

There are lots of ways to manipulate the image map from Javascript. Here are a few, see [API Reference][ar-base] for complete documentation.

[select][ar-select]: Cause an area to become "selected"

```js
$('area').mapster('select');
```

Programatically select elements from the image map. The programmatic selection/deselection methods will not honor the [staticState][cr-staticstate] property.

[deselect][ar-deselect]: Cause an area to become "deselected"

```js
$('area').mapster('deselect');
```

[set][ar-set]: select or deselect an element. If `selected` is true, the area is selected, if false, it is deselected.

```js
$('area').mapster('set', selected);
```

You can also select or deselect areas using a their [mapKey][cr-mapkey]. This is an attribute on each `area` in your HTML that identifies it. You define a `mapKey` using a configuration option: `mapKey: 'data-key'`.

```js
$('img[usemap]').mapster('set', true, 'key1,key2');
```

If two areas share the same value for the `mapKey` they will be automatically grouped together when activated. You can also use the values of the `mapKey` to select areas from code.

You can pass options to change the rendering effects when using set as the last parameter:

```js
$('img[usemap]').mapster('set', true, 'key', { fillColor: 'ff0000' });
```

The value specified for `mapKey` can contain more than one value. The first value always defines groups when you mouse over. Other values can be used to create logical groups. For example:

```html
<img id="usamap" src="map.jpeg" usemap="#usa" />
<map name="usa">
  <area data-key="maine,new-england,really-cold" shape="poly" coords="..." />
  <area
    data-key="new-hampshire,new-england,really-cold"
    shape="poly"
    coords="..."
  />
  <area data-key="vermont,new-england,really-cold" shape="poly" coords="..." />
  <area data-key="connecticut,new-england" shape="poly" coords="..." />
  <area data-key="rhode-island,new-england" shape="poly" coords="..." />
  <area data-key="massachusetts,new-england" shape="poly" coords="..." />
  <!-- more states... -->
</map>
```

```js
$('#usamap').mapster({ mapKey: 'data-key' });
```

Mousing over each state would cause just that state to be highlighted. You can also select other logical groups from code:

```js
// select all New England states
$('#usamap').mapster('set', true, 'new-england');

// select just Maine, New Hampshire & Vermont
$('#usamap').mapster('set', true, 'really-cold');
```

Groups created this way are _independent_ of the primary group. If you select `new-england` from code, you can't unselect just `MA` by clicking on it. You would have to unselect `new-england` from code.

To simply indentify a set of areas to turn on or off, but not treat them as a logical group, you can use CSS classes and select areas directly, or use the [includeKeys][cr-includekeys] option to identify the primary keys associated with a group.

### Options

See [configuration reference][cr-base] for complete documentation.

[cr-base]: ../reference/configuration-reference.md
[cr-staticstate]: ../reference/configuration-reference.md#staticstate
[cr-mapkey]: ../reference/configuration-reference.md#mapkey
[cr-includekeys]: ../reference/configuration-reference.md#includekeys
[ar-base]: ../reference/api-reference.md
[ar-select]: ../reference/api-reference.md#select
[ar-deselect]: ../reference/api-reference.md#deselect
[ar-set]: ../reference/api-reference.md#set
