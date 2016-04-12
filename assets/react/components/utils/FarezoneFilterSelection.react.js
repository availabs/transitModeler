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
	  filters : FareZoneFilterStore.getFarezoneFilters() || 
	  [],
      };
  },
  currentFilter : function(zones,excludes){
      var scope = this;
      excludes = excludes || scope.state.exclusions;
      return excludes;
  },
  clear : function(){
      var scope = this;
      scope.setState({exclusions:{}},function(){
	  scope.props.onSelection(null,[],[]);
      });
  },
  onSelect : function(e,selection){
      var scope = this;
      var dates = {};
      if(!selection)
	  return;
      var currfilter = scope.state.filters.reduce(function(a,b){
	  if(b.id === selection.id){
	      dates = b.dates;
              return b.filter[0];
	  }
	  else
              return a;
      },{});
      
      var filteredZones = scope.currentFilter(scope.props.zones,
					      currfilter);
      scope.setState({exclusions:currfilter},function(){
	  scope.props.onSelection(filteredZones,dates,[selection.id]);
      });
  },
    render: function() {
	var scope = this;
	console.log(this.props.selection);
	var filterSelect = scope.state.filters.map(function(d){
            return {id:d.id,'text':d.filtername};
	});
	return (
	    <div className='row' style={{width:this.props.width || '100%',
			 float:'left',padding:'0'}}>
	    <div className="input-group input-group">
	   
            <Select2Component
            id='FilterSelector'
            dataSet={filterSelect}
            multiple={false}
            styleWidth='100%'
            onSelection={scope.onSelect}
            placeholder={'Farezone filters'}
            val={scope.props.selection}
            />
	    
	    {(scope.props.selection && scope.props.selection.length > 0) ? 
	     (<span className='input-group-addon' >
		 <a onClick={this.clear}> 
	          <i className='glyphicon glyphicon-remove'> </i>
	         </a></span>)
		    : (<span></span>)
	    }
	    </div>
	    </div>
	);
    }

});

module.exports = FarezoneSelector;
