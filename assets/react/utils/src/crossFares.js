var crossfilter = require('crossfilter');

crossFares = {
	trips:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	loading:false,

	init:function(data,id){
		console.log(data);
		var t = new Date();
		crossFares.trips = crossfilter(data);
		crossFares.all = crossFares.trips.groupAll();


		crossFares.dimensions['line'] = crossFares.trips.dimension(function(d){ return d['line']}),
		crossFares.groups['line'] = crossFares.dimensions['line'].group().reduceSum(function(d){return +d['total_transactions']}),

		crossFares.dimensions['run_date'] = crossFares.trips.dimension(function(d){ return new Date(d['run_date']) }),
		crossFares.dimensions['run_time'] = crossFares.trips.dimension(function(d){ return new Date(d['run_date']) }),
		crossFares.dimensions['zone'] = crossFares.trips.dimension(function(d){ return d.boarding_zone+';'+d.alighting_zone;}),
		crossFares.dimensions['trip'] = crossFares.trips.dimension(function(d){ return d.line +','+d.trip+','+d.run_date;}),

		crossFares.groups['run_date'] = crossFares.dimensions['run_date'].group(d3.time.day).reduceSum(function(d){return +d['total_transactions']}),
		crossFares.groups['run_year'] = crossFares.dimensions['run_date'].group(d3.time.year).reduceSum(function(d){return +d['total_transactions']}),
		crossFares.groups['zone'] = crossFares.dimensions.zone.group().reduceSum(function(d){return +d.total_transactions;}),
		crossFares.groups['trip'] = crossFares.dimensions.trip.group().reduceSum(function(d){return +d.total_transactions;});
		//crossFares.groups['boarding_zone'] = crossFares.dimensions.boarding_zone.group().reduceSum(function(d){ return d.total_transactions;});
		console.log('Processing finished', (t-(new Date()))/1000);

		crossFares.initialized = true;
	}

};

module.exports = crossFares;
