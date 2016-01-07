module.exports =
function(model,action,params,req,res){
    var user = req.session.User;
    var crup = req.body;
    switch (action){
      case 'find':
      var where = params||'';
      console.log(where);
      var modelaction = model[action](where);
      modelaction.exec(function(err,data){
          if(err){
            console.log(err);
            res.send(err,500);
          }
          res.send(data);
        });
        break;
      case 'create':
    		crup[params] = user.group;
    		model[action](crup).exec(function(err,data){
    			if(err){
    				console.log(err);
    				res.send(err,500);
    			}
    			res.send(data);
    		});
      break;
      case 'update':
        crup[params] = user.group;
        model[action](crup).exec(function(err,data){
          if(err){
            console.log(err);
            res.send(err,500);
          }
          res.send(data);
        });
      break;
      case 'destroy':
        var id = req.param('id');
        model.findOne(id).exec(function(err,datum){
          if(err){
            console.log(err);
            res.send(err,500);
          }
          if(datum[params] === user.group){
            model[action](id).exec(function(err,data){
              if(err){
                console.log(err);
                res.send(err,500);
              }
              res.send(data);
            });
          }
        });
      break;
    default:
      res.send({err:'Error no such method'});
    }
};
