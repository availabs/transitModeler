/**
 * UsergroupController
 *
 * @description :: Server-side logic for managing usergroups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	find : function(req,res){
		var user = req.session.User;
		Usergroup.find().exec(function(err,groups){
			if(err){
				console.log(err);
				res.send(err,500);
			}
			var g = groups.reduce(function(a,b){if(b.name === user.group)return b; else return a;},null);
				if(g.type === 'sysAdmin'){
					res.send(groups);
				}else{
					res.send([g]);
				}
		});
	},
};
