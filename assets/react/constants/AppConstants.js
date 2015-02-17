

var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({
    
    //-------------------------------------------------------
    //View actions 
    //-------------------------------------------------------
    SET_CURRENT_MARKETAREA: null,
    SELECT_USER: null,
    CREATE_MESSAGE: null,
    CREATE_USER:null,

    SELECT_REGRESSION:null,
    CREATE_REGRESSION:null,

    //-------------------------------------------------------
    //SERVER actions 
    //-------------------------------------------------------
    
     //-------User--------------------------------------------
    RECEIVE_USERS: null,
    SET_SESSION_USER:null,

    //--------MarketArea--------------------------------------
    RECEIVE_MARKETAREAS: null,

    //--------Data Sources------------------------------------
    RECEIVE_RAW_CENSUS_DATA:null,
    RECEIVE_RAW_STATE_TRACTS:null,
    RECEIVE_GTFS_ROUTES:null,
    RECIEVE_DATASOURCES:null,
    RECEIVE_REGRESSIONS:null


    
  }),

  

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
