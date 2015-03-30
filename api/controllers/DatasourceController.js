'use strict';
/**
 * DatasourcesController
 *
 * @description :: Server-side logic for managing datasources
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var getCensusData = function(marketarea,table,cb){

    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a'
          + ' join tl_2013_34_tract as b on a.geoid = b.geoid'
          + ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

var preserveProperties = function(feature) {
  return feature.properties;
}

var topojson = require('topojson');

module.exports = {
	
	getACS:function(req,res){
		if(!req.param('year')){
			res.send('{status:"error",message:"Must send 4 digit [year] of data."}',500);
		}
	    var censusTable = 'acs5_34_'+req.param('year')+'_tracts';
	   
	    //Allow user to specify census table
	    MarketArea.findOne(req.param('marketareaId')).exec(function(err,ma){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
	        getCensusData(ma,censusTable,function(census){
	          res.json({census:census})
	        })
	    })
	    
 	},
 	
 	getRoutes:function(req,res){
		if(!req.param('tablename')){
			res.send('{status:"error",message:"Must send gtfs tablename."}',500);
		}
		
		var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+req.param('tablename')+'.routes';

	    Datasource.query(sql,{},function(err,data){
	      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}

	      var output = data.rows;
	      return res.json(output);

	    });
		
	},
	
	getRouteGeo:function(req,res){
		var gtfs_id = req.param('id'),
	        route_id = req.param('route');


	    if (!(gtfs_id && route_id)) {
	      res.send({status: 500, error: 'You must supply a gtfs_id and route ID'}, 500);
	      return;
	    }
	   
	    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
	    	if(err){console.log('find datasource error',err)}
	    	var sql = "SELECT route_id, route_color,route_short_name, route_long_name, ST_AsGeoJSON(geom) as the_geom " +
		              "FROM "+mgtfs.tableName+".routes " +
		              "WHERE route_short_name in " + JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");
		             

		    Datasource.query(sql,{},function(err,data){
		        if (err) {
		            res.send('{status:"error",message:"'+err+'"}',500);
		            return console.log(err);
		        }
		        var routesCollection = {
		        	type:"FeatureCollection",
		        	features:[]
		    	};
		        console.time('processRouteGeography')
		        // for each result in the result set, generate a new geoJSON feature object
		        routesCollection.features = data.rows.map(function(route){
		            return {
		            	type:"Feature",
		            	geometry: JSON.parse(route.the_geom),
		            	properties:{
		            		route_id : route.route_id,
		            		short_name : route.route_short_name,
		            		long_name : route.route_long_name
		            	}
		            }    
		        });
		        //console.log('Getting Data?',routesCollection.features.length);
		        var topology = topojson.topology(
		        	{routes: routesCollection},
		        	{
		        		"property-transform":preserveProperties,
		             	"quantization": 1e9
		            });

		        var newJson = {type:'FeatureCollection',features:[]};
		        //Topojson Mesh to Ensure No Duplication of Line Segments
		        topology.objects.routes.geometries.forEach(function(d){
		          var routeSwap = {type: "GeometryCollection", geometries:[d]}
		          var test = topojson.mesh(topology, routeSwap, function(a, b) { return a.properties; });
		          var feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
		          newJson.features.push(feature);
		        });
		        console.timeEnd('processRouteGeography')
		        //console.log(newJson);
		        res.send(newJson);
		    });
		});
   	
  	},
  	
	getCTPP: function(req, res) {
		var id = req.param('id')
		MarketArea.findOne(req.param('marketareaId')).exec(function(err,marketarea){
			var tracts = JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");

			var sql = "SELECT from_tract,to_tract, est, se " +
			            "FROM ctpp_34_2010_tracts " +
			            "WHERE to_tract in " + tracts + " or from_tract in "+tracts;

			MarketArea.query(sql, {}, function(error, data) {
			    if (error) {
			          console.log("error executing "+sql, error);
			          res.send({status: 500, message: 'internal error'}, 500);
			          return;
			    }
			   
			    res.send(data.rows);
			})
		});
	}
};

