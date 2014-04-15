/**
 * SiteMultilingualLabel
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  tableName:"site_multilingual_label",
//  autoCreatedAt:false,
//  autoUpdatedAt:false,
//  autoPK:false,
//  migrate:'safe',  // don't update the tables!

//  config:{
//    database:'live_db',
//    pool:false
//  },

//  adapter:"hris",



  attributes: {

    language_code	: 'STRING',
    label_key	: 'TEXT',
    label_label	: 'TEXT',
    label_needs_translation	: 'INTEGER',
    label_context	: 'TEXT'
  }

};
