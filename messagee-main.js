Messagee = new Ext.Application({
	name: 'Messagee',
	
	launch: function() {



        var mainPanel = new Ext.Panel({
            fullscreen : true,
        	layout: 'card',
        	items: [msgPanel, otherPanel,settingsPanel]
        });


		Messagee.Viewport= mainPanel;
		mainPanel.show();
	}
});
