var savetracker = function(){
	this.tracklist = [];
	this.addEvent = function(etype,dataobj){
		var inxs = [];
		this.tracklist.forEach(function(d,i){if(d.obj.id===dataobj.id) inxs.push(i);});
		if(!inxs.length){
			this.tracklist.push({obj:dataobj,type:etype});
		}else if(inxs.length === 1){
			var obj = this.tracklist[inxs[0]];
			if(obj.type !== etype){
				this.tracklist.splice(inxs[0],1); //remove the element that has conflicting event types
			}//if they are the same type ignore the update
		}
	};
	this.editEvent = function(id,nid,data){
		var events = this.tracklist.filter(function(d){
			return d.obj.id === id;
		});
		var evenT = events[0];
		evenT.obj.id = nid;
		evenT.obj.data=data;
	};
	this.getEventList = function(){
		return this.tracklist;
	};
	this.getLastEvent = function(){
		return this.tracklist[this.tracklist.length-1];
	};
};

module.exports= savetracker;


// var st = new savetracker();
// st.addEvent('d',{id:'0000',data:{}});
// st.addEvent('i',{id:'0001',data:{}});
// st.addEvent('d',{id:'0000',data:{}});
// st.addEvent('i',{id:'0001',data:{}});
// st.addEvent('d',{id:'0000',data:{}});
// st.addEvent('i',{id:'0000',data:{}});
// console.log(st.getEventList());
