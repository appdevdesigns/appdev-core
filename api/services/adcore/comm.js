/**
 * @class  ADCore.comm
 * @parent ADCore
 * 
 * The .comm object provides a common format for our responses to the OpsPortal.
 *
 * .error() 
 * handles providing common error message formats.
 *
 * .reauth()
 * provides a reauthenticate request for our client OpsPortal
 *
 * .success()
 * provides the requested data back to the OpsPortal.
 * 
 * 
 * ## Usage
 *
 */



var AD = require('ad-utils');
var cJSON = require('circular-json');
var _ = require('lodash');


module.exports = {

    error:function(res, err, code) {

        var packet = {
            status:'error',
            data:err
        };


        if (err) {
            
            // add in optional properties: id, message, code, mlKey
            var properties = ['id', 'message', 'code', 'mlKey'];
            properties.forEach(function(prop){
                if (err[prop]) {
                    packet[prop] = err[prop];
                }
            })
        }


        // default to HTTP status code: 400
        if ('undefined' == typeof code) code = 400; 


        // Sails v0.11 no longer has res.header on socket connections
        if (res.header) res.header('Content-type', 'application/json'); 
        
        var output = cJSON.stringify(packet)
            .replace('"false"', 'false')
            .replace('"true"', 'true');
        
        res.send(output, code);
    },



    reauth:function(res) {

        var packet = {
            id:5,
            message:'Reauthenticate.',
            authType: sails.config.appdev.authType
        };

        // add in additional auth info depending on
        // authType
        // packet.data[authType]

        packet.data = {};

        if ('local' == sails.config.appdev.authType) {
            
            packet.data[sails.config.appdev.authType] = {
                    message:"submit username=[username]&password=[password] to this uri",
                    method: 'post',
                    uri:sails.config.appdev.authURI
            }
        }
        else {
            // include CAS: { uri:'cas/url/here' }
            packet.data[sails.config.appdev.authType] = {
                    message:"1st authenticate with CAS.uri, then call our CAS.authUri:",
                    uri:sails.config.cas.baseURL,
                    authUri: sails.config.appdev.authURI
            }
        }

        // NOTE: this == ADCore.comm
        this.error(res, packet, 401);
    },



    success:function(res, data, code, skipHeaders) {

        if (typeof skipHeaders == 'undefined') {
            skipHeaders = false;
        }
        
        var packet = {
            status:'success',
            data:data
        };

        // make sure data is provided.
        if (data) {

            // allow the ability to overwrite the .status value
            if (data.status) {
                packet.status = data.status;
            }
        }

        // default to HTTP status code: 200
        if (('undefined' == typeof code) || code == null) code = 200; //AD.Const.HTTP.OK;  // 200: assume all is ok

        
        if(!skipHeaders) {
            // Sails v0.11 no longer has res.header on socket connections
            if(res.header) res.header('Content-type', 'application/json');
            // res.send(cJSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
        } else {
            res.write(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'));
            res.end();
        }
        
    }


};
