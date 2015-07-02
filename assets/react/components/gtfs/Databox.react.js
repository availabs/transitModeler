'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    Select2Component = require('../utils/Select2.react'),
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

var idGen = require('./randomId');
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            selection:[],
            serviceSelection:[],

        };
    },
    updateGtfs:function(e,selection){
      var scope = this;
      if(selection){
        var canChange = this.props.onRouteChange(selection.id);
        if (this.isMounted() && canChange) {
          scope.setState({selection:selection.id,serviceSelection:[]});
          console.log(selection.id);
        }else if(!canChange){
          scope.setState({selection:this.state.selection});//set the state to itself to force rerender
        }
      }
      console.log(this.state.selection);
    },
    componentWillUpdate : function(nextProps,nextState){
      //console.log('Select Check',nextProps,nextState)
    },
    addingRouteAction : function(data){
      var err = this.props.addRoute(data);
      if(err){
        this.setState({selection:this.state.selection});
        return err;
      }else{
        this.setState({selection:data['New Route']});
      }
    },
    onEditSelect : function(){
      this.props.EditRoute(this.state.selection);
    },
    updateServices : function(e,selection){
      if(selection){
        var canChange = this.props.onServiceChange(selection.text);
        if(this.isMounted() && canChange){
          this.setState({serviceSelection:selection.id});
        }else if(!canChange){
          this.setState({serviceSelection:this.state.selection});
        }
      }
    },
    render: function() {
        var scope = this;
        var classes = "btn btn-lg btn-block";
        var selectRouteData = Object.keys(this.props.schedules)
                                .map(function(key){
                                    return {"id":scope.props.schedules[key].id ,"text":key };
                                });
        var serviceData = {};                        //selector has been chose;
        if(typeof this.state.selection !== 'object'){

          this.props.schedules[this.state.selection].trips.map(function(t){
                          serviceData[t.service_id] = t.service_id;
                        });
        }
        serviceData = Object.keys(serviceData).map(function(key){
                                  return {'id':serviceData[key],'text':key};
                                });
        return (
            <section className="widget">
                <div className="body no-margin" >

                    <Select2Component
                      id="gtfsSelector"
                      dataSet={selectRouteData}
                      multiple={false}
                      styleWidth="100%"
                      onSelection={this.updateGtfs}
                      placeholder={'Select a Route'}
                      val={this.state.selection} />
                    <Select2Component
                      id="serviceSelector"
                      dataSet={serviceData}
                      multiple={false}
                      styleWidth="100%"
                      onSelection={this.updateServices}
                      placeholder={"Select a Service"}
                      val={this.state.serviceSelection}/>
                  <div>
                    <CreationForm
                    values={{"New Route":idGen('route')}}
                    buttonText={"Create New Route"}
                    id={"routes"}
                    saveAction={this.addingRouteAction}/>
                  </div>
                  <div>
                    {(this.state.selection.length > 0) ? <button style={{fontSize:'20px'}} className={classes}  onClick={this.onEditSelect}>{'Edit Route Details'}</button>: null}
                  </div>
                </div>



            </section>
        );
    }
});

module.exports = MarketAreaNew;
