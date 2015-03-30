/**
 * TriptableController
 *
 * @description :: Server-side logic for managing triptables
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var userTT = {},
acs_data = require('./utils/acsData.js');

var models = require('../../config/models'),
	connections = require('../../config/connections');
	var connection = connections.connections[models.models.connection]; 
	
var database = {
	host: connection.host ? connection.host : 'locahost' ,
	port: connection.port ? connection.port : '5432',
	user: connection.user ? connection.user :'postgres',
	password: connection.password ? connection.password :'',
	database: connection.database ? connection.database : 'transitModeler'
};

function spawnModelRun(job,triptable_id){
	var terminal = require('child_process').spawn('bash');
	var current_progress = 0;
	
	terminal.stdout.on('data', function (data) {
	    data = data+'';
	    if(data.indexOf('status') !== -1){
	    	Job.update({id:job.id},{status:data.split(":")[1],progress:0})
    		.exec(function(err,updated_job){
    			if(err){ console.log('job update error',error); }
    			sails.sockets.blast('job_updated',updated_job);		
    		});
	    	current_progress =0;
	    }
	    else if(data.indexOf('progress') !== -1){

	    	if(data.split(":")[1] !== current_progress){
	    		current_progress = data.split(":")[1];
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

				    Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
					.exec(function(err,updated_job){
						if(err){ console.log('job update error',error); }
						sails.sockets.blast('job_updated',updated_job);		
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
		var cmd = 'php -f php/runModel.php '+database.host+' '+database.port+' '+database.database+' '+database.user+' '+database.password+' '
	    	+triptable_id
	    	+'\n';
	    console.log('run Command',cmd);
	    terminal.stdin.write(cmd);

	    Job.update({id:job.id},{pid:terminal.pid}).exec(function(err,updated_job){
	    	if(err){ console.log('job update error',error); }
			sails.sockets.blast('job_updated',updated_job);		
	    });

	    terminal.stdin.end();
	}, 1000);
}

module.exports = {

	finishedModels: function(req,res){
		var sql = 'SELECT id,user,info FROM triptable where  "isFinished" = true';
		///console.log('finished models',sql);
		Triptable.query(sql,{},function(err,data){
			if(err){
				console.log('tt query',sql,err);
				res.json({message:'tt query Error',error:err,sql:sql});
				return;
			}
			//console.log('finished models',data)
			res.send(data.rows);
		});

	},
	getModelRun:function(req,res){
		if(typeof req.param('id') == 'undefined'){
			console.log('model Data no id passed');
			res.json({responseText:'Must pass model run ID'},500)
		}
		
		//farebox data is cached
		var farebox_sets = ['acam','acammin','acammax','princeam','princeammin','princeammax','princepm','princepmmin','princepmmax','princefull','princefullmin','princefullmax','acpm','acpmmin','acpmmax'];
		var id = req.param('id');
		if(farebox_sets.indexOf(id) !== -1){
			res.json(farebox[id]);
			return;
		}

		//console.log('loading model run data')
		//get data from Model RUn
		var sql = 'SELECT name,info FROM triptable where "id" = '+id;
		console.log('finished models',sql);
		Triptable.query(sql,{},function(err,data){
			if(err){
				console.log('tt query',sql,err);
				res.json({message:'tt query Error',error:err,sql:sql});
				return;
			}
			var info = JSON.parse(data.rows[0].info);
			var routes = JSON.stringify(info.marketarea.routes).replace('[','(').replace(']',')').replace(/\"/g, "'").replace(/\\/g, "").replace("'(", "(").replace(")'", ")");;
			
			//console.log(routes);
			
			var gtfs_table = 'njtransit_bus_07-12-2013';//info.datasources.gtfs;
			var sql ="SELECT a.run_id,a.trip_id,a.duration,a.distance,a.route,a.on_stop_code,a.gtfs_trip_id,a.off_stop_code,b.start_time,b.waiting_time,b.walk_distance,b.walking_time,	c.arrival_time,	d.arrival_time as trip_start_time,f.fare_zone as on_fare_zone,	g.fare_zone as off_fare_zone,e.geoid as on_tract, h.geoid as off_tract"
			 		+" from model_legs a "
			 		+" join model_trips b ON a.trip_id = b.id "
			 		+" join \""+gtfs_table+"\".stop_times c ON a.on_stop_id = c.stop_id and a.gtfs_trip_id = c.trip_id "
			 		+" join fare_zones f on f.stop_num = a.on_stop_code and f.line = a.route	"
			 		+" join fare_zones g on g.stop_num = a.off_stop_code and g.line = a.route "
			 		+" join \""+gtfs_table+"\".stops as son on son.stop_id = a.on_stop_id"
			 		+" join \""+gtfs_table+"\".stops as soff on soff.stop_id = a.off_stop_id"
			 		+" join tl_2013_34_tract as e on ST_CONTAINS(e.geom,son.geom) "
			 		+" join tl_2013_34_tract as h on ST_CONTAINS(h.geom,soff.geom) "
					+" join \""+gtfs_table+"\".stop_times d ON d.stop_sequence = 1 and a.gtfs_trip_id = d.trip_id "
			 		+" where a.run_id = "+req.param('id')
			 		+"  and mode = 'BUS'and g.fare_zone like 'P%' ";
			 		sql+="  and a.route in "+routes;
				//console.log(sql);
				Triptable.query(sql,{},function(err,output){
					if (err) {
						res.send('{sql:"'+sql+'",status:"error",message:"'+err+'"}',500);
						return console.log('tt query',err,sql);
					}
					res.send(output.rows);
				});

		});

	},

	runModel:function(req,res){
		var model=req.param('model');

		console.log('TriptableController.runModel',model,userTT[req.session.User.username].length,req.session.User.username,Object.keys(userTT));
		model.trips = userTT[req.session.User.username];
		model.user = req.session.User.name;
		console.log('set test',model.trips.length);
		console.log('id test',model.id,'ma_id',model.marketareaId)
		var settings = JSON.parse(model.info)
		Triptable.create(model).exec(function(err,tt){
			if(err){console.log('tt create error',err)
					
					res.json({message:'Create tt Errer',error:err});
					return;
				}

			Job.create({
				isFinished:false,
				type:'Model Run',
				info:[{'name':settings.marketarea.name+' '+settings.time+' '+settings.type,'numTrips':model.trips.length}],
				status:'Started'
			})
			.exec(function(err,job){
				if(err){console.log('create job error',err)
					
					res.json({message:'Create Job Error',error:err});
					return;
				}
				sails.sockets.blast('job_created',job);

			
				spawnModelRun(job,tt.id);

				res.json({message:'model run started',ttId:tt.id});
				return;
				
			})
		})

	},

	calculateTripTable:function(req,res){
		var triptable = req.param('triptable_settings');
		var tracts = JSON.stringify(triptable.marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
		var output = {tt:[],failed:[]};
		var regressionModel = triptable.regressionId;
		var numTripsTotal = 0,
			tractPairCount  = 0;
		console.log('settings:',req.param('triptable_settings').time,req.param('triptable_settings').type,'total_zones',triptable.marketarea.zones.length);
		getCensusData(tracts,triptable.datasources.acs,function(acs_tracts){
			acs_data.update_data(acs_tracts);
			switch(triptable.type) {
				case 'ctpp':
					triptable.marketarea.id = -1
				case 'regression':
					//regression model
					getCTTPTracts(triptable.datasources.ctpp,tracts,function(tractTrips){
						getODPoints(triptable.od,triptable.datasources.gtfs,tracts,function(ODPoints){
							console.log('tract Trips',tractTrips.length);
							tractTrips.forEach(function(tractPair){
								if(typeof acs_data.acs[tractPair.home_tract] == 'undefined'){
									//console.log(tractPair.home_tract)
								}else{
									var emp_growth = 1,
										pop_growth = 1;
									if(triptable.forecast != 'current'){
										if(typeof triptable.tract_forecasts.population[tractPair.home_tract] != 'undefined'){
											pop_growth = 1+(triptable.tract_forecasts.population[tractPair.home_tract]/100);
										}
										if(typeof triptable.tract_forecasts.employment[tractPair.work_tract] != 'undefined'){
											pop_growth = 1+(triptable.tract_forecasts.employment[tractPair.work_tract]/100);
										}
									}

									var time = getTimeMatrix(tractPair);
									if(triptable.time == 'full'){
										//am riderrs
										var numTrips = parseInt(getRegressionTrips(tractPair,time,'am',triptable.marketarea.id)) || 0;
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'am',output)
										}
										//plus pm return trip riders
										numTrips = parseInt(getRegressionTrips(tractPair,time,'pm',triptable.marketarea.id)) || 0;
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'pm',output)
										}
										//plus pm to work riders
										var numTrips = parseInt((time.intime['pm']/acs_data.acs[tractPair.home_tract].bus_to_work)*getRegressionTrips(tractPair,time,triptable.time,triptable.marketarea.id));
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'am',output)
										}
										//plus off peak riders
										var numTrips = parseInt((time.intime['pm']/acs_data.acs[tractPair.home_tract].bus_to_work)*getRegressionTrips(tractPair,time,triptable.time,triptable.marketarea.id));
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'am',output)
										}

									}else if(triptable.time =='am'){
										
										//console.log('am riders');
										//am riders
										var numTrips = parseInt(getRegressionTrips(tractPair,time,triptable.time,triptable.marketarea.id,triptable.type,triptable.regressionId));
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										//console.log('x',tractPair,numTrips)
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,triptable.time,output)
										}
										tractPairCount++;
										if(numTrips){
											numTripsTotal+=numTrips;
										}
										
									}
									else if(triptable.time =='pm'){
										
										//console.log('pm riders');
										
										//pm return trip riders
										var numTrips = parseInt(getRegressionTrips(tractPair,time,triptable.time,triptable.marketarea.id));
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);										
										
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'pm',output)
										}
										//pm to work riders
										var numTrips = parseInt((time.intime['pm']/acs_data.acs[tractPair.home_tract].bus_to_work)*getRegressionTrips(tractPair,time,triptable.time,triptable.marketarea.id));
										numTrips = Math.round((numTrips*pop_growth)*emp_growth);
										for(var i = 0; i < numTrips;i++){
											planTrip(tractPair,time.timeMatrix,ODPoints,'am',output)
										}
									}
								}
								//done send output
									
							});
							console.log('triptable done',output.tt.length,req.session.User.username,numTripsTotal,tractPairCount);

							userTT[req.session.User.username] = output.tt; // Multiple people logged on to same account could confuse this.
							
							res.json(output);
						})
					});
					break;
				
				case 'lehd':
					//code block
					break;
				case 'survey':
					//code block
					break;
				default:
					//default code block
			}
		})
	}
	
};//end module.exports

function planTrip(tractPair,timeMatrix,stop_points,timeOfDay,output){

	var trip = {};
	trip.id = output.tt.length;
	
	trip.from_geoid = tractPair.home_tract;
	trip.to_geoid = tractPair.work_tract;

	if(timeOfDay == 'pm'){
		trip.from_geoid = tractPair.work_tract;
		trip.to_geoid = tractPair.home_tract;
	}

	trip.from_coords = [];
	trip.to_coords = [];
	if(tractPair.home_tract in stop_points && tractPair.work_tract in stop_points){
		if(timeOfDay == 'am'){
			trip.from_coords = stop_points[tractPair.home_tract][random(0,stop_points[tractPair.home_tract].length-1)];
		}else if(timeOfDay == 'pm'){
			trip.from_coords = stop_points[tractPair.work_tract][random(0,stop_points[tractPair.work_tract].length-1)];
		}
		trip.from_coords[0] += pointVariation();
		trip.from_coords[1] += pointVariation();
		
		if(timeOfDay == 'am'){
			trip.to_coords = stop_points[tractPair.work_tract][random(0,stop_points[tractPair.work_tract].length-1)];
		}else if(timeOfDay == 'pm'){
			trip.to_coords = stop_points[tractPair.home_tract][random(0,stop_points[tractPair.home_tract].length-1)];
		}
		trip.to_coords[0] += pointVariation();
		trip.to_coords[1] += pointVariation();
		
		trip.time = getTime(timeMatrix,timeOfDay);
		//trip.source = mode+version;
		output.tt.push(trip);
	}else{
		output.failed.push(trip);
	}	
}

function getRegressionTrips(tractPair,time,timeOfDay,marketarea,type,model){
	
	var regressionRiders = 0;

	var regRatio = 1;
	if(type === 'regression' && model){
		
		regressionRiders = +model.constant;
		model.censusVariables.forEach(function(cv){
			console.log(tractPair.home_tract,cv.name , 
				acs_data.acs[tractPair.home_tract][cv.name],'*',cv.coef,'=',
				acs_data.acs[tractPair.home_tract][cv.name]*cv.coef
			)
			regressionRiders += acs_data.acs[tractPair.home_tract][cv.name]*cv.coef;

		})
		
		regRatio= regressionRiders / acs_data.acs[tractPair.home_tract].bus_to_work;
		console.log(tractPair.home_tract,regressionRiders,'/', acs_data.acs[tractPair.home_tract].bus_to_work,'=',regRatio)
	}
	
	
	var output = tractPair.bus_total*(time.intime['am']/acs_data.acs[tractPair.home_tract].public_transportation_to_work)*Math.abs(regRatio);
	return Math.round(output*1);
}


function getTimeMatrix(tractPair){
	var output = {intime:[]};
	output.intime['am']= 0;
	output.intime['pm']=0;
	output.intime['off']=0;

	var amVars = ['6_00ampt','6_30ampt','7_00ampt','7_30ampt','8_00ampt','8_30ampt','9_00ampt','10_00ampt'],
		pmVars = ['4_00pmpt'],
		offPeakVars = ['5_00ampt','5_30ampt','11_00ampt','12_00ampt','12_00pmpt'];

	amVars.forEach(function(timeVar){
		output.intime['am'] += acs_data.acs[tractPair.home_tract][timeVar]*1;
	})
	pmVars.forEach(function(timeVar){
		output.intime['pm'] += acs_data.acs[tractPair.home_tract][timeVar]*1;
	})
	offPeakVars.forEach(function(timeVar){
		output.intime['off'] += acs_data.acs[tractPair.home_tract][timeVar]*1;
	})

	output.intime['full'] = output.intime['am']+output.intime['pm']+output.intime['off'];


	output.amPercent = output.intime['am']/acs_data.acs[tractPair.home_tract].bus_to_work;
	output.pmPercent = output.intime['pm']/acs_data.acs[tractPair.home_tract].bus_to_work;
	output.offpeakPercent = output.intime['off']/acs_data.acs[tractPair.home_tract].bus_to_work;
	output.timeMatrix = {};
	amVars.forEach(function(timeVar){
		var hour = 6,
				lowMin = 0,
				highMin = 29;
			if(timeVar.length == 8){ hour = timeVar[0];
				if(timeVar[2] == '3'){ lowMin = 30; highMin = 59; }
			}
			if(timeVar.length == 9){ hour = timeVar.substring(0,2); lowMin = 0; highMin = 59;
			}
			output.timeMatrix[timeVar] = {
				'count':Math.ceil((acs_data.acs[tractPair.home_tract][timeVar]/output.intime.am)*acs_data.acs[tractPair.home_tract].bus_to_work*1),
				'hour':hour,
				'lowMin':lowMin,
				'highMin':highMin
			};
	})
	return output
}

var getTime = function(timeMatrix,ampm){
	var hour = random(6,9);
	var minutes = random(0,59);
	min = 0;
	maxKey = 'unset';
	//Find the Time Category with the most trips
	for(key in timeMatrix){
		if(timeMatrix[key].count > min){
			maxKey = key;
			min = timeMatrix[key].count;
		}
	}
	//Schedule the trip for the category
	if(maxKey !== 'unset'){
		hour = timeMatrix[maxKey].hour;
		minutes = random(timeMatrix[maxKey].lowMin,timeMatrix[maxKey].highMin);
		timeMatrix[maxKey].count--;
	}
	if(+minutes < 10){
		minutes = '0'+minutes;
	}
	//console.log('am hour',hour);
	if(ampm == 'pm'){
		hour = +hour+10;
		hour = hour % 12;
	}
	//console.log('pm hour',hour);
	return  hour+":"+minutes+ampm;
}



function getCensusData(tracts,table,cb){

	var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a'
					+ ' join tl_2013_34_tract as b on a.geoid = b.geoid'
					+ ' where a.geoid in '+tracts;
	MarketArea.query(sql,{},function(err,data){
	  if (err) { return console.log('207',err);}
	  return cb(data.rows);
	});
}

function getCTTPTracts(table,tracts,cb){
	sql="SELECT from_tract as home_tract, to_tract as work_tract, est as bus_total"
		+" from "+table+" where (from_tract in "+tracts+" or to_tract in "+tracts+")";
	Triptable.query(sql,{},function(err,tracts_data){
		if (err) { return console.log('216',err);}
		cb(tracts_data.rows);
	});	
}

function getODPoints(type,table,tracts,cb){
	switch(type) {
		case 'bus':
			var sql = 'SELECT a.geoid,b.stop_lat,b.stop_lon '
					+ 'FROM "'+table+'".stops as b '
					+ 'join "public"."tl_2013_34_tract" as a on ST_CONTAINS(a.geom,b.geom) '
					+ 'where a.geoid in '+tracts;
			Triptable.query(sql,{},function(err,points_data){

				if (err) {  return console.log('231',err);}
				
				var stop_points = {};
				
				points_data.rows.forEach(function(trip){
					
					if(trip.geoid11 in stop_points){
						stop_points[trip.geoid].push([trip.stop_lat*1,trip.stop_lon*1]);
					}else{
						
						stop_points[trip.geoid] = [];
						stop_points[trip.geoid].push([trip.stop_lat*1,trip.stop_lon*1]);
					}
					
				});
				cb(stop_points);
				return;
			});
			break;
		case 'survey':
			var sql = "select O_MAT_LAT as o_lat, O_MAT_LONG as o_lng,D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 "
					+ " from survey_geo where o_geoid10 in "+tracts+" or d_geoid10 in "+tracts+" and not O_MAT_LAT = 0 and not O_MAT_LONG = 0 and not D_MAT_LAT= 0 and not D_MAT_LONG = 0";
			Triptable.query(sql,{},function(err,points_data){

				if (err) { return console.log('255',err);}
				
				var stop_points = {};

				points_data.rows.forEach(function(trip){
					
					if(trip.o_geoid10 in stop_points){
						stop_points[trip.o_geoid10].push([trip.o_lat*1,trip.o_lng*1]);
					}else{
						stop_points[trip.o_geoid10] = [];
						stop_points[trip.o_geoid10].push([trip.o_lat*1,trip.o_lng*1]);
					}
					if(trip.d_geoid10 in stop_points){
						stop_points[trip.d_geoid10].push([trip.d_lat*1,trip.d_lng*1]);
					}else{
						stop_points[trip.d_geoid10] = [];
						stop_points[trip.d_geoid10].push([trip.d_lat*1,trip.d_lng*1]);
					}
					
				});
				cb(stop_points);
			});
			break;
		case 'parcel':
			break;
		default:
			//
	}
};

var  pointVariation = function(){
	var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	//return random(0,20)/10000*plusOrMinus;
	return 0
};

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
};