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



    /*
     * Permissions.action.destroyKeys()
     *
     * remove a set of keys based upon the provided action key references.
     * 
     * @parm {array} keys  an array of action keys to destroy.
     * @param {fn} cb   (optional) callback for this function.  
     *                  follows common nodeJS convention:  cb(err, data)
     * @return {Deferred}
     */
    destroyKeys:function(keys, cb) {
        var dfd = AD.sal.Deferred();

        keys = keys || [];

        PermissionAction.destroy({ action_key: keys })
        .exec(function(err, data){
            if (err) {
                if (cb) cb(err);
                dfd.reject(err);
            } else {
                if (cb) cb(null, data);
                dfd.resolve(data);
            }
        });

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
