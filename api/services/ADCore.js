/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an 
 *                 application.
 *
 */

// Try not to execute this again if it's already loaded globally
if (typeof ADCore == 'object') {
    module.exports = ADCore;
    return;
}

var $ = require('jquery-deferred');
var AD = require('ad-utils');
var _ = require('lodash');

var passport = require('passport');
var CasStrategy = require('passport-cas2').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user.GUID());
});
passport.deserializeUser(function(guid, done) {
    var user = new User({ guid: guid });
    user.ready()
    .fail(function(err){
        done(err);
    })
    .done(function(){
        // Passport will insert the user object into `req`
        done(null, user);
    });
});

// These will be used in the policy stacks
var passportInitialize = passport.initialize();
var passportSession = passport.session();


// import local files
var path = require('path');
var Queue = require(path.join(__dirname, 'adcore', 'queue.js'));


module.exports = {
    
    auth: {
        
        // Expose some passport related objects
        passport: passport,
        local: {},  // assigned during ADCore.auth.init()
        cas: {},    // assigned during ADCore.auth.init()
        google: {}, // assigned during ADCore.auth.init()

        /**
         * @function ADCore.auth.init()
         * Initialize the passport strategies. Can only be done after 
         * sails.config has been defined. This function will be called from 
         * ADCore's bootstrap.js.
         */
        init: function() {

            // attempting to install more secure ssl-root-ca
            var sslRootCAs = require('ssl-root-cas/latest');
            sslRootCAs.inject();


            // Local auth
            // @see /site/login
            this.local = new LocalStrategy(
                // The `verify` callback
                function(username, password, done) {
                    User.init({
                        username: username,
                        password: password
                    })
                    .fail(function(err){
                        done(err);
                    })
                    .done(function(user){
                        // Passport will insert the user object into `req`
                        done(null, user);
                    });
                }
            );
            passport.use(this.local);
            
            // CAS
            if (sails.config.cas) {
                this.cas = new CasStrategy(
                    {
                        casURL: sails.config.cas.baseURL,
                        pgtURL: sails.config.cas.pgtURL || sails.config.cas.proxyURL,
                        sslCert: sails.config.cas.sslCert || null,
                        sslKey: sails.config.cas.sslKey || null,
                        sslCA: sails.config.cas.sslCA || null
                    }, 
                    // The `verify` callback
                    function(username, profile, done) {
                        var guidKey = sails.config.cas.guidKey || 'id';
                        var guid = profile[guidKey] || username;
                        if (Array.isArray(guid)) {
                            guid = guid[0];
                        }
                        var user = new User({ guid: guid }, {
                            guid: guid,
                            username: username
                        });
                        user.ready()
                        .fail(function(err){
                            done(err);
                        })
                        .done(function(){
                            // Passport will insert the user object into `req`
                            done(null, user);
                        });
                    }
                );
                passport.use(this.cas);
            }
            
            // Google OAuth2
            // @see /auth/google
            if (sails.config.google) {
                this.google = new GoogleStrategy(
                    {
                        clientID: sails.config.google.clientID,
                        clientSecret: sails.config.google.clientSecret,
                        callbackURL: (sails.config.google.baseURL || 
                                        sails.getBaseurl())
                                        + '/auth/google'
                    },
                    // The `verify` callback
                    function(accessToken, refreshToken, profile, done) {
                        var profileName = profile.name.givenName + ' ' 
                                            + profile.name.familyName;
                        var user = new User({ guid: profile.id }, {
                            guid: profile.id,
                            username: profileName 
                                || profile.displayName 
                                || profile.id
                        });
                        user.ready()
                        .fail(function(err){
                            done(err);
                        })
                        .done(function(){
                            // Passport will insert the user object into `req`
                            done(null, user, profile);
                        });
                    }
                );
                passport.use(this.google);
            }
        },
        
        isAuthenticated: function(req) {
            if (req.user) {
                return true;
            } else {
                return false;
            }
        },

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


            // Sails v0.11 no longer has res.header on socket connections
            if(res.header) res.header('Content-type', 'application/json'); 

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



        success:function(res, data, code) {

            var packet = {
                status:'success',
                data:data
            };

            // default to HTTP status code: 200
            if ('undefined' == typeof code) code = 200; //AD.Const.HTTP.OK;  // 200: assume all is ok

            // Sails v0.11 no longer has res.header on socket connections
            if(res.header) res.header('Content-type', 'application/json');
            
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
        }

    },



    error: {

        log: function( message, data ) {

            AD.log.error(message, data);

            // store in a DB log table

            // post it across the message bus:
            ADCore.queue.publish('site.error', { message: message, data:data });
        }
    },



    labelsForContext: function(context, code, cb) {
        var dfd = AD.sal.Deferred();

        // verify cb is properly set
        if (typeof code == 'function') {
            if (typeof cb == 'undefined') {
                cb = code;
                code = Multilingual.languages.default(); // <-- this should come from site Default
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




    model:{

        /**
         * @function ADCore.model.join
         */
        join:function(options) {
            var dfd = AD.sal.Deferred();


            var list = options.list || [];

            var fk = options.fk || options.pk;  // the fk value in the existing list
            var pk = options.pk;    // the pk value in my definition
            var destKey = options.destKey; // what to store my model instance in list object
            var Model = options.Model;  // this Model

            // go through each list entry and compile the valid fk's
            var ids = [];
            list.forEach(function(entry){
                if (entry[fk]) {
                    ids.push(entry[fk]);
                }
            })

            // if we have some matches 
            if (ids.length == 0) {
                dfd.resolve(list);

            } else {

                var filter = {};
                filter[pk] = ids;

                Model.find(filter)
                .fail(function(err){
                    dfd.reject(err);
                })
                .then(function(listModels){
                    var hashModels = _.indexBy(listModels, pk);

                    list.forEach(function(entry){

                        entry[destKey] = null;

                        // if this entry's fk is in our hashModel
                        if (hashModels[entry[fk]]) {

                            // add it 
                            entry[destKey] = hashModels[entry[fk]];

                        }
                    });
                    dfd.resolve(list);
                })
            }


            return dfd;   

        },



        /**
         * @function ADCore.model.translate()
         *
         * This tool will help an instance of a Multilingual Model find the proper
         * language translations for the data it currently represents.
         *
         * For this to work, a "Multilingual Model" needs to have the following 
         * definition:
         *           attributes: {
         *
         *               // attribute definitions here ...
         *
         *               translations:{
         *                   collection:'PermissionRolesTrans',
         *                   via:'role'  // the column in TranslationTable that has our id
         *               },
         *               _Klass: function() {
         *                   return PermissionRoles;
         *               },
         *               translate:function(code) {
         *                   return ADCore.model.translate({
         *                       model:this, // this instance of this
         *                       code:code   // the language_code of the translation to use.
         *                   });
         *               },
         *           }
         *
         * translations:{}  defines the additional Table that contains the multilingual
         * data for this row. (the 'TranslationTable')
         *
         * _Klass:function(){} allows the instance of the model to return it's own Class
         * definition.
         *
         * translate:function(code){}  is the function to call this one.  
         *
         * This 
         * 
         */
        translate:function(opt){

            var dfd = AD.sal.Deferred();
    
            var model = opt.model || null;
            var code = opt.code || Multilingual.languages.default(); // use sails default here!!!

            // Error Check
            // did we receive a model object?
            if(!model) {
                dfd.reject(new Error('model object not provided!'));
                return dfd;
            }

            // Error Check 1
            // if model doesn't have a _Klass() method => error!
            if (!model._Klass) {
                dfd.reject(new Error('model does not have a _Klass() method.  Not multilingual?'));
                return dfd;
            }
            var Klass = model._Klass();


            // Error Check 2
            // if Model doesn't have an attributes.translations definition 
            // then this isn't a Multilingual Model =>  error

            if (!Klass.attributes.translations) {
                dfd.reject(new Error('given model doesn\'t seem to be multilingual.'));
                return dfd;
            } 

            
            // get the name of our TranslationModel
            var nameTransModel = Klass.attributes.translations.collection.toLowerCase();


            // NOTE: 
            // if we looked up our information like: 
            // Model.find().populate('translations').fail().then(function(entries){});
            //
            // then each entry will already have an array of translations populated:
            // [ {  id:1,
            //      foo:'bar', 
            //      translations:[ 
            //          { language_code:'en', row_label:'label here'},
            //          { language_code:'ko', row_label:'[ko]label here'},
            //          { language_code:'zh-hans', row_label:'[zh-hans]label here'}
            //      ]
            //   }, ... ]


            // if we are already populated with translations on this instance
            // then we simply iterate through them and choose the right one.
            if ((model.translations)
                && (_.isArray(model.translations)) 
                && (model.translations.length > 0)) {

                var found = Translate({
                    translations:model.translations,
                    model:model,
                    code:code,
                    ignore:opt.ignore
                });
                // if we matched 
                if (found) {
                    dfd.resolve();
                } else {
                    dfd.reject(new Error(nameTransModel+': translation for language code ['+code+'] not found.'));  // error: no language code found.
                }
            

            } else {

                // OK, we need to lookup our translations and then choose 
                // the right one.

                // 1st find the Model that represents the translation Model
                if (!sails.models[nameTransModel]) {

                    dfd.reject(new Error('translation model ['+nameTransModel+'] not found.'));

                } else {

                    // 2nd: let's figure out what our condition will be
                    // 
                    // in our translation:{} definition, we had a .via field, this 
                    // is the column in the TranslationModel that has our .id value 
                    // in it:
                    var transModel = sails.models[nameTransModel];
                    var condKey = Klass.attributes.translations.via;
                
                    var cond = {};
                    cond[condKey] = model.id;
                    cond.language_code = code;

                    // now perform the actual lookup:
                    transModel.find(cond)
                    .fail(function(err){
                        dfd.reject(err);
                    })
                    .then(function(translations){

                        var found = Translate({
                            translations:translations,
                            model:model,
                            code:code,
                            ignore:opt.ignore
                        });
                        // if we matched 
                        if (found) {
                            dfd.resolve();
                        } else {
                            dfd.reject(new Error(nameTransModel+': translation for language code ['+code+'] not found.'));  // error: no language code found.
                        }
                    })
                    .done();  // remember to use .done() to release the errors.

                }
            }

            return dfd;

        }
    },


    /*
     * policy
     *
     * methods related to our config/policy.js files.
     */
    policy: {


        /** 
         * @function ADCore.policy.serviceStack
         *
         * return an array of policies that should be run for a service.  
         *
         * This will ensure our standard ADCore policies are run before any 
         * additional policies are processed.
         *
         * @param {array} policies  Additional policy definitions to run after
         *                          our ADCore policies are processed.
         * @return {array}
         */
        serviceStack: function( policies ) {
            policies = policies || []; // make sure we have an array.

            // This is our expected series of standard policies to run for 
            // our standard service calls.
            var stack = [ 
                'util',
                passportInitialize, // defined at the top
                passportSession,    // defined at the top
                'sessionAuth', 
                'initSession',
                'noTimestamp', 
                'hasPermission',
                'validID'
            ];

            for (var i = policies.length - 1; i >= 0; i--) {
                stack.push(policies[i]);
            };

            return  stack;
        },
        
        passportStack: function() {
            return [
                'util',
                passportInitialize,
                passportSession
            ];
        }
    },



    /**
     *  ADCore.queue
     *
     *  A common message Queue implementation for our applications.
     *
     */
    queue: {
        publish: function (event, message) {
            Queue.publish(event, message);
        },
        sandbox: function (options) {
            return Queue.sandbox(options);
        },
        subscribe: function(event, callback) {
            return Queue.subscribe(event, callback);
        },
        unsubscribe: function(subKey) {
            Queue.unsubscribe(subKey);
        }
    },



    session: {

        /* 
         * return a default session object that we use to manage our ADCore info.
         * @return {json}
         */
        default: function() {

            return { auth:{}, user:null, actualUser:null, socket:{ id:null } }
        }
    },



    socket: {


        /*
         * @function ADCore.socket.id
         *
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
         * @function ADCore.socket.init
         *
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
         * @function ADCore.user.current
         *
         * Return who the system should think the current user is.
         *
         * Note: this will report what switcheroo wants you to think.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.user
         *                 field.
         */
        current: function (req) {
            return req.user;
        },



        /*
         * @function ADCore.user.actual
         * Return who the current user actually is.
         *
         * Note: switcheroo can not spoof this.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.actualUser
         *                 field.
         */
        actual: function (req) {
            return req.user.actualUser;
        },



        /**
         * @function ADCore.user.refreshSession
         *
         * mark a given user's guid as needing to refresh it's session data.
         * 
         * @param {string} guid  The GUID of the user account to refresh
         */
        refreshSession: function(guid) {
            User.refreshSession(guid);
        }
    }
};



//
// userSessionStatusRefresh
// 
// a hash to hold the status of current users and wether or not
// their data should be refreshed from the SiteUser DB.
//
// Usually changes in the Permission settings will invoke ADCore.user.refreshSession()
// and effect the status of this table.
// 
var userSessionStatusRefresh = {
    // user.guid  :  bool (should refresh from DB)
}



/**
 * @class User
 *
 * This object represents the User in the system.
 * Note that this is related to, but separate from the SiteUser model.
 *
 * @param {object} opts
 *    The properties used to find the user record.
 *    Typicaly, either { guid: "USER GUID" }
 *    or { username: "USER NAME", password: "PLAIN TEXT" }
 * @param {object} info (Optional)
 *    The properties used to create the user record if it does not exist yet.
 *    Default is to use the same properties from `opts`.
 */
var User = function (opts, info) {
    var self = this;
    opts = opts || {};
    info = info || {};
    this.data = {};
    
    // This deferred will resolve when the object has finished initializing
    // to/from the DB.
    self.dfdReady = AD.sal.Deferred();
    
    // In the event of switcheroo impersonation, this should track the real
    // identity of the current user.
    this.actualUser = this;
    
    // Internal reference to the SiteUser DB model record
    this.userModel = null;
    
    // Only do a find() if valid options were passed in
    var shouldFind = false;

    // Typically you would init by guid, username, or username+password.
    // We will allow init by other combinations of those fields. There is
    // no legitimate use for those but it is safe when done server side.
    var findOpts = {};
    [ 'username', 'guid', 'password' ].forEach(function(k) {
        if (opts[k]) {
            findOpts[k] = opts[k];
            shouldFind = true;
        }
    });
    if (shouldFind) {
        var authType = sails.config.appdev.authType.toLowerCase();
        var find;
        if ('local' == authType) {
            find = SiteUser.findByUsernamePassword;
        } else {
            find = SiteUser.findWithoutPassword;
        }
        
        find(findOpts)  // Note that this returns a jQuery Deferred
        .fail(function(err){
            // DB failure?
            console.log('User init failed:', findOpts, err);
            self.dfdReady.reject(err);
        })
        .done(function(result){
            // User found in the DB
            if (result) {
                self.userModel = result;
                self.data.guid = self.userModel.guid;
                self.data.languageCode = self.userModel.languageCode;
                self.data.isLoaded = true;
                self.data.permissions = null;

                // now compute our permissions:
                self._computePermissions()
                .fail(function(err){
                    self.dfdReady.reject(err);
                })
                .then(function(permissions){
                    self.data.permissions = permissions;
                    userSessionStatusRefresh[self.data.guid] = false;
                    self.dfdReady.resolve(self);
                });

                // Update username / language.
                // Don't really care when it finishes.
                self.userModel.username = info.username || opts.username || 
                    self.userModel.username;
                self.userModel.languageCode = info.languageCode || 
                    opts.languageCode || self.userModel.languageCode;
                self.userModel.save(function(err) {
                    if (err) {
                        console.log('SiteUser update error', err);
                    }
                });
            }
            
            // User not found in local auth. Stop.
            else if ('local' == authType) {
                var err = new Error('Username and/or password not found');
                self.dfdReady.reject(err);
            }
            
            // User not found. Insert now.
            else {
                var createOpts = {};
                [ 'guid', 'username', 'password', 'languageCode' ].forEach(function(k) {
                    if (info[k]) {
                        createOpts[k] = info[k];
                    } 
                    else if (opts[k]) {
                        createOpts[k] = opts[k];
                    }
                });
                createOpts.languageCode = createOpts.languageCode || Multilingual.languages.default();
                
                SiteUser.create(createOpts)
                .then(function(user){
                    self.userModel = user;
                    self.data.guid = user.guid;
                    self.data.isLoaded = true;
                    self.data.permissions = null;
                    userSessionStatusRefresh[self.data.guid] = false;
                    self.dfdReady.resolve(self);
                })
                .fail(function(err){
                    console.log('User create failed:', createOpts, err);
                    self.dfdReady.reject(err);
                })
                .done();
            }
        });
    }
    else {
        AD.log(opts);
        throw new Error('User was initialized with no valid options?');
        //self.dfdReady.resolve(self);
    }
    
};


// User class functions

/**
 * @function User.refreshSession
 *
 * mark a given user's guid as needing to refresh it's session data.
 * 
 * @param {string} guid  The GUID of the user account to refresh
 */
User.refreshSession = function(guid) {

    if ( guid != "*" ) {
        userSessionStatusRefresh[guid] = true;
    } else {
        for (var g in userSessionStatusRefresh) {
            userSessionStatusRefresh[g] = true;
        }
    }
}


/**
 * @function User.init
 *
 * Convenience function for instantiating a new User object instance.
 * 
 * @param {object} findOpts
 *      Basic object containing some combination of guid, username, password
 *      used to load the user model.
 * @param {object} createOpts (Optional)
 *      Basic object containing properties to populate the user model in the
 *      event that a matching user does not already exist.
 *      Default is to use the same properties from `findOpts`.
 * @return Deferred
 *      Resolves with the User object instance when the user model has been
 *      loaded from the DB
 */
User.init = function(findOpts, createOpts) {
    var user = new User(findOpts, createOpts);
    return user.ready();
}



// User instance methods

User.prototype.ready = function() {
    return this.dfdReady;
}


User.prototype.getLanguageCode = function() {
    return this.data.languageCode || Multilingual.languages.default();
};



User.prototype.hasPermission = function(key) {

    if ((this.data.permissions)
        && (this.data.permissions[key])) {
        return true;
    }

    return false;
};



User.prototype._computePermissions = function() {
    var _this = this;

    var dfd = AD.sal.Deferred();

    var listPermissions = null;
    var hashRoles = null;
    var hashPerm = null;


if (_this.userModel == null) {
    AD.log.error('*******************************************************************');
    console.trace('.... WHY IS USER NULL???? ');
    AD.log('... data:', _this.data);
//// todo: probably because User was initialized with data.isLoaded == true ... when does that happen?
}

    async.series([

        // step 1) load permissions with populated scopes
        function(next){

            Permission.find({user: _this.userModel.id, enabled:true })
            .populate('scope')
            .then(function(list){
                listPermissions = list;
                next();
            })
            .catch(function(err){
                AD.log.error('*** error looking up permissions:', err);
                next(err);
            })

        },


        // step 2) load all the roles with associated actions
        function(next) {

            // var listRoleIDs = [];
            // for (var i = listPermissions.length - 1; i >= 0; i--) {
            //     var perm = listPermissions[i];
            //     listRoleIDs.push(perm.role);
            // };
            var listRoleIDs = _.pluck(listPermissions, 'role');

            PermissionRole.find({ id: listRoleIDs })
            .populate('actions')
            .then(function(list){

                hashRoles = {};
                list.forEach(function(role){
                    hashRoles[ role.id ] = role;
                })

                next();

            })
            .catch(function(err){
                AD.log.error('*** error looking up roles for user\'s permissions:', err);
                next(err);
            })
        },


        // step 3) now merge the permissions and roles into a 
        //         { actionKey : [scopeid] }
        function(next) {

            hashPerm = {};

            listPermissions.forEach(function( perm ){

                var role = hashRoles[ perm.role ];
                if (role) {

                    role.actions.forEach(function(action){

                        // create entry in hashPerm if not there:
                        if (!hashPerm[action.action_key]) {
                            hashPerm[action.action_key] = [];
                        }

                        // now add the current scopes to this action key:
                        perm.scope.forEach(function(scope){
                            hashPerm[action.action_key].push(scope.id);
                        })
                    })
                } else {
                    AD.log.error('*** role not found from perm / hashRoles:', perm, hashRoles);
                }
            })

            next();

        }

    ], function(err,results){

        if (err) {
            dfd.reject(err);
        } else {
            dfd.resolve(hashPerm);
        }

    });

    return dfd;
}



User.prototype.GUID = function() {
    return this.data.guid;
};



//// LEFT OFF:
//// - figure out unit tests for testing the controller output.






/*
 * @function Translate
 *
 * attempt to find a translation entry that matches the provided language code.
 * 
 * if a translation entry is found, then copy the translation fields into the 
 * provided model.
 *
 * @param {object} opt  an object parameter with the following fields:
 *                      opt.translations : {array} of translation entries
 *                      opt.model   {obj} The model instance being translated
 *                      opt.code    {string} the language_code we are translating to.
 * @return {bool}  true if a translation code was found, false otherwise
 */
var Translate = function(opt) {  
    // opt.translations, 
    // opt.model, 
    // opt.code

    // these are standard translation table fields that we want to ignore:
    var ignoreFields = ['id', 'createdAt', 'updatedAt', 'language_code', 'inspect'];

    // if they include some fields to ignore, then include that as well:
    if (opt.ignore) {
        ignoreFields = ignoreFields.concat(opt.ignore);
    }

    var found = false;
    opt.translations.forEach(function(trans){

        if (trans.language_code == opt.code) {
            found = true;

            var keys = _.keys(trans);
            keys.forEach(function(f) { 
                if ( !_.contains(ignoreFields, f)) {
                    opt.model[f] = trans[f];
                }
            });
            
        }
    });

    return found;
    
}



