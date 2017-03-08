/**
 * PermissionScopeObjectController
 *
 * @description :: Server-side logic for managing Permissionscopeobjects
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('lodash');

module.exports = {

    _config: {
        model: "permissionscopeobject", // all lowercase model name
        actions: false,
        shortcuts: false,
        rest: true
    },

    // this method is used in unit tests to test if your 
    // actions are enabled or not.
    _unitTestAccessActions: function(req, res) {
    	res.AD.success();
    },


    // get /site/permission/scopeobject/:id/definition
    // requires: adcore.admin or adcore.developer
    //
    // returns the attributes of a scopeobject to help the UI craft a filter 
    // using this object.
    getscopedefinition: function(req, res) {

// res.AD.success({
//                         "id": 1,            // the PermissionScopeObject.id
//                         "name":"SiteUser",  // the current language name of the object
//                         "keyModel": "siteuser",
//                         "translations": {   // any translation fields
//                             "name": {'type':'string'}, 
//                             "language_code":{'type':'string'}
//                         },

//                         "attributes":{      // list of attributes:
//                             // matching attributes here:
//                             // field:'type',
//                             // field: { collection:'model', via:'fieldName' },
//                             // field: { model:'model' }
//                             'keyModel': { 'type':'string' },
//                             'id' : {'type':'integer'},
//                             'createdAt' : { 'type': 'datetime' },
//                             'updatedAt' : { 'type': 'datetime' }
// // , 'password' : {'type':'string'}
// // , 'salt' : { 'type':'string'}
//                         }
// });

        var response = {};

        // get id
        var id = req.param('id');
        var language_code = req.param('language_code') || req.AD.user().getLanguageCode();
        var scopeObject = null;

        async.series([

            // lookup PermissionScopeObject
            function(next) {

                PermissionScopeObject.findOne({id:id})
                .populate('translations')
                .then(function(sObj){

                    if (sObj) {
                        scopeObject = sObj;
                        next();
                    } else {

                        // invalid id: not found:
                        // returns an error if invalid url id:
                        var err = ADCore.error.fromKey('E_NOTFOUND');
                        err.httpStatus = 404;
                        next(err);
                    }
                    return null;
                })
                .catch(function(err){
                    ADCore.error.log('Error trying to lookup PermissionScopeObject', { id:id, error:err });
                    next(err);
                })
            },


            // compile base attributes
            function(next) {
                response.id = id;
                response.keyModel = scopeObject.keyModel;

                // place holder if we don't find request language code
                response.name = scopeObject.keyModel; 

                // lookup up language translation for this object
                scopeObject.translations.forEach(function(t){
                    if (t.language_code == language_code) {
                        response.name = t.name;
                    }
                })


                var sailsModel = sails.models[scopeObject.keyModel]
                if (sailsModel) {

                    response.attributes = _.clone(sailsModel.attributes);

                    // remove any functions():
                    _.functions(response.attributes).forEach(function(key){
                        delete response.attributes[key]; 
                    })
                    
                    next();
                } else {

                    // invalid keyModel: not found:
                    var err = ADCore.error.fromKey('E_NOTFOUND');
                    err.httpStatus = 500;
                    ADCore.error.log('PermissionScopeObjectController.getscopedefinition(): registered ScopeObject not found!', {
                        error:err,
                        keyModel:scopeObject.keyModel
                    });
                    next(err);

                }

            },

            // convert to tranlations if multilingual
            function(next) {

                // skip if no translations
                if (!response.attributes.translations) {
                    next();
                } else {

                    // new .translation definition
                    var transDefinition = {};

                    // ignore these fields:
                    var ignoreTheseFields = ['id', 'createdAt', 'updatedAt']
                    ignoreTheseFields.push(response.attributes.translations.via);

                    // find the translation object and copy over the remaining fields:
                    var tObj = sails.models[response.attributes.translations.collection];
                    if (tObj) {
                        _.keys(tObj.attributes).forEach(function(key){
                            if (ignoreTheseFields.indexOf(key) == -1) {
                                transDefinition[key] = tObj.attributes[key];
                            }
                        });
                        response.translations = transDefinition;

                        // remove the translations in the .attributes
                        delete response.attributes.translations;

                        next();

                    } else {
                        // why can't I find the translation object?
                        var err = ADCore.error.fromKey('E_NOTFOUND');
                        err.httpStatus = 500;
                        ADCore.error.log('PermissionScopeObjectController.getscopedefinition(): translation object not found', {
                            error:err,
                            keyModel:scopeObject.keyModel,
                            translation:response.attributes.translations
                        });
                        next(err);
                    }
                }
            },


            // if siteuser object, then remove protected fields
            function(next) {
                if ('siteuser' == scopeObject.keyModel) {
                    
                    delete response.attributes.password;
                    delete response.attributes.salt;
                    
                }
                next();
            }

        ],function(err, data){

            if (err) {
                res.AD.error(err, err.httpStatus || 400);
                return;
            }

            res.AD.success(response);
        })


    }
	
};

