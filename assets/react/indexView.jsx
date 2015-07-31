'use strict';
//---------------------------------------
// App Controller View
// One Per Server Side Route
//
//---------------------------------------

//  --- Libraries
var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    Routes = Router.Routes,
    Redirect = Router.Redirect,
    DefaultRoute = Router.DefaultRoute,

    //  --- Layout Controller View
    App = require('./pages/layout.react'),

    //  --- Pages
    Dashboard = require('./pages/Dashboard.react'),
    MarketAreaIndex = require('./pages/marketarea/MarketAreaIndex.react'),
    MarketAreaEdit = require('./pages/marketarea/MarketAreaEdit2.react'),
    MarketAreaNew = require('./pages/marketarea/MarketAreaNew.react'),
    ModelAnalysis = require('./pages/modeling/ModelAnalysis.react'),
    ModelCreate = require('./pages/modeling/ModelCreate.react'),
    GtfsManager = require('./pages/datasources/GtfsManager.react'),
    AcsManager = require('./pages/datasources/AcsManager.react'),
    RegressionsManager = require('./pages/datasources/RegessionsManager.react'),
    SurveyManager = require('./pages/datasources/SurveyManager.react'),
    FareboxManager = require('./pages/datasources/FareboxManager.react'),
    UserAdmin = require('./pages/admin/UserAdmin.react'),
    JobHistory = require('./pages/jobs/JobHistory.react'),
// --- Server API
    sailsWebApi = require('./utils/sailsWebApi.js');

// ---
    sailsWebApi.init(window.User);


var i18n = {
  locales: ["en-US"]
};


//  --- Routes
var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="MarketAreaIndex" path="/marketarea/:marketareaID" handler={MarketAreaIndex} />
    <Route name="MarketAreaEdit" path="/marketarea/:marketareaID/edit" handler={MarketAreaEdit} />
    <Route name="MarketAreaNew" path="/new/marketarea" handler={MarketAreaNew} />
    <Route name="ModelAnalysis" path="/marketarea/:marketareaID/models" handler={ModelAnalysis} />
    <Route name="ModelCreate" path="/marketarea/:marketareaID/models/new" handler={ModelCreate} />
    <Route name="GtfsManager" path="/datasources/gtfs" handler={GtfsManager} />
    <Route name="AcsManager" path="/datasources/acs" handler={AcsManager} />
    <Route name="SurveyManager" path="/datasources/survey" handler={SurveyManager} />
    <Route name="FareboxManager" path="/datasources/farebox" handler={FareboxManager} />
    <Route name="RegressionsManager" path="/datasources/regressions" handler={RegressionsManager} />
    <Route name="dashboard" handler={Dashboard} />
    <Route name="userAdmin" path="admin/users"  handler={UserAdmin} />
    <Route name="jobhistory" path="/jobs/jobhistory" handler={JobHistory} />
    <DefaultRoute handler={Dashboard}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler locales={i18n.locales}/>, document.body);
});
