/**
 * Route Mappings
* (sails.config.routes)
 * CoffeeScript for the front-end.
 *
 * For more information on routes, check out:
 * http://links.sailsjs.org/docs/config/routes
 */

module.exports.routes = {

  //----------Main Page----------------------------
  '/': 'LandingController.index',

  //---------User Session Routes ------------------
  '/login':'UserController.login',
  '/login/auth':'UserController.auth',
  '/logout':'UserController.logout',

  //------DataSources Routes-----------------------
  '/datasources/acs/:marketareaId/:year':'DataSourceController.getACS',
  '/datasources/ctpp/:marketareaId':'DataSourceController.getCTPP',
  '/datasources/survey/:marketareaId':'DataSourceController.getSurvey',
  '/datasources/farebox/:marketareaId':'FareboxController.getFarebox',

  '/farebox/upload':'FareboxController.upload',


  '/acs/load':'DataSourceController.loadACSData',
  '/acs/delete/:id':'DataSourceController.deleteACS',

  //------GTFS Routes------------------------------
  //routes Geo :id is datasource id for gtfs
  '/datasources/gtfs/routes/geo/:id': 'DataSourceController.getRouteGeo',
  '/datasources/gtfs/stops/geo/:id': 'DataSourceController.getStopsGeo',
  '/datasources/gtfs/routes/:tablename':'DataSourceController.getRoutes',
  '/datasources/gtfs/schedule/:id':'GtfsController.getSimpleSchedule',
  '/datasources/gtfs/schedule/:id/edit':'GtfsController.uploadGtfsEdits',
  '/datasources/gtfs/frequencies':'GtfsController.getFrequencies',
  '/datasources/gtfs/schedule/:id/:rid':'GtfsController.routes',
  '/datasources/gtfs/frequencyUpload/:id' : 'GtfsController.uploadFreqEdits',
  '/datasources/gtfs/backup' : 'GtfsController.backupSource',
  '/datasources/gtfs/backupStatus': 'GtfsController.statusCheck',
  '/datasources/gtfs/generate' : 'GtfsController.downloadGtfs',
  //---------Triptable-----------------------------
  '/triptable':'TriptableController.calculateTripTable',
  '/triptable/run':'TriptableController.runModel',
  '/triptable/list':'TriptableController.finishedModels',
  '/triptable/:id/modelrun':'TriptableController.getModelRun'

};
