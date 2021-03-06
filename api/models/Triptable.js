/**
* Triptable.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  migrate:'safe',
  attributes: {
  	user:'string',
  	info:'string',
  	trips:'array',
    name:'STRING',
    description:'STRING',
  	isFinished:{
      type: 'boolean',
      defaultsTo: false
    },
  	marketareaId:'integer',
  }

};
