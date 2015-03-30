'use strict';

var React = require('react'),
    ReactIntl = require('react-intl'),
   
    // -- Actions 
    MarketAreaActionsCreator = require('../../actions/MarketAreaActionsCreator');

    // -- Stores
    
    // -- Utils
    



var CensusTable= React.createClass({

    mixins: [ReactIntl],
  

    getDefaultProps:function(){
        return{
          activeCategory:0
        }
    },

    _rowClick:function(e){
      MarketAreaActionsCreator.setActiveCensusVariable(e.target.getAttribute('value'));
    },

    render:function(){
        var scope = this;
        var category_name = Object.keys(this.props.censusData.getCategories())[this.props.activeCategory],
            category = this.props.censusData.getCategories()[category_name],
            total_data = this.props.censusData.getTotalData();

        var total = 0
            
            category.forEach(function(val){ total+=total_data[val].value });
          
        var rows = category.map(function(cen_var,i){
            var divStyle = {
                "width":'10px',
                "background-color" : d3.scale.category20().range()[i] 
            }
            return (
              <tr key={i} onClick={scope._rowClick} value={cen_var}>
                <td style={divStyle}></td>
                <td value={cen_var}>{cen_var.replace(/_/g," ")}</td>
                <td value={cen_var}>{total_data[cen_var].value/total*100}</td>
                <td value={cen_var}>{total_data[cen_var].value}</td>
              </tr>
            )
        });

        return(
            <div id="tableDiv">
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