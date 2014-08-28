/**
 * SiteMultilingualLabel
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName:"site_multilingual_label",
    // autoCreatedAt:false,
    // autoUpdatedAt:false,
    // autoPK:false,
    // migrate:'safe',  // don't update the tables!


    connection:"mysql",


    attributes: {

        language_code : {
            type : "string",
            size : 25
        },

        label_key : {
            type : "text"
        },

        label_label : {
            type : "text"
        },

        label_needs_translation : {
            type : "integer",
            size : 1
        },

        label_context : {
            type : "text",
            index: true
        },


    }
};


