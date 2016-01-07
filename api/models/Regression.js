/**
* Regression.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  migrate:'safe',
  attributes: {
    groupname:{
        type:'string',
        required:true,
    },
  	name:'string',
  	constant:'float',
  	censusVariables:'array',
  	marketarea:'integer'
  }

};
