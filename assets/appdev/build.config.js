module.exports={
    map: {
        "*": {
            "jquery/jquery.js" : "jquery"
        }
    },
    paths: {
        'jquery' : 'js/jquery.min.js',                  // 'http://code.jquery.com/jquery-1.11.1.min.js'
    },
    shim : {
        'jquery': { exports:"jQuery", ignore:true },
        'js/dependencies/sails.io.js' : { packaged:false, ignore:true },
        'site/labels/appdev.js' :  { packaged:false, ignore:true }
    }
    // ext: {
    //     js: "js",
    //     css: "css",
    //     less: "steal/less/less.js",
    //     coffee: "steal/coffee/coffee.js",
    // }
};
    


