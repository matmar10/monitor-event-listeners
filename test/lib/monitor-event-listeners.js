/**
 * Adds event listener count profiling to the application
 *
 * @author Matthew J. Martin
 */
(function($){

    function defaultIdentifierGeneratorCallback($element) {
        var identifier = $element.data('monitor-event-listeners-identifier') || '',
            generateIdentifier = function ($element) {
                var node = $element.get(0),
                    nodeName = null,
                    id =  $element.attr('id'),
                    cssClasses = $element.attr('class');

                if(!$element.length) {
                    return '[empty collection]';
                }

                nodeName = node.nodeName;

                if(nodeName) {
                    identifier += nodeName.toLowerCase();
                } else {
                    nodeName = $element.get(0).tagName;
                    if(nodeName) {
                        identifier += nodeName.toLowerCase();
                    } else {
                        identifier += 'undefined';
                    }
                }
                if(id) {
                    identifier += '#' + id;
                }
                if(cssClasses) {
                    identifier += '.' + cssClasses.replace(/ /, '.');
                }
                $element.data('monitor-event-listeners-identifier', identifier);
                return identifier;
            };

        if('' === identifier) {
            identifier = generateIdentifier($element);
        }

        return identifier;
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
            var eventList = event.split(' '),
                identifier = getIdentifier(element);

            events[identifier] = events[identifier] || {};

            $.each(eventList, function(i, eventName) {
                var previousCount = events[identifier][eventName] || 0,
                    count = previousCount;

                if(~$.inArray(eventName, o.ignoreEvents)) {
                    return; // continue looping but ignore this event
                }

                count++;
                totalCount++;
                addVisualizerItem();
                o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") BOUND");
                events[identifier][eventName] = count;
            });
        }

        function logListenerDestroyed(element, event) {
            var eventList = event.split(' '),
                identifier = getIdentifier(element);

            events[identifier] = events[identifier] || {};

            $.each(eventList, function(i, eventName) {
                var previousCount = events[identifier][eventName] || 0,
                    count = previousCount;

                if(~$.inArray(eventName, o.ignoreEvents)) {
                    return; // continue looping but ignore this event
                }

                if(count > 0) {
                    count--;
                    totalCount--;
                    removeVisualizerItem();
                    o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") UNBOUND");
                } else {
                    o.log(identifier + " >> " + eventName + " (was: 0, now: 0) UNBIND [nothing to unbind]");
                }
                events[identifier][eventName] = count;
            });

            //o.log(o.logRemovedHeader);

            //o.log(o.logRemovedFooter);
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
                    return this;
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
                    return this;
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

            // work around Hammer.js touch event weirdness
            ignoreEvents: [
                'touchstart',
                'mousedown',
                'touchstart',
                'mousedown',
                'touchmove',
                'mousemove',
                'touchend',
                'touchcancel',
                'mouseup'
            ],

            bind: ['$.fn.on' ],
            unbind: ['$.fn.off' ],

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
                window.console.debug(message);
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
