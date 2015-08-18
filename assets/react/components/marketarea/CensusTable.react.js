/*globals require,console,d3*/
'use strict';

var React = require('react'),


    // -- Actions
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator'),

    // -- Stores

    // -- Utils
    CSVDownload = require('../utils/CSVDownloader.react');



var CensusTable= React.createClass({



    getDefaultProps:function(){
        return{
          activeCategory:0
        };
    },

    _rowClick:function(d){
      console.log('set active category',d)
      MarketAreaActionsCreator.setActiveCensusVariable(d);
    },

    render:function(){
        var scope = this;
        var category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            total_data = this.props.censusData.getTotalData();

        var total = 0;

            category.forEach(function(val){ total+=total_data[val].value; });

        var data = category.map(function(cen_var,i){
            var divStyle = {
                "width":'10px',
                "background-color" : d3.scale.category20().range()[i]
            };
            return [  cen_var,divStyle,
                    cen_var.replace(/_/g," "),
                    (total_data[cen_var].value/total*100).toFixed(2),
                    total_data[cen_var].value.toLocaleString()
                  ];
        });
        var rows = data.map(function(d,i){
          return (
            <tr key={i} onClick={scope._rowClick.bind(null,d[0])} >
              <td style={d[1]}></td>
              <td value={d[0]}>{d[2]}</td>
              <td value={d[0]}>{d[3]}</td>
              <td value={d[0]}>{d[4]}</td>
            </tr>
          );
        });
        data.push([null,null,'Total','100%',total]);

        return(
            <div id="tableDiv">
                <CSVDownload
                  data={data}
                  keys={[2,3,4]}
                  filename={category_name}
                  />
                <h4>Category:{category_name}</h4>
                <table className="table table-striped table-hover" id="overview-table">
                    <tbody>
                      {rows}
                    <tr>
                        <td></td>
                        <td> Total</td>
                        <td>100%</td>
                        <td>{total}</td>
                    </tr>
                  </tbody>
                </table>

            </div>
        );
    }
});

module.exports = CensusTable;
