'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    GroupBox = require('./GroupBox.react'),
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
            frequencies:this.props.frequencies,
            timeDeltas:null,
            lengths:null,
            units:'mi',
	    frequency:null,
        };
    },
    _totaltime :function(){
      if(this.state.timeDeltas){
        var totalTime = this.state.timeDeltas.reduce(function(p,c){return p+c;});
        return totalTime/60;
      }
    },
    _totalDistance : function(unit){
      if(this.state.lengths){
        var total = this.state.lengths.reduce(function(p,c){return p+c;});
        switch (unit.toLowerCase()) {
          case 'mi':
            return (total/1000)*0.621371;
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
      if(!nextProps.frequencies){
        this.setState({frequencies:null,timeDeltas:null,lengths:null});
      }
      else{
        this.setState({frequencies:nextProps.frequencies});
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
    componentWillUpdate : function(nextProps,nextState){

      if(nextProps.deltas && (this.props.deltas !== nextProps.deltas))
      {
        this.setState({timeDeltas:nextProps.deltas});
      }
      if(nextProps.lengths && (this.props.lengths !== nextProps.lengths))
      {
        this.setState({lengths:nextProps.lengths});
      }
    },

    addFreq : function(){
	this.props.addFreq();
    },
    deleteAction : function(freq){
	    this.props.deleteFreq(freq);
    },
    notifyChange : function(change){
      var isEdited;
      var editList = this.state.frequencies.map(function(f){
        return f.edited;
      });

      if(editList.length === 1)
        isEdited = editList[0];
      else
        isEdited = editList.reduce(function(p,c){
          return p||c;
        });
      this.props.notifyChange(isEdited);
    },
    render: function() {
        if(this.state.frequencies &&  Object.keys(this.state.frequencies).length >= 0){
          var scope = this;
          var tables = this.state.frequencies.sort(function(d1,d2){return diffSecs(d1.start_time,d2.start_time);}).map(function(d){
	      console.log(d);
              return (
                <GroupBox
		  deleteAction={scope.deleteAction}
                  frequency={d}
                  deltas={scope.state.timeDeltas}
                  lengths = {scope.state.lengths}
                  notifyChange={scope.notifyChange}/>
              );
          });
          return (
              <section className="widget">
                <table className="table">
                  <thead>
                    <tr>
		      <th>{'Name'}</th>
                      <th>{'First Departure'}</th>
                      <th>{'Last Departure'}</th>
                      <th>{'Headway'}</th>
                      <th>{'Idle'}</th>
                      <th>{'RunTime'}</th>
                      <th>{'Distance'}</th>
                      <th>{'Buses'}</th>
		      <th></th>
                    </tr>
                  </thead>
                  <tbody>
	      {tables.reverse()}
	         
	          <tr>
		    <th> 
		      <button className='btn' onClick={this.addFreq}>
		      <i className='glyphicon glyphicon-plus'> </i> 
                      </button>
		    </th>
	          </tr>
	       </tbody>
              </table>

              </section>
          );
        }else{
          return (<div></div>);
        }
    },
    
});

module.exports = TripSchedule;
