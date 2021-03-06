/**
 * GTFSController
 *
 * @description :: Server-side logic for managing landings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
/*globals confirm, console,module,require*/
/*jshint -W097*/
var topojson = require('topojson');
var db = require('../support/editutils');
var Stop = require('../../assets/react/components/gtfs/Gtfsutils').Stop;
var RouteObj = require('../../assets/react/components/gtfs/Gtfsutils').RouteObj;
var exec = require('child_process').exec;
var BasicRoute = function(id){
	this.id = id;
	this.shortName = '';
	this.trips = [];
	this.addTrip = function(trip){
		this.trips.push(trip);
	};
};

function preserveProperties(feature) {
  return feature.properties;
}


var BasicTrip = function(id,route_id){
	this.id = id;
	this.route_id = route_id;
	this.route_short_name = '';
	this.service_id = '';
	this.intervals = [];
	this.start_times = [];
	this.stop_times  = [];
	this.tripids     = [];
	this.headsign = '';
	this.stops = [];
	this.direction_id = -1;
	this.addInterval = function(start,stop){
		this.start_times.push(start);
		this.stop_times.push(stop);
		this.intervals.push([start,stop]);
		if(this.start_times.length !== this.stop_times.length)
			console.log("Interval ERROR");
	};

};

var longProcessStatus = {status:0};
module.exports = {
	//id, day
	getSimpleSchedule : function(req,res){
		var gtfs_id = req.param('id'),
        route_id = req.param('route');


	    if (!(gtfs_id && route_id)) {
	      res.send({status: 500, error: 'You must supply a gtfs_id and route ID'}, 500);
	      return;
	    }

	    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
	    	if(err){console.log('find datasource error',err);}
	    	var datafile = mgtfs.tableName;
	    	var route_short_names = JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");

		  	var sql = 'Select T2.route_short_name, T2.service_id, T2.direction_id,T2.shape_id,T2.trip_headsign,T2.stops, array_agg(T2.starting ORDER BY T2.starting)as starts,T2.route_id, array_agg(T2.ending ORDER BY T2.starting) as ends, array_agg(T2.trip_id ORDER BY T2.starting) as trips from ( '
					+'SELECT MIN(ST.departure_time)as starting,MAX(ST.arrival_time)as ending, T.shape_id, R.route_short_name, '
		  			+'T.trip_headsign,T.route_id, T.service_id, T.trip_id,T.direction_id, array_agg(ST.stop_id Order By ST.stop_sequence) as stops '
					+'FROM \"'+datafile+'\".trips as T '
					+'JOIN \"'+datafile+'\".stop_times as ST '
					+'ON T.trip_id = ST.trip_id '
					+'JOIN \"'+datafile+'\".calendar as C '
					+'ON T.service_id = C.service_id '
					+'JOIN \"'+datafile+'\".routes as R '
					+'ON T.route_id=R.route_id '
					+'WHERE R.route_short_name in '+ route_short_names + ' '
					+'Group By T.trip_id, R.route_short_name '
					+'Order By T.route_id,R.route_short_name, starting, T.trip_id,T.trip_headsign '
					+') as T2 '
					+'Group By T2.direction_id,T2.shape_id,T2.service_id,T2.stops,T2.route_id,T2.route_short_name,T2.trip_headsign;';
					//console.log(sql);
			Agencies.query(sql,{},function(err,data){
				if(err)
				    {
					console.log(err);
					res.send('{status:"error",message:"Upload Failed"}',500);
				    }

					var Routes = {};
					var trips = {};
					data.rows.forEach(function(trip){
						var id = trip.shape_id;
						var stops = trip.stops;
						trips[id] = trips[id] || new BasicTrip(id,trip.route_id);
						trips[id].route_short_name = trip.route_short_name;
						for(var i = 0; i < trip.starts.length; i++){
							trips[id].addInterval(trip.starts[i],trip.ends[i]);
						}
						trips[id].tripids = trip.trips;
						trips[id].headsign = trip.trip_headsign;
						trips[id].stops = stops;
						trips[id].direction_id = trip.direction_id;
						trips[id].service_id = trip.service_id;
					});

					Object.keys(trips).forEach(function(trip_id){
						var trip = trips[trip_id];
						var rid = trip.route_id;
						Routes[rid] = Routes[rid] || new BasicRoute(rid);
						Routes[rid].shortName = trip.route_short_name;
						Routes[rid].addTrip(trip);
					});
					Object.keys(Routes).forEach(function(rid){//sort the trips in the schedule by direction
						Routes[rid].trips.sort(function(a,b){
							return a.direction_id - b.direction_id;
						});
					});
					res.json(Routes);
		  	});

		});
	},

	uploadFreqEdits : function(req,res){
		var freqData = req.body;
		var agency = req.param('id');
		if(typeof agency === 'undefined')
			res.send('{status:"error",message:"Missing parameter:id. (Agency)"}',500);
		Datasource.findOne(agency).exec(function(err,agency){
			db.putFrequencies(agency.tableName,freqData,function(err,data){
				if(err) {
					console.log(err);
					res.send('{status:"error",message:"Upload Failed"}',500);
				}else{
					res.json({status:'success',message:data});
				}
			});
		});


	},

	uploadGtfsEdits: function(req,res){
		var reqobj = req.body;
		var agency = req.param('id');
		var featList = reqobj.data
		.map(function(d){
				return new Stop(d.stop);
			});
		var route = new RouteObj(reqobj.route);
		//console.log('route obj',route);
		
		var trips = reqobj.trip_ids;
		var deltas = reqobj.deltas;
		var errlist=[],datalist=[];
		var trip = reqobj.trip, route_id = trip.route_id;
		var shape = reqobj.shape;
		var maId = reqobj.maId;
		var freqs = reqobj.frequencies || [];
	        var freqKills = reqobj.killFrequencies || [];
		if(typeof agency === 'undefined'){
			res.send('{status:"error",message:"Missing parameter:id. (Agency)"}',500);
		}
		if(typeof featList === 'undefined'){
			res.send('{status:"error",message:"Missing parameter:geometry"}', 500);
		}

		Datasource.findOne({id:agency}).exec(function(err,data){
			debugger;
			if(err){ console.log(err); return;}
			//console.log(data);
			db.putData(agency,featList,trips,deltas,route_id,route,shape,trip,freqs,freqKills,maId,function(err,data){
				if(err){
					console.log(err);
					res.json(err);
				}
				else{
					console.log("Successful Edit Upload");
					res.json({status:'success'});
				}
			});
		});

	},
	//added to api for debugging purposes
	routes: function(req,res){

		var rid = req.param('rid');
	 	Datasource.findOne(req.param('id')).exec(function (err, agency) {
		  	var routesCollection = {};
		  	routesCollection.type = "FeatureCollection";
		  	routesCollection.features = [];
		  	var sql = 'select ST_AsGeoJSON(geom) as route_shape,route_id,route_short_name,route_long_name,route_color from "'+agency.tableName+'".routes'
		  	if(rid){
					sql += " WHERE route_id='" + rid + "'";
				}
				Agencies.query(sql,{},function(err,data){
		  		if (err) {
		       res.send('{status:"error",message:"'+err+'"}',500);
		       return console.log(err);
		      }
		      data.rows.forEach(function(route,index){
		  			var routeFeature = {};
		  			routeFeature.type="Feature";
		  			routeFeature.geometry = JSON.parse(route.route_shape);
		  			routeFeature.id = index;
		  			routeFeature.properties = {};
		  			routeFeature.properties.route_id = route.route_id;
		  			routeFeature.properties.route_short_name = route.route_short_name;
		  			routeFeature.properties.route_long_name = route.route_long_name;
		  			routeFeature.properties.route_color = route.route_color;
		  			routesCollection.features.push(routeFeature);
		  		});
		  		if(req.param('format') == 'geo'){
		  			//JSON.stringify();
		  			res.send(routesCollection);
		  		}else{
		  			var topology = topojson.topology({routes: routesCollection},{"property-transform":preserveProperties});
		  			 var newJson = {type:'FeatureCollection',features:[],bbox:topology.bbox,transform:topology.transform}
		  			 topology.objects.routes.geometries.forEach(function(d){
		  			 	var routeSwap = {type:"GeometryCollection",geometries:[d]};
		  			 	var mesh = topojson.mesh(topology, routeSwap,function(a,b){return true;});
		  				var feature = {type:'Feature',properties:d.properties, geometry:{type:mesh.type, coordinates:mesh.coordinates}};
		  			 	newJson.features.push(feature);
		  			 })
					// res.send(topology);
		  			res.send(newJson);
		  			//JSON.stringify()

		  		}

		  	});
	  	});
	},

	getFrequencies : function(req,res){
		var body = req.body;
		debugger;
		if(!body.trip_ids){
			 res.send('{status:"error",message:"Need Trip Ids"}',500);
		}
		if(!body.id){
			res.send('{status:"error",message:"Need Agency Id"}',500);
		}
		Datasource.findOne({id:body.id}).exec(function(err,data){
			debugger;
			if(err){console.log('error finding agency'); res.send('{status:"error",message:"'+err+'"}',500);}
			var idString = 'Array['+body.trip_ids.map(function(str){return '\''+str+'\'';})+']',
			tableName = data.tableName,
			sql = 'SELECT trip_id,start_time,end_time,headway_secs FROM '+tableName+'.frequencies ' +
						'WHERE '+idString +' && string_to_array(trip_id,\',\') ORDER BY start_time';

			Agencies.query(sql,{},function(err,data){ //if there is an error with the query logg and send it
				if(err){console.log('Error Executing query'); res.send('{status:"error",message:"'+err+'"}',500);}

				data.rows.forEach(function(d){//if rows were returned process them
					d.group = d.trip_id.split(',');
				});
				res.json(data.rows);
			});
		});

	},

	backupSource   : function(req,res){
		var user = req.session.User;
		var name = req.body.name,
		fips = req.body.fips || [],
		settings = req.body.settings || {},
		dsID = parseInt(req.param('id'));
		savedata = req.body.savedata;
		//console.log('dsID',dsID);

		if(typeof name === 'undefined'){
			res.send('{status:"error",message:"Error Need New Edit Name"}',500);
		}
		//First query the database to check if the table name exists;
		Datasource.find({type:'gtfs'}).sort('id').exec(function(err,data){

			//console.log(err,data);
			var chk = data.filter(function(d){//collect those with the same name
				return d.tableName === ('gtfs_edit_'+name);
			});
			//console.log(data);
			var source = data.filter(function(d){
				//console.log('obj',d);
				//console.log('truth value',d.id === dsID);
					return d.id === dsID;
			})[0].tableName;

			//console.log(err,data);
			if(chk.length >0){ //if that schema already exists
				var flashMessage = [{
					name:'Data Exists',
					message: 'That Name is already present'
				}];
				req.session.flash={err:flashMessage}; //disregard the request
				res.json({status:'error',responseText:'Gtfs dataset already exists.' + name+'.'});

			}else{//if it is not present

				Job.create({
					isFinished:false,	//initialize job object
					type:'clone gtfs',
					info:[{'state':fips,'name':name}],
					status:'Started'
				})
				.exec(function(err,job){//start the job
					if(err){
						console.log('create job error',err);
						req.session.flash={
							err:err
						};
						res.json({responseText:'GTFS Job Clone Error'});
						return;
					}
					sails.sockets.blast('job_created',job); //notify client of started process;
					var flashMessage = [{
						name:'gtfsclone',
						message:'job created '+job.id,
					}];
					//Do the cloning
					var names = {clone:name,source:source},
					config = {fips:fips,settings:settings};
					spawnGtfsClone(job,names,config,savedata,user);
					req.session.flash={
						err:flashMessage
					};
					res.json({status:'success',responseText:'GTFS Job Created'});
				});
			}
		});
	},

	downloadGtfs   : function(req,res){
	    var tableName = req.param('name');
	    req.session.User.isDownloading = true;
	    exec('node ./api/support/gtfsExport.js ' + tableName ,function(err,sout,serr){
		if(err){
		    console.log(err);
		    res.send('{status:"Error", message:"Internal Server Failure"}',500);
		}else{
		    //if(sout) console.log('stdout : ',sout);
		    if(serr){
			console.log('stderr : ',serr);
			res.send('{status:"Error", message:"Internal Server Failure"}',500);
		    }
		    else{
			console.log('generated');
			res.download('./api/support/gtfsFiles/gtfsFiles.zip',tableName + '.zip',function(err){
			    if(err)
				console.log(err);
			});
		    }
		}
	    });
	}
};


function spawnGtfsClone(job,names,config,savedata,user){
	var exec = require('child_process').exec;
	var current_progress = 0;
	var backupName = 'gtfs_edit_'+names.clone.toLowerCase();//set the name of the gtfs file
	//First put the entry in the datasource table;

	var DS = {
		type:'gtfs',
		tableName:backupName,
		stateFips:config.fips,
		settings:[config.settings],
	};
	console.log('uploaded settings',config.settings);
	// var DSsql = 'INSERT INTO datasource(type,"tableName","stateFips",settings,"createdAt","updatedAt") Values ';
	// DSsql += '(\'gtfs\',\''+backupName+'\',\''+config.fips+'\',\''+JSON.stringify(config.settings)+'\',now(),now());';
	var schemaSQL = 'DROP SCHEMA IF EXISTS "'+backupName+'" CASCADE;'; //destroy the schema if it already exists
	schemaSQL += 'SELECT clone_schema(\''+names.source+'\',\''+backupName+'\');'; //clone the source schema
	//Add this entry to the datasources table

	var onFinish = function(){
		Job.update({id:job.id},{status:'Building Frequencies',progress:50}).exec(function(error,updated_job){ //update the state of the job to being 50% done
			if(error){console.log('job update error',error); return;}
			sails.sockets.blast('job_updated',updated_job); //update the client
						if(savedata && Object.keys(savedata).length > 0){
							save(job,backupName,savedata);
						}
		});
	};

	var updateDatasource = function(data1,cb,newDS){
		var query2 = 'SELECT * FROM datasource WHERE "tableName" = \''+backupName+'\'';
		Datasource.query(query2,{},function(err,data){
			if(err){
				console.log(err);
			}
			
			
			var settings = JSON.parse(data.rows[0].settings);
			if(typeof settings.length !== 'undefined')
			{
				settings = settings[0];
			}
			var agency_name = data1.rows[0].agency_name;
			var newAgency = {
				tablename:backupName,
				agencyname: agency_name + '_'+names.clone.toLowerCase(),
			};
			settings.started = data1.rows[0].min;
			settings.agency = agency_name;


			Agencies.create(newAgency).exec(function(err,agData){
				if(err) console.log(err);
				settings.agencyid = agData.id;
				
				newDS.settings[0] = settings;
				
				newDS.groups.add(user.userGroup.id);
				newDS.save(function(err){
					if(err) console.log(err);
					console.log(newDS);
					cb();
				});
			});
		});
	};


	//console.log(sql);
	Agencies.query(schemaSQL,{},function(err,data){
		if(err){console.log(err); return;}
		Datasource.create(DS).exec(function(err,newDS){//run the queries
			if(err){ console.log(err); return; }
			var query = 'SELECT min(cal.start_date),agency.agency_name FROM "'+backupName+'".calendar as cal, "'+backupName+'".agency as agency GROUP BY agency.agency_name';
			Agencies.query(query,{},function(err,data){
				if(err){
					query = 'SELECT min(cal.date),agency.agency_name FROM "'+gtfsEntry.tableName+'".calendar_dates as cal, "'+gtfsEntry.tableName+'".agency as agency GROUP BY agency.agency_name';
					Agencies.query(query,{},function(err,data){
						if(err){
							console.log('ERROR: UPLOADSCONTROLLER - gtfs start date unknown',gtfsEntry.tableName,err);
						}
						updateDatasource(data,onFinish,newDS);
					});
				}
				else{
					updateDatasource(data,onFinish,newDS);
				}
			});

		});
	});

}

function save(job,backupName,data){

	Datasource.find( {tableName:backupName},function(err,result){

		var agency=result[0].id,deltas=data.deltas,maId = data.maId,route = new RouteObj(data.route),
		shape=data.shape,trips=data.trip_ids,trip=data.trip,route_id=trip.route_id,freqs=data.frequencies,freqKills=data.killFrequencies;
		var featList = data.data
		.map(function(d){
				return new Stop(d.stop);
			});
		console.log("PUTTING DATA");
		db.putData(agency,featList,trips,deltas,trip.route_id,route,shape,trip,freqs,freqKills,maId,function(err,data){
			if(err){
				console.log(err);
				Job.update({id:job.id},{isFinished:true,finised:Data(),status:'Failure',progress:100})
					 .exec(function(err,update_job){
							sails.sockets.blast('Save Status',{status:'Failure'});
					});

			}
			Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success',progress:100})
			.exec(function(err,updated_job){
				console.log('Everything is good');
				sails.sockets.blast('job_updated',updated_job);
			});

		});
	});
}
