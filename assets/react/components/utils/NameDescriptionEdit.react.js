/*globals console,module,require,d3*/
/*jslint node: true*/
'use strict';

var React = require('react'),
    _ = require('lodash'),
    FareZoneFilterStore = require('../../stores/FarezoneFilterStore'),
    FarezoneActionsCreator = require('../../actions/FarezoneActionsCreator'),
    DescriptionArea = require('./DescriptionArea.react'),
    ModelingActionsCreator = require('../../actions/ModelingActionsCreator'),
    FarezoneFilterSummary   = require('../../components/modelAnalysis/FarezoneFilterSummary.react');



var validStringRegex = new RegExp('^[A-Za-z0-9\\.\\_\\-]*$');
var validInput = function(str){
  return (str.length < 1000) && validStringRegex.test(str);
};
var ZoneFilter = React.createClass({
  componentDidMount : function(){

  },
  componentWillUnmount : function(){

  },
  _onChange : function(e){
    this.props.onChange(e.target.value);
  },
  getInitialState : function(){
    return {
      name:this.props.name,
      description:this.props.description,
    };
  },
  componentWillReceiveProps : function(nextProps){
    var partialState = {};
    if(nextProps.name)
      partialState.name = nextProps.name;
    if(nextProps.description)
      partialState.description = nextProps.description;
    this.setState(partialState);
  },
  _editModelRun : function(){
		console.log('Clicked Me');
	},
	_cancelAction : function(){
		console.log('cancelled');
	},
	nameChange : function(val){
    this.setState({name:val});
	},
	descChange : function(val){
    this.setState({description:val});
	},
	_saveAction : function(){
    var model = this.props.model;
    model.name = this.state.name;
    model.description = this.state.description;
    ModelingActionsCreator.updateModel(model);
	},
	renderModal : function(){
		var scope =this;
		return (


										<div id={"myModalModelEdit"} className="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style={{display: 'none',fontSize:'12px'}}>
												<div className="modal-dialog">
														<div className="modal-content">

																<div className="modal-header">
																		<button type="button" onClick={this._cancelAction} className="close" data-dismiss="modal" aria-hidden="true">×</button>
																		<h4 className="modal-title" id={"myModalLabel"}>Edit Model Info</h4>
																</div>
																		<div className='row'><label className='col-sm-2 control-label'>Name</label><DescriptionArea type='input' text={this.state.name} onChange={this.nameChange}/></div>

																		<div classname='row'><label className='col-sm-2'>Description</label><DescriptionArea text={this.state.description} onChange={this.descChange}/></div>
																		<div className='row'></div>
																	<div className="modal-footer">
																		<button type="button" onClick={this._cancelAction} className="btn btn-default" data-dismiss="modal">Close</button>
																		<button type='button' onClick={this._saveAction} className="btn btn-danger" data-dismiss="modal">Save</button>
																</div>
														</div>
												</div>
										</div>

									);


	},
  render : function(){
      return (
        <div className="input-group-btn">
          <button type="button" className="btn btn-default" onClick={this.props.addClick}><i className="fa fa-plus"></i></button>
          <button type="button" disabled={!this.props.model} className="btn btn-default" data-toggle="modal" data-target={"#myModalModelEdit"} data-backdrop="static"><i className='fa fa-edit'></i></button>
        {this.renderModal()}
        </div>
      );
  },
});
module.exports = ZoneFilter;
