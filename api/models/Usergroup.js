/**
* Usergroup.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    migrate:'safe',
    schema: true,
    autosubscribe: ['create','destroy', 'update'],
    attributes: {

        name: {
            type: 'string',
            required: true,
            unique: true
        },
        displayName: {
            type: 'string'
        },
        type: {
            type: 'string',
            enum: ['transitAuth', 'state', 'sysAdmin'],
            required: true
        },
        datasources:{
          collection:'datasource',
          via:'groups',
        },
        jobs:{
          collection:'job',
          via:'group'
        }
    }
};
