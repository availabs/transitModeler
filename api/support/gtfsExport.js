var fs = require('fs');
var path = require('path');
var dir = 'gtfsFiles';
var dirname = dir+'/';

var exec = require('child_process').exec;
//All gtfs table field names
try{
    var stat  = fs.statSync(dirname);
    if(stat.isDirectory())
      throw {status:'Error',message:'Not Directory'};
}catch(e){
    if(e.message==='Not Directory')
      console.log('File already exists with directory name');
    else{
      fs.mkdirSync(dirname);
    }
}


var file = {
  'agency':{
    fields:["agency_id","agency_name","agency_url","agency_timezone","agency_lang","agency_phone","agency_fare_url"]
  },
  'stops':{
    fields:['stop_id','stop_code','stop_name','stop_desc',
            'stop_lat','stop_lon','zone_id','stop_url',
            'location_type','parent_station','stop_timezone',
            'wheelchair_boarding']
  },
  'routes':{
    fields:['route_id','agency_id','route_short_name',
            'route_long_name','route_desc','route_type','route_url','route_color']
  },
  'trips':{
    fields:['route_id','service_id','trip_id','trip_headsign',
            'trip_short_name','direction_id','block_id','shape_id',
            'wheelchair_accessible','bikes_allowed']
  },
  'stop_times':{
    fields:['trip_id','arrival_time','departure_time','stop_id',
            'stop_sequence','stop_headsign','pickup_type','drop_off_type',
            'shape_dist_traveled','timepoint'],
    exceptions:{
      'timepoint' : 'timepoint::int',
    },
  },
  'calendar':{
    fields:['service_id','monday','tuesday','wednesday','thursday','friday',
            'saturday','sunday','start_date','end_date'],
    exceptions:{
        'start_date': 'to_char(start_date,\'YYYYMMDD\')',
        'end_date'  : 'to_char(end_date,\'YYYYMMDD\')',
        'monday'    : 'monday::int',
        'tuesday'   : 'tuesday::int',
        'wednesday' : 'wednesday::int',
        'thursday'  : 'thursday::int',
        'friday'    : 'friday::int',
        'saturday'  : 'saturday::int',
        'sunday'    : 'sunday::int',
    },
  },
  'calendar_dates':{
    fields:['service_id','date','exception_type'],
    exceptions:{
      'date': 'to_char(date,\'YYYYMMDD\')'
    }
  },
  'fare_attributes':{
    fields:['fare_id','price','currency_type','payment_method','transfers',
            'transfer_duration']
  },
  'fare_rules':{
    fields:['fare_id','route_id','origin_id','destination_id','contains_id',
            ]
  },
  'shapes':{
    fields:['shape_id','shape_pt_lat','shape_pt_lon','shape_pt_sequence',
            'shape_dist_traveled']
  },
  'frequencies':{
    fields:['trip_id','start_time','end_time','headway_secs','exact_times']
  },
  'transfers':{
    fields:['from_stop_id','to_stop_id','transfer_type','min_transfer_time']
  },
  'feed_info':{
    fields:['feed_publisher_name','feed_publisher_url','feed_lang',
            'feed_start_date','feed_end_date','feed_version'],
    exceptions:{
      'feed_start_date':'to_char(feed_start_date,\'YYYYMMDD\')'
    }
  },
};

function getFieldNames(filename){
  var fields = file[filename].fields.map(function(d){
    if(!file[filename].exceptions)
      return d;
    else{
      if(!file[filename].exceptions[d])
        return d;
      else {
        return file[filename].exceptions[d] + ' as '+ d;
      }
    }
  });
  return fields;
}
function makeCsv(schema,filename){
  var sql = 'COPY (SELECT '+getFieldNames(filename).toString()+' FROM \"'+schema+'\".'+filename+') TO STDOUT WITH DELIMITER \',\' CSV HEADER';
  var script = 'echo '+filename+' && psql -h lor.availabs.org -d transitModeler -U postgres -c "'+sql+'" -o '+dirname+filename+'.txt';
  return script;
}

var commands =  Object.keys(file).map(function(filename){
  var temp = makeCsv(process.argv[2],filename);
  return temp;
});
var command = '(' + commands.reduce(function(p,c){return p + ' && ' + c;}) + ')';
var zipCommand = 'cd '+dirname+' && zip -r '+dir +'.zip *' ;

var handler = function(err,sout,serr){
  if(err) console.error(err);
  if(sout) console.log('stdout : ',sout);
  if(serr) console.error('stderr : ',serr);
};
exec(command,function(err,sout,serr){
  handler(err,sout,serr);
  if(!err){
    exec(zipCommand,function(err,sout,serr){
      handler(err,sout,serr);
      if(!err){
        console.log('success');
      }
    });
  }
});
