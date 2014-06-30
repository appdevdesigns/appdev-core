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


    AD.controllers = {};    // UI Controllers: user interactions and displays
    AD.models = {};         // Models and data access
    AD.models_base = {};    //    --> appdev generated Model Files
    AD.widgets = {};        // Reusable Widgets for UI display
    AD.classes = {};        // Domain Models
    AD.ui = {};

    AD.defaults = function(defObj, optObj) {
        if (optObj) {
            for (var o in optObj) {
                defObj[o] = optObj[o];
            }
        }
        return defObj;
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


    steal(

            function() {
                AD.ui.bootup.requireSeries([

                        // we require jQuery 
                        [ 
                            { 
                                // return true if loaded
                                cond:function() { return ('undefined' != typeof window.jQuery ); },
                                lib:'js/jquery.min.js' 
                            } 
                        ],

                        // and CanJS
                        [
                            {
                                cond:function() { return ('undefined' != typeof window.can ); },
                                lib:'canjs/can.jquery.js'
                            }
                        ]

                ]);
            }

    ).then(

            'appdev/comm/hub.js',
            'appdev/util/uuid.js',
			'appdev/config/config.js'
    )
//    .then(
//            'canjs/can.jquery.js'//,
////			'appdev/config/data.js'
//    )
    .then(
            'appdev/model/model.js',
            'appdev/labels/lang.js',
            'appdev/labels/label.js',
            'appdev/comm/service.js',
			'appdev/auth/reauth.js'
    )
    .then(
            'appdev/UIController.js',
            function($) {

console.log('AD setup done ...');

            }
    );


}
