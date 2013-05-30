monitor-event-listeners
=======================

Monitors event listener binding and unbinding and displays a visualization as memory-leak grows.

This plugin works for jQuery and Zepto by default for calls made to $().on and $().off methods.

Installation
------------

Put lib/monitor-event-listeners.js into a publicly accessible directory of your application.

Initialize the plugin:

```HTML
<script type="text/javascript">
$('body').monitorEventListeners();
</script>
```

Options
-------

By default, it's configureded to monitor all calls to $().on and $().off methods; 
additional methods to listen for can be added by name:

```HTML
<script type="text/javascript">
$('body').monitorEventListeners({
    bind: ['$.fn.on', '$.fn.bind', '$.fn.myCustomEventListenerMethod'],
    unbind: ['$.fn.off', '$.fn.unbind']
});
</script>
```

All options can be customized. Defaults are listed in `$.monitorEventListeners.defaults`:

```JS
$('body').monitorEventListeners({
    logAddedHeader: "==== LISTENER WAS ADDED ===",
    logAddedFooter: "==========================="
});
```

The plugin can be destroyed with the following:

```JS
// the selector here would be whatever you used to initialize the plugin
$('body').monitorEventListeners('destroy');
```

Tests
-----

A minimal set of unit tests are included. To run them, simply open `test/spec-runner.html`


