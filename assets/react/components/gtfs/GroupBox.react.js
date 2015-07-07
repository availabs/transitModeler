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
            frequency:this.props.frequency,
            timeDeltas:this.props.deltas,
            lengths:this.props.lengths,
            units:'mi',
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
      if(!(nextProps.frequency)){
        this.setState({headway:null,startTime:null,endTime:null});
      }
      else{
        this.setState({frequency:nextProps.frequency});
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
    fieldClick : function(field){
      var scope = this;
      return function(e){
          console.log($('#'+field+scope.state.frequency.trip_id.replace(/\,/g,'_')));
          console.log($('#'+field+'b'+scope.state.frequency.trip_id.replace(/\,/g,'_')));
          $('#'+field+scope.state.frequency.trip_id.replace(/\,/g,'_')).hide();
          var textfield = $('#'+field+'b'+scope.state.frequency.trip_id.replace(/\,/g,'_'));
          textfield.show();
          textfield.focus();
          textfield.get(0).setSelectionRange(textfield.val().length,textfield.val().length);
      };

    },
    fieldFocus : function(field){
      var scope=this;
      return function(e){
        console.log(e);
      };
    },
    fieldBlur : function(field){
      var scope = this;
      return function(e){
        console.log(e);
        $('#'+field+scope.state.frequency.trip_id.replace(/\,/g,'_')).show();
        console.log($('#'+field+scope.state.frequency.trip_id.replace(/\,/g,'_')))
        $('#'+field+'b'+scope.state.frequency.trip_id.replace(/\,/g,'_')).hide();
        console.log($('#'+field+'b'+scope.state.frequency.trip_id.replace(/\,/g,'_')))
      };
    },
    _onChange : function(field){
        var scope = this;
        return function(e){
            var partialState = scope.state.frequency;
            if(typeof scope.state.frequency[field] === 'number')
              partialState[field] = parseInt(e.target.value)*60;
            else
              partialState[field] = e.target.value;
            scope.setState({frequency:partialState});
        };
    },
    render : function(){
      if(!this.state.frequency)
        return (<div></div>);
      var s = this.state.frequency.start_time,
          e = this.state.frequency.end_time,
          id= this.state.frequency.trip_id,
          h = this.state.frequency.headway_secs,
          field1 = 'start_time',field2='end_time',field3='headway_secs';
      var sclick = this.fieldClick(field1),
          eclick = this.fieldClick(field2),
          hclick = this.fieldClick(field3),
          sblur = this.fieldBlur(field1),
          eblur = this.fieldBlur(field2),
          hblur = this.fieldBlur(field3),
          schange= this._onChange(field1),
          echange= this._onChange(field2),
          hchange= this._onChange(field3),
          sfocus = this.fieldFocus(field1);
      var style={overflow:'hidden'};
      return(

        <tbody>
            <tr>
              <td onClick={sclick}>
                <div id={field1+id.replace(/\,/g,'_')}>{s}</div>
                <input size={8} className={'form-control'} onFocus={sfocus}type='text'id={field1+'b'+id.replace(/\,/g,'_')} style={{display:'none'}} onChange={schange} value={this.state.frequency.start_time} onBlur={sblur}></input>
              </td>

              <td onClick={eclick} >
                <div id={field2+id.replace(/\,/g,'_')}>{e}</div>
                <input size={8} className={'form-control'} type='text'id={field2+'b'+id.replace(/\,/g,'_')} style={{display:'none'}} onChange={echange}value={this.state.frequency.end_time} onBlur={eblur}></input>
              </td>

              <td onClick={hclick} >
                <div id={field3+id.replace(/\,/g,'_')}>{h/60 + ' min'}</div>
                <input size={4} className={'form-control'} style={{display:'none'}} id={field3+'b'+id.replace(/\,/g,'_')} type='text'onChange={hchange} value={this.state.frequency.headway_secs/60} onBlur={hblur}></input>
              </td>

              <td>{Math.round(this._totaltime()) + 'mins'}</td>
              <td>{Math.round(this._totalDistance(this.state.units)*10)/10 +' '+ this.state.units}</td>
            </tr>
          </tbody>
      );
    },

});

module.exports = TripSchedule;
