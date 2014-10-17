/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an application.

 *
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');

module.exports = {


    auth: {

        isAuthenticated: function( req ) {

            if (req.session.authenticated) {
                return true;
            } else {
                return false;
            }

        },



        local: {
            isAuthenticated:function(req, res, next) {
            ////TODO: <2014/1/24> Johnny : Implement a Local Auth option
                // this is used by policy/sessionAuth.js to determine if a
                // user is authenticated, and if not, what to do to begin the
                // process of authenticating them...
                // handle both web service request & web page requests

                // until this is implemented:
                ADCore.auth.markAuthenticated(req, 'anonymous.coward');

                next();
            }
        },



        markAuthenticated: function(req, guid) {
            req.session.authenticated = true;
            req.session.appdev = req.session.appdev || ADCore.session.default();
            req.session.appdev.auth.guid = guid;
            ADCore.user.init(req, {guid:guid});

        },



        markNotAuthenticated: function(req) {
            req.session.authenticated = false;
            req.session.appdev = { auth:{}, user:null, actualUser:null };  // drop all appdev info
        }
    },


    comm:{

        error:function(res, err, code) {

            var packet = {
                status:'error',
                data:err
            };

            // add in optional properties: id, message
            if (err.id) packet.id = err.id;
            if (err.message) packet.message = err.message;

            // default to HTTP status code: 400
            if ('undefined' == typeof code) code = 400; 

            res.header('Content-type', 'application/json');
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
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

            if ('CAS' == sails.config.appdev.authType) {
                // include CAS: { uri:'cas/url/here' }
                packet.data[sails.config.appdev.authType] = {
                        message:"1st authenticate with CAS.uri, then call our CAS.authUri:",
                        uri:sails.config.cas.baseURL,
                        authUri: sails.config.appdev.authURI
                }
            }

            if ('local' == sails.config.appdev.authType) {
                
                packet.data[sails.config.appdev.authType] = {
                        message:"submit username=[username]&password=[password] to this uri",
                        method: 'post',
                        uri:sails.config.cas.authURI
                }
            }

            // NOTE: this == ADCore.comm
            this.error(res, packet, 401);
        },



        success:function(res, data, code) {

            var packet = {
                status:'success',
                data:data
            };

            // default to HTTP status code: 200
            if ('undefined' == typeof code) code = 200; //AD.Const.HTTP.OK;  // 200: assume all is ok

            res.header('Content-type', 'application/json');
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
        }

    },



    hasPermission: function(req, res, next, actionKey) {
        // only continue if current user has an actionKey in one of their
        // permissions.

//// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
////       when implemented.

// console.log('ADCore.hasPermission() :  actionKey:' + actionKey);
        // pull req.session.appdev.user
        // if (user.hasPermission( actionKey) ) {
        //     next();
        // } else {
        //     res.forbidden('you dont have permission to access this resource.');
        // }

        // for now just
        next();
    },



    labelsForContext: function(context, code, cb) {
        var dfd = AD.sal.Deferred();
// AD.log('... labelsForContext():');
// AD.log('... context:'+context);
// AD.log('... code:'+code);

        // verify cb is properly set
        if (typeof code == 'function') {
            if (typeof cb == 'undefined') {
                cb = code;
                code = sails.config.appdev['lang.default']; // 'en';    // <-- this should come from site Default
            }
        }


        // options is the filter for our SiteMultilingualLabel.find()
        // make sure something is set for context
        var options = {
            label_context: context || ''
        };


        // optionally set code if provided
        if (code) {
            options.language_code = code;
        }


        SiteMultilingualLabel.find(options)
        .then(function(data){

            if (cb) cb(null, data);
            dfd.resolve(data);

        })
        .fail(function(err){

            if (cb) cb(err);
            dfd.reject(err);
        });

        return dfd;
    },


    session: {

        /* 
         * return a default session object that we use to manage our ADCore info.
         * @return {json}
         */
        default:function() {

            return { auth:{}, user:null, actualUser:null, socket:{ id:null } }
        }
    },



    socket: {


        /*
         * Return the current user's socket id
         *
         * @param {object} req   The current request object.
         * @return {string}      The stored socket id 
         */
        id:function(req) {

            if (req) {
                if (req.session) { 
                    if (req.session.appdev) {
                        if (req.session.appdev.socket) {

                            return req.session.appdev.socket.id;

                        }
                    }
                }
            }

            // if one of these failed
            var err  = new Error('ADCore.socket.id() called with improper user session defined. ');
            AD.log.error(err);
            return null;

        },



        /*
         * Update the socket ID stored in our req.session.appdev.socket value.
         */
        init: function(req) {

            // make sure this is a socket request
            if (req.isSocket) {

                var id = sails.sockets.id(req.socket);
                if (req.session.appdev.socket.id != id) {
                    AD.log('... <yellow> socket id updated:</yellow> '+req.session.appdev.socket.id +' -> '+id);
                }
                req.session.appdev.socket.id = id;
            }

        }
    },



    user:{

        /*
         * Return who the system should think the current user is.
         *
         * Note: this will report what switcheroo wants you to think.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.user
         *                 field.
         */
        current: function (req) {
            return req.session.appdev.user;
        },



        /*
         * Return who the current user actually is.
         *
         * Note: switcheroo can not spoof this.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.actualUser
         *                 field.
         */
        actual: function (req) {
            return req.session.appdev.actualUser;
        },


        /**
         * @function init
         *
         * initialize a user object for the current user.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.actualUser
         *                 field.
         * @param {object} data   the data to store about this user.  Should at least
         *                  contain { guid: 'xxxxx' }
         *
         */
        init:function(req, data) {
            req.session.appdev.actualUser = new User(data);
            req.session.appdev.user = req.session.appdev.actualUser;
        }
    }
};




/**
 * @class User
 *
 * This object represents the User in the system.
 *
 */
var User = function (opts) {
    this.data = opts;

//// TODO: implement a site_user table:
    // if opts.guid
        // then lookup ADUser.find({guid:opts.guid})
        // this.data.user = user;

};



User.prototype.getLanguageCode = function() {
    return 'en';
};



User.prototype.hasPermission = function(key) {
    return true;
};



User.prototype.GUID = function() {
    return this.data.guid;
};



//// LEFT OFF:
//// - figure out unit tests for testing the controller output.