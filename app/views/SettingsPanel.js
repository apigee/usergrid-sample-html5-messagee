app.views.SettingsPanel = Ext.extend(Ext.form.FormPanel,{
    items: [{
	    xtype: 'fieldset',
	    title: 'Usergrid Login Information',
	    instructions: 'Please enter your username & password.',
        defaults: {
            required: true,
            labelAlign: 'left',
            labelWidth: '40%'
        },
        items: [{
       		xtype: 'textfield',
            name : 'username',
            label: 'Username',
            useClearIcon: true,
            autoCapitalize : false
        },{
           xtype: 'passwordfield',
           name : 'password',
           label: 'Password',
           useClearIcon: true,
           autoCapitalize : false
        }]
    }],
    initComponent: function() {
    	var cancelButton = new Ext.Button({
    		ui: 'decline',
    		text: 'Cancel',
    		handler: function() {
    			Ext.dispatch({
    				controller: app.controllers.MsgController,
    				action: 'backsettings',
    				animation: {type:'slide', direction:'down'}
    			});
    		}
    	});

    	var okButton = new Ext.Button({
    		ui: 'confirm',
    		text: 'Sign In',
    		handler: this.onOkAction,
    		scope:this
    	});
        
        var newButton = new Ext.Button({
            ui: 'confirm',
            text: 'New Account',
            handler: this.onNewAction,
            scope:this
        });
    	
    	var settingsToolbar = new Ext.Toolbar({
    	    dock : 'bottom',
    	    ui: 'light',
    	    items: [cancelButton,{xtype:'spacer'},okButton, newButton]
    	});
    	
    	Ext.apply(this, {dockedItems: [{xtype:'toolbar', dock:'top', title:'User Settings'},settingsToolbar]});
    	
    	app.views.SettingsPanel.superclass.initComponent.call(this);
    },
    onOkAction: function() {
        var model= this.getRecord();
        if(model== undefined) {
            model= new app.models.Users();
        }
        Ext.dispatch({
            controller: app.controllers.MsgController,
            action: 'savesettings',
            data: this.getValues(),
            record: model,
            animation: {type:'slide', direction:'down'}
        });
    },
	onNewAction: function() {
		var model = new app.models.Users();
		
		Ext.dispatch({
			controller: app.controllers.MsgController,
			action: 'newUser',
			data: this.getValues(),
			record: model,
			animation: {type:'slide', direction:'down'}
		});
	}

});
