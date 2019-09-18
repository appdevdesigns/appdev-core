/**
 * Permissions
 *
 * @module      :: Service
 * @description :: This is a collection of Permission routines for our applications.
 *
 */
var AD = require('ad-utils');
var _ = require('lodash');

var registeredRoutes = {
    // routeKey : [ actionKey1, [actionKey2, actionKey3], ... ]
};


var path = require('path');
var Action = require(path.join(__dirname, 'permissions', 'action.js'));
var Route = require(path.join(__dirname, 'permissions', 'route.js'));

module.exports = {

    // This function is still being called from ad-util/lib/module.js
    // So provide a dummy to prevent sails crashing.
    registerDefinition: function() {
        sails.log.error('Permissions.registerDefinition() was called');
        sails.log.error(new Error());
    },
    
    
    /**
     * Permissions.action
     *
     * a set of utilities for exposing the PermissionAction to external 
     * applications.
     */
    action:Action,



    /**
     * Permissions.route
     *
     * a set of utilities for exposing the Route related permission 
     * capabilities to external applications.
     */
    route:Route,


    /**
     * @function hasRoutePermission
     *
     * this routine checks the current user to see if the current route/path
     * requries a permission and that the current User has this permission.
     *
     * If a user fails the permission check, then a 403 Forbidden error is
     * returned.
     *
     * This routine is expected to be used from a policy that needs to verify
     * the user can access the current route.  
     * (see the hasPermission.js policy.)
     *
     * @param {obj} req  The node/express req object
     * @param {obj} res  The node/express res object
     * @param {fn}  next The node/express callback for this middleware step
     */
//     hasRoutePermission: function(req, res, next) {

// //// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
// ////       when implemented.


//         // create a reqPath to test against
//         //  or can do:  var reqPath = req.route.method+' '+req.route.path;
//         var reqPath = req.method + ' ' + req.url;
//         reqPath = reqPath.toLowerCase();    // lowercase it all
//         // AD.log('<green>.... reqPath['+reqPath+']</green>');


//         var user = ADCore.user.current(req);


//         // prepare a callback routine to determine if the user has all the 
//         // listed permissions. 
//         var hasAll = function( list) {

//             if (list.length > 0) {

//                 var perm = list.shift();

//                 // '*'  : means anyone can access.  Some routes are open to anyone.
//                 if ((perm == '*') || (user.hasPermission( perm ))) {
//                     return hasAll( list );
//                 } else {
//                     return false;
//                 }

//             } else {
//                 return true;
//             }
//         }


//         // look for a matching route in our registeredRoutes
//         for (var p in registeredRoutes) {
//             if ( reqPath.indexOf(p) != -1) {

//                 var permissions = registeredRoutes[p];
//                 for (var i = permissions.length - 1; i >= 0; i--) {
                    
//                     var perm = permissions[i]
                
//                     // make sure entry is an [] 
//                     if (! _.isArray(perm)) perm = [perm];

//                     // if user has all these permissions then continue!
//                     if (hasAll(perm)) {
//                         AD.log('<green>.... reqPath['+reqPath+']  -> user['+user.GUID()+'] had permission: </green><yellow><bold>'+ perm.join(', ') + '</bold></yellow>');
//                         next();
//                         return;
//                     }
//                 };


//                 // if we got here, then we did not pass any permission checks
//                 AD.log('<red>.... reqPath['+reqPath+']  -> user[</red><yellow>'+user.GUID()+'</yellow><red>] did not have any of the required permissions '+ permissions.join(', ') + '</red>');
                
                
//                 res.AD.error(ADCore.error.fromKey('E_NOTPERMITTED'), 403);
//                 return;
//             }
//         }

        
//         // if we got here, we did not find any permissions requried for this route. 
//         // so continue.
//         // AD.log('<yellow>    -> no permissions registered for this reqPath</yellow>');
//         next();
//     },



    /**
     * limitRouteToUserActionScope()
     *
     * Use this method to limit the current blueprint route to only return values
     * that match a user's  set of Action+Scope combinations.
     *
     * This is usually useful in a generic administrative tool where the resource
     * specifies both the actionKey and a user.guid/id this entry is tied to.
     *
     * This method will scan all entries of a resource to verify which resources
     * the current authenticated user is allowed to work with.
     *
     * @param {obj} req     The Sails request object
     * @param {obj} res     The Sails response object
     * @param {fn}  next    The Sails/express callback fn
     * @param {obj} options The options for this specific route definitions.
     *          options.field     {string}   the field in the resource that connects to the 
     *                                       scoped User info.
     *                                       eg: transaction.userID
     *
     *          options.userField {string}   the field in the User info that this 
     *                                       resource ties to. 
     *                                       (usually 'guid', but you might instead 
     *                                       link to 'id', or 'username')
     *                                       eg. SiteUser.guid
     *
     *          options.catchAll {string}    The user value that indicates 'any one can see'
     *                                       (some entries might not care about scope and 
     *                                        instead of a guid, they put this value, so
     *                                        as long as you had the action permission, you
     *                                        can work with this entry)
     *                                        eg: '*'  for anyone can see
     * 
     *          options.resourcePKField {string} the name of the resource's pk field
     *                                       (usually 'id', but if not, specify it here.)
     *                                       eg: transaction.id
     *
     *          options.error     {obj}      An object representing the error information 
     *                                       to return if the user is not permitted.
     */
    limitRouteToUserActionScope:function(req, res, next, options) {
console.log('... limitRouteToUserActionScope():');
var err = new Error('where am I');
console.log(Error().stack);

        // make sure options isn't undefined:
        options = options || {};

        // make sure options have some default settings:
        options = _.merge({
            field:'userID',
            userField:'guid',
            catchAll:'*',
            resourcePKField:'id',
            error:{ code: 403, message:'Not Permitted.' }
        }, options);


        var allActionKeys = null;
        var conditions = [];
        var validRequestIDs = null;

        async.series([


            // step 1: get all action keys this user has permission for
            function(done) {

                Permissions.actionsForUser(req)
                .fail(function(err){
                    done(err);
                })
                .then(function(keys){
                    allActionKeys = keys;
                    done();
                })
            },



            // step 2: compile action keys into a condition: actionKey: [ user.guids ]
            function(done) {

                var numDone = 0;
                allActionKeys.forEach(function(key){

                    Permissions.scopeUsersForAction(req, key)
                    .fail(function(err){
                        done(err);
                    })
                    .then(function(userList){

                        // push a new condition: { actionKey:key,  userID:[ guid1, guid2, ... guidN ]}
                        // conditions.push({ actionKey:key, userID:_.map(userList, 'guid') })
                        var cond = { actionKey: key };
                        cond[options.field] = _.map(userList, options.userField);

                        // and if we have a catchAll value, then add it here:
                        if (options.catchAll) {
                            cond[options.field].push(options.catchAll);
                        }

                        conditions.push(cond);

                        numDone++;
                        if (numDone >= allActionKeys.length) {
console.log('... route limit conditions:', conditions);
                            done();
                        }

                    })

                })
            },

//// REFACTOR
// will this work if we simply add { 'or': conditions } on to all queries?
// in case when  { id:X,  { or: conditions }  } ?
/*
            // step 3: lookup a list of Approval entries that match these combinations:
            function(done){

                PARequest.find({ 'or': conditions })
                .then(function(list) {
                    validRequestIDs = _.map(list, options.resourcePKField);
console.log('... validRequestIDs:', validRequestIDs);
                    done();
                    return null;
                })
                .catch(function(err){
                    done(err);
                })
            }
*/
        ], function(err, results){

            // stop on error:
            if (err) {
                next(err);
                return;
            }



            req.options.where = req.options.where || {};
            req.options.where['or'] =  conditions;
// AD.log('... options:', req.options.where);
            next();

//// Refactoring.  Old stuff down here:
/*

            // some routes operate on a given primaryKey: findOne, update, destroy 
            // other routes operate on a condition: find

            // look for a primaryKey value:
            var pk = req.param('id');

            // if operation has a pk condition
            if (pk) {

                // convert from string(pk) to int(pk)
                var parsedPK = _.parseInt(pk);
                if (!_.isNaN(parsedPK)) {
                    pk = parsedPK;
                }


                /// Case 1:  pk is an int  ( findOne, update, destroy )


                    // if pk is in list of valid ID's allow
                    if (validRequestIDs.indexOf(pk) != -1) {

                        // they are requesting to work with an approved entry:
console.log('... requested pk['+pk+'] is APPROVED!');
                        next();
                    } else {

console.log('... non approved entry:', pk);

                        // they asked for a non approved entry:
                        var ourError = new Error( options.error.message );
                        ADCore.comm.error(res, ourError, options.error.code);
                    }


                /// else : pk is complex

                    // simply leave it and add on additional conditions:
                    // 

                


            } else {


                // they are trying to do a find operation, so let's add a condition
                // to narrow the find to only entries with our validIDs:


                req.options.where = req.options.where || {};
                req.options.where['or'] =  conditions;
console.log('... options:', req.options);
                next();
            }
*/


        })


    },



    limitRouteToScope:function(req, res, next, options) {

// console.log('... limitRouteToScope()');

        // make sure options isn't undefined:
        options = options || {};

        // make sure options have some default settings:
        options = _.merge({
            actionKey:'no.action.key.specified',
            field:'userID',
            userField:'id',
            error:{ code: 403, message:'Not Permitted.' }
        }, options);

// console.log('... options:', options);

        Permissions.scopeUsersForAction(req, options.actionKey)
        .fail(function(err){

            // if the error was the user doesn't have this permission:
            if (err.code == 'ENO_PERMISSION') {
// console.log('... ERROR: ENO_PERMISSION');
                var ourError = new Error( options.error.message );
                ourError.actionKey = options.actionKey;
                ADCore.comm.error(res, ourError, options.error.code);
                // res.forbidden();
            } else {
// console.log('... ERROR: not sure what went wrong:', err);
                // not sure what went wrong here:
                next(err);
            }
        })
        .then(function(validUsers){

            var validIDs = _.map(validUsers, options.userField);

            // was the request already specifying the specified .field?
            var allParams = req.params.all();
// console.log('... allParams:', allParams);
// console.log('... options.where:', req.options.where);
// console.log('... validIDs:', validIDs);

//// TODO: check if we need to account for a possible incoming where:{ userID:xx }  clause

            if( allParams[options.field]) {

                var parsedField  = _.parseInt(allParams[options.field]);

                // if it looks like we should be comparing numbers:
                if (!_.isNaN(parsedField)) {

                    // make sure we treat it as a number
                    allParams[options.field] = parsedField;
                }

                // if they asked for one that is already allowed
                if (validIDs.indexOf(allParams[options.field]) != -1) {
// console.log('... looks good!');
                    // let things go on:
                    next();
                } else {
// console.log('... didnt match up!');
                    // can't ask for that one!
                    var ourError = new Error( options.error.message );
                    ADCore.comm.error(res, ourError, options.error.code);
                    // res.forbidden();
                }

            } else {

                // some routes operate on a given primaryKey: findOne, update, destroy 
                // other routes operate on a condition: find

                // look for a primaryKey value:
                var pk = req.param('id');

                // if a route with a primaryKey value
                if ((req.options.action == 'findOne')
                    || (pk)) {
// console.log('... findOne()');
                    // These blueprints only looks at the specified :id value.
                    // so we need to preempt and do a find, and check if result
                    // has an validID value

                    var model = req.options.model || req.options.controller;
                    if (!model) throw new Error(util.format('No "model" specified in route options.'));

                    var Model = req._sails.models[model];
                    if ( !Model ) throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`',model));

                    Model.findOne(pk)
                    .then(function(model){
// console.log('... model:', model);
// console.log('... validIDs:', validIDs);
// console.log('... comparing model.'+options.field+':'+ model[options.field]);

                        if (validIDs.indexOf(model[options.field]) != -1) {

// console.log('... validID found!');
                            // ok, this one is permitted, so continue:
                            next();

                        } else {
// console.log('... no validID found.');

                            // can't ask for this one!
                            var ourError = new Error( options.error.message );
                            ADCore.comm.error(res, ourError, options.error.code);
                            // res.forbidden();
                        }
                        return null;
                    })
                    .catch(function(err){

                        next(err);
                    })

                } else {

// console.log('... updating condition.');
                    // add to the query a condition for userID to be in our validIDs:
                    req.options.where = req.options.where || {};
                    req.options.where[options.field] =  validIDs;
// console.log('... options:', req.options);
                    next();

                }

            }

        });

    },



    actionsForUser: function(req) {
        var dfd = AD.sal.Deferred();

        var user = ADCore.user.current(req);

        if (user) {

            // make sure the user is ready before processing:
            user.ready()
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve(_.keys(user.data.permissions));
            })

        } else {

            // no valid user was returned, which is a problem!
            // most likely the policy controlling this specific 
            // route somehow didn't include our standard serviceStack.
            ADCore.error.log("Permissions.actionsForUser() did not find a user.", {
                url:req.url,
                toTry:' check policy for route and make sure they are following our ServiceStack()'
            });

            // we are not going to break in this case, but we will
            // return NO ACTIONS for the user, so they will not
            // get very far in this process.
            dfd.resolve([]);
        }


        return dfd;
    },



    /**
     * @function Permissions.scopeUsersForAction()
     *
     * Use this to request the valid SiteUsers that the authenticated user 
     * can access for the given actionKey.
     *
     * @param {obj}    req        The request object for the current route.
     * @param {string} actionKey  which actionKey permission to compile scope
     *                            information for.
     * @return {array} returns an array of SiteUser 
     */
    scopeUsersForAction: function(req, actionKey) {
        var dfd = AD.sal.Deferred();
// console.log('... scopeUsersForAction()');
        // get user and make sure it is ready() before using it.
        var user = ADCore.user.current(req);
        user.ready()
        .fail(function(err) { 
            dfd.reject(err);
        })
        .then(function(){


            if (user.hasPermission( actionKey )) {

// TODO: actually lookup the Scope data and resolve it to a list of SiteUser accounts.

// for now: return all our site users, and any entries that look like our users in our tutorial
var tempResults = [{ id:'1', guid:'user.1' }, { id:'1', guid:'user.2' }];
tempResults.push({id:'1', guid:'nate'});  // local test case for FCFActivities.
SiteUser.find()
.exec(function(err, users){
    users.forEach(function(user){
        tempResults.push(user);
    })

    dfd.resolve(tempResults);
})



            } else {

                var err = ADCore.error.fromKey('E_NOTPERMITTED') || new Error('No Permission');
                    // var err = new Error('No Permission');
                    // err.code = 'ENO_PERMISSION';
                err.actionKey = actionKey;
                dfd.reject(err);
            }

       })

        return dfd;
    },


    

    createRole: function (name, description) {
        var dfd = AD.sal.Deferred();

        if (!name || name.length < 1) {
            var err = new Error('Role name is not defined.');
            dfd.reject(err);
        }

        Multilingual.model.create({
            model: PermissionRole,
            data: {
                role_label: name,
                role_description: description
            }
        })
            .fail(function (err) { dfd.reject(err); })
            .then(function (result) { dfd.resolve(result); });

        return dfd;
    },

    deleteRole: function (id) {
        var dfd = AD.sal.Deferred();

        PermissionRole.destroy({ id: id })
            .exec(function (err, record) {
                if (err) {
                    dfd.reject(err);
                    return;
                }

                dfd.resolve(record);
            });

        return dfd;
    },

    clearPermissionRole: function (actionKey) {
        var dfd = AD.sal.Deferred();

        async.waterfall([
            function (next) {
                PermissionAction.findOne({ action_key: actionKey })
                    .populate('roles')
                    .exec(function (err, record) {
                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, record);
                    });
            },
            function (perm_action, next) {
                perm_action.roles.forEach(function (r) {
                    perm_action.roles.remove(r.id);
                });

                perm_action.save(function (err) {
                    dfd.resolve();
                    next();
                });
            }
        ]);

        return dfd;
    },

    assignAction: function (roleId, actionKey) {
        var dfd = AD.sal.Deferred();

        async.waterfall([
            function (next) {
                PermissionRole.findOne({ id: roleId })
                    .populate('actions')
                    .exec(function (err, record) {
                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, record);
                    });
            },
            function (perm, next) {
                PermissionAction.findOne({ action_key: actionKey })
                    .exec(function (err, record) {
                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, perm, record);
                    });
            },
            function (perm, perm_action, next) {
                if (perm_action) {
                    perm.actions.add(perm_action.id);
                    perm.save(function (err) {
                        dfd.resolve();
                        next();
                    });
                } else {
                    console.log("!!! No PermissionAction found for actionKey:"+actionKey);
                    var error = new Error("No PermissionAction Found for action key: "+actionKey);
                    error.code = "E_NOACTIONKEY";
                    error.actionKey = actionKey;

                    dfd.reject(error)
                    next(error);
                }

            }
        ]);

        return dfd;
    },

    removeAction: function (roleId, actionKey) {
        var dfd = AD.sal.Deferred();

        async.waterfall([
            function (next) {
                PermissionRole.findOne({ id: roleId })
                    .populate('actions')
                    .exec(function (err, record) {
                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, record);
                    });
            },
            function (perm, next) {
                PermissionAction.findOne({ action_key: actionKey })
                    .exec(function (err, record) {
                        if (err) {
                            next(err);
                            return;
                        }

                        next(null, perm, record);
                    });
            },
            function (perm, perm_action, next) {
                if (perm_action) {

                    perm.actions.remove(perm_action.id);
                    perm.save(function (err) {
                        dfd.resolve();
                        next();
                    });
                } else {
                    console.log("!!! No PermissionAction found for actionKey:"+actionKey);
                    var error = new Error("No Action Key Found for action key: "+actionKey);
                    error.code = "E_NOACTIONKEY";
                    error.actionKey = actionKey;

                    dfd.reject(error)
                    next(error);
                }
            }
        ]);

        return dfd;
    },

    getRolesByActionKey: function (action_key) {
        var dfd = AD.sal.Deferred();
        
        PermissionAction.findOne({ action_key: action_key })
            .populate('roles')
            .exec(function(err, perm_action) {
                if (err) {
                    dfd.reject(err);
                    return;
                }

                if (perm_action && perm_action.roles)
                    dfd.resolve(perm_action.roles);
                else
                    dfd.resolve([]);
        });

        return dfd;
    },

    getUserRoles: function (req, getAll) {
        var dfd = AD.sal.Deferred(),
            user = ADCore.user.current(req),
            getPermissionInfo = function (roles) {
                var roleResults = [],
                    mapRoleTasks = [];

                roles.forEach(function (r) {
                    mapRoleTasks.push(function (cb) {
                        r.translate(user.userModel.languageCode)
                            .fail(function (error) {
                                cb(); // Ignore bad role data
                            })
                            .then(function (trans) {
                                roleResults.push({
                                    id: r.id,
                                    name: r.role_label || 'N/A'
                                });

                                cb();
                            });
                    })
                });

                async.parallel(mapRoleTasks, function (err) {
                    if (err) {
                        dfd.reject(err);
                        return;
                    }

                    _.uniqBy(roleResults, 'id');

                    dfd.resolve(roleResults);
                });
            };

        if (getAll && (user.hasPermission('adcore.admin') || user.hasPermission('adcore.developer'))) {
            PermissionRole.find({}).exec(function (err, result) {
                if (err) {
                    dfd.reject(err);
                    return;
                }

                getPermissionInfo(result);
            });
        }
        else {
            Permission.find({ user: user.userModel.id })
                .populate('role')
                .exec(function (err, result) {
                    if (err) {
                        dfd.reject(err);
                        return;
                    }
                    var roles = _.map(result, function (r) { return r.role; });
                    getPermissionInfo(roles);
                });
        }

        return dfd;
    }

};






///// 
///// HELPER FUNCTIONS
/////


/*
 * @function getTransFields
 *
 * Find the Translation fields for a given Model.
 *
 * @param {obj} Model  A Multilingual Model Object (the Data Model)
 * @return {array}  if the translation Model was found, null otherwise
 */
// var getTransFields = function(Model) {


// }


