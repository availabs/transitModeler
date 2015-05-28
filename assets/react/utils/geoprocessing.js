'use strict';

var turf = require('turf');

module.exports = {

	point2polyIntersect:function(points,polys){
		var buffered = turf.buffer(points, 0.5, 'miles'),
			polyFeature = polys.features,
			pointFeature = points.features;

		var conflictlist = [],
			geoidList = [];
		console.log('point2polyIntersect features',polyFeature.length,pointFeature.length)
		polyFeature.forEach(function(parcel,i){
		    
		    pointFeature.forEach(function(point,j){

		        //console.log("Processing",i,j,parcel,point);
		        if(conflictlist.indexOf(i) === -1){
		            var inside = turf.inside(point,parcel);
		            
		            if (inside) {
		                conflictlist.push(i);
		                if(parcel.properties && parcel.properties.geoid){
		                	geoidList.push(parcel.properties.geoid)
		                }
		            }
		        }
		    })
		})
		console.log('point2polyIntersect lists',conflictlist,geoidList);
		return {index:conflictlist,keys:geoidList};
	}	
}