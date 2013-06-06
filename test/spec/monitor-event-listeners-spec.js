describe("Monitor Event Listeners Plugin", function() {

    beforeEach(function() {
        $('body').monitorEventListeners();
    });

    afterEach(function() {
        $('body').monitorEventListeners('destroy');
    });

    it("visualizer created, count increments on bind, and count decrements on unbind", function() {

        function findVisualizer() {
            return $('#' + $.monitorEventListeners.defaults.visualizerId);
        }

        function findCountElement() {
            return findVisualizer().find('.' + $.monitorEventListeners.defaults.visualizerCountClass);
        }

        function findVisualizerItems() {
            return findVisualizer().find('.' + $.monitorEventListeners.defaults.visualizerNewItemClass);
        }

        var $visualizer = null,
            $body = $('body'),
            testCallback = function() {
                $(this).append('<div>clicked</div>');
            };

        $visualizer = findVisualizer();
        expect($visualizer.length).toEqual(1);
        $countElement = findCountElement($visualizer);
        expect($countElement.length).toEqual(1);
        expect($countElement.text()).toEqual("total: 0");
        $visalizerItems = findVisualizerItems($visualizer);
        expect($visalizerItems.length).toEqual(0);

        $body.on('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 1");
        expect(findVisualizerItems().length).toEqual(1);

        $body.on('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 2");
        expect(findVisualizerItems().length).toEqual(2);

        $body.off('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 0");
        expect(findVisualizerItems().length).toEqual(0);

        $body.monitorEventListeners('destroy');
        $visualizer = findVisualizer();
        expect($visualizer.length).toEqual(0);
    });

    it("ignores unbinding of not-bound callbacks", function() {

        var $body = $('body'),
            $counter = $body.find('#event_listener_bindings_visualizer .count'),
            $testLink = $('<a href="#foo">Test Link</a>').appendTo('body'),
            clicksCount = 0,
            initFunction = function () {
                var exampleCallback = function(eventObject) {
                    clicksCount++;
                    eventObject.preventDefault();
                };
                $testLink
                    .off('click', exampleCallback) // this should have no effect
                    .on('click', exampleCallback);
            },
            exampleCallback2 = function(eventObject) {
                clicksCount++;
                eventObject.preventDefault();
            };

        initFunction();
        $testLink.trigger('click');
        expect($counter.text()).toEqual("total: 1");
        expect(clicksCount).toEqual(1);

        // unbinding inside the init has no effect
        initFunction();
        $testLink.trigger('click');
        expect($counter.text()).toEqual("total: 2");
        expect(clicksCount).toEqual(3);

        // unbind all
        $testLink.off('click');
        $testLink.trigger('click');
        expect($counter.text()).toEqual("total: 0");
        expect(clicksCount).toEqual(3);

        $testLink.on('click', exampleCallback2);
        $testLink.trigger('click');
        expect($counter.text()).toEqual("total: 1");
        expect(clicksCount).toEqual(4);

        $testLink.remove();
    });

    it("monitors unbinding specific functions", function() {

        var $body = $('body'),
            $counter = $body.find('#event_listener_bindings_visualizer .count'),
            $testLink = $('<a href="#foo">Test Link</a>').appendTo('body'),
            clicksCount = 0,
            exampleCallback = function(eventObject) {
                clicksCount++;
                eventObject.preventDefault();
            },

            exampleCallback2 = function(eventObject) {
                clicksCount++;
                eventObject.preventDefault();
            };

        // one bind, increments one per click
        $testLink.on('click', exampleCallback);
        expect($counter.text()).toEqual("total: 1");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(1);

        // two bound, increments two per click
        $testLink.on('click', exampleCallback);
        expect($counter.text()).toEqual("total: 2");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(3);

        // three bound, increments three per click
        $testLink.on('click', exampleCallback2);
        expect($counter.text()).toEqual("total: 3");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(6);

        // four bound, increments four per click
        $testLink.on('click', exampleCallback2);
        expect($counter.text()).toEqual("total: 4");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(10);

        // now unbind

        // two bound, increments two per click
        $testLink.off('click', exampleCallback);
        expect($counter.text()).toEqual("total: 2");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(12);

        // zero bound, no change on click
        $testLink.off('click', exampleCallback2);
        expect($counter.text()).toEqual("total: 0");
        $testLink.trigger('click');
        expect(clicksCount).toEqual(12);

        $testLink.remove();
    });


});