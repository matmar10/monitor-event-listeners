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

    var EventListenerMonitor = function(options) {

        var o = $.extend(true, {}, $.monitorEventListeners.defaults, options), // instance options; true signifies deep-cloning
            context = this,
            events = {},
            originalFunctions = {},
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

        /**
         * Gets the visualizer element
         *
         * @returns jQuery,Zepto Returns the visualizer element associated with this monitor instance
         */
        this.visualizer = function () {
            return $visualizer;
        };

        /**
         * Gets the options
         *
         * @returns object Returns the instance options object
         */
        this.options = function () {
            return o;
        };

        /**
         * Initializes the event binding/unbinding proxyy functions
         */
        this.initializeBindingProxies = function () {

            if('string' === $.type(o.bind)) {
                o.bind = [o.bind];
            }

            $.each(o.bind, function(i, bindFunctionName) {
                var newBind = function() {
                        logListenerCreated(this, arguments[0]);
                    originalFunctions[bindFunctionName].apply(this, arguments);
                    };
                eval('originalFunctions[bindFunctionName] = ' + bindFunctionName + ';');
                eval(bindFunctionName + ' = newBind;');
            });

            if('string' === $.type(o.unbind)) {
                o.unbind = [o.unbind];
            }

            $.each(o.unbind, function(i, unbindFunctionName) {
                var newUnbind = function() {
                        logListenerDestroyed(this, arguments[0]);
                        originalFunctions[unbindFunctionName].apply(this, arguments);
                    };
                eval('originalFunctions[unbindFunctionName] = ' + unbindFunctionName + ';');
                eval(unbindFunctionName + ' = newUnbind;');
            });
        };

        /**
         * Reverts proxies to the original functions
         */
        this.revertBindingProxies = function () {
            $.each(originalFunctions, function(functionName, originalFunction) {
                eval(functionName + ' = originalFunction;');
            });
        };

        /**
         * Cleans up the listener
         */
        this.destroy = function () {
            context.revertBindingProxies();
            $visualizer.remove();
        };

        this.initializeBindingProxies();
    };

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
         * @return jQuery,Zepto The matched elements
         */
        monitorEventListeners: function (options) {

            var instance = null,
                $visualizer = null;

            if('string' === $.type(options)) {
                if('destroy' === options) {
                    instance = $(this).get(0).monitorEventListener;
                    instance.destroy();
                }
                return this;
            }


            // create a new instance and visualizer
            instance = new EventListenerMonitor(options);
            $visualizer = instance.visualizer();
            $(this).get(0).monitorEventListener = instance;
            return $(this).append($visualizer);
        }
    });

})(Zepto);
