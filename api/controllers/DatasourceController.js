'use strict';
/**
 * DatasourcesController
 *
 * @description :: Server-side logic for managing datasources
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var models = require('../../config/models'),
	_ = require('lodash'),
	connections = require('../../config/connections');
	var connection = connections.connections[models.models.connection];
	//console.log('testing',models.models.connection,connections.connections[models.models.connection])

var database = {
	host: connection.host ? connection.host : 'lor.availabs.org' ,
	port: connection.port ? connection.port : '5432',
	user: connection.user ? connection.user :'postgres',
	password: connection.password ? connection.password :'transit',
	database: connection.database ? connection.database : 'transitModeler'
};

var getCensusData = function(marketarea,table,cb){

    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a'
          + ' join tl_2013_34_tract as b on a.geoid = b.geoid'
          + ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

var preserveProperties = function(feature) {
  return feature.properties;
}

var topojson = require('topojson');

module.exports = {

	getACS:function(req,res){
		if(!req.param('year')){
			res.send('{status:"error",message:"Must send 4 digit [year] of data."}',500);
		}
	    var censusTable = 'acs5_34_'+req.param('year')+'_tracts';

	    //Allow user to specify census table
	    MarketArea.findOne(req.param('marketareaId')).exec(function(err,ma){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
	        getCensusData(ma,censusTable,function(census){
	          res.json({census:census})
	        })
	    })

 	},

 	getRoutes:function(req,res){
		if(!req.param('tablename')){
			res.send('{status:"error",message:"Must send gtfs tablename."}',500);
		}

		var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+req.param('tablename')+'.routes';

	    Datasource.query(sql,{},function(err,data){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}

	      var output = data.rows;
	      return res.json(output);

	    });

	},

	getSurvey:function(req,res){
		var maId = req.param('marketareaId')

		if(!maId){
			 res.send({status: 500, error: 'You must supply marketarea Id.'}, 500);
	      	return;
		}

		MarketArea.findOne(maId).exec(function(err,ma){
	    	if(err){console.log('find datasource error',err)}

			var zones = JSON.stringify(ma.zones).replace(/\"/g,"'").replace("[","(").replace("]",")")

			var sql = 	'SELECT * ' +
						'FROM survey_geo_full ' +
						'join survey_attributes on survey_attributes.id = survey_geo_full.id ' +
						'where "o_geoid10" in '+zones+' or "d_geoid10" in '+zones ;

			//console.log(sql)
			Datasource.query(sql,{},function(err,data){
		        if (err) {
		            res.send('{status:"error",message:"'+err+'"}',500);
		            return console.log(err);
		        }
		        var surveyGeo = {
			        	type:"FeatureCollection",
			        	features:[]
			    };

			    surveyGeo.features = data.rows.map(function(resp){
			    	return {
			    		type:'Feature',
			    		properties : resp,
			    		geometry : {
			    			type: 'MultiPoint',
			    			coordinates:[
			    				[resp.o_mat_long,resp.o_mat_lat],
			    				[resp.d_mat_long,resp.d_mat_lat]
			    			].filter(function(d){
			    				//console.log('f',d,!isNaN(parseInt(d[0])) && !isNaN(parseInt(d[1])) && parseInt(d[0]) !== 0 && parseInt(d[1]) !== 0);
			    				return !isNaN(parseInt(d[0])) && !isNaN(parseInt(d[1])) && parseInt(d[0]) !== 0 && parseInt(d[1]) !== 0;
			    			})
			    		}
			    	}

			    })

			    res.json(surveyGeo);

		    });
		});

	},

	getRouteGeo:function(req,res){
		var gtfs_id = req.param('id'),
	        route_id = req.param('route');


	    if (!(gtfs_id && route_id)) {
	      res.send({status: 500, error: 'You must supply a gtfs_id and route ID'}, 500);
	      return;
	    }

	    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
	    	if(err){console.log('find datasource error',err)}
	    	var sql = "SELECT route_id, route_color,route_short_name, route_long_name, ST_AsGeoJSON(geom) as the_geom " +
		              "FROM "+mgtfs.tableName+".routes " +
		              "WHERE route_short_name in " + JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");


		    Datasource.query(sql,{},function(err,data){
		        if (err) {
		            res.send('{status:"error",message:"'+err+'"}',500);
		            return console.log(err);
		        }
		        var routesCollection = {
		        	type:"FeatureCollection",
		        	features:[]
		    	};
		        console.time('processRouteGeography')
		        // for each result in the result set, generate a new geoJSON feature object
		        routesCollection.features = data.rows.map(function(route){
		            return {
		            	type:"Feature",
		            	geometry: JSON.parse(route.the_geom),
		            	properties:{
		            		route_id : route.route_id,
		            		short_name : route.route_short_name,
		            		long_name : route.route_long_name
		            	}
		            }
		        });
		        //console.log('Getting Data?',routesCollection.features.length);
		        var topology = topojson.topology(
		        	{routes: routesCollection},
		        	{
		        		"property-transform":preserveProperties,
		             	"quantization": 1e9
		            });

		        var newJson = {type:'FeatureCollection',features:[]};
		        //Topojson Mesh to Ensure No Duplication of Line Segments
		        topology.objects.routes.geometries.forEach(function(d){
		          var routeSwap = {type: "GeometryCollection", geometries:[d]}
		          var test = topojson.mesh(topology, routeSwap, function(a, b) { return a.properties; });
		          var feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
		          newJson.features.push(feature);
		        });
		        console.timeEnd('processRouteGeography')
		        //console.log(newJson);
		        res.send(newJson);
		    });
		});

  	},

  	getStopsGeo:function(req,res){
		var gtfs_id = req.param('id'),
	        route_id = req.param('route');


	    if (!(gtfs_id && route_id)) {
	      res.send({status: 500, error: 'You must supply a gtfs_id and route ID'}, 500);
	      return;
	    }

	    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
	    	if(err){console.log('find datasource error',err);}
			var routes = JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");
			var sql = 'SELECT distinct ST_AsGeoJSON(stops.geom) stop_geom,a.stop_num,a.line,a.fare_zone,stops.stop_id,stops.stop_code,stops.stop_name,stops.stop_desc,'+
								'stops.zone_id,stops.stop_url,R.route_short_name '+
								'FROM "'+mgtfs.tableName+'".stops '+
								'LEFT OUTER JOIN fare_zones AS a on stops.stop_code = a.stop_num '+
								'JOIN "'+mgtfs.tableName+'".stop_times AS ST on ST.stop_id = stops.stop_id ' +
								'JOIN "'+mgtfs.tableName+'".trips AS T on T.trip_id = ST.trip_id '+
								'JOIN "'+mgtfs.tableName+'".routes AS R on R.route_id = T.route_id '+
								'where (a.line IS NULL OR a.line IN '+routes+ ') AND R.route_short_name IN '+routes;

			console.log(sql);
            Datasource.query(sql,{},function(err,data){
                if (err) {
                    res.send({ status:500, error: err }, 500);
                    return console.log(err);
                }
                var stopsCollection = {
		        	type:"FeatureCollection",
		        	features:[]
		    	};
                var stops =[];
                data.rows.forEach(function(stop){
                  if(stops.indexOf(stop) == -1){
                    var Feature = {};
                    Feature.type="Feature";
                    Feature.geometry = JSON.parse(stop.stop_geom);
                    Feature.properties = {};
                    Feature.properties.stop_code = stop.stop_code;
                    Feature.properties.fare_zone = stop.fare_zone;
                    Feature.properties.line = stop.line || stop.route_short_name;
                    Feature.properties.stop_id = stop.stop_id;
										Feature.properties.stop_desc = stop.stop_desc;
										Feature.properties.stop_url = stop.stop_url;
										Feature.properties.stop_name = stop.stop_name;
										Feature.properties.zone_id = stop.zone_id;
                    stopsCollection.features.push(Feature);
                  }

                });
                //console.log(stopsCollection);
                res.json(stopsCollection);

            });

		});

  	},

  	getLODES: function(req,res){
  		var id = req.param('id')
		MarketArea.findOne(req.param('marketareaId')).exec(function(err,marketarea){
			var tracts = JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
			//w_geocode, h_geocode, s000,
			var sql = "SELECT h_geocode as from_tract,w_geocode as to_tract, s000 as est " +
			            "FROM lodes_34_2010_tracts " +
			            "WHERE  w_geocode in " + tracts + " and h_geocode in "+tracts;

			MarketArea.query(sql, {}, function(error, data) {
			    if (error) {
			          console.log("error executing "+sql, error);
			          res.send({status: 500, message: 'internal error'}, 500);
			          return;
			    }

			    res.send(data.rows);
			})
		});

  	},

	getCTPP: function(req, res) {
		var id = req.param('id')
		MarketArea.findOne(req.param('marketareaId')).exec(function(err,marketarea){
			var tracts = JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");

			var sql = "SELECT from_tract,to_tract, est, se " +
			            "FROM ctpp_34_2010_tracts " +
			            "WHERE to_tract in " + tracts + " or from_tract in "+tracts;

			MarketArea.query(sql, {}, function(error, data) {
			    if (error) {
			          console.log("error executing "+sql, error);
			          res.send({status: 500, message: 'internal error'}, 500);
			          return;
			    }

			    res.send(data.rows);
			})
		});
	},
	//---------------------ACS Create Delete-----------------------------------------
	deleteACS:function(req,res){

		Datasource.findOne(req.param('id')).exec(function(err,found){

			var query = 'DROP TABLE public."'+found.tableName+'"';


			Datasource.query(query,{} ,function(err, result) {
				if(err) { console.error('error running query:',query, err); }

				Datasource.destroy(found.id).exec(function(err,destroyed){
					if(err) { console.log(err); res.json({error:err}); }

					res.json({'message':'Record '+found.id+' deleted.'})

				});

			});

		});

	},
	loadACSData:function(req,res){
		var state=req.param('state'),
		dataSource=req.param('dataSource'),
		year=req.param('startYear'),
		sumlevel=req.param('sumLevel');

		console.log('Datasource.loadData',state,dataSource,year,sumlevel)

		Datasource //Check to see if this data set has been loaded
		.find({ stateFips:state})
		.exec(function(err,data){
			console.log(err,data);

			data = data.filter(function(d){
				return d.stateFips == state && d.settings.year == year && d.settings.level == sumlevel;
			})
			console.log(err,data);
			if(data.length > 0){// the data source does exist, refuse to load.
				var flashMessage = [{
					name:"Data Exists",
					message: "This dataset has already been loaded"
				}];

				req.session.flash = {
					err: flashMessage
				}


				res.json({responseText:'ACS dataset already exists.'+state+' '+year+'.'});

			}else{//the data source doesn't exists

				Job.create({
					isFinished:false,
					type:'load ACS',
					info:[{'state':state,'dataSource':dataSource,'year':year,'sumlevel':sumlevel}],
					status:'Started'
				})
				.exec(function(err,job){
					if(err){console.log('create job error',err)
						req.session.flash = {
							err: err
						}
						res.json({responseText:'ACS Job Create Error'});
						return;
					}
					sails.sockets.blast('job_created',job);

					var flashMessage = [{
						name:"Test",
						message: "job created "+job.id,
					}];

					spawnACSJob(job);

					req.session.flash = {
						err: flashMessage
					}

					res.json({responseText:'ACS Job Created'});
					return;

				})
			}

		})//Check for data source
	},

	deleteGtfs : function(req,res){
		var victimId = parseInt(req.param('id')); //get the id of the gtfs set to be deleted
		console.log(victimId);
		if(!victimId){
			res.send('{"error":"No datasource id"}',500); //if no such id then fail
		}
		Datasource.find({type:'gtfs'}).exec(function(err,data){ //find all gtfs sets
			if(err){
				res.send(JSON.stringify(err),500); // if error fail
				return;
			}
			var victim = data.filter(function(d){return d.id===victimId;})[0]; //get the one record to be deleted

			if(typeof victim === 'undefined'){   //if it doesn't exist
				res.send('{"error":"No Such DataSource"}',500); //fail
				return;
			}
			//If it was an uploaded dataset we take special precaution before deleting
			if(victim.settings.readOnly && victim.settings.uploaded && !(req.param('passwordasdfasdwerwe'))){
				res.send('{"error":"Requires PassKey"}',500);
				return;
			}
			//construct query to get the union of all the shortNames in all the datasets except the current one
			var query = data.filter(function(d){return d.id !==victimId;})
											.map(function(d){return 'SELECT route_short_name FROM "'+ d.tableName +'".routes ';})
											.reduce(function(p,c){return p+' UNION '+c;});
			console.log('made it');
			Datasource.query(query,{},function(err,data){ //query the database for them
				if(err){
					res.send(JSON.stringify(err),500);
					return;
				}
				var keepRoutes = data.rows.map(function(d){return d.route_short_name;});//collect the just the short names
				var victimQuery = 'Select route_short_name FROM "'+victim.tableName+'".routes'; //select the routes from only the victim
				Datasource.query(victimQuery,{},function(err,data){
					if(err){
						res.send(JSON.stringify(err),500);
						return;
					}
					var victimRoutes = data.rows.map(function(d){return d.route_short_name;}); //collect just the short names
					var marketareaVics = _.difference(victimRoutes,keepRoutes); //take the set difference between those of the victim and all others
					MarketArea.find().exec(function(err,data){ //get all market areas

						data = data.map(function(d){
							var gtfsid = d.origin_gtfs;
							if(d.origin_gtfs === victimId){
								gtfsid = 1;
							}
							return {routes:d.routes,id:d.id,origin_gtfs:gtfsid};}); //we only currently care about its id and its routes
						data.forEach(function(d){d.routes = _.difference(d.routes,marketareaVics);}); //for each market area remove the appropriate routes
						var temp = data.map(function(d){return 'UPDATE marketarea SET routes=\''+JSON.stringify(d.routes)+'\',origin_gtfs='+d.origin_gtfs+' WHERE id='+d.id;});
						var q = (temp.length === 0) ? '' : temp.reduce(function(p,c){return p+';'+c;}); //create query string to update them
						MarketArea.query(q,{},function(err,data){
							if(err){
								res.send(JSON.stringify(err),500);
								return;
							}
							//after updating the marketareas
							console.log("Made it to the cleaner"); //drop the schema and tables that contained its data
							var cleaningQuery = 'DROP SCHEMA IF EXISTS "'+victim.tableName + '" CASCADE;';
							cleaningQuery += 'DELETE FROM datasource where id = ' + victimId + ';'; //and remove it from the list of available datasources
							console.log(cleaningQuery);
							Datasource.query(cleaningQuery,{},function(err,data){ //execute query
								if(err){
									res.send(JSON.stringify(err),500);
								}
								res.json(data);
							});
						});

					});
				});
			});
		});
	},
};

//--------------------------------------------------------
function spawnACSJob(job){
	var terminal = require('child_process').spawn('bash');
	var current_progress = 0;
	var settings = {
	 		dataSource: job.info[0].dataSource,
  	 		year:job.info[0].year,
  	 		level:job.info[0].sumlevel
  	 	},
  	 	acsEntry = {
		tableName:'',
		type:'acs',
  	 	stateFips:job.info[0].state,
	 	settings:[settings]
  	}

  	terminal.stdout.on('data', function (data) {
	    data = data+'';
	    if(data.indexOf('tableName') !== -1){
	    	console.log('table-name',data.split(":")[1]);
	    	acsEntry.tableName = data.split(":")[1];
	    }
	    else if(data.indexOf('status') !== -1){
	    	console.log('status',data.split(":")[1]);
	    	Job.update({id:job.id},{status:data.split(":")[1],progress:0})
    		.exec(function(err,updated_job){
    			if(err){ console.log('job update error',error); }
    			sails.sockets.blast('job_updated',updated_job);
    		});
	    	current_progress =0;
	    }
	    else if(data.indexOf('progress') !== -1){

	    	if(data.split(":")[1] !== current_progress){
	    		current_progress = data.split(":")[1]
	    		console.log(current_progress);
	    		Job.update({id:job.id},{progress:current_progress})
    			.exec(function(err,updated_job){
    				if(err){ console.log('job update error',error); }
    				sails.sockets.blast('job_updated',updated_job);
    			});
	    	}
	    }
	    else{
	    	console.log('error probably',data)
	    }
	});

	terminal.on('exit', function (code) {
		code = code*1;
	    console.log('child process exited with code ' + code);
	    if(code == 0){

	    	Job.findOne(job.id).exec(function(err,newJob){
	    		if(err){ console.log('Job check err',err);}

	    		if(newJob.status != 'Cancelled'){

			    	Datasource.create(acsEntry)
				    .exec(function(err,newEntry){
				    	if(err){ console.log('Datasource create error',err);}

					    Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
						.exec(function(err,updated_job){
							if(err){ console.log('job update error',err); }
							sails.sockets.blast('job_updated',updated_job);
						});
					});
				}else{
					console.log('Exit from Job Cancel');
				}
			});

		}else{
			Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Failure'})
			.exec(function(err,updated_job){
				if(err){ console.log('job update error',error); }
				sails.sockets.blast('job_updated',updated_job);
			});
		}
	});

	setTimeout(function() {
		console.log('php -f php/loadacs.php '+database.host+' '+database.port+' '+database.database+' '+database.user+' '+database.password+' '
	    	+' '+job.info[0].state
	    	+' '+job.info[0].dataSource
	    	+' '+job.info[0].year
	    	+'\n');
	    terminal.stdin.write('php -f php/loadacs.php '+database.host+' '+database.port+' '+database.database+' '+database.user+' '+database.password+' '
	    	+' '+job.info[0].state
	    	+' '+job.info[0].dataSource
	    	+' '+job.info[0].year
	    	+'\n');

	    Job.update({id:job.id},{pid:terminal.pid}).exec(function(err,updated_job){
	    	if(err){ console.log('job update error',error); }
			sails.sockets.blast('job_updated',updated_job);
	    })

	    terminal.stdin.end();
	}, 1000);
}
