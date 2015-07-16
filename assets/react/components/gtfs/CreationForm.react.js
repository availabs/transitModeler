'use strict';
/*globals console,require,module*/
var React = require('react'),
    idGen = require('./randomId');
    //comps
    // -- Actions
    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        var iState = {},
        scope=this;
        Object.keys(this.props.values).forEach(function(key){
          iState[key]  =  idGen(scope.props.values[key]);
        });

        return iState;
    },
    _cancelAction : function(){
      console.log('Killed It');
    },
    _handleChange : function(e){
      var partial_state = {};
      partial_state[e.target.id] = e.target.value;
      this.setState(partial_state);
    },
    _saveChange : function(e){
      var err = this.props.saveAction(this.state);
      console.log(err);
    },
    resetIds : function(){
      this.setState(this.getInitialState());
    },
    _form : function(){
        var scope = this;
        var fields = Object.keys(this.props.values).map(function(key){
            return ( <div className="modal-body">
                                        <h4>{key}</h4>
                                        <input type="text" id={key} value={scope.state[key]} onChange={scope._handleChange}/>
                                    </div>
                  );
        });

        return (
                    <div className="body">
                        <button type="button" onClick={this.resetIds} className="btn btn-warning btn-block" data-toggle="modal" data-target={"#myModal" + this.props.id} data-backdrop="static">{this.props.buttonText}</button>
                        <div id={"myModal" + this.props.id} className="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style={{display: 'none',fontSize:'12px'}}>
                            <div className="modal-dialog">
                                <div className="modal-content">

                                    <div className="modal-header">
                                        <button type="button" onClick={this._cancelAction} className="close" data-dismiss="modal" aria-hidden="true">×</button>
                                        <h4 className="modal-title" id={"myModalLabel"+this.props.id}>Modal Heading</h4>
                                    </div>
                                    {fields}
                                    <div className="modal-footer">
                                        <button type="button" onClick={this._cancelAction} className="btn btn-default" data-dismiss="modal">Close</button>
                                        <button type="button" onClick={this._saveChange} className="btn btn-primary" data-dismiss="modal">Save changes</button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
        );
    },
    render: function() {

        //var routesGeo = this.state.routesGeo || emptyGeojson;
        var scope = this;

        return (
                <div className="body no-margin">
                    {this._form()}
                </div>
              );
    }
});

module.exports = MarketAreaNew;
