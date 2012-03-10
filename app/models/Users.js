app.models.Users = Ext.regModel("app.models.Users", {
    fields: [
        {name: "username", type: "string"},
        {name: "password", type: "string"}
    ],
    
    proxy: {
    	type: 'localstorage',
    	id: 'users'
    }
});