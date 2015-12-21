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
		0 : 'System',
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
	},

	'tripfreq':{
		1 : '7 day / week',
		2 : '6 day / week',
		3 : '5 day / week',
		4 : '3-4 day / week',
		5 : '1-2 day / week',
		6 : '1-3 day / mnth',
		7 : '< 1 day / month',
		8 : 'first time',
		999 : 'NR'
	},

	'triptenure':{
		1 : '< 6 months',
		2 : '6 month - 1 year',
		3 : '1 -2 years',
		4 : '2 - 5 years',
		5 : '5 - 10 years',
		6 : '> 10 years',
		999 : 'NR'
	},
	'qualservchg':{
		1 : 'Declined',
		2 : 'Somewhat Declined',
		3 : 'Remained the Same',
		4 : 'Somewhat Improved',
		5 : 'Improved',
		6 : 'Not applicable',
		999 : 'NR'
	},

	'gender':{
		1 : 'Male',
		2 : 'Female',
		999: 'NR'
	},

	'age':{
		1 : '< 18 years',
		2 : '18-24 years',
		3 : '25-34 years',
		4 : '35-44 years',
		5 : '45-54 years',
		6 : '55-61 years',
		7 : '62 or over',
		999 : 'NR',
	},
	'race':{
		1 : 'White',
		2 : 'Black',
		3 : 'American Indian, Eskimo or Aleut',
		4 : 'Asian or Pacific Islander',
		5 : 'Multi-Racial',
		6 : 'Other',
		999 : 'NR',
	},
}
