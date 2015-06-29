'use strict';

var React = require('react'),
    //comps
    Select2Component = require('../utils/Select2.react'),
    CreationForm     = require('./CreationForm.react'),
    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores


var MarketAreaNew = React.createClass({
    getInitialState:function(){
        return {
            selection:[]
        }
    },
    updateGtfs:function(e,selection){
      var scope = this;
      if(selection){
        var canChange = this.props.onRouteChange(selection.id);
        if (this.isMounted() && canChange) {
          scope.setState({selection:selection.id});
          console.log(selection.id)
        }else if(!canChange){
          scope.setState({selection:this.state.selection});//set the state to itself to force rerender
        }
      }
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
    render: function() {
        var scope = this;
        var selectData = Object.keys(this.props.schedules)
                                .map(function(key){
                                    return {"id":scope.props.schedules[key].id ,"text":key };
                                });
        return (
            <section className="widget">
                <div className="body no-margin" >
                    <Select2Component
                      id="gtfsSelector"
                      dataSet={selectData}
                      multiple={false}
                      styleWidth="100%"
                      onSelection={this.updateGtfs}
                      val={this.state.selection} />
                  <div>
                    <CreationForm
                    values={{"New Route":''}}
                    buttonText={"Create New Route"}
                    id={"routes"}
                    saveAction={this.addingRouteAction}/>


                  </div>
                </div>



            </section>
        );
    }
});

module.exports = MarketAreaNew;
