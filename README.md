###**ImageMapster:** A Jquery Plugin to make image maps useful. 

ImageMapster activates the areas in HTML imagemaps so you can highlight and select them. It has lots of other features for manual control, tooltips, resizing, and more. It is designed to be compatible with every common platform, and is tested with Internet Explorer 6-10, Firefox 3.0+, Safari, Opera, and Chrome. It works on mobile devices and doesn't use Flash.

### Release Information

See the [change log](https://github.com/jamietre/ImageMapster/blob/master/CHANGES.md) for details on the current release.

Read the [release notes](http://blog.outsharked.com/2012/06/imagemapster-125-released.html) for 1.2.5, the last significant update. 

### Find out More

There are lots of examples and documentation on the [ImageMapster web site.](http://www.outsharked.com/imagemapster)

You can find the [source code on GitHub.](https://github.com/jamietre/ImageMapster) If you have a problem, please file a bug report there!

<b>Questions?</b>

- I write about ImageMapster on my blog from time to time. See [posts about imagemapster.](http://blog.outsharked.com/search/label/imagemapster)

- Take a look at [ImageMapster questions on StackOverflow](http://stackoverflow.com/search?q=imagemapster); there are quite a few. Maybe someone's asked the same question already.

- There are also some very detailed discussions in the [GitHub issues](https://github.com/jamietre/imagemapster/issues?direction=desc&labels=support&page=1&sort=created&state=closed) section that I've flagged as "support". 

- You can also check the [feedback](http://www.outsharked.com/imagemapster/default.aspx?feedback.html) page on the project web site. 

- Still can't figure it out? [email me directly](mailto:alien@outsharked.com) if you still need help. I will respond as time permits, but I will always respond.


### Usage

----

Active all image maps on the page with default options: on mouseover areas are highlighted with a gray fill with no border, and clicking an area causes it to become selected.

    $('img').mapster();

Activate image maps with some specific options.

    $('img').mapster( { 
        fillColor: 'ff0000', 
        stroke: true, 
        singleSelect: true
    });


### Manual Control

----

There are lots of ways to manipulate the imagemap from Javascript. Here area a few; see the project web site for complete documentation.

**select**: Cause an area to become "selected"

    $('area').mapster('select');

Programatically select elements from the image map. The programmatic selection/deselection methods will not honor the staticState property.

**deselect**: Cause an area to become "selected"

    $('area').mapster('deselect');

**set**: select or deselect an element. If `selected` is true, the area is selected, if false, it is deselected.

    $('area').mapster('set',selected);

You can also select or deselect areas using a their `mapKey`. This is an attribute on each area in your HTML that identifies it. You define a mapKey using a configuration option: `mapKey: 'data-key'`.

    $('img').mapster('set',true,'key1,key2');

If two areas share the same value for the `mapKey` they will be automatically grouped together when activated. You can also use the values of the mapKey to select areas from code.

You can pass options to change the rendering effects when using set as the last parameter:

    $('img').mapster('set',true,'key', {fillColor: 'ff0000'} );

MapKeys can contain more than one value. The first value always defines groups when you mouse over. Other values can be used to create logical groups. For example:

    <img id="usamap" src="map.jpeg" usemap="#usa">
    <map name="usa">
		<area data-key="maine,new-england,really-cold" shape="poly" coords="...">
		<area data-key="new-hampshire,new-england,really-cold" shape="poly" coords="...">
		<area data-key="vermont,new-england,really-cold" shape="poly" coords="...">
		<area data-key="connecticut,new-england" shape="poly" coords="...">
		<area data-key="rhode-island,new-england" shape="poly" coords="...">
		<area data-key="massachusetts,new-england" shape="poly" coords="...">
		<!-- more states... -->
    </map>

    $('#usamap').mapster( { mapKey: 'data-key' } );

Mousing over each state would cause just that state to be higlighted. You can also select other logical groups from code code:

    // select all New England states
    $('img').mapster('set',true,'new-england');

    // select just Maine, New Hampshire & Vermont
    $('img').mapster('set',true,'really-cold');

Groups created this way are *independent* of the primary group. If you select "new-england" from code, you can't unselect just "MA" by clicking on it. You would have to unselect "new-england" from code. 

To simply indentify a set of areas to turn on or off, but not treat them as a logical group, you can use CSS classes and select areas directly, or use the <code>keys</code> option to identify the primary keys associated with a group (see documentation).


----
### Options

Please see github repository for complete documentation.

### Zepto Compatibility

Newer versions of Zepto don't seem to work any more (as of 1.2.5). I didn't want this to hold up the ever-delayed release even further so I didn't figure out why. 

In theory it should work; you need to use the "jquery.imagemapster.zepto.js" build. This patches a few holes in Zepto that ImageMapster needs. It is safe to use the zepto version with jQuery.

### Build instructions

The source code is broken into several modules to make management easier and to make it possible to create feature-targeted builds. A rakefile is included that creates and minifies the two release builds (with and without Zepto support):

`rake`

### Code use license.

LICENSE (MIT License)
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
