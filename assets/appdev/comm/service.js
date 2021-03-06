/*
**
* @class AD_Client.comm.service
* @parent AD_Client.comm
*
* ##Service
*
* We provide a basic communication method to communicate with our server side
* services.  This routine will automatically respond to reauthenticate
* requests and queue up the service call to be called again.
*
*
* ##Usage:
*
*
*
*/

steal(
    'appdev/ad.js',
    'appdev/sal/web-jquery.js',
    'appdev/comm/pending.js',
// 'appdev/comm/hub.js',
    'appdev/auth/reauth.js',
    function () {

        (function () {
            
            /**
             * CSRF object for internal use only.
             */
            var CSRF = {
                token: null,
                /**
                 * Fetch the user's CSRF token from sails.js
                 * @return Deferred
                 *    Resolves with the CSRF token string when it has been fetched
                 */
                fetch: function () {
                    var dfd = AD.sal.Deferred();
                    AD.sal.http({
                        type: 'GET',
                        url: '/csrfToken',
                        dataType: 'json',
                        cache: false
                    })
                        .done(function (data, status, res) {
                            CSRF.token = data._csrf;
                            dfd.resolve(CSRF.token);
                        })
                        .fail(function (res, status, err) {
                            var csrfError = new Error('Unable to get CSRF token: ' + err.message);
                            console.log(csrfError);
                            dfd.reject(csrfError);
                            //dfd.resolve(null);
                        });
                    return dfd;
                }
            }

            /**
             * @class AD.comm.service
             * @parent AD_Client
             */
            if (typeof AD.comm == "undefined") {
                AD.comm = {};
            }
            
            
            /**
             * Track the server state when it goes down during reloading
             * @private
             */
            var isServerReady = true;
            
            // The JS library load order is not consistent. Work around that
            // by waiting for socket.io with setTimeout.
            AD.waitFor('io', function() {
                io.socket.on('server-reload', function(data) {
                //AD.comm.socket.subscribe('server-reload', function(data) {
                    if (data.reloading) {
                        console.log('Server is now reloading');
                        isServerReady = false;
                    } else {
                        console.log('Server has finished reloading');
                        isServerReady = true;
                        if (!AD.ui.reauth.inProgress()) {
                            AD.comm.pending.process();
                        }
                    }
                });
            });
            
            
            /**
             * Check if the server is currently ready to handle requests.
             * @return boolean
             */
            AD.comm.isServerReady = function() {
                return isServerReady;
            }


            AD.comm.csrf = function () {
                var dfd = AD.sal.Deferred();

                // Fetch CSRF token if needed
                if (!CSRF.token) {

                    CSRF.fetch()
                        .done(function () {
                            dfd.resolve(CSRF.token);
                        })
                        .fail(dfd.reject);
                } else {
                    dfd.resolve(CSRF.token);
                }

                return dfd;
            }

            //--------------------------------------------------------------------------
            AD.comm.service = {};


            AD.comm.service.get = function (options, cb) {
                options['method'] = 'GET';
                return request(options, cb);
            };

            AD.comm.service.post = function (options, cb) {
                options['method'] = 'POST';
                return request(options, cb);
            };

            AD.comm.service.put = function (options, cb) {
                options['method'] = 'PUT';
                return request(options, cb);
            };

            AD.comm.service['delete'] = function (options, cb) {
                options['method'] = 'DELETE';
                return request(options, cb);
            };


            /*
             * @private
             *
             * An array to hold any pending requests that are waiting for 
             * authentication to complete.
             *
             * The individual entries in the array are objects:
             * { opts:options,  cb:callback,  dfd:deferred }
             *
             */
            // var pendingRequests = [];


            // var processRequest = function (entry) {

            //     request( entry.opts, function(err, data) {

            //         // call the callback if provided.
            //         if (entry.cb) {
            //             entry.cb( err, data);
            //         }

            //         // now finish off the deferred for this operation
            //         if (err) {
            //             entry.dfd.reject(err);
            //         } else {
            //             entry.dfd.resolve(data);
            //         }
            //     });

            // };

            /**
             * context()
             *
             * simple options builder for building the context of the current request
             */
            var context = function (options, cb, dfd) {
                return { request: request, opts: options, cb: cb, dfd: dfd };
            }


            /**
             * @function request()
             * @private
             *
             * Make an HTTP request asynchronously.
             *
             * @param {String} options.method
             *    [optional] The HTTP verb to use. Default is POST.
             * @param {String} options.url
             *    The URL to post the request to.
             * @param {Object} options.params
             *    An associative array of field names and values to post.
             * @param {Function} options.complete
             *    The callback function to execute after the request is completed,
             *    before checking whether or not it succeeded or failed.
             * @param {Function} options.success
             *    The callback function to execute if the request is successful.
             * @param {Function} options.failure
             *    The callback function to execute if the request failed.
             *
             * @return Deferred
             */
            var request = function (options, cb) {
                var dfd = AD.sal.Deferred();

                // Default is async, but you can specify 'sync: true' in the options
                // to change to sync mode instead.
                var asyncMode = true;
                if (options.sync) {
                    asyncMode = false;
                }
                options.method = options.method || 'POST';
            
                // The documented option key is 'params', but 'data' will also
                // be accepted.
                if (!options.params && options.data) {
                    options.params = options.data;
                }
            
                // Fetch CSRF token if needed
                if (!CSRF.token && options.method != 'GET') {
                    CSRF.fetch()
                        .done(function () {
                            // Resubmit request after getting token
                            request(options, cb)
                                .done(dfd.resolve)
                                .fail(dfd.reject);
                        })
                        .fail(dfd.reject);
                    return dfd;
                }
            
            
                // if we are currently in process of authenticating, then
                // queue request
                if (AD.ui.reauth.inProgress() || !AD.comm.isServerReady()) {

                    // make sure this isn't our local auth submission:
                    if (!((options.method == 'POST')&&(options.url=='/site/login'))) {

                        AD.comm.pending.add(context(options, cb, dfd));
                        // pendingRequests.push({ opts:options, cb:cb, dfd:dfd });
                        return dfd;
                    }
                }
            
                // responds to a { status = false;  .... } responses.
                // var _handleAppdevError = function( data ) {
                
                //     var errorID = data.id;
                //     // Authentication failure (i.e. session timeout)
                //     if (errorID == 5) {
                    
                //         // store current request
                //         pendingRequests.push({ opts:options, cb:cb, dfd:dfd });
                    
                //         // Reauthenticate
                //         AD.ui.reauth.start()
                //         .done(function(){
                //             var currReq;
                //             while (currReq = pendingRequests.shift()) {
                //                 processRequest(currReq);
                //             }
                //         });
                    
                //         return;
                //     }
                //     // Some other error
                //     else {

                //         AD.comm.hub.publish('ad.err.notification', data);
                //         if (cb) {
                //             cb(data);
                //         }
                //         dfd.reject(data);
                //         return;
                //     }
                // };


                AD.sal.http({
                    async: asyncMode,
                    url: options['url'],
                    type: options['method'],
                    contentType: options['contentType'],
                    dataType: 'json',
                    data: options['params'],
                    headers: {
                        'X-CSRF-Token': CSRF.token
                    },
                    cache: false
                })
                    .fail(function (req, status, statusText) {

                        // was this a CSRF error?
                        if (req.responseText.toLowerCase().indexOf('csrf') != -1) {

                            // reset our CSRF token
                            CSRF.token = null;

                            // resubmit the request 
                            request(options, cb)
                                .done(dfd.resolve)
                                .fail(dfd.reject);
                            return;
                        }



                        // check to see if responseText is our json response
                        var data;
                        try {
                            data = AD.sal.parseJSON(req.responseText);
                        } catch (err) {
                            console.log('JSON text:', req.responseText);
                            console.log('Parse error:', err);
                            data = null;
                        }
                        
                        if (('object' == typeof data) && (data != null)) {

                            if ('undefined' != typeof data.status) {

                                // this could very well be one of our messages:
                                // _handleAppdevError( data );
                                AD.comm.error(data, context(options, cb, dfd));
                                return;
                            };
                        }

                        // if data still not set, then try to compile an error from 
                        // the status + statusText:
                        if (!data) {
                            if (status) {
                                data = status;
                            }
                            if (statusText) {
                                data = (data ? data : "") + ": " + statusText;
                            }
                            if (req.responseText) {
                                data = (data ? data: "") + ": " + req.responseText;
                            }
                        }

                        // Serious error where we did not even get a JSON response
                        AD.comm.hub.publish('ad.err.notification', data);
                        if (cb) {
                            cb(data);
                        }
                        dfd.reject(data);
                    })
                    .done(function (data, textStatus, req) {

                        // Got a JSON response but was the service response an error?
                        if (data.status && (data.status == 'error')) {

                            // _handleAppdevError( data );
                            AD.comm.error(data, context(options, cb, dfd));
                            return;
                        }
                        // Success!
                        else {

                            // if this was an appdev packet, only return the data:
                            if (data.status && data.status == 'success') {
                                data = data.data;
                            }


                            if (cb) cb(null, data);
                            dfd.resolve(data);
                        }


                    }); // ajax()


                return dfd;

            }; // request()

        })();
    });

