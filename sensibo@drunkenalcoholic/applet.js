const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const Util = imports.misc.util;
const Gettext = imports.gettext;
const Main = imports.ui.main;
const UUID = 'sensibo@drunkenalcoholic';

function ConfirmDialog() {
  this._init();
}

function MyApplet(metadata, orientation, panelHeight, instance_id) {
  this._init(metadata, orientation, panelHeight, instance_id);
};

MyApplet.prototype = {
  __proto__: Applet.TextIconApplet.prototype,

  _init: function (metadata, orientation, panelHeight, instance_id) {
    Applet.TextIconApplet.prototype._init.call(this, orientation, panelHeight, instance_id);

    try {
      this.path = metadata.path;
      this.settings = new Settings.AppletSettings(this, UUID, instance_id);

      this.set_applet_icon_symbolic_name("budgie-sensibo-monitor-icon-on");
      this.set_applet_tooltip("Sensibo Monitor On/Off");

      this.menuManager = new PopupMenu.PopupMenuManager(this);
      this.menu = new Applet.AppletPopupMenu(this, orientation);
      this.menuManager.addMenu(this.menu);

      this._contentSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._contentSection);

      // Add a Switch and set default to On
      this._SensiboON = false;
      this.OnOffSwitch = new PopupMenu.PopupSwitchMenuItem(_("[On/Off]"), this._SensiboON);
      this.menu.addMenuItem(this.OnOffSwitch);
      this.OnOffSwitch.connect('toggled', Lang.bind(this, this._doOnOffSwitch));


      // Add a pop up Menu item to display updates
      this.itemstaus = new PopupMenu.PopupMenuItem('cmd_data', { reactive: false });
      this.menu.addMenuItem(this.itemstaus);

      // bind setting
      this.bind_settings();

      // Start timer and update popup menu item
      this.getdata();

    }
    catch (e) {
      global.logError(e);
    }
  },

  _doOnOffSwitch: function () {
    if (this._SensiboON) {
      Util.spawn_async(['python3', this.path + '/sensibo.py', "--off", this.apikey, this.poduuid], Lang.bind(this, this.updateOnOff));
    } else {
      Util.spawn_async(['python3', this.path + '/sensibo.py', "--on", this.apikey, this.poduuid], Lang.bind(this, this.updateOnOff));
    }
  },

  // Get setting values and assign
  bind_settings: function () {
    for (let str of ["refreshInterval", "apikey",
      "poduuid"]) {
      this.settings.bindProperty(Settings.BindingDirection.IN,
        str,
        str,
        null,
        null);
    }
  },

  getdata: function () {
    // Update Popup label with output
    Util.spawn_async(['python3', this.path + '/sensibo.py', "--data", this.apikey, this.poduuid], Lang.bind(this, this.updateOutput));

    // Timer from settings
    if (this.refreshInterval) {
      Mainloop.timeout_add_seconds(this.refreshInterval, Lang.bind(this, this.getdata));
    }
  },

  updateOutput: function (cmd_data) {
    // Display lines 2 and 3 of output(temp and humidity)
    this.itemstaus.label.text = cmd_data.split('\n')[1] + "\n" + cmd_data.split('\n')[2];
    this.updateOnOff(cmd_data);
  },

  updateOnOff: function (data) {
    // Check if first line of output equals true and adjust switch
    if (data.split('\n')[0] == 'True') {
      this.OnOffSwitch.setToggleState(true);
      this.set_applet_icon_symbolic_name("budgie-sensibo-monitor-icon-on");
      this._SensiboON = true;
    } else {
      this.OnOffSwitch.setToggleState(false);
      this.set_applet_icon_symbolic_name("budgie-sensibo-monitor-icon");
      this._SensiboON = false;
    }
  },

  on_applet_clicked: function (event) {
    this.menu.toggle();
  },
};

function main(metadata, orientation, panelHeight, instanceId) {
  let myApplet = new MyApplet(metadata, orientation, panelHeight, instanceId);
  return myApplet;
}