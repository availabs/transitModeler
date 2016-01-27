'use strict';

var React = require('react'),

    // -- Components
    Select2Component = require('../../utils/Select2.react');

var GtfsSelector= React.createClass({

    getInitialState:function(){
      return {
        selection:(this.props.currentSelection)? [this.props.currentSelection] : [],
      };
    },
    componentWillReceiveProps : function(nextProps){
      if(nextProps.currentSelection !== this.state.selection[0]){
        this.setState({selection:[nextProps.currentSelection]});
      }
    },
    getDefaultProps:function(){
      return {
        gtfsData:[]
      };
    },

    updateGtfs:function(e,selection){
      var scope = this;
      if(selection){
        this.props.gtfsChange(scope.props.gtfsChange(scope.props.gtfsData[selection.id]));
        if (this.isMounted()) {
          scope.setState({selection:[selection.id]});
        }
      }
    },

    render:function(){
      var scope = this;
      console.log('gtfs selection',this.state.selection);
      //if(this.state.marketarea.routes)
      var selectData = Object.keys(this.props.gtfsData).map(function(key,id){
          var dataset = scope.props.gtfsData[key];
          return {"id":dataset.id,"text":dataset.tableName};
      });

      return(
        <div className="form-group">

            <label className="control-label" htmlFor="routeSelector"><h4>Select GTFS Dataset:</h4></label>

            <div className="input-group">

                <Select2Component
                  id="gtfsSelector"
                  dataSet={selectData}
                  multiple={false}
                  styleWidth="100%"
                  onSelection={this.updateGtfs}
                  val={this.state.selection} />


            </div>
        </div>
      );
    }
});

module.exports = GtfsSelector;
