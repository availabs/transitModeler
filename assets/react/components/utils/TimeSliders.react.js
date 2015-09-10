/*globals require,console,module,d3,$*/
'use strict'
var React = require('react'),
    idgen = require('./randomId'),
    TimeSlider = require('./TimeSlider.react');

var Sliders = React.createClass({
  getDefaultProps : function(){
    return {
      margin:{bottom:60},
    };
  },
  getInitialState : function(){
    return {
        range : [],
    };
  },
  slideAction : function(range){
    this.props.onChange(range);
    this.setState({range:range});
  },
  parseData : function(data){
    var table = {},groups = [];
    data.forEach(function(d){
      table[d.x] = table[d.x] || []; //create the list entry of the hash TableData
      table[d.x].push(d);
      if(groups.indexOf(d.group)  < 0){
        groups.push(d.group);
      }
    });
    groups.sort(); //sort the groups to assure lexicographic order
    var keys = Object.keys(table);
    var retval = {data:[],max:null,min:null};
    keys.forEach(function(key){
      var y0 = 0;
      table[key].sort(function(a,b){ //sort the entries of the bars to match to give order
        var g1 = a.group,g2 = b.group,
            ix1= groups.indexOf(g1), ix2 = groups.indexOf(g2);
        return ix1 - ix2;
      });
      table[key].forEach(function(d,i){ //assign each of them a range to span
          d.y0 = y0;
          d.y1 = y0 += d.y;
      });
      retval.data = retval.data.concat(table[key]);
      var tval = table[key].map(function(d){return d.y;}).reduce(function(p,c){return p+c;});
      if(!retval.max || retval.max < tval){
        retval.max = tval;
      }
    });
    return retval;
  },
  buildSliders : function(){
    var scope = this,max = 0;
    var displayData = this.props.datasets.map(function(d){
      var formatedData = scope.parseData(d.data);
      max = (max <= formatedData.max)?formatedData.max:max;
      formatedData.id = d.id;
      return formatedData;
    });
    var sliders = displayData.map(function(d,i){
      var isLast = scope.props.datasets.length-1 === i;

      return (<tr>
                <td>
                  <TimeSlider
                    width={scope.props.width}
                    height={scope.props.height - ((isLast)?0:scope.props.margin.bottom) }
                    title={d.id}
                    data={d.data}
                    onSet={scope.slideAction}
                    margin={{bottom:(isLast)?scope.props.margin.bottom:0}}
                    id={idgen('id')}
                    putXAxis={isLast}
                    range={scope.state.range}
                    forceRender={true}
                    maxRange={max}
                    rangeTicks = {1}
                    />
                </td>
                <td>
                  <a className={'btn btn-small btn-danger'} onClick={scope.props.delete.bind(null,d.id)}>Delete</a>
                </td>
            </tr>);
    });
    return sliders;
  },
  render : function(){
    var sliders = this.buildSliders();
    console.log(sliders.length);
    if(!sliders.length)
      return <span></span>;
    return (
    <div id='Sliders'>
      <table>
        <thead>
          <th></th>
        </thead>
        <tbody>
          {sliders}
        </tbody>
      </table>
    </div>
    );
  },
});

module.exports = Sliders;
