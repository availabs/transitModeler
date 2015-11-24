var buffer=new Buffer(1);
var fs=require('fs'),
	date_codes = {"4174":"10_10_2014","4178":"10_06_2014","4181":"10_02_2014","4161":"10_01_2014","4152":"10_17_2014","4091":"10_28_2014","4092":"10_27_2014","4094":"10_24_2014","4089":"10_30_2014","4090":"10_29_2014","4097":"10_23_2014","4098":"10_22_2014","4099":"10_31_2014","4100":"10_21_2014","4101":"10_20_2014","4153":"10_16_2014","4154":"10_15_2014","4172":"10_14_2014","4176":"10_08_2014","4160":"10_03_2014","4155":"10_13_2014","4175":"10_09_2014","4177":"10_07_2014"},
	time_periods={'1 - Early AM':5,'2 - AM Peak':8,'3 - Mid Day':12,'4 - PM Peak':17,'5 - Evening':20}

/**
 * FareboxController
 *
 * @description :: Server-side logic for managing fareboxes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	getFarebox:function(req,res){

		MarketArea.findOne(req.param('marketareaId')).exec(function(err,ma){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}

			var sql = 'SELECT line,run,trip,pattern,boarding_zone,alighting_zone,run_date,total_transactions '+
					  'FROM farebox_data '+
					  'where line in '+JSON.stringify( ma.routes.filter( function(d){return d;} ) ).replace(/\"/g,"'").replace("[","(").replace("]",")")+
					  ' order by run_date';

			// console.log('------------get farebox----------------')
			// console.log(sql)
			// console.log('------------/get farebox/----------------')

			Farebox.query(sql,{},function(err,data){
				if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}

				res.json(data.rows)

			})
		});
	},

	upload:function(req,res){
		req.file('file').on('progress', function(e){

	  	})
	  	.upload(
	    	{dirname:'assets/uploads/',maxBytes:5000000000},
	    	function (err, files) {
	      		if (err){
			      	console.log("File Processing Error: ",err)
			      	return //res.serverError(err); //This probably crashes server? Testing seemed to vary...
			    }

			    console.log('file uploaded. Creating Job',files);
			    var dateArray = files[0].filename.split('.')[0],
			    	year=null, month=null, day=null;

			    dateArray = dateArray.split('_');

			    if(files[0].filename.split('.')[0] !== 'paterson_october'){
				   	

				   	if( dateArray.length !== 3){
				 		var msg = 'Invalid filename must be month_day_year.csv ex. "7_25_2013.csv" got: '+files[0].filename; 
				 		console.log(1,msg)
				 		return res.json({error:msg});
				 	}
				 	year = dateArray[2],
				   	month = dateArray[0]-1,
				   	day = dateArray[1];

				 	if(isNaN(year) || isNaN(month) || isNaN(day)){
				 		var msg = 'Invalid filename must be month_day_year.csv ex. "7_25_2013.csv" got: '+files[0].filename; 
				 		console.log(2,msg)
				 		return res.json({error:msg});
				 	}
				
				}
 	
		 		fs.readFile(files[0].fd, "utf8", function(error, data) {
			    	var lines = data.split('\n');
			    	var names = ['line','run','trip','pattern','time_period','boarding_zone','alighting_zone','total_transactions'];
			    	var output = [];

			    	lines.forEach(function(d,i){
			    		//console.log(d);
			    		var row = {};

			    		var cols = d.split(',');

		    			if( ( cols[0] !== '"LINE"' && cols[0] !== 'LINE' )  ){
			    			
			    			names.forEach(function(d,i){
			    				if( cols[i] ){
			    					row[d] = cols[i];
			    				}

			    			});
			    			
			    			if(row.time_period){
			    				if( Object.keys(time_periods).indexOf(row.time_period) >= 0 ) {
			    					
			    					row['processing_code'] = cols[30];
			    					
			    					if( date_codes[row.processing_code] ){
			    						dateArray = date_codes[row.processing_code].split('_');
			    						year = dateArray[2],
									   	month = dateArray[0]-1,
									   	day = dateArray[1];
									   	
									   	var hour = time_periods[row.time_period],
									   		minutes = 0;

									   	row.run_date = new Date(year,month,day,hour,minutes)
									   	//console.log(row.time_period,year, month, day, hour, minutes,row.run_date.getTime(),row.run_date.toDateString())
			    						output.push(row);
			    					}

			    				}
			    				else{
					    			var timeString = row.time_period.replace(/"/g, '').split('-')[0];

					    			var ampm = timeString.substr(timeString.length-1,1),
					    				hour = timeString.length === 5 ? timeString.substr(0,2) : timeString.substr(0,1);
					    				minutes = timeString.length === 5 ? timeString.substr(2,2) : timeString.substr(1,2);
				    				
				    				if(ampm === 'p'){
				    					hour =  12 + parseInt(hour);
				    				}
				    				row.run_date = new Date(year, month, day, hour, minutes)
				    					//console.log(row.time_period,year, month, day, hour, minutes,row.run_date.getTime(),row.run_date.toDateString())
				    				
				    				output.push(row);
				    			}

				    			
				    		}
			    		}
			    	});


			    	output = output.filter(function(d){
			    		return d.line;
			    	});

			    	var sql = 'Insert into farebox_data  ("'+names.join('","')+'",run_date) values ';
			    	
			    	var values = output.map(function(d){
			    		return "('"+d.line+"','"+d.run+"','"+d.trip+"','"+d.pattern+"','"+d.time_period+"',"+d.boarding_zone+","+d.alighting_zone+","+d.total_transactions+",'"+d.run_date.toUTCString()+"')"
			    	}).join(',');

			    	sql += values;

			    	console.log('the data',sql.substr(0,2000))
			    	Farebox.query(sql,{},function(err,data){
			    		console.log('got something back',err,data)
			    		return res.json({error:err,data:data});
			    	})

		 		}) // end file open
			 	
			}//end callback
		)//end upload
	}
};
