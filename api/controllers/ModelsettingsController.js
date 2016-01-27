/**
 * ModelsettingsController
 *
 * @description :: Server-side logic for managing modelsettings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var crudHandler = require('../support/cruds');
module.exports = {
	find : function(req,res){
		var user = req.session.User;
		crudHandler(Modelsettings,'find',{groupname:user.group},req,res);
	},
	create : function(req,res){
		crudHandler(Modelsettings,'create','groupname',req,res);
	},
	update : function(req,res){
		crudHandler(Modelsettings,'update','groupname',req,res);
	},
	destroy : function(req,res){
		crudHandler(Modelsettings,'destroy','groupname',req,res);
	},
};
