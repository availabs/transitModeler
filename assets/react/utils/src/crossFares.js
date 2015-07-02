var crossfilter = require('crossfilter');

crossFares = {
	trips:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	loading:false,
	
	init:function(data,id){

		crossFares.trips = crossfilter(data);
		crossFares.all = crossFares.trips.groupAll();
		
		
		crossFares.dimensions['line'] = crossFares.trips.dimension(function(d){ return d['line']}),
		crossFares.groups['line'] = crossFares.dimensions['line'].group().reduceSum(function(d){return +d['total_transactions']}),
		
		crossFares.dimensions['run_date'] = crossFares.trips.dimension(function(d){ return d['run_date'] }),
		//crossFares.groups['run_date'] = crossFares.dimensions['run_date'];

		
		crossFares.initialized = true;
	}

}

module.exports = crossFares;