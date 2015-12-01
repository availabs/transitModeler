var crossfilter = require('crossfilter');

crossCtpp = {
	inputRows:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	
	init:function(data){

		crossCtpp.inputRows = crossfilter(data);
		crossCtpp.all = crossCtpp.inputRows.groupAll(),
		
		crossCtpp.dimensions['from_tract'] = crossCtpp.inputRows.dimension(function(d){ return d.from_tract}),
		crossCtpp.groups['from_tract'] = crossCtpp.dimensions['from_tract'].group().reduceSum(function(d){ return d.est}),

		crossCtpp.dimensions['to_tract'] = crossCtpp.inputRows.dimension(function(d){ return d.to_tract}),
		crossCtpp.groups['to_tract'] = crossCtpp.dimensions['to_tract'].group().reduceSum(function(d){ return d.est}),
		

		crossCtpp.initialized = true;
	},

	filter: function(dim,val){
			
		crossCtpp.dimensions[dim].filter(function(d){
		  return val.indexOf(d) > -1;
		});
		
	}
}

module.exports = crossCtpp; 