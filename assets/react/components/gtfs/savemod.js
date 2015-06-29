var Collection = function(){
	this.coll = [];
}
Collection.prototype.contains = function(el){
	return this.coll.filter(function(d){return d.getId()===el.getId();}).length !==0;
}
Collection.prototype.push = function(el){
	this.coll.push(el);
}
Collection.prototype.concat = function(list){
	var coll = this.coll;
	list.forEach(function(d){
		coll.push(d);
	})
}
Collection.prototype.forEach = function(cb){
	this.coll.forEach(function(e,i,a){
		cb(e,i,a);
	})
}
Collection.prototype.filter  = function(cb){
	return this.coll.filter(function(e,i,a){
		return cb(e,i,a);
	})
};
Collection.prototype.union = function(list){
	var coll = this;
	coll.concat(list.filter(function(d){
			return !coll.contains(d)
	}))
}
Collection.prototype.intersect = function(list){
	var coll = this;
	return list.filter(function(d){
		return coll.contains(d);
	})
}
var SaveObj = function(graph,stops,saveList,deltas,trip,routeId){
	this.graph = graph;
	this.stops = trip.getStops();
	this.sDict = stops;
	this.trip_ids = trip.getIds();
	this.path_id = trip.getId();
	this.saveList = saveList;
	this.deltas = deltas;
	this.stopC = new Collection();
	this.trip= trip;
	this.routeId=routeId;
};

SaveObj.prototype.setAddDels = function(){
	var stopC = this.stopC;
	this.saveList.forEach(function(rec){
		var stop = rec.obj.data;
		stop.setSequence(rec.obj.position);
		if(stop.hasNoGroups())
			stop.setRemoval() //if no group from any route is associated, mark it for database removal.
		stopC.push(stop);
	});
}

SaveObj.prototype.setMovements = function(){
	var stopC = this.stopC, sDict = this.sDict;
	stopC.union(sDict.getEdited());
}

SaveObj.prototype.buildReqObj = function(){
	debugger;
	this.setAddDels();
	this.setMovements();
}

SaveObj.prototype.getReqObj = function(){
	this.buildReqObj();
	var shape = this.graph.toFeatureCollection().features[0].geometry;
	shape.type = 'LineString';
	shape.coordinates = shape.coordinates.reduce(function(p,c,i,a){
		return p.concat(c);
	})
	return {
		shape:shape,
		data:this.stopC.coll,
		trip_ids:this.trip_ids,
		deltas:this.deltas,
		trip:this.trip,
		route:this.routeId,
	}
}
SaveObj.prototype.markSaved = function(){
	this.stopC.forEach(function(d){
		d.setNormal()
		if(d.isDeleted())
			d.setDeleted(false);
		if(d.isNew)
			d.setNew(false);
	})
}
SaveObj.prototype.getDeleted = function(){
	return this.stopC.filter(function(d){
		return d.isDeleted();
	})
}
SaveObj.prototype.getAdded = function(){
	return this.stopC.filter(function(d){
		return d.isNew();
	})
}
module.exports=SaveObj;
