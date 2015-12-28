'use strict';
/*globals console,require,module*/
var React = require('react'),
    idGen = require('../utils/randomId');
    //comps
    // -- Actions
    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        var iState = {},
        scope=this;
        var theValues;
        if(this.props.useDefault){
          theValues = this.props.DefaultValues;
        }
        else{
          theValues = this.props.values;
        }
        Object.keys(theValues).forEach(function(key){
          iState[key]  =  (scope.props.useDefault)?theValues[key]:idGen(theValues[key]);
        });

        return iState;
    },
    _cancelAction : function(){
      console.log('Killed It');
    },
    _handleChange : function(e){
      var partial_state = {};
      var valid = true;
      if(this.props.handleChange){
        valid = this.props.handleChange(e.target.value);
      }
      if(valid)
        partial_state.invalid=false;

      else
        partial_state.invalid=true;

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
        var theValues;
        if(this.props.useDefault){
          theValues = this.props.DefaultValues;
        }
        else{
          theValues = this.props.values;
        }
        var fields = Object.keys(theValues).map(function(key){
            return ( <div className="modal-body">
                                        <h4>{key}</h4>
                                        <input type="text" id={key} className='form-control' value={scope.state[key]} onChange={scope._handleChange}/>
                                        <p>{(scope.state.invalid && scope.props.invalidMessages[key]) ? scope.props.invalidMessages[key] : ''}</p>
                                    </div>
                  );
        });
        var savebutton = (function(){
          if(scope.state.invalid)
            return (<button type="button" onClick={scope._saveChange} className="btn btn-primary" data-dismiss="modal" disabled>Save changes</button>);
          else {
            return (<button type="button" onClick={scope._saveChange} className="btn btn-primary" data-dismiss="modal">Save changes</button>);
          }
        })();


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
                                        {savebutton}
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
