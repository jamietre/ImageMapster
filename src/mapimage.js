/* mapdata.js
   the MapData object, repesents an instance of a single bound imagemap
*/

(function ($) {

    var m = $.mapster, 
        u = m.utils,
        ap=[];
    /**
     * An object encapsulating all the images used by a MapData.
     */
    
    m.MapImages = function(options) {
        this.options = options;
        this.clear();
    };

    
    m.MapImages.prototype = {
        constructor: m.MapImages,

        /* interface to make this array-like */

        slice: function() {
            return ap.slice.apply(this,arguments);
        },
        splice: function() {
            ap.slice.apply(this.status,arguments);
            var result= ap.slice.apply(this,arguments);
            return result;
        },
     
        /** 
         * a boolean value indicates whether all images are done loading 
         * @return {bool} true when all are done
         */
        complete: function() {
            return $.inArray(false, this.status) < 0;
        },
        
        /**
         * Save an image in the images array and return its index 
         * @param  {Image} image An Image object
         * @return {int} the index of the image
         */
        
        _add: function(image) {
            var index = ap.push.call(this,image)-1;
            this.status[index] = false;
            return index;
        },

        /**
         * Return the index of an Image within the images array
         * @param  {Image} img An Image
         * @return {int} the index within the array, or -1 if it was not found
         */
        
        indexOf: function(image) {
            return $.inArray(image, this);
        },
        
        /**
         * Clear this object and reset it to its initial state after binding.
         */
        
        clear:function() {
         
            if (this.ids && this.ids.length>0) {
                $.each(this.ids,function(i,e) {
                    delete this[e];
                });
            }
            
            /**
             * A list of the cross-reference IDs bound to this object
             * @type {string[]}
             */
            
            this.ids=[];

            /**
             * Length property for array-like behavior, set to zero when initializing. Array prototype
             * methods will update it after that.
             * 
             * @type {int}
             */
            
            this.length=0;

            /**
             * the loaded status of the corresponding image
             * @type {boolean[]}
             */
            
            this.status= [];
            
            
            /**
             * the Image objects for each image used in the map
             * @type {Image[]}
             */  
            
            this.splice(0);
            
            /**
             * The number of attempts to make to before giving up, calculate from the config timeout.
             * @type {boolean}
             */
            
            this.bindTries = this.options.configTimeout / 200;
        },

        /**
         * Bind an image to the map and add it to the queue to be loaded; return an ID that
         * can be used to reference the
         * 
         * @param {Image|string} image An Image object or a URL to an image
         * @param {string} [id] An id to refer to this image
         * @returns {int} an ID referencing the index of the image object in 
         *                map_data.images
         */
     
        add: function(image,id) {
            var index,src,me = this;

            if (!image) { return; }

            if (typeof image === 'string') {
                src = image;
                image = me[src];
                if (typeof image==='object') {
                    return me.indexOf(image);
                }

                image = $('<img />')
                    .addClass('mapster_el')
                    .hide();

                index=me._add(image[0]);
                
                image
                    .bind('load',function(e) {
                        me.imageLoaded.call(me,e);
                    })
                    .bind('error',function(e) {
                        me.imageLoadError.call(me,e);
                    });
                
                image.attr('src', src);
            } else {

                // use attr because we want the actual source, not the resolved path the browser will return directly calling image.src
                
                index=me._add($(image)[0]);
            }
            if (id) {
                if (this[id]) {
                    throw(id+" is already used or is not available as an altImage alias.");
                }
                me.ids.push(id);
                me[id]=me[index];
            }
            return index;
        },

        /**
         * Bind the images in this object, 
         * @param  {boolean} retry when true, indicates that the function is calling itself after failure 
         * @return {Promise} a promise that resolves when the images have finished loading
         */
        
        bind: function(retry) {
            var me = this,
                triesLeft = me.bindTries,

            /* A recursive function to continue checking that the images have been 
               loaded until a timeout has elapsed */

            check=function() {
                var i;

                // refresh status of images
                
                i=me.length;

                while (i-->0) {
                    if (!me.isLoaded(i)) {
                        break;
                    }
                }

                // check to see if every image has already been loaded
                
                if (me.complete()) {
                    me.resolve();
                } else {
                    // to account for failure of onLoad to fire in rare situations
                    if (triesLeft-- > 0) {
                        me.imgTimeout=window.setTimeout(function() {
                            check.call(me,true);
                        }, 50);
                    } else {
                        me.imageLoadError.call(me);
                    }
                }
            
            };

            me.deferred=u.defer();
            
            check();
            return me.deferred.promise;
        },
   
        resolve: function() {
            var me=this,
                resolver=me.deferred;
                
            if (resolver) {
                // Make a copy of the resolver before calling & removing it to ensure
                // it is not called twice
                me.deferred=null;
                resolver.resolve();
            }
        },
        /**
         * Event handler for image onload
         * @param  {object} e jQuery event data
         */
        
        imageLoaded: function(e) {
            var me=this,
                index = me.indexOf(e.target);

            if (index>=0) {

                me.status[index] = true;
                if ($.inArray(false, me.status) < 0) {
                    me.resolve();
                }
            }
        },
        
        /**
         * Event handler for onload error
         * @param  {object} e jQuery event data
         */
        
        imageLoadError: function(e) {
            clearTimeout(this.imgTimeout);
            this.triesLeft=0;
            var err = e ? 'The image ' + e.target.src + ' failed to load.' : 
                'The images never seemed to finish loading. You may just need to increase the configTimeout if images could take a long time to load.';
            throw err;
        },
        /**
         * Test if the image at specificed index has finished loading
         * @param  {int}  index The image index
         * @return {boolean} true if loaded, false if not
         */
        
        isLoaded: function(index) {
            var img,
                me=this,
                status=me.status;

            if (status[index]) { return true; }
            img = me[index];
            
            if (typeof img.complete !== 'undefined') {
                status[index]=img.complete;
            } else {
                status[index]=!!u.imgWidth(img);
            }
            // if complete passes, the image is loaded, but may STILL not be available because of stuff like adblock.
            // make sure it is.

            return status[index];
        }
    };
    } (jQuery));