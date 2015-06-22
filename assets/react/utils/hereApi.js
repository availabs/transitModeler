var swap = function(point){
	return [point[1],point[0]];
}
var hereApi = function(){
		var here = {};
		here.points=[];
		here.app_id = '&app_id=Bz4ZlbpcifSacIK9v2mq', here.app_code = '&app_code=laXkT6pG_eHHQckETu5AEg'
		here.baseUrl = 'http://route.cit.api.here.com/routing/7.2/calculateroute.json?'
		here.mode = '&mode=fastest;car'
		here.routeAtts= '&routeAttributes=sh'
		here.addwaypoint = function(point){
			here.points.push(swap(point));
		}
		here.addwaypoints = function(points){
			points.forEach(function(point){
				here.addwaypoint(point);
			})
		}
		here.getWayPoint = function(n){
			var p = here.points[n];
			return '&waypoint'+n+'=geo!' + p[0]+','+p[1];
		}
		here.getWayPoints = function(){
			var args = '';
			for(var i = 0; i < here.points.length; i++){
				args += here.getWayPoint(i);
			}
			return args;
		}
		here.getUrl = function(){
			return here.baseUrl + here.app_id + here.app_code + here.getWayPoints() + here.mode + here.routeAtts;
		}

		here.handleRequest = function(cb){
			d3.json(here.getUrl(),function(err,data){
				var retobj = here.parser.handleResponse(data);
				cb(err,retobj);
			})
		}

		here.parser = {
			handleResponse: function(resp){
				//assume that we will take the first route in the response
				//then for each leg of the route
				resp = resp.response;
				resp.route = resp.route[0];
				var retobj = {};
				var shape = resp.route.shape;
				var dataofinterest = resp.route.leg.forEach(function(l){
					var start = l.start.shapeIndex;
					var end = l.end.shapeIndex;
					l.path = shape.slice(start,end+1).map(function(cpairstring){
						return swap(cpairstring.split(',').map(parseFloat));
					})
				});
				retobj.legs = resp.route.leg;
				retobj.getPath = function(i){
					return retobj.legs[i].path;
				}
				retobj.getTimeDelta = function(i){
					return retobj.legs[i].travelTime;
				}
				retobj.getAllDeltas = function(){
					var temp = retobj.legs.map(function(c,i,a){return c.travelTime;});
					console.log(temp)
					return temp;
				}
				retobj.getTotalTime = function(){
					return 
				}
				return retobj;
			},
		};
		return here;	
	};

module.exports = hereApi;