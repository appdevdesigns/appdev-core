/**
 * SiteMultilingualLabel
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName:"site_multilingual_label",
    // autoCreatedAt:false,
    // autoUpdatedAt:false,
    // autoPK:false,
    // migrate:'safe',  // don't update the tables!


    // connection:"appdev_default",


    attributes: {

        language_code : {
            type : "string",
            size : 25
        },

        label_key : {
            type : "string",
            maxLength: 80
        },

        label_label : {
            type : "text"
        },

        label_needs_translation : {
            type : "integer",
            size : 1
        },

        label_context : {
            type : "string",
            maxLength: 80
        },

    },

    ////////////////////////////
    // Model class methods
    ////////////////////////////


    /**
     * Fetch all labels from a given context and language, returned in the 
     * form of a dictionary (associative array).
     * 
     * @param {string} context
     * @param {string} [languageCode]
     *      Default is sails.config.appdev['lang.default']
     * @return {Promise}
     *      Resolves with object (dictionary)
     *      {
     *          <label_key>: <label_label>,
     *          <label_key>: <label_label>,
     *          ...
     *      }
     */
    getLabels: function(context, languageCode) {
        languageCode = languageCode || sails.config.appdev["lang.default"];
        
        return new Promise((resolve, reject) => {
            .then(() => {
                SiteMultilingualLabel.query(
                    `
                        SELECT
                            label_key AS key,
                            label_label AS label
                        FROM
                            site_multilingual_label
                        WHERE
                            label_context = ?
                            AND language_code = ?
                    `,
                    [context, languageCode],
                    (err, list) => {
                        if (err) reject(err);
                        else {
                            var result = {};
                            list = list || [];
                            list.forEach((row) => {
                                result[row.key] = row.label;
                            });
                            resolve(result);
                        }
                    }
                );
            });
    }

};


