 /**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {
  migrate:'safe',
  schema: true,
  autosubscribe: ['create','destroy', 'update'],
  attributes: {

  	name: {
  		type: 'string',
  		required: true
  	},

  	title: {
  		type: 'string'
  	},

    username : {
      type:'string',
      required: true,
      unique: true
    },

  	email: {
  		type: 'string',
  		email: false,
  		required: false,
  		unique: true
  	},

  	encryptedPassword: {
  		type: 'string'
  	},

    online: {
      type: 'boolean',
      defaultsTo: false
    },

    group: {
      type : 'string',
      required: true
    },

    admin: {
      type: 'boolean',
      defaultsTo: false
    },

    sysadmin: {
      type: 'boolean',
      defaultsTo: false
    },

    marketareas:{
      collection:'marketarea',
      via:'users',
    },
    jobs:{
      collection:'job',
      via:'creator',
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmation;
      delete obj.encryptedPassword;
      delete obj._csrf;
      return obj;
    }

  },


  beforeValidation: function (values, next) {
    if (typeof values.admin !== 'undefined') {
      if (values.admin === 'unchecked') {
        values.admin = false;
      } else  if (values.admin[1] === 'on') {
        values.admin = true;
      }
    }
     next();
  },

  beforeCreate: function (values, next) {

    // This checks to make sure the password and password confirmation match before creating record
    if (!values.password || values.password != values.confirmation) {
      return next({err: ["Password doesn't match password confirmation."]});
    }

    console.log('made it',values);
    Usergroup.find({name:values.group}).exec(function(err,data){
      if(err){console.error(err);}
      var isSys;
      data.forEach(function(d){
        if(d.type==='sysAdmin'){
          isSys = true;
        }
      });
      if(isSys){
        console.log('Invalid Permissions Request',data);
        return next({err:["Invalid Permissions"]});
      }
      require('bcryptjs').hash(values.password, 10, function(err, encryptedPassword) {
          if (err) return next(err);
          values.encryptedPassword = encryptedPassword;
          next();
      });
    });
  },

  beforeUpdate: function (values, next) {
        // This checks to make sure the password and password confirmation match before creating record
        if (!values.password) {
            return next();
        }
        if (values.password && values.password != values.confirmation) {
            return next({err: ["Password doesn't match password confirmation."]});
        }
        Usergroup.find({name:values.group}).exec(function(err,data){
          if(err){console.error(err);}
          var isSys;
          data.forEach(function(d){
            if(d.type==='sysAdmin'){
              isSys = true;
            }
          });
          if(isSys){
            console.log('Invalid Permissions Request');
            return next({err:["Invalid Permissions"]});
          }
          require('bcryptjs').hash(values.password, 10, function(err, encryptedPassword) {
              if (err) return next(err);
              values.encryptedPassword = encryptedPassword;
              next();
          });
        });

    },


};
