

module.exports = {
	
	//----- Model Time Period---------------------------------------
	time:{
		am:{
			id:'am',
			name:'AM Peak',
			helpText:'All trips starting between 6am and 10am.'
		},
		pm:{
			id:'pm',
			name:'PM Peak',
			helpText:'All trips starting between 3pm and 7pm.'
		},
		full:{
			id:'full',
			name:'Full Day',
			helpText: 'All trips in gtfs weekday schedule.'
		}
	},
	
	//-------- Model Type---------------------------------------------
	type:{
		ctpp:{
			id:'ctpp',
			name:'CTPP',
			helpText:'Use Census Transportation Planning Products Tract to Tract ridership counts'
		},
		regression:{
			id:'regression',
			name:'Regression',
			helpText:'Apply Regression To Find Tract to Tract Ridership'
		}
		
	},
	
	// ---- Trip Table OD point source--------------------------------------
	od:{
		bus:{
			id:'bus',
			name:'Bus Stops',
			helpText:'Use Bus Stops as OD points inside tracts'
		},
		survey:{
			id:'survey',
			name:'Survey OD',
			helpText:'Use Origin and Destination from NJTransit Surveys'
		}
	},
	//------------ Forecast-------------------------------------------------
	forecast:{
		current:{
			id:'current',
			name:'Current',
			helpText:'Use Employment and Population levels from Selected ACS'
		},
		future:{
			id:'future',
			name:'Future Forecase',
			helpText:'Modulate Employment and Population levels'
		}
	}
}
