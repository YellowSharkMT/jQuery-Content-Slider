;(function ( $, window, document, undefined ) {
    var pluginName = 'contentSlider';
    var defaults = {
        'display-time':5000,
        'transition-time':600,
        'pause-on-mouseover':true,

        // controlBar stuff
        'control-bar-class':pluginName + '-control-bar',
        'control-item-class':pluginName + '-control-item',
        'control-link-class':pluginName + '-control-link',
        'indicators-inside':true,           // false, true
        'indicators-horiz-align':'right',   // left, middle, right
        'indicators-vert-align': 'bottom',  // bottom, top
        'indicators-height': '30px',        // any pixel value. the container will get padded-out by this value.

        // this is for the parent container, i.e. (this.element), a/k/a $el, throughout this module
        'container-css':{'position':'relative'},
        'container-class':pluginName + '-container',
        // this is for the direct `div` children of (this.element)
        'slide-css':{'position':'absolute','top':0,'left':0},
        'slide-class':pluginName + '-slide',

        // these will be used to determine the width/height of the container (instance.$el)
        'width':'100%', // kinda arbitray, will often work though...
        'detect-width': true, // and this overrides the width value ANYWAY, and attempt to detect it, based on 1st slide
        'height':'100px', // totally arbitrary value, will at least show SOMETHING. we'll try to detect though...
        'detect-height':true // false will FORCE the height to either the value above, or one supplied in the options to the plugin
    };

    var collateral_elements = {
        $control_bar:$('<ul/>'),
        $control_item:$('<li/>'),
        $control_link:$('<a href="javascript:;"/>')
    };

    var plugin_prototype = {
        // Class properties
        ssInt:null,
        ssTo:null,
        $el:null,
        $slides:null,
        $control_bar:null,
        bool_mouse_is_over: false,

        // Class Methods
        init:function () {
            // gather the elements
            this.$el = $(this.element);
            this.$slides = this.$el.children('div')
                .hide();

            this.ApplyCSS();
            this.AttachControlBar();
            this.DoMiscSetup();
            this.StartShow(this.options['display-time']);

            return this;
        }, // init()

        ApplyCSS: function(){
            var instance = this;

            (function doParentCSS(){ // self-executing
                var block_width, block_height, block_css;
                // FIRST: do CSS for the parent container (instance.$el)
                // try and grab the width/height of the first child element:
                block_width = (instance.options['detect-width'])
                    ? $(instance.$slides[0]).width() + 'px'
                    : instance.options.width;

                block_height = (instance.options['detect-height'])
                    ? $(instance.$slides[0]).height() + 'px'
                    : instance.options.height;

                block_css = { height: block_height, width: block_width };
                // extend those properties into our existing css to-be-applied...
                $.extend(instance.options['container-css'], block_css);
                // and apply 'em.
                instance.$el
                    .css(instance.options['container-css'])
                    .addClass(pluginName)
                    .addClass(instance.options['container-class']);
            })();

            (function doSlidesCSS(){ // self-executing
                instance.$slides.each(function(z, slide){
                    // apply the CSS for ALL the slides.
                    var $slide = $(slide);
                    $slide
                        .css(instance.options['slide-css'])
                        .addClass(instance.options['slide-class']) // addx the main "slide class"
                        .addClass(instance.options['slide-class'] + '-' + (z+1)); // and add that same class, but with an index value (z+1)

                    // now handle certain items, like first one..
                    if(z === 0){ // add 'active' class, and show it...
                        $slide.addClass('active').show();
                    } else { // or the other ones... hide 'em.
                        $slide.hide();
                    }
                });
            })();

            return this;
        }, // ApplyCSS()

        AttachControlBar:function(){
            var instance = this;
            var c = instance.collateral_elements; // give it a shortname.
            var o = instance.options; // give it a shortname
            var control_els = [];

            (function initiateCollateralElements(){ // self-executing
                c.$control_bar.addClass(o['control-bar-class']);
                c.$control_item.addClass(o['control-item-class']);
                c.$control_link.addClass(o['control-link-class']);
            })(); // initiateCollateralElements

            (function createCollateralElements(){ // self-executing
                $(instance.$slides).each(function(i,slide){
                    var $new_item = c.$control_item.clone();
                    var $new_link = c.$control_link.clone();

                    $new_link
                        .text(i + 1)
                        .click(function(){
                            instance
                                .StopShow()
                                //.SlideShow()
                                .ActivateSlide(i + 1)
                                .ssInt = setInterval(function(){ instance.SlideShow(); }, instance.options['display-time']);
                        });

                    $new_item.append($new_link);
                    control_els.push($new_item);
                });

            })(); // createCollateralElements

            (function attachCollateralElements(){ // self-executing
                instance.$control_bar = c.$control_bar.clone();
                $.each(control_els, function(z,$el){
                    instance.$control_bar.append($el);
                    if(z===0){
                        $el.find('.' + instance.options['control-link-class'])
                            .addClass('active');
                    }
                });
                instance.$control_bar.appendTo(instance.$el);
            })(); // attachCollateralElements

            (function positionCollateralElements(){ // self-executing
                var bool_indicators_inside = o['indicators-inside'];
                var vert_align_value = o['indicators-vert-align'];
                var horiz_align_value = o['indicators-horiz-align'];
                var indicators_height = o['indicators-height'];


                // handle case where indicators are OUTSIDE of the parent container
                if(!bool_indicators_inside){
                    // add some padding to the container, top or bottom.... (we won't be handling left/right, that's just weird....)
                    if(vert_align_value === 'top' || vert_align_value === 'bottom'){
                        instance.$el.css('padding-' + vert_align_value, indicators_height);
                    }
                }

                // handle the horizontal positioning of the indicators
                if(horiz_align_value === 'middle'){
                    // center it horizontally
                    // push it 50% to the left, then add a negative margin of half of the width
                    instance.$control_bar.css({
                        'left':'50%',
                        'margin-left':(-1 * (instance.$control_bar.width() / 2)) + 'px'
                    });
                } else {
                    instance.$control_bar.css(horiz_align_value,'10px'); // basically: left, or right, we push it 10px off of that edge
                }

                // handle the vertical positioning of the indicators
                if(vert_align_value === 'middle'){
                    // center it vertically? this won't happen, actually. we could trap this though, throw an error or something...
                } else {
                    instance.$control_bar.css(vert_align_value,'5px'); // basically: top, or bottom, we push it 10px off of that edge
                }

            })();

            return this;
        }, // AttachControlBar()

        DoMiscSetup: function(){
            var instance = this;

            instance.$el
                .mouseover(function(){instance.bool_mouse_is_over = true;})
                .mouseout(function(){instance.bool_mouse_is_over = false;});
        }, // DoMiscSetup()

        StartShow: function(delay){
            var instance = this;
            instance.StopShow();//clear timers
            if (delay == 0) {
                instance.SlideShow();
                instance.ssInt = setInterval(function(){ instance.SlideShow(); }, instance.options['display-time']);
            }else{
                instance.ssTo = setTimeout(function(){ instance.StartShow(0); }, delay);
            }

            return this;
        }, // StartShow()

        StopShow: function(){
            clearInterval(this.ssInt);
            clearTimeout(this.ssTo);
            this.ssTo = null;
            this.ssInt = null;

            return this;
        }, // StopShow()

        SlideShow: function(){
            this.Rotate();

            return this;
        }, // SlideShow()

        Rotate: function(){
            var instance = this;

            if(instance.bool_mouse_is_over){
                setTimeout(function(){ instance.Rotate(); }, 1500);
            } else {
                var $el = $(instance.element);
                //do transition
                var $active = $el.find('div.active');
                var next_selector = 'div.'+instance.options['slide-class'];
                var $next = $active.next(next_selector);
                if (!$next.length){ $next = $el.find('div:first'); }

                var index_to_activate = ($next.index() + 1);
                instance.ActivateSlide(index_to_activate);
            }

            return this;
        }, // Rotate()

        ActivateSlide:function(index){ // note, this is the 1-based index, not the ZERO-based index.
            var instance = this;
            var $active = instance.$el.find('.' + instance.options['slide-class'] + '.active');
            var active_index = $active.index();
            var active_link_selector = '.' + instance.options['control-item-class'] + ':eq(' + active_index + ') a';
            var $active_link = instance.$control_bar.find(active_link_selector);

            var next_slide_selector = '.' + instance.options['slide-class'] + '-' + index;
            var $next = instance.$el.find(next_slide_selector);
            var next_index = $next.index();
            var next_link_selector = '.' + instance.options['control-item-class'] + ':eq(' + next_index + ') a';
            var $next_link = instance.$control_bar.find(next_link_selector);

            $active_link.removeClass('active');
            $active
                .fadeOut(instance.options['transition-time'])
                .removeClass('active');

            $next_link.addClass('active');
            $next
                .fadeIn(instance.options['transition-time'])
                .addClass('active');

            return this;
        } // ActivateSlide()
    };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this.collateral_elements = collateral_elements;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }
    // extend the plugin_prototype object into Plugin.prototype
    $.extend(Plugin.prototype, plugin_prototype);

    // -------------------------------------------------------
    // attach it all to $.fn, and make the plugin voodoo happen:
    $.fn[pluginName] = function(options){
    	if ($(this).length == 0) return false;
    	var isMethodCall = (typeof options == 'string'),
    		args = Array.prototype.slice.call(arguments, 1);
    	// prevent calls to internal methods
    	if (isMethodCall && options.substring(0, 1) == '_') { return this; }
    	// handle initialization and non-getter methods
    	return this.each(function() {
    		var instance = $(this).data(pluginName);
    		// constructor
    		(!instance && !isMethodCall &&
    			$(this).data(pluginName, new Plugin(this, options)));

    		// method call
    		(instance && isMethodCall && $.isFunction(instance[options]) &&
    			instance[options].apply(instance, args));
    	});
    }
})(jQuery, window, document);