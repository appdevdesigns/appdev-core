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

var path  = require('path');
var AD = require('ad-utils');
var _ = require('lodash');
var cJSON = require('circular-json');

var passport = require('passport');
var CasStrategy = require('passport-cas2').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;
var CookieStrategy = require(path.join(__dirname, 'adcore',  'cookieAuth.js')).Strategy;

passport.serializeUser(function(user, done) {
    done(null, user.GUID());
});
passport.deserializeUser(function(guid, done) {
    User.init({ guid: guid })
    .fail(function(err){
        done(err);
    })
    .done(function(user){
        // Passport will insert the user object into `req`
        done(null, user);
    });
});

// These will be used in the policy stacks
var passportInitialize = passport.initialize();
var passportSession = passport.session();


// import local files
var Comm  = require(path.join(__dirname, 'adcore', 'comm.js'));
var Model = require(path.join(__dirname, 'adcore', 'model.js'));
var Queue = require(path.join(__dirname, 'adcore', 'queue.js'));
var ErrorDefinitions = require(path.join(__dirname, 'adcore', 'errors.js'));


module.exports = {
    
    auth: {
        
        // Expose some passport related objects
        passport: passport,
        local: {},  // assigned during ADCore.auth.init()
        cas: {},    // assigned during ADCore.auth.init()
        google: {}, // assigned during ADCore.auth.init()
        cookieAuth: {}, // assigned during ADCore.auth.init()

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
                    .then(function(user){
                        // Passport will insert the user object into `req`
                        done(null, user);
                    });
                }
            );
            passport.use(this.local);
            
            // Cookie auth
            this.cookieAuth = new CookieStrategy(
                // The `verify` callback
                function(guid, done) {
                    User.init({ guid: guid })
                    .fail(function(err){
                        done(err);
                    })
                    .then(function(user){
                        // Passport will insert the user object into `req`
                        done(null, user);
                    });
                }
            );
            passport.use(this.cookieAuth);
           
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
                    function ADCoreCASVerify(username, profile, done) {
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
                        .then(function(){
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
                    function ADCoreGoogleVerify(accessToken, refreshToken, profile, done) {
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


        testUser: function(req, guid) {

            // don't allow this in a production site!
            if ((sails.config.environment.toLowerCase() != 'production')) {

                var user = new User({ guid: guid }, { guid: guid });

                req.user = user;

                return user.ready();

            } else {
                var dfd = AD.sal.Defered();
                dfd.reject( ADCore.error.fromKey('E_NOTESTUSERINPRODUCTION'));
                return dfd;
            }
        },
        
        
        // Manually load a user identity.
        // (This bypasses authentication. For admin use only.)
        loadUserByGUID: function(guid) {
            var dfd = User.init({ guid: guid });
            return dfd;
        }

    },


    comm: Comm,


    error: {

        // ADCore.error.log(message, data)
        log: function( message, data ) {
// refactor:
// ADCore.error.log(message, errorObj, additionalData)
//   check message for encoded application reference:  "Application:Service:function(): function() did not complete" 
//   -->  appReference: "Application:Service:function()"
//   -->  message: "function() did not complete"
//   auto parse errorObj into additionalData:
/*
//   --> additionalData.error = errorObj
//   --> additionalData.message = errorObj.message || 'no message provided'
//   --> additionalData.code = errorObj.code       || 'no code provided'
//   --> additionalData.stack   = errorObj.stack   || [ 'no stack trace' ] 
*/
            sails.log.error(message, data);
            // AD.log.error(message, data);

            // print out any provided error's stack trace:
            for (var d in data) {
                if (data[d] instanceof Error) {
                    if (data[d].stack) {
                        sails.log.error(data[d].stack.split('\n'));
                    }
                }
            }

            // store in a DB log table
            var jsonData = cJSON.stringify(data);

            SiteError.create({ message:message, data:jsonData, reviewed:false })
            .exec(function(err, entry){

                if (err) {
                    sails.log.error('ADCore.error.log():  Error saving to SiteError', err);
                }
            })

            // post it across the message bus:
            ADCore.queue.publish('site.error', { message: message, data:data });
        },


        formatValidation:function(err) {

            var returnErr = err;

            if (err.failedTransactions) {

                returnErr = { code:'E_VALIDATION', invalidAttributes:{}};
                err.failedTransactions.forEach(function(t){
                    
                    var msg = t.err.invalidAttributes;
                    for (var a in msg) {
                        if (!returnErr.invalidAttributes[a]) {
                            returnErr.invalidAttributes[a] = msg[a];
                        } else {
                            msg[a].forEach(function(m){
                                returnErr.invalidAttributes[a].push(m);
                            })
                        }
                    }
                })

                // if (err.stack) {
                //     returnErr.stack = err.stack;
                // }
            }

            return returnErr;
        },


        /*
         * ADCore.error.fromKey()
         *
         * return an error object that matches our defined key.
         *
         * if no key is found, we return false.
         */
        fromKey: function(key) {

            if (ErrorDefinitions[key]) {

                var def = ErrorDefinitions[key],
                    message = 'Error';

                if (def.message) message = def.message;

                var err = new Error(message);
                for (var k in def) {
                    if (k != 'message') {
                        err[k] = def[k];
                    }
                }

                return err;
            } else {
                return false;
            }
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



    // ADCore.model.*
    // see adcore/model.js
    model:Model,
    


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
                'cookieAuth', 
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

                var id = sails.sockets.getId(req.socket);
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
        if (typeof findOpts.password != 'undefined') {
            // Local auth initial login
            find = SiteUser.findByUsernamePassword;
        } else {
            // CAS, OAuth, or deserializing from session data
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
                
                if (!result.isActive) {
                    self.dfdReady.reject(ADCore.error.fromKey('E_ACCOUNTINACTIVE'));
                    return;
                }
                
                self.userModel = result;
                self.data.guid = self.userModel.guid;
                self.data.languageCode = self.userModel.languageCode;
                self.data.isLoaded = true;
                self.data.permissions = null;

                // now compute our permissions:
                self._computePermissions()
                .fail(function(err){
                    self.dfdReady.reject(err);
                    return true;
                })
                .then(function(permissions){
                    self.data.permissions = permissions;
                    userSessionStatusRefresh[self.data.guid] = false;
                    self.dfdReady.resolve(self);
                    return true;
                });

                // Update username, language, lastLogin timestamp.
                // Don't really care when it finishes.
                self.userModel.username = info.username || opts.username || 
                    self.userModel.username;
                self.userModel.languageCode = info.languageCode || 
                    opts.languageCode || self.userModel.languageCode;
                self.userModel.loginUpdate(true);
            }
            
            // User not found in local auth. Stop.
            else if ('local' == authType) {
                // var err = new Error('Username and/or password not found');
                // err.code = "E_INVALIDAUTH";

                var err = ADCore.error.fromKey('E_INVALIDAUTH') || new Error('Username and/or password not found');
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
                    return null;
                })
                .catch(function(err){
                    console.log('User create failed:', createOpts, err);
                    self.dfdReady.reject(err);
                    return null;
                });
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



User.prototype.scopesForActionObject = function(actionKey, objectKey) {
// console.log('... .scopesForActionObject()');
// console.log('    ... actionKey:'+actionKey); 
// console.log('.... data.permissions:', this.data.permissions);
    var scopes = [];
    if ((this.data.permissions)
        && (this.data.permissions[actionKey])) {
       

// console.log('    ...     .scopes:', this.data.permissions[actionKey]);

        this.data.permissions[actionKey].forEach(function(s){
// console.log('    ... object.keyModel:', s.object.keyModel);
// console.log('    ... objectKey:', objectKey);

            if (s.object.keyModel == objectKey) {
                scopes.push(s);
            }
        })
    }

    return scopes;
};



User.prototype._computePermissions = function() {
    var _this = this;

    var dfd = AD.sal.Deferred();

    var listPermissions = null;
    var hashRoles = null;
    var hashPerm = null;
    var listScopeObjectIDs = [];


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
                return true;
            })
            .catch(function(err){
                AD.log.error('*** error looking up permissions:', err);
                next(err);
                return true;
            })

        },


        // step 2) load all the roles with associated actions
        function(next) {

            // var listRoleIDs = [];
            // for (var i = listPermissions.length - 1; i >= 0; i--) {
            //     var perm = listPermissions[i];
            //     listRoleIDs.push(perm.role);
            // };
            var listRoleIDs = _.map(listPermissions, 'role');

            PermissionRole.find({ id: listRoleIDs })
            .populate('actions')
            .then(function(list){

                hashRoles = {};
                list.forEach(function(role){
                    hashRoles[ role.id ] = role;
                })

                next();
                return null;
            })
            .catch(function(err){
                AD.log.error('*** error looking up roles for user\'s permissions:', err);
                next(err);
                return true;
            })
        },


        // step 3) now merge the permissions and roles into a 
        //         { actionKey : [{scope}] }
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
                            hashPerm[action.action_key].push(scope);
                            listScopeObjectIDs.push(scope.object);
                        })
                    })
                } else {
                    AD.log.error('*** role not found from perm / hashRoles:', perm, hashRoles);
                }
            })

            next();

        },


        // step 4) merge in the missing scope object definitions
        // currently our hashPerm scopes have scope.object = #id, but we want scope.object = {ScopeObject}
        function(next) {
            PermissionScopeObject.find({id:listScopeObjectIDs})
            .then(function(listObjects){
                var hash = {};
                listObjects.forEach(function(o){
                    hash[o.id] = o;
                })

                for (var aKey in hashPerm) {
                    hashPerm[aKey].forEach(function(s){
// console.log('s.object:', s.object);

                        if (!s.object.id) {
// console.log('hash[s.object]:', hash[s.object]);
                            s.object = hash[s.object];

                        }
                    })
                }

// console.log('... final hashPerm:');
// console.log(hashPerm);

                next();
                return false;
            })
            .catch(function(err){
                next(err);
                return false;
            })
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



User.prototype.id = function() {
    return this.userModel.id;
};



//// LEFT OFF:
//// - figure out unit tests for testing the controller output.




