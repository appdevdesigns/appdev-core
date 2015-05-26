/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an application.

 *
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');
var _ = require('lodash');

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


        
        // @param httpRequest req
        // @param string/object properties
        //      Either a string for guid
        //      or a basic object containing
        //          - guid
        //          - username
        //          - password
        //          - languageCode
        markAuthenticated: function(req, properties) {
            if (typeof properties == 'string') {
                properties = { guid: properties };
            }
            
            req.session.authenticated = true;
            req.session.appdev = req.session.appdev || ADCore.session.default();
            req.session.appdev.auth.guid = properties.guid;
            ADCore.user.init(req, properties);
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
                        uri:sails.config.appdev.authURI
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



    labelsForContext: function(context, code, cb) {
        var dfd = AD.sal.Deferred();
// AD.log('... labelsForContext():');
// AD.log('... context:'+context);
// AD.log('... code:'+code);

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


        join:function(options) {
            var dfd = AD.sal.Deferred();


            var list = options.list || [];

            var fk = options.fk || options.pk;  // the fk value in the existing list
            var pk = options.pk;    // the pk value in my definition
            var destKey = options.destKey; // what to store my model instance in list object
            var Model = options.Model;  // this Model

// AD.log('<green>join();</green> list:', list);

            // go through each list entry and compile the valid fk's
            var ids = [];
            list.forEach(function(entry){
                if (entry[fk]) {
                    ids.push(entry[fk]);
                }
            })
// AD.log('<green>join():</green> ids:', ids);

            // if we have some matches 
            if (ids.length == 0) {
// AD.log('... no ids, so resolve');
                dfd.resolve(list);

            } else {

                var filter = {};
                filter[pk] = ids;
// AD.log("... filter:",filter);

                Model.find(filter)
                .fail(function(err){
                    dfd.reject(err);
                })
                .then(function(listModels){
                    var hashModels = _.indexBy(listModels, pk);
// AD.log('<green>join():</green> hashModels:', hashModels);

                    list.forEach(function(entry){

                        entry[destKey] = null;

                        // if this entry's fk is in our hashModel
                        if (hashModels[entry[fk]]) {

                            // add it 
                            entry[destKey] = hashModels[entry[fk]];

                        }
                    });
// AD.log('... list:', list);
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
// console.log('... Klass ok!');

            
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


// console.log('... existing .translations found:');
// console.log(model.translations);
// model.translations.forEach(function(t){
//     console.log('    trans:', t);
// })

                var found = Translate({
                    translations:model.translations,
                    model:model,
                    code:code,
                    ignore:opt.ignore
                });
                // if we matched 
                if (found) {
// console.log('... match found ... resolving() ');
                    dfd.resolve();
                } else {
// console.log('... NO MATCH!  rejecting()');
                    dfd.reject(new Error(nameTransModel+': translation for language code ['+code+'] not found.'));  // error: no language code found.
                }
            

            } else {
// console.log('... no existing .translations, so lookup!');
// console.log('isArray:', _.isArray(model.translations));
// console.log('!add():', !model.translations.add);
// console.log('model:');
// console.log(model);

                // OK, we need to lookup our translations and then choose 
                // the right one.

                // 1st find the Model that represents the translation Model
                if (!sails.models[nameTransModel]) {

                    dfd.reject(new Error('translation model ['+nameTransModel+'] not found.'));

                } else {

// console.log('... sails.models['+nameTransModel+'] found');

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

// console.log('... performing .find() operation for labels');

                    // now perform the actual lookup:
                    transModel.find(cond)
                    .fail(function(err){
// console.log('... BOOM!');
                        dfd.reject(err);
                    })
                    .then(function(translations){
// console.log('... got something... ');

                        var found = Translate({
                            translations:translations,
                            model:model,
                            code:code,
                            ignore:opt.ignore
                        });
                        // if we matched 
                        if (found) {
// console.log('... label match found.');
                            dfd.resolve();
                        } else {
// console.log('... label match not found.');
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
         * @function serviceStack
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
            var stack = [ 'sessionAuth', 'initUser', 'initSession', 'noTimestamp', 'hasPermission' ];

            for (var i = policies.length - 1; i >= 0; i--) {
                stack.push(policies[i]);
            };

            return  stack;
        }
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
         * @return {deferred} ready resolves once the User object is fully ready.
         */
        init:function(req, data) {
            var user = new User(data)
            req.session.appdev.actualUser = user;
            req.session.appdev.user = user;
            
            // Do it again after async operations complete.
            user.ready().done(function(){
                req.session.appdev.actualUser = user;
                req.session.appdev.user = user;
            });

            return user.ready();
        },


        /**
         * @function refreshSession
         *
         * mark a given user's guid as needing to refresh it's session data.
         * 
         * @param {string} guid  The GUID of the user account to refresh
         */
        refreshSession: function(guid) {

            if ( guid != "*" ) {
// AD.log('... refreshSession() guid:'+guid);
                userSessionStatusRefresh[guid] = true;
            } else {
// AD.log('... refreshSession() '+guid);
                for (var g in userSessionStatusRefresh) {
                    userSessionStatusRefresh[g] = true;
                }
                
            }
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
 *
 */
var User = function (opts) {
    this.data = opts || {};
    var self = this;
    
    // This deferred will resolve when the object has finished initializing
    // to/from the DB.
    self.dfdReady = AD.sal.Deferred();

    // Internal reference to the DB model
    this.user = null;
    
    // Initialization may be done from session stored data. In which case
    // the data is already loaded and we won't need to do a find().
    var shouldFind = false;
    if ((!this.data.isLoaded) 
        || ( userSessionStatusRefresh[this.data.guid] )) {

        // Typically you would init by guid, username, or username+password.
        // We will allow init by other combinations of those fields. There is no 
        // legitimate use for those but it is safe when done server side.
        var findOpts = {};
        [ 'username', 'guid', 'password' ].forEach(function(k) {
            if (opts[k]) {
                findOpts[k] = opts[k];
                shouldFind = true;
            }
        });
    }
    
    if (shouldFind) {
        SiteUser.hashedFind(findOpts)
        .populate('permission')
        .then(function(list){
            if (list[0]) {
// AD.log('... User() .hashedFind():', list[0]);
                // User found in the DB
                self.user = list[0];
                self.data.guid = self.user.guid;
                self.data.languageCode = self.user.languageCode;
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
                    self.dfdReady.resolve();
                })

                
                // Update username / language, and freshen timestamp.
                // Don't really care when it finishes.
                var username = opts.username || list[0].username;
                var languageCode = opts.languageCode || list[0].languageCode;
                SiteUser.update(
                    { id: list[0].id }, 
                    { 
                        username: username,
                        languageCode: languageCode
                    }
                )
                .then(function(){});
            }
            else {

                opts.languageCode = opts.languageCode || Multilingual.languages.default();

                // User not in the DB. Insert now.
                SiteUser.create(opts)
                .then(function(user){
                    self.user = user;
                    self.data.guid = user.guid;
                    self.data.isLoaded = true;
                    self.data.permissions = null;
                    userSessionStatusRefresh[self.data.guid] = false;
                    self.dfdReady.resolve();
                })
                .fail(function(err){
                    console.log('User create failed:', opts, err);
                    self.dfdReady.reject(err);
                })
                .done();
            }
        })
        .fail(function(err){
            console.log('User init failed:', findOpts, err);
            self.dfdReady.reject();
        })
        .done();
    }
    else {
// AD.log('<yellow>|||||||||||||||||||  not looking up user ||||||||||||||||||||||</yellow>');
// AD.log('... data:', this.data);
        self.dfdReady.resolve();
    }
    
};


User.prototype.ready = function() {
    return this.dfdReady;
}



User.prototype.getLanguageCode = function() {
    return this.data.languageCode || Multilingual.languages.default();
};



User.prototype.hasPermission = function(key) {

    if ((this.data.permissions)
        && (this.data.permissions[key])) {
        // AD.log('<green>... User.hasPermission('+key+') = true </green>');
        return true;
    }

    // AD.log('<yellow>... User.hasPermission('+key+') = false </yellow>');
    return false;
};



User.prototype._computePermissions = function() {
    var _this = this;

    var dfd = AD.sal.Deferred();

// AD.log('<green>... computing Permissions() : ['+this.data.guid+']</green>');

    var listPermissions = null;
    var hashRoles = null;
    var hashPerm = null;


if (_this.user == null) {
    AD.log.error('*******************************************************************');
    console.trace('.... WHY IS USER NULL???? ');
    AD.log('... data:', _this.data);
//// todo: probably because User was initialized with data.isLoaded == true ... when does that happen?
}

    async.series([

        // step 1) load permissions with populated scopes
        function(next){

            Permission.find({user: _this.user.id, enabled:true })
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
            })

// AD.log('... hashPerm:', hashPerm);
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
// console.log('f=['+f+']');
                if ( !_.contains(ignoreFields, f)) {
// console.log('... assigning!');
                    opt.model[f] = trans[f];
                }
            });
            
        }
    });

    return found;
    
}



