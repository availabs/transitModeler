/**
 * UserActionController
 *
 * @description :: Server-side logic for managing Useractions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var crudHandler = require('../support/cruds');
 module.exports = {
 		find: function(req,res){
 			var user = req.session.User;
			var where = {where:{groupname:user.group},skip:req.param('skip')||0,sort:req.param('sort'),limit:req.param('limit')};
 			crudHandler(UserAction,'find',where,req,res);
 		},
 		create: function(req,res){
 			crudHandler(UserAction,'create','groupname',req,res);
 		},
 		update: function(req,res){
 			crudHandler(UserAction,'update','groupname',req,res);
 		},
 		destroy: function(req,res){
 			crudHandler(UserAction,'destroy','groupname',req,res);
 		},
 };
