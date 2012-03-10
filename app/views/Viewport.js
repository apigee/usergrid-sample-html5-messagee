app.views.Viewport = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    cardSwitchAnimation: 'slide',
    initComponent: function() {
        //put instances of cards into app.views namespace
        Ext.apply(app.views, {
            msgPanel: new app.views.MsgPanel(),
            otherPanel: new app.views.OtherPanel(),
            settingsPanel: new app.views.SettingsPanel(),
            newMsgPanel: new app.views.NewMsgPanel()
        });
        //put instances of cards into viewport
        Ext.apply(this, {
            items: [
                app.views.msgPanel,
                app.views.otherPanel,
                app.views.settingsPanel,
                app.views.newMsgPanel
            ]
        });
        app.views.Viewport.superclass.initComponent.apply(this, arguments);
    }
});