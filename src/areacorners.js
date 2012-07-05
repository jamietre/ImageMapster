/* areacorners.js
   determine the best place to put a box of dimensions (width,height) given a circle, rect or poly
*/

(function ($) {
    var u=$.mapster.utils;


    /**
     * Compute positions that will place a target with dimensions [width,height] outside 
     * but near the boundaries of the elements "elements". When an imagemap is passed, the 
     *
     * @param  {Element|Element[]} elements An element or an array of elements (such as a jQuery object)
     * @param  {Element} image The image to which area elements are bound, if this is an image map.
     * @param  {Element} container The contianer in which the target must be constrained (or document, if missing)
     * @param  {int} width The width of the target object
     * @return {object} a structure with the x and y positions
     */
    u.areaCorners = function (elements, image, container, width, height) {
        var pos,found, minX, minY, maxX, maxY, bestMinX, bestMaxX, bestMinY, bestMaxY, curX, curY, nest, j,
           offsetx=0, 
           offsety=0,
           rootx,
           rooty,
           iCoords,radius,angle,el,
           coords=[];

        // if a single element was passed, map it to an array
        
        elements = elements.length ? 
            elements:
            [elements];

        container = container ? 
            $(container):
            $(document.body);

        // get the relative root of calculation

        pos = container.offset();
        rootx = pos.left;
        rooty = pos.top;

        // with areas, all we know about is relative to the top-left corner of the image. We need to add an offset compared to
        // the actual container. After this calculation, offsetx/offsety can be added to either the area coords, or the target's
        // absolute position to get the correct top/left boundaries of the container.

        if (image) {
            pos = $(image).offset();
            offsetx = pos.left;
            offsety = pos.top;
        }

        // map the coordinates of any type of shape to a poly and use the logic. simpler than using three different
        // calculation methods. Circles use a 20 degree increment for this estimation.

        for (j=0;j<elements.length;j++) 
        {
            el=elements[j];
            if (el.nodeName==='AREA') {
                iCoords = u.split(el.coords,parseInt);

                switch(el.shape) {
                    case 'circle':
                        curX=iCoords[0];
                        curY=iCoords[1];
                        radius=iCoords[2];
                        coords=[];
                        for (j=0;j<360;j+=20) {
                             angle=j*Math.PI/180;
                             coords.push(curX+radius*Math.cos(angle),curY+radius*Math.sin(angle));
                        }
                        break;
                      case 'rect':
                          coords.push(iCoords[0],iCoords[1],iCoords[2],iCoords[1],iCoords[2],iCoords[3],iCoords[0],iCoords[3]);
                          break;
                      default:
                          coords=coords.concat(iCoords);
                         break;
                }

                // map area positions to it's real position in the container

                for (j=0;j<coords.length;j+=2)
                {
                    coords[j]=parseInt(coords[j],10)+offsetx;
                    coords[j+1]=parseInt(coords[j+1],10)+offsety;
                }
            } else {
                el=$(el);
                pos = el.position();
                coords.push(pos.left,pos.top,
                            pos.left+el.width(),pos.top,
                            pos.left+el.width(),pos.top+el.height(),
                            pos.left,pos.top+el.height());

            }
        }
        
        minX = minY = bestMinX = bestMinY = 999999;
        maxX = maxY = bestMaxX = bestMaxY = -1;

        for (j = coords.length - 2; j >= 0; j -= 2) {
            curX = coords[j];
            curY = coords[j + 1];
            
            if (curX < minX) {
                minX = curX;
                bestMaxY = curY;
            }
            if (curX > maxX) {
                maxX = curX;
                bestMinY = curY;
            }
            if (curY < minY) {
                minY = curY;
                bestMaxX = curX;
            }
            if (curY > maxY) {
                maxY = curY;
                bestMinX = curX;
            }

        }

        // try to figure out the best place for the tooltip
        
        if (width && height) {
            found=false;
            $.each([[bestMaxX - width, minY - height], [bestMinX, minY - height],
                             [minX - width, bestMaxY - height], [minX - width, bestMinY],
                             [maxX,bestMaxY - height], [ maxX,bestMinY],
                             [bestMaxX - width, maxY], [bestMinX, maxY]
                      ],function (i, e) {
                          if (!found && (e[0] > rootx && e[1] > rooty)) {
                              nest = e;
                              found=true;
                              return false;
                  }
             });
             
             // default to lower-right corner if nothing fit inside the boundaries of the image
             
             if (!found) {
                 nest=[maxX,maxY];
             }
        }
        return nest;
    };
} (jQuery));
