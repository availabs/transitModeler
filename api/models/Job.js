/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var kill = require('tree-kill');


module.exports = {
  migrate:'safe',
  attributes: {
  	start:{
  		type:'datetime',
  		defaultsTo:new Date()
  	},

  	finish:{
  		type:'datetime'
  	},

  	isFinished:{
      type: 'boolean',
      defaultsTo: false
    },

  	type:'STRING',

    info:{
  		type:'array'
  	},

    pid:'string',

    status:'string',

    progress:{
      type:'integer',
      defaultsTo:0
    },
    creator:{
      model:'user',
    },
    group:{
      model:'usergroup',
    },
  },

  beforeUpdate: function(values, next){
    //console.log('before Job Update',values)
    //-------------------------------------------
    //If job is killed by user, kill the Process
    //-------------------------------------------
    if(values.status){
      if(values.status == 'Cancelled'){
        //console.log('Job Update Cancelling');
        if(typeof values.pid != 'undefined' && values.pid != null){
          //console.log('Job Update Killing', values.pid);
          values.isFinished = true;
          values.finished = Date();
          kill(values.pid, 'SIGKILL');
        }
      }
    }
    next();
  }

};
