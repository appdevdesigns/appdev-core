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

            if ((!_listLanguages)
                || (_listLanguages.length < 1)) {

                SiteMultilingualLanguage.find()
                .then(function(list){
                    _listLanguages = list;
                    if (list.length == 0) {
                        AD.log('<yellow><bold>WARN:</bold> Multilingual.languages.all() : no languages in table!</yellow>');
                        AD.log('<yellow><bold>WARN:</bold> returning \'en\' ... </yellow>');
                        list.push({language_code:'en', language_label:'No Languages defined ... so English'});
                    }
                    dfd.resolve(list);
                    return null;
                })
                .catch(function(err){
                    dfd.reject(err);
                    return null;
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

                        if (model) instanceDataModel = model;
                        next();
                        return null;

                    })
                    .catch(function(err){
                        next(err);
                        return null;
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
                        return null;
                    })
                    .catch(function(err){
                        AD.log.error('error saving translation data:', err);
                        next(err);
                        return null;
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
        },



        /**
         * @function Multilingual.model.removeTranslations()
         *
         * This tool will remove any associated translations from a 
         * multilingual model.
         *
         * @param {obj}  opts.model The base Model used for Model.create()
         * @param {obj}  opts.data  an array of Model records that were deleted
         * @return {deferred}
         */
        removeTranslations:function(opts) {
            var dfd = AD.sal.Deferred();

            var Model = opts.model;
            var data = opts.records;


            //Error Checking:
            if (typeof Model == 'undefined') {
                dfd.reject(new Error('ADCore.model.multilingual.add() called without a model parameter.'));
                return dfd;
            }


            // figure out trans Model
            var TransModel = getTransModel(Model);
            if (!TransModel) {
                var err = new Error('Unable to figure out Translation Model for Model');
                err.Model = Model;
                dfd.reject(err);
            }


            // find out what the primary Key is for Model
            var pk = getModelPK(Model);
            if (pk == null) {
                var err = new Error('Unable to figure out primary key of Model');
                err.Model = Model;
                dfd.reject(err);
            }

            
            // pluck all the primary keys from our given records
            var listIDs = _.pluck(data, pk);


            // find out the remote fk for our reference:
            var fk = Model.attributes.translations.via;
            if (!fk) {
                var err = new Error('Unable to figure out the translation fk (.via) for our Model');
                err.Model = Model;
                dfd.reject(err);
            }


            // now do the deed!
            var cond = {};
            cond[fk] = listIDs;


            // Fix: there is a bug in Waterline v0.10.30 that incorrectly trys
            // to call the cb() if the cond wouldn't return any values. So we
            // default to the cb method here rather than the promise method.
            // 
            // FYI: Waterline v0.11.x has fixed this.
            TransModel.destroy(cond, function(err, data) {
                if (err) {
                    dfd.reject(err);
                } else {
                    dfd.resolve(data);
                }
            })


            return dfd;

        },



        /**
         * @function Multilingual.model.sync()
         *
         * This tool will synchronize a model instance with a given set of data.
         *
         * This is like the ADCore.model.sync() method but it also includes the
         * multilingual translations as well.
         *
         * It is useful when trying to synchronize the instance of a model with a 
         * given set of data, when that data represents the exact representation
         * of the current state of the model.  For example, if a model (person) 
         * hasMany (dogs), and the current state of person.1 :
         *  {
         *      name: 'Charlie',
         *      dogs:[1]
         *  }
         * then you have an updated value:
         *  {
         *      name: 'Charlie Brown',
         *      dogs:[2,3] 
         *  }
         *
         * then person.dogs.1 is removed, and person.dogs.[2,3] is added, in 
         * addition to person.name being updated to 'Charlie Brown'.
         *
         * The current value of data represents the exact state you want the 
         * instance to match.
         *
         *
         * @param {obj}  opts.model the model instance you want to update.
         * @param {obj}  opts.data  a json obj that contains the current state of model
         * @return {deferred}
         */
        sync:function(options) {
            var dfd = AD.sal.Deferred();

            var activity = options.model;
            var updatedValues = options.data;

            async.series([

                // update all the activity values
                function(done) {

                    // update base fields
                    var fields = modelAttributes({model:activity}); // get the base fields for model
                    var dates = modelAttributes({model:activity, type:'date'}); 

// console.log('... fields1:', fields);
                    fields = _.difference(fields, ['id', 'createdAt', 'updatedAt']); // remove these fields:
                    fields = _.difference(fields, dates);
// console.log('... fields:', fields);
                    fields.forEach(function(f){
                        if (typeof updatedValues[f] != 'undefined') {
// console.log('    .... f:activity.'+f+':', updatedValues[f]);
                            activity[f] = updatedValues[f];
                        }
                        
                    })

                    
                    // update the dates
                    dates.forEach(function(date){
                        activity[date] = AD.util.moment(new Date(updatedValues[date])).format('YYYY-MM-DD')+'';
                    })


                    // find each of our collections:  hasMany relationships
                    var collections = modelCollections({model:activity});
                    collections.forEach(function(field){
// console.log('... collection:', field);

                        // if we've been given updatedValues
                        if (updatedValues[field]) {
// console.log('... updatedValues['+field+']:', updatedValues[field]);


                            //// figure out Collection's primary key field:
                            var collectionPK = pkForCollection({model:activity, field:field });

                            //// convert current values into an array of IDs
                            var currentValues = activity[field];
                            var currentIDs = [];
                            currentValues.forEach(function(cv){
// console.log('... cv:', cv);
                                if (typeof cv == 'string') {
                                    currentIDs.push( parseInt(cv) );
                                } else {
                                    if (cv[collectionPK]) {
                                        currentIDs.push( cv[collectionPK] );
                                    }
                                }
                            })


                            //// convert the updatedValues to an array of IDs:
                            var newIDs = [];
                            if ( !_.isArray( updatedValues[field] ) ){
                                updatedValues[field] = [ updatedValues[field] ];
                            }
                            updatedValues[field].forEach(function(nv){
                                if (typeof nv == 'string') {
                                    newIDs.push( parseInt(nv) );
                                } else if(typeof nv == 'object') {
                                    if (cv[collectionPK]) {
                                        newIDs.push( cv[collectionPK] );
                                    }
                                } else {
                                    // must just be integers:
                                    newIDs.push(cv);
                                }
                            });

                            var idsToAdd = _.difference(newIDs, currentIDs);
                            var idsToRemove = _.difference(currentIDs, newIDs);
// console.log('... currentIDs:', currentIDs);
// console.log('... newIDs:', newIDs);
// console.log('... idsToAdd:', idsToAdd);
// console.log('... idsToRemove:', idsToRemove);

                            idsToAdd.forEach(function(id){
                                activity[field].add(id);
                            })

                            idsToRemove.forEach(function(id){
                                activity[field].remove(id);
                            })

                        }
                    });

                // final save and then call to Trans
// console.log('     B4 .save():', activity);

                    activity.save()
                    .then(function(updatedActivity){

                        // #hack: Sails v0.12 introduced some changes in .save()
                        // current populations are not kept.  We need to lookup and 
                        // repopulate again:
                        var Model = activity._Klass();
                        var pk = getModelPK(Model);
                        var criteria = {};
                        criteria[pk] = activity[pk];
                        Model.findOne(criteria)
                        .populateAll()
                        .then(function(newActivity){
                            if (newActivity) activity = newActivity;
                            done();
                            return null;
                        })
                        .catch(function(err){
                            ADCore.error.log(' !!! Doh, error retrieving updated model: ', { error: err, model:activity });
                        });

                        return null;
                    })
                    .catch(function(err){
                        ADCore.error.log(' !!! Doh, error saving updated model: ', { error: err, model:activity });
                        return null;
                    });

                },


                // update the multilingual entry
                function(done) {

                    var multilingualFields = modelMultilingualFields({model:activity});
// console.log('... multilingual:', multilingualFields);
                    if (updatedValues.language_code) {
// console.log('... multilingual label to update:');
// console.log('    .... all translations:', activity.translations);
                        var trans = null;
                        activity.translations.forEach(function(t){
                            if (t.language_code == updatedValues.language_code) {
                                trans = t;
                            }
                        })
                        if (trans) {
// console.log('   ... found translation:', trans);

                            var transModel = getTransModel(activity);
                            transModel.findOne(trans.id)
                            .then(function(transEntry){

                                multilingualFields.forEach(function(field){
                                    if (typeof updatedValues[field] != 'undefined') {
                                        transEntry[field] = updatedValues[field];
                                    }
                                });

                                transEntry.save()
                                .then(function(updatedTrans){

                                    done();
                                    return null;
                                })
                                .catch(function(err){

                                    ADCore.error.log('Error updating translation entry:', {
                                        transEntry:transEntry,
                                        error:err
                                    })
                                    done(err);
                                    return null;
                                })

                                return null;
                            })

                        } else {

                            // no matching translation for given language_code
                            ADCore.error.log('No matching translation for given language_code', {
                                updatedValue:updatedValues,
                                activity:activity
                            });
                            done();
                            
                        }

                    } else {

                        // nothing to translate
                        done();
                    }

                }


            ], function(err, results) {


                if (err) {
                    dfd.reject(err);
                } else {
                    dfd.resolve(activity);
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
 * @function modelAttributes
 *
 * return an array of field names of this model's data that are not the 
 * multilingual fields.
 *
 * @param {json} options
 *                  .model {instance} of the model Class we are working on
 *                  .type  {string}  filter for a type of field to return.
 * @return {array} 
 */
function modelAttributes (options) {
    var model = options.model;
    var Model = options.Model || model._Klass();
    options.type = options.type || 'all';

    var attributes = Model.attributes;

    var fields = [];
    _.forOwn(attributes, function(value, key){
        if (value.type) {

            if ((options.type == 'all') || (value.type == options.type)) {
// console.log('   :modelAttributes(): value.type:'+value.type+" options.type:"+options.type);
                fields.push(key);
            }
        }
    })

    return fields;

}





/*
 * @function modelCollections
 *
 * return an array of field names of this model's data that are 
 * collections (associated with other models).
 *
 * @param {json} options
 *                  .model {instance} of the model Class we are working on
 *                  .type  {string}  filter for a type of field to return.
 * @return {array} 
 */
function modelCollections (options) {
    var model = options.model;
    var Model = options.Model || model._Klass();

    var attributes = Model.attributes;

    var fields = [];
    _.forOwn(attributes, function(value, key){
        if (value.collection) {
            fields.push(key);
        }
    })

    return fields;

}


function pkForCollection(options) {
    var model = options.model;
    var Model = options.Model || model._Klass();
    var field = options.field;

    var key = Model.attributes[field].collection.toLowerCase();
    if (key) {
        return getModelPK(sails.models[key]);
    } else {
        return null;
    }

}


/*
 * @function getModelPK
 *
 * Find the primary key field for a given Model.
 *
 * @param {obj} Model  A Multilingual Model Object (the Data Model)
 * @return {string}  the attribute name that is the primary key
 */
var getModelPK = function(Model) {

    var pk = null;

    if (Model.attributes) {

        for (var k in Model.attributes) {
            if (Model.attributes[k].primaryKey) {
                pk = k;
            }
        }
    }

    return pk;

}


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




//// TODO: refactor to remove getTransFields() and 
//// replace with modelMultilingualFields()
function modelMultilingualFields (options) {
    var fields = [];

    var model = options.model;
    var Model = options.Model || model._Klass();

    var ModelTrans = getTransModel(Model);

    if (ModelTrans) {


        var attributes = ModelTrans.attributes;

        var ignoreFields = ['id', 'createdAt', 'updatedAt' ];
        ignoreFields.push(Model.attributes.translations.via);

        
        _.forOwn(attributes, function(value, key){

            if (ignoreFields.indexOf(key) == -1) {
                fields.push(key);
            }
        })
    }

    return fields;
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
