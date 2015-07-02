//['busroute','captivity','accessmode','vehicleavail','tickettype','tripfreq','triptenure','qualservchg','gender','age','race']

module.exports = {
	
	'captivity':{
		1 : 'No Choice',
		2 : 'Best Choice',
		3 : 'Not Usual Choice',
		999 : 'NR',
	},
	
	'accessmode':{
		1 : 'Walked',
		2 : 'Drove',
		3 : 'Carpool',
		4 : 'Bus',
		5 : 'NJT Train',
		6 : 'Bike',
		7 : 'Taxi',
		8 : 'RiverLINE',
		10 : 'PATCO',
		11 : 'AC Jitney',
		12 : 'Subway',
		14 : 'PATH',
		15 : 'SEPTA',
		999 : 'NR'
	},

	'vehicleavail':{
		1 : 'Yes',
		2 : 'No',
		999 : 'NR',
	},

	'tickettype':{
		1 : 'One Way',
		2 : 'Round Trip',
		3 : 'Bus Monthly',
		4 : 'Rail Monthly',
		5 : 'Multitrip',
		6 : 'Student',
		7 : 'Senior',
		8 : 'Other',
		999 : 'NR'
	}
}