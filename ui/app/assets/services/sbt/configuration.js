/*
 Copyright (C) 2014 Typesafe, Inc <http://typesafe.com>
 */
define([
  './tasks',
  'services/ajax',
  'generated/dependencies'
], function (
  tasks,
  ajax,
  dependencies
) {

  // plugin information
  var backgroundRunPluginFileLocation = "/project/sbt-ui.sbt";
  var backgroundRunPluginFileContent = "// This plugin represents functionality that is to be added to sbt in the future\n\n" +
    "addSbtPlugin(\"org.scala-sbt\" % \"sbt-core-next\" % \""+dependencies.sbtCoreNextVersion+"\")";
  var uiFileEchoSettings = "\n\nfork in run := true";

  // this file isn't required to exist, if it doesn't we should create
  var buildFileLocation = "/build.sbt";

  var echoPluginFileLocation = "/project/inspect.sbt";
  var echoDefaultPluginFileContent = "// This plugin runs apps with the \"echo\" trace infrastructure which backs up the Inspect functionality in Activator\n\n" +
    "addSbtPlugin(\"com.typesafe.sbt\" % \"sbt-echo\" % \""+dependencies.echoVersion+"\")";
  var echoPlayPluginFileContent = "// This plugin runs apps with the \"echo\" trace infrastructure (with Play support) which backs up the Inspect functionality in Activator\n\n" +
    "addSbtPlugin(\"com.typesafe.sbt\" % \"sbt-echo-play\" % \""+dependencies.echoVersion+"\")";

  var echoPluginFileContent = ko.computed(function() {
    return tasks.isPlayApplication() ? echoPlayPluginFileContent : echoDefaultPluginFileContent;
  });

  var playForkRunPluginFileLocation = "/project/play-fork-run.sbt";
  var playForkRunPluginFileContent = "// This plugin adds forked run capabilities to Play projects which is needed for Activator.\n\n" +
    "addSbtPlugin(\"com.typesafe.play\" % \"sbt-fork-run-plugin\" % \""+dependencies.playVersion+"\")";

  var addedEchoFile = ko.observable(false);
  var addedBackgroundFile = ko.observable(false);
  var addedForkInRun = ko.observable(false);
  var addedPlayForkRun = ko.observable(false);

  function checkFileContent(path, content, callback, appendTofile){
    return $.ajax({
      url: '/api/local/show',
      type: 'GET',
      dataType: 'text',
      data: { location: path }
    }).error(function(e) {
      tasks.clientReady(false);
      // File is not here / can't be opened
      ajax.create(path, false, content).then(callback);
    }).success(function(data) {
      // File is here
      if (data.indexOf(content) >= 0){
        callback();
      } else {
        ajax.save(path, appendTofile?data+content:content).success(callback);
      }
    })
  }

  // On start, we ensure that we have a sbt-ui.sbt file and the corresponding config in build.sbt
  checkFileContent(serverAppModel.location+backgroundRunPluginFileLocation, backgroundRunPluginFileContent, function() {
    addedBackgroundFile(true);
  });

  checkFileContent(serverAppModel.location+buildFileLocation, uiFileEchoSettings, function() {
    addedForkInRun(true);
  }, true);

  checkFileContent(serverAppModel.location+playForkRunPluginFileLocation, playForkRunPluginFileContent, function () {
    addedPlayForkRun(true);
  });

  var echoReady = ko.computed(function() {
    // TODO this is completely broken because applicationReady is probably true to begin with,
    // then temporarily false AFTER we edit all the build files, but echoReady is going to
    // be briefly true before we restart (when we want it to be true only after).
    // I think we should replace applicationReady with checking that the needed tasks are
    // present in the build.
    return (tasks.applicationReady() && addedEchoFile() && addedBackgroundFile() && addedForkInRun() && addedPlayForkRun());
  });

  function echoInstalledAndReady(callback){
    if (echoReady()) callback();
    else {
      checkFileContent(serverAppModel.location+echoPluginFileLocation, echoPluginFileContent(), function() {
        addedEchoFile(true);
      });
      var subscription = echoReady.subscribe(function(ready) {
        if (ready){
          callback();
          subscription.dispose();
        }
      });
    }
  }

  return {
    echoInstalledAndReady: echoInstalledAndReady,
    addedEchoFile:         addedEchoFile,
    echoReady:             echoReady
  };
});
