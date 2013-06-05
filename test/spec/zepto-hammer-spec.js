describe("Zepto Hammer Event Listener Monitoring", function() {

    var $body = $('body'),
        $button = null,
        clicks = 0;

    beforeEach(function () {
        $body.monitorEventListeners();
        $button = $('<a class="btn btn-primary" href="#test_link">Test Link</a>').appendTo($body);
        clicks = 0;
    });

    afterEach(function() {
        $body.monitorEventListeners('destroy');
        $button.remove();
    });

    it("binding/un-binding to element with hammer", function() {
        var callback = function() {
            clicks++;
        };

        expect($body.find('#event_listener_bindings_visualizer .count').text()).toEqual("total: 0");

        $button.hammer().on('tap', callback);

        expect($body.find('#event_listener_bindings_visualizer .count').text()).toEqual("total: 1");

        $button.trigger('tap');
        $button.trigger('tap');
        $button.trigger('tap');
        $button.trigger('touchstart');
        expect(clicks).toEqual(4);

        $button.hammer().off('tap', callback);

        expect($body.find('#event_listener_bindings_visualizer .count').text()).toEqual("total: 0");

        // tap should now be unbound
        $button.trigger('tap');
        expect(clicks).toEqual(4);

        // also, none of the ignored events should now trigger any click
        $.each($.monitorEventListeners.defaults.ignoreEvents, function(i, eventName) {
            $button.trigger(eventName);
        });
        expect(clicks).toEqual(4);
    });

});