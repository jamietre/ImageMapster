####Version 1.3.0 (planned)

Features:

* Return promises from asynchronous events rather than requiring callbacks like "onConfigured"
* Return a non-jQuery object exposing the imagemapster API to simplify coding against it

####Version 1.2.14 (unreleased)

* Enable mouseover events when touchscreen found (to account for proliferation of machines with mouse pointer + touchscreen)
* TODO - detect input device actively to determine when highlight effect should be enabled

####Version 1.2.13

* Fix problem with mouseoutdelay=01

####Version 1.2.12

* Fix issue with $.inArray on IE8
* Fix problem with boundList when using "set" to toggle a multiple areas at once (from 1.2.11 issue - not quite fixed)

####Version 1.2.11

* Fix problem de-selecting boundlist when using "set" to toggle

####Version 1.2.10

* [Issue 120](https://github.com/jamietre/ImageMapster/issues/114) 1.2.9 broke IE9

####Version 1.2.9

* [Issue 114](https://github.com/jamietre/ImageMapster/issues/114) Fix jQuery 1.9 compatibility problem

####version 1.2.8

* [Issue 108](https://github.com/jamietre/ImageMapster/issues/108) Opacity of tooltip container not preserved
* [Issue 107](https://github.com/jamietre/ImageMapster/issues/107) mouseoutDelay broken

####version 1.2.7

* [Issue 95](https://github.com/jamietre/ImageMapster/issues/95) SingleSelect broken in 1.2.6.099
* [Issue 87](https://github.com/jamietre/ImageMapster/issues/87) Resize callback not working
* [Issue 84](https://github.com/jamietre/ImageMapster/issues/84) Mouseover events not completely suppressed on mobile
* Tooltip enhancements: tooltips can be called against arbitrary elements.
* AltImage enhancements: see below

*tooltip-enhancements branch*

* [Issue 72](https://github.com/jamietre/ImageMapster/issues/72): `scaleMap` not working propery when using bootstrap (css on `body` causing incorrect evaluation of native image size)
* Enhanced tooltip API to allow creating arbitrary tool tips bound to any area, or at an arbitrary position. 

*altimage-enhancements branch*

* Add `altImages` option that accepts an option defining aliases to alternate images. The name of each property is an alias that can be specified as a valid `altImage` option value elsewhere

Example use of this option:



    altImages: {
       roadmap: 'images/usamap-roads.png',
       elevation: 'images/uasmap-elevation.png'
    }

then:

    $('img').mapster('set',true,'AZ', {
		altImage: 'roadmap' 
	});


The aliases can also be used in the initial configuration options, both globally and for specific areas.


####version 1.2.6 - 2012.07.13

Bug Fixes:

* [Issue #69](https://github.com/jamietre/ImageMapster/issues/69) `fill` setting not being honored sometimes in IE6-8
* [Issue #68](https://github.com/jamietre/ImageMapster/issues/68) Accept `areas` array with dangling commas

####version 1.2.5 - 2012.06.19



Bug fixes:

* [Issue #59](https://github.com/jamietre/ImageMapster/issues/59), [Issue #55](https://github.com/jamietre/ImageMapster/issues/55) Opacity/fade effects not working right in IE8
* [Issue #58](https://github.com/jamietre/ImageMapster/issues/58) Resize not changing CSS for the `div` contiainer around the image elements
* [Issue #53](https://github.com/jamietre/ImageMapster/issues/53) Not working in Google Chrome with Adblock plugin
* [Issue #44](https://github.com/jamietre/ImageMapster/issues/44) Incorrect opacity with altImage
* [Issue #36](https://github.com/jamietre/ImageMapster/issues/36) Resize firing callback before resize is finished
* Rebind not cleaning up resources properly
* Offset 1 pixel strokes by 0.5 px to prevent the fuzzies
* Ignore UI events during resize - can cause problems if highlights are activated during an effect


Features: 

* [Issue #52](https://github.com/jamietre/ImageMapster/issues/52) Add "clickNavigate" feature to allow basic imagemap functionality 
* Add "highlight" option to programatically set/unset the highlight effect (as if a user just moused over an area vs. clicked)
* Detect touchscreen devices and disable "mouseover"
* [Issue #11](https://github.com/jamietre/ImageMapster/issues/11) Detect excanvas automatically and force into IE mode if present

Notes

* refactor into modular architecture
* tighten up tooltip code a little
* Removed "attrmatches" jQuery selector exetnsion, recoded as a function, removed from tests
* Queue all methods (highlight, data, tooltip) so configuration delays don't cause problems 
* Unbind "load" event explicitly from images added. 
* Add dynamic images to DOM instead of loading through Javascript
* Ignore missing keys on some operations to increase stability with bad data
* Trim results of string splits so spaces don't cause problems
* Yet more tweaking of image loading detection
* Refactor "graphics" into an object and instantiate for each instance. "load" callbacks were changing event order, resulting in the single instance getting wires crossed. Isolated
each map instance completely, problem solved.
* Fix canvases re-ordered after first selection making effect sometimes inconsistent
* Fix resize bug when area groups are used

####version 1.2.4 - 2011.09.27

* [Issue #14](https://github.com/jamietre/ImageMapster/issues/14) Resize bug in IE <9 fixed

####version 1.2.3

* Resize with multiple images affecting other images - fixed

####version 1.2.2 - 2011.09.22

* masks not working in Firefox 6.0 only. behavior of context.globalCompositeOperation='source-out' and
  save/restore somehow changed in ff6. updated code to not depend (possibly) on idiosyncracies of chrome 
  and ie9. honestly not sure why it  worked before as it appears I may have been doing something wrong, 
  but the code is more explicit now and it works across all browsers.

####version 1.2.1

* Click callback "this" is not set - fixed
* Replace u.isFunction with $.isFunction to save a few bytes

####version 1.2

* fixed fader problem for old IE (again, really this time)
* allow selecting includeKeys areas from staticState areas
* test browser features for filter vs. opacity
* "resize" option
* improve startup speed by eliminating need for setTimeout callback
* address startup bug when images aren't loaded and there are lots of images
* fixed exception when "set" with no data for key
* bug when multiple images bound on same page * another IE tweak: blur() on mouseover/click to remove browser-rendered border around area
* force "border=0" on image to ensure consistent display across bind/unbind in IE
* Fixed broken "onMouseover" option, added tests for onMouseover/onMouseout.
* many performance improvements, tests, refactoring some old inefficient code.
* fix css flickering when debinding/rebinding in HTML5 browsers
* add "scaleMap" option to automatically resize image maps when a bound image is resized dynamically. Enabled by default if an image is displayed at a size other than its native size. 

####version 1.1.3

* revised "highlight" method API (previously undocumented). Added tests & documented.
* added a generic prototype for parsing method data to improve consistency & stability
* added tests for tooltip external & event bound invocation
* added invoking tooltip from area, e.g.  $('some-area').mapster('tooltip')
* added invoking tooltip from key, e.g. .mapster('tooltip',key);
* Bug fix for get_options, showToolTip (related)
* Bug fix - area id 0 on VML rendereding deselection causes all selections to disappear (introduced in beta 2)
* Changed "get" to return true "selected" state and not "isSelected()" which includes staticState items in selected.
* Bug fix - stroke sometimes rendered improperly when using render-specific options
* change onClick handler to BEFORE action, permit canceling of action by returning false
* refactor into mostly OO design - functional design was getting unwieldy.
* fix bugs related to cascading of "staticState" options
* add "snapshot" option
* check for existing wrapper, skip if it already exists
* remove map data when unbinding+preserveState -- it should act as if not there
* IE performance improvements (optimizing rendering code a little bit)

####version 1.1.2 - 2011.06-15

* minor bugfix release

####version 1.1.1 - 2011.06.03

* Performance improvement: cache area groups on map binding to eliminate need for attribute selector
* Significant enhancement to permit complex area grouping and area exclusions (masks):
  * added: mapKey can contain multiple keys, allowing an area to be a member of multiple groups
  * added: "noHrefIsMask" option to determine "nohref" attribute treatment
  * added: "isMask" option (area-specific)
  * added: "includeKeys" option (area-specific)
* added: 'highlight' method to enable highlighting of areas from code
* bufgix: fading didn't work in IE6-7, some Operas. Should work in all browsers except IE8 now.
* bugfix: ignore areas with no mapkey when it is provided
* bugfix: not binding properly when no mapkey provided

####version 1.1

* added: per-action options (highlight, select)
* fixed some memory leaks
* minor performance improvements
* cleanup in VML mode
* fix IE9 canvas support (fader problem)
* fix flickering on fades when moving quickly
* add altImage options
* added onConfigured callback
* fixed problems with cleanup (not removing wrap)
* added failure timeout for configure

####Version 1.0.10 - 2011.05.12

* ignore errors when binding mapster to invalid elements
* minor performance improvements
* fixed command queue problem (broke in 1.0.9) for commands issued after bind, but before image is ready
* enhanced tests

####version 1.0.9 - 2011.05.10

* added "unbind" option to remove mapster from an image
* add 'options' option
* add 'rebind' option
* add isDeselectable option
* handle exceptions better (when acting on unbound images)
* add 'get' method to retrieve selections
* add unbind options
* clear command queue after processing 

####version 1.0.8 - 2011.05.05

* Handle problem when "img.complete" is not true at config time and "set" commands are issued after initial config call but before config is complete. Queue any "set" commands and process them after the timer callback.
* Pass listTarget to onClick callback even when !isSelectable (previously passed null)
* Pass ref to toolTip element on callback
* Don't show tooltip again if the one for an area is already displayed
* Add singleSelect option - clears any other selected item when a new item is selected

####Version 1.0.6 - 2011.04.27

* Problem when not using mapKey 
* staticState=false not working

####Version 1.0.5 - 2011.04.26

* Corrected jquery attribute selector (not using quote marks)
* added area persistence behavior options
* tooltips not working in Firefox - bug in area data management. Deprecated use of jquery.data for passing area-specific options, added "areas" option to replace
* fixed "showToolTip" default property name (was showToolTips) - should have had no effect

####Version 1.0.4 - 2011.04.20

* allow using jQuery object for toolTip text
* happy earth day

####Version 1.0.3

* missing preventDefault on click (post refactor issue)

####Version 1.0.2

* fixed tooltip in IE6

####Version  1.0.0 - 2011.04.19 - **first official release**

* refactored from remaining old to use a clean namespace
* added simple mouseover dialog
