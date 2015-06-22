/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing landings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var topojson = require('topojson');

var Route = function(id){
	this.id = id;
	this.trips = [];
	this.addTrip = function(trip){
		this.trips.push(trip);
	}
}

var Trip = function(id,route_id){
	this.id = id;
	this.route_id = route_id;
	this.intervals = [];
	this.start_times = [];
	this.stop_times  = [];
	this.headsign = ''
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
	getSimpleSchedule: function(req,res){
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

		  	var sql = 'Select T2.trip_headsign,T2.stops, array_agg(T2.starting ORDER BY T2.starting)as starts,T2.route_id, array_agg(T2.ending ORDER BY T2.starting) as ends, array_agg(T2.trip_id ORDER BY T2.starting) as trips from ( '
					+'SELECT MIN(ST.departure_time)as starting,MAX(ST.arrival_time)as ending, '
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
					+'Group By T2.stops,T2.route_id,T2.trip_headsign;'
			Datasource.query(sql,{},function(err,data){
				if(err) console.log(err);
				console.log(data.rows.length)
				
					var Routes = {};
					var trips = {};
					data.rows.forEach(function(trip){
						var id = JSON.stringify(trip.stops);
						trips[id] = trips[id] || new Trip(id,trip.route_id);
						for(var i = 0; i < trip.starts.length; i++){
							trips[id].addInterval(trip.starts[i],trip.ends[i]);
						}
						trips[id].tripids = trip.trips;
						trips[id].headsign = trip.trip_headsign;
					})

					Object.keys(trips).forEach(function(trip_id){
						var trip = trips[trip_id];
						var rid = trip.route_id;
						Routes[rid] = Routes[rid] || new Route(rid);
						Routes[rid].addTrip(trip);
					})
					res.json(Routes);
		  	});
  	
		});
	},

	
};

