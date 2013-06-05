(function($, undefined) {
    'use strict';

    // no jQuery or Zepto!
    if($ === undefined) {
        throw "zepto-hammer requires either jQuery or Zepto; neither were found.";
    }

    /**
     * bind dom events
     * this overwrites addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        eventTypes
     * @param   {Function}      handler
     */
    Hammer.event.bindDom = function(element, eventTypes, handler) {
        $(element).on(eventTypes, function(ev) {
            var data = ev.originalEvent || ev;

            // IE pageX fix
            if(data.pageX === undefined) {
                data.pageX = ev.pageX;
                data.pageY = ev.pageY;
            }

            // IE target fix
            if(!data.target) {
                data.target = ev.target;
            }

            // IE button fix
            if(data.which === undefined) {
                data.which = data.button;
            }

            // IE preventDefault
            if(!data.preventDefault) {
                data.preventDefault = ev.preventDefault;
            }

            // IE stopPropagation
            if(!data.stopPropagation) {
                data.stopPropagation = ev.stopPropagation;
            }

            handler.call(this, data);
        });
    };

    /**
     * the methods are called by the instance, but with the jquery plugin
     * we use the jquery event methods instead.
     * @this    {Hammer.Instance}
     * @return  {jQuery}
     */
    /*
    Hammer.Instance.prototype.on = function(types, handler) {
        return $(this.element).on(types, handler);
    };
    Hammer.Instance.prototype.off = function(types, handler) {
        return $(this.element).off(types, handler);
    };*/


    /**
     * trigger events
     * this is called by the gestures to trigger an event like 'tap'
     * @this    {Hammer.Instance}
     * @param   {String}    gesture
     * @param   {Object}    eventData
     * @return  {jQuery}
     */
    /*
    Hammer.Instance.prototype.trigger = function(gesture, eventData){
        var $element = $(this.element);
        if($element.has(eventData.target).length) {
            $element = $(eventData.target);
        }

        return $element.trigger({
            type: gesture,
            gesture: eventData
        });
    };*/


    /**
     * jQuery plugin
     * create instance of Hammer and watch for gestures,
     * and when called again you can change the options
     * @param   {Object}    [options={}]
     * @return  {jQuery}
     */
    $.fn.hammer = function(options) {
        return this.each(function() {
            var $element = $(this),
                rawElement = $element.get(0),
                instance = rawElement.hammer;
            // create new hammer instance
            if(!instance) {
                rawElement.hammer = new Hammer(this, options || {});
                return;
            }
            // change the options
            if(instance && options) {
                Hammer.utils.extend(instance.options, options);
            }
        });
    };

})(window.jQuery || window.Zepto);