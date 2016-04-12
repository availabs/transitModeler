
/**
* MarketArea.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

// var request = require('request');
// var tractApp = require('../../appconfig').tractApp;
// var fs = require('fs');
module.exports = {
  migrate:'safe',
  attributes: {
  	name:'STRING',
  	geounit: 'STRING',
  	zones : 'ARRAY',
	counties : 'ARRAY',
	routes : 'ARRAY',
	center : 'ARRAY',
	origin_gtfs:'INTEGER',
	stateFips:'ARRAY',
  routecolors:'json',
  description:'STRING',
  users: {
      collection:'user',
      via:'marketareas',
    }
  },

/*  afterUpdate : function(values,next){
    console.log('MyValues',values);
    MarketArea.findOne(values.id).populate('users').exec(function(err,ma){
      if(err){
        console.log(err);
        next();
      }
      console.log('users',ma.users);
      if(ma.users.length > 0){
        var groupname = ma.users[0].group;
        var path = 'assets/geo/groups/'+groupname;
        if(!fs.existsSync(path)){
          fs.mkdirSync(path);
        }
        //Create get queries for the api requests
        var countyQ = '?'+ma.routes.map(function(rid){return 'rid[]='+rid;}).join('&');
        var tractQ  = '?'+ma.counties.map(function(tid){return 'cid[]='+tid;}).join('&');
        //fetch counites
        Datasource.findOne(ma.origin_gtfs).exec(function(err,ds){
          var url = tractApp+'agency/'+ds.settings[0].agencyid+'/county/route'+countyQ;
          console.log(url);
          request(url,function(err,resp,data){
            if(err){console.log('Error Getting Counties'); next();}
            console.log(data);
            fs.writeFile(path+'/'+ma.id+'counties.json',JSON.stringify(JSON.parse(data)),function(err,data){
              //fetch tracts
              var url = tractApp+'tract/county'+tractQ;
              console.log(url);
              request(url,function(err,resp,data){
                if(err){console.log('Error Getting Tracts',err); next();}
                console.log(data);
                fs.writeFile(path+'/'+ma.id+'tracts.json',JSON.stringify(JSON.parse(data)),function(err,data){
                  next();
                });
              });
            });
          });
        });
      }else{
          next();
      }
    });
  },
*/
};
