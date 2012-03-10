app.views.NewMsgPanel= Ext.extend(Ext.Panel, {
    layout: 'fit',
    items: [],
    style: 'background: #DDEEF6;',
	initComponent: function() {
    	var cancelButton = new Ext.Button({
    		ui: 'light',
    		text: 'Cancel',
    		handler: function() {
    			Ext.dispatch({
    				controller: app.controllers.MsgController,
    				action: 'backsettings',
    				animation: {type:'slide', direction:'up'}
    			});
    		}
    	});


    	var msgArea= new Ext.form.TextArea({
    		layout: 'fit'
    	});

		var sendButton = new Ext.Button({
    		ui: 'light',
    		text: 'Send',
    		handler: function() {
    			Ext.dispatch({
    				controller: app.controllers.MsgController,
    				action: 'send',
    				animation: {type:'slide', direction:'up'}
    			});
    		}
    	});

    	var actionToolbar = new Ext.Toolbar({
    	    dock : 'top',
    	    ui: 'light',
    	    title: 'New Message',
    	    items: [cancelButton,{xtype:'spacer'},sendButton]
    	});

    	var fieldset= new Ext.form.FieldSet({
    		items: msgArea,
    		title: 'Write up to 150 characters'
    	});
    	

    	Ext.apply(this, {dockedItems: actionToolbar, items: fieldset, getText: function() {return msgArea.getValue();}, reset: function() {msgArea.reset();}});
    	
    	app.views.NewMsgPanel.superclass.initComponent.call(this);
	}
});

