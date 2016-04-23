/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing landings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var topojson = require('topojson');
var ogr2ogr = require('ogr2ogr');
var fs = require('fs');
var acs_data = require('./utils/acsData');
var mkdirp = require('mkdirp');
var d3     = require('d3');
var _ = require('lodash');
var request = require('request');
var tractApp = require('../../appconfig').tractApp;
function getCensusData(marketarea,table,cb){
    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a' +
          ' join tl_2013_34_tract as b on a.geoid = b.geoid' +
          ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

var api = {

	acsDownload : function(req,res){
		var filename = req.param('file');
		if(!filename){
			res.send('{"Error":"no Filename","message":"couldn\'t retrieve file"}',500);
		}else{
				res.download('.tmp/public/data/acs/'+filename);
		}

	},
	geoJsonToShp : function(req,res){
		var geoOutput = {type:"FeatureCollection",features:[]},
				finalGeo = {type:"FeatureCollection",features:[]};

		if(typeof req.param('geoData') === 'undefined'){
			console.log('no json');
			res.json({responseText:'Error - no json specified'});
		}
		var geoData = req.param('geoData');
		var state_id = geoData.state || 34;

		var censusTracts = JSON.parse(fs.readFileSync('assets/geo/states/' + state_id +'/tracts.json'));
		censusTracts = topojson.feature(censusTracts,censusTracts.objects.tracts);
		censusTracts.features.forEach(function(feat){
			if(geoData.zones.indexOf(feat.properties.geoid) > -1){
				geoOutput.features.push(feat);
			}
		});
		getCensusData(geoData,geoData.outputName,function(census){
			var acs = {};
			census.forEach(function(tract){
				acs[tract.geoid] = {};
				for(var census_var in acs_data.census_vars){
					var value = 0;
					for(var x = 0; x < acs_data.census_vars[census_var].vars.length; x++){
						value +=tract[acs_data.census_vars[census_var].vars[x]]*1;
					}
					acs[tract.geoid][census_var] = value;
				}
			});

			geoOutput.features.forEach(function(feat,i){
				for(var key in acs_data.census_vars){
					feat.properties[key] = 0;
					if(typeof acs[feat.properties.geoid] != 'undefined'){
						feat.properties[key] += acs[feat.properties.geoid][key];
					}
				}
				feat.properties.emp_den = feat.properties.employment / (feat.properties.aland*0.000000386102159);
        feat.properties.pop_den = feat.properties.total_population / (feat.properties.aland*0.000000386102159);
        finalGeo.features.push(feat);
			});
			var ogr = ogr2ogr(finalGeo);
			var data = geoData.json;
			ogr.format('shp').exec(function(er,buf){
				//console.log('ogr format',er,buf);
				if(er) return res.json({errors: er.message.replace('\n\n','').split('\n')});
				console.log(process.cwd());
				var writeFunc = function(){
					fs.writeFile('.tmp/public/data/acs/'+geoData.name+'_'+geoData.outputName+'.zip',buf,function(err){
						if(err){
							console.log(err);
						}else{
							res.json({url:'/data/acs/'+geoData.name+'_'+geoData.outputName+'.zip'});
						}
					});
				};
				if(fs.existsSync('.tmp/public/data/acs')){
					writeFunc();
				}else{
					mkdirp('.tmp/public/data/acs',function(err){
						if(err){
							console.log(err);
						}else{
							writeFunc();
						}
					});
				}
			});
		});
	},

  find : function(req,res){

      User.findOne(req.session.User.id)
          .populate('marketareas')
          .exec(function(err,user){
            if(err){
              console.log(err);
              return res.send(JSON.stringify(err),500);
            }
            res.send(JSON.stringify(user.marketareas));
      });
  },

  findOne : function(req,res){
    User.findOne(req.session.User.id)
        .populate('marketareas')
        .exec(function(err,user){
          if(err){
            console.log(err);
            return res.send(JSON.stringify(err),500);
          }
          //console.log(user.marketareas.map(function(d){return d.id;}));
          var ma = user.marketareas.filter(function(d){
            return d.id === parseInt(req.param('id'));
          });
          if(ma.length > 0){
            res.send(ma[0]);
          }else{
            res.send({});
          }
        });
  },

  update : function(req,res){
      if(req.session.User){
	 
	 
	  MarketArea.update(req.body.id,req.body).exec(function(err,MA){
	     
	      if(err){
		  console.log(err);
		  return res.send(JSON.stringify(err),500);
	      }
	 
	      api.cacheData(req,MA[0],res);
	  });
      }
      else{
	  res.send('Authentication Error');
      }
  },

  create : function(req,res){
    if(req.session.User){
      console.log('Attempted Creation',req.body);
      MarketArea.create(req.body).exec(function(err,MA){
          if(err){
            console.log(err);
            return res.send(JSON.stringify(err),500);
          }
          MA.users.add(req.session.User.id);
          MA.save(console.log);
          // create marketarea cache
          api.cacheData(req,MA,res);
      });
    }else{
      res.send('Authentication Error');
    }

  },

    cacheData:  function(req,MA,res){
	var groupname = req.session.User.group;
	var path = 'assets/geo/groups/'+groupname;
	if(!fs.existsSync(path)){
	    fs.mkdirSync(path);
	}
	//Create get queries for the api requests
	var countyQ = '?'+MA.routes.map(function(rid){return 'rid[]='+rid;}).join('&');
	var tractQ  = '?'+_.uniq(MA.counties).map(function(tid){return 'cid[]='+tid;}).join('&');
	//fetch counites
	Datasource.findOne(MA.origin_gtfs).exec(function(err,ds){
	    var url = tractApp+'agency/'+ds.settings[0].agencyid+'/county/route'+countyQ;

	    console.log(url);
	    request(url,function(err,resp,data){
		if(err){console.log('Error Getting Counties');}
		fs.writeFile('/tmp/counties.txt',data);
		
		fs.writeFile(path+'/'+MA.id+'counties.json',JSON.stringify(JSON.parse(data)),function(err,data){
		    //fetch tracts
		    var url = tractApp+'tract/county'+tractQ;
		    console.log(url);
		    request(url,function(err,resp,data){
			if(err){console.log('Error Getting Tracts',err);}
		
			fs.writeFile(path+'/'+MA.id+'tracts.json',JSON.stringify(JSON.parse(data)),function(err,data){
			    console.log("No Errors updated geo files for:",MA.id);
			    if(res && res.send)
				res.send(MA.toJSON());

			    
			});
		    });
		});
	    });
	});
	
    },
};

module.exports = api;
