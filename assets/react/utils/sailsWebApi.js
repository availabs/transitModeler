
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var io = require('./sails.io.js')();
var d3 = require('d3');
var ServerActionCreators = require('../actions/ServerActionsCreator');
var UserActions          = require('../actions/UserActions');
var GtfsActionsCreator = require('../actions/GtfsActionsCreator');
var GroupAdminActions  = require('../actions/GroupAdminActions');
var Router = require('./hereApi');
var tractApp = require('../../../appconfig').tractApp;

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
    UserActions.setSessionUser(user);
    UserActions.getAllUsers();
    GroupAdminActions.getAllGroups();
    // this.getStateGeodata(34);
    this.getModelRuns();
    this.read('marketarea');
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
  getMAGeodata : function(group,maid,agency){
    d3.json('/geo/groups/'+group+'/'+maid+'tracts.json',function(data){
      ServerActionCreators.receiveMATracts(maid,agency,'tracts',data);
    });
    d3.json('/geo/groups/'+group+'/'+maid+'counties.json',function(data){
      ServerActionCreators.receiveMATracts(maid,agency,'counties',data);
    });
  },
  getRouteTracts : function(aid,rid,excludes){

    if(Array.isArray(rid)){
      rid = '?'+rid.map(function(r){return 'rid[]='+r;}).join('&');
    }else{
      rid = '?rid='+rid;
    }
    d3.json(tractApp+'agency/'+aid+'/tract/route/'+rid)
      .post(JSON.stringify(excludes),function(err,data){
        if(err){
          console.log(err);
        }else{
          console.log('TractData Received',data);
          ServerActionCreators.receiveTracts(data);
        }
      });
  },
  getRouteCounties : function(aid,rid,excludes){
    var id = rid;
    if(Array.isArray(rid)){
      rid = '?'+rid.map(function(r){return 'rid[]='+r;}).join('&');
    }else{
      rid = '?rid='+rid;
    }
    console.log(tractApp + 'agency/'+aid+'/county/route'+rid);
    d3.json(tractApp + 'agency/'+aid+'/county/route'+rid)
      .post(JSON.stringify(excludes),function(err,data){
      if(err){
        console.log(err);
      }else{
        ServerActionCreators.receiveCounties(data,aid,rid);
      }
    });
  },
  getEditRoutesGeo : function(gtfsId,routes,maId,cb){
    d3.json('datasources/gtfs/routes/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_edit_route',[gtfsId,maId],data);
        if(cb){cb(gtfsId,data);}
      });
  },
  getEditStopsGeo : function(gtfsId,routes,maId,cb){
    d3.json('datasources/gtfs/stops/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_edit_stop',[gtfsId,maId],data);
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
  getRoutesSched: function(gtfsId,routes,maId,cb) {
    d3.json('/datasources/gtfs/schedule/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){
        ServerActionCreators.receiveDataWithId('gtfs_sched',[gtfsId,maId],data);
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
    //console.log(url);
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

  uploadGtfsFiles : function(files){
    d3.json('/gtfs/upload')
      .post(JSON.stringify({files:files}),function(err,data){
        if(err) console.log(err);
        else {
          console.log(data);
        }
      });
  },
  //---------------------------------------------
  // DataSources
  //---------------------------------------------

  loadSurvey:function(marketareaId){
      d3.json('/datasources/survey/'+marketareaId,function(data){
        ServerActionCreators.receiveDataWithId('survey',marketareaId,data);
      });
  },

  loadFarebox:function(marketareaId,cb){
      d3.json('/datasources/farebox/'+marketareaId,function(data){
        cb();
        ServerActionCreators.receiveDataWithId('farebox',marketareaId,data);
      });
  },

  getRawCensus: function(marketareaId,year){
    d3.json('/datasources/acs/'+marketareaId+'/'+year,function(data){
      ServerActionCreators.receiveRawCensus(marketareaId,year,data.census);
    });
  },

  getCtpp: function(marketareaId){
    d3.json('/datasources/ctpp/'+marketareaId,function(data){
      //console.log('sailsWebApi / getCtpp',marketareaId,data)
      ServerActionCreators.receiveCtpp(marketareaId,data);
    });
  },

  getLodes: function(marketareaId){
    d3.json('/datasources/lodes/'+marketareaId,function(data){
      //console.log('sailsWebApi / getCtpp',marketareaId,data)
      ServerActionCreators.receiveLodes(marketareaId,data);
    });
  },

  getGtfsRoutes: function(tablename,gtfs_id,cb){
    d3.json( '/dataSources/gtfs/routes/'+tablename,function(data){
      ServerActionCreators.receiveDataWithId('gtfs_route', gtfs_id, data);
      if(cb){
        cb( gtfs_id, data);
      }
    });
  },

  //----------------------------------------------
  //Modeling
  //-----------------------------------------------
  getTriptable:function(settings){
    console.info('TripTable Post',settings);
    d3.json('/triptable')
      .post(JSON.stringify({triptable_settings:settings}),function(err,data){
        ServerActionCreators.receiveData('triptable_list',data);
      });

  },

  runModel:function(data){
    d3.json('/triptable/run')
      .post(JSON.stringify({model:data}),function(err,data){
        if(err){  console.log('SAILS WEB API / runModel / error',err);  }
        //console.log('SAILS WEB API / runModel',data);
      });
  },

  getModelRuns:function(){
    d3.json('/triptable/list',function(err,data){
      //console.log('getModelRun',err,data)
      ServerActionCreators.receiveData('model_run',data);
    });

  },

  getModelRun:function(id,cb){
    d3.json('/triptable/'+id+'/modelrun',function(err,data){
      //console.log('sailsWebApi getModelRun',id,'error',err,'data',data)
      cb();
      ServerActionCreators.receiveDataWithId('full_model_run',id,data);
    });
  },

  updateModelRun : function(data,cb){
    d3.json('/triptable/update')
      .post(JSON.stringify(data),function(err,data){
        if(err)
          console.log(err);
        ServerActionCreators.receiveData({type:'UPDATED_MODEL'},data);
        cb();
      });
  },
  //---------------------------------------------------
  // Datasources Editing
  //---------------------------------------------------
  loadAcs:function(newData){
    d3.json('/acs/load')
    .post(JSON.stringify(newData),function(err,data){
       if(err){  console.log('SAILS WEB API / loadAcs / error',err);  }
       //console.log('SAILS WEB API  / loadACS',data);

    });
  },
  deleteAcs:function(id){
    d3.json('/acs/delete/'+id,function(err,data){
      if(err){console.log('SAILS WEB API / deleteAcs / error',err);}
      ServerActionCreators.deleteData('acs',id);
    });
  },
  deleteGtfs : function(ds,cb){
    var url = '/datasources/gtfs/delete/'+ds.id;
    d3.json(url,function(err,data){
      if(err) console.error(err);
      GtfsActionsCreator.deleteDataSource(ds);
    });
  },
  //---------------------------------------------------
  // Sharing is careing
  //---------------------------------------------------
  shareMarketArea : function(maid,uid,cb){
    var url = '/marketarea/'+maid+'/users/add/'+uid;
    d3.json(url,function(err,data){
      console.log('error',err,'Data',data);
      if(cb && !err)
        cb(data);
    });
  },
  //---------------------------------------------------
  // Sails Rest Route
  //---------------------------------------------------
  get : function(type,id,cb){
    d3.json('/'+type+'/'+id,function(data){
      ServerActionCreators.receiveDataWithId(type,id,data);
      if(cb){cb(data);}
    });
  },

  create: function(type,data,cb){
    var url = '';
    if(type.type)
      url = type.type;
    else {
      url = type;
    }
    d3.json('/'+url).post(JSON.stringify(data),function(err,resData){
      if(err){
        console.log('Create Err',err);
      }
      var retype;
      if(type.type){
        retype = type.returnType;
      }
      else{
        retype = type;
      }
      //console.log('create',type,resData);
      //add new user back to store through
      ServerActionCreators.receiveData(retype,[resData]);
      if(cb) {cb(resData);}
    });
  },

  read: function(model) {
    var url = '',type='';
    if(model.options){
      url += '/' + model.type+'?';
      var temp =  Object.keys(model.options).map(function(d){
        return d+'='+model.options[d];
      });
      if(temp.length !== 0)
        url += temp.reduce(function(p,c){return p+'&'+c;});
      type = model.type;
    }
    else{
      type = model;
      url += '/' + model;
    }

    var where = {};
    d3.json(url,function(err,data){
      //console.log('utils/sailsWebApi/getUsers',data);
      ServerActionCreators.receiveData(type,data);
    });
  },

  update: function(model,data,cb){
    var url = '';
    if(model.options){
      url += '/' + model.type+'?';
      var temp =  Object.keys(model.options).map(function(d){
        return d+'='+model.options[d];
      });
      if(temp.length !== 0)
        url += temp.reduce(function(p,c){return p+'&'+c;});
    }else{
      url += '/'+model+'/'+data.id;
    }
    d3.json(url).send('PUT',JSON.stringify(data),function(err,resData){
      var type = (model.options) ? model.returnType:model;
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

};
