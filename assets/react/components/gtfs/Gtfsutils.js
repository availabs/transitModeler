var getWaypoints = function(Stops,Trip){	//get simple psuedo matrix of trip traversals
	var coorVector = [];
	Trip.getStops().forEach(function(id){		//for each stop that it visits
		var stop = getStop(id);
		coorVector.push(stop.getPoint());	//push that stop's coordinates into the vector
	});
	return coorVector;
}

var Stops = function(){
	this.list = [];
	this.ids  =	[];
};
Stops.prototype.addStop = function(stop){
	if(!stop.getId)
		stop = new Stop(stop);
	this.ids.push(stop.getId());
	this.list.push(stop);
}
Stops.prototype.addStops = function(stps){
	var stopc = this;
	stps.forEach(function(d){
		stopc.addStop(d);
	})
}
Stops.prototype.delStop = function(id){
	var ix = this.ids.indexOf(id);
	this.ids.splice(id,1);
	this.list.splice(id,1);
}
Stops.prototype.getStop = function(id){
	var ix = this.ids.indexOf(id);
	return this.list[ix]
}
Stops.prototype.getStops = function(){
	return this.list;
}
Stops.prototype.getNoAssociates = function(){
	this.list.filter(function(d){
		return d.hasNoGroups();
	})
}
Stops.prototype.getStopsByRoute = function(rid){
	return this.list.filter(function(d){
		return d.inRoute(rid);
	});
}
Stops.prototype.getStopsByTrip = function(tid){
	return this.list.filter(function(d){
		return d.inGroup(tid);
	});
}
Stops.prototype.getSubColl = function(id,method){
	var subColl = new Stops(),
	sublist     = method(id);
	sublist.forEach(function(d){
		subColl.addStop(d);
	})
	return subColl;
}
Stops.prototype.getSubCollByRoute = function(rid){
	return this.getSubColl(rid,this.getStopsByRoute);
}
Stops.prototype.getSubCollByIds = function(ids){
	var subColl = new Stops(),Coll = this;
	ids.forEach(function(id){
		subColl.addStop(Coll.getStop(id));
	})
	return subColl;
}
Stops.prototype.getSubCollByTrip =function(tid){
	return this.getSubColl(tid,this.getStopsByTrip);
}
Stops.prototype.hasStop = function(sid){
	return this.ids.indexOf(sid) >=0;
}
Stops.prototype.containsStop = function(stop){
	return this.ids.index(stop.getId());
}
Stops.prototype.deleteStop = function(id){
	var ix = this.ids.indexOf(id);
	if(ix >=0){
		this.ids.splice(ix,1);
		this.list.splice(ix,1);
	}
}
Stops.prototype.getEdited = function(){
	return this.list.filter(function(d){
		return d.isEdited();
	})
}
Stops.prototype.getFeatureCollection = function(){
	var fc = {type:'FeatureCollection',features:[]}
	fc.features = this.list.map(function(stop){
		return stop.getFeature();
	})
	return fc;
}
Stops.prototype.getLength = function(){
	return this.list.length;
}

var Stop = function(stop){
	if(stop)
		this.stop = stop;
	else
		this.stop = {type:'Feature',properties:{},geometry:{type:'Point',coordinates:[]}}
};
Stop.prototype.getProperty = function(pname){
	return this.stop.properties[pname];
}
Stop.prototype.getPoint = function(){
	return this.stop.geometry.coordinates;
}
Stop.prototype.getLon = function(){
	return this.stop.geometry.coordinates[0];
}
Stop.prototype.getLat = function(){
	return this.stop.geometry.coordinates[1];
}
Stop.prototype.getId = function(){
	return this.stop.properties.stop_id;
}
Stop.prototype.getName = function(){
	return this.stop.properties.stop_name;
}
Stop.prototype.getGeoFeat = function(){
	return this.stop.geometry;
}
Stop.prototype.getRoutes = function(){
	return this.stop.properties.routes;
}
Stop.prototype.getTrips = function(){
	return this.stop.properties.groups;
}
Stop.prototype.getFeature = function(){
	return this.stop;
}
Stop.prototype.setPoint = function(lonlat){
	this.stop.geometry.coordinates = lonlat;
}
Stop.prototype.setLon = function(lon){
	this.stop.geometry.coordinates[0] = lon;
}
Stop.prototype.setLat = function(lat){
	this.stop.geometry.coordinates[1] = lat;
}
Stop.prototype.setId = function(id){
	this.stop.properties.stop_id = id;
}
Stop.prototype.setName = function(name){
	this.stop.properties.stop_name = id;
}
Stop.prototype.setRoutes = function(routes){
	this.stop.properties.routes = routes;
}
Stop.prototype.setTrips = function(groups){
	this.stop.properties.groups = groups;
}
Stop.prototype.addRoute = function(route){
	if(!this.stop.properties.routes)
		this.stop.properties.routes = [];
	this.stop.properties.routes.push(route);
}
Stop.prototype.addTrip = function(group){
	if(!this.stop.properties.groups)
		this.stop.properties.groups = [];
	this.stop.properties.groups.push(group);
}
Stop.prototype.delRoute = function(route){
	var routes = this.stop.properties.routes,ix = routes.indexOf(route);
	if(ix>0)
		routes.splice(ix,1);
}
Stop.prototype.delTrip = function(group){
	var groups = this.stop.properties.groups, ix = groups.indexOf(group);
	if(ix>0)
		groups.splice(ix,1);
}
Stop.prototype.hasNoGroups = function(){
	var list = this.stop.properties.groups;
	return !list || list.length === 0;
}
Stop.prototype.inGroup = function(gid){
	return this.stop.properties.groups.indexOf(gid) >= 0;
}
Stop.prototype.inRoute = function(rid){
	return this.stop.properties.routes.indexOf(rid) >= 0;
}
Stop.prototype.setEdited = function(){
	this.stop.edited = true;
}
Stop.prototype.setNormal = function(){
	this.stop.edited = false;
}
Stop.prototype.isEdited = function(){
	return this.stop.edited === true;
}
Stop.prototype.setRemoval = function(){
	return this.stop.properties.removed = true;
}
Stop.prototype.wasRemoved = function(){
	return this.stop.properties.removed;
}
Stop.prototype.isNew = function(){
	return this.stop.isNew;
}
Stop.prototype.isDeleted = function(){
	return this.stop.deleted;
}
Stop.prototype.setNew = function(tf){
	this.stop.isNew = tf;
}
Stop.prototype.setDeleted = function(tf){
	this.stop.deleted = tf;
}
Stop.prototype.setSequence = function(id){
	this.stop.sequence = id;
}
Stop.prototype.getSequence = function(){
	return this.stop.sequence;
}

var Trip = function(T){
	if(T){
		this.id=T.id
		this.stops = T.stops
		this.route_id = T.route_id
		this.intervals = T.intervals
		this.start_times = T.start_times
		this.stop_times = T.start_times
		this.trip_ids = T.trip_ids
		this.service_id = T.service_id
		this.headsign = T.headsign
		this.isNew = T.isNew
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
		this.isNew = false;
	}
};
Trip.prototype.getId = function(){
	return this.id;
}
Trip.prototype.getServiceId = function(){
	return this.service_id;
}
Trip.prototype.getStops = function(){
	return this.stops;
}
Trip.prototype.getRouteId = function(){
	return this.route_id;
}
Trip.prototype.getIntervals = function(){
	return this.intervals;
}
Trip.prototype.getInterval = function(i){
	return this.intervals[i];
}
Trip.prototype.getStartTime = function(i){
	return this.start_times[i];
}
Trip.prototype.getStopTime = function(i){
	return this.stop_times[i];
}
Trip.prototype.getIds =function(){
	return this.trip_ids;
}
Trip.prototype.getHeadSign = function(){
	return this.headsign;
}
Trip.prototype.setHeadSign = function(hs){
	this.headsign = hs;
}
Trip.prototype.setIds = function(ids){
	this.trip_ids = ids;
}
Trip.prototype.setId = function(id){
	this.id = id;
}
Trip.prototype.setStops = function(stops){
	this.stops = stops;
}
Trip.prototype.setRouteId = function(rid){
	this.route_id = rid;
}
Trip.prototype.setServiceId = function(id){
	this.service_id = id;
}
Trip.prototype.addStartTime = function(start){
	this.start_times.push(start);
}
Trip.prototype.addStopTime = function(stop){
	this.stop_times.push(stop);
}
Trip.prototype.addInterval = function(start,stop){
	this.addStartTime(start);
	this.addStopTime(stop);
	this.intervals.push([start,stop]);
}
Trip.prototype.setIntervals = function(ints){
	this.intervals = ints;
}
Trip.prototype.setStopTimes = function(stoptimes){
	this.stop_times = stoptimes;
}
Trip.prototype.setStartTimes = function(starttimes){
	this.start_times = starttimes;
}
Trip.prototype.hasStop = function(sid){
	return this.stops.indexOf(sid) >= 0;
}
Trip.prototype.addTripId = function(tid){
	this.trip_ids.push(tid);
}
Trip.prototype.addStop = function(sid,ix){
	this.stops.splice(ix,0,sid);
}
Trip.prototype.setNew = function(){
	this.isNew = true;
}
Trip.prototype.isNewTrip = function(){
	return this.isNew;
}
Trip.prototype.removeStop = function(sid){
	var ix = this.stops.indexOf(sid);
	this.stops.splice(ix,1); //remove stop from stop list;
}
var Route = function(id){
	this.id = id;
	this.trips = [];
	this.ids = [];
}
Route.prototype.getTrip = function(id){
	var ix = this.ids.indexOf(id);
	if(ix >= 0)
		return this.trips[ix];
}
Route.prototype.addTrip = function(trip){
	this.trips.push(trip);
	this.ids.push(trip.id);
}
Route.prototype.getId = function(){
	return this.id;
}
Route.prototype.addTrips = function(){
	return this.trips;
}
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
}
