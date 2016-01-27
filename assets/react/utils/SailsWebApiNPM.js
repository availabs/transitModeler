/*globals require,module,console*/
'use strict';

var d3 = require('d3'),
    topojson = require("topojson"),
    LoadingActions = require("../actions/LoadingActions"),
    soCRUD = SailsCRUD();

var LOADING = 0;

function checkLoading(bool) {
    if (bool && !LOADING) {
        // console.log("<SailsWebApi::LOADING_START>");
        LoadingActions.loadingStart();
    }
    else if (!bool && LOADING == 1) {
        // console.log("<SailsWebApi::LOADING_STOP>");
        LoadingActions.loadingStop();
    }
    LOADING += bool ? 1 : -1;
}

module.exports = {
// USER ACTIONS
    getAllUsers: function(cb) {
        checkLoading(true);
        soCRUD('user').read(wrapCB(cb));
    },
    createUser: function(user, cb) {
        checkLoading(true);
        soCRUD('user').create(user, wrapCB(cb));
    },
    updateUser: function(user, cb) {
        checkLoading(true);
        soCRUD('user').update(user.id, user, wrapCB(cb));
    },
    deleteUser: function(user, cb) {
        checkLoading(true);
        soCRUD('user').delete(user.id, wrapCB(cb));
    },

// GROUP ACTIONS
    getAllGroups: function(cb) {
        checkLoading(true);
        soCRUD('usergroup').read(wrapCB(cb));
    },
    createGroup: function(group, cb) {
        checkLoading(true);
        soCRUD('usergroup').create(group, wrapCB(cb));
    },
    updateGroup: function(group, cb) {
        checkLoading(true);
        soCRUD('usergroup').update(group.id, group, wrapCB(cb));
    },
    deleteGroup: function(group, cb) {
        checkLoading(true);
        soCRUD('usergroup').delete(group.id, wrapCB(cb));
    },

// STATE_COUNTIES ACTIONS
    loadStateCounties: function(state, cb) {
        checkLoading(true);
        d3.json("/data/us_counties.json", function(error, topology) {
            checkLoading(false);
            if (error) {
                return;
            }
            var geoJSON = topojson.feature(topology, topology.objects.counties);

            geoJSON.features = geoJSON.features.filter(function(feature) {
                    return Math.floor(feature.id/1000) == +state;
                });
            cb(geoJSON);
        });
    },

// COUNTY_ROADS ACTIONS
    loadCountyRoads: function(county, cb) {
        checkLoading(true);
        d3.json("/roads/county/"+county, function(error, topology) {
            checkLoading(false);
            if (error) {
                return;
            }
            var geoJSON = topojson.feature(topology, topology.objects.geo);
            geoJSON.features.forEach(function(f) {
                f.id = f.properties.linkID;
            });
            cb(geoJSON);
        });
    },

// COUNTY_ROADS_DATA ACTIONS
    loadRoadData: function(params, cb) {
        checkLoading(true);

        d3.json('/roads/data/'+JSON)
            .post(JSON.stringify({ params: params }), wrapCB(cb));
    },

// ROUTE_CREATION ACTIONS
    createRoute: function(points, cb) {
        checkLoading(true);

        d3.json('/route/create/'+JSON.stringify(points), wrapCB(cb));
    },
    saveRoute: function(route, cb) {
        checkLoading(true);

        d3.json('/route/save')
            .post(JSON.stringify({ route: route }), wrapCB(cb));
    },
    loadSavedRoutes: function(userId, userGroup, cb) {
        checkLoading(true);

        d3.json("/route/load")
            .post(JSON.stringify({userId:userId,userGroup:userGroup}), wrapCB(cb));
    },
    deleteRoute: function(id, cb) {
        checkLoading(true);
        soCRUD('route').delete(id, wrapCB(cb));
    },

// ROUTE_VIEW ACTIONS
    loadMonthlyHoursData: function(tmcArray, id, cb) {
        checkLoading(true);

        d3.json('/route/data/monthlyhours')
            .post(JSON.stringify({ tmcArray: tmcArray, routeId: id }), wrapCB(cb));
    },
    getMonthsWithData: function(cb) {
        checkLoading(true);

        d3.json('/route/months', wrapCB(cb));
    },
    loadBriefData: function(data, cb) {
        checkLoading(true);
    	d3.json("/route/data/brief")
    		.post(JSON.stringify(data), wrapCB(cb));
    },

// INCIDENTS_VIEW ACTIONS
    loadIncidentsData: function(tmcArray, month, cb) {
        checkLoading(true);

        d3.json("incidents/checkroute/")
            .post(JSON.stringify({ tmcArray: tmcArray, month: month }), wrapCB(cb));
    },

// SYS_ADMIN ACTIONS
    reloadRoutes: function(cb) {
        checkLoading(true);

        d3.json("/sys/reloadroutes", wrapCB(cb));
    }
};

function wrapCB(cb) {
    return function(error, data) {
        if (!error) {
            cb(data);
        }
        checkLoading(false);
    };
}

function SailsCRUD() {
    var URL = null,
        method = "GET",
        response = function(d) { return JSON.parse(d.responseText); };

    function crud(m) {
        URL = "/"+m;
        return crud;
    }
    crud.create = function(data, cb) {
        method = "POST";
        send(data, cb);
    };
    crud.read = function(id, cb) {
        if (typeof id === "function") {
            cb = id;
            id = null;
        }
        method = "GET";
        URL += id ? "/"+id : "";
        send(cb);
    };
    crud.update = function(id, data, cb) {
        method = "PUT";
        URL += "/"+id;
        send(data, cb);
    };
    crud.delete = function(id, cb) {
        method = "DELETE";
        URL += "/"+id;
        send(cb);
    };
    crud.response = function(r) {
        response = r;
    };

    return crud;

    function send(data, cb) {
        console.log(URL,data);
        var xhr = d3.xhr(URL).response(response);

        if (typeof data === "function") {
            xhr.send(method, data);
        }
        else {
            xhr.send(method, JSON.stringify(data), cb);
        }
    }
}
