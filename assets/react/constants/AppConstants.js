


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

    SET_ACTIVE_CENSUS_VARIABLE:null,

    //------Modeling-----------------------------------------
    SET_NEW_MODEL_OPTION:null,
    SET_TRIPTABLE_MODE:null,
    ADD_ACTIVE_MODEL_RUN:null,

    //-------------------------------------------------------
    //SERVER actions
    //-------------------------------------------------------

    //-------User--------------------------------------------
    RECEIVE_USERS: null,
    SET_SESSION_USER:null,
    DELETE_USER:null,


    //--------GtfsEditor--------------------------------------
    SET_WAYPOINTS:null,
    SET_EDITOR_SAVE:null,

    //--------MarketArea--------------------------------------
    RECEIVE_MARKETAREAS: null,
    DELETE_MARKETAREA:null,

    //--------Data Sources------------------------------------
    RECEIVE_RAW_CENSUS_DATA:null,
    RECEIVE_RAW_STATE_TRACTS:null,
    RECEIVE_CTPP_DATA:null,
    RECEIVE_SURVEYS:null,

    RECEIVE_GTFS_ROUTES:null,
    RECEIVE_GTFS_GEOS:null,
    RECEIVE_GTFS_STOPS_GEOS:null,
    RECEIVE_GTFS_SCHEDS:null,
    RECEIVE_ROUTING_GEOS:null,
    RECEIVE_EDITOR_RESPONSES:null,

    RECIEVE_DATASOURCES:null,
    RECEIVE_REGRESSIONS:null,

    // -- Modeling
    RECEIVE_TRIPTABLE_LISTS:null,
    RECEIVE_TRIPTABLE:null,
    RECEIVE_MODEL_RUNS:null,
    RECEIVE_FULL_MODEL_RUNS:null,

    // -- Jobs
    RECEIVE_JOBS:null

  }),



  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
