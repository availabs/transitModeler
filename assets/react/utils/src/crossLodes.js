var crossfilter = require('crossfilter');

crossLodes = {
	inputRows:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	
	init:function(data){

		crossLodes.inputRows = crossfilter(data);
		crossLodes.all = crossLodes.inputRows.groupAll(),
		
		crossLodes.dimensions['from_tract'] = crossLodes.inputRows.dimension(function(d){ return d.from_tract}),
		crossLodes.groups['from_tract'] = crossLodes.dimensions['from_tract'].group().reduceSum(function(d){ return d.est}),

		crossLodes.dimensions['to_tract'] = crossLodes.inputRows.dimension(function(d){ return d.to_tract}),
		crossLodes.groups['to_tract'] = crossLodes.dimensions['to_tract'].group().reduceSum(function(d){ return d.est}),
		

		crossLodes.initialized = true;
	},

	filter: function(dim,val){
			
		crossLodes.dimensions[dim].filter(function(d){
		  return val.indexOf(d) > -1;
		});
		
	}
}

module.exports = crossLodes; 