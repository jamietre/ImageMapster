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

## Summary

Image Mapster: A Jquery Plugin to make image maps useful. 

Project home page. [[http://www.outsharked.com/imagemapster]]

See an online demo. [[http://www.outsharked.com/imagemapster/demo1.aspx]]

Source repository: [[https://github.com/jamietre/ImageMapster/]]

## Details

 Usage and Options

[[Overview]]

Basic usage and options. Generally speaking, you just apply ImageMapster to a jQuery object containing images. They must be associated with an imagemap via the `usemap` tag. ImageMapster can support multiple simultaneous image maps. If you apply it to a jQuery object with several images, they will all use the same options provided. 

----
## Usage

**mapster**: Bind to all selected images.

    $('img').mapster(options);

**select**: Cause an area to become "selected"

    $('area').mapster('select');

Programatically select elements from the image map. The programmatic selection/deselection methods will not honor the staticState property.

**deselect**: Cause an area to become "selected"

    $('area').mapster('deselect');

**set**: select or deselect an element

    $('area').mapster('set',selected);

Select or deselect alements from jQuery objects wrapping "area" tags on the map based on truthiness of selected.

    $('img').mapster('set',selected,'key');

Select or deselect alements in the mapster bound to the image using a key (as identified with option *listKey*

----
## Options

Options can be assigned when creating a mapster. Some options can also be applied on a per-element basis (if it makes sense), e.g. any rendering options, *selected*, *staticState*. To apply options to an area, use` jquery.data("mapster")` to add an object to an area element, for example:

    $('#some_area').data("mapster",{
       selected: true; 
    });

Some basic options inherited from maphilight: These control the way highlighted areas are rendered and can be applied globally to the map, or to each element. 

    fill: true,
    fillColor: '000000',
    fillOpacity: 0.2,
    stroke: true,
    strokeColor: 'ff0000',
    strokeOpacity: 1,
    strokeWidth: 1,
    fade: true


Please see the maplight web site for details for now. Work is in progress to replace the effects with jQuery UI.

**isSelectable**: the area on the map can be selected (or deselected).

    isSelectable: false | true

When true, the image map will function like a multiple-select menu. Users can click any area to select or deselect it. This option can be applied to individual areas.

**staticState**: the map or area is permanently in a selected or deselected state.

    staticState: null | true | false

When true or false, the map or area to which this option applies will be permanently selected or deselected. Typically this is more useful applied to individual areas that you want to exclude from the interactive part of the map.

This is independent from *isSelectable*. *staticState* will cause areas to be highlighted or not highlighted, and they will not respond visually to a mouseover. *isSelectable* determines whether an area can be click selected.

**selected**: initial selection state of an area.

    selected: false | true

The area in question is selected. To set default selections when creating a new mapster, use $.data (see above) and this option.

**boundList**: a jQuery object with elements that are bound to the map.

    boundList: null | jQuery-object
    
boundList can be any list of objects. To be bound to the map, they must contain an attribute called *listKey* whose value matches the value in the area tag's *mapKey* attribute (see below). If more than one element in the list has the same value, the action will affect all matching elements.

**mapKey**: an attribute identifying each imagemap area.

    mapKey: 'title'

Each `area` tag in the image map should be identified with this attribute. Any areas that share the same value will be considered part of a group, and acted on simultaneously. If any member of a group is selected or highlighted, then all members will be. If you don't want this functionality, ensure each key is unique. Any `area` tags that are missing this attribute will be excluded from the image map entirely. (This is functionally identical to setting `staticState=false`.

**mapValue**: an attribute on each `area` tag containing additional information for each area.

    mapValue: 'text'

This option is applicable only when using *onGetList*. When set, the data provided to the callback function will include this text for each group. This can be used to easily build a list with associated information without having to match against another resource.

If there are grouped areas (areas with the same key) then the value from the first one found with data in this attribute will be used.

**listKey**: an attribute on items in a *boundList* that corresponds to the value of the *mapKey* attributes.

    listKey: 'value'

This is used to synchronize the actions on the imagemap with the actions on a boundList. Each value should match a value from the imageMap *mapKey* tag. Any item in the boundList with missing or mismatched data will be ignored.

**listSelectedAttribute**: attribute to set or remove when an area is selected or deselected

    listSelectedAttribute: 'selected'

If boundList is present, when a map area is selected, set or remove this attribute on the list element that matches that area based on their respective keys.

**listSelectedClass**: a class to add or remove when an area is selected or deselected

    listSelectedClass: ''

If a boundList is present, when a map area is selected, this class is added or removed from the corresponding list element. This can be used to easily create any kind of associated action when areas on the map are changed.

**onClick**: a callback when an area is clicked. 

    onClick: null | function
 
This event occurs when the usual `click` event happens, but includes data from the mapster about the area:

    function clickHandler(data) {
        //this = area element clicked
        //data = {
            target: area DOM element clicked
            listTarget: matching $(item) from boundList
            areaTarget: matching $(area)
            areaOptions: options active for this area
            key: mapKey for this area
            selected: whether or not item is now selected 
        };
    }

This can be used to perform additional actions on a click without binding another event and having to obtain information manually.

**onGetList**: a callback on mapster initialization that provides summary data about the image map, and expects a jQuery list to be returned.

    onGetList: null | function

This callback allows you to dynamically provide a boundList based on summary data from the imagemap itself, rather than providing the list up front. The event passes an array of all the unique keys and values found in the areas. The client should return a jQuery object containing all the elements that make up the bound list, the same as if it was assigned manually. Typical function structure is as follows:

    function getListHandler(data) {
        for (var i=0;i<data.length;i++) {
            element = ... // create an HTML element using data.key & data.value 
            myListContainer.append(element);
        }
        // do not return the container - only the actual elements that make up the list
        return myListContainer.children();
    }

**sortList**: sort the values before calling *onGetList*

    sortList: false | 'asc' | 'desc'

If a non-false value or "asc" is passed, the list will be sorted in ascending order by the area value from *mapValue*. If "desc" is passed, the list will be sorted in descending order.

**showToolTip**: enable tooltips for rollovers

    showToolTip: false | true

When showToolTip is true, mapster will look for a property called `toolTip` in the jQuery data object associated with an area. If present, a tool tip dialog will be shown on mouseover for that area. It will automatically be closed on mouseout. This option does not apply at the item level, only the presence of tooltip data is necessary.

**toolTipContainer**: HTML describing the popup that will be created for tooltips.

    toolTipContainer: '<div style="border: 2px solid black; ... ></div>'

A very basic div is included as the default tooltip container. This can be replaced with anything.

When tooltips are rendered, the code attempts to determine the best place for it. It will try to position it in near the top-left part of the area, and continue to try other corners in order to render it within the confines of the container where the image map resides.

**toolTip**: tool tip data for an area

    toolTip: 'text' | jQuery object

When present and showToolTips = true, a *toolTipContainer* will be created this will be inserted into it, either as inner text (if only text as passed) or as HTML if a jQuery object is passed.