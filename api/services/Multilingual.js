/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an application.

 *
 */
var AD = require('ad-utils');
var _ = require('lodash');



// A persistent list of languages defined in our system
var _listLanguages = null;


module.exports = {

    CONST: {

        DEFAULTLANGUAGE : 'lang.default'

    },


    languages:{


        /**
         * @function Multilingual.languages.all()
         *
         * returns an array of all the SiteMultilingualLanguage entries.
         *
         * @return {deferred}
         */
        all:function() {
            var dfd = AD.sal.Deferred();

            if (!_listLanguages) {

                SiteMultilingualLanguage.find()
                .then(function(list){
                    _listLanguages = list;
                    dfd.resolve(list);
                })
                .catch(function(err){
                    dfd.reject(err);
                })

            } else {

                // just return our cached list:
                dfd.resolve(_listLanguages);
            }

            return dfd;
        },



        /**
         * @function Multilingual.languages.default()
         *
         * returns language_code defined in sail.config.appdev[ 'lang.default' ].
         *
         * @return {string}
         */
        default:function() {

            return sails.config.appdev[Multilingual.CONST.DEFAULTLANGUAGE] || 'en' ;

        }
    },


    model:{

        /**
         * @function Multilingual.model.create()
         *
         * This tool adds a row to a Multilingual Model.  Use this fn() 
         * when adding the base & translation data as a single data obj.
         *
         * @param {obj}  opts.model The base Model used for Model.create()
         * @param {obj}  opts.data  The json data object to create
         * @return {deferred}
         */
        create:function(opts) {
            var dfd = AD.sal.Deferred();

            var Model = opts.model;
            var data = opts.data;


            //Error Checking:
            if (typeof Model == 'undefined') {
                dfd.reject(new Error('ADCore.model.multilingual.add() called without a model parameter.'));
                return dfd;
            }


            // figure out trans fields from Model
            var TransModel = getTransModel(Model);
            if (!TransModel) {
                var err = new Error('Unable to figure out Translation Model for Model');
                err.Model = Model;
                dfd.reject(err);
            }

            var fieldsTrans = getTransFields(Model);
            if (fieldsTrans == null) {
                var err = new Error('Unable to figure out translation fields for Model');
                err.Model = Model;
                dfd.reject(err);
                return dfd;
            }
// AD.log('... fieldsTrans:', fieldsTrans);

            // now get the list of languages
            var listLanguages = null;

            var instanceDataModel = null;


            async.series([

                // get list of Multilingual Languages
                function(next){

                    Multilingual.languages.all()
                    .then(function(list){
                        listLanguages = list;

// AD.log('... listLanguages: ', listLanguages);

                        next();
                    })
                    .fail(function(err){
                        next(err);
                    });

                },

                // Update the Base Model
                function(next) {

                    // just pull out the Base Model Fields
                    var modelData = {};
                    for(var k in data) {

                        // if this is not a translation field
                        if (_.indexOf(fieldsTrans, k) == -1) {

                            modelData[k] = data[k];

                        }
                    }

// AD.log('... data:', data);
// AD.log('... base Data:', modelData);

                    Model.create(modelData)
                    .then(function(model){

                        instanceDataModel = model;
                        next();

                    })
                    .catch(function(err){
                        next(err);
                    })


                },


                // now update the Translations
                function(next) {

                    var languageCode = data.language_code || Multilingual.languages.default();
                    
                    var transactions = [];
                    var ignoreFields = [ 'id', 'createdAt', 'updatedAt'];


                    // for each language in our system:
                    listLanguages.forEach(function(lang) {

                        // empty data obj
                        var givenTransData = {};

                        // scan the data for our translation fields:
                        fieldsTrans.forEach(function(f) {

                            // if this isn't one of the ignored model fields:
                            if (_.indexOf(ignoreFields, f) == -1) {

                                // if this is the same language as the provided language data
                                if ((lang.language_code == languageCode)
                                    || (f == 'language_code')) {
                                    givenTransData[f] = data[f];
                                } else {

                                    // so this means we are using the language of another language
                                    // for the current language, so we add on a '[langCode]' tag.
                                    givenTransData[f] = '['+lang.language_code+']' + data[f];
                                }
                            }
                        });

                        // make sure our language_code is correctly set
                        givenTransData.language_code = lang.language_code; 

                        transactions.push(givenTransData);
                    });

// AD.log('... translation transactions:', transactions);

                    transactions.forEach(function(transData) {
                        instanceDataModel.translations.add(transData);
                    });


                    instanceDataModel.save()
                    .then(function(d){
                        next();
                    })
                    .catch(function(err){
                        AD.log.error('error saving translation data:', err);
                        next(err);
                    })

                }

            ], function(err, results) {

                if (err) {
                    dfd.reject(err);
                } else {
                    dfd.resolve(instanceDataModel);
                }
            })

            return dfd;
        }


    }


};






///// 
///// HELPER FUNCTIONS
/////


/*
 * @function getTransFields
 *
 * Find the Translation fields for a given Model.
 *
 * @param {obj} Model  A Multilingual Model Object (the Data Model)
 * @return {array}  if the translation Model was found, null otherwise
 */
var getTransFields = function(Model) {

    var TransModel = getTransModel(Model);

    if (TransModel) {

        var ignoreList = [];
        ignoreList.push(Model.attributes.translations.via); // ignore the ForeignKey

        var fields = [];
        for(var k in TransModel.attributes) {

            // if this field isn't one of our ignored fields
            if (_.indexOf(ignoreList, k) == -1) {
                fields.push(k);
            }
        }

        // this is the array of Translation Fields
        return fields;

    } else {

        return null;
    }

}



/*
 * @function getTransModel
 *
 * Find the Translation Model that corresponds to the given Model.
 *
 * @param {obj} Model  A Multilingual Model Object
 * @return {obj}  if the translation Model was found, null otherwise
 */
var getTransModel = function(Model) {

    // Error Check
    // did we receive a model object?
    if(!Model) {
        AD.log.error(new Error('Model object not provided!'));
        return null;
    }


    // Error Check 1
    // if they sent us an instance of a Multilingual Model, then just
    // get the Data Model class from that.
    if (Model._Klass) {
        Model = Model._Klass();
    }


    // Error Check 2
    // if Model doesn't have an attributes.translations definition 
    // then this isn't a Multilingual Model =>  error
    if (!Model.attributes.translations) {
        AD.log.error(new Error('given model doesn\'t seem to be multilingual.'));
        return null;
    } 


    // now go about the business of getting the Translation Model:

    // get the name of our TranslationModel
    var nameTransModel = Model.attributes.translations.collection.toLowerCase();

    // get that model from sails.models
    if (!sails.models[nameTransModel]) {

        AD.log.error(new Error('translation model ['+nameTransModel+'] not found.'));
        return null;

    } else {

        return sails.models[nameTransModel];
    }

}
