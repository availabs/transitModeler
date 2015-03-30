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
  
  //routes Geo :id is datasource id for gtfs 
  '/datasources/gtfs/geo/:id': 'DataSourceController.getRouteGeo',
  '/datasources/gtfs/routes/:tablename':'DataSourceController.getRoutes',

  //---------Triptable--------------------------------
  '/triptable':'TriptableController.calculateTripTable',
  '/triptable/run':'TriptableController.runModel',
  '/triptable/list':'TriptableController.finishedModels',
  '/triptable/:id/modelrun':'TriptableController.getModelRun'
  
};