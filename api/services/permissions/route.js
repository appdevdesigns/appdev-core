/**
 * @class  Permissions.route
 * @parent Permissions
 * 
 * a set of utilities for exposing the Permission Route methods to external 
 * modules.
 * 
 * 
 * ## Usage
 *
 */


var AD = require('ad-utils');
var _ = require('lodash');


var registeredRoutes = {
    // routeKey : { actions:[ actionKey1, [actionKey2, actionKey3], ... ], object:'objectKey' }
};


module.exports = {

   
    /**
     * @function Permission.route.hasPermission
     *
     * this routine checks if the current route/path requries a permission and 
     * that the current User has this permission.
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
    hasPermission: function(req, res, next) {

//// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
////       when implemented.

// AD.log('... route.hasPermission()');

        // create a reqPath to test against
        //  or can do:  var reqPath = req.route.method+' '+req.route.path;
        var reqPath = req.method + ' ' + req.url;
        reqPath = reqPath.toLowerCase();    // lowercase it all
        // AD.log('<green>.... reqPath['+reqPath+']</green>');


        var user = ADCore.user.current(req);


        // prepare a callback routine to determine if the user has all the 
        // listed permissions. 
        var hasAll = function( list) {

            if (list.length > 0) {

                var perm = list.shift();

                // '*'  : means anyone can access.  Some routes are open to anyone.
                if ((perm == '*') || (user.hasPermission( perm ))) {
                    return hasAll( list );
                } else {
                    return false;
                }

            } else {
                return true;
            }
        }


        // look for a matching route in our registeredRoutes
        for (var p in registeredRoutes) {
            if ( reqPath.indexOf(p) != -1) {
// console.log('.... permission:', registeredRoutes[p]);
                var permissions = registeredRoutes[p].action;
                for (var i = permissions.length - 1; i >= 0; i--) {
                    
                    var perm = permissions[i]
                
                    // make sure entry is an [] 
                    if (! _.isArray(perm)) perm = [perm];

                    // if user has all these permissions then continue!
                    if (hasAll(perm)) {
                        AD.log('<green>.... reqPath['+reqPath+']  -> user['+user.GUID()+'] had permission: </green><yellow><bold>'+ perm.join(', ') + '</bold></yellow>');
                        next();
                        return;
                    }
                };


                // if we got here, then we did not pass any permission checks
                AD.log('<red>.... reqPath['+reqPath+']  -> user[</red><yellow>'+user.GUID()+'</yellow><red>] did not have any of the required permissions '+ permissions.join(', ') + '</red>');
                
                
                res.AD.error(ADCore.error.fromKey('E_NOTPERMITTED'), 403);
                return;
            }
        }

        
        // if we got here, we did not find any permissions requried for this route. 
        // so continue.
        // AD.log('<yellow>    -> no permissions registered for this reqPath</yellow>');
        next();
    },



    /**
     * @function Permission.route.limitToActionScope()
     *
     * Use this method to limit the current RESTful resource/ blueprint route 
     * to only return values that match a user's set of Action+Scope 
     * combinations.
     *
     * Given an actionKey and a scopeObject, this method will compile the user's
     * scope definition for the scope object, and come up with a filter for that
     * object.
     * 
     * If the resource being returned is the same as the scope object, then 
     * this filter will be added to the .where condition for this request.
     *
     * If the resource is different, then this filter will be resolved and a 
     * limiting condition based upon the gathered values will be added to the 
     * request.
     *
     *
     * @param {obj} req     The Sails request object
     * @param {obj} res     The Sails response object
     * @param {fn}  next    The Sails/express callback fn
     * @param {obj} options The options for this specific route definitions.
     *
     *          options.actionKey {string}   the Permission action key to base
     *                                       our scope upon
     *                                       eg: 'adcore.admin'
     *
     *
     *          options.object {object}  the definition of the scope object to 
     *                                   build the limit on.
     *                  object.key     {string} the sails.models[key] for this object.
     *                                          Should match PermissionScopeObject.keyModel
     *                                          eg. 'siteuser'
     *                  object.field   {string} the 'foreign key' of the resource.field
     *                                          eg. 'id'
     *
     *
     *          options.resource {object}  (optional) The definition of the object
     *                                     being returned from this service. If this
     *                                     is not the same as .object then we need
     *                                     to indicate how to relate the scoped object
     *                                     data to limit this data.
     *                  resource.field {string} the field in resource that points to 
     *                                          the fk in object
     *                                          resource[resource.field] = object[object.field]
     *                                          eg: 'userID'
     *                                          eg: resource.userID = object.id
     *
     *
     *          options.error     {obj}      An object representing the error information 
     *                                       to return if the user is not permitted.
     */
    limitToActionScope:function(req, res, next, options) {

        // make sure options isn't undefined:
        options = options || {};

        // make sure options have some default settings:
        options = _.merge({
            actionKey:'no.action.key.specified',
            object:'not.provided',
            error:{ code: 403, message:'Not Permitted.' }
        }, options);

// console.log();
// console.log('... Permission.route.limitToActionScope()');
// console.log('*** options:', options);

// TODO: verify actionKey is proper 

        var scopeList = null;  // list of [{scope}, {scope},... ]
        var scopeFilter = null;  // final { or:[] } of our scopeList
        async.series([

            // get list of [ {scope}, {scope}, ... ] from user + actionKey + object.key
            function(ok) {
// console.log('... get list of [scope, scope] from user');
                var User = req.AD.user();
                User.ready()
                .fail(function(err){
                    ok(err);
                })
                .then(function(){
// console.log('... calling User.scopesForActionObject():');
                    scopeList = User.scopesForActionObject(options.actionKey, options.object.key);
// console.log('... scopeList:', scopeList);
                    ok();
                })
            },



            // compile scope.filterUI defs into sails compatible scope.filter definition
                    // Filter.queryBuilderToSailsFilter( object.attr, scope.filterUI )
            function(ok) {
// console.log('... compile scope.filterUI into sails compatible scope filter:');
                if(scopeList) {

                    var numDone = 0;
                    function onDone (err) {

                        if (err) {
                            ok(err);
                        } else {

                            numDone ++;
                            if (numDone >= scopeList.length) {
// console.log('... scopeList 2:', scopeList);
// scopeList.forEach(function(s){
//     console.log(s.filter);
// })
                                ok();
                            }
                        }
                    }


                    var hasError = false;
                    scopeList.forEach(function(s){

                        if (!hasError) {
                            var Model = sails.models[s.object.keyModel]
                            if (Model) {
// console.log('... calling Filter.queryBuilderToSailsFilter():');
                                // update current scope.filter to sails compatible filter:
                                Filter.queryBuilderToSailsFilter(Model.attributes, s.filterUI, function(err, filter){
                                    if (err) {
                                        onDone(err);
                                    } else {
                                        s.filter = filter;
                                        onDone();
                                    }
                                });
                            
                            } else {

                                hasError = true;
                                var error = new Error('Unknown Model ['+s.object.keyModel+']');
                                onDone(error);
                            }
                        }
                        
                    })


                    

                } else {

// TODO: Question: is this an error if there are no scopes to compile?
                    ok();
                }

            },

            // combine into scopeFilter: { 'or':[scope.filter, scope.filter ]}
            function(ok) {
// console.log('... combining into scopeFilter');

                var rules = [];
                scopeList.forEach(function(s){
                    rules.push(s.filter);
                })
                scopeFilter = { or: rules };
// console.log('... scopeFilter:', scopeFilter);

                ok();
            },

            // if separate resource and scope object, then reduce to [ obj.field ]
            function(ok) {
// console.log('... if separate resource and scope object:');
                // if (object != resource) 
                if ( (options.resource) 
                    && (options.resource.field) 
                    && (options.object.field)) {

                    // find all objects using scopeFilter
                    var Model = sails.models[options.object.key];
                    if (Model) {


                        Model.find(scopeFilter)
                        .exec(function(err, models) {

                            if (err) {
                                ADCore.error.log("unable to lookup Model using filter", {error: err, model:Model.attributes, filter: scopeFilter});
                                ok(err);
                            } else {

                                // reduce scopeFilter to: { resource.field: [ results[object.field] ]}
                                scopeFilter = {};
                                scopeFilter[options.resource.field] = _.map(models, options.object.field );
// console.log('.... scopeFilter reduced:', scopeFilter);
                                ok();
                            }
                            
                        })
                        
                    } else {

                        // couldn't find Model, Why!?
                        var error = new Error('unknown model: ['+ options.object.key+']');
                        ok(error);
                    }
                    

                } else {

                    // nothing to do if the object == resource
                    ok();
                }
            },



            // at this point, we should have a scopeFilter that is a condition
            // for the current resource.
            //
            // Now either modify the current request (find()) or evaluate it to
            // make sure they are able to perform the operation.
            function(ok) {


                // first: translate the current scopeFilter into a list of resource
                //        entries that CAN be accessed.
                var validIDs = [];
                var resourceModelKey = req.options.model || req.options.controller;
                if (!resourceModelKey) {
                    var error = new Error(util.format('No "model" specified in route options.'));
                    ok(error);
                    return;
                }

                var ResourceModel = req._sails.models[resourceModelKey];
                if ( !ResourceModel ) {
                    var error = new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`',resourceModelKey));
                    ok(error);
                    return;
                }

                var pkField = 'id';
// TODO: get primaryKey field from ResourceModel.attributes
// console.log('... ResourceModel.attributes:', ResourceModel.attributes);
// console.log('... scopeList again:', scopeFilter);

                ResourceModel.find(scopeFilter)
                .catch(function(err){
                    ok(err);
                })
                .done(function(list){

// console.log('... listResources:', list);

                    validIDs = _.map(list, pkField);

// console.log('... validIDs:', validIDs);

                    // if request had given the primaryKey/ID: (findOne, update, destroy )
                    // look for a primaryKey value:
                    var id = req.param('id') || req.param(pkField);
                    if ((req.options.action == 'findOne')
                        || (id)) {

                        var pID  = _.parseInt(id);

                        // if it looks like we should be comparing numbers:
                        if (!_.isNaN(pID)) {

                            // make sure we treat it as a number
                            id = pID;
                        }

// console.log('... id:', id);

                        // if it is in the list of validIDs
                        if (validIDs.indexOf(id) != -1) {

// console.log('... validID found!');
                            // ok, this one is permitted, so continue:
                            ok();

                        } else {
// console.log('... no validID found.');

                            // can't ask for this one!
                            var ourError = new Error( options.error.message );
                            res.AD.error(ourError, options.error.code);
                            // res.forbidden();
                        }


                    } else { // else  (findAll() ) 


                        // add primaryKey : validIDs to current condition

// console.log('... updating condition.');

                        if (validIDs.length > 0) {

                            /// Option 1: if waterline-sequel accepts AND fix:
                            // add to the query a condition for userID to be in our validIDs:
                            req.options.where = req.options.where || {};

                            var cond = {};
                            cond[pkField] = validIDs;

                            if (!req.options.where.and) {
                                req.options.where.and = [];
                            }
                            req.options.where.and.push(cond);


                            //// Option B: manually compile an 'and' solution!
                            //// *could get pretty complicated!*
                            // var allParams = req.params.all();

                            // // add to the query a condition for userID to be in our validIDs:
                            // req.options.where = req.options.where || {};
                            // // req.options.where[pkField] =  validIDs; // bad!  id:XXX switches us to findOne()
                            // _.assign(req.options.where, scopeFilter);

                            // req.query[pkField] = validIDs;
// console.log('... options:', req.query);


                            ok();

                        } else {

                            // in this case, we are requesting a find, but have no 
                            // valid entries we can return.  So just return an []:

                            res.ok([]);

                        }


                        /// otherwise: figure out how to manually merge scopeFilter 
                        /// into where clause:



                        
                    }
                })





/*
///// 
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
                        ok();
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
                                ok();

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

                            ok(err);
                        })

                    } else {

    // console.log('... updating condition.');
                        // add to the query a condition for userID to be in our validIDs:
                        req.options.where = req.options.where || {};
                        req.options.where[options.field] =  validIDs;
    // console.log('... options:', req.options);
                        ok();

                    }

                }
*/

            }

            


        ], function(err, results){

            // return   
            if (err) {
                next(err);
            } else {


                // // add scopeFilter to req.where condition.
                // req.options.where = req.options.where || {};
                // if (scopeFilter.or) {
                //     req.options.where['or'] =  scopeFilter.or;
                // } else {

                //     _.assign(req.options.where, scopeFilter);
                //     // req.options.where['or'] = [ scopeFilter ];
                // }
                
// sails.___req = req;       
// console.log('... req.where:', req.options.where);

                next();
            }
        })

        


    },



    /**
     * @function Permissions.route.registerDefinition()
     *
     * Use this to register a route string with a set of required permissions.
     *
     * Expected to be performed upon boostrap to register any route permissions
     * for an application.
     *
     *
     *
     * Route:
     * ------------
     * routes can be defined as a string that will be matched against an incoming 
     * method + url.
     *
     * if you want to make sure that a 'get' operation on the '/adcore/siteuser'
     * is checked for a permission, then define the route as:
     *      'get /adcore/siteuser'
     *
     * if you want to make sure that all operations on the /adcore/siteuser is 
     * checked, then :
     *      '/adcore/siteuser'
     *
     * if you want to make sure all requests to any /adcore/* resource is checked
     * then:
     *      '/adcore'
     *
     *
     *
     * Permissions:
     * ------------
     * permissions are defined as a combination of actions and objects.
     *
     * format: { action:[], object:'objectKey' }
     * 
     * - (requried) Actions:
     * if you want to designate that the '/adcore' route must have the 'adcore.admin'
     * action permission, then you can pass in:
     *      [ 'adcore.admin' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  'adcore.developer' then:
     *      [ 'adcore.admin', 'adcore.developer' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  ('adcore.developer' AND 'adcore.nice.guy')
     *      [ 'adcore.admin', [ 'adcore.developer', 'adcore.nice.guy'] ]
     *
     * You can pass in as many of these combinations of action keys / permissions 
     * as you wish.
     *
     *
     * - (optional) Object
     * if a route is providing a given object resource to the requestor, you specify
     * that object key here.  
     *
     * By specifying an object, you allow the system to limit the data being returned
     * according to the user's assigned SCOPEs that relate to this (action key + object)
     * definition.
     *
     * The key is the unique key used by Sails to reference the model:
     *      sails.models[key]
     *
     * It is usually the Model Name in all lowercase():
     *      SiteUser  =>  'siteuser'
     *
     *
     * Examples:
     * - if you want to allow access to everyone for a route, with no data limiting:
     *   {
     *      action:['*']
     *   }
     *   (of course, this is the same as not specifying a route definition in the first place.)
     *
     * - if you want to allow access to everyone for a route, but limit the data according
     *   to the user's scope definitions for the 'siteuser' object.
     *   {
     *      action:['*'],
     *      object:'siteuser'
     *   }
     *
     * - if you want to allow access to only people who have been assigned 'adcore.admin' 
     *   and limit the data to their 'siteuser' scopes:
     *   {
     *      action:['adcore.admin'],
     *      object:'siteuser'
     *   }
     *
     *
     * @param {string} route  the string describing a route to watch
     * @param {array}  perm   An array of actionsKeys required to access this 
     *                        route.
     */
    registerDefinition: function( route, perm ) {

        AD.log('<green>route::::</green> '+ route+' registered');

//// TODO:
// if perm is not in proper format: { action:[], object:{} }
// then reformat & dump console error to alert Developer to update definition.
//
        // old perm definition:  [ 'actionKey', ... ]
        if (_.isArray(perm)) {
            AD.log('<yellow>Outdated route permission definition:</yellow> route:['+route+']');
            perm = {
                action:perm
            }
        }

        registeredRoutes[ route.toLowerCase() ] = perm;

    },



};


function _PostTranslationRequest( options) {

    var object = options.action;


    ADCore.queue.publish('opsportal.translation.multilingual.create', {

            actionKey:'site.permission.action.translate',   // user has to have this action key
            userID:'*',                                     // not tied to a specific user who created the entry
            callback:PERMISSION_TRANSLATION_DONE,           // the event to trigger when translation is done
            // reference:{ id:object.id },                    // (optional) likewise, don't need to provide a reference

            //// MENU options:
            // icon:'fa-lock',                                 // (optional) 
            menuKey:'permission.new.action',                // the multilingual text.key for this object
            menuContext: 'appdev',                          // the multilingual context for the actionKey label
            // itemName:object.action_key,                     // (optional) itemName printed directly
            // createdBy: 'system',                            // (optional) who is it by?
            // date: AD.util.moment(new Date()).format('L'),   // (optional) what date reference to use

            //// The actual model instance 
            object: object,                                 // the instance of the BASE model (not TRANS)
            fromLanguage: options.fromLanguage,             // which lang was the original

            fieldsToLabelKeys: { 'action_description':'permission.action.description' },
            labelContext: 'appdev'
    });

}
