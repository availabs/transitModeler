/*globals require,console,module,d3,$*/
'use strict'
var React = require('react'),
    idgen = require('./randomId'),
    TimeSlider = require('./TimeSlider.react');

var Sliders = React.createClass({
  getDefaultProps : function(){
    return {
      margin:{bottom:60},
      buttons:true,
    };
  },
  getInitialState : function(){
    return {
        range : [],
        focusModels:[],
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

  _focus : function(id){
    var ix={i:-1},models;
    if(this._isFocusedModel(id,ix)){
      models = this.state.focusModels;
      models.splice(ix.i,1);
      this.setState({focusModels:models});
    }
    else{
      models = this.state.focusModels;
      models.push(id);
      this.setState({focusModels:models});
    }
  },
  _focusString : function(id){
    if(!this._isFocusedModel(id) )
      return 'Focus';
    else
      return 'Forget';
  },
  _isFocusedModel : function(id,ix){
    var i =this.state.focusModels.indexOf(id);
    if(ix && ix.i)
      ix.i = i;
    return i >=0;
  },
  buildSliders : function(){
    var scope = this,max = 0;
    var displayData = this.props.datasets.map(function(d){
      var formatedData = scope.parseData(d.data);
      max = (max <= formatedData.max)?formatedData.max:max;
      formatedData.id = d.id;
      formatedData.options = d.options;
      return formatedData;
    });
    var sliders = displayData.map(function(d,i){
      var isLast = scope.props.datasets.length-1 === i;
      var height = scope.props.height - ((isLast)?0:scope.props.margin.bottom);
      var width  = (scope._isFocusedModel(d.id))?scope.props.maxWidth:scope.props.width;
          height = (scope._isFocusedModel(d.id))?scope.props.maxHeight:height;
          //Use the props to determine whether or not to include buttons
          //Default to adding them
      var actionbutton = !d.options.action? undefined:(
            <a className={'btn btn-small btn-info'} onClick={scope.props.selection.bind(null,d.id)}>{scope.props.actionText}</a>
      );
      var focusbutton = !d.options.focus ? undefined:(
          <a className='btn btn-small btn-default' onClick={scope._focus.bind(null,d.id)}>{scope._focusString(d.id)}</a>
      );
      var deletebutton = !d.options.delete ? undefined:(
          <a className={'btn btn-small btn-danger'} onClick={scope.props.delete.bind(null,d.id)}>Delete</a>
    );
      return (
        <div className='row' style={{'table-layout':'fixed','vertical-align':'middle'}}>
                <div className='col-lg-9'>
                  <TimeSlider
                    width={width}
                    height={height }
                    title={d.id}
                    data={d.data}
                    onSet={scope.slideAction}
                    margin={{bottom:(isLast)?scope.props.margin.bottom:0}}
                    id={idgen('id')}
                    putXAxis={isLast}
                    range={scope.state.range}
                    forceRender={true}
                    maxRange={max}
                    rangeTicks = {0}
                    />
                </div>
                <div className='btn-group'>
                  {actionbutton}
                  {focusbutton}
                  {deletebutton}
                </div>
            </div>);
    });
    return sliders;
  },
  render : function(){
    var sliders = this.buildSliders();
    console.log(sliders.length);
    if(!sliders.length)
      return <span></span>;
    return (
    <div id='Sliders' className='row'>
      <div className='col-lg-12'>
          {sliders}
      </div>
    </div>
    );
  },
});

module.exports = Sliders;
