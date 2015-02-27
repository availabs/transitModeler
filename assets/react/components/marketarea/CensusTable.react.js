'use strict';

var React = require('react'),
    ReactIntl = require('react-intl'),
   
    // -- Stores
    CensusStore = require('../../stores/CensusStore.js');
    
    // -- Utils
    

function getStatefromStore() {
    
    return {
        censusData: CensusStore.getCurrentDataSet()
    } 

}

var CensusTable= React.createClass({

    mixins: [ReactIntl],
  
    getInitialState: function(){
          return getStatefromStore()
    },

    getDefaultProps:function(){
        return{
          activeCategory:0
        }
    },

    componentDidMount: function() {
        CensusStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        CensusStore.removeChangeListener(this._onChange);
    },
    
    _onChange:function(){
        this.setState(getStatefromStore())
    },
    
    render:function(){
      
      var category_name = Object.keys(this.state.censusData.getCategories())[this.props.activeCategory],
          category = this.state.censusData.getCategories()[category_name],
          total_data = this.state.censusData.getTotalData();

      var total = 0
      category.forEach(function(val){ total+=total_data[val].value });
      
      var rows = category.map(function(cen_var,i){
        var divStyle = {
            "width":'10px',
            "background-color" : d3.scale.category20().range()[i] 
        }
        return (
          <tr key={i}>
            <td style={divStyle}></td>
            <td>{cen_var.replace(/_/g," ")}</td>
            <td>{total_data[cen_var].value/total*100}</td>
            <td>{total_data[cen_var].value}</td>
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