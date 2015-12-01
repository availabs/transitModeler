var React = require('react'),
		//helpers
		_ = require('lodash'),

	// -- Components
	Select2Component = require('../utils/Select2.react'),

	// -- Actions
	ModelingActionsCreator = require('../../actions/ModelingActionsCreator');
var ix=0;
var ModelRunSelector = React.createClass({

  	_loadModelRun:function(){
  		var id = this.refs.modelRunId.getDOMNode().childNodes[1].getAttribute("value");
  		//console.log('Analyze Model',id);
			if(id){
				ModelingActionsCreator.addActiveModelRun(id);
				this.props.onSelection(id);
				this.setState({selection:[]});
			}


  	},
	getInitialState : function(){
		return {
			model_runs : this.props.model_runs,
			selection:[],
		};
	},
	componentWillReceiveProps : function(nextProps){
		if(!this.props.model_runs || !_.isEqual(this.props.model_runs, nextProps.model_runs) ){
			this.setState({model_runs:nextProps.model_runs});
		}
	},
	setSelection : function(e,selection){
		//console.log(e,selection);
		this.setState({selection:[selection.id]});
	},
	render: function() {
	  	var scope = this;
		//	console.log('r',ix++,'data',scope.props.model_runs);
	  	//console.log('ModelRunSelector / Render ',Object.keys(this.props.model_runs),scope.props.marketarea)
			//filter models that are available for the current market area
	  	var marketModelKeys = Object.keys(this.state.model_runs).filter(function(key){
	  		return scope.state.model_runs[key].info.marketarea.id === scope.props.marketarea.id;
	  	});
			//take each of those model keys
	  	var names = marketModelKeys.map(function(key){//create a list consisting of
				//compose a name from its time,type,and acs datasource

	  		var name =  scope.state.model_runs[key].info.time+' '+scope.state.model_runs[key].info.type+' '+(scope.state.model_runs[key].info.datasources.acs || scope.state.model_runs[key].info.datasources.acs_source);

				return {
	  			"id" : scope.state.model_runs[key].id ,
	  			"text" : key + ' ' +name
	  		};
	  	});
			//create a select box from the generated name
		var loading =  <img src={"/img/loading.gif"} style={{width:60,height:60}} />;

	    return (
	    	<div className='row'>
	    		<div className='col-xs-8' id="sliderGuide">
		    		<div className="form-group">
		                <div className="input-group input-group">

		                    <Select2Component
		                      id="modelRunId"
		                      dataSet={names}
		                      multiple={false}
		                      styleWidth="100%"
		                      ref="modelRunId"
													onSelection={scope.setSelection}
		                      val={this.state.selection}
		                      placeholder="Select a Model to Analyze" />

		                    <div className="input-group-btn">
		                        <button type="button" className="btn btn-default" onClick={this._loadModelRun}><i className="fa fa-plus"></i></button>
		                    </div>

		                </div>
		            </div>
		        </div>
		        <div className='col-xs-4'>
		            {this.props.loading ?  loading :'' }
	           	</div>
	    	</div>
	    );
	}

});

module.exports = ModelRunSelector;
