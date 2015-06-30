/**
 * GTFSController
 *
 * @description :: Server-side logic for managing landings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var topojson = require('topojson');
var db = require('../support/editutils');
var Stop = require('../../assets/react/components/gtfs/Gtfsutils').Stop;
var BasicRoute = function(id){
	this.id = id;
	this.trips = [];
	this.addTrip = function(trip){
		this.trips.push(trip);
	}
}

function preserveProperties(feature) {
  return feature.properties;
}


var BasicTrip = function(id,route_id){
	this.id = id;
	this.route_id = route_id;
	this.intervals = [];
	this.start_times = [];
	this.stop_times  = [];
	this.tripids     = [];
	this.headsign = ''
	this.stops = [];
	this.addInterval = function(start,stop){
		this.start_times.push(start);
		this.stop_times.push(stop);
		this.intervals.push([start,stop]);
		if(this.start_times.length !== this.stop_times.length)
			console.log("Interval ERROR");
	}

}

module.exports = {
	//id, day
	getSimpleSchedule : function(req,res){
		debugger;
		var gtfs_id = req.param('id'),
        route_id = req.param('route');


	    if (!(gtfs_id && route_id)) {
	      res.send({status: 500, error: 'You must supply a gtfs_id and route ID'}, 500);
	      return;
	    }

	    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
	    	if(err){console.log('find datasource error',err)}
	    	var datafile = mgtfs.tableName;
	    	var route_short_names = JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");

		  	var sql = 'Select T2.shape_id,T2.trip_headsign,T2.stops, array_agg(T2.starting ORDER BY T2.starting)as starts,T2.route_id, array_agg(T2.ending ORDER BY T2.starting) as ends, array_agg(T2.trip_id ORDER BY T2.starting) as trips from ( '
					+'SELECT MIN(ST.departure_time)as starting,MAX(ST.arrival_time)as ending, T.shape_id, '
		  			+'T.trip_headsign,T.route_id, T.service_id, T.trip_id,T.direction_id, array_agg(ST.stop_id Order By ST.stop_sequence) as stops '
					+'FROM \"'+datafile+'\".trips as T '
					+'JOIN \"'+datafile+'\".stop_times as ST '
					+'ON T.trip_id = ST.trip_id '
					+'JOIN \"'+datafile+'\".calendar as C '
					+'ON T.service_id = C.service_id '
					+'JOIN \"'+datafile+'\".routes as R '
					+'ON T.route_id=R.route_id '
					+'WHERE R.route_short_name in '+ route_short_names + ' '
					+'Group By T.trip_id '
					+'Order By T.route_id, starting, T.trip_id,T.trip_headsign '
					+') as T2 '
					+'Group By T2.shape_id,T2.stops,T2.route_id,T2.trip_headsign;'
				console.log(sql);
			Datasource.query(sql,{},function(err,data){
				if(err) console.log(err);

					var Routes = {};
					var trips = {};
					data.rows.forEach(function(trip){
						var id = trip.shape_id;
						var stops = trip.stops;
						trips[id] = trips[id] || new BasicTrip(id,trip.route_id);
						for(var i = 0; i < trip.starts.length; i++){
							trips[id].addInterval(trip.starts[i],trip.ends[i]);
						}
						trips[id].tripids = trip.trips;
						trips[id].headsign = trip.trip_headsign;
						trips[id].stops = stops;
					})

					Object.keys(trips).forEach(function(trip_id){
						var trip = trips[trip_id];
						var rid = trip.route_id;
						Routes[rid] = Routes[rid] || new BasicRoute(rid);
						Routes[rid].addTrip(trip);
					})
					res.json(Routes);
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
		console.log(featList);
		debugger;
		var trips = reqobj.trip_ids;
		var deltas = reqobj.deltas;
		var errlist=[],datalist=[];
		var trip = reqobj.trip, route_id = trip.route_id;
		var shape = reqobj.shape;
		if(typeof agency === 'undefined'){
			res.send('{status:"error",message:"Missing parameter:id. (Agency)"}',500)
		}
		if(typeof featList === 'undefined'){
			res.send('{status:"error",message:"Missing parameter:geometry"}', 500);
		}

		db.putData(agency,featList,trips,deltas,route_id,shape,trip,function(err,data){
			if(err){
				console.log("Error in uploading");
				res.send('{status:"error",message:'+JSON.stringify(err)+'}', 500)
			}
			else{
				console.log("Successful Edit Upload");
				res.json({status:'success'});
			}
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
				Datasource.query(sql,{},function(err,data){
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
};
