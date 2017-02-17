/**
 * PermissionScope.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  tableName:'site_perm_scope',
migrate:'alter',

  attributes: {

    // hasMany{Permission} assigned to which Permission entries.
    permission : {  collection: 'permission', via: 'scope' },

    // hasOne:{PermissionScopeObject}  which defined object is this scope resolving
    object : { model: 'permissionscopeobject' },

    // hasOne:{SiteUser} created by which user
    createdBy : { model: 'siteuser' },

    // {json}  the compiled sails like condition {}
    filter : { type: 'json' },

    // {json}  the jQuery QueryBuilder definition
    filterUI : { type: 'json' },

    // // {bool}  is this shared with others? true: shared, false => private
    // isGlobal : { type: 'boolean' },

    // this will pull in the translations using .populate('translations')
    translations:{
        collection:'PermissionScopeTrans',
        via:'permissionscope'
    },

    translate:function(code) {
        return ADCore.model.translate({
            model:this,         // this instance of a Model
            code:code,          // the language code of the translation to use.
            ignore:['permissionscope']     // don't include this field when translating
        });
    },

    _Klass: function() {
        return PermissionScope;
    }
  },


  afterDestroy: function(record, cb) {

    Multilingual.model.removeTranslations({ model:this, records:record })
    .fail(function(err){
      ADCore.error.log('!!!! error PermissionScope.removeTranslation() ', err);
    });
    cb();  // NOTE: cb() is not waiting for .removeTranslations() to complete.
  },


  createMultilingual: function(data) {
    return Multilingual.model.create({ model: this, data: data });
  }
};

