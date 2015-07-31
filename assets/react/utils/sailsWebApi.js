
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var io = require('./sails.io.js')();
var d3 = require('d3');
var ServerActionCreators = require('../actions/ServerActionsCreator');
var Router = require('./hereApi');

//---------------------------------------------------
// Socket Events
//--------------------------------------------------
function listenToSockets(sessionUser){

  io.socket.on("job_created", function(e){
    console.log('job_created',e);
    ServerActionCreators.receiveData('active_job',[e]);
  });

  io.socket.on("job_updated", function(e){
    console.log('job_updated',e);
    ServerActionCreators.receiveData('active_job',e);
  });


}


module.exports = {

  init:function(user){
    ServerActionCreators.setSessionUser(user);
    this.getStateGeodata(34);
    this.getModelRuns();
    this.read('marketarea');
    this.read('user');
    this.read('regression');
    this.read('datasource');
    listenToSockets();
  },


  //-------------------------------------------
  // GeoData
  //-------------------------------------------
  getStateGeodata: function(fips) {
    d3.json('/geo/states/'+fips+'/tracts.json',function(data){
      //console.log('utils/sailsWebApi/getStateGeodata',data);
      ServerActionCreators.receiveStateTracts('tracts',data);
    });
    d3.json('/geo/states/'+fips+'/counties.json',function(data){
      //console.log('utils/sailsWebApi/getStateGeodata',data);
      ServerActionCreators.receiveStateTracts('counties',data);
    });
  },
  getEditRoutesGeo : function(gtfsId,routes,cb){
    d3.json('datasources/gtfs/routes/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_edit_route',gtfsId,data);
        if(cb){cb(gtfsId,data);}
      });
  },
  getEditStopsGeo : function(gtfsId,routes,cb){
    d3.json('datasources/gtfs/stops/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_edit_stop',gtfsId,data);
        if(cb){cb(gtfsId,data);}
      });
  },
  getRoutesGeo: function(ma_id,gtfsId,routes,cb) {
    d3.json('/datasources/gtfs/routes/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
      ServerActionCreators.receiveDataWithId('gtfs_geo',ma_id,data);
      if(cb){ cb(data); }

    });
  },
  getRoutesSched: function(gtfsId,routes,cb) {
    d3.json('/datasources/gtfs/schedule/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_sched',gtfsId,data);
        if(cb){ cb(data); }

    });
  },

  getStopsGeo: function(ma_id,gtfsId,routes,cb) {
    d3.json('/datasources/gtfs/stops/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        if(data && data.features){//if data is proper
          data.features = data.features.filter(function(d){//filter the stops
            var matches = routes.filter(function(line){//filter the routes by the stops lines
              return line === d.properties.line;
            });
            return matches.length > 0; // if any lines matched the stops line return the stop;
          });
        }else{
          console.log('malformed stops geo data');
        }
        ServerActionCreators.receiveDataWithId('gtfs_stops_geo',ma_id,data);
      if(cb){ cb(data); }

    });
  },
  //----------------------------------------
  // GTFS Trip Frequency Data
  //----------------------------------------
  getFrequencyData : function(ids,gtfsid,cb){
    d3.json('/datasources/gtfs/frequencies')
      .post(JSON.stringify({trip_ids:ids,id:gtfsid}),function(err,data){
        ServerActionCreators.receiveData('trip_frequencie',data);
        if(cb){cb(data);}
      });
  },
  putFrequencyData : function(data,gtfsid,cb){
    d3.json('/datasources/gtfs/frequencyUpload/'+gtfsid)
      .post(JSON.stringify(data),function(err,data){
          if(err){
            ServerActionCreators.receiveData('FREQ_EDIT_RESPONSE',{status:'error',response:err});
          }else{
            ServerActionCreators.receiveData('FREQ_EDIT_RESPONSE',data);
          }
          if(cb){cb(data);}
      });
  },
        //---------------------------------------------
        // External GeoData
        //---------------------------------------------
        getRoutingGeo: function(waypoints,cb){
          var dsource = new Router();
          dsource.addwaypoints(waypoints);
          dsource.handleRequest(function(err,data){
            ServerActionCreators.receiveData('routing_geo',data);
            if(cb){cb(data);}
          });
        },
  //--------------------------------------------
  // Gtfs Upload
  //--------------------------------------------
  putGtfsData : function(data,gtfsId,cb){
    d3.json('/datasources/gtfs/schedule/'+gtfsId+'/edit')
      .post(JSON.stringify(data),function(err,data){
          //console.log('sent gtfs data', data);
          if(err){
              ServerActionCreators.receiveData('EDITOR_RESPONSE',{status:'error',response:err});
          }else{
              ServerActionCreators.receiveData('EDITOR_RESPONSE',data);
          }
          if(cb){cb(data);}
      });
  },
  putAndCloneGtfsData : function(data,gtfsId,cb){
    var url = '/datasources/gtfs/clone/'+gtfsId;
    console.log(url);
    d3.json(url)
      .post(JSON.stringify(data),function(err,data){
        if(err){
          ServerActionCreators.receiveData('EDITOR_RESPONSE',{status:'error',response:err});
        }else{
          ServerActionCreators.receiveData('EDITOR_RESPONSE',data);
        }
        if(cb){cb(data);}
      });
  },

  //---------------------------------------------
  // DataSources
  //---------------------------------------------

  loadSurvey:function(marketareaId){
      d3.json('/datasources/survey/'+marketareaId,function(data){
        ServerActionCreators.receiveDataWithId('survey',marketareaId,data)
      })
  },

  loadFarebox:function(marketareaId){
      d3.json('/datasources/farebox/'+marketareaId,function(data){
        ServerActionCreators.receiveDataWithId('farebox',marketareaId,data)
      })
  },

  getRawCensus: function(marketareaId,year){
    io.socket.get('/datasources/acs/'+marketareaId+'/'+year,function(data){
      ServerActionCreators.receiveRawCensus(marketareaId,year,data.census);
    })
  },

  getCtpp: function(marketareaId){
    io.socket.get('/datasources/ctpp/'+marketareaId,function(data){
      //console.log('sailsWebApi / getCtpp',marketareaId,data)
      ServerActionCreators.receiveCtpp(marketareaId,data);
    })
  },

  getGtfsRoutes: function(tablename,gtfs_id,cb){
    io.socket.get( '/dataSources/gtfs/routes/'+tablename,function(data){
      ServerActionCreators.receiveDataWithId('gtfs_route', gtfs_id, data)
      if(cb){
        cb( gtfs_id, data)
      }
    })
  },

  //----------------------------------------------
  //Modeling
  //-----------------------------------------------
  getTriptable:function(settings){
    d3.json('/triptable')
      .post(JSON.stringify({triptable_settings:settings}),function(err,data){
        ServerActionCreators.receiveData('triptable_list',data)
      })

  },

  runModel:function(data){
    d3.json('/triptable/run')
      .post(JSON.stringify({model:data}),function(err,data){
        if(err){  console.log('SAILS WEB API / runModel / error',err);  }
        console.log('SAILS WEB API / runModel',data);
      })
  },

  getModelRuns:function(){
    d3.json('/triptable/list',function(err,data){
      ServerActionCreators.receiveData('model_run',data);
    })

  },

  getModelRun:function(id){
    d3.json('/triptable/'+id+'/modelrun',function(err,data){
      //console.log('sailsWebApi getModelRun',id,'error',err,'data',data)
      ServerActionCreators.receiveDataWithId('full_model_run',id,data)
    })
  },
  //---------------------------------------------------
  // Datasources Editing
  //---------------------------------------------------
  loadAcs:function(newData){
    d3.json('/acs/load')
    .post(JSON.stringify(newData),function(err,data){
       if(err){  console.log('SAILS WEB API / loadAcs / error',err);  }
       console.log('SAILS WEB API  / loadACS',data);
    })
  },

  //---------------------------------------------------
  // Sails Rest Route
  //---------------------------------------------------
  create: function(type,data,cb){
    d3.json('/'+type).post(JSON.stringify(data),function(err,resData){
      if(err){
        console.log('Create Err',err)
      }
      console.log('create',type,resData);
      //add new user back to store through
      ServerActionCreators.receiveData(type,[resData]);
      if(cb) {cb(resData);}
    });
  },

  read: function(type) {

    var where = {};
    d3.json('/'+type,function(err,data){
      //console.log('utils/sailsWebApi/getUsers',data);
      ServerActionCreators.receiveData(type,data);
    });
  },

  update: function(type,data,cb){
    io.socket.put('/'+type+'/'+data.id,data,function(resData){

      //add new user back to store through
      ServerActionCreators.receiveData(type,[resData]);
      if(cb){cb(resData);}
    });
  },

  delete: function(type,id){
    d3.json('/'+type+'/'+id)
    .send('DELETE',function(resData){
      console.log('utils/sailsWebApi/delete',resData,id);

      //Delete
      ServerActionCreators.deleteData(type,id);
    });
  }

}
