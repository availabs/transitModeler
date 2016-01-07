/**
 * RegressionController
 *
 * @description :: Server-side logic for managing regressions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

function handleError(err){
	if(err){
		console.log(err);
		res.send(err,500);
	}else{
		return true;
	}
}
module.exports = {
		find : function(req,res){
			var user = req.session.User;
			Regression.find({groupname:user.group}).exec(function(err,regs){
				if(handleError(err)){
						res.send(regs);
				}
			});
		},
		create : function(req,res){
			console.log('correct');
			var user = req.session.User;
			var data = req.body;
			if(!data)
				res.send({err:'empty request'},500);
			if(!data.length)
				data.groupname = user.group;
			else{
				data.forEach(function(d){
					d.groupname = user.group;
				});
			}
			Regression.create(data).exec(function(err,data){
				if(handleError(err)){
						res.send(data);
				}
			});
		},
		update : function(req,res){
			// var user = req.session.User;
			// var data = req.body;
			// if(!data)
			// 	res.send({err:'empty requrest'},500);
			// if(!data.length)
			// 	data.groupname = user.group;
			// else{
			// 	data.forEach(function(d){
			// 		d.groupname = user.group;
			// 	});
			// }
			// Regression.update(data).exec(function(err,data){
			// 	if(handlError(err)){
			// 			res.send(data);
			// 	}
			// });
		},
		destroy: function(req,res){
			var user = req.session.User;
			var id = req.param('id');
			Regression.findOne(id).exec(function(err,reg){
				if(handleError(err)){
					if(reg.groupname === user.group){
						Regression.destroy(id).exec(function(err,data){
							if(handleError(err)){
								res.send(data);
							}
						});
					}else{
						res.send({err:'Incorrect Permissions'},404);
					}
				}
			});
		},
};
