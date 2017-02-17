/**
 * PermissionScopeObject.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName:'site_perm_scope_object',

  // connection:'appdev_default',

  attributes: {

    keyModel : { type: 'string' },


    // this will pull in the translations using .populate('translations')
    translations:{
        collection:'PermissionScopeObjectTrans',
        via:'permissionscopeobject'
    },

    translate:function(code) {
        return ADCore.model.translate({
            model:this,         // this instance of a Model
            code:code,          // the language code of the translation to use.
            ignore:['permissionscopeobject']     // don't include this field when translating
        });
    },

    _Klass: function() {
        return PermissionScopeObject;
    }
  },


  afterDestroy: function(record, cb) {

    Multilingual.model.removeTranslations({ model:this, records:record })
    .fail(function(err){
      ADCore.error.log('!!!! error PermissionScopeObject.removeTranslation() ', err);
    });
    cb();
  },

  createMultilingual: function(data) {
    return Multilingual.model.create({ model: this, data: data });
  }
};

