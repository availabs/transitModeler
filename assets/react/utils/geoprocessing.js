/*globals require,module*/
'use strict';

var turf = require('turf');

module.exports = {

	point2polyIntersect:function(points,polys){
		var //buffered = turf.buffer(points, 0.5, 'miles'), //calculates buffer around points <-- is this necessary??
			polyFeature = polys.features,										//set features of polygons
			pointFeature = points.features;									//set features of points

		var conflictlist = [],														//list of conflicts between polys and buffered
			geoidList = [];																	//list of their geoIds
		//console.log('point2polyIntersect features',polyFeature.length,pointFeature.length)
		polyFeature.forEach(function(parcel,i){					//For each polygonal feature 'call it parcel'

		    pointFeature.forEach(function(point,j){			//Then For Each Point

		        //console.log("Processing",i,j,parcel,point);
		        if(conflictlist.indexOf(i) === -1){			//if the current polygon hasn't clashed with anything
		            var inside = turf.inside(point,parcel);//determine if point lies within polygon

		            if (inside) {												//if it does
		                conflictlist.push(i);						//add note of a conflict
		                if(parcel.properties && parcel.properties.geoid){//if the polygon has a geo id
		                	geoidList.push(parcel.properties.geoid);//add that geo ID to the list
		                }
		            }
		        }
		    });
		});
		//console.log('point2polyIntersect lists',conflictlist,geoidList);
		return {index:conflictlist,keys:geoidList}; //return this index list of polygons and their ids
	},

	center : function(FeatureCollection){
		var point = turf.center(FeatureCollection);
		if(point && point.geometry && point.geometry.coordinates)
			return point.geometry.coordinates;
		else
			return [];
	},
};
