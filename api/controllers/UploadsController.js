/**
 * Uploads Controller
 *
 * @description :: Server-side logic for managing Uploads
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var path = require('path');
var password='transit';
var conString = 'postgres://postgres:'+password+'@lor.availabs.org:5432/transitModeler';
 function spawnJob(job){
 	var terminal = require('child_process').spawn('bash');
 	var current_progress = 0;
 	var gtfsEntry = {
 		tableName:job.info[0].schemaName,
   	 	filePath:job.info[0].file.fd,
   		agency:'',
   		startDate:'',
   		endDate:'',
   		numRoutes:0,
   		numStops:''
   	};
   	terminal.stdout.on('data', function (data) {
 	    data = data+'';
 	    if(data.indexOf('gtfsdb.model') !== -1){
 	    	current_progress++;
 	    	console.log('Loading',current_progress,data.split(" ")[3]);
 	    	Job.update({id:job.id},{status:data.split(" ")[3],progress: ((current_progress/20)*100).toFixed(0) })
     		.exec(function(err,updated_job){
     			if(err){ console.log('job update error',error); }
     			sails.sockets.blast('job_updated',updated_job);
     		});

 	    }
 	    else{
 	    	console.log('Unrecognized Output::',data);
 	    }
 	});



 	terminal.on('exit', function (code) {
 		code = code*1;
 	    console.log('child process exited with code ' + code);
 	    if(code === 0){
 	    	Job.findOne(job.id).exec(function(err,newJob){

 	    		if(newJob.status != 'Cancelled'){
            //if job is not cancelled, in this version of the app we want to only add to the datasource tableName
            var onFinish = function(data){
              console.log('GTFS START',data);
              var ds = {
                type:'gtfs',
                tableName:gtfsEntry.tableName,
                stateFips:34,
                settings:[{readOnly:true,uploaded:true,started:data.min,agency:data.agency_name}],
              };
              console.log(ds);
              Datasource.create(ds).exec(function(err,newEntry){
                if(err){console.log('Error Creating DataSource',err);}
                Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
                   .exec(function(err,updated_job){
                     if(err){console.log('job_update error',error);}
                     sails.sockets.blast('job_updated',updated_job);
                   });
              });
            };
            var query = 'SELECT min(cal.start_date),agency.agency_name FROM "'+gtfsEntry.tableName+'".calendar as cal, "'+gtfsEntry.tableName+'".agency as agency GROUP BY agency.agency_name';
            Datasource.query(query,{},function(err,data){
              if(err){
                query = 'SELECT min(cal.date),agency.agency_name FROM "'+gtfsEntry.tableName+'".calendar_dates as cal, "'+gtfsEntry.tableName+'".agency as agency GROUP BY agency.agency_name';
                Datasource.query(query,{},function(err,data){
                  if(err){
                    console.log('ERROR: UPLOADSCONTROLLER - gtfs start date unknown',gtfsEntry.tableName,err);
                  }
                  onFinish(data.rows[0]);
                });
              }
              else{
                onFinish(data.rows[0]);
              }
            });

 			    // 	var sql = "SELECT agency.agency_name,min(calendar_dates.date) as start_date,max(calendar_dates.date) as end_date FROM "+gtfsEntry.tableName+".calendar_dates,"+gtfsEntry.tableName+".agency group by agency.agency_name";
 			    // 	console.log(sql);
 			   //  	Datasource.query(sql,{},function(err,data){
          //
 			   //  		console.log('select from new gtfs',data);
 			   //  		if(data.rows.length > 0){
 				 //    	  gtfsEntry.agency = data.rows[0].agency_name;
 				 //    	  gtfsEntry.startDate = data.rows[0].start_date;
 				 //    	  gtfsEntry.endDate = data.rows[0].end_date;
 				 //    	}else{
 				 //    		gtfsEntry.agency = job.info[0].file.filename;
 				 //    	}
 				 //    	MetaGtfs.create(gtfsEntry)
 				// 	    .exec(function(err,newEntry){
 				// 	    	if(err){ console.log('metaAcs create error',err);}
          //
 				// 		    Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
 				// 			.exec(function(err,updated_job){
 				// 				if(err){ console.log('job update error',error); }
 				// 				sails.sockets.blast('job_updated',updated_job);
 				// 			});
 				// 		});
          //
 				// 	});

 				}

      });

 		}else{
 			Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Failure'})
 			.exec(function(err,updated_job){
 				if(err){ console.log('job update error',err); }
 				sails.sockets.blast('job_updated',updated_job);
 			});
 		}
 	});

 	setTimeout(function() {


         var query = 'CREATE SCHEMA "'+job.info[0].schemaName+'" ';
 		Datasource.query(query,{} ,function(err, result) {
 			if(err){ console.log('create schema error',err); }

 		    var destinationStream = job.info[0].file.fd;//__dirname + '/cdta_20140811_0109.zip';//+fileInfo.name;
 	        console.log("RUNNING:gtfsdb-load --database_url "+conString+" --schema="+job.info[0].schemaName+" --is_geospatial "+destinationStream);
 	        terminal.stdin.write("gtfsdb-load --database_url "+conString+" --schema="+job.info[0].schemaName+" --is_geospatial "+destinationStream);

 	        terminal.stdin.end();

 		    Job.update({id:job.id},{pid:terminal.pid}).exec(function(err,updated_job){
 		    	if(err){ console.log('job update error',error); }
 				sails.sockets.blast('job_updated',updated_job);
      });

 		});


 	}, 1000);
 }

module.exports = {
  upload:function(req,res){
    console.log(req.file());
    dirname = path.resolve(sails.config.appPath,'/assets/images');
    req.file('files').upload({dirname:'assets/data/gtfs', maxBytes:500000000},
          function (err, files) {
            if (err){

              console.log("Error: ",err);
              return res.json({message: 'Upload error',files: [] });

          }

        console.log(files);
        var now = new Date();
        var schemaName = "gtfs_"+now.getFullYear()+''+now.getMonth()+''+now.getDate()+'_'+now.getHours()+'_'+now.getMinutes();

        Job.create({
          isFinished:false,
          type:'load GTFS',
          info:[{'file':files[0],'schemaName':schemaName}],
          status:'Started'
        })
        .exec(function(err,job){
          if(err){console.log('create job error',err);
            req.session.flash = {
              err: err
            };
            res.redirect('/data/gtfs');
            return;
          }
          sails.sockets.blast('job_created',job);

          var flashMessage = [{
            name:"Test",
            message: "job created "+job.id,
          }];

          spawnJob(job);

          req.session.flash = {
            err: flashMessage
          };
          return res.json({
            message: files.length + ' file(s) uploaded successfully!',
                files: files
            });

        });

    });
  }
};
