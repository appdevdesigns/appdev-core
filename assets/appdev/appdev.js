steal(
    'jquery',
    'appdev/loading.css',
    'appdev/ad.js',
    function() {
        loadCanJsFiles();
    }
);

function loadCanJsFiles() {
    // 'canjs/can.jquery.js',
    AD.ui.loading.attach(); // just append to DOM
    AD.ui.loading.text('initializing appdev library');
    AD.ui.loading.resources(21);
    
    steal('can',
        'can/view/ejs',
        'can/construct/super',
        function() {
            resolveConflictJquery();
        }
    );
}

function resolveConflictJquery() {
    AD.ui.loading.completed(3);

    AD.ui.jQuery = window.jQuery; //$;

    if (AD.ui._resolveConflict) {
        console.log(' .... trying to not conflict with existing jQuery');
        $.noConflict();  // return things as they were.
    }
    
                AD.ui.loading.completed(18);
            console.log('AD setup done ...');

    loadAppdevJsFiles();
}

function loadAppdevJsFiles() {
    steal(
        'appdev/comm/hub.js',
        'appdev/error/log.js',
        'appdev/util/uuid.js',
        'appdev/util/async.js',
        'appdev/util/string.js',
        'appdev/config/config.js',
        'appdev/util/uiScrollbarSize.js',

        'appdev/config/data.js',
        'appdev/model/model.js',
        'appdev/labels/lang.js',
        'appdev/labels/label.js',
        'appdev/comm/service.js',
        'appdev/comm/socket.js',
        'appdev/auth/reauth.js',

        'appdev/UIController.js',
        'appdev/control/control.js',
        'appdev/widgets/ad_icon_busy',
        'appdev/widgets/ad_ui_reauth',
        'site/labels/appdev.js',
        function($) {

            AD.ui.loading.completed(18);
            console.log('AD setup done ...');

        }
    );
}