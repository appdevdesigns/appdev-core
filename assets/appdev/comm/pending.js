/*
**
* @class AD_Client.comm.pending
* @parent AD_Client.comm
*
* ##Pending
*
* Collect any transactions that queue up waiting for the user to Authenticate.
*
* ##Usage:
*
*
*
*/

steal(

        'appdev/ad.js'

).then(function() {



    /**
     * @class AD.comm.service
     * @parent AD_Client
     */
    if (typeof AD.comm == "undefined") {
        AD.comm = {};
    }




    /*
     * @private
     *
     * An array to hold any pending requests that are waiting for 
     * authentication to complete.
     *
     * The individual entries in the array are objects:
     * { request:request(options, cb),  opts:options,  cb:callback(err, data),  dfd:deferred }
     *
     */
    var pendingRequests = [];


    var processRequest = function (entry) {

        AD.sal.setImmediate(function(){

            // request( options, cb );
            entry.request( entry.opts, function(err, data) {

                // call the callback if provided.
                if (entry.cb) {
                    entry.cb( err, data);
                }

                // now finish off the deferred for this operation
                if (entry.dfd) {
                    if (err) {
                        entry.dfd.reject(err);
                    } else {
                        entry.dfd.resolve(data);
                    }
                }
            });

        });

    };


    /**
     * pending()
     *
     * store a request context for later action.
     *
     * @param {json} context  the context of the call being made.  Used to 
     *                        properly resend another call once we handle the
     *                        error
     *         context 
     *         {fn}   .request   the fn() to call to make the request
     *         {json} .options   the request options 
     *         {fn}   .cb        (optional) the callback function cb(err, data);
     *         {dfd}  .dfd       the deferred associated with the request.
     */
    AD.comm.pending = {


        /**
         * AD.comm.pending.add()
         *
         * store a request context for later action.
         *
         * @param {json} context  the context of the call being made.  Used to 
         *                        properly resend another call once we handle the
         *                        error
         *         context 
         *         {fn}   .request   the fn() to call to make the request
         *         {json} .options   the request options 
         *         {fn}   .cb        (optional) the callback function cb(err, data);
         *         {dfd}  .dfd       the deferred associated with the request.
         */
        add: function(context) {

            pendingRequests.push(context);

        },



        /**
         * AD.comm.pending.process()
         *
         * resend all the pending requests.
         */
        process: function() {
            var currReq;
            while (currReq = pendingRequests.shift()) {

                processRequest(currReq);
            }
        }

    };


});

