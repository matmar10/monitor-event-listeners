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
            eventListenerCallbacks = {},
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

        function removeVisualizerItems(numberItems) {
            $visualizer.find('.event-listener-item').slice(0, numberItems).remove();
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

        function logListenerCreated(element, event, callback) {
            var eventList = event.split(' '),
                identifier = getIdentifier(element);

            // easy way to compare referential equality of the callback
            if(!callback.prototype.monitorEventListenerIdentifier) {
                var id = (new Date).getTime();
                window.console.log("assigning ID: " + id);
                callback.prototype.monitorEventListenerIdentifier = id;
            }

            events[identifier] = events[identifier] || {};
            eventListenerCallbacks[identifier] = eventListenerCallbacks[identifier] || {};

            $.each(eventList, function(i, eventName) {
                var previousCount = events[identifier][eventName] || 0,
                    count = previousCount;

                if(~$.inArray(eventName, o.ignoreEvents)) {
                    return; // continue looping but ignore this event
                }

                eventListenerCallbacks[identifier][eventName] = eventListenerCallbacks[identifier][eventName] || [];
                eventListenerCallbacks[identifier][eventName].push(callback);
                count++;
                totalCount++;
                addVisualizerItem();
                events[identifier][eventName] = count;
                o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") BOUND");
            });
        }

        function logListenerDestroyed(element, event, callback) {
            var eventList = event.split(' '),
                identifier = getIdentifier(element);

            // easy way to compare referential equality of the callback
            if(callback) {
                if(!callback.prototype.monitorEventListenerIdentifier) {
                    callback.prototype.monitorEventListenerIdentifier = (new Date).getTime();
                }
            }

            events[identifier] = events[identifier] || {};
            eventListenerCallbacks[identifier] = eventListenerCallbacks[identifier] || {};

            $.each(eventList, function(i, eventName) {
                var previousCount = events[identifier][eventName] || 0,
                    count = previousCount,
                    callbackIndex = null,
                    i = null,
                    removedCount = 0;

                if(~$.inArray(eventName, o.ignoreEvents)) {
                    return; // continue looping but ignore this event
                }

                eventListenerCallbacks[identifier][eventName] = eventListenerCallbacks[identifier][eventName] || [];

                if(!count) {
                    o.log(identifier + " >> " + eventName + " (was: 0, now: 0) UNBIND [nothing to unbind]");
                    events[identifier][eventName] = count;
                    return;
                }

                // specific callback being unbound
                if(callback) {
                    callbackIndex = $.inArray(callback, eventListenerCallbacks[identifier][eventName]);
                    // callback was never bound, this unbind will have no effect
                    if(!~callbackIndex){
                        o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") UNBOUND however provided callback NOT PREVIOUSLY BOUND; no effect");
                        return; // continue iterating
                    }

                    // remove all callbacks matching the one passed to the unbind function

                    eventListenerCallbacks[identifier][eventName] = eventListenerCallbacks[identifier][eventName].filter(function(callbackReference) {
                        if(callback.prototype.monitorEventListenerIdentifier === callbackReference.prototype.monitorEventListenerIdentifier) {
                            removedCount++;
                            return false;
                        }
                        return true;
                    });

                    // decrease count by number of matching callbacks
                    count = count - removedCount;
                    totalCount = totalCount - removedCount;
                    removeVisualizerItems(removedCount);
                    o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") UNBOUND");

                    events[identifier][eventName] = count;
                    return;
                }

                // remove ALL event listeners of this type for the elements

                totalCount = totalCount - previousCount;
                count = 0;
                eventListenerCallbacks[identifier][eventName] = [];
                removeVisualizerItems(previousCount);
                events[identifier][eventName] = count;
                o.log(identifier + " >> " + eventName + " (was: " + previousCount + ", now: " + count + ") UNBOUND");
            });
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
                    logListenerCreated(this, arguments[0], arguments[1]);
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
                    logListenerDestroyed(this, arguments[0], arguments[1]);
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

        if(!Hammer) {
            o.ignoreEvents = [];
        }

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
                if(window.console.debug) {
                    window.console.debug(message);
                    return;
                }
                window.console.log(message);
            }
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

})(Zepto || jQuery);
