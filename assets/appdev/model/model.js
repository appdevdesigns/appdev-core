/*
**
* @class AD_Client.Model
* @parent AD_Client
*
* ##Model
*
* We provide a helper fn() to create models according to an application's namespace.
*
* Our models automatically register themselves with AD.comm.sockets to listen for 
* updates related to the Model's instances.
*
*
* ##Usage:
*
*  Simply define a model in the system using:
*  @codestart
*  AD.Model.extend('application.ModelName', { static properties }, { instance properties });
*  @codeend
*
*/

steal(
        'appdev/comm/hub.js',
        'appdev/comm/socket.js'
).then(function() {


    /**
     * @class AD.Model
     * @parent AD_Client
     *
     * AD.Model exposes a factory method(s) to register a Model in our framework.
     */
    if (typeof AD.Model == "undefined") {
        AD.Model = {


            Base: {
                extend:function(name, staticDef, instanceDef ){

                    // setup namespacing on our AD.models
                    var curr = nameSpace(AD.models_base, name);

                    var modelName = objectName(name);



                    // overwrite the staticDef.findOne, .findAll, .create, .update, .delete
                    // with our functions:
                    staticDef.findAll = convertFindAll(staticDef.findAll);
                    staticDef.findOne = convertFindOne(staticDef.findOne);
                    staticDef.create  = convertCreate(staticDef.create);
                    staticDef.update  = convertUpdate(staticDef.update);
                    staticDef.destroy = convertDestroy(staticDef.destroy);


                    // now let's create our base Model:
                    curr[modelName] = can.Model.extend(staticDef, instanceDef);
                },

                get:function(name) {

                    return findObject(AD.models_base, name);
                }
            },



            /**
             * @function extend
             * Create a AD.models_base object namespaced under AD.models.* 
             * 
             * @param [string] name      The name of the Model.  The
             *        name can be namespaced like so: 'application.tool.Resource'.
             *        This will create a: AD.models.application.tool.Resource
             *        model, that you would then attach to the DOM like:
             *        AD.controllers.application.info.list('#infoList', {
             *          options:true
             *        });
             *
             * @param [object] staticDef    [optional] The static method 
             *        definitions
             * @param [object] instanceDef  The instance definition
             */
            extend:function(name, staticDef, instanceDef) {

                //// NOTE:  we divide our Model definitions up
                //// into 2 parts:  AD.models.* and AD.models_base.*

                //// The AD.models_base.* definition is intended to be
                //// automatically generated from our command line tools.
                //// Anytime we update a table definition, we can regenerate
                //// this file with the proper information.

                //// The AD.models.* definition is intended to extend the
                //// models_base.* definition and contain any specific 
                //// business logic as defined by the programmer.

                //// This way our command line tools can freely update the
                //// models_base definition and not overwrite the programmer's
                //// changes.

                //// Our Model definitions generate by our tools, will first
                //// load the models_base definition, before the models definition
                //// will be run.  So it is expected that the AD.Model.Base.extend()
                //// has been run before this one.


                // setup namespacing on our AD.models
                var curr = nameSpace(AD.models, name);

                var modelName = objectName(name);


                // now let's create our Model from the Model.Base of the same name:
                curr[modelName] = AD.Model.Base.get(name).extend(staticDef, instanceDef);


                // in order for socket updates to work:
                // 1) we must register the model name with io.socket.on('modelname.in.lower.case', cb);
                //    AD.comm.socket.subscribe(modelName, ...) should do this
                //
                // 2) there must be a call in the system for this model USING SOCKETS, for sails
                //    to then register this socket connection for updates.
                //    AD.comm.socket.get({url:'/modelname.in.lower.case'}, cb);  // should do that.
                //

                // subscribe to the socket updates for this model:
                AD.comm.socket.subscribe(modelName, function(message, data) {

//// keep in mind the modelName is what will be used by sails to return data.
//// we have to resolve this back to the given namespacing ... 

// console.log('modelName:'+modelName);
// console.log('socket: message['+message+'] ');
// console.log(data);
// console.log('............................');

                    modelUpdate(name, data);
                });
            },



            /**
             * @function get
             * Return a AD.models object namespaced under AD.models.* 
             * 
             * @param {string} name      The name of the Model.  The
             *        name can be namespaced like so: 'application.tool.Resource'.
             *        This will return AD.models.application.tool.Resource.
             *
             * @return {object}  The Model referenced by name.  if not found, then return null.
             */
            get:function(name) {

                return findObject(AD.models, name);
            }
        };
    }



    /*
     * @function convertFindAll
     *
     * Return a function to implement the findAll routine that reuses our AD.comm.service()
     * method.
     *
     * @param {string} def    The expected url definition for the findAll method
     *                        eg.  'GET /url/to/resource'
     *
     * @returns {function}  the fn() that CanJS will use for this model's findAll() 
     */
    var convertFindAll = function(def) {

        // if a definition exists
        if (def) {

            var parts = def.split(' ');
            var verb = parts[0].toLowerCase();
            var uri  = parts.pop();

            // if we know this verb
            if (AD.comm.service[verb]) {


                // return our function()
                return function( cond, cbSuccess, cbErr ) {
                    var dfd = AD.sal.Deferred();

                    AD.comm.service[verb]({ url:uri, params:cond })
                    .fail(function(err){
                        if (cbErr) cbErr(err);
                        dfd.reject(err);
                    })
                    .done(function(data) {
                        data = data.data || data;

                        // CanJS really wants an array for findAll()
                        // but our blueprint methods might return a single obj if
                        // our match only found 1 object ... 
                        if (!can.isArray(data)) {
                            data = [data];
                        }

                        // package for CanJS:
                        // canJS find/findAll expectes response in { data: data } format:
                        var rData = { data: data };

                        if (cbSuccess) cbSuccess(rData);
                        dfd.resolve(rData);
                    })

                    return dfd;
                }


            } else {
                console.error('improper findAll verb:'+verb);
            }


        } 
            

        // if we get here, either because def == undefined, 
        // or the verb in def is not understood: just return def
        return def;
        
    }



    /*
     * @function convertFindOne
     *
     * Return a function to implement the findOne routine that reuses our AD.comm.service()
     * method.
     *
     * @param {string} def    The expected url definition for the findOne method
     *                        eg.  'GET /url/to/resource/{id}'
     *
     * @returns {function}  the fn() that CanJS will use for this model's findOne() 
     */
    var convertFindOne = function(def) {

        // if a definition exists
        if (def) {

            var parts = def.split(' ');
            var verb = parts[0].toLowerCase();
            var uri  = parts.pop(); 

            // if we know this verb
            if (AD.comm.service[verb]) {


                // return our function()
                return function( cond, cbSuccess, cbErr ) {
                    var dfd = AD.sal.Deferred();

                    var nURI = uri;
                    for (var k in cond) {
                        var oURI = nURI;
                        nURI = AD.util.string.replaceAll(nURI, "{"+k+"}", cond[k]);

                        // if there was a change, remove k from cond:
                        if (oURI != nURI) {
                            delete cond[k];
                        }
                    }

                    AD.comm.service[verb]({ url:nURI, params:cond })
                    .fail(function(err){
                        if (cbErr) cbErr(err);
                        dfd.reject(err);
                    })
                    .done(function(data) {
                        data = data.data || data;

                        if (cbSuccess) cbSuccess(data);
                        dfd.resolve(data);
                    })

                    return dfd;
                }


            } else {
                console.error('improper findAll verb:'+verb);
            }


        } 
            

        // if we get here, either because def == undefined, 
        // or the verb in def is not understood: just return def
        return def;
        
    }



    /*
     * @function convertCreate
     *
     * Return a function to implement the create routine that reuses our AD.comm.service()
     * method.
     *
     * @param {string} def    The expected url definition for the create method
     *                        eg.  'POST /opstool-emailNotifications/enrecipient'
     *
     * @returns {function}  the fn() that CanJS will use for this model's create() 
     */
    var convertCreate = function(def) {

        // if a definition exists
        if (def) {

            var parts = def.split(' ');
            var verb = parts[0].toLowerCase();
            var uri  = parts.pop(); 

            // if we know this verb
            if (AD.comm.service[verb]) {


                // return our function()
                return function( attr, cbSuccess, cbErr ) {
                    var dfd = AD.sal.Deferred();

                    AD.comm.service[verb]({ url:uri, params:attr })
                    .fail(function(err){
                        if (cbErr) cbErr(err);
                        dfd.reject(err);
                    })
                    .done(function(data) {
                        data = data.data || data;

                        if (cbSuccess) cbSuccess(data);
                        dfd.resolve(data);
                    })

                    return dfd;
                }


            } else {
                console.error('improper findAll verb:'+verb);
            }


        } 
            

        // if we get here, either because def == undefined, 
        // or the verb in def is not understood: just return def
        return def;
        
    }



    /*
     * @function convertUpdate
     *
     * Return a function to implement the update() routine that reuses our AD.comm.service()
     * method.
     *
     * @param {string} def    The expected url definition for the update method
     *                        eg.  'PUT /opstool-emailNotifications/enrecipient/{id}',
     *
     * @returns {function}  the fn() that CanJS will use for this model's create() 
     */
    var convertUpdate = function(def) {

        // if a definition exists
        if (def) {

            var parts = def.split(' ');
            var verb = parts[0].toLowerCase();
            var uri  = parts.pop(); 

            // if we know this verb
            if (AD.comm.service[verb]) {


                // return our function()
                return function( id, attr, cbSuccess, cbErr ) {
                    var dfd = AD.sal.Deferred();

                    var key = '{'+this.fieldId+'}';
                    var nURI = AD.util.string.replaceAll(uri, key, id);

                    AD.comm.service[verb]({ url:nURI, params:attr })
                    .fail(function(err){
                        if (cbErr) cbErr(err);
                        dfd.reject(err);
                    })
                    .done(function(data) {
                        data = data.data || data;

                        if (cbSuccess) cbSuccess(data);
                        dfd.resolve(data);
                    })

                    return dfd;
                }


            } else {
                console.error('improper findAll verb:'+verb);
            }


        } 
            

        // if we get here, either because def == undefined, 
        // or the verb in def is not understood: just return def
        return def;
        
    }



    /*
     * @function convertDestroy
     *
     * Return a function to implement the destroy() routine that reuses our AD.comm.service()
     * method.
     *
     * @param {string} def    The expected url definition for the destroy method
     *                        eg.  'DELETE /path/to/resource/{id}',
     *
     * @returns {function}  the fn() that CanJS will use for this model's destroy() 
     */
    var convertDestroy = function(def) {

        // if a definition exists
        if (def) {

            var parts = def.split(' ');
            var verb = parts[0].toLowerCase(); // the 1st entry
            var uri  = parts.pop();  // the last entry

            // if we know this verb
            if (AD.comm.service[verb]) {


                // return our function()
                return function( id, cbSuccess, cbErr ) {
                    var dfd = AD.sal.Deferred();

                    var key = '{'+this.fieldId+'}';
                    var nURI = AD.util.string.replaceAll(uri, key, id);

                    AD.comm.service[verb]({ url:nURI, params:{} })
                    .fail(function(err){
                        if (cbErr) cbErr(err);
                        dfd.reject(err);
                    })
                    .done(function(data) {
                        data = data.data || data;

                        if (cbSuccess) cbSuccess(data);
                        dfd.resolve(data);
                    })

                    return dfd;
                }


            } else {
                console.error('improper findAll verb:'+verb);
            }


        } 
            

        // if we get here, either because def == undefined, 
        // or the verb in def is not understood: just return def
        return def;
        
    }




    /*
     * @function findObject
     *
     * Return the object specified by the given name space:
     *
     * @param {object} baseObj  The base object to search on
     *                          usually AD.models or AD.models_base
     *
     * @param {string} name   The provided namespace to parse and search for
     *                        The name can be spaced using '.' 
     *                        eg.  'coolTool.Resource1' => AD.models.coolTool.Resource1
     *                             'coolerApp.tool1.Resource1' => AD.models.coolerApp.tool1.Resource1
     *
     * @returns {object}  the object resolved by the namespaced base 
     *                    eg:  findObject(AD.models, 'Resource') => return AD.models.Resource
     *                         findObject(AD.models, 'coolTool.Resource1') => AD.models.coolTool.Resource1
     *
     *                    if an object is not found, null is returned.
     */
    var findObject = function(baseObj, name) {

        // first lets figure out our namespacing:
        var nameList = name.split('.');

        // for each remaining name segments, make sure we have a 
        // namespace container for it:
        var curr = baseObj;
        nameList.forEach(function(name) {

            if (typeof curr[name] == 'undefined' ) {
                curr = null;
            }
            if (curr) curr = curr[name];
        })

        return curr;
    }



    /*
     * @function objectName
     *
     * parse the name and return the name of the object we will create.
     *
     * @param {string} name   The provided namespace to parse 
     *                        The name can be spaced using '.' 
     *
     * @returns {string}  the name of the model object 
     *                    eg:  objectName('Resource') => return 'Resource'
     *                         objectName('coolTool.Resource1') => 'Resource1'
     */
    var objectName = function(name) {

        // first lets figure out our namespacing:
        var nameList = name.split('.');
        var objName = nameList.pop(); // remove the last one.

        return objName;
    }



    /*
     * @function nameSpace
     *
     * Make sure the proper name space is created on the given base.
     *
     * @param {object} baseObj  The base object to create the namespace on
     *                          usually AD.models or AD.models_base
     *
     * @param {string} name   The provided namespace to parse and create
     *                        The name can be spaced using '.' 
     *                        eg.  'coolTool.Resource1' => AD.models.coolTool.Resource1
     *                             'coolerApp.tool1.Resource1' => AD.models.coolerApp.tool1.Resource1
     *
     * @returns {object}  the object that represents the namespaced base 
     *                    that the Model is to be created on.
     *                    eg:  nameSpace(AD.models, 'Resource') => return AD.models
     *                         nameSpace(AD.models, 'coolTool.Resource1') => AD.models.coolTool
     */
    var nameSpace = function(baseObj, name) {

        // first lets figure out our namespacing:
        var nameList = name.split('.');
        var controlName = nameList.pop(); // remove the last one.

        // for each remaining name segments, make sure we have a 
        // namespace container for it:
        var curr = baseObj;
        nameList.forEach(function(name) {

            if (typeof curr[name] == 'undefined' ) {
                curr[name] = {};
            }
            curr = curr[name];
        })

        return curr;
    }



    /*
     * @function modelUpdate
     *
     *  In our AD.Model.extend() factory, we automatically register a defined Model
     *  with our socket updates.
     *  
     *  @codestart
     *  AD.comm.socket.subscribe('model', cb);
     *  @codeend
     *  
     *  Sails will then notify us of updates to that model on the server.
     *
     *  CanJS's Models have a .store  of all the Model Instances that are currently
     *  in use in our applications.  
     *
     *  This fn() will take the Sails update, and see if it is related to any of the 
     *  current Model.store instances we are tracking.  If it is, we update that instance
     *  and let the CanJS 2 way bindings do their thing.  
     *
     *  The format of the data received from Sails is:
     *
     *  @codestart
     *  {
     *      "verb": "updated",
     *      "data": {
     *       "updatedAt": "2014-11-25T02:29:33.928Z"
     *      },
     *      "id": "1",
     *      "previous": {
     *          "myname": "name1",
     *          "mynumber": 1,
     *          "id": 1,
     *          "createdAt": "2014-11-24T10:16:36.000Z",
     *          "updatedAt": "2014-11-25T02:22:25.000Z"
     *      }
     *  }
     *  @codeend
     *  
     */
    var modelUpdate = function(name, data){

// console.log('modelUpdate() name:'+name);
// console.log('modelUpdate() data:');
// console.log(data);

        // if we can resolve name to a model:
        var Model = findObject(AD.models, name);

        if (Model) {

            // if this message relates to a Model we are already tracking:
            if (Model.store[data.id]) {


                if (data.verb == 'updated') {

                    var currValues = Model.store[data.id].attr();

                    var isNew = false;
                    for (var v in data.data) {
                        if (currValues[v] != data.data[v]) { isNew = true };
                    }

                    // if we have new data then update the Model.store
                    if (isNew) {
//console.log(' comet:: updating Model.store:');

                        Model.store[data.id].attr(data.data);
                    }

                } else if (data.verb = "destroyed") {

                    // model needs to be removed:
                    Model.store[data.id].destroyed();

                }

            } else {

                if (data.verb == 'created') {


                    // this is about a Model we currently don't know about:
                    // Let's just add it:
                    new Model(data.data);

                    if (Model.store[data.id]) {
                        console.log('model added and stored!');
                    } else {
                        console.log('model added but NOT stored!');
                    }

                } else if (data.verb == 'updated') {

                    //// we received an 'updated' notification about a model we are 
                    //// are not tracking ...  do nothing?

                    console.log('... ModelUpdate():  received an update about a Model we are not tracking.  IGNORE.');


                }
            }

            
        } else {

            console.log('!!!  No Model found with namespace:'+name);
        }
    }
    // AD.comm.hub.subscribe('ad.sails.model.update', modelUpdate);



});

