'use strict';

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

function _get_vpn_ip() {
    var command_output_bytes = GLib.spawn_command_line_sync('/bin/bash -c "ifconfig vpn0 || ifconfig tun0"')[1];
    var command_output_string = '';

    for (var i = 0; i < command_output_bytes.length; ++i){
        var current_character = String.fromCharCode(command_output_bytes[i]);
        command_output_string += current_character;
    }

    var Re = new RegExp(/inet [^ ]+/g);
    var matches = command_output_string.match(Re);
    var tun0IpAddress;
    if (matches) {
        tun0IpAddress = matches[0].split(' ')[1];
    } else {
        tun0IpAddress = '';
    }
    return tun0IpAddress;
}

var VPNIPAddressIndicator = class VPNIPAddressIndicator extends PanelMenu.Button {

    _init() {
        super._init(0.0, "VPN IP Address Indicator", false);

        this.buttonText = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.buttonText);
        this._updateLabel();
    }

    _updateLabel() {
        const refreshTime = 5

        if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(refreshTime, () => {this._updateLabel();});

        this.buttonText.set_text("VPN: "+_get_vpn_ip());
    }

    stop() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
        }
        this._timeout = undefined;

        this.menu.removeAll();
    }
}

VPNIPAddressIndicator = GObject.registerClass(
    {GTypeName: 'VPNIPAddressIndicator'},
    VPNIPAddressIndicator
);

let _indicator;

function enable() {
    _indicator = new VPNIPAddressIndicator();
    Main.panel.addToStatusArea('vpn-ip-address-indicator', _indicator);
}

function disable() {
    _indicator.stop();
    _indicator.destroy();
    _indicator = null;
}