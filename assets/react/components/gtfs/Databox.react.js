'use strict';
/*globals confirm, console,module,require*/
var React = require('react'),
    //comps
    Select2Component = require('../utils/Select2.react'),
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores

var idGen = require('../utils/randomId');
var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            selection:(this.props.currentRoute)? [this.props.currentRoute] : [],
            serviceSelection:(this.props.currentService)?[this.props.currentService] : [],

        };
    },
    updateGtfs:function(e,selection){
      var scope = this;
      if(selection){
        var canChange = this.props.onRouteChange(selection.id);
        if (this.isMounted() && canChange) {
          scope.setState({selection:[selection.id],serviceSelection:[]});
          console.log(selection.id);
        }else if(!canChange){
          scope.setState({selection:this.state.selection});//set the state to itself to force rerender
        }
      }
      console.log(this.state.selection);
    },
    componentWillUpdate : function(nextProps,nextState){

    },
    componentWillReceiveProps : function(nextProps){
      var partialState = {};
      if(nextProps.currentRoute && this.state.selection[0] !== nextProps.currentRoute){
        partialState.selection=[nextProps.currentRoute];
        partialState.serviceSelection = [];
      }
      if(nextProps.currentService && this.state.serviceSelection[0] !== nextProps.currentService){
        partialState.serviceSelection=[nextProps.currentService];
      }

      this.setState(partialState);
    },
    addingRouteAction : function(data){
      var err = this.props.addRoute(data);
      if(err){
        this.setState({selection:this.state.selection});
        return err;
      }else{
        this.setState({selection:[data['New Route']]});
      }
    },
    onEditSelect : function(){
      this.props.EditRoute(this.state.selection[0]);
    },
    updateServices : function(e,selection){
      if(selection){
        var canChange = this.props.onServiceChange(selection.id);
        if(this.isMounted() && canChange){
          this.setState({serviceSelection:[selection.id]});
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
                                    return {"id":scope.props.schedules[key].id ,"text":scope.props.schedules[key].shortName };
                                }).filter(function(d){return d.text !=='id';});
        var serviceData = {};                        //selector has been chose;
        if(this.props.schedules[this.state.selection]){
          this.props.schedules[this.state.selection].trips.map(function(t){
                          serviceData[t.service_id] = t.service_id;
                        });
        }

        serviceData = Object.keys(serviceData).map(function(key){
                                  return {'id':serviceData[key],'text':key};
                                });
        var testData = [1,2,3,4,5].map(function(d){
          return {id:d,text:d.toString()};
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
                    values={{"New Route":'route'}}
                    buttonText={"Create New Route"}
                    id={"routes"}
                    saveAction={this.addingRouteAction}/>
                  </div>
                  <div>
                    {(this.state.selection.length > 0) ? <button className={'btn btn-danger'}  onClick={this.onEditSelect}><i className="fa fa-pencil"></i> {' Edit Route'}</button>: null}
                  </div>
                </div>



            </section>
        );
    }
});

module.exports = MarketAreaNew;
