


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
    DEL_ACTIVE_MODEL_RUN:null,
    DEL_ACTIVE_MODEL_RUNS:null,
    //-------------------------------------------------------
    //SERVER actions
    //-------------------------------------------------------

    //-------User--------------------------------------------
    RECEIVE_USERS: null,
    SET_SESSION_USER:null,
    DELETE_USER:null,
    UPDATE_USER: null,
    SET_EDIT_TARGET: null,
    GET_ALL_USERS: null,

    //------User Actions--------------------------------------
    USER_ACTION:null,
    RECEIVE_USERACTIONS:null,

    //------Groups--------------------------------------------
    CREATE_GROUP: null,
    DELETE_GROUP: null,
    UPDATE_GROUP: null,
    GET_ALL_GROUPS: null,
    SET_GROUP_EDIT_TARGET: null,

    //------SysAdmin------------------------------------------
    RELOAD_ROUTES: null,
    DISMISS_MESSAGES: null,
    SEND_MESSAGE: null,

    //--------GtfsEditor--------------------------------------
    SET_WAYPOINTS:null,
    SET_EDITOR_SAVE:null,
    SET_TRIPS:null,
    SET_FREQS:null,
    //--------MarketArea--------------------------------------
    RECEIVE_MARKETAREAS: null,
    DELETE_MARKETAREA:null,
    CREATE_MARKETAREA:null,
    UPDATE_MARKETAREA:null,
    //--------Data Sources------------------------------------
    RECEIVE_RAW_CENSUS_DATA:null,
    RECEIVE_RAW_STATE_TRACTS:null,
    RECEIVE_RAW_MA_TRACTS:null,
    RECEIVE_NEW_TRACTS:null,
    REQUEST_NEW_TRACTS:null,
    RECEIVE_NEW_COUNTIES:null,
    DELETE_TRACTS:null,
    RECEIVE_CTPP_DATA:null,
    RECEIVE_LODES_DATA:null,
    RECEIVE_SURVEYS:null,
    RECEIVE_FAREBOXS:null,
    DELETE_DATASOURCE:null,
    DELETE_ACS:null,
    REMOVE_GEO_ROUTE:null,

    SET_GTFS: null,
    REFRESH_DATASOURCES:null,
    RECEIVE_GTFS_EDIT_ROUTES:null,
    RECEIVE_GTFS_EDIT_STOPS: null,
    RECEIVE_GTFS_ROUTES:null,
    RECEIVE_GTFS_GEOS:null,
    RECEIVE_GTFS_STOPS_GEOS:null,
    RECEIVE_GTFS_SCHEDS:null,
    RECEIVE_ROUTING_GEOS:null,
    RECEIVE_EDITOR_RESPONSES:null,
    RECEIVE_FREQ_EDIT_RESPONSES:null,
    RECEIVE_TRIP_FREQUENCIES:null,

    RECEIVE_DATASOURCES:null,
    RECEIVE_REGRESSIONS:null,
    DELETE_REGRESSION:null,

    SET_FAREZONEFILTER:null,
    RECEIVE_FAREZONEFILTERS:null,
    SAVE_FAREZONEFILTER:null,
    DELETE_THIS_FAREZONEFILTER:null,
    DELETE_FAREZONEFILTER:null,
    SET_FARESTOPCOLORS:null,

    RECEIVE_MODELSETTINGSS:null,
    SET_MODELSETTINGS:null,
    EDIT_MODELSETTINGS:null,
    SAVE_MODELSETTINGS:null,
    CREATE_MODELSETTING:null,
    DELETE_MODELSETTINGS:null,
    COMMIT_MODEL_EDITS:null,
    UNDO_MODEL_EDITS:null,
    ADD_MODEL_SETTINGS:null,
    ADD_MODEL_SETTINGS_GROUP:null,

    // -- Modeling
    RECEIVE_TRIPTABLE_LISTS:null,
    RECEIVE_TRIPTABLE:null,
    RECEIVE_TRIPTABLES:null,
    RECEIVE_MODEL_RUNS:null,
    RECEIVE_FULL_MODEL_RUNS:null,
    UPDATE_MODEL:null,
    UPDATED_MODEL:null,
    // -- Jobs
    RECEIVE_JOBS:null,
    RECEIVE_ACTIVE_JOBS:null,
    //Component actions
    SEND_MAIL:null,
    //Loading constants
    LOADING_START: null,
    LOADING_STOP: null,

  }),



  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
