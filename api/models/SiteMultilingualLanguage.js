/**
* SiteMultilingualLanguage.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  tableName:"site_multilingual_language",
//  migrate:'safe',  // don't update the tables!
// migrate:'alter',



  attributes: {


    language_code : {
        type : "string",
        size : 10
    }, 

    language_label : {
        type : "text"
    } 

  }
};

