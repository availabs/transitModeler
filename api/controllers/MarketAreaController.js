/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing landings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var topojson = require('topojson');

module.exports = {
	
	getRouteGeo:function(req,res){
    var gtfs_id = req.param('id'),
        route_id = req.param('route');

    if (!(gtfs_id && route_id)) {
      res.send({status: 500, error: 'You must supply a table ID and route ID'}, 500);
      return;
    }
   

    Datasource.findOne(gtfs_id).exec(function(err,mgtfs){
        var sql = "SELECT route_id, route_short_name, route_long_name, ST_AsGeoJSON(geom) as the_geom " +
                  "FROM "+mgtfs.tableName+".routes ";
                  if(route_id instanceof Array){
                    sql += "WHERE route_short_name in " + JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");
                  }else{
                    sql += "WHERE route_short_name = '" + route_id + "'";
                  }

        Datasource.query(sql,{},function(err,data){
            if (err) {
                res.send('{status:"error",message:"'+err+'"}',500);
                return console.log(err);
            }
            var routesCollection = {};
            routesCollection.type = "FeatureCollection";
            routesCollection.features = [];
            
            // for each result in the result set, generate a new geoJSON feature object
            data.rows.forEach(function(route){
                var routeFeature = {};
                routeFeature.type="Feature";
                      // retrieve geometry data
                routeFeature.geometry = JSON.parse(route.the_geom);
                
                routeFeature.geometry.type = 'LineString';
                routeFeature.geometry.coordinates = routeFeature.geometry.coordinates.reduce(function(a, b) { return a.length > b.lemgth ? a : b; }, []);
                      // retrieve properties
                routeFeature.properties = {};
                routeFeature.properties.route_id = route.route_id;
                routeFeature.properties.short_name = route.route_short_name;
                routeFeature.properties.long_name = route.route_long_name;
                routesCollection.features.push(routeFeature);
            });

            var topology = topojson.topology({routes: routesCollection},{"property-transform":preserveProperties,
                                               "quantization": 1e6});

            var newJson = {type:'FeatureCollection',features:[]};
            topology.objects.routes.geometries.forEach(function(d){
              var routeSwap = {type: "GeometryCollection", geometries:[d]}
              var test = topojson.mesh(topology, routeSwap, function(a, b) { return a.properties; });
              var feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
              newJson.features.push(feature);
            })

            res.send(newJson);
        });
    })
  }
	
};

