describe("Monitor Event Listeners", function() {

    var $visualizer = null,
        testCallback = function() {
            $(this).append('<div>clicked</div>');
        };

    function findVisualizer() {
        if(!$visualizer) {
            $visualizer = $('#' + $.monitorEventListeners.defaults.visualizerId);
        }
        return $visualizer;
    }

    function findCountElement() {
        return findVisualizer().find('.' + $.monitorEventListeners.defaults.visualizerCountClass);
    }

    function findVisualizerItems() {
        return findVisualizer().find('.' + $.monitorEventListeners.defaults.visualizerNewItemClass);
    }

    it("empty visualizer created", function() {
        var $visualizer = null,
            $countElement = null;
        $('body').monitorEventListeners();
        $visualizer = findVisualizer();
        expect($visualizer.length).toEqual(1);
        $countElement = findCountElement($visualizer);
        expect($countElement.length).toEqual(1);
        expect($countElement.text()).toEqual("total: 0");
        $visalizerItems = findVisualizerItems($visualizer);
        expect($visalizerItems.length).toEqual(0);
    });

    it("count increments on bind and decrements on unbind", function() {
        var $body = $('body');

        $body.on('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 1");
        expect(findVisualizerItems().length).toEqual(1);

        $body.on('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 2");
        expect(findVisualizerItems().length).toEqual(2);

        $body.off('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 1");
        expect(findVisualizerItems().length).toEqual(1);

        $body.off('click', testCallback);
        expect(findCountElement().text()).toEqual("total: 0");
        expect(findVisualizerItems().length).toEqual(0);
    });

});