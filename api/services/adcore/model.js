
/**
 * @class  ADCore.model
 * @parent ADCore
 * 
 * The model object is a collection of utility function for assisting with 
 * various model operations.
 * 
 */
var AD = require('ad-utils');
var _ = require('lodash');

module.exports = {

    /**
     * @function ADCore.model.join
     */
    join:function(options) {
        var dfd = AD.sal.Deferred();


        var list = options.list || [];

        var fk = options.fk || options.pk;  // the fk value in the existing list
        var pk = options.pk;    // the pk value in my definition
        var destKey = options.destKey; // what to store my model instance in list object
        var Model = options.Model;  // this Model

        // go through each list entry and compile the valid fk's
        var ids = [];
        list.forEach(function(entry){
            if (entry[fk]) {
                ids.push(entry[fk]);
            }
        })

        // if we have some matches 
        if (ids.length == 0) {
            dfd.resolve(list);

        } else {

            var filter = {};
            filter[pk] = ids;

            Model.find(filter)
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(listModels){
                var hashModels = _.indexBy(listModels, pk);

                list.forEach(function(entry){

                    entry[destKey] = null;

                    // if this entry's fk is in our hashModel
                    if (hashModels[entry[fk]]) {

                        // add it 
                        entry[destKey] = hashModels[entry[fk]];

                    }
                });
                dfd.resolve(list);
                return null;
            })
        }


        return dfd;   

    },



    syncOneToOne: {

    	/**
    	 * afterCreate()
    	 *
    	 * check to verify that an associated one-to-one relationship is 
    	 * remotely established after this entry is created.
    	 *
    	 * Since this is a create operation, it is possible the remote 
    	 * object isn't created yet.
    	 *
    	 * @param {obj} opts  The definition of the Model and relationship
    	 * 					  definitions:
    	 *					.Model  The base sails model we are starting from
    	 *					.fields {array} an array of { this.field : that.field }
    	 *								definitions that need to be synced.
    	 *					.records {array} an array of records to update
    	 * @param {fn} cb	  The callback function when operations are finished.
    	 *						cb(err)  
    	 * @return {deferred} 
    	 */
    	afterCreate:function(opts, cb) {
    		var dfd = AD.sal.Deferred();

            if((_.isFunction(opts)) && (_.isUndefined(cb))) {
                cb = opts;
                opts = undefined;
            }

            // make sure opts is provided
            if (_.isUndefined(opts)) {
                var error = ADCore.error.fromKey('E_MISSINGPARAM');
                if (cb) cb(error);
                dfd.reject(error);
                return dfd;
            }

            // make sure opts has required fields
            var requiredFields = ['Model', 'fields', 'records'];
            var isMissing = false;
            requiredFields.some(function(field){
            	if (_.isUndefined(opts[field])) {
            		var error = ADCore.error.fromKey('E_INVALIDPARAMS');
            		if (cb) cb(error);
            		dfd.reject(error)
            		isMissing = true;
            		return true;
            	}
            })
            if (isMissing) {
            	return dfd;
            }


            // now the work begins
            
            
    		if (cb) cb();
    		dfd.resolve();

    		return dfd;
    	}



    },


    /**
     * @function ADCore.model.translate()
     *
     * This tool will help an instance of a Multilingual Model find the proper
     * language translations for the data it currently represents.
     *
     * For this to work, a "Multilingual Model" needs to have the following 
     * definition:
     *           attributes: {
     *
     *               // attribute definitions here ...
     *
     *               translations:{
     *                   collection:'PermissionRolesTrans',
     *                   via:'role'  // the column in TranslationTable that has our id
     *               },
     *               _Klass: function() {
     *                   return PermissionRoles;
     *               },
     *               translate:function(code) {
     *                   return ADCore.model.translate({
     *                       model:this, // this instance of this
     *                       code:code   // the language_code of the translation to use.
     *                   });
     *               },
     *           }
     *
     * translations:{}  defines the additional Table that contains the multilingual
     * data for this row. (the 'TranslationTable')
     *
     * _Klass:function(){} allows the instance of the model to return it's own Class
     * definition.
     *
     * translate:function(code){}  is the function to call this one.  
     *
     * This 
     * 
     */
    translate:function(opt){

        var dfd = AD.sal.Deferred();

        var model = opt.model || null;
        var code = opt.code || Multilingual.languages.default(); // use sails default here!!!

        // Error Check
        // did we receive a model object?
        if(!model) {
            dfd.reject(new Error('model object not provided!'));
            return dfd;
        }

        // Error Check 1
        // if model doesn't have a _Klass() method => error!
        if (!model._Klass) {
            dfd.reject(new Error('model does not have a _Klass() method.  Not multilingual?'));
            return dfd;
        }
        var Klass = model._Klass();


        // Error Check 2
        // if Model doesn't have an attributes.translations definition 
        // then this isn't a Multilingual Model =>  error

        if (!Klass.attributes.translations) {
            dfd.reject(new Error('given model doesn\'t seem to be multilingual.'));
            return dfd;
        } 

        
        // get the name of our TranslationModel
        var nameTransModel = Klass.attributes.translations.collection.toLowerCase();


        // NOTE: 
        // if we looked up our information like: 
        // Model.find().populate('translations').fail().then(function(entries){});
        //
        // then each entry will already have an array of translations populated:
        // [ {  id:1,
        //      foo:'bar', 
        //      translations:[ 
        //          { language_code:'en', row_label:'label here'},
        //          { language_code:'ko', row_label:'[ko]label here'},
        //          { language_code:'zh-hans', row_label:'[zh-hans]label here'}
        //      ]
        //   }, ... ]


        // if we are already populated with translations on this instance
        // then we simply iterate through them and choose the right one.
        if ((model.translations)
            && (_.isArray(model.translations)) 
            && (model.translations.length > 0)) {

            var found = Translate({
                translations:model.translations,
                model:model,
                code:code,
                ignore:opt.ignore
            });
            // if we matched 
            if (found) {
                dfd.resolve();
            } else {
                dfd.reject(new Error(nameTransModel+': translation for language code ['+code+'] not found.'));  // error: no language code found.
            }
        

        } else {

            // OK, we need to lookup our translations and then choose 
            // the right one.

            // 1st find the Model that represents the translation Model
            if (!sails.models[nameTransModel]) {

                dfd.reject(new Error('translation model ['+nameTransModel+'] not found.'));

            } else {

                // 2nd: let's figure out what our condition will be
                // 
                // in our translation:{} definition, we had a .via field, this 
                // is the column in the TranslationModel that has our .id value 
                // in it:
                var transModel = sails.models[nameTransModel];
                var condKey = Klass.attributes.translations.via;
            
                var cond = {};
                cond[condKey] = model.id;
                cond.language_code = code;

                // now perform the actual lookup:
                transModel.find(cond)
                .catch(function(err){
                    dfd.reject(err);
                })
                .then(function(translations){

                    var found = Translate({
                        translations:translations,
                        model:model,
                        code:code,
                        ignore:opt.ignore
                    });
                    // if we matched 
                    if (found) {
                        dfd.resolve();
                    } else {
                        dfd.reject(new Error(nameTransModel+': translation for language code ['+code+'] not found.'));  // error: no language code found.
                    }

                    return null;
                });
            }
        }

        return dfd;

    }
}







/*
 * @function Translate
 *
 * attempt to find a translation entry that matches the provided language code.
 * 
 * if a translation entry is found, then copy the translation fields into the 
 * provided model.
 *
 * @param {object} opt  an object parameter with the following fields:
 *                      opt.translations : {array} of translation entries
 *                      opt.model   {obj} The model instance being translated
 *                      opt.code    {string} the language_code we are translating to.
 * @return {bool}  true if a translation code was found, false otherwise
 */
var Translate = function(opt) {  
    // opt.translations, 
    // opt.model, 
    // opt.code

    // these are standard translation table fields that we want to ignore:
    var ignoreFields = ['id', 'createdAt', 'updatedAt', 'language_code', 'inspect'];

    // if they include some fields to ignore, then include that as well:
    if (opt.ignore) {
        ignoreFields = ignoreFields.concat(opt.ignore);
    }

    var found = false;
    opt.translations.forEach(function(trans){

        if (trans.language_code == opt.code) {
            found = true;

            var keys = _.keys(trans);
            keys.forEach(function(f) { 
                if ( !_.includes(ignoreFields, f)) {
                    opt.model[f] = trans[f];
                }
            });
            
        }
    });

    return found;
    
}



