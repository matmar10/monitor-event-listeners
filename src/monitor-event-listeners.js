/**
 * Adds event listener count profiling to the application
 *
 * @author Matthew J. Martin
 */
(function($){

    function defaultIdentifierGeneratorCallback(element) {
        var $element = $(element);
        return $element.attr('tagName') + '#' + $element.attr('id') + '.' + $element.attr('class');
    }

    $.monitorEventListeners = {

        defaults: {

            identifier: defaultIdentifierGeneratorCallback,

            bind: ['$.fn.on'],
            unbind: ['$.fn.off'],

            visualizerId: 'event_listener_bindings_visualizer',
            visualizerCss: {
                position: 'fixed',
                bottom: 0,
                left: 0,
                "z-index": 1000
            },

            visualizerCountClass: "count",
            visualizerCountCss: {
                background: 'white',
                color: 'black',
                "font-weight": 'bold',
                "font-size": "9px",
                "text-align": "center",
                "width": "50px"
            },

            visualizerNewItemClass: 'event-listener-item',
            visualizerNewItemCss: {
                width: 50,
                height: 3,
                border: '1px solid white',
                "border-bottom": 'none'
            },

            log: function(message) {
                console.log(message);
            },

            logAddedHeader: "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
            logAddedFooter: "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
            logRemovedHeader: "------------------------------------------------------------------------------------",
            logRemovedFooter: "------------------------------------------------------------------------------------"

        }
    };

    $.extend($.fn, {

        /**
         * Creates a new profiler and attaches a visualizer to the set of matched elements
         *
         * @param options object Optional options to override the defaults
         * @return Zepto The matched elements
         */
        monitorEventListeners: function(options) {

            var o = $.extend(true, {}, $.monitorEventListeners.defaults, options), // instance options; true signifies deep-cloning
                events = {},
                totalCount = 0,
                $visualizer = $('<div></div>')
                    .attr('id', o.visualizerId)
                    .css(o.visualizerCss),
                $container = $('<div></div>').prependTo($visualizer),
                $visualizerCount = $('<div></div>')
                    .addClass(o.visualizerCountClass)
                    .css(o.visualizerCountCss)
                    .appendTo($visualizer);

            updateTotalCount();

            function getIdentifier(element) {
                var $element = $(element),
                    identifier = $element.data('identifier');
                if(!identifier) {
                    identifier = o.identifier(element);
                    $element.data('identifier', identifier);
                }
                return identifier;
            }

            function addVisualizerItem() {
                var $newItem = $('<div></div>').addClass(o.visualizerNewItemClass);
                $newItem.appendTo($container).css(o.visualizerNewItemCss);
                updateTotalCount();
            }

            function removeVisualizerItem() {
                $visualizer.find('.event-listener-item').first().remove();
                updateTotalCount();
            }

            function updateTotalCount() {
                $visualizerCount.text('total: ' + totalCount);
                refreshColor();
            }

            function refreshColor() {
                var getColorProperty = function(red, green) {
                        return 'rgb(' + red + ', ' + green + ', 0)';
                    },
                    setColorProperty = function(red, green) {
                        var colorValue = getColorProperty(red, green);
                        $visualizer.find('.' + o.visualizerNewItemClass)
                            .css({
                                "background-color": colorValue
                            });
                    };

                if(totalCount <= 50) {
                    setColorProperty(0, 255 - (totalCount * 2));
                    return;
                }

                if(totalCount <= 205) {
                    setColorProperty(totalCount + 50, 0);
                    return;
                }

                setColorProperty(255, 0);
            }

            function logListenerCreated(element, event) {
                o.log(o.logAddedHeader);
                var identifier = getIdentifier(element);
                events[identifier] = events[identifier] || {};
                events[identifier][event] = events[identifier][event] || 0;
                events[identifier][event]++;
                totalCount++;
                addVisualizerItem();
                o.log(identifier + " >> " + event + " BOUND (total: " + events[identifier][event] + ")");
                o.log(o.logAddedFooter);
            }

            function logListenerDestroyed(element, event) {
                var identifier = getIdentifier(element);
                events[identifier] = events[identifier] || {};
                events[identifier][event] = events[identifier][event] || 0;
                events[identifier][event]--;
                totalCount--;
                removeVisualizerItem();
                o.log(o.logRemovedHeader);
                o.log(identifier + " >> " + event + " UNBOUND (total: " + events[identifier][event] + ")");
                o.log(o.logRemovedFooter);
            }

            if('string' === $.type(o.bind)) {
                o.bind = [o.bind];
            }

            $.each(o.bind, function(i, bindFunctionName) {
                var originalBind = null,
                    newBind = function() {
                        logListenerCreated(this, arguments[0]);
                        originalBind.apply(this, arguments);
                    };
                eval('originalBind = ' + bindFunctionName + ';');
                eval(bindFunctionName + ' = newBind;');
            });

            if('string' === $.type(o.unbind)) {
                o.unbind = [o.unbind];
            }

            $.each(o.unbind, function(i, unbindFunctionName) {
                var originalUnbind = null,
                    newUnbind = function() {
                        logListenerDestroyed(this, arguments[0]);
                        originalUnbind.apply(this, arguments);
                    };
                eval('originalUnbind = ' + unbindFunctionName + ';');
                eval(unbindFunctionName + ' = newUnbind;');
            });

            return $(this).append($visualizer);
        }
    });

})(Zepto);
