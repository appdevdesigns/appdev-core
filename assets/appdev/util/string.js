

// maybe other AD.utils have been loaded already:
if (typeof AD.util == "undefined") {
    AD.util = {};
}



if (typeof AD.util.string == 'undefined') {


    (function () {

        /**
         * @function RegExpQuote
         *
         * Replace any special RegExp characters with '\'+char.
         *
         * @param  {string} origString the string to check
         * @return {bool}
         */
        // RegExpQuote = function(str) {
        //      return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
        // };

        AD.util.string = {
            /**
             * @function replaceAll
             *
             * Replace all occurrences of replaceThis with withThis  inside the provided origString.
             *
             * NOTE: this returns a copy of the string.  origString is left as is.
             *
             * @codestart
             * var origString = 'Hello [name]. What is the Matrix, [name]?';
             * var replaceThis = '[name]';
             * withThis = 'Neo';
             *
             * var newString = AD.util.string.replaceAll(origString, replaceThis, withThis);
             *
             * console.log(origString);  // Hello [name]. What is the Matrix, [name]?
             * console.log(newString);  // Hello Neo. What is the Matrix, Neo?
             * @codeend
             *
             * @param  {string} origString the string to check
             * @return {string} a copy of origString with changes made
             */
            replaceAll : function (origString, replaceThis, withThis) {
                var re = new RegExp(AD.util.string.quoteRegExp(replaceThis),"g");
                return origString.replace(re, withThis);
            },


            /**
             * @function RegExpQuote
             *
             * Replace any special RegExp characters with '\'+char.
             *
             * @param  {string} origString the string to check
             * @return {bool}
             */
            quoteRegExp: function(str) {
                return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
            }

        };

    })();
}