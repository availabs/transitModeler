/**
* FarezoneFilter.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  migrate:'safe',
  attributes: {
    filtername:'string',
    filter:'array',
    dates:'json',
    maid:'integer',
    stateid:'string',
    description:'string',
    groupname:{
        type:'string',
        required:true,
    },
  }
};
