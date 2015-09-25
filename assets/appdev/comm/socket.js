/*
**
* @class AD_Client.comm.socket
* @parent AD_Client.comm
*
* ##Service
*
* We provide an interface to the sails socket io library that more closely 
* resembles our service interface.
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
        'js/dependencies/sails.io.js'

).then(function() {




    // (function() {



        /**
         * @class AD.comm.service
         * @parent AD_Client
         */
        if (typeof AD.comm == "undefined") {
            AD.comm = {};
        }

        //--------------------------------------------------------------------------
        AD.comm.socket = {};


        AD.comm.socket.get = function(options, cb) {
            options['method'] = 'get';
            return request(options, cb);
        };

        AD.comm.socket.post = function(options, cb) {
            options['method'] = 'post';
            return request(options, cb);
        };

        AD.comm.socket.put = function(options, cb) {
            options['method'] = 'put';
            return request(options, cb);
        };

        AD.comm.socket['delete'] = function(options, cb) {
            options['method'] = 'delete';
            return request(options, cb);
        };



        /*
         * @function subscribe
         *
         *  Subscribe to messages from the socket.
         *
         *  @codestart
         *      var subscriptionID = AD.comm.socket.subscribe('TVShow.Created', function(message, data) {
         *          //add entry contained in data to list
         *          listWidget.addEntry(data);
         *      });
         *  @codeend
         */
        AD.comm.socket.subscribe = function(key, cb) {

            // we want to be able to provide a [message].[value] combo here to allow 
            // subscriptions to models like:  model.verb,  user.created,  user.deleted, etc...

            // io.socket.on()  only understands the first level of the message:  [message]
            // 

            // first take the 'key' and split it up into parts:
            var keyParts = key.split('.');

            var message = keyParts[0].toLowerCase();
            var verb = '_all';
            if (keyParts[1]) verb = keyParts[1].toLowerCase();


            // if there are no messages registered:
            // create the message container:
            if (!subscriptions[message]) {
                subscriptions[message] = {
                    '_all':[]
                }
            }

            // if message.verb is registered
            if (subscriptions[message][verb]) {

                // add to cb array
                subscriptions[message][verb].push(cb);

            } else {// else 

                // create cb array for message.verb
                subscriptions[message][verb] = [ cb ];
            }


            // now if we have not already registered message with io.socket
            if (!notified[message]) {
// console.log('AD.comm.socket.subscribe(): registering message['+message+'] with io.socket.on()');


                // BUILD FIX: steal build will die because the io library wont properly compile
                if (typeof io != 'undefined') {
                io.socket.on(message, function(data) {
// console.log('io.socket.on(): message['+message+']');
                    processMessage(message,data);
                });
                }
                
                notified[message] = true;

            }


            // now register this request with a subscriptionID
            subscriptionCount++;
            subscriptionIDs[subscriptionCount] = {
                message:subscriptions[message],         // links to the {} at [message]
                verb:verb,
                cb:cb
            }

            return subscriptionCount;

        }


        // track our socket.subscriptions here:
        // format:
        // [message]: {
            // _all:[ cb, cb, cb],   // these cb's get called on all messages by message
            // 'value': [cb, cb, cb] .. these cb's get called when there are values in the message that match 'value'
            // examples:
            // 'created': [cb],     // call when a verb: 'created'   is sent
            // '16' : [cb]          // call when an id:16  is sent
        //  }
        var subscriptions = {};
        var notified = {};

        // subscriptionIDs keep track of our ids with the cb that reference
        var subscriptionCount = 0;
        var subscriptionIDs = {};



        /*
         * @function processMessage
         *
         * Process all messages coming back from our io.socket.on() subscriptions
         * and direct them to any of our more complex subscriptions.
         *
         * This fn() will attempt to narrow the messages down to message+verb
         * or message+value subscriptions.
         */
        var processMessage = function(message, data) {

            

            // if we have any subscriptions for message:
            if (subscriptions[message]) {

                var keyVerb = message + '.' + data.verb;

                var sub = subscriptions[message];

                // process any '_all' subscriptions:
                sub['_all'].forEach(function(cb){
                    cb(keyVerb, data);
                });


                // convert the values in data to an array:
//// Question:  did I mean to do data  or data.data ?  
////            if all I wanted to do was capture { id: # } then why not simply 
////            pull data.id out and see if there is a subscription for that?
////
                var arryData = [];
                for (var d in data) {
                    arryData.push(data[d]);
                }

                // now check each 'key' of subscription and see if it is in arryData
                for (var k in sub) {

                    var keyKey =  message + '.' + k;
                    if (arryData.indexOf(k) != -1) {
                        // found a match, so call those cb's:
                        sub[k].forEach(function(cb){
                            cb(keyKey, data);
                        })
                    }

                    // special case:  if k is a number then search for that:
                    if(AD.ui.jQuery.isNumeric(k)){
                        var kFloat = parseFloat(k);

                        if (arryData.indexOf(kFloat) != -1) {
                            // found a match, so call those cb's:
                            sub[k].forEach(function(cb){
                                cb(keyKey, data);
                            })
                        }
                    }
                    
                }

            }



        }


        /*
         * @private
         *
         * An array to hold any pending requests that are waiting for authentication
         * to complete.
         *
         * The individual entries in the array are objects:
         * { opts:options,  cb:callback,  dfd:deferred }
         *
         */
/*
        var pendingRequests = [];


        var processRequest = function (entry) {

            request( entry.opts, function(err, data) {

                // call the callback if provided.
                if (entry.cb) {
                    entry.cb( err, data);
                }

                // now finish off the deferred for this operation
                if (err) {
                    entry.dfd.reject(err);
                } else {
                    entry.dfd.resolve(data);
                }
            });

        };



        var onAuthSuccessful = function(handle, data) {

            var currReq;
            while( currReq = pendingRequests.shift() ) {
                processRequest(currReq);
            }

        };
        AD.comm.hub.subscribe('ad.auth.reauthentication.successful', onAuthSuccessful);


*/
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
         * @param {jQuery} options.messageBox
         *    jQuery selection of the message box to display any error messages
         *    in. If not specified, then a dialog box will be used.
         * @param {String} options.showErrors
         *    "ON", "OFF", or "AUTO". Default is AUTO.
         *    Auto means errors will be shown unless a failure callback is
         *    provided.
         */
        var request = function(options, cb) {
            var dfd = AD.sal.Deferred();

            // Default is async, but you can specify 'sync: true' in the options
            // to change to sync mode instead.
//            var asyncMode = true;
//            if (options.sync) {
//                asyncMode = false;
//            }
            if (!options.method) {
                options.method = 'post';
            }


            // if we are currently in process of authenticating, then
            // queue request
/*            if ((typeof AD.winLogin.isVisible != 'undefined')
                && (AppDev.winLogin.isVisible())) {

                var dfd = $.Deferred();
                pendingRequests.push({ opts:options, cb:cb, dfd:dfd });

                return dfd;
            }
*/

            // responds to a { status = error;  .... } responses.
            var _handleAppdevError = function( data ) {

                var errorID = data.id;
                // Authentication failure (i.e. session timeout)
                if (errorID == 5) {

                    // store current request
                    pendingRequests.push({ opts:options, cb:cb, dfd:dfd });

                    // Reauthenticate
                    AD.comm.hub.publish('ad.auth.reauthenticate', {});

                    return;
                }
                // Some other error
                else {

/*
                    var showErrors = options['showErrors'];

                    // Execute the optional failure callback
                    if ($.isFunction(options['failure'])) {
                        options.failure(data);
                        // Turn off showErrors if it wasn't enabled
                        // explicitly.
                        if (!showErrors || showErrors == 'AUTO') {
                            showErrors = 'OFF';
                        }
                    }
                    // No failure callback given
                    else if (!showErrors || showErrors == 'AUTO') {
                      // Turn on showErrors if it wasn't disabled
                      // explicitly.
                      showErrors = 'ON';
                    }

                    // Display error message if needed
                    if (showErrors == 'ON') {
                        var errorMSG = data.error
                            || data.errorMSG
                            || data.errorMessage
                            || data.message;
                        if (!errorMSG) { errorMSG = "Error"; }
                        AppDev.displayMessage(
                            errorMSG,
                            options['messageBox']
                        );
                    }
*/

                    AD.comm.hub.publish('ad.err.notification', data);
                    if (cb) {
                        cb(data);
                    }
                    dfd.reject(data);
                    return;
                }
            };


            // this prevents our build process from crashing on undefined 'io'
            if (typeof io != "undefined") {
            io.socket[options.method](options.url, options.params, function(data, jwres){

console.log('AD.comm.socket.'+options.method+'() response:');
console.log(data);
console.log('jwres:');
console.log(jwres);


                // if this is an  error
                if (jwres.statusCode >= 400) {

//// TODO: handle any reauth errors here:

                    var err = new Error(jwres.toString());
                    dfd.reject(err);

                } else {

                    data = JSON.parse(data);

                    if (data.status) {

                        // if we got an error
                        if (data.status == 'error') {

//// TODO: handle any reauth errors here:
dfd.reject(data.data);

                        } else {

                            // there should only be 2 statuses so this is 
                            // a success:
                            dfd.resolve(data.data);
                        }

                    }


                }

/*
                // Got a JSON response but was the service response an error?
                if (data.status && (data.status == 'error')) {

                    _handleAppdevError(data);
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
*/

            });

            } // end if(io)
/*
//            $.ajax({
            AD.sal.http({
                async: asyncMode,
                url: options['url'],
                type: options['method'],
                contentType: options['contentType'],
                dataType: 'json',
                data: options['params'],
                cache: false
            })
            .fail(function(req, status, statusText) {

                    // check to see if responseText is our json response
                    var data = AD.sal.parseJSON(req.responseText);
                    if (('object' == typeof data) && (data != null)) {

                        if ('undefined' != typeof data.status) {

                            // this could very well be one of our messages:
                            _handleAppdevError( data );
                            return;
                        };
                    }

                    // Serious error where we did not even get a JSON response
                    AD.comm.hub.publish('ad.err.notification', data);
                    if (cb) {
                        cb(data);
                    }
                    dfd.reject(data);
                })
            .done(function(data, textStatus, req) {

                // Got a JSON response but was the service response an error?
                if (data.status && (data.status == 'error')) {

                    _handleAppdevError(data);
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

*/
            return dfd;

        }; // request

    // })();
});

