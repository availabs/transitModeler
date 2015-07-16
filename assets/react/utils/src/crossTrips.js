var crossfilter = require('crossfilter');

var crossTrips = {
	trips:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	loadedModels:[],
	loading:false,
	
	init:function(data,id){
		console.log('crossTrips init',crossTrips.loadedModels,data,id)
		crossTrips.trips = crossfilter(data);

		crossTrips.loadedModels.push(id);
		crossTrips.all = crossTrips.trips.groupAll(),
		
		crossTrips.dimensions['run_id'] = crossTrips.trips.dimension(function(d){ return d.run_id}),
		//crossTrips.groups['run_id'] = crossTrips.dimensions['run_id'].group().reduceCount(),

		crossTrips.dimensions['route'] = crossTrips.trips.dimension(function(d){ return d.route}),
		crossTrips.groups['route'] = crossTrips.dimensions['route'].group().reduceCount(),

		crossTrips.dimensions['stop_boarding'] = crossTrips.trips.dimension(function(d){ return d.on_stop_code}),
		crossTrips.groups['stop_boarding'] = crossTrips.dimensions['stop_boarding'].group().reduceCount(),
		
		crossTrips.dimensions['stop_alighting'] = crossTrips.trips.dimension(function(d){ return d.off_stop_code}),
		crossTrips.groups['stop_alighting'] = crossTrips.dimensions['stop_alighting'].group().reduceCount(),
		
	
		crossTrips.initialized = true;
	},

	addRun:function(data,id){

		crossTrips.trips.add(data);
		crossTrips.loadedModels.push(id);
	
	},

	removeRun:function(id){
		crossTrips.dimensions['run_id'].filter(id);
		crossTrips.remove();
		//crossTrips.loadedModels.splice(crossTrips.loadedModels.indexOf('specific'), 1);
	}

}

module.exports = crossTrips; 