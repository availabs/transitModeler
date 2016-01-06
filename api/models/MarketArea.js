
/**
* MarketArea.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  attributes: {
  	name:'STRING',
  	geounit: 'STRING',
  	zones : 'ARRAY',
	counties : 'ARRAY',
	routes : 'ARRAY',
	center : 'ARRAY',
	origin_gtfs:'INTEGER',
	stateFips:'STRING',
  routecolors:'json',
  description:'STRING',
  users: {
      collection:'user',
      via:'marketareas',
    }
  }

};
