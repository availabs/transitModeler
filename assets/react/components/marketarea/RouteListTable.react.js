/*globals console,require,module*/
'use strict';

var React = require('react');
    // -- Store

    // -- Utils




var RouteListTable= React.createClass({


    getDefaultProps:function(){
        return{
          marketArea : {routes:[]}
        };
    },

    render:function(){
      var scope = this,
          routes = this.props.marketarea ? this.props.marketarea.routes : [],
          rows = routes.map(function(route,i){
            var colors = scope.props.marketarea.routecolors;
            var color = (colors[route])?colors[route]:'#000';
            var divStyle = {
                "width":'10px',
                "backgroundColor" : color,
            };
            var colorClass='route_color_'+route;
            return (
              <tr key={i}>
                <td style={divStyle} className={colorClass}></td>
                <td>{route}</td>
                <td><i className='fa fa-minus' style={{cursor:'pointer'}} onClick={scope.props.removeRoute.bind(null,route)}/></td>
              </tr>
            );
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
