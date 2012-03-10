var cfg = {
    fullscreen : true,
    dockedItems : [
            {
                dock : 'top',
                xtype : 'toolbar',
                title : 'PhoneGap w/ Sencha Touch'
            },
            {
                dock : 'bottom',
                xtype : 'toolbar',
                ui : 'small',
                styleHtmlContent : true,
                html : '<p style="font-size:13px;text-align:center;">This file is located at<br /><b>assets/www/phonegapdemo-w-sencha.js</b></p>'
            } ],

    layout : {
        type : 'vbox',
        pack : 'center',
        align : 'stretch'
    },
    cls : 'card1',
    scroll : 'vertical',
    defaults : {
        layout : {
            type : 'hbox'
        },
        padding : 16,
        flex : 1,
        defaults : {
            xtype : 'button',
            cls : 'demobtn',
            flex : 1
        }
    }
};

cfg.items = [
        {
            items : [ {
                ui : 'round',
                text : 'Show device info',
                handler : function() {
                    if (!this.actions) {
                        this.actions = new Ext.ActionSheet(
                                {
                                    floating : true,
                                    modal : true,
                                    centered : true,
                                    height : 240,
                                    width : 260,
                                    padding : '15',
                                    html : '<div style="color:white;font-size:19px;"><b>Platform: </b>'
                                            + device.platform
                                            + '<br><b>Version: </b>'
                                            + device.version
                                            + '<br><b>UUID: </b>'
                                            + device.uuid
                                            + '<br><b>Name: </b>'
                                            + device.name
                                            + '<br><b>Screen Width: </b>'
                                            + screen.width
                                            + '<br><b>Screen Height: </b>'
                                            + screen.height
                                            + '<br><b>Color Depth: </b>'
                                            + screen.colorDepth + '</div>',
                                    dockedItems : [ {
                                        dock : 'bottom',
                                        text : 'Close',
                                        ui : 'confirm',
                                        scope : this,
                                        handler : function() {
                                            this.actions.hide();
                                        }
                                    } ]
                                });
                    }
                    this.actions.show();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Toggle Accelerometer',
                handler : function() {
                    toggleAccel();
                }
            } ]
        },
        {
            html : '<tr id="accel-data">'
                    + '<dt><b>&nbsp;&nbsp;X:&nbsp;</b></dt><td id="x">&nbsp;</td>'
                    + '<dt><b>&nbsp;&nbsp;Y:&nbsp;</b></dt><td id="y">&nbsp;</td>'
                    + '<dt><b>&nbsp;&nbsp;Z:&nbsp;</b></dt><td id="z">&nbsp;</td> </tr>',
            flex : 0.5
        },
        {
            items : [ {
                ui : 'round',
                text : 'Get location',
                handler : function() {
                    if (!this.actions) {
                        this.actions = new Ext.ActionSheet(
                                {
                                    floating : true,
                                    modal : true,
                                    centered : true,
                                    height : 320,
                                    width : 280,
                                    padding : '15',
                                    html : '<div style="color:white;font-size:16px;">'
                                            + '<span id="loclat"></span>'
                                            + '<br/><span id="loclong"></span>'
                                            + '<br/><span id="locaccur"></span>'
                                            + '<div id="mapview" style="display:none;">'
                                            + '<img style="width:220px;height:180px;" id="mapcanvas" src="" alt="Map of your location" /></div></div>',
                                    dockedItems : [ {
                                        dock : 'bottom',
                                        text : 'Close',
                                        ui : 'confirm',
                                        scope : this,
                                        handler : function() {
                                            closeLocation();
                                            this.actions.hide();
                                        }
                                    } ]
                                });
                    }
                    this.actions.show('pop');
                    getLocation();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : '<a href="tel://411" style="color:black;font-size:19px;text-decoration:none;text-align:center;">Call 411</a>'
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Beep',
                handler : function() {
                    beep();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Vibrate',
                handler : function() {
                    vibrate();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Get a picture',
                handler : function() {
                    if (!this.actions) {
                        this.actions = new Ext.ActionSheet(
                                {
                                    floating : true,
                                    modal : true,
                                    centered : true,
                                    height : 170,
                                    width : 170,
                                    ui : 'light',
                                    html : '<div id="viewport" class="viewport" style="display:none;">'
                                            + '<img style="width:105px;height:75px;" id="test_img" src="" /> </div>',
                                    dockedItems : [ {
                                        dock : 'bottom',
                                        text : 'Close',
                                        ui : 'confirm',
                                        scope : this,
                                        handler : function() {
                                            closeviewport();
                                            this.actions.hide();
                                        }
                                    } ]
                                });
                    }
                    this.actions.show('pop');
                    show_pic();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Get phone\'s contacts',
                handler : function() {
                    get_contacts();
                }
            } ]
        },
        {
            items : [ {
                ui : 'round',
                text : 'Check Network',
                handler : function() {
                    if (!this.actions) {
                        this.actions = new Ext.ActionSheet(
                                {
                                    floating : true,
                                    modal : true,
                                    centered : true,
                                    height : 140,
                                    width : 180,
                                    padding : '15',
                                    html : '<div style="color:white;font-size:19px;">'
                                            + '<span id="networktext">Getting network type . . .</span>'
                                            + '</div>',
                                    dockedItems : [ {
                                        dock : 'bottom',
                                        text : 'Close',
                                        ui : 'confirm',
                                        scope : this,
                                        handler : function() {
                                            this.actions.hide();
                                        }
                                    } ]
                                });
                    }
                    this.actions.show();
                    check_network();
                }
            } ]
        } ];

new Ext.Application({
    launch : function() {
        var panel = new Ext.Panel(cfg);
    }
});
