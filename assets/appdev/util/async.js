/*
 *  AD.util.async 
 *
 *  Make sure the Async library is available to our projects.
 */


steal(

        'js/async.js'

).then(function() {



    // maybe other AD.utils have been loaded already:
    if (typeof AD.util == "undefined") {
        AD.util = {};
    }


    if (typeof AD.util.async == 'undefined') {

        (function () {

            // it should be globally available once loaded via steal:
            AD.util.async = async;

        })();
    }


});