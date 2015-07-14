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
        modal:false
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
      var name = Math.round(Math.random()*1000)+'';
      this.props.cloneSave(name);
      this.setState({modal:false});
    },
    prompt : function(){
      if(this.props.gtfs && this.props.gtfs.settings.readOnly && this.state.modal){
        return (
          <div className="body">
              <button type="button" className="btn btn-warning btn-block" data-toggle="modal" data-target={"#myModal" + this.props.id} data-backdrop="static">{this.props.buttonText}</button>
              <div id={"myModal" + this.props.id} className="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style={{display: 'none',fontSize:'12px'}}>
                  <div className="modal-dialog">
                      <div className="modal-content">

                          <div className="modal-header">
                              <button type="button" onClick={this._cancelAction} className="close" data-dismiss="modal" aria-hidden="true">×</button>
                              <h4 className="modal-title" id={"myModalLabel"+this.props.id}>Modal Heading</h4>
                          </div>
                          {'The Current Data is Protected, would you like to copy it?'}
                          <div className="modal-footer">
                              <button type="button" onClick={this._cancelAction} className="btn btn-default" data-dismiss="modal">No</button>
                              <button type="button" onClick={this._saveChange} className="btn btn-primary">Yes</button>
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

              <button style={{fontSize:'20px'}} className={classes}
              onClick={this.onSave}>
                                {'Save Changes'};
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
