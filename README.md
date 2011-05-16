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

Project home page. http://www.outsharked.com/imagemapster

Online demo. http://www.outsharked.com/imagemapster/demo1.aspx

Source repository: https://github.com/jamietre/ImageMapster 

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

Please see github repository for complete documentation.
