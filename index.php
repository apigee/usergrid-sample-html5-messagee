<?php
//
// CORS allows HTML5 apps running in modern browsers
// to make valid cross-origin requests.
//
// For more on CORS, see
// http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
//
// This PHP module sets the appropriate headers in the webserver
// response, to tell browsers that it's ok to connect to
// api.usergrid.com directly from script.
//
// Another way to add this header is to do so via Webserver
// configuration.  You can use one or the other, but you do not need
// both.
//
// NB: This file will work only on webservers that have PHP enabled.
//

// Specify domains from which requests are allowed
header('Access-Control-Allow-Origin: https://api.usergrid.com');

// Specify which request methods are allowed
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Additional headers which may be sent along with the CORS request
// The X-Requested-With header allows jQuery requests to go through
header('Access-Control-Allow-Headers: X-Requested-With');

// Set the age to 1 day to improve speed/caching.
header('Access-Control-Max-Age: 86400');

// Exit early so the page isn't fully loaded for options requests
if (strtolower($_SERVER['REQUEST_METHOD']) == 'options') {
    exit();
}

// delegate to the view
include './index.html';

?>
