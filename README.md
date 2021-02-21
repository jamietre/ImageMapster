# ImageMapster: A jQuery Plugin to make image maps useful

[![license](https://img.shields.io/github/license/jamietre/ImageMapster)](https://github.com/jamietre/ImageMapster/blob/master/LICENSE)
[![gh stable](https://img.shields.io/github/v/release/jamietre/imagemapster?sort=semver&label=stable)](https://GitHub.com/jamietre/ImageMapster/releases/)
[![gh latest](https://img.shields.io/github/v/release/jamietre/imagemapster?include_prereleases&sort=semver&label=latest)](https://GitHub.com/jamietre/ImageMapster/releases/)
[![npm downloads](https://img.shields.io/npm/dm/imagemapster?label=npm)](https://www.npmjs.com/package/imagemapster)
[![jsDelivr downloads](https://data.jsdelivr.com/v1/package/npm/imagemapster/badge?style=rounded)](https://www.jsdelivr.com/package/npm/imagemapster)
[![cdnjs version](https://img.shields.io/cdnjs/v/imagemapster.svg?color=orange)](https://cdnjs.com/libraries/imagemapster)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

ImageMapster activates the areas in HTML imagemaps so you can highlight and select them. It has lots of other features for manual control, tooltips, resizing, and more. It is designed to be compatible with every common platform, and is tested with Internet Explorer 6-10, Firefox 3.0+, Safari, Opera, and Chrome. It works on mobile devices and doesn't use Flash.

## Release Information

See the [change log](https://github.com/jamietre/ImageMapster/blob/master/CHANGELOG.md) for details on the release history and roadmap.

Read the [release notes](http://blog.outsharked.com/2012/06/imagemapster-125-released.html) for 1.2.5, the last significant feature update.

## Getting Started

### Installation

#### NPM

This package can be installed via NPM:

```sh
npm install jquery imagemapster --save
```

#### Browser

:warning: **_As of ImageMapster v1.3.0, if targeting ES5 browers, you must include a Promise polyfill such as [es6-promise](https://www.npmjs.com/package/es6-promise). See [Issue 341](https://github.com/jamietre/ImageMapster/issues/341) for details._**

Download the latest version of ImageMapster from the [Releases](https://github.com/jamietre/ImageMapster/releases) page and include in your webpage:

```html
<!-- Optional: If targeting ES5 browers, as of ImageMapster v1.3.0, a Promise polyfill is required! -->
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/es6-promise/dist/es6-promise.auto.min.js"
></script>
<script
  language="text/javascript"
  src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"
></script>
<script language="text/javascript" src="jquery.imagemapster.min.js"></script>
```

Alternatively, you can include ImageMapster from one of the following CDNs:

1. [jsDelivr](https://www.jsdelivr.com/package/npm/imagemapster) - https://www.jsdelivr.com/package/npm/imagemapster
2. [cdnjs](https://cdnjs.com/libraries/imagemapster) - https://cdnjs.com/libraries/imagemapster

### Usage

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

#### Methods

There are lots of ways to manipulate the imagemap from Javascript. Here area a few, see the [ImageMapster web site](http://www.outsharked.com/imagemapster) for complete documentation.

**select**: Cause an area to become "selected"

```js
$('area').mapster('select');
```

Programatically select elements from the image map. The programmatic selection/deselection methods will not honor the staticState property.

**deselect**: Cause an area to become "deselected"

```js
$('area').mapster('deselect');
```

**set**: select or deselect an element. If `selected` is true, the area is selected, if false, it is deselected.

```js
$('area').mapster('set', selected);
```

You can also select or deselect areas using a their `mapKey`. This is an attribute on each area in your HTML that identifies it. You define a mapKey using a configuration option: `mapKey: 'data-key'`.

```js
$('img[usemap]').mapster('set', true, 'key1,key2');
```

If two areas share the same value for the `mapKey` they will be automatically grouped together when activated. You can also use the values of the mapKey to select areas from code.

You can pass options to change the rendering effects when using set as the last parameter:

```js
$('img[usemap]').mapster('set', true, 'key', { fillColor: 'ff0000' });
```

MapKeys can contain more than one value. The first value always defines groups when you mouse over. Other values can be used to create logical groups. For example:

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

Mousing over each state would cause just that state to be higlighted. You can also select other logical groups from code code:

```js
// select all New England states
$('#usamap').mapster('set', true, 'new-england');

// select just Maine, New Hampshire & Vermont
$('#usamap').mapster('set', true, 'really-cold');
```

Groups created this way are _independent_ of the primary group. If you select "new-england" from code, you can't unselect just "MA" by clicking on it. You would have to unselect "new-england" from code.

To simply indentify a set of areas to turn on or off, but not treat them as a logical group, you can use CSS classes and select areas directly, or use the <code>keys</code> option to identify the primary keys associated with a group (see documentation).

#### Options

Please see the [ImageMapster web site](http://www.outsharked.com/imagemapster/default.aspx?docs.html) for complete documentation.

## Examples

ImageMapster includes several examples. To view the examples:

1. Clone the repo
2. Open [index.html](examples/index.html) directly from your file system in a browser

## Zepto Compatibility

As of ImageMapster v1.3.2, ImageMapster contains full support for Zepto v1.2.0. The latest Zepto compatible version of ImageMapster is [1.5.4](https://github.com/jamietre/ImageMapster/releases/tag/v1.5.4).

Prior to ImageMapster v1.3.2 and with any version of Zepto except v1.2.0, ImageMapster is unlikely to work as expected. In the early versions of ImageMapster, Zepto support was maintained, however due to changes in Zepto, as of v1.2.5 of ImageMapster, support for Zepto compatability was not maintained as it required too much effort and pushing ImageMapster forward with jQuery was the priority.

:warning: **_Given that Zepto is no longer actively developed and with plans in the ImageMapster Roadmap to convert to a Native JS Library, ImageMapster will be officially dropping support of Zepto as of ImageMapster v2.0.0._**

To use ImageMapster >= v1.3.2 < 2.0.0 with Zepto v.1.2.0, Zepto must contain the following [Zepto Modules](https://github.com/madrobby/zepto#zepto-modules) at a minimum:

- zepto
- event
- ie
- fx
- touch
- selector (required as of v1.5.0)

### CDN

:warning: **_As of ImageMapster v1.3.0, if targeting ES5 browers, you must include a Promise polyfill such as [es6-promise](https://www.npmjs.com/package/es6-promise). See [Issue 341](https://github.com/jamietre/ImageMapster/issues/341) for details._**

1. [jsDelivr](https://www.jsdelivr.com/package/npm/imagemapster?version=1.5.4) - https://www.jsdelivr.com/package/npm/imagemapster?version=1.5.4
2. [cdnjs](https://cdnjs.com/libraries/imagemapster/1.5.4) - https://cdnjs.com/libraries/imagemapster/1.5.4

Use `jquery.imagemapster.zepto.min.js`

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
  src="/path/to/cdn/for/v1.5.4/dist/jquery.imagemapster.zepto.min.js"
></script>
```

### NPM

The maintainers of Zepto decided not to support any module loaders so there is no official support of Zepto using AMD/CJS/etc. Given this, the Zepto version of ImageMapster expects a dependency of `jquery` when using a module loader. The Zepto version of ImageMapster will work with jQuery or Zepto. If you'd like to utilize Zepto, there are some projects that wrap Zepto and support UMD such as [zepto-modules](https://www.npmjs.com/package/zepto-modules). In order to use Zepto, you will need to configure your bundler to map `jquery` to your Zepto build.

Using `webpack` and `zepto-modules` as an example:

#### Install from NPM

```sh
npm install zepto-modules imagemapster@1.5.4 --save
```

#### src/yourzepto.js

```js
var $ = require('zepto-modules/zepto');

require('zepto-modules/event');
require('zepto-modules/ie');
require('zepto-modules/fx');
require('zepto-modules/touch');
require('zepto-modules/selector');

module.exports = $;
```

#### src/yourmodule.js

```js
import $ from './yourzepto.js';
import im from 'imagemapster/dist/jquery.imagemapster.zepto.js';
...
$(yourImage).mapster({ ... });
```

#### webpack.config.js

```js
resolve: {
  alias: {
    jquery: path.resolve('./src/yourzepto');
  }
}
```

## Find out More

Please see how to obtain [ImageMapster Support](SUPPORT.md).

## Contributing

Please see our [Contributing Guidelines](CONTRIBUTING.md).

## Development

### Build

The source code is broken into several modules to make management easier and to make it possible to create feature-targeted builds. ImageMapster is built using grunt and can be invoked as follows:

1. Clone the repo
2. Install NPM dependencies - `npm install`
3. Install [Grunt Cli](https://gruntjs.com/getting-started) - `npm install -g grunt-cli`
4. Generate a Build:
   - Debug Build (uncompressed) - `grunt build`
   - Release Build (uncompressed/compressed/sourcemap) - `grunt dist`

### Debug

1. Clone the repo
2. Install NPM dependencies - `npm install`
3. Install [Grunt Cli](https://gruntjs.com/getting-started) - `npm install -g grunt-cli`
4. Run the debug task - `grunt debug`

## License

Copyright &copy; 2011-21 [James Treworgy](https://github.com/jamietre). Licensed under the [MIT License](LICENSE).
