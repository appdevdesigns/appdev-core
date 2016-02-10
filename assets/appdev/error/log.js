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

steal.import(

        'appdev/ad',
        'appdev/sal/web-jquery',
        'appdev/comm/service')

.then(function() {


    /**
     * @class AD.error.log
     * @parent AD_Client
     */
    if (typeof AD.error == "undefined") {
        AD.error = {};
    }


    AD.error.log = function( message, data ) {

        console.error(message, data);

        //// TODO: AD.comm.service.post({ url: 'url',  params: {message:message, data:data}});
    }
 

});

