
/**
 * @class AD_Client
 * @parent index 4
 *
 * ###Client side global AD namespace.
 *
 * This file defines standard functions and calls for appDev
 * objects on the client side.
 */

// Create our AD  Namespace only if it hasn't been created already
if (typeof window.AD == 'undefined') {


    AD = {};


    // AD.xxxx      These properties hold the defined Class/Controller/Model definitions
    //              for our loaded projects.
    AD.controllers = {};    // UI Controllers: user interactions and displays
    AD.models = {};         // Models and data access
    AD.models_base = {};    //    --> appdev generated Model Files
    AD.widgets = {};        // Reusable Widgets for UI display
    AD.classes = {};        // Domain Models
    AD.ui = {};


    // AD.Xxxxx     These properties hold helper/factory methods for our Class/Controller/Model
    // AD.Model     // factory for making models & base_models
    // AD.Control   // factory for making Controllers
    // AD.Class     // factory for making Class 



    AD.defaults = function(defObj, optObj) {
        if (optObj) {
            for (var o in optObj) {
                defObj[o] = optObj[o];
            }
        }
        return defObj;
    };
    
    
    /**
     * Wait for one or more global objects to be available before executing
     * a callback.
     *
     * Dependencies will be checked once every 100ms.
     *
     * @param array/string dependency
     *      Name[s] of the dependencies to wait for
     * @param function callback
     * @param integer [retries]
     *      (Optional) How many times to check before giving up. Default is 50.
     *      Set to -1 for unlimited retries.
     */
    AD.waitFor = function(dependency, callback, retries) {
        if (typeof retries == 'undefined') {
            retries = 50;
        } else if (retries == 0) {
            // No more retries left. Abort.
            console.log('Too many retries waiting for:', dependency);
            return;
        }
        if (!Array.isArray(dependency)) {
            dependency = [dependency];
        }
        for (var i=0; i<dependency.length; i++) {
            if (typeof window[dependency[i]] == 'undefined') {
                //console.log('Retrying:', dependency);
                retries -= 1;
                setTimeout(function() {
                    AD.waitFor(dependency, callback, retries);
                }, 100);
                return;
            }
        }
        callback && callback();
    };


    AD.ui.bootup = {};
    AD.ui.bootup.requireSeries = function ( libraries ) {

        var linksLoaded = document.getElementsByTagName('link');
        var isLoaded = function(library) {

            // if the provided library obj has a cond() then run that:
            if (library.cond) {

                return library.cond();

            } else {

                // else check for matches with library.tag

                for (var i=0; i<linksLoaded.length; i++) {

                    if (linksLoaded[i].href.indexOf(library.tag) != -1 ) {
                        return true;
                    }
                    
                }

                // if we got here, there is not a link loaded with this library tag.
                return false;

            }
        }


        var librariesToLoad = [];
        libraries.forEach(function(series){

            var newSeries = [];

            series.forEach(function(library){

                if (!isLoaded(library)) {
                    newSeries.push(library.lib);
                }

            });

            if (newSeries.length > 0) {
                librariesToLoad.push(newSeries);
            }

        });


        // now do the actual loading of the required libraries

        // this recursive fn loads an array of libraries at a time:
        var loadSeries = function (indx) {

            if (indx >= librariesToLoad.length) {
                return;
            } else {

                console.log('loading series:');
                console.log(librariesToLoad[indx]);

                steal.apply(steal, librariesToLoad[indx])
                .then(
                    function() {
                        loadSeries(indx+1);
                    }
                );

            }
        }

        loadSeries(0);

    }

    
    function versionCompare(v1, v2, options) {
        var lexicographical = options && options.lexicographical,
            zeroExtend = options && options.zeroExtend,
            v1parts = v1.split('.'),
            v2parts = v2.split('.');

        function isValidPart(x) {
            return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
        }

        if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
            return NaN;
        }

        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }

        if (!lexicographical) {
            v1parts = v1parts.map(Number);
            v2parts = v2parts.map(Number);
        }

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return 1;
            }

            if (v1parts[i] == v2parts[i]) {
                continue;
            }
            else if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            else {
                return -1;
            }
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    }
    AD.util = {};
    AD.util.versionCompare = versionCompare;


    // is it possible we have a jQuery version conflict?
    AD.ui._resolveConflict = false;



    AD.ui.loading = {};
    AD.ui.loading.attach = function( sel ) {
        //  
        // Attach our loading progress bar to the provided selector:
        // 
        
        AD.ui.loading._el = null;
        AD.ui.loading.reset();


        // BUILD FIX: typeof check prevents minification engine error.
        if (typeof document.querySelector != 'undefined'){

            var el;

            //// 
            //// Resolve sel to a DOM element
            ////

            // if sel is a query selector (eg a string)
            if( Object.prototype.toString.call(sel) == '[object String]' ) {
               el = document.querySelector(sel);
            } else {

                if (sel) {

                    // is sel a DOM object?
                    if (sel.nodeName) {
                        // sel must be a DOM object
                        el = sel;
                    }
                }
            }
            
            // if el found
            if (el) {

                // insert our HTML progress bar html:
                el.innerHTML = '<span class="app-progressbar-text"></span><div class="app-progressbar"><div class="app-progressbar-inner" ></div></div>';

                AD.ui.loading._el = el;

                var div = el.querySelector('.app-progressbar-inner');
                if (div) {
                    div.style.width = "0%";
                }

            } else {

                // only warn if something was actually sent.  
                if (sel) {
                    console.error('!!! improper selector sent to AD.ui.loading', sel);
                }
            }
        }

    }

    AD.ui.loading.text = function( text ) {
        //  
        // Update the text displayed for our loading progress bar.
        // 
        
        if (AD.ui.loading._el == null) {

            console.log('Calling AD.ui.loading.text() before AD.ui.loading.attach().');
        } else {

            // BUILD FIX: typeof check prevents minification engine error.
            if (typeof AD.ui.loading._el.querySelector != 'undefined'){
            AD.ui.loading._el.querySelector('.app-progressbar-text').innerHTML = text;
            }

        }

    }
    AD.ui.loading.reset = function () {
        AD.ui.loading._total = 0;
        AD.ui.loading._current = 0;

    }
    AD.ui.loading.resources = function( amount ) {
        //  
        // Update the required count for our loading progress bar.
        // 
        
        if (AD.ui.loading._el == null) {

            console.warn('Calling AD.ui.loading.resources() before AD.ui.loading.attach()!  Why?');
        } else {

            AD.ui.loading._total += amount;

            AD.ui.loading._recalc();
        }

    }

    AD.ui.loading.completed = function( amount ) {
        //  
        // Update the completed count for our loading progress bar.
        // 
        
        if (AD.ui.loading._el == null) {
            console.warn('Calling AD.ui.loading.complete() before AD.ui.loading.attach()! Why?');
        } else {
            AD.ui.loading._current += amount;
            AD.ui.loading._recalc();
        }
    }
    AD.ui.loading._recalc = function() {
        //  
        // Update the count for our loading progress bar.
        // 
        
        if (AD.ui.loading._el == null) {

            console.warn('Calling AD.ui.loading._recalc() before AD.ui.loading.attach()! Why?');
        } else {

            if (AD.ui.loading._total > 0) {
                var percent = (AD.ui.loading._current / AD.ui.loading._total) * 100;
                
                // BUILD FIX: prevents minification engine error.
                if (typeof AD.ui.loading._el.querySelector != 'undefined'){
                    var div = AD.ui.loading._el.querySelector('.app-progressbar-inner');
                    if (div) {
                        div.style.width = percent+"%";
                    }
                }
            }

        }

    }
}
  


