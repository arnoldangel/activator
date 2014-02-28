/**
 * Copyright (C) 2013 Typesafe, Inc <http://typesafe.com>
 */
require.config({
  baseUrl:  '/public',
  // hack for now due to problem loading plugin loaders from a plugin loader
  map: {
    '*': {
      'css': '../../webjars/require-css/0.0.7/css',
      'text': '../../webjars/requirejs-text/2.0.10/text'
    }
  },
  paths: {
    commons:  'commons',
    main:     'main',
    plugins:  'plugins',
    services: 'services',
    widgets:  'widgets',
    jquery: 'vendors/jquery',
    ko: 'vendors/knockout-3.0.0'
  }
});

// Global event handlers to initialize us.
var handleVisibilityChange = function() {
  if (!document[hidden]) {
    startApp()
    document.removeEventListener(visibilityChange, handleVisibilityChange)
  }
}

var startApp = function() {
  require(['commons/templates'], function() {
    require([
      'commons/effects',
      'commons/utils',
      'services/sbt'
    ], function() {
      require(['main/init'])
    })
  })
}

require([
  // Vendors
  '../../webjars/requirejs-text/2.0.10/text',
  '../../webjars/require-css/0.0.7/css',
  'webjars!jquery',
  'webjars!knockout',
  'webjars!keymage',
  'commons/visibility'
],function(txt,css,$,ko) {
  window.ko = ko; // it's used on every page...

  if (!document[hidden]) {
    startApp()
  }
  else {
    document.addEventListener(visibilityChange, handleVisibilityChange, false)
  }
})
