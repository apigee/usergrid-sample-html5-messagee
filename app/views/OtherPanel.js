var backButton = new Ext.Button({
	ui: 'back',
	text: 'Back',
	handler: function() {
		Ext.dispatch({
			controller: app.controllers.MsgController,
			action: 'backsettings',
			animation: {type:'slide', direction:'right'}
		});	}
});

var backToolbar = new Ext.Toolbar({
    dock : 'top',
    ui: 'light',
    items: backButton
});

var map= new Ext.Map({
    mapOptions: {        // Used in rendering map
    	zoom: 12,
    	useCurrentLocation:true,
    	mapTypeId : google.maps.MapTypeId.ROADMAP,
        navigationControl: true,
        navigationControlOptions: {
        	style: google.maps.NavigationControlStyle.DEFAULT
        },
    }
});

app.views.OtherPanel= Ext.extend(Ext.Panel, {
	dockedItems: [backToolbar],
    scroll: 'vertical',
    layout:'fit',
    items: [map],
    getMap: function(){return map;},
    style: 'background: #FFFFFF;'
});