/*globals require,module,console,d3,clearTimeout,setTimeout*/
'use strict'

var React = require('react');
var _ = require('lodash');
var tFormat = d3.time.format('%H:%M');
var gid = 0;
var lastRange = [];
var lastAction;
var TimeSlider = React.createClass({
  getDefaultProps : function(){
    return {
      minTime:'00:00',
      maxTime:'23:59',
      width:1000,
      height:300,
      data:_.range(0,24).map(function(d){
        return {x:d+':00',y:_.random(0,24)};
      }),
      range:[],
      opacity:0.7,
      rotateXLabels:90,
      margin:{},
      domainLabel:'Time Of Day',
      rangeLabel :'Total Transactions',
      yLabelOffset:10,
      onSet : function(range){console.log(range,lastRange);},
    };
  },
  getInitialState : function(){
    return {
      gid:0
    };
  },
  componentWillReceiveProps : function(nextProps){
    if(nextProps.data && nextProps.data !== this.props.data){
      this.setState({data:nextProps.data,gid:this.state.gid+1});
    }
  },
  getBarWidth : function(width){
    return width/24 - 1;//number of hours in a day -1 for
  },
  brushAction : function(range){
      var scope=this;
      if(!lastRange[0] || range[0].getTime() !== lastRange[0].getTime() ||
          range[1].getTime() !== lastRange[1].getTime())
      {
        clearTimeout(lastAction);
        lastAction = setTimeout(function(){
          scope.props.onSet(range);
        },100);
      }

  },
  timeOfDay : function(date){
    return date.toTimeString().substr(0,8);
  },
  compareTime : function(t1,t2){
    var sigs = [3600,60,1];
    var time1 = t1.split(':').map(function(d){return parseInt(d);});
    var time2 = t2.split(':').map(function(d){return parseInt(d);});
    var v1 = time1.map(function(d,i){return d * sigs[i];}).reduce(function(p,c){return p+c;});
    var v2 = time2.map(function(d,i){return d * sigs[i];}).reduce(function(p,c){return p+c;});
    return v1 - v2;
  },
  getData : function(){
    var table = {},groups = [];

    this.props.data.forEach(function(d){
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
  renderSelector : function(){
    var scope = this;
    var margin = {top:this.props.margin.top || 20,
       right:this.props.margin.right || 60,
       bottom:this.props.margin.bottom || 60,
       left:this.props.margin.left || 60},
       width = this.props.width - margin.left - margin.right,
       height = this.props.height - margin.top - margin.bottom;
    var totalDomain = [tFormat.parse(this.props.minTime),tFormat.parse(this.props.maxTime)];
    var x = d3.time.scale().range([0,width]);
    x.domain(totalDomain);
    var y = d3.scale.linear().range([height,0]);
    var dataObj = this.getData();
    y.domain([0,dataObj.max]);
    var xAxis = d3.svg.axis().scale(x)
                  .orient('bottom')
                  .tickSize(6,0)
                  .tickFormat(tFormat)
                  .ticks(24);
    var yAxis = d3.svg.axis().scale(y)
                  .orient('left')
                  .tickSize(6,0);

    var brushRange;
    if(scope.props.range.length===0)
      brushRange = totalDomain;
    else
      brushRange = scope.props.range;
    console.log('internal Range',scope.props.range);
    var brush = d3.svg.brush()
                  .x(x)
                  .extent(brushRange)
                  .on('brush',brushed);
    function brushed(){
      var extent0 = brush.extent(),extent1;
      if(d3.event.mode==='move'){
        var h0 = d3.time.hour.round(extent0[0]),
            h1 = d3.time.hour.offset(h0,Math.round((extent0[1]-extent0[0])/36e5));
        var c = scope.compareTime(scope.timeOfDay(h0),scope.timeOfDay(h1));
        console.log(c);
            if(c > 0){
              h1.setTime(h0.getTime());
              h1.setHours(23);
              h1.setMinutes(59);
            }
            extent1=[h0,h1];
      }
      else{
        extent1 = extent0.map(d3.time.hour.round);
        if(extent1[0].getHours() >= extent1[1].getHours()){
          extent1[0] = d3.time.minute.floor(extent0[0]);
          extent1[1] = d3.time.minute.ceil(extent0[1]);
        }
      }
      d3.select(this).call(brush.extent(extent1));
      scope.brushAction(extent1);

    }



    var slider = d3.select('#__TimeSlider__');
    if(slider.select('#timeSlider')[0].__data__ !== this.state.gid){
       slider.select('#timeSlider').remove();
    }
    var sliders = slider.selectAll('svg').data([++gid]);

    sliders.exit().remove();
    var svg = sliders.enter().append('svg')
                     .attr('id','timeSlider')
                     .attr('width',width+margin.left+margin.right)
                     .attr('height',height+margin.top+margin.bottom);


    var group = svg.append('g').attr('transform','translate('+margin.left+','+margin.top+')');
    svg.append('g')
        .attr('class','x axis')
        .attr('transform','translate('+margin.left+','+(height+margin.top)+')')
        .style({
          fill:null,
          stroke:'black',
          shapeRendering:'crispEdges'
        })
        .append('text')
        .attr('class','xlabel')
        .attr('y',margin.bottom)
        .attr('x',width/2)
        .style('text-anchor','middle')
        .text(this.props.domainLabel);

    svg.append('g')
       .attr('class','y axis')
       .attr('transform','translate('+margin.left+','+margin.top+')')
       .style({
         fill:null,
         stroke:'black',
         shapeRendering:'crispEdges',
       })
       .append('text')
       .attr('transform','rotate('+270+')')
       .attr('x',-width/2)
       .attr('y',-margin.left+this.props.yLabelOffset)
       .attr('dy','.35em')
       .style('text-anchor','start')
       .text(this.props.rangeLabel);
    var gBrush = group.append('g')
                    .attr('class','brush')
                    .style({
                      stroke:'black',
                      'fill-opacity':0.185,
                      'shape-rendering':'crispEdges'
                    })
                    .call(brush);
        gBrush.selectAll('rect')
              .attr('height',height);
    var bwidth = scope.getBarWidth(width);
    var bars = group.selectAll('.bar').data(dataObj.data);
    bars.exit().remove();
    bars.enter().append('rect')
        .attr('class','bar')
        .attr('x',function(d){return x(tFormat.parse(d.x));})
        .attr('width',bwidth+'px')
        .attr('y',function(d){return y(d.y1);})
        .attr('height',function(d){return y(d.y0) - y(d.y1);})
        .style('fill-opacity',scope.props.opacity)
        .style('fill',function(d){return d.color;});
    draw();

    function draw(){
      var yxs = svg.select('g.y.axis').call(yAxis);
      var xxs = svg.select('g.x.axis').call(xAxis);
      xxs.selectAll('text:not(.xlabel)') //select all the text elements
      .attr('y',0) //set its y att to 0
      .attr('x',9)
      .attr('dy','.35em')
      .attr('class','ticks')
      .attr('transform','rotate('+scope.props.rotateXLabels+')') //rotate the text labels 90 degrees to display vertically
      .style('text-anchor','start');
      updateBars();
    }
    function updateBars(){
      group.selectAll('.bar') //select all the bars
          .attr('x',function(d) {
            return x(tFormat.parse(d.x));
          }); //use as its x value its time filed
    }
  },

  render: function(){
    return( <div id='__TimeSlider__'>
    </div>);
  },
  componentDidMount : function(){
    this.renderSelector();
  },
  componentDidUpdate : function(oldProps,oldState){
    if((this.props.data && this.props.data.length !== oldProps.data.length) || this.props.forceRender){
        this.renderSelector();
    }
  }
});
module.exports = TimeSlider;
