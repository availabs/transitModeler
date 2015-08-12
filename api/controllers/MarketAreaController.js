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

function getCensusData(marketarea,table,cb){
    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a' +
          ' join tl_2013_34_tract as b on a.geoid = b.geoid' +
          ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

module.exports = {

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
				console.log('ogr format',er,buf);
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

};
