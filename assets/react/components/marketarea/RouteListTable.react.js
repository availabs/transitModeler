/*globals console,require,module,$,d3*/
'use strict';

var React = require('react');
    // -- Store

    // -- Utils




var RouteListTable= React.createClass({


    getDefaultProps:function(){
        return{
          marketArea : {routes:[]},
        };
    },
    colorClick : function(id){
      console.log(id);
      var scope = this;
      var style = $('.route_color_'+id)[0].style;
      $('.route_color_'+id).colorpicker({
        color : style.backgroundColor
      }).on('changeColor',function(ev){
        d3.select('.route_color_'+id).style('background-color',ev.color.toHex());
        scope.props.colorChange(id,ev.color.toHex());
        //scope.props.marketarea.routecolor[id]= ev.color.toHex();
      });

    },
    render:function(){
      var scope = this,
          routes = this.props.marketarea ? this.props.marketarea.routes : [],
          colors = scope.props.marketarea.routecolors,
          rows = routes.map(function(route,i){
            var color = (colors[route])?colors[route]:'#000';
            var divStyle = {
                "width":'10px',
                "backgroundColor" : color,
            };
            var colorClass='route_color_'+route;
            return (
              <tr key={i}>
                <td style={divStyle} onClick={scope.colorClick.bind(null,route)} className={colorClass}></td>
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
