Twid = new Ext.Application({
	name: 'Twid',
	
	launch: function() {



        var mainPanel = new Ext.Panel({
            fullscreen : true,
        	layout: 'card',
        	items: [msgPanel, otherPanel,settingsPanel]
        });


		Twid.Viewport= mainPanel;
		mainPanel.show();
	}
});
