/*
**
* @class AD_Client.comm.error
* @parent AD_Client.comm
*
* ##Error
*
* A common error handling routine for our AD.comm.*  methods.
*
* We process errors that result from our AD.comm.* utilities.  In case of some 
* expected errors, we can initiate some UI actions: like a reauthentication.
*
* 
*
*
* ##Usage:
*
*
*
*/

steal(
    'appdev/ad.js',
    'appdev/comm/hub.js',
    'appdev/comm/pending.js',
    'appdev/auth/reauth.js',
    function () {


        /**
         * @class AD.comm.service
         * @parent AD_Client
         */
        if (typeof AD.comm == "undefined") {
            AD.comm = {};
        }


        /**
         * error()
         *
         * detect any appdev errors that are recoverable, and respond to them.
         *
         * @param {json} data     the data returned from the AD.comm.*() call.
         * @param {json} context  the context of the call being made.  Used to 
         *                        properly resend another call once we handle the
         *                        error
         *         context 
         *         {fn}   .request   the fn() to call to make the request
         *         {json} .options   the request options 
         *         {fn}   .cb        (optional) the callback function cb(err, data);
         *         {dfd}  .dfd       the deferred associated with the request.
         */
        AD.comm.error = function (data, context) {

            var errorID = data.id;
            // Authentication failure (i.e. session timeout)
            if (errorID == 5) {
            
                // store current request
                AD.comm.pending.add(context);
            
                // Reauthenticate
                AD.ui.reauth.start()
                    .done(function () {

                        AD.comm.pending.process(); // start processing the pending requests.

                    });

            }
            // Some other error
            else {

                AD.comm.hub.publish('ad.err.notification', data);
                if (context.cb) {

                    context.cb(data);  // cb(err, data);
                }
                context.dfd.reject(data);
            }
        }


    });

