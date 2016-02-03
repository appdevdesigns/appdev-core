module.exports={
    "map": {
        "jquery/jquery" : "jquery"
    },
    "paths": {
        "jquery" : "js/jquery.min.js",                  // 'http://code.jquery.com/jquery-1.11.1.min.js'
    },
    "meta" : {
        "js/dependencies/sails.io" : { 
            "format": "global"
        },
    },
    "ext": {
        "ejs": "can/view/ejs/system"
    },
    "buildConfig": {
        "map": {
            "can/util/util": "can/util/domless/domless"
        }
    }
};