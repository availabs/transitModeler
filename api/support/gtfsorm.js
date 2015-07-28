var gtfsObjects = {
  trip:{
    table:'trips',
    pkey:['trip_id'],
    fields:{route_id:'string',
            service_id:'string',
            trip_id:'string',
            trip_headsign:'string',
            trip_short_name:'string',
            direction_id:'int',
            block_id:'string',
            shape_id:'string',
            trip_type:'string',
            bikes_allowed:'int',
            wheelchair_accessible:'int'}
  },
  stop:{
    table:'stops',
    pkey:['stop_id'],
    fields:{stop_id:'string',
            stop_code:'string',
            stop_name:'string',
            stop_desc:'string',
            stop_lat:'numeric',
            stop_lon:'numeric',
            zone_id:'string',
            stop_url:'string',
            location_type:'int',
            parent_station:'string',
            stop_timezone:'string',
            wheelchair_boarding:'int',
            platform_code:'string',
            geom:'point'
            }
  },
  stop_time:{
    table:'stop_times',
    pkey:['trip_id','stop_sequence'],
    fields:{trip_id:'string',
            arrival_time:'string',
            departure_time:'string',
            stop_id:'string',
            stop_sequence:'int',
            stop_headsign:'string',
            pickup_type:'int',
            drop_off_type:'int',
            shape_dist_traveled:'numeric',
            timepoint:'boolean'}
  },
  route:{
    table:'routes',
    pkey:['route_id'],
    fields:{route_id:'string',
            agency_id:'string',
            route_short_name:'string',
            route_long_name:'string',
            route_desc:'string',
            route_type:'int',
            route_url:'string',
            route_color:'string',
            route_text_color:'string',
            geom:'MultiLineString'}
  },
  shape:{
    table:'shapes',
    pkey:['shape_id','shape_pt_sequence'],
    fields:{shape_id:'string',
            shape_pt_lat:'numeric',
            shape_pt_lon:'numeric',
            shape_pt_sequence:'int',
            shape_dist_traveled:'numeric',
            geom:'Point',
    }
  },
  frequency:{
    table:'frequencies',
    pkey:['trip_id','start_time'],
    fields:{trip_id:'string',
            start_time:'string',
            end_time:'string',
            headway_secs:'int',
            exact_times:'int',
            }
  },
  calendar:{
    table:'calendar',
    pkey:['service_id'],
    fields:{service_id:'string',
            monday:'boolean',
            tuesday:'boolean',
            wednesday:'boolean',
            thursday:'boolean',
            friday:'boolean',
            saturday:'boolean',
            sunday:'boolean',
            }
  },
  typemap : function(val,type){
    switch(type.toLowerCase()){
      case 'int':
        return val;

      case 'numeric':
        return val;

      case 'boolean':
        return val;

      case 'string':
        return "'"+val+"'";

      case 'point':
        return 'ST_SetSRID(ST_GeomFromGeoJSON(\''+JSON.stringify(val)+'\'),4326)';

      default:
        throw "unrecognized Type";
    }
  },
  nonNullAtts : function(gtfs,obj){
    var fields = Object.keys(gtfs.fields).filter(function(field){
      return obj[field];
    });
    return fields;
  },
  nonNullValues : function(gtfs,obj,atts){
    var scope = this,values;
    values = atts.map(function(att){
      return scope.typemap(obj[att],gtfs.fields[att]);
    });
    return values;
  },
  pkeyValues : function(gtfs,atts,values){
    var vals = gtfs.pkey.map(function(field){
      var ix = atts.indexOf(field);
      return values[ix];
    });
    return vals;
  },
  insert : function(gtfsType,obj,file){
    var gtfs = this[gtfsType];
    var atts = this.nonNullAtts(gtfs,obj);
    var values = this.nonNullValues(gtfs,obj,atts);
    var sql = 'Insert Into "' + file +'".' + gtfs.table +' ' +
              '('+atts+') VALUES (' + values + ');';
    return sql;
  },
  update : function(gtfsType,obj,file,where){
    var gtfs = this[gtfsType];
    var atts = this.nonNullAtts(gtfs,obj);
    var values = this.nonNullValues(gtfs,obj,atts);
    var sets = stringZip(atts,values,',' , '=');
    var pkeyVals = this.pkeyValues(gtfs,atts,values);
    var wheres = stringZip(gtfs.pkey,pkeyVals,' AND ','=');
    if(where){
      var flist = Object.keys(where);
      var fvals = flist.map(function(d){
        return where[d];
      });
      wheres = stringZip(flist,fvals,' AND ','=');
    }
    var sql = 'Update "' + file +'".'+gtfs.table+' '+
              'Set ' + sets + ' WHERE ' + wheres + ';';
    return sql;
  },

};
function stringZip(l1,l2,del,sep){
  var str = '';
  for(var i = 0; i < l1.length; i++){
    if(sep)//if there is a seperator token add it between the elements
      str += l1[i].toString() + sep + l2[i].toString();
    else {
      str += l1[i].toString() + l2[i].toString();
    }
    if(i !== l1.length-1)//add the delimiter to the end of every pair untill the last one
      str += del;
  }
  return str;
}
module.exports = gtfsObjects;
