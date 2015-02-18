
steal(
    'jquery',
    'can',
    function() {

        
        /**
         * @class AD.ui.Form
         * @parent can.Control
         *
         * This is a Form controller that lets us simply bind Models to Forms
         * and handle validations automatically.
         *
         *
         */
        AD.ui.Form = can.Control.extend({
            // Static properties
            
        },{
            // Instance properties
            
            init: function ($element, options) {


                
            },



            /**
             * @function bind
             *
             * Given a Model object, attempt to setup all validation rules
             * based upon the Model.describe() data.
             *
             * @param {obj} Model
             * @return {undefined}
             */
            bind:function(Model) {

            },



            /**
             * @function isValid
             *
             * Return wether or not the current data in the form elements
             * pass the validation rules.
             *
             * @return {bool}
             */
            isValid:function() {
                return false;
            },



            /**
             * @function values
             *
             * Return an object representing the current values of the form 
             * elements
             *
             * @return {obj}
             */
            values:function() {
                return {};
            },




            
            /**
             * @function translateLabels
             * @param string lang (Optional)
             */
            translateLabels: function (lang) {
                $.each(this.labels, function(){
                    this.translate(lang);
                });
            }
            
        });

    });