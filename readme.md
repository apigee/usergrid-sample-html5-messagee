#Messagee

#Overview
Messagee is a [Twitter](http://twitter.com) clone built on Usergrid, the open source solution that powers Apigee's App Services. In this simplistic example, we show how you can easily implement many of the features of [Twitter](http://twitter.com) by leveraging the Usergrid API.

#Demo
A working example of this app can be found on our gh-pages branch:

<http://apigee.github.com/usergrid-sample-html5-messagee>

#Running the app
To get started, download the code to your machine, unzip the file, and extract the files inside. Then, open this file in a text editor:

	js/app.js
	
And locate this code that starts on line 34:

	var client = new Usergrid.Client({
		orgName:'ApigeeOrg', //your orgname goes here (not case sensitive)
		appName:'MessageeApp', //your appname goes here (not case sensitive)
		logging: true, //optional - turn on logging, off by default
		buildCurl: true //optional - turn on curl commands, off by default
	});

Change the orgName property to match the organization you created when you signed up for App services (usually your username), and then change the appName to match the name of the Application namespace you created in the Admin portal.  By default, all new accounts come with a application namespace called "sandbox", and you can use this too.

Once you have done this, simply open the index.html file in a browser window (avoid Internet Explorer as it has known issues) and you should be ready to go.  Try creating an account and logging in.


#Open Source
This project is open source.  Please feel free to use and modify as permitted by the license.  Want to add something?  Find a bug? We welcome pull requests.

#Get Support
If you have questions or comments, please post them to our google group:

<https://groups.google.com/forum/?hl=en#!forum/usergrid>


#Apigee App Services
To find out more about Apigee App Services, please go here:

<http://apigee.com/about/developers>

Our docs site is located here:

<http://apigee.com/docs/usergrid>