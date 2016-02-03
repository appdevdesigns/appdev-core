steal.config({
    "map": {
        "jquery/jquery" : "jquery",
        "appdev/loading.css" : "../loading.css",
        'appdev/ad.js' : "../ad.js"
    },
    "paths": {
        "jquery" : "../js/jquery.min.js"                  // 'http://code.jquery.com/jquery-1.11.1.min.js'
    },
    "shim" : {
        "jquery": { 
            "exports":"jQuery",
            "packaged":false,
            "ignore":true 
        },
        "js/dependencies/sails.io.js" : { 
            "packaged":false, 
            "ignore":true 
        },
        "site/labels/appdev.js" :  { 
            "packaged":false, 
            "ignore":true 
        }
    }
});