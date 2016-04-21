/**
 * JobController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    find : function(req,res){
      var user = req.session.User;
      var where = {skip:req.param('skip')||0,sort:req.param('sort'),limit:req.param('limit')};
      //console.log(user);
      if(user.admin && user.userGroup.type==='sysAdmin'){
        Jobs.find(where).exec(function(e,data){
          if(e){
            console.log(e);
            res.send(e,500);
          }else{
            res.send(data);
          }
        });
      } else if(user.admin){
        //console.log('made it to admin space');
        Usergroup.findOne(user.userGroup.id).populate('jobs',where).exec(function(err,group){
          if(err){
            console.log(err);
            res.send(err,500);
          }else{
            res.send(group.jobs);
          }
        });
      }else{
        User.findOne(user.id).populate('jobs',where).exec(function(err,user){
          if(err){
            console.log(err);
            res.send(err,500);
          }else{
            res.send(user.jobs);
          }
        });
      }
    },
};
