'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

    // -- utils
    var dotprod = function(l1,l2){
  		var sum =0;
  		for(var i =0, max = Math.min(l1.length,l2.length); i< max; i++){
  			sum += l1[i]*l2[i];
  		}
  		return sum;
  	};

	var diffSecs = function(t1,t2){
		var factors = [3600,60,1];
		t1 = t1.split(':');
		t2 = t2.split(':');
		var parseI = function(x){return parseInt(x);};
		var p1= t1.map(parseI);
		var p2 = t2.map(parseI);
		var ctime1 = dotprod(factors,p1);
		var ctime2 = dotprod(factors,p2);
		return (ctime2 - ctime1);
	};

var TripSchedule = React.createClass({
    getInitialState:function(){
        return {
            startTime:null,
            endTime:null,
            headWay:null,
            timeDeltas:null,
            lengths:null,
        };
    },
    _totaltime :function(){
      if(this.state.timeDeltas){
        var totalTime = this.state.timeDeltas.reduce(function(p,c){return p+c;});
        return totalTime/60;
      }
    },
    _totalDistance : function(unit){
      if(this.state.lengths && unit.toLowerCase){
        var total = this.state.lengths.reduce(function(p,c){return p+c;});
        switch (unit.toLowerCase()) {
          case 'mi':
            return (total/1000)*1.609;
          case 'm':
            return total;
          case 'km':
            return (total/1000);
          default:
            return 'unknown units';
        }
      }
      else {
        return 0;
      }
    },
    componentWillReceiveProps : function(nextProps){
      if(!nextProps.trip){
        this.setState({startTime:null,endTime:null,headWay:null});
      }
    },
    componentWillUpdate : function(nextProps,nextState){
      //console.log('Select Check',nextProps,nextState)
      if(nextProps.trip && (this.props.trip !== nextProps.trip) ){
        var Trip  = nextProps.trip,
        startTimes = Trip.getStartTimes(),
        startTime = Trip.getStartTime(0),
        stopTime  = Trip.getLastStartTime(),
        headway=0;

        if(startTimes.length > 1){
          startTimes.reduce(function(p,c,i,a){
                    headway += diffSecs(p,c);
                    return c;
          });
          headway = Math.ceil(headway/((startTimes.length -1) * 60));
        }
        else{
          headway = 0;
        }
        this.setState({startTime:startTime,endTime:stopTime,headWay:headway});
      }
      if(nextProps.deltas && (this.props.deltas !== nextProps.deltas))
      {
        this.setState({timeDeltas:nextProps.deltas});
      }
      if(nextProps.lengths && (this.props.lengths !== nextProps.lengths))
      {
        this.setState({lengths:nextProps.lengths});
      }
    },
    _roundNice : function(real){

    },
    render: function() {
        var scope = this, units='km',
        style={overflow:'hidden'};
        if(this.state.headWay !== null){
          return (
              <section className="widget">
                  <div className="body no-margin" style={style} >
                    <table className="table table-bordered ">
                      <thead>
                        <tr>
                          <th>{'First Departure'}</th>
                          <th>{'Last Departure'}</th>
                          <th>{'Headway'}</th>
                          <th>{'RunTime'}</th>
                          <th>{'Distance'}</th>

                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{this.state.startTime}</td>
                          <td>{this.state.endTime}</td>
                          <td>{this.state.headWay + ' min'}</td>
                          <td>{Math.round(this._totaltime()) + 'mins'}</td>
                          <td>{Math.round(this._totalDistance(units)*10)/10 +' '+ units}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
              </section>
          );
        }else{
          return (<div></div>);
        }
    }
});

module.exports = TripSchedule;
