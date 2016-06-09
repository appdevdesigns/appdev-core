

// maybe other AD.utils have been loaded already:
if (typeof AD.util == "undefined") {
    AD.util = {};
}



if (typeof AD.util.uiScrollbarSize == 'undefined') {

    (function () {


        var ____sizeScrollbars = null;
        AD.util.uiScrollbarSize = function() {

            if (____sizeScrollbars == null) {

                var css = {
                    "border":  "none",
                    "height":  "200px",
                    "margin":  "0",
                    "padding": "0",
                    "width":   "200px"
                };

                var inner = $("<div>").css($.extend({}, css));
                var outer = $("<div>").css($.extend({
                    "left":       "-1000px",
                    "overflow":   "scroll",
                    "position":   "absolute",
                    "top":        "-1000px"
                }, css)).append(inner).appendTo("body")
                .scrollLeft(1000)
                .scrollTop(1000);

                ____sizeScrollbars = {
                    "height": (outer.offset().top - inner.offset().top) || 0,
                    "width": (outer.offset().left - inner.offset().left) || 0
                };

                outer.remove();
            }
// console.error('**** returning scrollbar info: ', ____sizeScrollbars);
           return ____sizeScrollbars;
        }

        


    })();
}