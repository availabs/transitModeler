var React = require('react'),
	
	// -- Components
	Select2Component = require('../utils/Select2.react'),

	// -- Actions
	ModelingActionsCreator = require('../../actions/ModelingActionsCreator');

var ModelRunSelector = React.createClass({

  	_loadModelRun:function(){

  	},

	render: function() {
	  	var scope = this;
	  	//console.log('ModelRunSelector / Render ',Object.keys(this.props.model_runs),scope.props.marketarea)
	  	var marketModelKeys = Object.keys(this.props.model_runs).filter(function(key){
	  		return scope.props.model_runs[key].info.marketarea.id === scope.props.marketarea.id;
	  	});

	  	var names = marketModelKeys.map(function(key){
	  		var name =  scope.props.model_runs[key].info.time+' '+scope.props.model_runs[key].info.type+' '+scope.props.model_runs[key].info.datasources.acs;
	  		return { 
	  			"id" : scope.props.model_runs[key].id ,
	  			"text" : name
	  		}
	  	});
	    
	    return (
	    	<div>
	    		<div className="form-group">
	                <div className="input-group input-group">
	                    
	                    <Select2Component
	                      id="modelRunId"
	                      dataSet={names}
	                      multiple={false}
	                      styleWidth="100%"
	                      ref="modelRunId"
	                      val={[]}
	                      placeholder="Select a Model to Analyze" />

	                    <div className="input-group-btn">
	                        <button type="button" className="btn btn-default" onClick={this._loadModelRun}><i className="fa fa-plus"></i></button>
	                    </div>
	                </div>
	            </div>
	    	</div>
	    );
	}

});

module.exports = ModelRunSelector;

