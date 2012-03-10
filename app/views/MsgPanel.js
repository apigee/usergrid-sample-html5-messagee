var newMessageButton = new Ext.Button({
	iconMask: true,
	iconCls: 'compose',
	handler: function() {
		Ext.dispatch({
			controller: app.controllers.MsgController,
			action: 'newmessage',
			animation: {type:'slide', direction:'down'}
		});
	}
});

var topToolbar = new Ext.Toolbar({
    dock : 'top',
    ui: 'dark',
    title: 'Twid - Messages Board',
    items: [{xtype:'spacer'}, newMessageButton]
});

var store = new Ext.data.Store({
    model: 'app.models.Activity',
    proxy: new Ext.data.HttpProxy({ 
        method: 'get',
        reader:{
            root: 'entities',
            totalproperty: 'length',
            type: 'json'
        },
    }),
});

var tpl = new Ext.XTemplate(
        '<div id="tweet_container">',
            '<tpl for=".">',
                '<div class="tweet_data">',
                '<div class="tweet_avatar">',
                    '<img width="30" height="30" src="{[this.getActorImage(values)]}"/>',
                '</div>',
                '<div class="tweet_content">',
                    '<div class="user">{actor.displayName}</div>&nbsp;',
                    '{content}',
                '</div>',
                '<div class="clear"></div>',
                '</div>',
            '</tpl>',
        '</div>', {
	    getActorImage: function(values) {
	        if (values.actor && values.actor.image && values.actor.image.url) return values.actor.image.url;
	        return "http://www.gravatar.com/avatar/?";
	    },
});

var listPanel = new Ext.List({
	store: store,
	loadingText: null,
    scroll: 'vertical',
	itemTpl: tpl,
	listeners: {
		scope:this,
		itemtap: function(view, index, item, e) {
			Ext.dispatch({
				controller: app.controllers.MsgController,
				action: 'showmessage',
				index:index
			});
		}
	}
});

var followButton = new Ext.Button({
	iconMask: true,
	iconCls: 'user',
	handler: function() {
		Ext.dispatch({
			controller: app.controllers.MsgController,
			action: 'followuser'
		});
	}
});

var settingsButton = new Ext.Button({
	iconMask: true,
	iconCls: 'settings',
	handler: function() {
		Ext.dispatch({
			controller: app.controllers.MsgController,
			action: 'showsettings',
			animation: {type:'slide', direction:'up'}
		});
	}
});

var bottomToolbar = new Ext.Toolbar({
    dock : 'bottom',
    ui: 'light',
    items: [followButton, {xtype:'spacer'}, settingsButton]
});

app.views.MsgPanel= Ext.extend(Ext.Panel, {
    layout: 'fit',
    dockedItems: [topToolbar, bottomToolbar],
    items: [listPanel],
    style: 'background: #DDEEF6;',
    getList: function() {return listPanel;},
    getStore: function() {return store;}
});

