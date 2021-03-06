/**
* PermissionAction.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    // connection:"appdev_default",
 
    tableName:"site_perm_actions",
    // migrate:'safe',  // don't update the tables!
migrate:'alter',  // modify the tables


    attributes: {

        action_key : { 
            type: 'string', 
            required:true, 
            unique:true 
        },

        roles:{
            collection:'PermissionRole',
            via:'actions'
        },

        // OPConfigTools can have many actions required
        // and PermissionActions can be in many Tools.
        tools:{
            collection:'OPConfigTool',
            via:'permissions'
        }
        
        
        //// 
        //// AppDev Multilingual Extensions:
        ////

        // @hasMany PermissionActionTrans relationship
        // this will pull in the translations using: 
        //      PermissionAction.find().populate('translations')
        ,translations:{
            collection:'PermissionActionTrans',
            via:'permissionaction'
        },


        // .translate( langCode ) can translate an instance of PermissionAction  
        //                        with the proper labels.
        translate:function(code) {
            return ADCore.model.translate({
                model:this,         // this instance of a Model
                code:code,          // the language code of the translation to use.
                ignore:['permissionaction']     // don't include this field when translating
            });
        },


        // enable the instance of a model to return the Model Class Object.
        _Klass: function() {
            return PermissionAction;
        }

    },

    afterCreate: function(record, cb) {
        if (OPSPortal) ADCore.queue.publish(OPSPortal.Events.PERM_STALE, {action:record, verb:'created' });
        cb();
    },

    afterUpdate: function(record, cb) {
        if (OPSPortal) ADCore.queue.publish(OPSPortal.Events.PERM_STALE, {action:record, verb:'updated'});
        cb();
    },

    afterDestroy: function(record, cb) {
        if (OPSPortal) ADCore.queue.publish(OPSPortal.Events.PERM_STALE, {action:record, verb:'destroyed'});
        cb();
    }
};

