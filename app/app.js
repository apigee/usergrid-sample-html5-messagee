Ext.regApplication({
    name: 'app',
    appFolder: 'app',
    launch: function() {
        this.launched = true;
        this.mainLaunch();
    },
    mainLaunch: function() {
        if ((on_device && !window.device) || !this.launched) {return;}
		client = new usergrid.Client();
        client.currentOrganization = org_name;
        this.views.viewport = new this.views.Viewport();
        refreshMessagesLoad=true;
        
        if(app.stores.users.first()!= undefined) {
        	var user= app.stores.users.first();
        	
            appUser= user.username;
            console.log('User found ' + appUser);
    		Ext.dispatch({
    			controller: app.controllers.MsgController,
    			action: 'loadmessages'
    		});
        } else {
        	console.log('User not found');
    		Ext.dispatch({
    			controller: app.controllers.MsgController,
    			action: 'showsettings',
    			animation: {type:'slide', direction:'up'}
    		});
        }
    }
});