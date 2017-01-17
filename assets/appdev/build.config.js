module.exports = {
    "map": {
		"async": "js/async",
        // "jquery": "js/jquery.min",
        // "jquery/jquery": "js/jquery.min",
        // "jquery-ui": "js/jquery-ui.min",
        // "selectivity": "js/selectivity/selectivity-full.min",
        // "selectivity.css": "js/selectivity/selectivity-full.min.css",
        // "bootstrap": "js/bootstrap/js/bootstrap.min",
        // "bootstrap.css": "js/bootstrap/css/bootstrap.min.css",
        // "bootstrap-datetimepicker": "js/bootstrap/js/bootstrap-datetimepicker.min",
        // "bootstrap-datetimepicker.css": "styles/bootstrap-datetimepicker.min.css",
        // "font-awesome.css": "styles/font-awesome.css",
        // "GenericList": "js/GenericList",
        // "dropzone": "js/dropzone/dropzone.min",
        // "dropzone.css": "js/dropzone/dropzone.min.css",
        // "bootstrap-table": "js/bootstraptable/bootstrap-table",
        // "bootstrap-table.css": "js/bootstraptable/bootstrap-table.css",
        // "bootstrapValidator": "js/bootstrapValidator.min",
        // "bootstrapValidator.css": "styles/bootstrapValidator.min.css",
        // "typeahead": "js/typeahead.jquery.min",
        // "moment": "js/moment.min",
    },
    "paths": {
        "async": "js/async",
        "can": "can/can.js",
        "appdev": "appdev/appdev.js",
    },
    "bundle": ['can', 'appdev'],
    "meta": {
        "can": {
            "deps": [
                "appdev/config/data",
                'can/util/can',
                'can/util/attr/attr',
                'can/event/event',
                'can/util/array/each',
                "can/util/string/string",
                'can/util/inserted/inserted',
                'can/util/jquery/jquery',
                'can/util/util',
                'can/util/array/makeArray',
                'can/util/domless/domless',
                'can/util/bind/bind',
                'can/map/bubble',
                'can/util/object/isplain/isplain',
                'can/map/map_helpers',
                'can/util/string/string',
                'can/construct/super/super',
                'can/construct/construct',
                'can/util/batch/batch',
                'can/map/map',
                'can/list/list',
                'can/util/string/deparam/deparam',
                'can/route/route',
                'can/control/control',
                'can/control/route/route',
                'can/model/model',
                'can/compute/read',
                'can/compute/get_value_and_bind',
                'can/compute/proto_compute',
                'can/compute/compute',
                'can/map/define/define',
                'can/map/sort/sort'
            ]
        },
        // "js/jquery.min": {
        //     "exports": "jQuery",
        //     "format": 'global',
        //     "sideBundle": true
        // },
        // "js/jquery-ui.min.js": {
        //     "sideBundle": true
        // },
        "js/async": {
            "format": 'global',
            "sideBundle": true
        },
        "js/OpenAjax": {
            "sideBundle": true
        },
        "js/dependencies/sails.io": {
            "format": "global",
            "sideBundle": true
        },
        "appdev": {
            "deps": [
                'jquery',

                'appdev/ad',
                'appdev/UIController',

                'appdev/config/config',
                'appdev/config/data',

                'appdev/auth/reauth',

                'appdev/comm/error',
                'appdev/comm/hub',
                'appdev/comm/pending',
                'appdev/comm/service',
                'appdev/comm/socket',

                'appdev/control/control',

                'appdev/error/log',

                'appdev/labels/lang',
                'appdev/labels/label',

                'appdev/model/model',

                'appdev/util/async',
                'appdev/util/model',
                'appdev/util/string',
                'appdev/util/uiScrollbarSize',
                'appdev/util/uuid',
            ],
        },
        'appdev/comm/socket': {
            "deps": [
                'js/dependencies/sails.io',
                'appdev/config/data',
            ]
        },
        "appdev/config/config": {
            "deps": [
                "js/dependencies/sails.io",
                "appdev/ad"
            ]
        },
        'appdev/config/data': {
            "deps": [
                'appdev/config/config',
            ]
        }
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
