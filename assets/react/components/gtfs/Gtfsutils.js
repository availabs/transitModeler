var getWaypoints = function(Stops,Trip){	//get simple psuedo matrix of trip traversals
	var coorVector = [];
	Trip.getStops().forEach(function(id){		//for each stop that it visits
		var stop = getStop(id);
		coorVector.push(stop.getPoint());	//push that stop's coordinates into the vector
	});
	return coorVector;
};

var Stops = function(){
	this.list = [];
	this.ids  =	[];
};
	Stops.prototype.addStop = function(stop){
		if(!stop.getId)
			stop = new Stop(stop);
		this.ids.push(stop.getId());
		this.list.push(stop);
	};
	Stops.prototype.overwrite = function(stop,old){
		var ix = this.ids.indexOf(stop.getId());
		if(ix >=0){
			this.list[ix] = stop;
		}else{//rewriting with new id
			ix = this.ids.indexOf(old);
			this.list[ix] = stop;
			this.ids[ix] = stop.getId();
		}
	};
	Stops.prototype.addStops = function(stps){
		var stopc = this;
		stps.forEach(function(d){
			stopc.addStop(d);
		});
	};
	Stops.prototype.delStop = function(id){
		var ix = this.ids.indexOf(id);
		this.ids.splice(id,1);
		this.list.splice(id,1);
	};
	Stops.prototype.getStop = function(id){
		var ix = this.ids.indexOf(id);
		return this.list[ix];
	};
	Stops.prototype.getStops = function(){
		return this.list;
	};
	Stops.prototype.getNoAssociates = function(){
		this.list.filter(function(d){
			return d.hasNoGroups();
		});
	};
	Stops.prototype.getStopsByRoute = function(rid){
		return this.list.filter(function(d){
			return d.inRoute(rid);
		});
	};
	Stops.prototype.getStopsByTrip = function(tid){
		return this.list.filter(function(d){
			return d.inGroup(tid);
		});
	};
	Stops.prototype.getSubColl = function(id,method){
		var subColl = new Stops(),
		sublist     = method(id);
		sublist.forEach(function(d){
			subColl.addStop(d);
		});
		return subColl;
	};
	Stops.prototype.getSubCollByRoute = function(rid){
		return this.getSubColl(rid,this.getStopsByRoute);
	};
	Stops.prototype.getSubCollByIds = function(ids){
		var subColl = new Stops(),Coll = this;
		ids.forEach(function(id){
			subColl.addStop(Coll.getStop(id));
		});
		return subColl;
	};
	Stops.prototype.getSubCollByTrip =function(tid){
		return this.getSubColl(tid,this.getStopsByTrip);
	};
	Stops.prototype.hasStop = function(sid){
		return this.ids.indexOf(sid) >=0;
	};
	Stops.prototype.containsStop = function(stop){
		return this.ids.index(stop.getId());
	};
	Stops.prototype.deleteStop = function(id){
		var ix = this.ids.indexOf(id);
		if(ix >=0){
			this.ids.splice(ix,1);
			this.list.splice(ix,1);
		}
	};
	Stops.prototype.getEdited = function(){
		return this.list.filter(function(d){
			return d.isEdited();
		});
	};
	Stops.prototype.getFeatureCollection = function(){
		var fc = {type:'FeatureCollection',features:[]};
		fc.features = this.list.map(function(stop){
			return stop.getFeature();
		});
		return fc;
	};
	Stops.prototype.getLength = function(){
		return this.list.length;
	};
	Stops.prototype.takeNew = function(stops2){
		var stops = this;
		stops2.ids.forEach(function(d,i){
			if(stops.ids.indexOf(d) < 0){
				stops.ids.push(d);
				stops.list.push(stops2.list[i]);
			}
		});
	};
	Stops.prototype.clean = function(){
		this.list.forEach(function(d){
			d.setNew(false);
			d.setNormal();
		});
	};

var StopsPair = function(){
	this.main = new Stops();
	this.temp = new Stops();
	this.map = {};
};
	StopsPair.prototype.addMain = function(d){
		this.main.addStop(d);
	};
	StopsPair.prototype.addStops = function(stops){
		this.main.addStops(stops);
	};
	StopsPair.prototype.addTemp = function(d,ref){
		if(this.temp.getStop(ref)) //if the referenced stop is in the buffer overwrite it
			this.temp.overwrite(d,ref);
		else{
			if(d.getId() !== ref)
				d.setOldId(ref);//set the old id of the stop
			this.temp.addStop(d);//add the stop to the collection
			this.map[ref] = d.getId();//set the mapping
		}
	};
	StopsPair.prototype.addNew = function(d){
		this.temp.addStop(d);
	};
	StopsPair.prototype.getStop = function(id){
		if(this.main.hasStop(id)){
			return this.main.getStop(id);
		}
		else if(this.temp.hasStop(id)){
			return this.temp.getStop(id);
		}
	};
	StopsPair.prototype.cloneStop = function(id){
		if(this.main.hasStop(id)){
			return this.main.getStop(id).cloneCopy();
		}
	};
	StopsPair.prototype.merge = function(){
		var scope = this;
		Object.keys(scope.map).forEach(function(id){ //take all edits
			var replacement = scope.temp.getStop(scope.map[id]); //get the changed stop
			scope.main.deleteStop(id); //delete original stop from main list
			scope.main.addStop(replacement); //add the edited stop to the main list
			scope.temp.deleteStop(scope.map[id]);//remove the changed element from temp list
		});
		this.main.takeNew(this.temp); //then add all the new stops to the list;
	};
	StopsPair.prototype.clean = function(){
		this.main.clean();
	};
	StopsPair.prototype.scrap = function(){
		this.temp = new Stops();
	};
	StopsPair.prototype.getLength = function(){
		return this.main.getLength();
	};
	StopsPair.prototype.getEdited = function(){
		var slist = this.temp.getEdited();
		return slist;
	};
var Stop = function(stop){
	if(stop)
		this.stop = stop;
	else
		this.stop = {type:'Feature',properties:{},geometry:{type:'Point',coordinates:[]}};
};
	Stop.prototype.toRaw = function(){
		return {stop_id:this.getId(),
            stop_code:this.getStopCode(),
            stop_name:this.getName(),
            stop_desc:this.getStopDesc(),
            stop_lat:this.getLat(),
            stop_lon:this.getLon(),
            zone_id:this.getZoneId(),
            stop_url:this.getStopUrl(),
            location_type:this.getLocationType(),
            parent_station:this.getParentStation(),
            stop_timezone:this.getStopTimeZone(),
            wheelchair_boarding:this.getWheelchairBoarding(),
            platform_code:this.getPlatformCode(),
            geom:this.stop.geometry,
					};
	};
	Stop.prototype.getOldId = function(){
		return this.stop.properties.oldId;
	};
	Stop.prototype.setOldId = function(id){
		this.stop.properties.oldId = id;
	};
	Stop.prototype.cloneCopy = function(){
		return new Stop(JSON.parse(JSON.stringify(this.stop)));
	};
	Stop.prototype.getProperty = function(pname){
		return this.stop.properties[pname];
	};
	Stop.prototype.getPoint = function(){
		return this.stop.geometry.coordinates;
	};
	Stop.prototype.getLon = function(){
		return this.stop.geometry.coordinates[0];
	};
	Stop.prototype.getLat = function(){
		return this.stop.geometry.coordinates[1];
	};
	Stop.prototype.getId = function(){
		return this.stop.properties.stop_id;
	};
	Stop.prototype.getName = function(){
		return this.stop.properties.stop_name;
	};
	Stop.prototype.getGeoFeat = function(){
		return this.stop.geometry;
	};
	Stop.prototype.getRoutes = function(){
		return this.stop.properties.routes;
	};
	Stop.prototype.getTrips = function(){
		return this.stop.properties.groups;
	};
	Stop.prototype.getFeature = function(){
		return this.stop;
	};
	Stop.prototype.setPoint = function(lonlat){
		this.stop.geometry.coordinates = lonlat;
	};
	Stop.prototype.setLon = function(lon){
		this.stop.geometry.coordinates[0] = lon;
	};
	Stop.prototype.setLat = function(lat){
		this.stop.geometry.coordinates[1] = lat;
	};
	Stop.prototype.setId = function(id){
		this.stop.properties.stop_id = id;
	};
	Stop.prototype.setName = function(name){
		this.stop.properties.stop_name = name;
	};
	Stop.prototype.setRoutes = function(routes){
		this.stop.properties.routes = routes;
	};
	Stop.prototype.setTrips = function(groups){
		this.stop.properties.groups = groups;
	};
	Stop.prototype.getStopCode = function(){
		return this.stop.properties.stop_code;
	};
	Stop.prototype.setStopCode = function(sc){
		this.stop.properties.stop_code = sc;
	};
	Stop.prototype.getStopDesc = function(){
		return this.stop.properties.stop_desc;
	};
	Stop.prototype.setStopDesc = function(sd){
		this.stop.properties.stop_desc = sd;
	};
	Stop.prototype.getZoneId = function(){
		return this.stop.properties.zone_id;
	};
	Stop.prototype.setZoneId = function(zi){
		this.stop.properties.zone_id = zi;
	};
	Stop.prototype.getStopUrl = function(){
		return this.stop.properties.stop_url;
	};
	Stop.prototype.setStopUrl = function(su){
		this.stop.properties.stop_url = su;
	};
	Stop.prototype.getLocationType = function(){
		return this.stop.properties.location_type;
	};
	Stop.prototype.setLocationType = function(lt){
		this.stop.properties.location_type = lt;
	};
	Stop.prototype.getParentStation = function(){
		return this.stop.properties.parent_station;
	};
	Stop.prototype.getStopTimeZone = function(){
		return this.stop.properties.stop_timezone;
	};
	Stop.prototype.setStopTimeZone = function(stz){
		this.stop.properties.stop_timezone = stz;
	};
	Stop.prototype.getPlatformCode = function(){
		return this.stop.properties.platform_code;
	};
	Stop.prototype.setPlatformCode = function(pc){
		this.stop.properties.platform_code = pc;
	};
	Stop.prototype.getWheelchairBoarding = function(){
		return this.stop.properties.wheelchair_boarding;
	};
	Stop.prototype.setWheelchairBoarding = function(wcb){
		this.stop.properties.wheelchair_boarding = wcb;
	};

	Stop.prototype.addRoute = function(route){
		if(!this.stop.properties.routes)
			this.stop.properties.routes = [];
		this.stop.properties.routes.push(route);
	};
	Stop.prototype.addTrip = function(group){
		if(!this.stop.properties.groups)
			this.stop.properties.groups = [];
		this.stop.properties.groups.push(group);
	};
	Stop.prototype.delRoute = function(route){
		var routes = this.stop.properties.routes,ix = routes.indexOf(route);
		if(ix>0)
			routes.splice(ix,1);
	};
	Stop.prototype.delTrip = function(group){
		var groups = this.stop.properties.groups, ix = groups.indexOf(group);
		if(ix>0)
			groups.splice(ix,1);
	};
	Stop.prototype.hasNoGroups = function(){
		var list = this.stop.properties.groups;
		return !list || list.length === 0;
	};
	Stop.prototype.inGroup = function(gid){
		return this.stop.properties.groups.indexOf(gid) >= 0;
	};
	Stop.prototype.inRoute = function(rid){
		return this.stop.properties.routes.indexOf(rid) >= 0;
	};
	Stop.prototype.setEdited = function(){
		this.stop.edited = true;
	};
	Stop.prototype.setNormal = function(){
		this.stop.edited = false;
	};
	Stop.prototype.isEdited = function(){
		return this.stop.edited;
	};
	Stop.prototype.setRemoval = function(){
		this.stop.properties.removed = true;
	};
	Stop.prototype.wasRemoved = function(){
		return this.stop.properties.removed;
	};
	Stop.prototype.isNew = function(){
		return this.stop.isNew;
	};
	Stop.prototype.isDeleted = function(){
		return this.stop.deleted;
	};
	Stop.prototype.setNew = function(tf){
		this.stop.isNew = tf;
	};
	Stop.prototype.setDeleted = function(tf){
		this.stop.deleted = tf;
	};
	Stop.prototype.setSequence = function(id){
		this.stop.sequence = id;
	};
	Stop.prototype.getSequence = function(){
		return this.stop.sequence;
	};

var CTrip = function(T){
	this.route_id = '';
	this.service_id = '';
	this.trip_id = '';
	this.trip_headsign = '';
	this.trip_short_name = '';
	this.direction_id = -1;
	this.block_id = '';
	this.shape_id = '';
	this.trip_type = '';
	this.bikes_allowed = -1;
	this.wheelchair_accessible = -1;

	if(T){
		var scope = this;
		Object.keys(T).forEach(function(d){
			scope[d] = T[d];
		});
	}
};

	CTrip.prototype.getAtt = function(attribute){
		return this[attribute.toLowerCase()];
	};
	CTrip.prototype.setAtt = function(attribute,val){
		this[attribute.toLowerCase()] = val;
	};

var Trip = function(T){
	if(T){
		this.id=T.id;
		this.stops = T.stops;
		this.route_id = T.route_id;
		this.intervals = T.intervals;
		this.start_times = T.start_times;
		this.stop_times = T.start_times;
		this.trip_ids = T.trip_ids;
		this.service_id = T.service_id;
		this.headsign = T.headsign;
		this.direction_id = T.direction_id;
		this.isNew = T.isNew;
	}else{
		this.id = '';
		this.stops = [];
		this.route_id = '';
		this.intervals = [];
		this.start_times = [];
		this.stop_times = [];
		this.trip_ids = [];
		this.service_id = '';
		this.headsign = '';
		this.direction_id = -1;
		this.isNew = false;
	}
};
	Trip.prototype.getId = function(){
		return this.id;
	};
	Trip.prototype.getServiceId = function(){
		return this.service_id;
	};
	Trip.prototype.getStops = function(){
		return this.stops;
	};
	Trip.prototype.getRouteId = function(){
		return this.route_id;
	};
	Trip.prototype.getIntervals = function(){
		return this.intervals;
	};
	Trip.prototype.getInterval = function(i){
		return this.intervals[i];
	};
	Trip.prototype.getStartTimes = function(){
		return this.start_times;
	};
	Trip.prototype.getStartTime = function(i){
		return this.start_times[i];
	};
	Trip.prototype.getLastStartTime = function(){
		return this.start_times[this.start_times.length-1];
	};
	Trip.prototype.getStopTimes = function(){
		return this.stop_times;
	};
	Trip.prototype.getStopTime = function(i){
		return this.stop_times[i];
	};
	Trip.prototype.getLastStopTime = function(){
		return this.stop_times[this.stop_times.length-1];
	};
	Trip.prototype.getIds =function(){
		return this.trip_ids;
	};
	Trip.prototype.getHeadSign = function(){
		return this.headsign;
	};
	Trip.prototype.setHeadSign = function(hs){
		this.headsign = hs;
	};
        Trip.prototype.getDirectionId = function(){
	        return this.direction_id;
	};
        Trip.prototype.setDirectionId = function(id){
	        this.direction_id = id;
	};
	Trip.prototype.setIds = function(ids){
		this.trip_ids = ids;
	};
	Trip.prototype.setId = function(id){
		this.id = id;
	};
	Trip.prototype.setStops = function(stops){
		this.stops = stops;
	};
	Trip.prototype.setRouteId = function(rid){
		this.route_id = rid;
	};
	Trip.prototype.setServiceId = function(id){
		this.service_id = id;
	};
	Trip.prototype.addStartTime = function(start){
		this.start_times.push(start);
	};
	Trip.prototype.addStopTime = function(stop){
		this.stop_times.push(stop);
	};
	Trip.prototype.addInterval = function(start,stop){
		this.addStartTime(start);
		this.addStopTime(stop);
		this.intervals.push([start,stop]);
	};
	Trip.prototype.setIntervals = function(ints){
		this.intervals = ints;
	};
	Trip.prototype.setStopTimes = function(stoptimes){
		this.stop_times = stoptimes;
	};
	Trip.prototype.setStartTimes = function(starttimes){
		this.start_times = starttimes;
	};
	Trip.prototype.hasStop = function(sid){
		return this.stops.indexOf(sid) >= 0;
	};
	Trip.prototype.addTripId = function(tid){
		this.trip_ids.push(tid);
	};
        Trip.prototype.removeTripId = function(tid){
	    var ix = this.trip_ids.indexOf(tid);
	    if(ix >= 0)
		this.trip_ids.splice(ix,1);
	}
	Trip.prototype.addStop = function(sid,ix){
		this.stops.splice(ix,0,sid);
	};
	Trip.prototype.setNew = function(){
		this.isNew = true;
	};
	Trip.prototype.isNewTrip = function(){
		return this.isNew;
	};
	Trip.prototype.removeStop = function(sid){
		var ix = this.stops.indexOf(sid);
		this.stops.splice(ix,1); //remove stop from stop list;
	};
var Route = function(id){
	this.id = id;
	this.trips = [];
	this.ids = [];
};
	Route.prototype.getTrip = function(id){
		var ix = this.ids.indexOf(id);
		if(ix >= 0)
			return this.trips[ix];
	};
	Route.prototype.addTrip = function(trip){
		this.trips.push(trip);
		this.ids.push(trip.id);
	};
	Route.prototype.getId = function(){
		return this.id;
	};
	Route.prototype.addTrips = function(){
		return this.trips;
	};

var RouteObj = function(route){
	if(route){
		this.route = route;
	}else{
		this.route = {type:'Feature',properties:{},geometry:{type:'',coordinates:[]}};
	}
};
	RouteObj.prototype.getGeom = function(){
		return this.route.geometry;
	};
	RouteObj.prototype.setGeom = function(geo){
		this.route.geometry = geo;
	};
	RouteObj.prototype.getCoors = function(){
		return this.route.geometry.coordinates;
	};
	RouteObj.prototype.setCoors = function(crs){
		this.route.geometry.coordinates = crs;
	};
	RouteObj.prototype.getGeoType = function(){
		return this.route.geometry.type;
	};
	RouteObj.prototype.setGeoType = function(t){
		this.route.geometry.type = t;
	};
	RouteObj.prototype.getOldId = function(){
		return this.route.properties.oldId;
	};
	RouteObj.prototype.setOldId = function(oid){
		this.route.properties.oldId = oid;
	};
	RouteObj.prototype.getId = function(){
		return this.route.properties.id;
	};
	RouteObj.prototype.setId = function(id){
		this.route.properties.id = id;
	};
	RouteObj.prototype.getAgencyId = function(){
		return this.route.properties.agency_id;
	};
	RouteObj.prototype.setAgencyId = function(aid){
		this.route.properties.agency_id = aid;
	};
	RouteObj.prototype.getRouteShortName = function(){
		return this.route.properties.route_short_name;
	};
	RouteObj.prototype.setRouteShortName = function(rsn){
		this.route.properties.route_short_name = rsn;
	};
	RouteObj.prototype.getRouteLongName = function(){
		return this.route.properties.route_long_name;
	};
	RouteObj.prototype.setRouteLongName = function(rln){
		this.route.properties.route_long_name = rln;
	};
	RouteObj.prototype.getRouteDesc = function(){
		return this.route.properties.route_desc;
	};
	RouteObj.prototype.setRouteDesc = function(rd){
		this.route.properties.route_desc = rd;
	};
	RouteObj.prototype.getRouteType = function(){
		return this.route.properties.route_type;
	};
	RouteObj.prototype.setRouteType = function(rt){
		this.route.properties.route_type = rt;
	};
	RouteObj.prototype.getRouteUrl = function(){
		return this.route.properties.route_url;
	};
	RouteObj.prototype.setRouteUrl = function(ru){
		this.route.properties.route_url = ru;
	};
	RouteObj.prototype.getRouteColor = function(){
		return this.route.properties.route_color;
	};
	RouteObj.prototype.setRouteColor = function(rc){
		this.route.properties.route_color = rc;
	};
	RouteObj.prototype.getRouteTextColor = function(){
		return this.route.properties.route_text_color;
	};
	RouteObj.prototype.setRouteTextColor = function(rtc){
		this.route.properties.route_text_color = rtc;
	};
	RouteObj.prototype.getFeature = function(){
		return this.route;
	};
	RouteObj.prototype.setEdited = function(){
		this.route.properties.isEdited = true;
	};
	RouteObj.prototype.isEdited = function(){
		return this.route.properties.isEdited;
	};
	RouteObj.prototype.clean = function(){
		delete this.route.properties.isEdited;
	};
	RouteObj.prototype.getGeometry = function(){
		if(this.route.geometry.type)
			return this.route.geometry;
	};
	RouteObj.prototype.toRaw= function(){
		return {
			route_id:this.getId(),
      agency_id:this.getAgencyId(),
      route_short_name:this.getRouteShortName(),
      route_long_name:this.getRouteLongName(),
      route_desc:this.getRouteDesc(),
      route_type:this.getRouteType(),
      route_url:this.getRouteUrl(),
      route_color:this.getRouteColor(),
      route_text_color:this.getRouteTextColor(),
      geom:this.getGeometry(),
					};
	};
var Routes = function(){
	this.routes = [];
	this.ids 	= [];
}
	Routes.prototype.addRoute = function(route){
		this.routes.push(route);
		this.ids.push(route.getId());
	}
	Routes.prototype.getRoute = function(id){
		var ix = this.ids.indexOf(id);
		if(ix >= 0)
			return this.routes[ix];
	}
	Routes.prototype.getIds = function(){
		return this.ids;
	}
	Routes.prototype.cloneIds = function(){
		return this.ids.map(function(d){return d;});
	}
	Routes.prototype.containsRoute = function(id){
		return this.ids.indexOf(id) >= 0;
	}

module.exports = {
	getWaypoints:getWaypoints,
	Stops:Stops,
	Stop:Stop,
	Trip:Trip,
	Route:Route,
	Routes:Routes,
	RouteObj:RouteObj,
	StopsColl:StopsPair,
};
