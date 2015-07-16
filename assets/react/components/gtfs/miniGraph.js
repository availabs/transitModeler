
var dist2 = function(x1,y1,x2,y2){
    return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
};

var pastPoint = function(p1,p2,q){
    var v1 = [ p1[0] - p2[0], p1[1] -p2[1] ],   //get the two vectors
    qvec   = [ q[0] - p2[0], q[1] - p2[1] ],
    dot    = v1[0]*qvec[0] + v1[1]*qvec[1];      //take the dot product
                                                //if the cosine of the angle between the two vectors is greater than
                                                //zero then it lies in the space
    if(dot > 0)
        return 0;
    else
        return 1;

};

var miniGraph = function(){
    //node object that will be verticies of a graph
    var node = function(v){
		this.val = v.toString();
		this.adjs = [];
		this.addadj = function(v){
		    this.adjs.push(v.toString());
		};
        this.addnodeadj = function(node){
            this.adjs.push(node.val);
        };
        this.removeadj = function(v){
            var i = this.adjs.indexOf(v.toString());
            this.adjs.splice(i,1); //remove that one id from it's adjacency list
        };
		this.isLinked = function(v){
		    return this.adjs.indexOf(v.toString()) >= 0;
		};
        this.isConnected = function(){
            return this.adjs.length > 0;
        };
		this.getNeighbors = function(){
			return this.adjs;
		};
  };
    //An edge contains refereces to 2 nodes in the graph
    //as well as extra data that needs to be associated with them.
    var edge = function(n1,n2,data){
    	this.id = n1.val + '&' + n2.val; //concatenate identifying strings of the nodes to form an edge id
    	this.data = data;
    };
    //list of nodes for the current graph
    this.nodes = {};
    this.edges = {};
    this.numedges = 0;
    this.isEmpty = function(){
    	return this.numedges <= 0;
    };
    this.getNode = function(v1){
		return this.nodes[v1.toString()];
  };
    this.insertNode = function(v1){
		var strrep = v1.toString();
		this.nodes[strrep] = this.nodes[strrep] || new node(v1);
		return this.nodes[strrep];
  };
    //Function to determine if a given edge
    //currently resides within the graph
    this.testEdge = function(v1,v2){
		var n1 = this.getNode(v1);
		var n2 = this.getNode(v2);
		if( n1 && n2 ){
		    return n1.isLinked(v2);
		}else{
		    return false;
		}
    };

    this.queryPoint = function(coors){
        var x = coors[0];
        var y = coors[1];
        var edges = this.edges;
        var pos,id;
        var mindist = Infinity;
        Object.keys(edges).forEach(function(eid){
            var edge = edges[eid];
            var line = edge.data.geometry.coordinates.forEach(function(coorPair,i){
                var x1 = coorPair[0], y1 = coorPair[1];
                var d  = dist2(x,y,x1,y1);
                if(d < mindist){
                    mindist = d;
                    pos = i;
                    id = eid;
                }
            });
        });
        var vids = id.split('&');
        return {position:pos, v1:vids[0], v2:vids[1]};
    };

    this.splitEdge = function(v1,v2,newv,pos){
        var edge = this.getEdge(v1,v2);
        var seg1,seg2,newid,inx;

        if(pos !== 0){
            var p1 = edge.data.geometry.coordinates[pos-1];
            var p2 = edge.data.geometry.coordinates[pos];
            var q  = newv.geometry.coordinates;
            inx = pos + pastPoint(p1,p2,q);
        }else if(pos === 1){
            inx = pos+1;
        }

        seg1 =  edge.data.geometry.coordinates.splice(0, inx);
        seg2 =  edge.data.geometry.coordinates.map(function(x){return x;});
        this.deleteEdge(v1,v2); //this will destroy the edge variable
        newid = newv.properties.stop_id;
        this.addEdge(v1,newid,seg1);
        this.addEdge(v2,newid,seg2);
    };

    this.bridgeNode = function(victim,survive1,survive2){
        var s1 = this.getNode(survive1),
        v = this.getNode(victim),
        s2 = this.getNode(survive2),
        edge1 = this.getEdge(survive1,victim),
        edge2 = this.getEdge(victim,survive2),
        line1 = edge1.data.geometry.coordinates,
        line2 = edge2.data.geometry.coordinates;

        line1.concat(line2);    //order here could matter!!


        this.deleteEdge(survive1,victim); //delete the previous edges
        this.deleteEdge(victim,survive2); //this could delete victim
        // s1.removeadj(v);    //remove victim node from the other 2
        // s2.removeadj(v);    //

        data = {type:'Feature', properties:{}, geometry:{type:'LineString',coordinates:line1}};
        this.addEdge(survive1,survive2,data);
    };

    //delete a node from the graph assuming the
    //only 2 neighbor structure
    this.deleteNode = function(victim, nodelist){
        var node = this.getNode(victim);
        if(nodelist.length === 2){
            this.bridgeNode(victim,nodelist[0],nodelist[1]);
        }else{
            this.deleteEdge(victim,nodelist[0]);
        }
    };

    //Function to disassociate two nodes in the graph
    //by removing the edge in between them
    //if the
    this.deleteEdge = function(v1,v2){
        var n1 = this.getNode(v1);
        var n2 = this.getNode(v2);
        var currEdge = this.getEdge(v1,v2);
        if(currEdge){
            delete this.edges[currEdge.id];
            n1.removeadj(v2);
            n2.removeadj(v1);
            if(!n1.isConnected())
                delete this.nodes[v1.toString()];
            if(!n2.isConnected())
                delete this.nodes[v1.toString()];
            return true;
        }
        return false;

    };

    //Function to add an edge to the graph
    //Edge is determined by its 2 ending
    this.addEdge = function(v1,v2,data){
		if(!this.testEdge(v1,v2)){
		    var n1 = this.insertNode(v1);
		    var n2 = this.insertNode(v2);
		    n1.addadj(v2);
		    n2.addadj(v1);
		    var e = new edge(n1,n2,data);
		    this.edges[e.id] = e;
		    this.numedges++;
		    return true;
		}else{
		    return false;
		}
    };
   this.updateEdge = function(v1,v2,data){
    	var edge = this.getEdge(v1,v2);
    	if(edge){
    		edge.data = data;
    		return true;
    	}
    	else
    		return false;
   };
    //if the two vertex identifiers form an edge
    //retrieve their edge object.
    this.getEdge = function(v1,v2){
    	var retobj;
    	var id;
    	if(this.testEdge(v1,v2)){
    		id = v1.toString() +'&'+ v2.toString();
    		retobj = this.edges[id];
    		if(retobj)
    			return retobj;
    		id = v2.toString() +'&'+ v1.toString();
    		return this.edges[id];
    	}
    };
    this.toFeatureCollection = function(){
    	var featcoll = {type:'FeatureCollection',features:[]};
    	var graph = this;
        var lineColl = [];
    	Object.keys(this.edges).forEach(function(key){
    		var data = graph.edges[key].data;
    		if(data.type === 'Feature')
    		  lineColl.push(data.geometry.coordinates);
    	});
        featcoll.features.push({type:'Feature',geometry:{coordinates:lineColl, type:'MultiLineString'},properties:{}});
    	return featcoll;
    };

    this.toLineString = function(trajectory){
      var feat = {type:'Feature', properties:{}, geometry:{type:'LineString',coordinates:[]}};
      var graph = this;
      trajectory.reduce(function(l1,l2){ //for each pair of locations in the trajectory list
        var edge = graph.getEdge(l1,l2);   //get the geometry associated with that edge
        feat.geometry.coordinates = feat.geometry.coordinates.concat(edge.data.geometry.coordinates); //concatenate that line to our total line
        return l2;                        //set location 2 of this iteration to location 1 of the next;
      });
      return feat;
    };

    //Perform breadth first search to find paths within the graph
    //Inputs starting point and ending point, returns all
    //intermediary points inbetween
    this.bfs = function(v1,v2){
		v1 = v1.toString();
		v2 = v2.toString();
		var queue = [];
		var set = [];
		var parents = {};
		queue.push(v1);//push the starting point on
		set.push(v1);  //both the queue and seen list
		while(queue.length !== 0){
		    var t = queue.splice(0,1)[0]; //get the oldes item in the queue
		    if(t === v2){                //if it is the endpoint
			var pathStack = [v2];    //initially add end point to pathlist
			var child = v2, parent = parents[v2.toString()];//set it as the child and get its parent node in the path
			pathStack.unshift(parent);// add the parent to the list
			while(parent !== v1){
			    child = parent;      //set the child to the parent node.
			    parent = parents[child.toString()]; //get its parent node
			    pathStack.unshift(parent);//add the parent to the list
			}
			return pathStack;        //return the final list
		    }

		    var adjs = this.getNode(t).adjs;      //if its not the end point
		    adjs.forEach(function(vert){ //get the nodes adjacent to the current node
    			if(set.indexOf(vert) < 0){//if the current vertex hasn't been seen
    			    queue.push(vert);     //add the vertex to the queue to be visited
    			    set.push(vert);       //add it to the list of seen vertexes
    			    parents[vert.toString()] = t;//note the current node as its parent
    			}
		    })
		}
  };


};

module.exports = miniGraph;
