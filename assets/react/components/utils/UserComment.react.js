/*globals console,module,require,d3*/
/*jslint node: true*/
'use strict';

var React = require('react'),
    _ = require('lodash'),
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
      title:this.props.defaultTitle,
      desc:this.props.defaultDescription,
      render:false,
    };
  },
  componentWillReceiveProps : function(nextProps){
  },
	_cancelAction : function(){
		console.log('cancelled');
    this.setState({title:'',desc:'',render:false});
	},
	titleChange : function(val){
    this.setState({title:val});
	},
	descChange : function(val){
    this.setState({desc:val});
	},
	_saveAction : function(){
    this.setState({render:false});
	},
	renderModal : function(){
		var scope =this;
    var display = (this.state.render)?'block':'none';
		return (

										<div id={"myMessageModal"} className="modal fade" tabindex="-1" role="dialog" aria-labelledby="myMessageModalLabel" aria-hidden="true" style={{display: display,fontSize:'12px'}}>
												<div className="modal-dialog">
														<div className="modal-content">

																<div className="modal-header">
																		<button type="button" onClick={this._cancelAction} className="close" data-dismiss="modal" aria-hidden="true">×</button>
																		<h4 className="modal-title" id={"myMessageModalLabel"}>Edit Model Info</h4>
																</div>
																		<div className='row'><label className='col-sm-2 control-label'>Subject</label><DescriptionArea type='input' text={this.state.title} onChange={this.titleChange}/></div>

																		<div classname='row'><label className='col-sm-2'>Message</label><DescriptionArea text={this.state.desc} onChange={this.descChange}/></div>
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
          <button type="button" className="btn btn-default" data-toggle="modal" data-target={"#myMessageModal"} data-backdrop="static"><i className='fa fa-edit'></i></button>
        {this.renderModal()}
        </div>
      );
  },
});
module.exports = ZoneFilter;
