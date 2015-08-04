var crossfilter = require('crossfilter');

crossTrips = {
	trips:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	loading:false,

	init:function(data,id){
		crossTrips.trips = crossfilter(data);
		crossTrips.all = crossTrips.trips.groupAll();

		var discreteCats = [
			'busroute',
			'captivity',
			'accessmode',
			'vehicleavail',
			'tickettype',
			'tripfreq',
			'triptenure',
			'qualservchg',
			'gender',
			'age',
			'race'
		];

		discreteCats.forEach(function(cat){
			crossTrips.dimensions[cat] = crossTrips.trips.dimension(function(d){ return d[cat];});
			crossTrips.groups[cat] = crossTrips.dimensions[cat].group().reduceCount();
			crossTrips.groups[cat+'_weight'] = crossTrips.dimensions[cat].group().reduceSum(function(d){return d.weight;});
		});

		crossTrips.initialized = true;
	}

};

module.exports = crossTrips;
