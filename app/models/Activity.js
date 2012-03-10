app.models.Activity = Ext.regModel("app.models.Activity", {
    fields: [
        {name: "uuid", type: "string"},
        {name: "type", type: "string"},
        {name: "verb", type: "string"},
        {name: "actor", type: "auto" },    
        {name: "content", type: "string"},
        {name: "lat", type: "float"},
        {name: "lon", type: "float"},
        {name: "published", type: "published"},
    ],
    proxy: {
    	type:'localstorage',
    	id:'feed'
    }
});