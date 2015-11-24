/*Utility functions for working with census data and triptables*/
module.exports = {
  reduceTripTable : function(tt){
    var ttTractCount= {};
    tt.forEach(function(trip){
        if(!ttTractCount[trip.from_geoid]){ ttTractCount[trip.from_geoid] = {o:0,d:0}; }
        if(!ttTractCount[trip.to_geoid]){ ttTractCount[trip.to_geoid] = {o:0,d:0}; }

        ttTractCount[trip.from_geoid].o++;
        ttTractCount[trip.to_geoid].d++;
    });
    return ttTractCount;
  },

   bus2work : function(censusData,id){
     var Data = censusData.getTractData();
     if(Data[id]){
       return parseInt(Data[id].bus_to_work);
     }
     else {
       return 0;
     }
   },

   reduceTracts : function(featColl){
     var accumulator = {};
     featColl.features.forEach(function(d){
       var id = d.properties.geoid,props = d.properties;
       accumulator[id] = accumulator[id] || {};
       accumulator[id].emp2020_growth = props.emp2020_growth || 0;
       accumulator[id].pop2020_growth = props.pop2020_growth || 0;
     });
     return accumulator;
   },

   addTrips2Tracts : function(trips,tracts){
     Object.keys(trips).forEach(function(d){
       tracts[d] = tracts[d] || {};
       tracts[d].origin = trips[d].o || 0;
       tracts[d].destin = trips[d].d || 0;
     });
   },

   addCensusVars2Tracts : function(census,vars,tracts){
     var Data = census.getTractData();
     Object.keys(Data).forEach(function(id){
       vars.forEach(function(cvar){
         tracts[id] = tracts[id] || {};
         tracts[id][cvar.name] = Data[id][cvar.name];
       });
     });
   },
};
