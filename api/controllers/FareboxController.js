var buffer=new Buffer(1)
var fs=require('fs')
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
					  'FROM farebox_data_distinct '+
					  'where line in '+JSON.stringify(ma.routes).replace(/\"/g,"'").replace("[","(").replace("]",")")+
					  ' order by run_date';

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
			    var dateArray = files[0].filename.split('.')[0];
			    dateArray = dateArray.split('_');

			   	if( dateArray.length === 3){


				    var year = dateArray[2],
				   		month = dateArray[0]-1,
				   		day = dateArray[1];

			 		fs.readFile(files[0].fd, "utf8", function(error, data) {
				    	var lines = data.split('\n');
				    	var names = ['line','run','trip','pattern','time_period','boarding_zone','alighting_zone','total_transactions'];
				    	var output = [];
				    	lines.forEach(function(d,i){
				    		//console.log(d);
				    		var row = {};

				    			var cols = d.split(',');


				    			names.forEach(function(d,i){
				    				row[d] = cols[i];
				    			});
				    			if(row.time_period){
					    			var timeString = row.time_period.replace(/"/g, '').split('-')[0];

					    			var ampm = timeString.substr(timeString.length-1,1),
					    				hour = timeString.length === 5 ? timeString.substr(0,2) : timeString.substr(0,1);
					    				minutes = timeString.length === 5 ? timeString.substr(2,2) : timeString.substr(1,2);
					    				if(ampm === 'p'){
					    					hour =  12 + parseInt(hour);
					    				}

					    				row.run_date = new Date(year, month, day, hour, minutes)
					    				console.log(row.time_period,year, month, day, hour, minutes,row.run_date.getTime(),row.run_date.toDateString())

					    			output.push(row);
					    		}
				    	})
				    	output = output.filter(function(d){
				    		return d.line;
				    	})
				    	var sql = 'Insert into farebox_data  ('+names.join(',')+',run_date) values ';
				    	var values = output.map(function(d){
				    		return "('"+d.line+"','"+d.run+"','"+d.trip+"','"+d.pattern+"','"+d.time_period+"',"+d.boarding_zone+","+d.alighting_zone+","+d.total_transactions+",'"+d.run_date.toUTCString()+"')"
				    	}).join(',')
				    	sql += values;

				    	console.log('the data',sql)
				    	Farebox.query(sql,{},function(err,data){
				    		console.log('got something back',err,data)
				    	})

			 		}) // end file open
			 	}else{ console.log('invalid filename must be month_day_year.csv',files[0].filename.split('.')[0].split['_'])}
			}//end callback
		)//end upload
	}
};
