'use strict';

var React = require('react'),
    
    // -- Components
    Select2Component = require('../utils/Select2.react');

var RouteListTable= React.createClass({

    getDefaultProps:function(){
      return {
        marketarea:{routes:[]},
        routeList:[]
      }    
    },

    render:function(){
      
      //if(this.state.marketarea.routes)
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
                  val={[]} />

                <div className="input-group-btn">
                 <button type="button" className="btn btn-warning"><i className="fa fa-plus"></i></button>
                </div>
            </div>     
        </div>
      );
    }
});

module.exports = RouteListTable;  