/**
 * FarezoneFilterController
 *
 * @description :: Server-side logic for managing Farezonefilters
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var crudHandler = require('../support/cruds');
module.exports = {
		find: function(req,res){
			var user = req.session.User;
			crudHandler(FarezoneFilter,'find',{groupname:user.group},req,res);
		},
		create: function(req,res){
			crudHandler(FarezoneFilter,'create','groupname',req,res);
		},
		update: function(req,res){
			crudHandler(FarezoneFilter,'update','groupname',req,res);
		},
		destroy: function(req,res){
			crudHandler(FarezoneFilter,'destroy','groupname',req,res);
		},
};
