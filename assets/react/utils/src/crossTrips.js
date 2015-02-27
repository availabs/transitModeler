var crossfilter = require('crossfilter');

crossVoters = {
	voters:{},
	all:{},
	dimensions:{},
	groups:{},
	initialized:false,
	
	init:function(data){

		crossVoters.voters = crossfilter(data);
		crossVoters.all = crossVoters.voters.groupAll(),
		
		crossVoters.dimensions['Party'] = crossVoters.voters.dimension(function(d){ return d.enrollment}),
		crossVoters.groups['Party'] = crossVoters.dimensions['Party'].group().reduceCount(),
		
		crossVoters.dimensions['Town/City'] = crossVoters.voters.dimension(function(d){ return d.towncity}),
		crossVoters.groups['Town/City'] = crossVoters.dimensions['Town/City'].group().reduceCount(),
		
		crossVoters.dimensions['Gender'] = crossVoters.voters.dimension(function(d){ return d.gender}),
		crossVoters.groups['Gender'] = crossVoters.dimensions['Gender'].group().reduceCount(),
		
		crossVoters.dimensions['Age'] = crossVoters.voters.dimension(function(d){ return (2014-parseInt(d.dob.substring(0,4))) }),
		crossVoters.groups['Age'] = crossVoters.dimensions['Age'].group().reduceCount(),
		
		crossVoters.dimensions['Vote Frequency in Last 5 Years'] = crossVoters.voters.dimension(function(d){ if(d.voter_history == null){return 0;} return d.voter_history.split(";").length || 0; }),
		crossVoters.groups['Vote Frequency in Last 5 Years'] = crossVoters.dimensions['Vote Frequency in Last 5 Years'].group().reduceCount(),
		
		crossVoters.dimensions['Registration Length'] = crossVoters.voters.dimension(function(d){ return (2014-parseInt(d.reg_date.substring(0,4))) }),
		crossVoters.groups['Registration Length'] = crossVoters.dimensions['Registration Length'].group().reduceCount();

		crossVoters.dimensions['Election District'] = crossVoters.voters.dimension(function(d){ return d.towncity+" "+d.ward+" "+d.ed; }),
		crossVoters.groups['Election District'] = crossVoters.dimensions['Election District'].group().reduceCount(),

		crossVoters.dimensions['Address'] = crossVoters.voters.dimension(function(d){ return d.address; }),
		crossVoters.groups['Address'] = crossVoters.dimensions['Address'].groupAll();

		crossVoters.initialized = true;
	},

	filter: function(dim,val){
		//console.log('filtering',dim,val,crossVoters.dimensions)
		if( ['Vote Frequency in Last 5 Years','Age'].indexOf(dim) > -1){
			
			val.forEach(function(d){
				crossVoters.dimensions[dim].filter(d);
			});
		
		}else{
			
			crossVoters.dimensions[dim].filter(function(d){
			  return val.indexOf(d) > -1;
			});
		
		}
	}
}

module.exports = crossVoters; 