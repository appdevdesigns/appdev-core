steal(
    'jquery',
    'appdev/ad.js',
    'appdev/loading.css',
    function () {
        loadCanJsFiles();
    });

function loadCanJsFiles() {
    // 'canjs/can.jquery.js',
    AD.ui.loading.attach(); // just append to DOM
    AD.ui.loading.text('initializing appdev library');
    AD.ui.loading.resources(21);

    steal.import('can',
        'can/view/ejs/ejs',
        'can/view/ejs/system',
        'can/construct/super/super').then(
            function () {
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
    console.log('AD resolved conflict jquery ...');

    loadAppdevJsFiles();
}

function loadAppdevJsFiles() {
    steal.import(
        'appdev/config/config',
        'appdev/config/data',
        
        'appdev/comm/hub',
        'appdev/error/log',
        'appdev/util/uuid',
        'appdev/util/async',
        'appdev/util/string',
        'appdev/util/uiScrollbarSize',

        'appdev/model/model',
        'appdev/labels/lang',
        'appdev/labels/label',
        'appdev/comm/service',
        'appdev/comm/socket',
        'appdev/widgets/ad_icon_busy/ad_icon_busy',
        'appdev/widgets/ad_ui_reauth/ad_ui_reauth',
        'appdev/auth/reauth',

        'appdev/UIController',
        'appdev/control/control',

        'site/labels/appdev').then(
            function () {

                AD.ui.loading.completed(18);
                console.log('AD setup done ...');

            });
}