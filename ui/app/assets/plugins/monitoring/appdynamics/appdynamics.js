/*
 Copyright (C) 2014 Typesafe, Inc <http://typesafe.com>
 */
define([
  "main/plugins",
  "services/monitoring/appdynamicscontroller",
  "services/sbt",
  "../monitoringInstaller",
  "text!./appdynamics.html"
], function(
  plugins,
  appdynamics,
  sbt,
  monitoringInstaller,
  tpl
) {

  var downloadDescriptions = {
    'authenticating': 'Authenticating',
    'downloadComplete': 'Download Complete',
    'validating': 'Validating',
    'extracting': 'Extracting',
    'complete': 'Complete'
  };

  var selectedTab = ko.observable("notice");
  var available = ko.computed(function() {
    return appdynamics.available();
  });
  var needProvision = ko.computed(function () {
    return !available();
  });

  var username = ko.observable();
  var password = ko.observable();
  var usernameInvalid = ko.observable();
  var passwordInvalid = ko.observable();
  var downloading = ko.observable("");

  var hostName = ko.observable(appdynamics.hostName());
  var port = ko.observable(appdynamics.port());
  var sslEnabled = ko.observable(appdynamics.sslEnabled());
  var accountName = ko.observable(appdynamics.accountName());
  var accessKey = ko.observable(appdynamics.accessKey());
  var nodeName = ko.observable(appdynamics.nodeName());
  var tierName = ko.observable(appdynamics.tierName());
  var isProjectEnabled = ko.computed(function () {
    return appdynamics.projectEnabled();
  });

  var hostNameInvalid = ko.computed(function() {
    return !appdynamics.validHostName.test(hostName());
  });

  var portInvalid = ko.computed(function () {
    return (!appdynamics.validPort.test(port()));
  });

  var nodeNameInvalid = ko.computed(function() {
    return !appdynamics.validNodeName.test(nodeName());
  });

  var tierNameInvalid = ko.computed(function() {
    return !appdynamics.validTierName.test(tierName());
  });

  var accountNameInvalid = ko.computed(function () {
    return (!appdynamics.validAccountName.test(accountName()));
  });

  var accessKeyInvalid = ko.computed(function () {
    return (!appdynamics.validAccessKey.test(accessKey()));
  });

  var provisionAppDynamics = function(x,e) {
    e.preventDefault();
    error("");
    appdynamics.setObserveProvision(provisionObserver);
    appdynamics.provision(username(), password());
  };

  var deprovisionAppDynamics = function () {
    error("");
    appdynamics.deprovision();
  };

  var provisionObserver = function(m) {
    var event = m.event;
    var message = "";
    if (event.type === "provisioningError") {
      message = "Error provisioning AppDynamics: " + event.message;
      error(message);
    } else if (event.type === "downloading") {
      message = "Downloading: " + event.url;
    } else if (event.type === "progress") {
      message = "";
      if (event.percent) {
        message = event.percent.toFixed(0) + "%";
      } else {
        message = event.bytes + " bytes";
      }
    } else {
      message = downloadDescriptions[event.type] || "UNKNOWN STATE";
    }

    if (event.type !== "provisioningError") {
      downloading(message);
    } else {
      downloading('');
    }

    if (event.type === "complete" || event.type === "provisioningError") {
      appdynamics.unsetObserveProvision();
    }
  };

  var canSave = ko.computed(function () {
    return (appdynamics.validNodeName.test(nodeName()) &&
      appdynamics.validTierName.test(tierName()) &&
      appdynamics.validHostName.test(hostName()) &&
      appdynamics.validPort.test(port()) &&
      appdynamics.validAccountName.test(accountName()) &&
      appdynamics.validAccessKey.test(accessKey()));
  });

  var changed = ko.computed(function () {
    return (appdynamics.nodeName() !== nodeName() ||
      appdynamics.tierName() !== tierName() ||
      appdynamics.sslEnabled() !== sslEnabled() ||
      appdynamics.hostName() !== hostName() ||
      appdynamics.port() !== port() ||
      appdynamics.accountName() !== accountName() ||
      appdynamics.accessKey() !== accessKey());
  });

  var shouldSave = ko.computed(function () {
    return (canSave() && changed());
  });

  var saveConfig = function(x,e) {
    e.preventDefault();
    if (appdynamics.validNodeName.test(nodeName()) &&
      appdynamics.validTierName.test(tierName()) &&
      appdynamics.validHostName.test(hostName()) &&
      appdynamics.validPort.test(port()) &&
      appdynamics.validAccountName.test(accountName()) &&
      appdynamics.validAccessKey.test(accessKey())) {
      appdynamics.nodeName(nodeName());
      appdynamics.tierName(tierName());
      appdynamics.hostName(hostName());
      appdynamics.port(port());
      appdynamics.accountName(accountName());
      appdynamics.accessKey(accessKey());
      appdynamics.sslEnabled(sslEnabled());
      return true;
    } else {
      // appdynamics.removeAppDynamics();
      return false;
    }
  };

  var cancelSave = function() {
    hostName((function () {
      var hn = appdynamics.hostName();
      if (hn === "") {
        return ".saas.appdynamics.com";
      } else {
        return hn;
      }
    })());
    port(appdynamics.port());
    sslEnabled(appdynamics.sslEnabled());
    accountName(appdynamics.accountName());
    accessKey(appdynamics.accessKey());
    nodeName(appdynamics.nodeName());
    tierName(appdynamics.tierName());
  };

  var error = ko.observable();

  var enableAppDynamics = function () {
    sbt.tasks.actions.kill();
    appdynamics.enableProject();

    monitoringInstaller({
      provider: "AppDynamics",
      addingFile: "project/sbt-ad.sbt",
      addedFile: appdynamics.available,
      echoReady: sbt.tasks.echoReady
    });

  };

  var State = {
    needProvision: needProvision,
    provisionAppDynamics: provisionAppDynamics,
    username: username,
    password: password,
    usernameInvalid: usernameInvalid,
    passwordInvalid: passwordInvalid,
    downloading: downloading,
    deprovisionAppDynamics: deprovisionAppDynamics,
    hostName: hostName,
    port: port,
    sslEnabled: sslEnabled,
    accountName: accountName,
    accessKey: accessKey,
    nodeName: nodeName,
    tierName: tierName,
    nodeNameInvalid: nodeNameInvalid,
    tierNameInvalid: tierNameInvalid,
    hostNameInvalid: hostNameInvalid,
    portInvalid: portInvalid,
    accountNameInvalid: accountNameInvalid,
    accessKeyInvalid: accessKeyInvalid,
    canSave: canSave,
    changed: changed,
    shouldSave: shouldSave,
    saveConfig: saveConfig,
    cancelSave: cancelSave,
    error: error,
    selectedTab: selectedTab,
    isProjectEnabled: isProjectEnabled,
    enableAppDynamics: enableAppDynamics
  };

  return {
    render: function () {
      return ko.bindhtml(tpl, State);
    }
  }
});
