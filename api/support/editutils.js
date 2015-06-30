
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
		var templist= strings.filter(function(e,i,a){return i!==0;})
		outString = templist.reduce(function(pr,cur,i,arr){
			return pr + ',\'' + cur+'\'';
		}, ['\''+temp+'\''])
	return 'Array[' + outString + ']';
}

function buildFeatureQuery(temp1,m1,f){
	var data1={};
	m1.forEach(function(field){
		data1[field] = getField(field,f);
	})
	dbhelp = new dbhelper(temp1,data1);
	dbhelp.setMapping(m1);
	return dbhelp.getQuery();
}

var Util = {
  putShape:function(datafile,routeId,trips,geojson,dbhelper){
				debugger;
				//first delete the shape if it exists in the shape table x
				//update or insert the shape into the shapes table x
				//insert new trips into the trips table
				//use the distinct shape id's associated with all trips involved
				//to reforge the geometry of the associated route in the routes table
				var template1 = 'SELECT delete_and_update_shapes_with_trips(?,?,?,?,\'?\')',
				map = ['trips','lats','lons','geoms','file'],sql = '';
				var lons=[],lats=[],dbhelper;
				var geoms = geojson.coordinates.map(function(pt){
					lats.push(pt[1]), lons.push(pt[0]);
					return JSON.stringify({type:"Point",coordinates:pt});
				})
				lons = formatNumList(lons);
				lats = formatNumList(lats);
				trips = formatStringList(trips);
				geoms = formatStringList(geoms);
				data = {trips:trips,lats:lats,lons:lons,geoms:geoms,file:datafile};
				dbhelp = new dbhelper(template1,data);
				dbhelp.setMapping(map);
				sql = dbhelp.getQuery(); //ends shapes table edit
        //Now update the routes table
        sql += "SELECT update_route_geom('"+routeId+"'::TEXT,'"+datafile+"'::TEXT);"
				// console.log(sql);
				return sql;
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


			var map1 = ['file','geo','lon','lat','stop_id','stop_name']
			var map2 = ['stop_id','sequence','trips','file']
			var map3 = ['sequence','trips','file']
			var map4 = ['file','stop_id']

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
		debugger;
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
		var template = 'INSERT INTO \"?\".trips(trip_id,service_id,route_id) VALUES '
					  +'(\'?\',\'?\',\'?\')', map =['file','trip_id','service_id','route_id'],sql ='';

		var data = {file:datafile,trip_id:trip.trip_ids,service_id:trip.service_id,route_id:trip.route_id};
		dbhelp = new dbhelper(template,data);
		dbhelp.setMapping(map);
		return dbhelp.getQuery();
	},

	putRoute: function(datafile,route_id){
		var sql = 'INSERT INTO \"'+datafile+'\".routes(route_id,route_type) Values (\''+route_id+'\',3);';
		return sql;
	},

	putData:function(agencyId,featlist,trips,deltas,route_id,shape,trip,cb){
		var db = this;
		Datasource.findOne(agencyId).exec(function(err,agency){
			var sql = '', datafile=agency.tableName ;
			console.log(trip.isNew);
			if(trip.isNew){
				sql += db.putRoute(datafile,route_id);
				sql += db.putTrip(datafile,trip)
			}
			sql += db.putStops(datafile,featlist,trips,deltas);
			sql += db.putShape(datafile,route_id,trips,shape,dbhelper);
			sql = 'BEGIN; ' + sql + ' COMMIT;'
      debugger;
      Datasource.query(sql,{},function(err, data){
				if(err){
					console.log(err);
				}
				cb(err,data);
			});
		})
	},

	updateStops:function(datafile,featlist,trips,deltas,cb){
		if(featlist.length <= 0) cb(undefined,{})
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
}

module.exports = Util;
