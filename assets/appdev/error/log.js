/*
**
* @class AD_Client.error.log
* @parent AD_Client.error
*
* ##error.log
*
* We provide a logging capability to notify developers of detected UI errors.
*
*
* ##Usage:
*
*
*
*/

steal('appdev/ad.js',
    'appdev/sal/web-jquery.js',
    'appdev/comm/service.js',
    function () {

        /**
         * @class AD.error.log
         * @parent AD_Client
         */
        if (typeof AD.error == "undefined") {
            AD.error = {};
        }


        AD.error.log = function (message, data) {

            //// TODO: would be great to have some site config settings for 
            ////    - useWebix: {bool}    true: dump message to webix.message();
            ////    - webixTimeout: {int} expire value in ms
            ////    - consoleLog: {bool}  true: dump message and data to console.error
            console.error(message, data);
            
            // Log error to Countly, if available
            if (typeof Countly == 'object') {
                var err;
                if (data instanceof Error) {
                    // Combine `message` into existing error object
                    err = data;
                    if (data.message) {
                        err.message = message + '\n' + data.message;
                    } else {
                        err.message = message;
                    }
                    if (data.stack) {
                        err.stack = message + '\n' + data.stack;
                    }
                }
                else {
                    // Create new error object
                    err = new Error(message);
                }
                Countly.log_error(err, { 'via': 'AD.error.log' });
            }

            // if the webix library is included, then post the message there.
            if (webix) {
                webix.message({ type:'error', text:message, expire:2000 });
            }

            //// TODO: AD.comm.service.post({ url: 'url',  params: {message:message, data:data}});
        }

    });


