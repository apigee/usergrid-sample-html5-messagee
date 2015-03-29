/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/*! apigee-javascript-sdk@2.0.9 2014-06-25 */
var UsergridEventable = function() {
    throw Error("'UsergridEventable' is not intended to be invoked directly");
};

UsergridEventable.prototype = {
    bind: function(event, fn) {
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(fn);
    },
    unbind: function(event, fn) {
        this._events = this._events || {};
        if (event in this._events === false) return;
        this._events[event].splice(this._events[event].indexOf(fn), 1);
    },
    trigger: function(event) {
        this._events = this._events || {};
        if (event in this._events === false) return;
        for (var i = 0; i < this._events[event].length; i++) {
            this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }
};

UsergridEventable.mixin = function(destObject) {
    var props = [ "bind", "unbind", "trigger" ];
    for (var i = 0; i < props.length; i++) {
        if (props[i] in destObject.prototype) {
            console.warn("overwriting '" + props[i] + "' on '" + destObject.name + "'.");
            console.warn("the previous version can be found at '_" + props[i] + "' on '" + destObject.name + "'.");
            destObject.prototype["_" + props[i]] = destObject.prototype[props[i]];
        }
        destObject.prototype[props[i]] = UsergridEventable.prototype[props[i]];
    }
};

//Logger
(function() {
    var name = "Logger", global = this, overwrittenName = global[name], exports;
    /* logging */
    function Logger(name) {
        this.logEnabled = true;
        this.init(name, true);
    }
    Logger.METHODS = [ "log", "error", "warn", "info", "debug", "assert", "clear", "count", "dir", "dirxml", "exception", "group", "groupCollapsed", "groupEnd", "profile", "profileEnd", "table", "time", "timeEnd", "trace" ];
    Logger.prototype.init = function(name, logEnabled) {
        this.name = name || "UNKNOWN";
        this.logEnabled = logEnabled || true;
        var addMethod = function(method) {
            this[method] = this.createLogMethod(method);
        }.bind(this);
        Logger.METHODS.forEach(addMethod);
    };
    Logger.prototype.createLogMethod = function(method) {
        return Logger.prototype.log.bind(this, method);
    };
    Logger.prototype.prefix = function(method, args) {
        var prepend = "[" + method.toUpperCase() + "][" + name + "]:	";
        if ([ "log", "error", "warn", "info" ].indexOf(method) !== -1) {
            if ("string" === typeof args[0]) {
                args[0] = prepend + args[0];
            } else {
                args.unshift(prepend);
            }
        }
        return args;
    };
    Logger.prototype.log = function() {
        if(0) {
            var args = [].slice.call(arguments);
            method = args.shift();
            if (Logger.METHODS.indexOf(method) === -1) {
                method = "log";
            }
            if (!(this.logEnabled && console && console[method])) return;
            args = this.prefix(method, args);
            console[method].apply(console, args);
        }
    };
    Logger.prototype.setLogEnabled = function(logEnabled) {
        this.logEnabled = logEnabled || true;
    };
    Logger.mixin = function(destObject) {
        destObject.__logger = new Logger(destObject.name || "UNKNOWN");
        var addMethod = function(method) {
            if (method in destObject.prototype) {
                console.warn("overwriting '" + method + "' on '" + destObject.name + "'.");
                console.warn("the previous version can be found at '_" + method + "' on '" + destObject.name + "'.");
                destObject.prototype["_" + method] = destObject.prototype[method];
            }
            destObject.prototype[method] = destObject.__logger.createLogMethod(method);
        };
        Logger.METHODS.forEach(addMethod);
    };
    global[name] = Logger;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Logger;
    };
    return global[name];
})();

//Promise
(function(global) {
    var name = "Promise", overwrittenName = global[name], exports;
    function Promise() {
        this.complete = false;
        this.error = null;
        this.result = null;
        this.callbacks = [];
    }
    Promise.prototype.create = function() {
        return new Promise();
    };
    Promise.prototype.then = function(callback, context) {
        var f = function() {
            return callback.apply(context, arguments);
        };
        if (this.complete) {
            f(this.error, this.result);
        } else {
            this.callbacks.push(f);
        }
    };
    Promise.prototype.done = function(error, result) {
        this.complete = true;
        this.error = error;
        this.result = result;
        if (this.callbacks) {
            for (var i = 0; i < this.callbacks.length; i++) this.callbacks[i](error, result);
            this.callbacks.length = 0;
        }
    };
    Promise.join = function(promises) {
        var p = new Promise(), total = promises.length, completed = 0, errors = [], results = [];
        function notifier(i) {
            return function(error, result) {
                completed += 1;
                errors[i] = error;
                results[i] = result;
                if (completed === total) {
                    p.done(errors, results);
                }
            };
        }
        for (var i = 0; i < total; i++) {
            promises[i]().then(notifier(i));
        }
        return p;
    };
    Promise.chain = function(promises, error, result) {
        var p = new Promise();
        if (promises === null || promises.length === 0) {
            p.done(error, result);
        } else {
            promises[0](error, result).then(function(res, err) {
                promises.splice(0, 1);
                if (promises) {
                    Promise.chain(promises, res, err).then(function(r, e) {
                        p.done(r, e);
                    });
                } else {
                    p.done(res, err);
                }
            });
        }
        return p;
    };
    global[name] = Promise;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Promise;
    };
    return global[name];
})(this);

//Ajax
(function() {
    var name = "Ajax", global = this, overwrittenName = global[name], exports;
    function partial() {
        var args = Array.prototype.slice.call(arguments);
        var fn = args.shift();
        return fn.bind(this, args);
    }
    function Ajax() {
        this.logger = new global.Logger(name);
        var self = this;
        function encode(data) {
            var result = "";
            if (typeof data === "string") {
                result = data;
            } else {
                var e = encodeURIComponent;
                for (var i in data) {
                    if (data.hasOwnProperty(i)) {
                        result += "&" + e(i) + "=" + e(data[i]);
                    }
                }
            }
            return result;
        }
        function request(m, u, d) {
            var p = new Promise(), timeout;
            self.logger.time(m + " " + u);
            (function(xhr) {
                xhr.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        self.logger.timeEnd(m + " " + u);
                        clearTimeout(timeout);
                        p.done(null, this);
                    }
                };
                xhr.onerror = function(response) {
                    clearTimeout(timeout);
                    p.done(response, null);
                };
                xhr.oncomplete = function(response) {
                    clearTimeout(timeout);
                    self.logger.timeEnd(m + " " + u);
                    self.info("%s request to %s returned %s", m, u, this.status);
                };
                xhr.open(m, u);
                if (d) {
                    if ("object" === typeof d) {
                        d = JSON.stringify(d);
                    }
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Accept", "application/json");
                }
                timeout = setTimeout(function() {
                    xhr.abort();
                    p.done("API Call timed out.", null);
                }, 3e4);
                xhr.send(encode(d));
            })(new XMLHttpRequest());
            return p;
        }
        this.request = request;
        this.get = partial(request, "GET");
        this.post = partial(request, "POST");
        this.put = partial(request, "PUT");
        this.delete = partial(request, "DELETE");
    }
    global[name] = new Ajax();
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return exports;
    };
    return global[name];
})();

/*
 *  This module is a collection of classes designed to make working with
 *  the Appigee App Services API as easy as possible.
 *  Learn more at http://Usergrid.com/docs/usergrid
 *
 *   Copyright 2012 Usergrid Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *  @author rod simpson (rod@Usergrid.com)
 *  @author matt dobson (matt@Usergrid.com)
 *  @author ryan bridges (rbridges@Usergrid.com)
 */
window.console = window.console || {};

window.console.log = window.console.log || function() {};

function extend(subClass, superClass) {
    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
    subClass.superclass = superClass.prototype;
    if (superClass.prototype.constructor == Object.prototype.constructor) {
        superClass.prototype.constructor = superClass;
    }
    return subClass;
}

function propCopy(from, to) {
    for (var prop in from) {
        if (from.hasOwnProperty(prop)) {
            if ("object" === typeof from[prop] && "object" === typeof to[prop]) {
                to[prop] = propCopy(from[prop], to[prop]);
            } else {
                to[prop] = from[prop];
            }
        }
    }
    return to;
}

function NOOP() {}

function isValidUrl(url) {
    if (!url) return false;
    var doc, base, anchor, isValid = false;
    try {
        doc = document.implementation.createHTMLDocument("");
        base = doc.createElement("base");
        base.href = base || window.lo;
        doc.head.appendChild(base);
        anchor = doc.createElement("a");
        anchor.href = url;
        doc.body.appendChild(anchor);
        isValid = !(anchor.href === "");
    } catch (e) {
        console.error(e);
    } finally {
        doc.head.removeChild(base);
        doc.body.removeChild(anchor);
        base = null;
        anchor = null;
        doc = null;
        return isValid;
    }
}

/*
 * Tests if the string is a uuid
 *
 * @public
 * @method isUUID
 * @param {string} uuid The string to test
 * @returns {Boolean} true if string is uuid
 */
var uuidValueRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isUUID(uuid) {
    return !uuid ? false : uuidValueRegex.test(uuid);
}

/*
 *  method to encode the query string parameters
 *
 *  @method encodeParams
 *  @public
 *  @params {object} params - an object of name value pairs that will be urlencoded
 *  @return {string} Returns the encoded string
 */
function encodeParams(params) {
    var queryString;
    if (params && Object.keys(params)) {
        queryString = [].slice.call(arguments).reduce(function(a, b) {
            return a.concat(b instanceof Array ? b : [ b ]);
        }, []).filter(function(c) {
            return "object" === typeof c;
        }).reduce(function(p, c) {
            !(c instanceof Array) ? p = p.concat(Object.keys(c).map(function(key) {
                return [ key, c[key] ];
            })) : p.push(c);
            return p;
        }, []).reduce(function(p, c) {
            c.length === 2 ? p.push(c) : p = p.concat(c);
            return p;
        }, []).reduce(function(p, c) {
            c[1] instanceof Array ? c[1].forEach(function(v) {
                p.push([ c[0], v ]);
            }) : p.push(c);
            return p;
        }, []).map(function(c) {
            c[1] = encodeURIComponent(c[1]);
            return c.join("=");
        }).join("&");
    }
    return queryString;
}

/*
 *  method to determine whether or not the passed variable is a function
 *
 *  @method isFunction
 *  @public
 *  @params {any} f - any variable
 *  @return {boolean} Returns true or false
 */
function isFunction(f) {
    return f && f !== null && typeof f === "function";
}

/*
 *  a safe wrapper for executing a callback
 *
 *  @method doCallback
 *  @public
 *  @params {Function} callback - the passed-in callback method
 *  @params {Array} params - an array of arguments to pass to the callback
 *  @params {Object} context - an optional calling context for the callback
 *  @return Returns whatever would be returned by the callback. or false.
 */
function doCallback(callback, params, context) {
    var returnValue;
    if (isFunction(callback)) {
        if (!params) params = [];
        if (!context) context = this;
        params.push(context);
        returnValue = callback.apply(context, params);
    }
    return returnValue;
}

(function(global) {
    var name = "Usergrid", overwrittenName = global[name];
    var VALID_REQUEST_METHODS = [ "GET", "POST", "PUT", "DELETE" ];
    function Usergrid() {
        this.logger = new Logger(name);
    }
    Usergrid.isValidEndpoint = function(endpoint) {
        //TODO actually implement this
        return true;
    };
    Usergrid.Request = function(method, endpoint, query_params, data, callback) {
        var p = new Promise();
        /*
         Create a logger
         */
        this.logger = new global.Logger("Usergrid.Request");
        this.logger.time("process request " + method + " " + endpoint);
        /*
         Validate our input
         */
        this.endpoint = endpoint + "?" + encodeParams(query_params);
        this.method = method.toUpperCase();
        this.data = "object" === typeof data ? JSON.stringify(data) : data;
        if (VALID_REQUEST_METHODS.indexOf(this.method) === -1) {
            throw new UsergridInvalidHTTPMethodError("invalid request method '" + this.method + "'");
        }
        /*
         Prepare our request
         */
        if (!isValidUrl(this.endpoint)) {
            this.logger.error(endpoint, this.endpoint, /^https:\/\//.test(endpoint));
            throw new UsergridInvalidURIError("The provided endpoint is not valid: " + this.endpoint);
        }
        /* a callback to make the request */
        var request = function() {
            return Ajax.request(this.method, this.endpoint, this.data);
        }.bind(this);
        /* a callback to process the response */
        var response = function(err, request) {
            return new Usergrid.Response(err, request);
        }.bind(this);
        /* a callback to clean up and return data to the client */
        var oncomplete = function(err, response) {
            p.done(err, response);
            this.logger.info("REQUEST", err, response);
            doCallback(callback, [ err, response ]);
            this.logger.timeEnd("process request " + method + " " + endpoint);
        }.bind(this);
        /* and a promise to chain them all together */
        Promise.chain([ request, response ]).then(oncomplete);
        return p;
    };
    Usergrid.Response = function(err, response) {
        var p = new Promise();
        var data = null;
        try {
            data = JSON.parse(response.responseText);
        } catch (e) {
            data = {};
        }
        Object.keys(data).forEach(function(key) {
            Object.defineProperty(this, key, {
                value: data[key],
                enumerable: true
            });
        }.bind(this));
        Object.defineProperty(this, "logger", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: new global.Logger(name)
        });
        Object.defineProperty(this, "success", {
            enumerable: false,
            configurable: false,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "err", {
            enumerable: false,
            configurable: false,
            writable: true,
            value: err
        });
        Object.defineProperty(this, "status", {
            enumerable: false,
            configurable: false,
            writable: true,
            value: parseInt(response.status)
        });
        Object.defineProperty(this, "statusGroup", {
            enumerable: false,
            configurable: false,
            writable: true,
            value: this.status - this.status % 100
        });
        switch (this.statusGroup) {
          case 200:
            //success
            this.success = true;
            break;

          case 400:
          //user error
            case 500:
          //server error
            case 300:
          //cache and redirects
            case 100:
          //upgrade
            default:
            //server error
            this.success = false;
            break;
        }
        if (this.success) {
            p.done(null, this);
        } else {
            p.done(UsergridError.fromResponse(data), this);
        }
        return p;
    };
    Usergrid.Response.prototype.getEntities = function() {
        var entities;
        if (this.success) {
            entities = this.data ? this.data.entities : this.entities;
        }
        return entities || [];
    };
    Usergrid.Response.prototype.getEntity = function() {
        var entities = this.getEntities();
        return entities[0];
    };
    Usergrid.VERSION = Usergrid.USERGRID_SDK_VERSION = "0.11.0";
    global[name] = Usergrid;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Usergrid;
    };
    return global[name];
})(this);

(function() {
    var name = "Client", global = this, overwrittenName = global[name], exports;
    var AUTH_ERRORS = [ "auth_expired_session_token", "auth_missing_credentials", "auth_unverified_oath", "expired_token", "unauthorized", "auth_invalid" ];
    Usergrid.Client = function(options) {
        this.URI = options.URI || "https://api.usergrid.com";
        if (options.orgName) {
            this.set("orgName", options.orgName);
        }
        if (options.appName) {
            this.set("appName", options.appName);
        }
        if (options.qs) {
            this.setObject("default_qs", options.qs);
        }
        //other options
        this.buildCurl = options.buildCurl || false;
        this.logging = options.logging || false;
    };
    /*
   *  Main function for making requests to the API.  Can be called directly.
   *
   *  options object:
   *  `method` - http method (GET, POST, PUT, or DELETE), defaults to GET
   *  `qs` - object containing querystring values to be appended to the uri
   *  `body` - object containing entity body for POST and PUT requests
   *  `endpoint` - API endpoint, for example 'users/fred'
   *  `mQuery` - boolean, set to true if running management query, defaults to false
   *
   *  @method request
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.request = function(options, callback) {
        var self = this;
        var method = options.method || "GET";
        var endpoint = options.endpoint;
        var body = options.body || {};
        var qs = options.qs || {};
        var mQuery = options.mQuery || false;
        var orgName = this.get("orgName");
        var appName = this.get("appName");
        var default_qs = this.getObject("default_qs");
        var uri;
        /*var logoutCallback=function(){
        if (typeof(this.logoutCallback) === 'function') {
            return this.logoutCallback(true, 'no_org_or_app_name_specified');
        }
    }.bind(this);*/
        if (!mQuery && !orgName && !appName) {
            return logoutCallback();
        }
        if (mQuery) {
            uri = this.URI + "/" + endpoint;
        } else {
            uri = this.URI + "/" + orgName + "/" + appName + "/" + endpoint;
        }
        if (this.getToken()) {
            qs.access_token = this.getToken();
        }
        if (default_qs) {
            qs = propCopy(qs, default_qs);
        }
        var self = this;
        var req = new Usergrid.Request(method, uri, qs, body, function(err, response) {
            /*if (AUTH_ERRORS.indexOf(response.error) !== -1) {
            return logoutCallback();
        }*/
            if (err) {
                doCallback(callback, [ err, response, self ], self);
            } else {
                doCallback(callback, [ null, response, self ], self);
            }
        });
    };
    /*
   *  function for building asset urls
   *
   *  @method buildAssetURL
   *  @public
   *  @params {string} uuid
   *  @return {string} assetURL
   */
    Usergrid.Client.prototype.buildAssetURL = function(uuid) {
        var self = this;
        var qs = {};
        var assetURL = this.URI + "/" + this.orgName + "/" + this.appName + "/assets/" + uuid + "/data";
        if (self.getToken()) {
            qs.access_token = self.getToken();
        }
        var encoded_params = encodeParams(qs);
        if (encoded_params) {
            assetURL += "?" + encoded_params;
        }
        return assetURL;
    };
    /*
   *  Main function for creating new groups. Call this directly.
   *
   *  @method createGroup
   *  @public
   *  @params {string} path
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.createGroup = function(options, callback) {
        var group = new Usergrid.Group({
            path: options.path,
            client: this,
            data: options
        });
        group.save(function(err, response) {
            doCallback(callback, [ err, response, group ], group);
        });
    };
    /*
   *  Main function for creating new entities - should be called directly.
   *
   *  options object: options {data:{'type':'collection_type', 'key':'value'}, uuid:uuid}}
   *
   *  @method createEntity
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.createEntity = function(options, callback) {
        var entity = new Usergrid.Entity({
            client: this,
            data: options
        });
        entity.save(function(err, response) {
            doCallback(callback, [ err, response, entity ], entity);
        });
    };
    /*
   *  Main function for getting existing entities - should be called directly.
   *
   *  You must supply a uuid or (username or name). Username only applies to users.
   *  Name applies to all custom entities
   *
   *  options object: options {data:{'type':'collection_type', 'name':'value', 'username':'value'}, uuid:uuid}}
   *
   *  @method createEntity
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.getEntity = function(options, callback) {
        var entity = new Usergrid.Entity({
            client: this,
            data: options
        });
        entity.fetch(function(err, response) {
            doCallback(callback, [ err, response, entity ], entity);
        });
    };
    /*
   *  Main function for restoring an entity from serialized data.
   *
   *  serializedObject should have come from entityObject.serialize();
   *
   *  @method restoreEntity
   *  @public
   *  @param {string} serializedObject
   *  @return {object} Entity Object
   */
    Usergrid.Client.prototype.restoreEntity = function(serializedObject) {
        var data = JSON.parse(serializedObject);
        var options = {
            client: this,
            data: data
        };
        var entity = new Usergrid.Entity(options);
        return entity;
    };
    /*
   *  Main function for creating new counters - should be called directly.
   *
   *  options object: options {timestamp:0, category:'value', counters:{name : value}}
   *
   *  @method createCounter
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, response, counter)
   */
    Usergrid.Client.prototype.createCounter = function(options, callback) {
        var counter = new Usergrid.Counter({
            client: this,
            data: options
        });
        counter.save(callback);
    };
    /*
   *  Main function for creating new assets - should be called directly.
   *
   *  options object: options {name:"photo.jpg", path:"/user/uploads", "content-type":"image/jpeg", owner:"F01DE600-0000-0000-0000-000000000000", file: FileOrBlobObject }
   *
   *  @method createCounter
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, response, counter)
   */
    Usergrid.Client.prototype.createAsset = function(options, callback) {
        var file = options.file;
        if (file) {
            options.name = options.name || file.name;
            options["content-type"] = options["content-type"] || file.type;
            options.path = options.path || "/";
            delete options.file;
        }
        var asset = new Usergrid.Asset({
            client: this,
            data: options
        });
        asset.save(function(err, response, asset) {
            if (file && !err) {
                asset.upload(file, callback);
            } else {
                doCallback(callback, [ err, response, asset ], asset);
            }
        });
    };
    /*
   *  Main function for creating new collections - should be called directly.
   *
   *  options object: options {client:client, type: type, qs:qs}
   *
   *  @method createCollection
   *  @public
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.createCollection = function(options, callback) {
        options.client = this;
        var collection = new Usergrid.Collection(options);
        collection.fetch(callback);
        /*
        return new Usergrid.Collection(options, function(err, data, collection) {
            console.log("createCollection", arguments);
            doCallback(callback, [ err, collection, data ]);
        });
        */
    };
    /*
   *  Main function for restoring a collection from serialized data.
   *
   *  serializedObject should have come from collectionObject.serialize();
   *
   *  @method restoreCollection
   *  @public
   *  @param {string} serializedObject
   *  @return {object} Collection Object
   */
    Usergrid.Client.prototype.restoreCollection = function(serializedObject) {
        var data = JSON.parse(serializedObject);
        data.client = this;
        var collection = new Usergrid.Collection(data);
        return collection;
    };
    /*
   *  Main function for retrieving a user's activity feed.
   *
   *  @method getFeedForUser
   *  @public
   *  @params {string} username
   *  @param {function} callback
   *  @return {callback} callback(err, data, activities)
   */
    Usergrid.Client.prototype.getFeedForUser = function(username, callback) {
        var options = {
            method: "GET",
            endpoint: "users/" + username + "/feed"
        };
        this.request(options, function(err, data) {
            if (err) {
                doCallback(callback, [ err ]);
            } else {
                doCallback(callback, [ err, data, data.getEntities() ]);
            }
        });
    };
    /*
   *  Function for creating new activities for the current user - should be called directly.
   *
   *  //user can be any of the following: "me", a uuid, a username
   *  Note: the "me" alias will reference the currently logged in user (e.g. 'users/me/activties')
   *
   *  //build a json object that looks like this:
   *  var options =
   *  {
   *    "actor" : {
   *      "displayName" :"myusername",
   *      "uuid" : "myuserid",
   *      "username" : "myusername",
   *      "email" : "myemail",
   *      "picture": "http://path/to/picture",
   *      "image" : {
   *          "duration" : 0,
   *          "height" : 80,
   *          "url" : "http://www.gravatar.com/avatar/",
   *          "width" : 80
   *      },
   *    },
   *    "verb" : "post",
   *    "content" : "My cool message",
   *    "lat" : 48.856614,
   *    "lon" : 2.352222
   *  }
   *
   *  @method createEntity
   *  @public
   *  @params {string} user // "me", a uuid, or a username
   *  @params {object} options
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.createUserActivity = function(user, options, callback) {
        options.type = "users/" + user + "/activities";
        options = {
            client: this,
            data: options
        };
        var entity = new Usergrid.Entity(options);
        entity.save(function(err, data) {
            doCallback(callback, [ err, data, entity ]);
        });
    };
    /*
   *  Function for creating user activities with an associated user entity.
   *
   *  user object:
   *  The user object passed into this function is an instance of Usergrid.Entity.
   *
   *  @method createUserActivityWithEntity
   *  @public
   *  @params {object} user
   *  @params {string} content
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.createUserActivityWithEntity = function(user, content, callback) {
        var username = user.get("username");
        var options = {
            actor: {
                displayName: username,
                uuid: user.get("uuid"),
                username: username,
                email: user.get("email"),
                picture: user.get("picture"),
                image: {
                    duration: 0,
                    height: 80,
                    url: user.get("picture"),
                    width: 80
                }
            },
            verb: "post",
            content: content
        };
        this.createUserActivity(username, options, callback);
    };
    /*
   *  A private method to get call timing of last call
   */
    Usergrid.Client.prototype.calcTimeDiff = function() {
        var seconds = 0;
        var time = this._end - this._start;
        try {
            seconds = (time / 10 / 60).toFixed(2);
        } catch (e) {
            return 0;
        }
        return seconds;
    };
    /*
   *  A public method to store the OAuth token for later use - uses localstorage if available
   *
   *  @method setToken
   *  @public
   *  @params {string} token
   *  @return none
   */
    Usergrid.Client.prototype.setToken = function(token) {
        this.set("token", token);
    };
    /*
   *  A public method to get the OAuth token
   *
   *  @method getToken
   *  @public
   *  @return {string} token
   */
    Usergrid.Client.prototype.getToken = function() {
        return this.get("token");
    };
    Usergrid.Client.prototype.setObject = function(key, value) {
        if (value) {
            value = JSON.stringify(value);
        }
        this.set(key, value);
    };
    Usergrid.Client.prototype.set = function(key, value) {
        var keyStore = "apigee_" + key;
        this[key] = value;
        if (typeof Storage !== "undefined") {
            if (value) {
                localStorage.setItem(keyStore, value);
            } else {
                localStorage.removeItem(keyStore);
            }
        }
    };
    Usergrid.Client.prototype.getObject = function(key) {
        return JSON.parse(this.get(key));
    };
    Usergrid.Client.prototype.get = function(key) {
        var keyStore = "apigee_" + key;
        var value = null;
        if (this[key]) {
            value = this[key];
        } else if (typeof Storage !== "undefined") {
            value = localStorage.getItem(keyStore);
        }
        return value;
    };
    /*
   * A public facing helper method for signing up users
   *
   * @method signup
   * @public
   * @params {string} username
   * @params {string} password
   * @params {string} email
   * @params {string} name
   * @param {function} callback
   * @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.signup = function(username, password, email, name, callback) {
        var self = this;
        var options = {
            type: "users",
            username: username,
            password: password,
            email: email,
            name: name
        };
        this.createEntity(options, callback);
    };
    /*
   *
   *  A public method to log in an app user - stores the token for later use
   *
   *  @method login
   *  @public
   *  @params {string} username
   *  @params {string} password
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.login = function(username, password, callback) {
        var self = this;
        var options = {
            method: "POST",
            endpoint: "token",
            body: {
                username: username,
                password: password,
                grant_type: "password"
            }
        };
        self.request(options, function(err, response) {
            var user = {};
            if (err) {
                if (self.logging) console.log("error trying to log user in");
            } else {
                var options = {
                    client: self,
                    data: response.user
                };
                user = new Usergrid.Entity(options);
                self.setToken(response.access_token);
            }
            doCallback(callback, [ err, response, user ]);
        });
    };

    Usergrid.Client.prototype.adminLogin = function(username, password, callback) {
        var self = this;
        var options = {
            method: "POST",
            endpoint: "management/token",
            mQuery:true,
            body: {
                username: username,
                password: password,
                grant_type: "password"
            }
        };
        self.request(options, function(err, response) {
            var user = {};
            if (err) {
                if (self.logging) console.log("error trying to log user in");
            } else {
                var options = {
                    client: self,
                    data: response.user
                };
                user = new Usergrid.Entity(options);
                self.setToken(response.access_token);
            }
            doCallback(callback, [ err, response, user ]);
        });
    };
    
    Usergrid.Client.prototype.reAuthenticateLite = function(callback) {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "management/me",
            mQuery: true
        };
        this.request(options, function(err, response) {
            if (err && self.logging) {
                console.log("error trying to re-authenticate user");
            } else {
                self.setToken(response.data.access_token);
            }
            doCallback(callback, [ err ]);
        });
    };
    Usergrid.Client.prototype.reAuthenticate = function(email, callback) {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "management/users/" + email,
            mQuery: true
        };
        this.request(options, function(err, response) {
            var organizations = {};
            var applications = {};
            var user = {};
            var data;
            if (err && self.logging) {
                console.log("error trying to full authenticate user");
            } else {
                data = response.data;
                self.setToken(data.token);
                self.set("email", data.email);
                localStorage.setItem("accessToken", data.token);
                localStorage.setItem("userUUID", data.uuid);
                localStorage.setItem("userEmail", data.email);
                var userData = {
                    username: data.username,
                    email: data.email,
                    name: data.name,
                    uuid: data.uuid
                };
                var options = {
                    client: self,
                    data: userData
                };
                user = new Usergrid.Entity(options);
                organizations = data.organizations;
                var org = "";
                try {
                    //if we have an org stored, then use that one. Otherwise, use the first one.
                    var existingOrg = self.get("orgName");
                    org = organizations[existingOrg] ? organizations[existingOrg] : organizations[Object.keys(organizations)[0]];
                    self.set("orgName", org.name);
                } catch (e) {
                    err = true;
                    if (self.logging) {
                        console.log("error selecting org");
                    }
                }
                //should always be an org
                applications = self.parseApplicationsArray(org);
                self.selectFirstApp(applications);
                self.setObject("organizations", organizations);
                self.setObject("applications", applications);
            }
            doCallback(callback, [ err, data, user, organizations, applications ], self);
        });
    };
    /*
   *  A public method to log in an app user with facebook - stores the token for later use
   *
   *  @method loginFacebook
   *  @public
   *  @params {string} username
   *  @params {string} password
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.loginFacebook = function(facebookToken, callback) {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "auth/facebook",
            qs: {
                fb_access_token: facebookToken
            }
        };
        this.request(options, function(err, data) {
            var user = {};
            if (err && self.logging) {
                console.log("error trying to log user in");
            } else {
                var options = {
                    client: self,
                    data: data.user
                };
                user = new Usergrid.Entity(options);
                self.setToken(data.access_token);
            }
            doCallback(callback, [ err, data, user ], self);
        });
    };
    /*
   *  A public method to get the currently logged in user entity
   *
   *  @method getLoggedInUser
   *  @public
   *  @param {function} callback
   *  @return {callback} callback(err, data)
   */
    Usergrid.Client.prototype.getLoggedInUser = function(callback) {
        var self = this;
        if (!this.getToken()) {
            doCallback(callback, [ new UsergridError("Access Token not set"), null, self ], self);
        } else {
            var options = {
                method: "GET",
                endpoint: "users/me"
            };
            this.request(options, function(err, response) {
                if (err) {
                    if (self.logging) {
                        console.log("error trying to log user in");
                    }
                    console.error(err, response);
                    doCallback(callback, [ err, response, self ], self);
                } else {
                    var options = {
                        client: self,
                        data: response.getEntity()
                    };
                    var user = new Usergrid.Entity(options);
                    doCallback(callback, [ null, response, user ], self);
                }
            });
        }
    };
    /*
   *  A public method to test if a user is logged in - does not guarantee that the token is still valid,
   *  but rather that one exists
   *
   *  @method isLoggedIn
   *  @public
   *  @return {boolean} Returns true the user is logged in (has token and uuid), false if not
   */
    Usergrid.Client.prototype.isLoggedIn = function() {
        var token = this.getToken();
        return "undefined" !== typeof token && token !== null;
    };
    /*
   *  A public method to log out an app user - clears all user fields from client
   *
   *  @method logout
   *  @public
   *  @return none
   */
    Usergrid.Client.prototype.logout = function() {
        this.setToken();
    };
    /*
   *  A public method to destroy access tokens on the server
   *
   *  @method logout
   *  @public
   *  @param {string} username	the user associated with the token to revoke
   *  @param {string} token set to 'null' to revoke the token of the currently logged in user
   *    or set to token value to revoke a specific token
   *  @param {string} revokeAll set to 'true' to revoke all tokens for the user
   *  @return none
   */
    Usergrid.Client.prototype.destroyToken = function(username, token, revokeAll, callback) {
        var options = {
            client: self,
            method: "PUT"
        };
        if (revokeAll === true) {
            options.endpoint = "users/" + username + "/revoketokens";
        } else if (token === null) {
            options.endpoint = "users/" + username + "/revoketoken?token=" + this.getToken();
        } else {
            options.endpoint = "users/" + username + "/revoketoken?token=" + token;
        }
        this.request(options, function(err, data) {
            if (err) {
                if (self.logging) {
                    console.log("error destroying access token");
                }
                doCallback(callback, [ err, data, null ], self);
            } else {
                if (revokeAll === true) {
                    console.log("all user tokens invalidated");
                } else {
                    console.log("token invalidated");
                }
                doCallback(callback, [ err, data, null ], self);
            }
        });
    };
    /*
   *  A public method to log out an app user - clears all user fields from client
   *  and destroys the access token on the server.
   *
   *  @method logout
   *  @public
   *  @param {string} username the user associated with the token to revoke
   *  @param {string} token set to 'null' to revoke the token of the currently logged in user
   *   or set to token value to revoke a specific token
   *  @param {string} revokeAll set to 'true' to revoke all tokens for the user
   *  @return none
   */
    Usergrid.Client.prototype.logoutAndDestroyToken = function(username, token, revokeAll, callback) {
        if (username === null) {
            console.log("username required to revoke tokens");
        } else {
            this.destroyToken(username, token, revokeAll, callback);
            if (revokeAll === true || token === this.getToken() || token === null) {
                this.setToken(null);
            }
        }
    };
    /*
   *  A private method to build the curl call to display on the command line
   *
   *  @method buildCurlCall
   *  @private
   *  @param {object} options
   *  @return {string} curl
   */
    Usergrid.Client.prototype.buildCurlCall = function(options) {
        var curl = [ "curl" ];
        var method = (options.method || "GET").toUpperCase();
        var body = options.body;
        var uri = options.uri;
        curl.push("-X");
        curl.push([ "POST", "PUT", "DELETE" ].indexOf(method) >= 0 ? method : "GET");
        curl.push(uri);
        if ("object" === typeof body && Object.keys(body).length > 0 && [ "POST", "PUT" ].indexOf(method) !== -1) {
            curl.push("-d");
            curl.push("'" + JSON.stringify(body) + "'");
        }
        curl = curl.join(" ");
        console.log(curl);
        return curl;
    };
    Usergrid.Client.prototype.getDisplayImage = function(email, picture, size) {
        size = size || 50;
        var image = "https://apigee.com/usergrid/images/user_profile.png";
        try {
            if (picture) {
                image = picture;
            } else if (email.length) {
                image = "https://secure.gravatar.com/avatar/" + MD5(email) + "?s=" + size + encodeURI("&d=https://apigee.com/usergrid/images/user_profile.png");
            }
        } catch (e) {} finally {
            return image;
        }
    };
    global[name] = Usergrid.Client;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return exports;
    };
    return global[name];
})();

var ENTITY_SYSTEM_PROPERTIES = [ "metadata", "created", "modified", "oldpassword", "newpassword", "type", "activated", "uuid" ];

/*
 *  A class to Model a Usergrid Entity.
 *  Set the type and uuid of entity in the 'data' json object
 *
 *  @constructor
 *  @param {object} options {client:client, data:{'type':'collection_type', uuid:'uuid', 'key':'value'}}
 */
Usergrid.Entity = function(options) {
    this._data = {};
    this._client = undefined;
    if (options) {
        this.set(options.data || {});
        this._client = options.client || {};
    }
};

/*
 *  method to determine whether or not the passed variable is a Usergrid Entity
 *
 *  @method isEntity
 *  @public
 *  @params {any} obj - any variable
 *  @return {boolean} Returns true or false
 */
Usergrid.Entity.isEntity = function(obj) {
    return obj && obj instanceof Usergrid.Entity;
};

/*
 *  method to determine whether or not the passed variable is a Usergrid Entity
 *  That has been saved.
 *
 *  @method isPersistedEntity
 *  @public
 *  @params {any} obj - any variable
 *  @return {boolean} Returns true or false
 */
Usergrid.Entity.isPersistedEntity = function(obj) {
    return isEntity(obj) && isUUID(obj.get("uuid"));
};

/*
 *  returns a serialized version of the entity object
 *
 *  Note: use the client.restoreEntity() function to restore
 *
 *  @method serialize
 *  @return {string} data
 */
Usergrid.Entity.prototype.serialize = function() {
    return JSON.stringify(this._data);
};

/*
 *  gets a specific field or the entire data object. If null or no argument
 *  passed, will return all data, else, will return a specific field
 *
 *  @method get
 *  @param {string} field
 *  @return {string} || {object} data
 */
Usergrid.Entity.prototype.get = function(key) {
    var value;
    if (arguments.length === 0) {
        value = this._data;
    } else if (arguments.length > 1) {
        key = [].slice.call(arguments).reduce(function(p, c, i, a) {
            if (c instanceof Array) {
                p = p.concat(c);
            } else {
                p.push(c);
            }
            return p;
        }, []);
    }
    if (key instanceof Array) {
        var self = this;
        value = key.map(function(k) {
            return self.get(k);
        });
    } else if ("undefined" !== typeof key) {
        value = this._data[key];
    }
    return value;
};

/*
 *  adds a specific key value pair or object to the Entity's data
 *  is additive - will not overwrite existing values unless they
 *  are explicitly specified
 *
 *  @method set
 *  @param {string} key || {object}
 *  @param {string} value
 *  @return none
 */
Usergrid.Entity.prototype.set = function(key, value) {
    if (typeof key === "object") {
        for (var field in key) {
            this._data[field] = key[field];
        }
    } else if (typeof key === "string") {
        if (value === null) {
            delete this._data[key];
        } else {
            this._data[key] = value;
        }
    } else {
        this._data = {};
    }
};

Usergrid.Entity.prototype.getEndpoint = function() {
    var type = this.get("type"), nameProperties = [ "uuid", "name" ], name;
    if (type === undefined) {
        throw new UsergridError("cannot fetch entity, no entity type specified", "no_type_specified");
    } else if (/^users?$/.test(type)) {
        nameProperties.unshift("username");
    }
    name = this.get(nameProperties).filter(function(x) {
        return x !== null && "undefined" !== typeof x;
    }).shift();
    return name ? [ type, name ].join("/") : type;
};

/*
 *  Saves the entity back to the database
 *
 *  @method save
 *  @public
 *  @param {function} callback
 *  @return {callback} callback(err, response, self)
 */
Usergrid.Entity.prototype.save = function(callback) {
    var self = this, type = this.get("type"), method = "POST", entityId = this.get("uuid"), changePassword, entityData = this.get(), options = {
        method: method,
        endpoint: type
    };
    //update the entity if the UUID is present
    if (entityId) {
        options.method = "PUT";
        options.endpoint += "/" + entityId;
    }
    //remove system-specific properties
    options.body = Object.keys(entityData).filter(function(key) {
        return ENTITY_SYSTEM_PROPERTIES.indexOf(key) === -1;
    }).reduce(function(data, key) {
        data[key] = entityData[key];
        return data;
    }, {});
    self._client.request(options, function(err, response) {
        var entity = response.getEntity();
        if (entity) {
            self.set(entity);
            self.set("type", /^\//.test(response.path) ? response.path.substring(1) : response.path);
        }
        if (err && self._client.logging) {
            console.log("could not save entity");
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 *
 * Updates the user's password
 */
Usergrid.Entity.prototype.changePassword = function(oldpassword, newpassword, callback) {
    var self = this;
    if ("function" === typeof oldpassword && callback === undefined) {
        callback = oldpassword;
        oldpassword = self.get("oldpassword");
        newpassword = self.get("newpassword");
    }
    //clear out pw info if present
    self.set({
        password: null,
        oldpassword: null,
        newpassword: null
    });
    if (/^users?$/.test(self.get("type")) && oldpassword && newpassword) {
        var options = {
            method: "PUT",
            endpoint: "users/" + self.get("uuid") + "/password",
            body: {
                uuid: self.get("uuid"),
                username: self.get("username"),
                oldpassword: oldpassword,
                newpassword: newpassword
            }
        };
        self._client.request(options, function(err, response) {
            if (err && self._client.logging) {
                console.log("could not update user");
            }
            //remove old and new password fields so they don't end up as part of the entity object
            doCallback(callback, [ err, response, self ], self);
        });
    } else {
        throw new UsergridInvalidArgumentError("Invalid arguments passed to 'changePassword'");
    }
};

/*
 *  refreshes the entity by making a GET call back to the database
 *
 *  @method fetch
 *  @public
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 */
Usergrid.Entity.prototype.fetch = function(callback) {
    var endpoint, self = this;
    endpoint = this.getEndpoint();
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        var entity = response.getEntity();
        if (entity) {
            self.set(entity);
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 *  deletes the entity from the database - will only delete
 *  if the object has a valid uuid
 *
 *  @method destroy
 *  @public
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 *
 */
Usergrid.Entity.prototype.destroy = function(callback) {
    var self = this;
    var endpoint = this.getEndpoint();
    var options = {
        method: "DELETE",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (!err) {
            self.set(null);
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 *  connects one entity to another
 *
 *  @method connect
 *  @public
 *  @param {string} connection
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 *
 */
Usergrid.Entity.prototype.connect = function(connection, entity, callback) {
    this.addOrRemoveConnection("POST", connection, entity, callback);
};

/*
 *  disconnects one entity from another
 *
 *  @method disconnect
 *  @public
 *  @param {string} connection
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 *
 */
Usergrid.Entity.prototype.disconnect = function(connection, entity, callback) {
    this.addOrRemoveConnection("DELETE", connection, entity, callback);
};

/*
 *  adds or removes a connection between two entities
 *
 *  @method addOrRemoveConnection
 *  @public
 *  @param {string} method
 *  @param {string} connection
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 *
 */
Usergrid.Entity.prototype.addOrRemoveConnection = function(method, connection, entity, callback) {
    var self = this;
    if ([ "POST", "DELETE" ].indexOf(method.toUpperCase()) == -1) {
        throw new UsergridInvalidArgumentError("invalid method for connection call. must be 'POST' or 'DELETE'");
    }
    //connectee info
    var connecteeType = entity.get("type");
    var connectee = this.getEntityId(entity);
    if (!connectee) {
        throw new UsergridInvalidArgumentError("connectee could not be identified");
    }
    var connectorType = this.get("type");
    var connector = this.getEntityId(this);
    if (!connector) {
        throw new UsergridInvalidArgumentError("connector could not be identified");
    }
    var endpoint = [ connectorType, connector, connection, connecteeType, connectee ].join("/");
    var options = {
        method: method,
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (err && self._client.logging) {
            console.log("There was an error with the connection call");
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 *  returns a unique identifier for an entity
 *
 *  @method connect
 *  @public
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 *
 */
Usergrid.Entity.prototype.getEntityId = function(entity) {
    var id;
    if (isUUID(entity.get("uuid"))) {
        id = entity.get("uuid");
    } else if (this.get("type") === "users" || this.get("type") === "user") {
        id = entity.get("username");
    } else {
        id = entity.get("name");
    }
    return id;
};

/*
 *  gets an entities connections
 *
 *  @method getConnections
 *  @public
 *  @param {string} connection
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data, connections)
 *
 */
Usergrid.Entity.prototype.getConnections = function(connection, callback) {
    var self = this;
    var connectorType = this.get("type");
    var connector = this.getEntityId(this);
    if (!connector) {
        if (typeof callback === "function") {
            var error = "Error in getConnections - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            doCallback(callback, [ true, error ], self);
        }
        return;
    }
    var endpoint = connectorType + "/" + connector + "/" + connection + "/";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be connected");
        }
        self[connection] = {};
        var length = data && data.entities ? data.entities.length : 0;
        for (var i = 0; i < length; i++) {
            if (data.entities[i].type === "user") {
                self[connection][data.entities[i].username] = data.entities[i];
            } else {
                self[connection][data.entities[i].name] = data.entities[i];
            }
        }
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Entity.prototype.getGroups = function(callback) {
    var self = this;
    var endpoint = "users" + "/" + this.get("uuid") + "/groups";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be connected");
        }
        self.groups = data.entities;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Entity.prototype.getActivities = function(callback) {
    var self = this;
    var endpoint = this.get("type") + "/" + this.get("uuid") + "/activities";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be connected");
        }
        for (var entity in data.entities) {
            data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
        }
        self.activities = data.entities;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Entity.prototype.getFollowing = function(callback) {
    var self = this;
    var endpoint = "users" + "/" + this.get("uuid") + "/following";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not get user following");
        }
        for (var entity in data.entities) {
            data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
            var image = self._client.getDisplayImage(data.entities[entity].email, data.entities[entity].picture);
            data.entities[entity]._portal_image_icon = image;
        }
        self.following = data.entities;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Entity.prototype.getFollowers = function(callback) {
    var self = this;
    var endpoint = "users" + "/" + this.get("uuid") + "/followers";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not get user followers");
        }
        for (var entity in data.entities) {
            data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
            var image = self._client.getDisplayImage(data.entities[entity].email, data.entities[entity].picture);
            data.entities[entity]._portal_image_icon = image;
        }
        self.followers = data.entities;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Client.prototype.createRole = function(roleName, permissions, callback) {
    var options = {
        type: "role",
        name: roleName
    };
    this.createEntity(options, function(err, response, entity) {
        if (err) {
            doCallback(callback, [ err, response, self ]);
        } else {
            entity.assignPermissions(permissions, function(err, data) {
                if (err) {
                    doCallback(callback, [ err, response, self ]);
                } else {
                    doCallback(callback, [ err, data, data.data ], self);
                }
            });
        }
    });
};

Usergrid.Entity.prototype.getRoles = function(callback) {
    var self = this;
    var endpoint = this.get("type") + "/" + this.get("uuid") + "/roles";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not get user roles");
        }
        self.roles = data.entities;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

Usergrid.Entity.prototype.assignRole = function(roleName, callback) {
    var self = this;
    var type = self.get("type");
    var collection = type + "s";
    var entityID;
    if (type == "user" && this.get("username") != null) {
        entityID = self.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = self.get("name");
    } else if (this.get("uuid") != null) {
        entityID = self.get("uuid");
    }
    if (type != "users" && type != "groups") {
        doCallback(callback, [ new UsergridError("entity must be a group or user", "invalid_entity_type"), null, this ], this);
    }
    var endpoint = "roles/" + roleName + "/" + collection + "/" + entityID;
    var options = {
        method: "POST",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (err) {
            console.log("Could not assign role.");
        }
        doCallback(callback, [ err, response, self ]);
    });
};

Usergrid.Entity.prototype.removeRole = function(roleName, callback) {
    var self = this;
    var type = self.get("type");
    var collection = type + "s";
    var entityID;
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    if (type != "users" && type != "groups") {
        doCallback(callback, [ new UsergridError("entity must be a group or user", "invalid_entity_type"), null, this ], this);
    }
    var endpoint = "roles/" + roleName + "/" + collection + "/" + entityID;
    var options = {
        method: "DELETE",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (err) {
            console.log("Could not assign role.");
        }
        doCallback(callback, [ err, response, self ]);
    });
};

Usergrid.Entity.prototype.assignPermissions = function(permissions, callback) {
    var self = this;
    var entityID;
    var type = this.get("type");
    if (type != "user" && type != "users" && type != "group" && type != "groups" && type != "role" && type != "roles") {
        doCallback(callback, [ new UsergridError("entity must be a group, user, or role", "invalid_entity_type"), null, this ], this);
    }
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    var endpoint = type + "/" + entityID + "/permissions";
    var options = {
        method: "POST",
        endpoint: endpoint,
        body: {
            permission: permissions
        }
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not assign permissions");
        }
        doCallback(callback, [ err, data, data.data ], self);
    });
};

Usergrid.Entity.prototype.removePermissions = function(permissions, callback) {
    var self = this;
    var entityID;
    var type = this.get("type");
    if (type != "user" && type != "users" && type != "group" && type != "groups" && type != "role" && type != "roles") {
        doCallback(callback, [ new UsergridError("entity must be a group, user, or role", "invalid_entity_type"), null, this ], this);
    }
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    var endpoint = type + "/" + entityID + "/permissions";
    var options = {
        method: "DELETE",
        endpoint: endpoint,
        qs: {
            permission: permissions
        }
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not remove permissions");
        }
        doCallback(callback, [ err, data, data.params.permission ], self);
    });
};

Usergrid.Entity.prototype.getPermissions = function(callback) {
    var self = this;
    var type = self.get("type");
    var collection = type + "s";
    var entityID;
    if (type == "user" && this.get("username") != null) {
        entityID = self.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = self.get("name");
    } else if (this.get("uuid") != null) {
        entityID = self.get("uuid");
    }
    if (type != "users" && type != "groups") {
        doCallback(callback, [ new UsergridError("entity must be a group or user", "invalid_entity_type"), null, this ], this);
    }
    var endpoint = "roles/" + roleName + "/" + collection + "/" + entityID;
    var options = {
        method: "POST",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (err) {
            console.log("Could not assign role.");
        }
        doCallback(callback, [ err, response, self ]);
    });
};

Usergrid.Entity.prototype.removeRole = function(roleName, callback) {
    var self = this;
    var type = self.get("type");
    var collection = type + "s";
    var entityID;
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    if (type != "users" && type != "groups") {
        doCallback(callback, [ new UsergridError("entity must be a group or user", "invalid_entity_type"), null, this ], this);
    }
    var endpoint = "roles/" + roleName + "/" + collection + "/" + entityID;
    var options = {
        method: "DELETE",
        endpoint: endpoint
    };
    this._client.request(options, function(err, response) {
        if (err) {
            console.log("Could not assign role.");
        }
        doCallback(callback, [ err, response, self ]);
    });
};

Usergrid.Entity.prototype.assignPermissions = function(permissions, callback) {
    var self = this;
    var entityID;
    var type = this.get("type");
    if (type != "user" && type != "users" && type != "group" && type != "groups" && type != "role" && type != "roles") {
        doCallback(callback, [ new UsergridError("entity must be a group, user, or role", "invalid_entity_type"), null, this ], this);
    }
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    var endpoint = type + "/" + entityID + "/permissions";
    var options = {
        method: "POST",
        endpoint: endpoint,
        body: {
            permission: permissions
        }
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not assign permissions");
        }
        doCallback(callback, [ err, data, data.data ], self);
    });
};

Usergrid.Entity.prototype.removePermissions = function(permissions, callback) {
    var self = this;
    var entityID;
    var type = this.get("type");
    if (type != "user" && type != "users" && type != "group" && type != "groups" && type != "role" && type != "roles") {
        doCallback(callback, [ new UsergridError("entity must be a group, user, or role", "invalid_entity_type"), null, this ], this);
    }
    if (type == "user" && this.get("username") != null) {
        entityID = this.get("username");
    } else if (type == "group" && this.get("name") != null) {
        entityID = this.get("name");
    } else if (this.get("uuid") != null) {
        entityID = this.get("uuid");
    }
    var endpoint = type + "/" + entityID + "/permissions";
    var options = {
        method: "DELETE",
        endpoint: endpoint,
        qs: {
            permission: permissions
        }
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not remove permissions");
        }
        doCallback(callback, [ err, data, data.params.permission ], self);
    });
};

Usergrid.Entity.prototype.getPermissions = function(callback) {
    var self = this;
    var endpoint = this.get("type") + "/" + this.get("uuid") + "/permissions";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not get user permissions");
        }
        var permissions = [];
        if (data.data) {
            var perms = data.data;
            var count = 0;
            for (var i in perms) {
                count++;
                var perm = perms[i];
                var parts = perm.split(":");
                var ops_part = "";
                var path_part = parts[0];
                if (parts.length > 1) {
                    ops_part = parts[0];
                    path_part = parts[1];
                }
                ops_part = ops_part.replace("*", "get,post,put,delete");
                var ops = ops_part.split(",");
                var ops_object = {};
                ops_object.get = "no";
                ops_object.post = "no";
                ops_object.put = "no";
                ops_object.delete = "no";
                for (var j in ops) {
                    ops_object[ops[j]] = "yes";
                }
                permissions.push({
                    operations: ops_object,
                    path: path_part,
                    perm: perm
                });
            }
        }
        self.permissions = permissions;
        doCallback(callback, [ err, data, data.entities ], self);
    });
};

/*
 *  The Collection class models Usergrid Collections.  It essentially
 *  acts as a container for holding Entity objects, while providing
 *  additional funcitonality such as paging, and saving
 *
 *  @constructor
 *  @param {string} options - configuration object
 *  @return {Collection} collection
 */
Usergrid.Collection = function(options) {
    if (options) {
        this._client = options.client;
        this._type = options.type;
        this.qs = options.qs || {};
        //iteration
        this._list = options.list || [];
        this._iterator = options.iterator || -1;
        //first thing we do is increment, so set to -1
        //paging
        this._previous = options.previous || [];
        this._next = options.next || null;
        this._cursor = options.cursor || null;
        //restore entities if available
        if (options.list) {
            var count = options.list.length;
            for (var i = 0; i < count; i++) {
                //make new entity with
                var entity = this._client.restoreEntity(options.list[i]);
                this._list[i] = entity;
            }
        }
    }
};

/*
 *  method to determine whether or not the passed variable is a Usergrid Collection
 *
 *  @method isCollection
 *  @public
 *  @params {any} obj - any variable
 *  @return {boolean} Returns true or false
 */
Usergrid.isCollection = function(obj) {
    return obj && obj instanceof Usergrid.Collection;
};

/*
 *  gets the data from the collection object for serialization
 *
 *  @method serialize
 *  @return {object} data
 */
Usergrid.Collection.prototype.serialize = function() {
    //pull out the state from this object and return it
    var data = {};
    data.type = this._type;
    data.qs = this.qs;
    data.iterator = this._iterator;
    data.previous = this._previous;
    data.next = this._next;
    data.cursor = this._cursor;
    this.resetEntityPointer();
    var i = 0;
    data.list = [];
    while (this.hasNextEntity()) {
        var entity = this.getNextEntity();
        data.list[i] = entity.serialize();
        i++;
    }
    data = JSON.stringify(data);
    return data;
};

/*Usergrid.Collection.prototype.addCollection = function (collectionName, options, callback) {
  self = this;
  options.client = this._client;
  var collection = new Usergrid.Collection(options, function(err, data) {
    if (typeof(callback) === 'function') {

      collection.resetEntityPointer();
      while(collection.hasNextEntity()) {
        var user = collection.getNextEntity();
        var email = user.get('email');
        var image = self._client.getDisplayImage(user.get('email'), user.get('picture'));
        user._portal_image_icon = image;
      }

      self[collectionName] = collection;
      doCallback(callback, [err, collection], self);
    }
  });
};*/
/*
 *  Populates the collection from the server
 *
 *  @method fetch
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 */
Usergrid.Collection.prototype.fetch = function(callback) {
    var self = this;
    var qs = this.qs;
    //add in the cursor if one is available
    if (this._cursor) {
        qs.cursor = this._cursor;
    } else {
        delete qs.cursor;
    }
    var options = {
        method: "GET",
        endpoint: this._type,
        qs: this.qs
    };
    this._client.request(options, function(err, response) {
        if (err && self._client.logging) {
            console.log("error getting collection");
        } else {
            
            //save the cursor if there is one
            self.saveCursor(response.cursor || null);
            self.resetEntityPointer();
            //save entities locally
            self._list = response.getEntities().filter(function(entity) {
                return isUUID(entity.uuid);
            }).map(function(entity) {
                var ent = new Usergrid.Entity({
                    client: self._client
                });
                ent.set(entity);
                ent.type = self._type;
                return ent;
            });
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 *  Adds a new Entity to the collection (saves, then adds to the local object)
 *
 *  @method addNewEntity
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data, entity)
 */
Usergrid.Collection.prototype.addEntity = function(entityObject, callback) {
    var self = this;
    entityObject.type = this._type;
    this._client.createEntity(entityObject, function(err, response, entity) {
        if (!err) {
            self.addExistingEntity(entity);
        }
        doCallback(callback, [ err, response, self ], self);
    });
};

Usergrid.Collection.prototype.addExistingEntity = function(entity) {
    //entity should already exist in the db, so just add it to the list
    var count = this._list.length;
    this._list[count] = entity;
};

/*
 *  Removes the Entity from the collection, then destroys the object on the server
 *
 *  @method destroyEntity
 *  @param {object} entity
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 */
Usergrid.Collection.prototype.destroyEntity = function(entity, callback) {
    var self = this;
    entity.destroy(function(err, response) {
        if (err) {
            if (self._client.logging) {
                console.log("could not destroy entity");
            }
            doCallback(callback, [ err, response, self ], self);
        } else {
            //destroy was good, so repopulate the collection
            self.fetch(callback);
        }
        //remove entity from the local store
        self.removeEntity(entity);
    });
};

/*
 * Filters the list of entities based on the supplied criteria function
 * works like Array.prototype.filter
 *
 *  @method getEntitiesByCriteria
 *  @param {function} criteria  A function that takes each entity as an argument and returns true or false
 *  @return {Entity[]} returns a list of entities that caused the criteria function to return true
 */
Usergrid.Collection.prototype.getEntitiesByCriteria = function(criteria) {
    return this._list.filter(criteria);
};

/*
 * Returns the first entity from the list of entities based on the supplied criteria function
 * works like Array.prototype.filter
 *
 *  @method getEntitiesByCriteria
 *  @param {function} criteria  A function that takes each entity as an argument and returns true or false
 *  @return {Entity[]} returns a list of entities that caused the criteria function to return true
 */
Usergrid.Collection.prototype.getEntityByCriteria = function(criteria) {
    return this.getEntitiesByCriteria(criteria).shift();
};

/*
 * Removed an entity from the collection without destroying it on the server
 *
 *  @method removeEntity
 *  @param {object} entity
 *  @return {Entity} returns the removed entity or undefined if it was not found
 */
Usergrid.Collection.prototype.removeEntity = function(entity) {
    var removedEntity = this.getEntityByCriteria(function(item) {
        return entity.uuid === item.get("uuid");
    });
    delete this._list[this._list.indexOf(removedEntity)];
    return removedEntity;
};

/*
 *  Looks up an Entity by UUID
 *
 *  @method getEntityByUUID
 *  @param {string} UUID
 *  @param {function} callback
 *  @return {callback} callback(err, data, entity)
 */
Usergrid.Collection.prototype.getEntityByUUID = function(uuid, callback) {
    var entity = this.getEntityByCriteria(function(item) {
        return item.get("uuid") === uuid;
    });
    if (entity) {
        doCallback(callback, [ null, entity, entity ], this);
    } else {
        //get the entity from the database
        var options = {
            data: {
                type: this._type,
                uuid: uuid
            },
            client: this._client
        };
        entity = new Usergrid.Entity(options);
        entity.fetch(callback);
    }
};

/*
 *  Returns the first Entity of the Entity list - does not affect the iterator
 *
 *  @method getFirstEntity
 *  @return {object} returns an entity object
 */
Usergrid.Collection.prototype.getFirstEntity = function() {
    var count = this._list.length;
    if (count > 0) {
        return this._list[0];
    }
    return null;
};

/*
 *  Returns the last Entity of the Entity list - does not affect the iterator
 *
 *  @method getLastEntity
 *  @return {object} returns an entity object
 */
Usergrid.Collection.prototype.getLastEntity = function() {
    var count = this._list.length;
    if (count > 0) {
        return this._list[count - 1];
    }
    return null;
};

/*
 *  Entity iteration -Checks to see if there is a "next" entity
 *  in the list.  The first time this method is called on an entity
 *  list, or after the resetEntityPointer method is called, it will
 *  return true referencing the first entity in the list
 *
 *  @method hasNextEntity
 *  @return {boolean} true if there is a next entity, false if not
 */
Usergrid.Collection.prototype.hasNextEntity = function() {
    var next = this._iterator + 1;
    var hasNextElement = next >= 0 && next < this._list.length;
    if (hasNextElement) {
        return true;
    }
    return false;
};

/*
 *  Entity iteration - Gets the "next" entity in the list.  The first
 *  time this method is called on an entity list, or after the method
 *  resetEntityPointer is called, it will return the,
 *  first entity in the list
 *
 *  @method hasNextEntity
 *  @return {object} entity
 */
Usergrid.Collection.prototype.getNextEntity = function() {
    this._iterator++;
    var hasNextElement = this._iterator >= 0 && this._iterator <= this._list.length;
    if (hasNextElement) {
        return this._list[this._iterator];
    }
    return false;
};

/*
 *  Entity iteration - Checks to see if there is a "previous"
 *  entity in the list.
 *
 *  @method hasPrevEntity
 *  @return {boolean} true if there is a previous entity, false if not
 */
Usergrid.Collection.prototype.hasPrevEntity = function() {
    var previous = this._iterator - 1;
    var hasPreviousElement = previous >= 0 && previous < this._list.length;
    if (hasPreviousElement) {
        return true;
    }
    return false;
};

/*
 *  Entity iteration - Gets the "previous" entity in the list.
 *
 *  @method getPrevEntity
 *  @return {object} entity
 */
Usergrid.Collection.prototype.getPrevEntity = function() {
    this._iterator--;
    var hasPreviousElement = this._iterator >= 0 && this._iterator <= this._list.length;
    if (hasPreviousElement) {
        return this._list[this._iterator];
    }
    return false;
};

/*
 *  Entity iteration - Resets the iterator back to the beginning
 *  of the list
 *
 *  @method resetEntityPointer
 *  @return none
 */
Usergrid.Collection.prototype.resetEntityPointer = function() {
    this._iterator = -1;
};

/*
 * Method to save off the cursor just returned by the last API call
 *
 * @public
 * @method saveCursor
 * @return none
 */
Usergrid.Collection.prototype.saveCursor = function(cursor) {
    //if current cursor is different, grab it for next cursor
    if (this._next !== cursor) {
        this._next = cursor;
    }
};

/*
 * Resets the paging pointer (back to original page)
 *
 * @public
 * @method resetPaging
 * @return none
 */
Usergrid.Collection.prototype.resetPaging = function() {
    this._previous = [];
    this._next = null;
    this._cursor = null;
};

/*
 *  Paging -  checks to see if there is a next page od data
 *
 *  @method hasNextPage
 *  @return {boolean} returns true if there is a next page of data, false otherwise
 */
Usergrid.Collection.prototype.hasNextPage = function() {
    return this._next;
};

/*
 *  Paging - advances the cursor and gets the next
 *  page of data from the API.  Stores returned entities
 *  in the Entity list.
 *
 *  @method getNextPage
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 */
Usergrid.Collection.prototype.getNextPage = function(callback) {
    if (this.hasNextPage()) {
        //set the cursor to the next page of data
        this._previous.push(this._cursor);
        this._cursor = this._next;
        //empty the list
        this._list = [];
        this.fetch(callback);
    }
};

/*
 *  Paging -  checks to see if there is a previous page od data
 *
 *  @method hasPreviousPage
 *  @return {boolean} returns true if there is a previous page of data, false otherwise
 */
Usergrid.Collection.prototype.hasPreviousPage = function() {
    return this._previous.length > 0;
};

/*
 *  Paging - reverts the cursor and gets the previous
 *  page of data from the API.  Stores returned entities
 *  in the Entity list.
 *
 *  @method getPreviousPage
 *  @param {function} callback
 *  @return {callback} callback(err, data)
 */
Usergrid.Collection.prototype.getPreviousPage = function(callback) {
    if (this.hasPreviousPage()) {
        this._next = null;
        //clear out next so the comparison will find the next item
        this._cursor = this._previous.pop();
        //empty the list
        this._list = [];
        this.fetch(callback);
    }
};

/*
 *  A class to model a Usergrid group.
 *  Set the path in the options object.
 *
 *  @constructor
 *  @param {object} options {client:client, data: {'key': 'value'}, path:'path'}
 */
Usergrid.Group = function(options, callback) {
    this._path = options.path;
    this._list = [];
    this._client = options.client;
    this._data = options.data || {};
    this._data.type = "groups";
};

/*
 *  Inherit from Usergrid.Entity.
 *  Note: This only accounts for data on the group object itself.
 *  You need to use add and remove to manipulate group membership.
 */
Usergrid.Group.prototype = new Usergrid.Entity();

/*
 *  Fetches current group data, and members.
 *
 *  @method fetch
 *  @public
 *  @param {function} callback
 *  @returns {function} callback(err, data)
 */
Usergrid.Group.prototype.fetch = function(callback) {
    var self = this;
    var groupEndpoint = "groups/" + this._path;
    var memberEndpoint = "groups/" + this._path + "/users";
    var groupOptions = {
        method: "GET",
        endpoint: groupEndpoint
    };
    var memberOptions = {
        method: "GET",
        endpoint: memberEndpoint
    };
    this._client.request(groupOptions, function(err, response) {
        if (err) {
            if (self._client.logging) {
                console.log("error getting group");
            }
            doCallback(callback, [ err, response ], self);
        } else {
            var entities = response.getEntities();
            if (entities && entities.length) {
                var groupresponse = entities.shift();
                self._client.request(memberOptions, function(err, response) {
                    if (err && self._client.logging) {
                        console.log("error getting group users");
                    } else {
                        self._list = response.getEntities().filter(function(entity) {
                            return isUUID(entity.uuid);
                        }).map(function(entity) {
                            return new Usergrid.Entity({
                                type: entity.type,
                                client: self._client,
                                uuid: entity.uuid,
                                response: entity
                            });
                        });
                    }
                    doCallback(callback, [ err, response, self ], self);
                });
            }
        }
    });
};

/*
 *  Retrieves the members of a group.
 *
 *  @method members
 *  @public
 *  @param {function} callback
 *  @return {function} callback(err, data);
 */
Usergrid.Group.prototype.members = function(callback) {
    return this._list;
};

/*
 *  Adds an existing user to the group, and refreshes the group object.
 *
 *  Options object: {user: user_entity}
 *
 *  @method add
 *  @public
 *  @params {object} options
 *  @param {function} callback
 *  @return {function} callback(err, data)
 */
Usergrid.Group.prototype.add = function(options, callback) {
    var self = this;
    if (options.user) {
        options = {
            method: "POST",
            endpoint: "groups/" + this._path + "/users/" + options.user.get("username")
        };
        this._client.request(options, function(error, response) {
            if (error) {
                doCallback(callback, [ error, response, self ], self);
            } else {
                self.fetch(callback);
            }
        });
    } else {
        doCallback(callback, [ new UsergridError("no user specified", "no_user_specified"), null, this ], this);
    }
};

/*
 *  Removes a user from a group, and refreshes the group object.
 *
 *  Options object: {user: user_entity}
 *
 *  @method remove
 *  @public
 *  @params {object} options
 *  @param {function} callback
 *  @return {function} callback(err, data)
 */
Usergrid.Group.prototype.remove = function(options, callback) {
    var self = this;
    if (options.user) {
        options = {
            method: "DELETE",
            endpoint: "groups/" + this._path + "/users/" + options.user.username
        };
        this._client.request(options, function(error, response) {
            if (error) {
                doCallback(callback, [ error, response, self ], self);
            } else {
                self.fetch(callback);
            }
        });
    } else {
        doCallback(callback, [ new UsergridError("no user specified", "no_user_specified"), null, this ], this);
    }
};

/*
 * Gets feed for a group.
 *
 * @public
 * @method feed
 * @param {function} callback
 * @returns {callback} callback(err, data, activities)
 */
Usergrid.Group.prototype.feed = function(callback) {
    var self = this;
    var options = {
        method: "GET",
        endpoint: "groups/" + this._path + "/feed"
    };
    this._client.request(options, function(err, response) {
        doCallback(callback, [ err, response, self ], self);
    });
};

/*
 * Creates activity and posts to group feed.
 *
 * options object: {user: user_entity, content: "activity content"}
 *
 * @public
 * @method createGroupActivity
 * @params {object} options
 * @param {function} callback
 * @returns {callback} callback(err, entity)
 */
Usergrid.Group.prototype.createGroupActivity = function(options, callback) {
    var self = this;
    var user = options.user;
    var entity = new Usergrid.Entity({
        client: this._client,
        data: {
            actor: {
                displayName: user.get("username"),
                uuid: user.get("uuid"),
                username: user.get("username"),
                email: user.get("email"),
                picture: user.get("picture"),
                image: {
                    duration: 0,
                    height: 80,
                    url: user.get("picture"),
                    width: 80
                }
            },
            verb: "post",
            content: options.content,
            type: "groups/" + this._path + "/activities"
        }
    });
    entity.save(function(err, response, entity) {
        doCallback(callback, [ err, response, self ]);
    });
};

/*
 *  A class to model a Usergrid event.
 *
 *  @constructor
 *  @param {object} options {timestamp:0, category:'value', counters:{name : value}}
 *  @returns {callback} callback(err, event)
 */
Usergrid.Counter = function(options) {
    this._client = options.client;
    this._data = options.data || {};
    this._data.category = options.category || "UNKNOWN";
    this._data.timestamp = options.timestamp || 0;
    this._data.type = "events";
    this._data.counters = options.counters || {};
};

var COUNTER_RESOLUTIONS = [ "all", "minute", "five_minutes", "half_hour", "hour", "six_day", "day", "week", "month" ];

/*
 *  Inherit from Usergrid.Entity.
 *  Note: This only accounts for data on the group object itself.
 *  You need to use add and remove to manipulate group membership.
 */
Usergrid.Counter.prototype = new Usergrid.Entity();

/*
 * overrides Entity.prototype.fetch. Returns all data for counters
 * associated with the object as specified in the constructor
 *
 * @public
 * @method increment
 * @param {function} callback
 * @returns {callback} callback(err, event)
 */
Usergrid.Counter.prototype.fetch = function(callback) {
    this.getData({}, callback);
};

/*
 * increments the counter for a specific event
 *
 * options object: {name: counter_name}
 *
 * @public
 * @method increment
 * @params {object} options
 * @param {function} callback
 * @returns {callback} callback(err, event)
 */
Usergrid.Counter.prototype.increment = function(options, callback) {
    var self = this, name = options.name, value = options.value;
    if (!name) {
        return doCallback(callback, [ new UsergridInvalidArgumentError("'name' for increment, decrement must be a number"), null, self ], self);
    } else if (isNaN(value)) {
        return doCallback(callback, [ new UsergridInvalidArgumentError("'value' for increment, decrement must be a number"), null, self ], self);
    } else {
        self._data.counters[name] = parseInt(value) || 1;
        return self.save(callback);
    }
};

/*
 * decrements the counter for a specific event
 *
 * options object: {name: counter_name}
 *
 * @public
 * @method decrement
 * @params {object} options
 * @param {function} callback
 * @returns {callback} callback(err, event)
 */
Usergrid.Counter.prototype.decrement = function(options, callback) {
    var self = this, name = options.name, value = options.value;
    self.increment({
        name: name,
        value: -(parseInt(value) || 1)
    }, callback);
};

/*
 * resets the counter for a specific event
 *
 * options object: {name: counter_name}
 *
 * @public
 * @method reset
 * @params {object} options
 * @param {function} callback
 * @returns {callback} callback(err, event)
 */
Usergrid.Counter.prototype.reset = function(options, callback) {
    var self = this, name = options.name;
    self.increment({
        name: name,
        value: 0
    }, callback);
};

/*
 * gets data for one or more counters over a given
 * time period at a specified resolution
 *
 * options object: {
 *                   counters: ['counter1', 'counter2', ...],
 *                   start: epoch timestamp or ISO date string,
 *                   end: epoch timestamp or ISO date string,
 *                   resolution: one of ('all', 'minute', 'five_minutes', 'half_hour', 'hour', 'six_day', 'day', 'week', or 'month')
 *                   }
 *
 * @public
 * @method getData
 * @params {object} options
 * @param {function} callback
 * @returns {callback} callback(err, event)
 */
Usergrid.Counter.prototype.getData = function(options, callback) {
    var start_time, end_time, start = options.start || 0, end = options.end || Date.now(), resolution = (options.resolution || "all").toLowerCase(), counters = options.counters || Object.keys(this._data.counters), res = (resolution || "all").toLowerCase();
    if (COUNTER_RESOLUTIONS.indexOf(res) === -1) {
        res = "all";
    }
    start_time = getSafeTime(start);
    end_time = getSafeTime(end);
    var self = this;
    var params = Object.keys(counters).map(function(counter) {
        return [ "counter", encodeURIComponent(counters[counter]) ].join("=");
    });
    params.push("resolution=" + res);
    params.push("start_time=" + String(start_time));
    params.push("end_time=" + String(end_time));
    var endpoint = "counters?" + params.join("&");
    this._client.request({
        endpoint: endpoint
    }, function(err, data) {
        if (data.counters && data.counters.length) {
            data.counters.forEach(function(counter) {
                self._data.counters[counter.name] = counter.value || counter.values;
            });
        }
        return doCallback(callback, [ err, data, self ], self);
    });
};

function getSafeTime(prop) {
    var time;
    switch (typeof prop) {
      case "undefined":
        time = Date.now();
        break;

      case "number":
        time = prop;
        break;

      case "string":
        time = isNaN(prop) ? Date.parse(prop) : parseInt(prop);
        break;

      default:
        time = Date.parse(prop.toString());
    }
    return time;
}

/*
 *  A class to model a Usergrid folder.
 *
 *  @constructor
 *  @param {object} options {name:"MyPhotos", path:"/user/uploads", owner:"00000000-0000-0000-0000-000000000000" }
 *  @returns {callback} callback(err, folder)
 */
Usergrid.Folder = function(options, callback) {
    var self = this, messages = [];
    console.log("FOLDER OPTIONS", options);
    self._client = options.client;
    self._data = options.data || {};
    self._data.type = "folders";
    var missingData = [ "name", "owner", "path" ].some(function(required) {
        return !(required in self._data);
    });
    if (missingData) {
        return doCallback(callback, [ new UsergridInvalidArgumentError("Invalid asset data: 'name', 'owner', and 'path' are required properties."), null, self ], self);
    }
    self.save(function(err, response) {
        if (err) {
            doCallback(callback, [ new UsergridError(response), response, self ], self);
        } else {
            if (response && response.entities && response.entities.length) {
                self.set(response.entities[0]);
            }
            doCallback(callback, [ null, response, self ], self);
        }
    });
};

/*
 *  Inherit from Usergrid.Entity.
 */
Usergrid.Folder.prototype = new Usergrid.Entity();

/*
 *  fetch the folder and associated assets
 *
 *  @method fetch
 *  @public
 *  @param {function} callback(err, self)
 *  @returns {callback} callback(err, self)
 */
Usergrid.Folder.prototype.fetch = function(callback) {
    var self = this;
    Usergrid.Entity.prototype.fetch.call(self, function(err, data) {
        console.log("self", self.get());
        console.log("data", data);
        if (!err) {
            self.getAssets(function(err, response) {
                if (err) {
                    doCallback(callback, [ new UsergridError(response), resonse, self ], self);
                } else {
                    doCallback(callback, [ null, self ], self);
                }
            });
        } else {
            doCallback(callback, [ null, data, self ], self);
        }
    });
};

/*
 *  Add an asset to the folder.
 *
 *  @method addAsset
 *  @public
 *  @param {object} options {asset:(uuid || Usergrid.Asset || {name:"photo.jpg", path:"/user/uploads", "content-type":"image/jpeg", owner:"F01DE600-0000-0000-0000-000000000000" }) }
 *  @returns {callback} callback(err, folder)
 */
Usergrid.Folder.prototype.addAsset = function(options, callback) {
    var self = this;
    if ("asset" in options) {
        var asset = null;
        switch (typeof options.asset) {
          case "object":
            asset = options.asset;
            if (!(asset instanceof Usergrid.Entity)) {
                asset = new Usergrid.Asset(asset);
            }
            break;

          case "string":
            if (isUUID(options.asset)) {
                asset = new Usergrid.Asset({
                    client: self._client,
                    data: {
                        uuid: options.asset,
                        type: "assets"
                    }
                });
            }
            break;
        }
        if (asset && asset instanceof Usergrid.Entity) {
            asset.fetch(function(err, data) {
                if (err) {
                    doCallback(callback, [ new UsergridError(data), data, self ], self);
                } else {
                    var endpoint = [ "folders", self.get("uuid"), "assets", asset.get("uuid") ].join("/");
                    var options = {
                        method: "POST",
                        endpoint: endpoint
                    };
                    self._client.request(options, callback);
                }
            });
        }
    } else {
        //nothing to add 
        doCallback(callback, [ new UsergridInvalidArgumentError("No asset specified"), null, self ], self);
    }
};

/*
 *  Remove an asset from the folder.
 *
 *  @method removeAsset
 *  @public
 *  @param {object} options {asset:(uuid || Usergrid.Asset || {name:"photo.jpg", path:"/user/uploads", "content-type":"image/jpeg", owner:"F01DE600-0000-0000-0000-000000000000" }) }
 *  @returns {callback} callback(err, folder)
 */
Usergrid.Folder.prototype.removeAsset = function(options, callback) {
    var self = this;
    if ("asset" in options) {
        var asset = null;
        switch (typeof options.asset) {
          case "object":
            asset = options.asset;
            break;

          case "string":
            if (isUUID(options.asset)) {
                asset = new Usergrid.Asset({
                    client: self._client,
                    data: {
                        uuid: options.asset,
                        type: "assets"
                    }
                });
            }
            break;
        }
        if (asset && asset !== null) {
            var endpoint = [ "folders", self.get("uuid"), "assets", asset.get("uuid") ].join("/");
            self._client.request({
                method: "DELETE",
                endpoint: endpoint
            }, function(err, response) {
                if (err) {
                    doCallback(callback, [ new UsergridError(response), response, self ], self);
                } else {
                    doCallback(callback, [ null, response, self ], self);
                }
            });
        }
    } else {
        //nothing to add
        doCallback(callback, [ new UsergridInvalidArgumentError("No asset specified"), null, self ], self);
    }
};

/*
 *  List the assets in the folder.
 *
 *  @method getAssets
 *  @public
 *  @returns {callback} callback(err, assets)
 */
Usergrid.Folder.prototype.getAssets = function(callback) {
    return this.getConnections("assets", callback);
};

/*
 *  XMLHttpRequest.prototype.sendAsBinary polyfill
 *  from: https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#sendAsBinary()
 *
 *  @method sendAsBinary
 *  @param {string} sData
 */
if (!XMLHttpRequest.prototype.sendAsBinary) {
    XMLHttpRequest.prototype.sendAsBinary = function(sData) {
        var nBytes = sData.length, ui8Data = new Uint8Array(nBytes);
        for (var nIdx = 0; nIdx < nBytes; nIdx++) {
            ui8Data[nIdx] = sData.charCodeAt(nIdx) & 255;
        }
        this.send(ui8Data);
    };
}

/*
 *  A class to model a Usergrid asset.
 *
 *  @constructor
 *  @param {object} options {name:"photo.jpg", path:"/user/uploads", "content-type":"image/jpeg", owner:"F01DE600-0000-0000-0000-000000000000" }
 *  @returns {callback} callback(err, asset)
 */
Usergrid.Asset = function(options, callback) {
    var self = this, messages = [];
    self._client = options.client;
    self._data = options.data || {};
    self._data.type = "assets";
    var missingData = [ "name", "owner", "path" ].some(function(required) {
        return !(required in self._data);
    });
    if (missingData) {
        doCallback(callback, [ new UsergridError("Invalid asset data: 'name', 'owner', and 'path' are required properties."), null, self ], self);
    } else {
        self.save(function(err, data) {
            if (err) {
                doCallback(callback, [ new UsergridError(data), data, self ], self);
            } else {
                if (data && data.entities && data.entities.length) {
                    self.set(data.entities[0]);
                }
                doCallback(callback, [ null, data, self ], self);
            }
        });
    }
};

/*
 *  Inherit from Usergrid.Entity.
 */
Usergrid.Asset.prototype = new Usergrid.Entity();

/*
 *  Add an asset to a folder.
 *
 *  @method connect
 *  @public
 *  @param {object} options {folder:"F01DE600-0000-0000-0000-000000000000"}
 *  @returns {callback} callback(err, asset)
 */
Usergrid.Asset.prototype.addToFolder = function(options, callback) {
    var self = this, error = null;
    if ("folder" in options && isUUID(options.folder)) {
        //we got a valid UUID
        var folder = Usergrid.Folder({
            uuid: options.folder
        }, function(err, folder) {
            if (err) {
                doCallback(callback, [ UsergridError.fromResponse(folder), folder, self ], self);
            } else {
                var endpoint = [ "folders", folder.get("uuid"), "assets", self.get("uuid") ].join("/");
                var options = {
                    method: "POST",
                    endpoint: endpoint
                };
                this._client.request(options, function(err, response) {
                    if (err) {
                        doCallback(callback, [ UsergridError.fromResponse(folder), response, self ], self);
                    } else {
                        doCallback(callback, [ null, folder, self ], self);
                    }
                });
            }
        });
    } else {
        doCallback(callback, [ new UsergridError("folder not specified"), null, self ], self);
    }
};

Usergrid.Entity.prototype.attachAsset = function(file, callback) {
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        doCallback(callback, [ new UsergridError("The File APIs are not fully supported by your browser."), null, this ], this);
        return;
    }
    var self = this;
    var args = arguments;
    var type = this._data.type;
    var attempts = self.get("attempts");
    if (isNaN(attempts)) {
        attempts = 3;
    }
    if (type != "assets" && type != "asset") {
        var endpoint = [ this._client.URI, this._client.orgName, this._client.appName, type, self.get("uuid") ].join("/");
    } else {
        self.set("content-type", file.type);
        self.set("size", file.size);
        var endpoint = [ this._client.URI, this._client.orgName, this._client.appName, "assets", self.get("uuid"), "data" ].join("/");
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.onerror = function(err) {
        doCallback(callback, [ new UsergridError("The File APIs are not fully supported by your browser.") ], xhr, self);
    };
    xhr.onload = function(ev) {
        if (xhr.status >= 500 && attempts > 0) {
            self.set("attempts", --attempts);
            setTimeout(function() {
                self.attachAsset.apply(self, args);
            }, 100);
        } else if (xhr.status >= 300) {
            self.set("attempts");
            doCallback(callback, [ new UsergridError(JSON.parse(xhr.responseText)), xhr, self ], self);
        } else {
            self.set("attempts");
            self.fetch();
            doCallback(callback, [ null, xhr, self ], self);
        }
    };
    var fr = new FileReader();
    fr.onload = function() {
        var binary = fr.result;
        if (type === "assets" || type === "asset") {
            xhr.overrideMimeType("application/octet-stream");
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
        }
        xhr.sendAsBinary(binary);
    };
    fr.readAsBinaryString(file);
};

/*
 *  Upload Asset data
 *
 *  @method upload
 *  @public
 *  @param {object} data Can be a javascript Blob or File object
 *  @returns {callback} callback(err, asset)
 */
Usergrid.Asset.prototype.upload = function(data, callback) {
    this.attachAsset(data, function(err, response) {
        if (!err) {
            doCallback(callback, [ null, response, self ], self);
        } else {
            doCallback(callback, [ new UsergridError(err), response, self ], self);
        }
    });
};

/*
 *  Download Asset data
 *
 *  @method download
 *  @public
 *  @returns {callback} callback(err, blob) blob is a javascript Blob object.
 */
Usergrid.Entity.prototype.downloadAsset = function(callback) {
    var self = this;
    var endpoint;
    var type = this._data.type;
    var xhr = new XMLHttpRequest();
    if (type != "assets" && type != "asset") {
        endpoint = [ this._client.URI, this._client.orgName, this._client.appName, type, self.get("uuid") ].join("/");
    } else {
        endpoint = [ this._client.URI, this._client.orgName, this._client.appName, "assets", self.get("uuid"), "data" ].join("/");
    }
    xhr.open("GET", endpoint, true);
    xhr.responseType = "blob";
    xhr.onload = function(ev) {
        var blob = xhr.response;
        if (type != "assets" && type != "asset") {
            doCallback(callback, [ null, blob, xhr ], self);
        } else {
            doCallback(callback, [ null, xhr, self ], self);
        }
    };
    xhr.onerror = function(err) {
        callback(true, err);
        doCallback(callback, [ new UsergridError(err), xhr, self ], self);
    };
    if (type != "assets" && type != "asset") {
        xhr.setRequestHeader("Accept", self._data["file-metadata"]["content-type"]);
    } else {
        xhr.overrideMimeType(self.get("content-type"));
    }
    xhr.send();
};

/*
 *  Download Asset data
 *
 *  @method download
 *  @public
 *  @returns {callback} callback(err, blob) blob is a javascript Blob object.
 */
Usergrid.Asset.prototype.download = function(callback) {
    this.downloadAsset(function(err, response) {
        if (!err) {
            doCallback(callback, [ null, response, self ], self);
        } else {
            doCallback(callback, [ new UsergridError(err), response, self ], self);
        }
    });
};

/**
 * Created by ryan bridges on 2014-02-05.
 */
(function(global) {
    var name = "UsergridError", short, _name = global[name], _short = short && short !== undefined ? global[short] : undefined;
    /*
     *  Instantiates a new UsergridError
     *
     *  @method UsergridError
     *  @public
     *  @params {<string>} message
     *  @params {<string>} id       - the error code, id, or name
     *  @params {<int>} timestamp
     *  @params {<int>} duration
     *  @params {<string>} exception    - the Java exception from Usergrid
     *  @return Returns - a new UsergridError object
     *
     *  Example:
     *
     *  UsergridError(message);
     */
    function UsergridError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name;
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridError.prototype = new Error();
    UsergridError.prototype.constructor = UsergridError;
    /*
     *  Creates a UsergridError from the JSON response returned from the backend
     *
     *  @method fromResponse
     *  @public
     *  @params {object} response - the deserialized HTTP response from the Usergrid API
     *  @return Returns a new UsergridError object.
     *
     *  Example:
     *  {
     *  "error":"organization_application_not_found",
     *  "timestamp":1391618508079,
     *  "duration":0,
     *  "exception":"org.usergrid.rest.exceptions.OrganizationApplicationNotFoundException",
     *  "error_description":"Could not find application for yourorgname/sandboxxxxx from URI: yourorgname/sandboxxxxx"
     *  }
     */
    UsergridError.fromResponse = function(response) {
        if (response && "undefined" !== typeof response) {
            return new UsergridError(response.error_description, response.error, response.timestamp, response.duration, response.exception);
        } else {
            return new UsergridError();
        }
    };
    UsergridError.createSubClass = function(name) {
        if (name in global && global[name]) return global[name];
        global[name] = function() {};
        global[name].name = name;
        global[name].prototype = new UsergridError();
        return global[name];
    };
    function UsergridHTTPResponseError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name;
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridHTTPResponseError.prototype = new UsergridError();
    function UsergridInvalidHTTPMethodError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name || "invalid_http_method";
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridInvalidHTTPMethodError.prototype = new UsergridError();
    function UsergridInvalidURIError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name || "invalid_uri";
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridInvalidURIError.prototype = new UsergridError();
    function UsergridInvalidArgumentError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name || "invalid_argument";
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridInvalidArgumentError.prototype = new UsergridError();
    function UsergridKeystoreDatabaseUpgradeNeededError(message, name, timestamp, duration, exception) {
        this.message = message;
        this.name = name;
        this.timestamp = timestamp || Date.now();
        this.duration = duration || 0;
        this.exception = exception;
    }
    UsergridKeystoreDatabaseUpgradeNeededError.prototype = new UsergridError();
    global.UsergridHTTPResponseError = UsergridHTTPResponseError;
    global.UsergridInvalidHTTPMethodError = UsergridInvalidHTTPMethodError;
    global.UsergridInvalidURIError = UsergridInvalidURIError;
    global.UsergridInvalidArgumentError = UsergridInvalidArgumentError;
    global.UsergridKeystoreDatabaseUpgradeNeededError = UsergridKeystoreDatabaseUpgradeNeededError;
    global[name] = UsergridError;
    if (short !== undefined) {
        global[short] = UsergridError;
    }
    global[name].noConflict = function() {
        if (_name) {
            global[name] = _name;
        }
        if (short !== undefined) {
            global[short] = _short;
        }
        return UsergridError;
    };
    return global[name];
})(this);

(function() {
    var name = "Apigee", global = this, overwrittenName = global[name];
    var Usergrid = Usergrid || global.Usergrid;
    if (!Usergrid) {
        throw "Usergrid module is required for the monitoring module.";
    }
    var VERBS = {
        get: "GET",
        post: "POST",
        put: "PUT",
        del: "DELETE",
        head: "HEAD"
    };
    var MONITORING_SDKVERSION = "0.0.1";
    var LOGLEVELS = {
        verbose: "V",
        debug: "D",
        info: "I",
        warn: "W",
        error: "E",
        assert: "A"
    };
    var LOGLEVELNUMBERS = {
        verbose: 2,
        debug: 3,
        info: 4,
        warn: 5,
        error: 6,
        assert: 7
    };
    var UNKNOWN = "UNKNOWN";
    var SDKTYPE = "JavaScript";
    var logs = [];
    var metrics = [];
    var Apigee = Object.keys(Usergrid).reduce(function(p, c) {
        if (Usergrid.hasOwnProperty(c)) {
            p[c] = Usergrid[c];
        }
        return p;
    }, function Apigee() {});
    Apigee.Client = function(options) {
        //Init app monitoring.
        this.monitoringEnabled = options.monitoringEnabled || true;
        if (this.monitoringEnabled) {
            try {
                this.monitor = new Apigee.MonitoringClient(options);
            } catch (e) {
                console.log(e);
            }
        }
        Usergrid.Client.call(this, options);
    };
    Apigee.Client.prototype = Usergrid.Client.prototype;
    /*
  *  Function to get the assigned Apigee UUID of the device. Call directly to retrieve this information.
  *
  *  @method getDeviceUUID
  *  @public
  *  @return {string} uuid
  */
    Usergrid.Client.prototype.getDeviceUUID = function() {
        if (typeof window.localStorage.getItem("deviceUUID") === "string") {
            return window.localStorage.getItem("deviceUUID");
        } else {
            var uuid = randomUUID();
            window.localStorage.setItem("deviceUUID", uuid);
            return window.localStorage.getItem("deviceUUID");
        }
    };
    /*
  *  Function to register a device with Apigee. Call directly with options object.
  *
  *  @method registerDevice
  *  @public
  *  @param {object} options
  *  @param {function} callback
  *  @return {callback} callback(err, data)
  */
    Usergrid.Client.prototype.registerDevice = function(options, callback) {
        if (options) {
            var notifierId = options.notifier + ".notifier.id";
            var device = {
                type: "devices",
                uuid: this.getDeviceUUID()
            };
            device[notifierId] = options.deviceToken;
            var entityOptions = {
                client: this,
                data: device
            };
            var deviceEntity = new Usergrid.Entity(entityOptions);
            deviceEntity.save(callback);
        } else {
            callback(true);
        }
    };
    /*
  *  Function to send push notification to a specified path. Call directly.
  *
  *  @method sendPushToDevice
  *  @public
  *  @param {object} options
  *  @param {function} callback
  *  @return {callback} callback(err, data)
  */
    Usergrid.Client.prototype.sendPushToDevice = function(options, callback) {
        if (options) {
            var notifierName = options.notifier;
            var notifierLookupOptions = {
                type: "notifier",
                name: options.notifier
            };
            var self = this;
            this.getEntity(notifierLookupOptions, function(error, result) {
                if (error) {
                    callback(error, result);
                } else {
                    var pushEntity = {
                        type: options.path
                    };
                    if (result.get("provider") === "google") {
                        pushEntity["payloads"] = {};
                        pushEntity["payloads"][notifierName] = options.message;
                    } else if (result.get("provider") === "apple") {
                        pushEntity["payloads"] = {};
                        pushEntity["payloads"][notifierName] = {
                            aps: {
                                alert: options.message,
                                sound: options.sound
                            }
                        };
                    }
                    var entityOptions = {
                        client: self,
                        data: pushEntity
                    };
                    var notification = new Usergrid.Entity(entityOptions);
                    notification.save(callback);
                }
            });
        } else {
            callback(true);
        }
    };
    //BEGIN APIGEE MONITORING SDK
    //Constructor for Apigee Monitoring SDK
    Apigee.MonitoringClient = function(options) {
        //Needed for the setInterval call for syncing. Have to pass in a ref to ourselves. It blows scope away.
        var self = this;
        this.orgName = options.orgName;
        this.appName = options.appName;
        this.syncOnClose = options.syncOnClose || false;
        //Put this in here because I don't want sync issues with testing.
        this.testMode = options.testMode || false;
        //You best know what you're doing if you're setting this for Apigee monitoring!
        this.URI = typeof options.URI === "undefined" ? "https://api.usergrid.com" : options.URI;
        this.syncDate = timeStamp();
        //Can do a manual config override specifiying raw json as your config. I use this for testing.
        //May be useful down the road. Needs to conform to current config.
        if (typeof options.config !== "undefined") {
            this.configuration = options.config;
            if (this.configuration.deviceLevelOverrideEnabled === true) {
                this.deviceConfig = this.configuration.deviceLevelAppConfig;
            } else if (this.abtestingOverrideEnabled === true) {
                this.deviceConfig = this.configuration.abtestingAppConfig;
            } else {
                this.deviceConfig = this.configuration.defaultAppConfig;
            }
        } else {
            this.configuration = null;
            this.downloadConfig();
        }
        //Don't do anything if configuration wasn't loaded.
        if (this.configuration !== null && this.configuration !== "undefined") {
            //Ensure that we want to sample data from this device.
            var sampleSeed = 0;
            if (this.deviceConfig.samplingRate < 100) {
                sampleSeed = Math.floor(Math.random() * 101);
            }
            //If we're not in the sampling window don't setup data collection at all
            if (sampleSeed < this.deviceConfig.samplingRate) {
                this.appId = this.configuration.instaOpsApplicationId;
                this.appConfigType = this.deviceConfig.appConfigType;
                //Let's monkeypatch logging calls to intercept and send to server.
                if (this.deviceConfig.enableLogMonitoring) {
                    this.patchLoggingCalls();
                }
                var syncIntervalMillis = 3e3;
                if (typeof this.deviceConfig.agentUploadIntervalInSeconds !== "undefined") {
                    syncIntervalMillis = this.deviceConfig.agentUploadIntervalInSeconds * 1e3;
                }
                //Needed for the setInterval call for syncing. Have to pass in a ref to ourselves. It blows scope away.
                if (!this.syncOnClose) {
                    //Old server syncing logic
                    setInterval(function() {
                        self.prepareSync();
                    }, syncIntervalMillis);
                } else {
                    if (isPhoneGap()) {
                        window.addEventListener("pause", function() {
                            self.prepareSync();
                        }, false);
                    } else if (isTrigger()) {
                        forge.event.appPaused.addListener(function(data) {}, function(error) {
                            console.log("Error syncing data.");
                            console.log(error);
                        });
                    } else if (isTitanium()) {} else {
                        window.addEventListener("beforeunload", function(e) {
                            self.prepareSync();
                        });
                    }
                }
                //Setting up the catching of errors and network calls
                if (this.deviceConfig.networkMonitoringEnabled) {
                    this.patchNetworkCalls(XMLHttpRequest);
                }
                window.onerror = Apigee.MonitoringClient.catchCrashReport;
                this.startSession();
                this.sync({});
            }
        } else {
            console.log("Error: Apigee APM configuration unavailable.");
        }
    };
    Apigee.MonitoringClient.prototype.applyMonkeyPatches = function() {
        var self = this;
        //Let's monkeypatch logging calls to intercept and send to server.
        if (self.deviceConfig.enableLogMonitoring) {
            self.patchLoggingCalls();
        }
        //Setting up the catching of errors and network calls
        if (self.deviceConfig.networkMonitoringEnabled) {
            self.patchNetworkCalls(XMLHttpRequest);
        }
    };
    /**
   * Function for retrieving the current Apigee Monitoring configuration.
   *
   * @method downloadConfig
   * @public
   * @params {function} callback
   * NOTE: Passing in a callback makes this call async. Wires it all up for you.
   *
   */
    Apigee.MonitoringClient.prototype.getConfig = function(options, callback) {
        if (typeof options.config !== "undefined") {
            this.configuration = options.config;
            if (this.configuration.deviceLevelOverrideEnabled === true) {
                this.deviceConfig = this.configuration.deviceLevelAppConfig;
            } else if (this.abtestingOverrideEnabled === true) {
                this.deviceConfig = this.configuration.abtestingAppConfig;
            } else {
                this.deviceConfig = this.configuration.defaultAppConfig;
            }
            callback(this.deviceConfig);
        } else {
            this.configuration = null;
            this.downloadConfig(callback);
        }
    };
    /**
   * Function for downloading the current Apigee Monitoring configuration.
   *
   * @method downloadConfig
   * @public
   * @params {function} callback
   * NOTE: Passing in a callback makes this call async. Wires it all up for you.
   *
   */
    Apigee.MonitoringClient.prototype.downloadConfig = function(callback) {
        var configRequest = new XMLHttpRequest();
        var path = this.URI + "/" + this.orgName + "/" + this.appName + "/apm/apigeeMobileConfig";
        //If we have a function lets load the config async else do it sync.
        if (typeof callback === "function") {
            configRequest.open(VERBS.get, path, true);
        } else {
            configRequest.open(VERBS.get, path, false);
        }
        var self = this;
        configRequest.setRequestHeader("Accept", "application/json");
        configRequest.setRequestHeader("Content-Type", "application/json");
        configRequest.onreadystatechange = onReadyStateChange;
        configRequest.send();
        //A little async magic. Let's return the AJAX issue from downloading the configs.
        //Or we can return the parsed out config.
        function onReadyStateChange() {
            if (configRequest.readyState === 4) {
                if (typeof callback === "function") {
                    if (configRequest.status === 200) {
                        callback(null, JSON.parse(configRequest.responseText));
                    } else {
                        callback(configRequest.statusText);
                    }
                } else {
                    if (configRequest.status === 200) {
                        var config = JSON.parse(configRequest.responseText);
                        self.configuration = config;
                        if (config.deviceLevelOverrideEnabled === true) {
                            self.deviceConfig = config.deviceLevelAppConfig;
                        } else if (self.abtestingOverrideEnabled === true) {
                            self.deviceConfig = config.abtestingAppConfig;
                        } else {
                            self.deviceConfig = config.defaultAppConfig;
                        }
                    }
                }
            }
        }
    };
    /**
   * Function for syncing data back to the server. Currently called in the Apigee.MonitoringClient constructor using setInterval.
   *
   * @method sync
   * @public
   * @params {object} syncObject
   *
   */
    Apigee.MonitoringClient.prototype.sync = function(syncObject) {
        //Sterilize the sync data
        var syncData = {};
        syncData.logs = syncObject.logs;
        syncData.metrics = syncObject.metrics;
        syncData.sessionMetrics = this.sessionMetrics;
        syncData.orgName = this.orgName;
        syncData.appName = this.appName;
        syncData.fullAppName = this.orgName + "_" + this.appName;
        syncData.instaOpsApplicationId = this.configuration.instaOpsApplicationId;
        syncData.timeStamp = timeStamp();
        //Send it to the apmMetrics endpoint.
        var syncRequest = new XMLHttpRequest();
        var path = this.URI + "/" + this.orgName + "/" + this.appName + "/apm/apmMetrics";
        syncRequest.open(VERBS.post, path, false);
        syncRequest.setRequestHeader("Accept", "application/json");
        syncRequest.setRequestHeader("Content-Type", "application/json");
        syncRequest.send(JSON.stringify(syncData));
        //Only wipe data if the sync was good. Hold onto it if it was bad.
        if (syncRequest.status === 200) {
            logs = [];
            metrics = [];
            var response = syncRequest.responseText;
        } else {
            //Not much we can do if there was an error syncing data.
            //Log it to console accordingly.
            console.log("Error syncing");
            console.log(syncRequest.responseText);
        }
    };
    /**
   * Function that is called during the window.onerror handler. Grabs all parameters sent by that function.
   *
   * @public
   * @param {string} crashEvent
   * @param {string} url
   * @param {string} line
   *
   */
    Apigee.MonitoringClient.catchCrashReport = function(crashEvent, url, line) {
        logCrash({
            tag: "CRASH",
            logMessage: "Error:" + crashEvent + " for url:" + url + " on line:" + line
        });
    };
    Apigee.MonitoringClient.prototype.startLocationCapture = function() {
        var self = this;
        if (self.deviceConfig.locationCaptureEnabled && typeof navigator.geolocation !== "undefined") {
            var geoSuccessCallback = function(position) {
                self.sessionMetrics.latitude = position.coords.latitude;
                self.sessionMetrics.longitude = position.coords.longitude;
            };
            var geoErrorCallback = function() {
                console.log("Location access is not available.");
            };
            navigator.geolocation.getCurrentPosition(geoSuccessCallback, geoErrorCallback);
        }
    };
    Apigee.MonitoringClient.prototype.detectAppPlatform = function(sessionSummary) {
        var self = this;
        var callbackHandler_Titanium = function(e) {
            //Framework is appcelerator
            sessionSummary.devicePlatform = e.name;
            sessionSummary.deviceOSVersion = e.osname;
            //Get the device id if we want it. If we dont, but we want it obfuscated generate
            //a one off id and attach it to localStorage.
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                if (self.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = e.uuid;
                }
            } else {
                if (this.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = UNKNOWN;
                }
            }
            sessionSummary.deviceModel = e.model;
            sessionSummary.networkType = e.networkType;
        };
        var callbackHandler_PhoneGap = function(e) {
            if ("device" in window) {
                sessionSummary.devicePlatform = window.device.platform;
                sessionSummary.deviceOSVersion = window.device.version;
                sessionSummary.deviceModel = window.device.name;
            } else if (window.cordova) {
                sessionSummary.devicePlatform = window.cordova.platformId;
                sessionSummary.deviceOSVersion = UNKNOWN;
                sessionSummary.deviceModel = UNKNOWN;
            }
            if ("connection" in navigator) {
                sessionSummary.networkType = navigator.connection.type || UNKNOWN;
            }
            //Get the device id if we want it. If we dont, but we want it obfuscated generate
            //a one off id and attach it to localStorage.
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                if (self.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = window.device.uuid;
                }
            } else {
                if (this.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = UNKNOWN;
                }
            }
            return sessionSummary;
        };
        var callbackHandler_Trigger = function(sessionSummary) {
            var os = UNKNOWN;
            if (forge.is.ios()) {
                os = "iOS";
            } else if (forge.is.android()) {
                os = "Android";
            }
            sessionSummary.devicePlatform = UNKNOWN;
            sessionSummary.deviceOSVersion = os;
            //Get the device id if we want it. Trigger.io doesn't expose device id APIs
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                sessionSummary.deviceId = generateDeviceId();
            } else {
                sessionSummary.deviceId = UNKNOWN;
            }
            sessionSummary.deviceModel = UNKNOWN;
            sessionSummary.networkType = forge.is.connection.wifi() ? "WIFI" : UNKNOWN;
            return sessionSummary;
        };
        //We're checking if it's a phonegap app.
        //If so let's use APIs exposed by phonegap to collect device info.
        //If not let's fallback onto stuff we should collect ourselves.
        if (isPhoneGap()) {
            //framework is phonegap.
            sessionSummary = callbackHandler_PhoneGap(sessionSummary);
        } else if (isTrigger()) {
            //Framework is trigger
            sessionSummary = callbackHandler_Trigger(sessionSummary);
        } else if (isTitanium()) {
            Ti.App.addEventListener("analytics:platformMetrics", callbackHandler_Titanium);
        } else {
            //Can't detect framework assume browser.
            //Here we want to check for localstorage and make sure the browser has it
            if (typeof window.localStorage !== "undefined") {
                //If no uuid is set in localstorage create a new one, and set it as the session's deviceId
                if (self.deviceConfig.deviceIdCaptureEnabled) {
                    sessionSummary.deviceId = generateDeviceId();
                }
            }
            if (typeof navigator.userAgent !== "undefined") {
                //Small hack to make all device names consistent.
                var browserData = determineBrowserType(navigator.userAgent, navigator.appName);
                sessionSummary.devicePlatform = browserData.devicePlatform;
                sessionSummary.deviceOSVersion = browserData.deviceOSVersion;
                if (typeof navigator.language !== "undefined") {
                    sessionSummary.localLanguage = navigator.language;
                }
            }
        }
        if (isTitanium()) {
            Ti.App.fireEvent("analytics:attachReady");
        }
        return sessionSummary;
    };
    /**
   * Registers a device with Apigee Monitoring. Generates a new UUID for a device and collects relevant info on it.
   *
   * @method startSession
   * @public
   *
   */
    Apigee.MonitoringClient.prototype.startSession = function() {
        if (this.configuration === null || this.configuration === "undefined") {
            return;
        }
        //If the user agent string exists on the device
        var self = this;
        var sessionSummary = {};
        //timeStamp goes first because it is used in other properties
        sessionSummary.timeStamp = timeStamp();
        //defaults for other properties
        sessionSummary.appConfigType = this.appConfigType;
        sessionSummary.appId = this.appId.toString();
        sessionSummary.applicationVersion = "undefined" !== typeof this.appVersion ? this.appVersion.toString() : UNKNOWN;
        sessionSummary.batteryLevel = "-100";
        sessionSummary.deviceCountry = UNKNOWN;
        sessionSummary.deviceId = UNKNOWN;
        sessionSummary.deviceModel = UNKNOWN;
        sessionSummary.deviceOSVersion = UNKNOWN;
        sessionSummary.devicePlatform = UNKNOWN;
        sessionSummary.localCountry = UNKNOWN;
        sessionSummary.localLanguage = UNKNOWN;
        sessionSummary.networkCarrier = UNKNOWN;
        sessionSummary.networkCountry = UNKNOWN;
        sessionSummary.networkSubType = UNKNOWN;
        sessionSummary.networkType = UNKNOWN;
        sessionSummary.sdkType = SDKTYPE;
        sessionSummary.sessionId = randomUUID();
        sessionSummary.sessionStartTime = sessionSummary.timeStamp;
        self.startLocationCapture();
        self.sessionMetrics = self.detectAppPlatform(sessionSummary);
    };
    /**
   * Method to encapsulate the monkey patching of AJAX methods. We pass in the XMLHttpRequest object for monkey patching.
   *
   * @public
   * @param {XMLHttpRequest} XHR
   *
   */
    Apigee.MonitoringClient.prototype.patchNetworkCalls = function(XHR) {
        "use strict";
        var apigee = this;
        var open = XHR.prototype.open;
        var send = XHR.prototype.send;
        XHR.prototype.open = function(method, url, async, user, pass) {
            this._method = method;
            this._url = url;
            open.call(this, method, url, async, user, pass);
            (function(self) {
                self.setRequestHeader("X-Apigee-Client-Device-Id", apigee.sessionMetrics.deviceId);
                self.setRequestHeader("X-Apigee-Client-Session-Id", apigee.sessionMetrics.sessionId);
                self.setRequestHeader("X-Apigee-Client-Org-Name", apigee.orgName);
                self.setRequestHeader("X-Apigee-Client-App-Name", apigee.appName);
                self.setRequestHeader("X-Apigee-Client-Request-Id", randomUUID());
            })(this);
        };
        XHR.prototype.send = function(data) {
            var self = this;
            var startTime;
            var oldOnReadyStateChange;
            var method = this._method;
            var url = this._url;
            function onReadyStateChange() {
                if (self.readyState == 4) // complete
                {
                    //gap_exec and any other platform specific filtering here
                    //gap_exec is used internally by phonegap, and shouldn't be logged.
                    var monitoringURL = apigee.getMonitoringURL();
                    if (url.indexOf("/!gap_exec") === -1 && url.indexOf(monitoringURL) === -1) {
                        var endTime = timeStamp();
                        var latency = endTime - startTime;
                        var summary = {
                            url: url,
                            startTime: startTime.toString(),
                            endTime: endTime.toString(),
                            numSamples: "1",
                            latency: latency.toString(),
                            timeStamp: startTime.toString(),
                            httpStatusCode: self.status.toString(),
                            //responseText won't exist if the payload is arraybuffer, blob, or document 
                            responseDataSize: [ "", "text", "json" ].indexOf(self.responseType) !== -1 ? self.responseText.length.toString() : "0"
                        };
                        if (self.status == 200) {
                            //Record the http call here
                            summary.numErrors = "0";
                            apigee.logNetworkCall(summary);
                        } else {
                            //Record a connection failure here
                            summary.numErrors = "1";
                            apigee.logNetworkCall(summary);
                        }
                    } else {}
                }
                if (oldOnReadyStateChange) {
                    oldOnReadyStateChange();
                }
            }
            if (!this.noIntercept) {
                startTime = timeStamp();
                if (this.addEventListener) {
                    this.addEventListener("readystatechange", onReadyStateChange, false);
                } else {
                    oldOnReadyStateChange = this.onreadystatechange;
                    this.onreadystatechange = onReadyStateChange;
                }
            }
            send.call(this, data);
        };
    };
    Apigee.MonitoringClient.prototype.patchLoggingCalls = function() {
        //Hacky way of tapping into this and switching it around but it'll do.
        //We assume that the first argument is the intended log message. Except assert which is the second message.
        var self = this;
        var original = window.console;
        window.console = {
            log: function() {
                self.logInfo({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.log.apply(original, arguments);
            },
            warn: function() {
                self.logWarn({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.warn.apply(original, arguments);
            },
            error: function() {
                self.logError({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.error.apply(original, arguments);
            },
            assert: function() {
                self.logAssert({
                    tag: "CONSOLE",
                    logMessage: arguments[1]
                });
                original.assert.apply(original, arguments);
            },
            debug: function() {
                self.logDebug({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.debug.apply(original, arguments);
            }
        };
        if (isTitanium()) {
            //Patch console.log to work in Titanium as well.
            var originalTitanium = Ti.API;
            window.console.log = function() {
                originalTitanium.info.apply(originalTitanium, arguments);
            };
            Ti.API = {
                info: function() {
                    self.logInfo({
                        tag: "CONSOLE_TITANIUM",
                        logMessage: arguments[0]
                    });
                    originalTitanium.info.apply(originalTitanium, arguments);
                },
                log: function() {
                    var level = arguments[0];
                    if (level === "info") {
                        self.logInfo({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "warn") {
                        self.logWarn({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "error") {
                        self.logError({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "debug") {
                        self.logDebug({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "trace") {
                        self.logAssert({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else {
                        self.logInfo({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    }
                    originalTitanium.log.apply(originalTitanium, arguments);
                }
            };
        }
    };
    /**
   * Prepares data for syncing on window close.
   *
   * @method prepareSync
   * @public
   *
   */
    Apigee.MonitoringClient.prototype.prepareSync = function() {
        var syncObject = {};
        var self = this;
        //Just in case something bad happened.
        if (typeof self.sessionMetrics !== "undefined") {
            syncObject.sessionMetrics = self.sessionMetrics;
        }
        var syncFlag = false;
        this.syncDate = timeStamp();
        //Go through each of the aggregated metrics
        //If there are unreported metrics present add them to the object to be sent across the network
        if (metrics.length > 0) {
            syncFlag = true;
        }
        if (logs.length > 0) {
            syncFlag = true;
        }
        syncObject.logs = logs;
        syncObject.metrics = metrics;
        //If there is data to sync go ahead and do it.
        if (syncFlag && !self.testMode) {
            this.sync(syncObject);
        }
    };
    /**
   * Logs a user defined message.
   *
   * @method logMessage
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logMessage = function(options) {
        var log = options || {};
        var cleansedLog = {
            logLevel: log.logLevel,
            logMessage: log.logMessage.substring(0, 250),
            tag: log.tag,
            timeStamp: timeStamp()
        };
        logs.push(cleansedLog);
    };
    /**
   * Logs a user defined verbose message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logVerbose = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.verbose;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.verbose) {
            this.logMessage(options);
        }
    };
    /**
   * Logs a user defined debug message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logDebug = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.debug;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.debug) {
            this.logMessage(options);
        }
    };
    /**
   * Logs a user defined informational message.
   *
   * @method logInfo
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logInfo = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.info;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.info) {
            this.logMessage(options);
        }
    };
    /**
   * Logs a user defined warning message.
   *
   * @method logWarn
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logWarn = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.warn;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.warn) {
            this.logMessage(options);
        }
    };
    /**
   * Logs a user defined error message.
   *
   * @method logError
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logError = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.error;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.error) {
            this.logMessage(options);
        }
    };
    /**
   * Logs a user defined assert message.
   *
   * @method logAssert
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logAssert = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.assert;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.assert) {
            this.logMessage(options);
        }
    };
    /**
   * Internal function for encapsulating crash log catches. Not directly callable.
   * Needed because of funkiness with the errors being thrown solely on the window
   *
   */
    function logCrash(options) {
        var log = options || {};
        var cleansedLog = {
            logLevel: LOGLEVELS.assert,
            logMessage: log.logMessage,
            tag: log.tag,
            timeStamp: timeStamp()
        };
        logs.push(cleansedLog);
    }
    /**
   * Logs a network call.
   *
   * @method logNetworkCall
   * @public
   * @param {object} options
   *
   */
    Apigee.MonitoringClient.prototype.logNetworkCall = function(options) {
        metrics.push(options);
    };
    /**
   * Retrieves monitoring URL.
   *
   * @method getMonitoringURL
   * @public
   * @returns {string} value
   *
   */
    Apigee.MonitoringClient.prototype.getMonitoringURL = function() {
        return this.URI + "/" + this.orgName + "/" + this.appName + "/apm/";
    };
    /**
   * Gets custom config parameters. These are set by user in dashboard.
   *
   * @method getConfig
   * @public
   * @param {string} key
   * @returns {stirng} value
   *
   * TODO: Once there is a dashboard plugged into the API implement this so users can set
   * custom configuration parameters for their applications.
   */
    Apigee.MonitoringClient.prototype.getConfig = function(key) {};
    //TEST HELPERS NOT REALLY MEANT TO BE USED OUTSIDE THAT CONTEXT.
    //Simply exposes some internal data that is collected.
    Apigee.MonitoringClient.prototype.logs = function() {
        return logs;
    };
    Apigee.MonitoringClient.prototype.metrics = function() {
        return metrics;
    };
    Apigee.MonitoringClient.prototype.getSessionMetrics = function() {
        return this.sessionMetrics;
    };
    Apigee.MonitoringClient.prototype.clearMetrics = function() {
        logs = [];
        metrics = [];
    };
    Apigee.MonitoringClient.prototype.mixin = function(destObject) {
        var props = [ "bind", "unbind", "trigger" ];
        for (var i = 0; i < props.length; i++) {
            destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
        }
    };
    //UUID Generation function unedited
    /** randomUUID.js - Version 1.0
   *
   * Copyright 2008, Robert Kieffer
   *
   * This software is made available under the terms of the Open Software License
   * v3.0 (available here: http://www.opensource.org/licenses/osl-3.0.php )
   *
   * The latest version of this file can be found at:
   * http://www.broofa.com/Tools/randomUUID.js
   *
   * For more information, or to comment on this, please go to:
   * http://www.broofa.com/blog/?p=151
   */
    /**
   * Create and return a "version 4" RFC-4122 UUID string.
   */
    function randomUUID() {
        var s = [], itoh = "0123456789ABCDEF", i;
        // Make array of random hex digits. The UUID only has 32 digits in it, but we
        // allocate an extra items to make room for the '-'s we'll be inserting.
        for (i = 0; i < 36; i++) {
            s[i] = Math.floor(Math.random() * 16);
        }
        // Conform to RFC-4122, section 4.4
        s[14] = 4;
        // Set 4 high bits of time_high field to version
        s[19] = s[19] & 3 | 8;
        // Specify 2 high bits of clock sequence
        // Convert to hex chars
        for (i = 0; i < 36; i++) {
            s[i] = itoh[s[i]];
        }
        // Insert '-'s
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }
    //Generate an epoch timestamp string
    function timeStamp() {
        return new Date().getTime().toString();
    }
    //Generate a device id, and attach it to localStorage.
    function generateDeviceId() {
        var deviceId = "UNKNOWN";
        try {
            if ("undefined" === typeof localStorage) {
                throw new Error("device or platform does not support local storage");
            }
            if (window.localStorage.getItem("uuid") === null) {
                window.localStorage.setItem("uuid", randomUUID());
            }
            deviceId = window.localStorage.getItem("uuid");
        } catch (e) {
            deviceId = randomUUID();
            console.warn(e);
        } finally {
            return deviceId;
        }
    }
    //Helper. Determines if the platform device is phonegap
    function isPhoneGap() {
        return typeof cordova !== "undefined" || typeof PhoneGap !== "undefined" || typeof window.device !== "undefined";
    }
    //Helper. Determines if the platform device is trigger.io
    function isTrigger() {
        return typeof window.forge !== "undefined";
    }
    //Helper. Determines if the platform device is titanium.
    function isTitanium() {
        return typeof Titanium !== "undefined";
    }
    /**
   * @method determineBrowserType
   */
    var BROWSERS = [ "Opera", "MSIE", "Safari", "Chrome", "Firefox" ];
    function createBrowserRegex(browser) {
        return new RegExp("\\b(" + browser + ")\\/([^\\s]+)");
    }
    function createBrowserTest(userAgent, positive, negatives) {
        var matches = BROWSER_REGEX[positive].exec(userAgent);
        negatives = negatives || [];
        if (matches && matches.length && !negatives.some(function(negative) {
            return BROWSER_REGEX[negative].exec(userAgent);
        })) {
            return matches.slice(1, 3);
        }
    }
    var BROWSER_REGEX = [ "Seamonkey", "Firefox", "Chromium", "Chrome", "Safari", "Opera" ].reduce(function(p, c) {
        p[c] = createBrowserRegex(c);
        return p;
    }, {});
    BROWSER_REGEX["MSIE"] = new RegExp(";(MSIE) ([^\\s]+)");
    var BROWSER_TESTS = [ [ "MSIE" ], [ "Opera", [] ], [ "Seamonkey", [] ], [ "Firefox", [ "Seamonkey" ] ], [ "Chromium", [] ], [ "Chrome", [ "Chromium" ] ], [ "Safari", [ "Chromium", "Chrome" ] ] ].map(function(arr) {
        return createBrowserTest(navigator.userAgent, arr[0], arr[1]);
    });
    function determineBrowserType(ua, appName) {
        //var ua = navigator.userAgent;
        var browserName = appName;
        var nameOffset, verOffset, verLength, ix, fullVersion = UNKNOWN;
        var browserData = {
            devicePlatform: UNKNOWN,
            deviceOSVersion: UNKNOWN
        };
        var browserData = BROWSER_TESTS.reduce(function(p, c) {
            return c ? c : p;
        }, "UNKNOWN");
        browserName = browserData[0];
        fullVersion = browserData[1];
        if (browserName === "MSIE") {
            browserName = "Microsoft Internet Explorer";
        }
        browserData.devicePlatform = browserName;
        browserData.deviceOSVersion = fullVersion;
        return browserData;
    }
    global[name] = Apigee;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Apigee;
    };
    return global[name];
})();

(function() {
    var name = "Apigee", global = this, overwrittenName = global[name];
    var Apigee = Apigee || global.Apigee;
    if (!Apigee) {
        throw "Apigee module is required for the monitoring module.";
    }
    /*
   * Logs a user defined verbose message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logVerbose = function(options) {
        this.monitor.logVerbose(options);
    };
    /*
   * Logs a user defined debug message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logDebug = function(options) {
        this.monitor.logDebug(options);
    };
    /*
   * Logs a user defined informational message.
   *
   * @method logInfo
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logInfo = function(options) {
        this.monitor.logInfo(options);
    };
    /*
   * Logs a user defined warning message.
   *
   * @method logWarn
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logWarn = function(options) {
        this.monitor.logWarn(options);
    };
    /*
   * Logs a user defined error message.
   *
   * @method logError
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logError = function(options) {
        this.monitor.logError(options);
    };
    /*
   * Logs a user defined assert message.
   *
   * @method logAssert
   * @public
   * @param {object} options
   *
   */
    Apigee.Client.prototype.logAssert = function(options) {
        this.monitor.logAssert(options);
    };
    global[name] = Apigee;
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Usergrid;
    };
    return global[name];
})();