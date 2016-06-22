/**
 * @class  Permissions.action
 * @parent Permissions
 * 
 * a set of utilities for exposing the PermissionAction Model to external 
 * applications.
 * 
 * 
 * ## Usage
 *
 */



var AD = require('ad-utils');
var _ = require('lodash');

var PERMISSION_TRANSLATION_DONE = 'permissions.action.translation.done';


module.exports = {

    exists:function(key, cb) {
        var dfd = AD.sal.Deferred();
        
        PermissionAction.findOne({action_key:key})
        .then(function(action){
            var isThere = false;
            if (action) {
                isThere = true;
            }
            if (cb) cb(null, isThere);
            dfd.resolve(isThere);
            return null;
        })
        .catch(function(err){
            if (cb) cb(err);
            dfd.reject(err);
            return null;
        })

        return dfd;
    },



    /*
     * Permissions.action.create()
     *
     * create a new action permission in the system.
     * 
     * @parm {json} obj
     *          obj.key {string}  the unique action key: "site.permisison.create"
     *          obj.description {string} the description of this permission: "allows user to create a permission"
     *          obj.language_code {string} the i18n language code of this description.
     * @param {fn} cb   (optional) callback for this function.  
     *                  follows common nodeJS convention:  cb(err, data)
     * @return {Deferred}
     */
    create:function(obj, cb) {
        var dfd = AD.sal.Deferred();

        var hasFired = false;

        function badData (err) {
            if (!hasFired) {
                if (cb) cb(err);
                dfd.reject(err);
                hasFired = true;
            }
        }

        var requiredFields = ['key', 'description', 'language_code'];
        requiredFields.forEach(function(field){
            if (!obj[field]) {
                badData( new Error('['+field+'] is required') );
            }
        })

        if (!hasFired) {

            Permissions.action.exists(obj.key)
            .then(function(isThere){

                if (isThere) {

                    // key is not unique!
                    badData( new Error('[key] must be a unique value. ['+obj.key+'] already exists'));

                } else {

                    // we need to create the entry:
                    var data = {
                        action_key:obj.key,
                        action_description: obj.description,
                        language_code: obj.language_code
                    }
                    Multilingual.model.create({
                        model:PermissionAction,
                        data:data
//// TODO: add a transRequest:  param that holds the translation data to publish for this model:
                    })
                    .fail(function(err){
                        badData(err);
                    })
                    .then(function(action){

                        // post the translation request
                        _PostTranslationRequest({ 
                            action:action, 
                            fromLanguage:obj.language_code 
                        });

//// Question: do we return a fully populated PermissionAction as a result?

                        if (cb) cb(null, action);
                        dfd.resolve(action);
                    });

                }

            })
            .fail(function(err){
                badData(err);
            })
        }

        return dfd;
    },



    find:function(filter, cb) {

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


};


function _PostTranslationRequest( options) {

    var object = options.action;


console.log('... _PostTranslationRequest: action:', object);
    var action = null;
    var allLanguages = {};
    var fields = {};
    var labels = {};
    var fieldNames = ['action_description'];
    var fieldsToLabelKeys = { 'action_description':'permission.action.description' };

    async.series([


        // make sure we have a full action object:
        function(done) {
            if ((object.translations) && (object.translations.length > 0)) {
                action = object.
                done();
            } else {

                PermissionAction.findOne(object.id)
                .populate('translations')
                .then(function(a){
                    if (a) {
                        action = a;
// console.log('... new action:', action);
                        done();
                    } else {
                        var err = new Error('Cant find PermissionAction.id='+object.id);
                        done(err);
                    }
                    return null;
                })
                .catch(function(err){
                    done(err);
                    return null;
                })

            }
        },


        // compile fields
        function(done) {
            /*
                {
                    "caption": {
                        "languageCode": "translation",
                        "en": "my english translation 1",
                        "ko": "[ko]my english translation 1",
                        "zh-hans": "[zh-hans]my english translation 1",
                        "th": "[th]my english translation 1"
                    },
                    "description": {
                        "languageCode": "translation",
                        "en": "my english translation 1",
                        "ko": "[ko]my english translation 1",
                        "zh-hans": "[zh-hans]my english translation 1",
                        "th": "[th]my english translation 1"
                    }
                }
            */

            fieldNames.forEach(function(key) {
                fields[key] = {};
                action.translations.forEach(function(trans){
                    fields[key][trans.language_code] = trans[key];
                })
            })

// AD.log('... fields:', fields);
            done();
        },


        // compile labels
        function(done) {


            var numDone = 0;
            fieldNames.forEach(function(key){
                labels[key] = {};
                var cond = {label_key:fieldsToLabelKeys[key], label_context:'appdev' };
                SiteMultilingualLabel.find(cond)
                .then(function(list){
                    list.forEach(function(label){
                        labels[key][label.language_code] = label.label_label
                    })

                    numDone ++;
                    if (numDone >= fieldNames.length) {
                        done();
                    }
                    return null;
                })
                // .catch(function(err){

                //     ADCore.error.log('Failed to lookup SiteMultilingualLabels', { error: err, cond:cond });
                //     done(err);
                // })
            })

        },



        // get all the Languages in the system:
        function(done){

            Multilingual.languages.hash()
            .then(function(hash){

                allLanguages = hash;
                done();
            })
            .fail(function(err){
                ADCore.error.log('Error looking up Multilingual.languages.hash():',{ error: err });
                done(err);
            })
        }


    ], function(err, results) {



        //// TODO: register a translation request for new Action descriptions
        var request = {
            actionKey:'site.permission.action.translate',   // user has to have this action key
            userID:'*',                                     // not tied to a specific user who created the entry
            callback:PERMISSION_TRANSLATION_DONE,           // the event to trigger when translation is done
            reference:{ id:action.id },                     // likewise, don't need to provide a reference

            model:'permissionactiontrans',                  // the multilingual model!  (not the base model)
            modelCond:{ permissionaction:action.id },                     // the id of the instance we are translating

            "menu": {
                "icon": 'fa-lock',
                "action": {
                    "key": 'permission.new.action',
                    "context": "appdev"
                },
                "fromLanguage": allLanguages[options.fromLanguage],
                'itemName': action.action_key,
                "createdBy": 'system',
                "date": AD.util.moment(new Date()).format('L')
            },

            "form": {
                "data": {
                    "fields": fields,
                    "labels": labels,
                    "optionalInfo": ''
                },
                "view": ''
            }

        //// still gotta do the menu and form data:
        // icon: fa-lock

        //// also, update the translation tool if I leave out userID: then auto add a "*"
        //// Permissions.limitRouteToUserActionScope() should also take a 'catchAll' param that gets added :  eg our '*' 
        //// and translation/config/policies.js should add a catchAll:'*' param.
        };


        action.translations.forEach(function(trans){
// AD.log('... trans:', trans);
// AD.log('... sourceLang:'+sourceLang+ '  language_code:'+trans.language_code);

            // if not sourceLang
            if (trans.language_code != options.fromLanguage) {
// AD.log('    ---> generating request!');
                // generate a request for this as toLanguage
                var currReq = _.cloneDeep(request);
                currReq.toLanguageCode = trans.language_code;
                currReq.menu.toLanguage = allLanguages[trans.language_code]

// console.log('... Translation Request:', currReq);
                ADCore.queue.publish('opsportal.translation.create', currReq);
                
            } // end if

        }) // next

// console.log('... .publish():', request);
        // ADCore.queue.publish('opsportal.translation.create', request);

    });
}
