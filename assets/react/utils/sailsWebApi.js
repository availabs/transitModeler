/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var io = require('./sails.io.js')();
var d3 = require('d3');
var ServerActionCreators = require('../actions/ServerActionsCreator');

// !!! Please Note !!!
// We are using localStorage as an example, but in a real-world scenario, this
// would involve XMLHttpRequest, or perhaps a newer client-server protocol.
// The function signatures below might be similar to what you would build, but
// the contents of the functions are just trying to simulate client-server
// communication and server-side processing.

module.exports = {
  
  init:function(user){
    ServerActionCreators.setSessionUser(user);
    this.getStateGeodata(34);
    
    this.read('marketarea');
    this.read('user');
    this.read('regression');
    this.read('datasource');
    
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
  //---------------------------------------------
  // DataSources
  //---------------------------------------------
  getRawCensus: function(marketareaId,year){
    io.socket.get('/datasources/acs/'+marketareaId+'/'+year,function(data){
      ServerActionCreators.receiveRawCensus(marketareaId,year,data.census);
    })
  },

  getGtfsRoutes: function(tablename,gtfs_id){
    io.socket.get( '/dataSources/gtfs/routes/'+tablename,function(data){
      ServerActionCreators.receiveDataWithId('gtfs_route', gtfs_id, data)
    })
  },
  //---------------------------------------------------
  // Sails Rest Route
  //---------------------------------------------------
  create: function(type,data){
    io.socket.post('/'+type,data,function(resData){
      //ToDo Check for Errors and Throw Error Case
      console.log('utils/sailsWebApi/createUser',resData);

      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },
  
  read: function(type) {

    var where = {}
    io.socket.get('/'+type,where,function(data){     
      //console.log('utils/sailsWebApi/getUsers',data);
      ServerActionCreators.receiveData(type,data);
    });
  },

  update: function(type,data){
    io.socket.put('/'+type+'/'+data.id,data,function(resData){
      //ToDo Check for Errors and Throw Error Case
      console.log('utils/sailsWebApi/updateData',resData);

      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },

  delete: function(type,id){
    io.socket.delete('/'+type+'/'+id,function(resData){
      //ToDo Check for Errors and Throw Error Case
      console.log('utils/sailsWebApi/delete',resData,id);

      //Delete 
      ServerActionCreators.deleteData(type,id);
    });
  }

}

