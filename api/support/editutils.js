/*globals confirm, console,module,require*/
/*jshint -W097*/
var dbhelper = require('./batchmod.js');
var Feature = require('./feature.js');

function updateStopTimes(datafile,trips,deltas){
	var map = ['trips','deltas','file'],template = 'Select update_st_times(?,?,\'?\')';
	var sqlTimeUpdate = new dbhelper(template,{
												trips:formatStringList(trips),
												deltas:formatNumList(deltas),
												file:datafile
											});
	sqlTimeUpdate.setMapping(map);
	return sqlTimeUpdate.getQuery();
}
function getField(field,feat){
	if(field === 'trips'){
		return formatStringList(feat.get(field));
	}else if(field === 'geo'){
		return JSON.stringify(feat.get(field));
	}else{
		return feat.get(field);
	}
}

function formatNumList(nums){
	return'Array['+nums.toString()+']';
}

function formatStringList(strings){
	var outString ='';
		var temp = strings[0];
		var templist= strings.filter(function(e,i,a){return i!==0;});
		outString = templist.reduce(function(pr,cur,i,arr){
			return pr + ',\'' + cur+'\'';
		}, ['\''+temp+'\'']);
	return 'Array[' + outString + ']';
}

function buildFeatureQuery(temp1,m1,f){
	var data1={};
	m1.forEach(function(field){
		data1[field] = getField(field,f);
	});
	dbhelp = new dbhelper(temp1,data1);
	dbhelp.setMapping(m1);
	return dbhelp.getQuery();
}

var Util = {
  putShape:function(datafile,routeId,trips,geojson,trip,dbhelper){
				debugger;
				//first delete the shape if it exists in the shape table x
				//update or insert the shape into the shapes table x
				//insert new trips into the trips table
				//use the distinct shape id's associated with all trips involved
				//to reforge the geometry of the associated route in the routes table
				var template1, map, lons=[], lats=[], geoms,sql = '';
					template1 = 'SELECT delete_and_update_shapes_with_trips(?,?,?,?,\'?\')';
					map = ['trips','lats','lons','geoms','file'];

					// template1='SELECT insert_into_shapes_with_trips(\'?\',?,?,?,?,\'?\')';
					// map = ['shape_id','trips','lats','lons','geoms','file'];

				geoms = geojson.coordinates.map(function(pt){
					lats.push(pt[1]);
					lons.push(pt[0]);
					return JSON.stringify({type:"Point",coordinates:pt});
				});
				lons = formatNumList(lons);
				lats = formatNumList(lats);
				trips = formatStringList(trips);
				geoms = formatStringList(geoms);
				data = {trips:trips,lats:lats,lons:lons,geoms:geoms,file:datafile,shape_id:trip.id};
				dbhelp = new dbhelper(template1,data);
				dbhelp.setMapping(map);
				sql = dbhelp.getQuery(); //ends shapes table edit
				console.log(sql);
				return sql;
	},

	updateRouteGeo:function(datafile,routeId){
		//Now update the routes table
		console.log('datafile',datafile,'routeid',routeId);
		return "SELECT update_route_geom('"+routeId+"'::TEXT,'"+datafile+"'::TEXT);";
	},
	addDelStops:function(datafile,featlist,trips,deltas,cb){
		if(featlist.length <=0) cb(undefined,{});

			debugger;
			var sql = '';
			var template1 = 'INSERT INTO "?".stops(geom,stop_lon,stop_lat,stop_id,stop_name)'
						  + 'VALUES (ST_SetSRID(ST_GeomFromGeoJSON(\'?\'),4326), ?, ?, \'?\',\'?\')',
				template2 = 'SELECT add_stop_to_stop_times(\'?\',?,?,\'?\')',

				template3 = 'SELECT del_stop_from_stop_times(?,?,\'?\')',
				template4 = 'DELETE FROM "?".stops WHERE stop_id=\'?\'';


			var map1 = ['file','geo','lon','lat','stop_id','stop_name'],
					map2 = ['stop_id','sequence','trips','file'],
			 		map3 = ['sequence','trips','file'],
					map4 = ['file','stop_id'];

			featlist.forEach(function(feat){
				var temp1,temp2,m1,m2,data1={},data2={};
				feat.file = datafile;
				feat.trips = trips;
				var f = new Feature(feat);
				if(feat.isNew()){ //if it is a new feature add it to the database
					sql += buildFeatureQuery(template1,map1,f);
					sql += buildFeatureQuery(template2,map2,f);
				}
				else if(feat.isDeleted()){ //if it was marked for deletion from a tgroup
					sql += buildFeatureQuery(template3,map3,f);//delete from tgroup
					if(feat.wasRemoved){	//if it was marked for removal
						sql += buildFeatureQuery(template4,map4,f);//remove it from the database.
					}
				}
			});
			sql += updateStopTimes(datafile,trips,deltas);
			console.log(sql);
			// console.log(sql);
			return sql;
	},

	putStops: function(datafile,featlist,trips,deltas){
		var updates,insertsDeletes,sql = '';
		updates = featlist.filter(function(feat){return !(feat.isNew() || feat.isDeleted());});
		insertsDeletes = featlist.filter(function(feat){return feat.isNew() || feat.isDeleted();});
		if(insertsDeletes.length > 0){
			sql += this.addDelStops(datafile,insertsDeletes,trips,deltas);
		}
		if(updates.length > 0){
			sql += this.updateStops(datafile,updates,trips,deltas);
		}
		return sql;
	},

	putTrip: function(datafile,trip){
		var template = 'SELECT create_or_update_trip(\'?\',\'?\',\'?\',\'?\',\'?\')',
		map =['trip_id','route_id','service_id','shape_id','file'],sql ='';

		var data = [];
		trip.trip_ids.forEach(function(d){ //every trip associated with this Group
			data.push({
					file:datafile,
					trip_id:d,
					service_id:trip.service_id,
					route_id:trip.route_id,
					shape_id:trip.id,
				});
		});
		dbhelp = new dbhelper(template,data);
		dbhelp.setMapping(map);
		return dbhelp.getQuery();
	},
	putService: function(datafile,service_id){
		return 'SELECT create_or_update_service(\''+service_id+'\',\''+datafile+'\');';
	},
	putRoute: function(datafile,route_id){ //currently only bus route type;
		var sql = 'Select create_or_update_route(\''+route_id+'\',3,\''+datafile+'\');';
		return sql;
	},

	putData:function(agencyId,featlist,trips,deltas,route_id,shape,trip,freqs,cb){
		var db = this;
		Datasource.findOne(agencyId).exec(function(err,agency){
			var sql = '', datafile=agency.tableName ;
			if(trip.isNew){ //if we are adding a new trip
				sql += db.putService(datafile,trip.service_id); //add its associated service
				sql += db.putRoute(datafile,route_id);	//add the associated route
				sql += db.putTrip(datafile,trip);	// add the trip itself
			}
			if(featlist.length > 0){ //if any stops were moved,added or edited
				sql += db.putStops(datafile,featlist,trips,deltas); //store the stops
				sql += db.putShape(datafile,route_id,trips,shape,trip,dbhelper); //and store the new shape of the trip
			}
			if(freqs.length > 0){
				sql += db.putFrequencies(datafile,freqs); //if any of the frequency data was changed commit it
			}

			// sql += db.updateRouteGeo(datafile,route_id);
			sql = 'BEGIN; ' + sql + ' COMMIT;'; //Wait to commit to avoid bad db state
      Datasource.query(sql,{},function(err, data){ //execute the combined query;
				if(err){
					console.log(err);
				}
				//if all the inserts and updates went through update the routes table with
				//the new geometry.
				Datasource.query(db.updateRouteGeo(datafile,route_id),{},function(err2,data2){
						if(err){ console.log(err2);}
						cb(err,data);
				});
			});
		});
	},

	updateStops:function(datafile,featlist,trips,deltas,cb){
		if(featlist.length <= 0) cb(undefined,{});
			var template = 'UPDATE "?".stops '  //!!!!Dangerous code if failures but for now if one fails, the rest persist
												//and no one knows the difference!!!
						+ 'SET geom = ST_SetSRID(ST_GeomFromGeoJSON(\'?\'),4326), '
						+ 'stop_lon=?, stop_lat=?,stop_name=\'?\' WHERE stop_id=\'?\''

			var data={}, data2={}, sql='';
			var map  = ['file','geo','lon','lat','stop_name','stop_id'];
			featlist.forEach(function(feat){
				feat.file=datafile;
				feat.trips=trips;
				var f = new Feature(feat);
				sql += buildFeatureQuery(template,map,f);
			});
			sql += updateStopTimes(datafile,trips,deltas); //update the arrivals & departures of the necessary trips
															//based on the time deltas.
			// console.log(sql);
			return sql;
	},

	createTrip: function(datafile,featlist,trip,deltas,cb){

	},
	putFrequencies : function(datafile,frequencies,cb){
		if(frequencies.length === 0){
			cb(null);
			return;
		}
		var template = 'Select create_or_update_freq(\'?\',\'?\',\'?\',?,\'?\');';
		var map = ['trip_id','start_time','end_time','headway_secs','file'];
		var data = frequencies.map(function(d){return {
																						trip_id:d.trip_id,
																						start_time:d.start_time,
																						end_time:d.end_time,
																						headway_secs:d.headway_secs,
																						file:datafile
																						};
																});
		debugger;
		var dbhelp = new dbhelper(template,data);
		dbhelp.setMapping(map);
		var sql = dbhelp.getQuery();
		return sql;
		// Datasource.query(sql,{},function(err,data){
		// 	cb(err,data);
		// });
	},
};

module.exports = Util;
