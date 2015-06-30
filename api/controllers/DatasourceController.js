'use strict';
/**
 * DatasourcesController
 *
 * @description :: Server-side logic for managing datasources
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var models = require('../../config/models'),
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
	    	if(err){console.log('find datasource error',err)}

			var sql = 'SELECT ST_AsGeoJSON(stops.geom) stop_geom,a.stop_num,a.line,a.fare_zone,stops.stop_id,stops.stop_code ' +
                      'FROM "'+mgtfs.tableName+'".stops  ' +
                      'LEFT OUTER JOIN fare_zones AS a on stops.stop_code = a.stop_num ' +
                      'where a.line IS NULL OR a.line IN '+ JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");

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
                    Feature.properties.stop_id = stop.stop_id;

                    stopsCollection.features.push(Feature);
                  }

                });
                //console.log(stopsCollection);
                res.json(stopsCollection);

            });

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
	}
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
