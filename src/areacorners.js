/* areacorners.js
   functions shared by scale & tooltip
*/

(function ($) {
    $.mapster.utils.areaCorners = function (coords, width, height) {
        var minX, minY, maxX, maxY, bestMinX, bestMaxX, bestMinY, bestMaxY, curX, curY, nest, j;

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
            $([[bestMaxX - width, minY - height], [bestMinX, minY - height],
                             [minX - width, bestMaxY - height], [minX - width, bestMinY],
                             [bestMaxY - height, maxX], [bestMinY, maxX],
                             [bestMaxX - width, maxY], [bestMinX, maxY]
                      ]).each(function (i, e) {
                          if (e[0] > 0 && e[1] > 0) {
                              nest = e;
                              return false;
                          }
                      });
        }

        return { tl: [minX, minY],
            br: [maxX, maxY],
            tt: nest
        };
    };
} (jQuery));
