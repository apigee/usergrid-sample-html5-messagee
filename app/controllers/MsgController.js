app.controllers.MsgController = new Ext.Controller({
	loadmessages: function(options) {
		app.views.msgPanel.getStore().proxy.url= client.apiUrl + '/Twid/users/' + appUser + '/feed?pos=end&prev=10&access_token=' + client.accessToken;
		app.views.msgPanel.getStore().load();
		
		if(refreshMessagesLoad) {
			refreshMessages();
			refreshMessagesLoad=false;
		}
	},
    showmessage: function(options) {
    	var msg= app.views.msgPanel.getStore().getAt(options.index);
    	if(msg.data.lat==undefined) {
        	Ext.Msg.alert('Twid','Message does not contain location.', Ext.emptyFn);
        	app.views.msgPanel.getList().getSelectionModel().deselectAll();
    	} else {

    		var pos= new google.maps.LatLng(msg.data.lat, msg.data.lon);
    		
	        var marker = new google.maps.Marker({
	             position: pos,
	             title : 'Message Location',
	             map: app.views.otherPanel.getMap().map
	        });

    		app.views.otherPanel.getMap().update(pos);
        	app.views.viewport.setActiveItem(app.views.otherPanel, options.animation);
    	}
    },
    showsettings: function(options) {
    	app.views.viewport.setActiveItem(app.views.settingsPanel, options.animation);
    },
    savesettings: function(options) {
    	client.loginAppUser("Twid", options.data.username, options.data.password, function(){
        	if(options.record.phantom) {
            	app.stores.users.create(options.data);
        	} else {
        		options.record.set(options.data);
        		options.record.save();
        	}
        	
        	appUser= client.loggedInUser.username;
        	
			/*
        	try {
        		client.apiRequest('PUT',client.encodePathString('/Twid/users/' + appUser + '/following/'+ appUser +'-in'), null, '{}', function(res){}, function(res){Ext.Msg.alert('Twid', 'Auto subscribe failed.', Ext.emptyFn);});
        	} catch(e) {
        		console.log('HTTP PUT not working');
        	}
			*/
        	
    		Ext.dispatch({
    			controller: app.controllers.MsgController,
    			action: 'loadmessages'
    		});
        	
        	app.views.viewport.setActiveItem(app.views.msgPanel, options.animation);
    	},
    	function(options) {
        	Ext.Msg.alert('Twid','Invalid Username or Password', Ext.emptyFn);
    	});
    },
    backsettings: function(options) {
    	app.views.msgPanel.getList().getSelectionModel().deselectAll();
    	app.views.viewport.setActiveItem(app.views.msgPanel, options.animation);
    },
    followuser: function() {
    	var msg = new Ext.MessageBox().show({
    	    title: 'Name',
    	    msg: 'Please enter a username to follow:',
    	    buttons: Ext.MessageBox.OKCANCEL,
    	    prompt:{ maxlength : 180, autocapitalize : false },
    	    modal: true,
    	    fn: function(btn,text) {
        		if(btn=='ok') {
        			try {
        	  			console.log(text);
                		client.apiRequest('POST',client.encodePathString('/Twid/users/' + appUser + '/following/user/'+ text), null, '{}', function(res){}, function(res){Ext.Msg.alert('Twid', 'Follow user failed.', Ext.emptyFn);});
                		
                		Ext.dispatch({
                			controller: app.controllers.MsgController,
                			action: 'loadmessages'
                		});
        			} catch(e){
        				console.log(e);
        			}
          		}
    	    },
    	    icon: Ext.MessageBox.INFO
    	});
    },
    alertuser: function(options) {
    	Ext.Msg.alert('Twid',options.message, Ext.emptyFn);
    },
    newmessage: function(options) {
    	app.views.newMsgPanel.reset();
    	app.views.viewport.setActiveItem(app.views.newMsgPanel, options.animation);
    },
    send: function(options) {
    	
    	var data= {
    			actor: {
					displayName: appUser,
					image : {
						url: "http://www.gravatar.com/avatar/" + hex_md5(client.loggedInUser.email),
						height: 80,
						width: 80
					},
					email: client.loggedInUser.email
				},
				verb: "post",
    			content: app.views.newMsgPanel.getText()
    	};
    	
    	navigator.geolocation.getCurrentPosition(function(pos) {
    		Ext.apply(data, {lat:pos.coords.latitude, lon: pos.coords.longitude});
    		
    		client.apiRequest('POST',client.encodePathString('/Twid/users/' + appUser + '/activities'), null, Ext.util.JSON.encode(data),function(res){}, function(res){Ext.Msg.alert('Twid', 'New message failed.', Ext.emptyFn);});
    		
    		Ext.dispatch({
    			controller: app.controllers.MsgController,
    			action: 'loadmessages'
    		});
        	app.views.viewport.setActiveItem(app.views.msgPanel, options.animation);
    	}, function(){
	    		client.apiRequest('POST',client.encodePathString('/Twid/users/' + appUser + '/activities'), null, Ext.util.JSON.encode(data),function(res){}, function(res){Ext.Msg.alert('Twid', 'New message failed.', Ext.emptyFn);});
	    		
	    		Ext.dispatch({
	    			controller: app.controllers.MsgController,
	    			action: 'loadmessages'
	    		});
	        	app.views.viewport.setActiveItem(app.views.msgPanel, options.animation);
    		});
    }
});

function refreshMessages() {
	app.views.msgPanel.getStore().load();
	setTimeout('refreshMessages()', 10000);
}
