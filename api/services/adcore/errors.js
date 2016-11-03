
/**
 * @class  ADCore.error.errors
 * @parent ADCore.error
 * 
 * This is a common list of Error messages that are generated in our appdev-core
 * server side operations.
 *
 * We define a common set of error information that makes it simpler for a client
 * to respond and display info in a consistent manner:
 *
 * Each defined error has a:
 * 	.message 	A common text description of the error
 *  .code 		A unique error code: 
 *					format: 'E_' + uppercase('errorCode')
 *  .mlkey		A multilingual lookup key
 *					for client side display purposes, send
 *					the multilingual key to display
 *
 * Each error is stored in a hash by it's .code.
 */


module.exports = {
	'E_INVALIDAUTH' : {
		message: 'Username and/or password not found',
		code: 'E_INVALIDAUTH',
		mlKey: 'opp.auth.E_INVALIDAUTH'
	},
	'E_ACCOUNTINACTIVE' : {
		message: 'Account is not active',
		code: 'E_ACCOUNTINACTIVE',
		mlKey: 'opp.auth.E_ACCOUNTINACTIVE'
	},
	'E_NOTESTUSERINPRODUCTION' : {
		message: 'testUser is not allowed in production site.',
		code: 'E_NOTESTUSERINPRODUCTION',
		mlKey: 'opp.auth.E_NOTESTUSERINPRODUCTION'
	},


	'E_MISSINGPARAM': {
		message: 'Missing Parameter.',
		code: 'E_MISSINGPARAM',
		mlKey:''
	},

	'E_INVALIDPARAMS' : {
		message: 'Invalid parameter values.',
		code:'E_INVALIDPARAMS',
		mlKey:''
	},

	'E_NOTFOUND' : {
		message: 'Not Fopund.',
		code:'E_NOTFOUND',
		mlKey:''
	}
};


