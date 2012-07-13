version 1.2.6 - July 13, 2012

Bug Fixes:

* Issue #69 `fill` setting not being honored sometimes in IE6-8
* Issue #68 Accept `areas` array with dangling commas

version 1.2.5

* refactor into modular architecture
* tighten up tooltip code a little

Bug fixes:

* Rebind not cleaning up resources properly
* Offset 1 pixel strokes by 0.5 px to prevent the fuzzies
* Ignore UI events during resize - can cause problems if highlights are activated during an effect

Features: 

* Add "highlight" option to programatically set/unset the highlight effect (as if a user just moused over an area vs. clicked)
* Detect touchscreen devices and disable "mouseover"
* Detect excanvas automatically and force into IE mode if present

Notes

* Removed "attrmatches" jQuery selector exetnsion, recoded as a function, removed from tests
* Queue all methods (highlight, data, tooltip) so configuration delays don't cause problems 
* Unbind "load" event explicitly from images added. 
* Add dynamic images to DOM instead of loading through Javascript
* Ignore missing keys on some operations
* Trim results of string splits so spaces don't cause problems
* Yet more tweaking of image loading detection
* Refactor "graphics" into an object and instantiate for each instance. "load" callbacks were changing event order, resulting in the single instance getting wires crossed. Isolated
each map instance completely, problem solved.
* Fix canvases re-ordered after first selection making effect sometimes inconsistent
* Fix resize bug when groups are used

version 1.2.4

* Resize bug in IE <9 fixed

version 1.2.3

* Resize with multiple images affecting other images - fixed

version 1.2.2 - 9/22/11

* masks not working in Firefox 6.0 only. behavior of context.globalCompositeOperation='source-out' and
  save/restore somehow changed in ff6. updated code to not depend (possibly) on idiosyncracies of chrome 
  and ie9. honestly not sure why it  worked before as it appears I may have been doing something wrong, 
  but the code is more explicit now and it works across all browsers.

version 1.2.1

* Click callback "this" is not set - fixed
* Replace u.isFunction with $.isFunction to save a few bytes

version 1.2

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

version 1.1.3 (not officially released)

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

version 1.1.1 - 6/3/2010 

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

version 1.1

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

Version 1.0.10 - 5/12/2011 

* ignore errors when binding mapster to invalid elements
* minor performance improvements
* fixed command queue problem (broke in 1.0.9) for commands issued after bind, but before image is ready
* enhanced tests

version 1.0.9 - 5/10/2011 

* added "unbind" option to remove mapster from an image
* add 'options' option
* add 'rebind' option
* add isDeselectable option
* handle exceptions better (when acting on unbound images)
* add 'get' method to retrieve selections
* add unbind options
* clear command queue after processing 

Version 1.0.8 - 5/5/2011 

* Handle problem when "img.complete" is not true at config time and "set" commands are issued after initial config call but before config is complete. Queue any "set" commands and process them after the timer callback.
* Pass listTarget to onClick callback even when !isSelectable (previously passed null)
* Pass ref to toolTip element on callback
* Don't show tooltip again if the one for an area is already displayed
* Add singleSelect option - clears any other selected item when a new item is selected

Version 1.0.6 - 4/27/2011

* Problem when not using mapKey 
* staticState=false not working

Version 1.0.5 - 4/26/2011

* Corrected jquery attribute selector (not using quote marks)
* added area persistence behavior options
* tooltips not working in Firefox - bug in area data management. Deprecated use of jquery.data for passing area-specific options, added "areas" option to replace
* fixed "showToolTip" default property name (was showToolTips) - should have had no effect

Version 1.0.4 - 4/20/2011

* allow using jQuery object for toolTip text

Version 1.0.3 (unreleased)

* missing preventDefault on click (post refactor issue)

Version 1.0.2 - 4/20/2011 

* fixed tooltip in IE6

Version  1.0.0 - 4/19/2011 - first official release

* refactored from remaining old to use a clean namespace
* added simple mouseover dialog
