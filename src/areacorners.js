/* areacorners.js
   determine the best place to put a box of dimensions (width,height) given a circle, rect or poly
*/

(function ($) {
    var u=$.mapster.utils;
    u.areaCorners = function (areaEls, width, height) {
        var found, minX, minY, maxX, maxY, bestMinX, bestMaxX, bestMinY, bestMaxY, curX, curY, nest, j,
           iCoords,radius,angle,area,
           coords=[];

        // map the coordinates of any type of shape to a poly and use the logic. simpler than using three different
        // calculation methods. Circles use a 20 degree increment for this estimation.
        
        for (j=0;j<areaEls.length;j++) {
            area=areaEls[j];
            iCoords = u.split(area.coords,parseInt);
            switch(area.shape) {
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
        }
        
        minX = minY = bestMinX = bestMinY = 999999;
        maxX = maxY = bestMaxX = bestMaxY = -1;

        for (j = coords.length - 2; j >= 0; j -= 2) {
            curX = parseInt(coords[j], 10);
            curY = parseInt(coords[j + 1], 10);
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
                          if (!found && (e[0] > 0 && e[1] > 0)) {
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
        return { tl: [minX, minY],
            br: [maxX, maxY],
            tt: nest
        };
    };
} (jQuery));
