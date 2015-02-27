'use strict';

var React = require('react');    
    // -- Store
    
    // -- Utils
    



var RouteListTable= React.createClass({

  
    getDefaultProps:function(){
        return{
          marketArea : {routes:[]}
        }
    },
    
    render:function(){
      
      var rows = this.props.marketarea.routes.map(function(route,i){
        var divStyle = {
            "width":'10px',
            "background-color" : d3.scale.category20().range()[i] 
        }
        var colorClass='route_color_'+route;
        return (
          <tr key={i}>
            <td style={divStyle} className={colorClass}></td>
            <td>{route}</td>
            <td></td>
          </tr>
        )
      });

      return(
        <div id="tableDiv">
          <h4>Routes</h4>
          <table className="table table-hover" id="overview-table">
            <thead>
              <tr>

                <th></th>
                <th>Route Short Name</th>
                <th></th>
                
              </tr>
            </thead>
            <tbody>
              {rows}
              
            </tbody>
          </table>
        </div>  
      );
    }
});

module.exports = RouteListTable;  