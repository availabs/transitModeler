'use strict';

var React = require('react'),
    
    // -- Components
    Select2Component = require('../utils/Select2.react');

var RouteSelector= React.createClass({

    getDefaultProps:function(){
      return {
        routeList:[],
        
      }    
    },

    getInitialState:function(){
      return {
        currentRoute:null
      }
    },

    updateCurrentRoute:function(e,selection){
      var scope = this;
      this.setState({currentRoute:selection});
    },

    addRoute:function(){
      console.log('add Route',this.state.currentRoute);
      this.props.addRoute(this.state.currentRoute.id);
      this.setState({currentRoute:null})
    },

    render:function(){
      
      //if(this.state.marketarea.routes)
      //console.log('routeSelector render',this.props.routeList)
      var selectData = this.props.routeList.map(function(route,id){
        if(route.route_short_name){
          return {"id":route.route_short_name,"text":route.route_short_name};
        }
      });
        
      return(
        <div className="form-group">

            <label className="control-label" htmlFor="routeSelector">Add Route:</label>
              
            <div className="input-group input-group">
                
                <Select2Component
                  id="routeSelector"
                  dataSet={selectData}
                  multiple={false}
                  styleWidth="100%"
                  onSelection={this.updateCurrentRoute}
                  val={this.state.currentRoute ? this.state.currentRoute.id : null } />

                <div className="input-group-btn">
                 <button onClick={this.addRoute} type="button" className="btn btn-warning"><i className="fa fa-plus"></i></button>
                </div>
            </div>     
        </div>
      );
    }
});

module.exports = RouteSelector;  