/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var io = require('./sails.io.js')();
var d3 = require('d3');
var ServerActionCreators = require('../actions/ServerActionsCreator');


//---------------------------------------------------
// Socket Events
//--------------------------------------------------
function listenToSockets(sessionUser){
  
  io.socket.on("job_created", function(e){
    console.log('job_created',e)
    ServerActionCreators.receiveData('job',[e])
  });

  io.socket.on("job_updated", function(e){
    console.log('job_updated',e)
    ServerActionCreators.receiveData('job',e)
  });
  // io.socket.on("message", function(message){
  //   console.log("on message",message)
  //   //ServerActionCreators.receiveData('message',[message]);
  // });

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
      ServerActionCreators.receiveStateTracts(data);
    });
  },
  getRoutesGeo: function(ma_id,gtfsId,routes) {
    d3.json('/datasources/gtfs/geo/'+gtfsId)
      .post(JSON.stringify({route:routes}),function(err,data){     
      ServerActionCreators.receiveDataWithId('gtfs_geo',ma_id,data);
    });
  },
  //---------------------------------------------
  // DataSources
  //---------------------------------------------
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

  getGtfsRoutes: function(tablename,gtfs_id){
    io.socket.get( '/dataSources/gtfs/routes/'+tablename,function(data){
      ServerActionCreators.receiveDataWithId('gtfs_route', gtfs_id, data)
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
  // Sails Rest Route
  //---------------------------------------------------
  create: function(type,data){
    io.socket.post('/'+type,data,function(resData){
      
      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },
  
  read: function(type) {

    var where = {}
    d3.json('/'+type,function(err,data){     
      //console.log('utils/sailsWebApi/getUsers',data);
      ServerActionCreators.receiveData(type,data);
    });
  },

  update: function(type,data){
    io.socket.put('/'+type+'/'+data.id,data,function(resData){
      
      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },

  delete: function(type,id){
    io.socket.delete('/'+type+'/'+id,function(resData){
      console.log('utils/sailsWebApi/delete',resData,id);

      //Delete 
      ServerActionCreators.deleteData(type,id);
    });
  }

}

