var React = require('react'),
		//helpers
		_ = require('lodash'),

	// -- Components
	Select2Component = require('../utils/Select2.react'),
  FareZoneFilterStore = require('../../stores/FarezoneFilterStore'),
	// -- Actions
  FarezoneActionsCreator = require('../../actions/FarezoneActionsCreator');

var FarezoneSelector = React.createClass({
  componentDidMount : function(){
    FareZoneFilterStore.addChangeListener(this._onChange);
  },
  componentWillUnmount : function(){
    FareZoneFilterStore.removeChangeListener(this._onChange);
  },
  _onChange : function(){
    this.setState({filters:FareZoneFilterStore.getFarezoneFilters()});
  },
	getInitialState : function(){
		return {
			selection : [],
      filters : FareZoneFilterStore.getFarezoneFilters() || [],
		};
	},
  currentFilter : function(zones,excludes){
    var scope = this;
    excludes = excludes || scope.state.exclusions;
    return Object.keys(zones).map(function(route){
      return Object.keys(zones[route]);
    }).reduce(function(p,c){
      return _.union(p,c);
    }).filter(function(d){//then filter out any excluded ones
      return excludes.indexOf(d) < 0;
    }).sort(function(a,b){return parseInt(a)-parseInt(b);});
  },
  onSelect : function(e,selection){
    var scope = this;
    var currfilter = scope.state.filters.reduce(function(a,b){
      if(b.id === selection.id)
        return b.filter;
      else
        return a;
    },[]);
    var filteredZones = scope.currentFilter(scope.props.zones,currfilter);
    scope.setState({selection:[selection.id],exclusions:currfilter},function(){
      scope.props.onSelection(filteredZones);
    });
  },
	render: function() {
	  	var scope = this;
      var filterSelect = scope.state.filters.map(function(d){
        return {id:d.id,'text':d.filtername};
      });
	    return (
	    	<div>
	    		<div className="form-group">
	                <div className="input-group input-group">

                    <Select2Component
                      id='FilterSelector'
                      dataSet={filterSelect}
                      multiple={false}
                      styleWidth='100%'
                      onSelection={scope.onSelect}
                      placeholder={'Farezone filters'}
                      val={scope.state.selection}
                    />

	                </div>
	            </div>
	    	</div>
	    );
	}

});

module.exports = FarezoneSelector;
