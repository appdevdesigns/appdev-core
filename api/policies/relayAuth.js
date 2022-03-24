/**
 * relayAuth
 * 
 * Used by app_builder.
 * When it receives a request through the secure relay, it turns around and
 * re-submits that request to itself on behalf of the relay user.
 * @see app_builder/api/services/ABRelay.js :: _formatServerRequest()
 * 
 * @module      :: Policy
 * @description :: Check to see if the AppBuilder ABRelayUser is provided, and
 * verify if the proper access token is provided..
 *
 */
 
module.exports = function(req, res, next) {
    
    var auth = req.headers['authorization'];

    // Skip if ABRelayUser is not implemented on this OpsPortal server.
    if (!sails.models['abrelayuser']) {
        return next();
    }

    // Skip if the authorization header is the wrong format
    if (!auth || auth.slice(0, 8) != "relay@@@") {
        return next();
    }

    if (!sails.config.appbuilder) {
        return next();
    }

    // Expected format is "relay@@@<mcc access token>@@@<ABRelayUser UUID>"
    var authParts = auth.split("@@@");
    var mccToken = authParts[1];
    var userUUID = authParts[2];

    if (mccToken != sails.config.appbuilder.mcc.accessToken) {
        ADCore.error.log("relayAuth: incorrect MCC access token", {
            "mcc access token": mccToken
        });
        return next();
    }
        

    ABRelayUser.findOne({user: userUUID})
    .then((relayUser)=>{

        // if we didn't find one, continue:
        if (!relayUser) {
            ADCore.error.log("relayAuth: no matching relay user UUID", {
                "relayuserUUID": userUUID
            });
            return next();
        }

        ADCore.auth.loadUserByGUID(relayUser.siteuser_guid)
        .fail(function(err) {
            sails.log('relayAuth: Failed to load user [' + relayUser.siteuser_guid + '] using auth key');
            sails.log(err);
            // Continue normally and let other policies generate
            // the error message if the request is unauthorized.
            next();
        })
        .done(function(user) {

            if (user) {
                sails.log('relayAuth: User [' + relayUser.siteuser_guid + '] loaded using uuid');
                req.user = user;
                
            } else {

                var data = {
                    message: '!!! relayAuth: User ['+ relayUser.siteuser_guid + '] NOT LOADED using uuid ['+userUUID+']',
                    relayUser:relayUser,
                    token:userUUID
                }
                ADCore.error.log('AppBuilder:Policy[relayAuth]:'+data.message, data);
            }
            
            next();
        });

    })

};
