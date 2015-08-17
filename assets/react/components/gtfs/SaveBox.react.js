'use strict';
/*globals module,require,console*/
var React = require('react'),
    //comps
    CreationForm     = require('./CreationForm.react');
    // -- Actions
    // -- Stores
var MarketAreaNew = React.createClass({
    getInitialState: function(){
      return {
        modal:false,
        name:Math.round(Math.random()*1000) +'',
      };
    },
    onSave : function(){
      if(this.props.gtfs && !this.props.gtfs.settings.readOnly){
        this.props.onSave();
      }else{
        this.toggleModal();
      }
    },
    _cancelAction: function(){
      this.setState({modal:false});
    },
    _saveChange : function(){
      this.props.cloneSave(this.state.name);
      this.setState({modal:false});
    },
    nameChange : function(e){
      this.setState({name:e.target.value});
    },
    prompt : function(){
      if(this.props.gtfs && this.props.gtfs.settings.readOnly && this.state.modal){
        return (
          <div className="body">
              <div id={"myModal"} className="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style={{display: 'none',fontSize:'12px'}}>
                  <div className="modal-dialog">
                      <div className="modal-content">

                          <div className="modal-header">
                              <button type="button" onClick={this._cancelAction} className="close" data-dismiss="modal" aria-hidden="true">×</button>
                              <h4 className="modal-title" id={"myModalLabel"+this.props.id}>{'Clone Data'}</h4>
                          </div>
                          <h4>{'The Current Data is Protected, please create a name for its clone'}</h4>
                          <br/>
                          <br/>
                          <label className={'control-label col-sm-4'}>Dataset Name:</label>
                          <input type='text' onChange={this.nameChange} value={this.state.name}></input>
                          <div className="modal-footer">
                              <button type="button" onClick={this._cancelAction} className="btn btn-default" data-dismiss="modal">No</button>
                              <button type="button" onClick={this._saveChange} className="btn btn-primary" data-dismiss="modal">Yes</button>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
          );
      }
      else{
        return (
          <div></div>
        );
      }

    },
    toggleModal : function(){
      this.setState({modal:true});
    },
    render: function() {
        var buttons = <span/>,scope=this;
        var classes = "btn btn-lg btn-warning btn-block";
        console.log('gtfs check',this.props.gtfs);
        if(this.props.Edited){
            buttons = (

              <button style={{fontSize:'20px'}} data-toggle="modal" data-target={'#myModal'} data-backdrop="static" className={classes}
              onClick={this.onSave}>
                                {'Save Changes'}
              </button>

            );
        }
        //var routesGeo = this.state.routesGeo || emptyGeojson;

        return (
            <section className="widget">
                <div className="body no-margin">
                    {buttons}
                    {scope.prompt()}
                </div>
            </section>
        );
    }
});

module.exports = MarketAreaNew;
