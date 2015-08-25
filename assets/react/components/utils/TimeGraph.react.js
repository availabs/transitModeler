/*globals require,module,console,d3*/
'use strict'

var React = require('react');


var gid = 0;
var TimeGraph = React.createClass({
  getDefaultProps : function(){
    return {
      width:300,
      height:400,
      xFormat:'%H:%M',
      barWidth:2,
      opacity:0.7,
      rotateXLabels:0,
      yLabelOffset:10,
      rangeLabel:'Count',
      domainLabel:'Time',
      data : [],
      margin : {},
    };
  },
  getInitialState : function(){
    return {
      data: this.props.data,
      gid : 0
    };
  },
  componentWillReceiveProps : function(nextProps){
    if(nextProps.data && nextProps.data !== this.state.data){
      this.setState({data:nextProps.data,gid:this.state.gid+1});
    }
  },

  renderGraph : function(){
    var scope = this;
    var margin = {top:this.props.margin.top || 20,
       right:this.props.margin.right || 60,
       bottom:this.props.margin.bottom || 60,
       left:this.props.margin.left || 60},
        width = this.props.width - margin.left - margin.right,
        height = this.props.height - margin.top - margin.bottom;

      var min = '00:00',max='23:59';
      var domainLock = true;
      var parseDate = d3.time.format('%H:%M');
      var formatDate = d3.time.format(this.props.xFormat);
      var x = d3.time.scale()  //create x,y scales for display
                .range([0,width]);
      var y = d3.scale.linear()
                .range([height,0]);
      var xAxis = d3.svg.axis() //create x,y axis objects for the graph
                    .scale(x)
                    .orient('bottom')
                    .tickSize(6,0)
                    .ticks(10)
                    .tickFormat(formatDate)
                    .tickPadding(6);
      var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient('left')
                    // .tickSize(6)
                    .tickPadding(6);
      var zoom = d3.behavior.zoom() //define zoom behavior
                   .scale(1)
                   .scaleExtent([1,100])
                   .on('zoom',draw);
      var timegraph = d3.select('#timeGraph');
          //timegraph.select('#parentTimeGraph').data([this.state.gid]).exit().remove();
      if(timegraph.select('#parentTimeGraph')[0].__data__ !== this.state.gid){
        timegraph.select('#parentTimeGraph').remove();
      }
      if(this.state.data.length === 0){
        return (<h3>No Data Available</h3>);
      }
      var svg = timegraph.selectAll('svg').data([this.state.gid]).enter()
                  .append('svg') //define the surrounding svg
                  .attr('id','parentTimeGraph')
                  .attr('width',width + margin.left + margin.right)
                  .attr('height',height + margin.top + margin.bottom)
                  .call(zoom)
                  .append('g')
                  .attr('transform','translate('+margin.left+','+margin.top+')');
      svg.selectAll('svg').data([this.state.gid]).exit().remove();
      var innerSvg = svg.selectAll('svg').data([this.state.gid]).enter()
                        .append('svg')
                        .attr('width',width)
                        .attr('height',height)
                        .append('g');
          innerSvg.append('g')
                  .attr('class','xlines')
                  .selectAll('line')
                  .data(d3.range(0,width,10)).enter().append('line')
                  .attr('x1',function(d){return d;})
                  .attr('y1',0)
                  .attr('x2',function(d){return d;})
                  .attr('y2',height);

          innerSvg.append('g')
                  .attr('class','ylines')
                  .selectAll('line')
                  .data(d3.range(0,height,10)).enter().append('line')
                  .attr('x1',0)
                  .attr('y1',function(d){return d;})
                  .attr('x2',width)
                  .attr('y2',function(d){return d;})
                  .style({
                    stroke:'#999',
                    opacity:0.7,
                  });
          console.log(this.props.rangeLabel);
          svg.append('g') //add y axis
             .attr('class','y axis')
             .attr('transform','translate(0,0)')
             .style({
               fill:null,
               stroke:'black',
               shapeRendering:'crispEdges',
             })
             .append('text')
             .attr('transform','rotate('+270+')')
             .attr('x',-height/2)
             .attr('y',-margin.left+this.props.yLabelOffset)
             .attr('dy','.35em')
             .style('text-anchor','start')
             .text(this.props.rangeLabel);

          svg.append('g') //add x axis
             .attr('class','x axis')
             .attr('transform','translate(0,'+height+')')
             .style({
               fill:null,
               stroke:'black',
               shapeRendering:'crispEdges',
             })
             .append('text')
             .attr('class','xlabel')
             .attr('y',margin.bottom)
             .attr('x',width/2)
             .style('text-anchor','middle')
             .text(this.props.domainLabel);

    var data = this.state.data;
        x.domain([formatDate.parse(min),formatDate.parse(max)]);
        console.log(d3.max(data,function(d){return d.y;}));
        y.domain([0,d3.max(data,function(d){return d.y;})]);
        console.log(y.domain());
        zoom.x(x);
    var bars = innerSvg.selectAll('.bar') //select all the bars
            .data(data);       //join with the data points
            bars.exit().remove();
            bars.enter().append('rect') //add a rectangle for each data entry not already logged
            .attr('class','bar')
            .attr('x',function(d) {return x(parseDate.parse(d.x));}) //use as its x value its time filed
            .attr('width',this.props.barWidth)
            .attr('y',function(d){return y(d.y);}) //use as its y value its frequency
            .attr('height',function(d){return height - y(d.y);}) //return as its height frequency - height to allow it starting on the bottom
            .style('fill-opacity',scope.props.opacity)
            .style('fill',function(d){return d.color;}); //set the color
        draw();

    function updateBars(){
      innerSvg.selectAll('.bar') //select all the bars
          .attr('x',function(d) {
            return x(parseDate.parse(d.x));
          }); //use as its x value its time filed
    }
    function draw(){
      if(d3.event && d3.event.translate && domainLock){
        var t = d3.event.translate,flag = false,
            v1 = formatDate.parse(min),v2 = formatDate.parse(max),
            extra = [x(v1),width - x(v2)],
            d = x.domain();
            d = [Math.max(d[0],v1),Math.min(d[1],v2)];
            x.domain(d);
            var temp;
            if(extra[0] > 0)
              temp = [t[0] - extra[0],0];
            else if(extra[1] > 0){
              temp = [t[0] + extra[1],0];
            }
            else {
              temp = t;
            }
          zoom.translate(temp);
      }
      var xxs = svg.select('g.x.axis').call(xAxis);
      if(scope.props.rotateXLabels)
          xxs.selectAll('text:not(.xlabel)') //select all the text elements
          .attr('y',0) //set its y att to 0
          .attr('x',9)
          .attr('dy','.35em')
          .attr('class','ticks')
          .attr('transform','rotate('+scope.props.rotateXLabels+')') //rotate the text labels 90 degrees to display vertically
          .style('text-anchor','start');
      var yxs = svg.select('g.y.axis').call(yAxis);

      updateBars();
    }

  },
  buildKey : function(){
    var scope = this;
    var keymap = (this.props.keyMap) ? this.props.keyMap:{};
    var rows = Object.keys(keymap).map(function(d){
      return (
        <div style={{padding:'1px'}} className={'col-md-3'} ><div className={'col-md-1'} style={{backgroundColor:keymap[d],height:'20px',width:'20px'}}></div>{d}</div>
      );
    });
    return (
      <div className='row'>{rows}</div>
    );
  },
  render: function(){
    var scope = this;
    console.log('keys',this.props.keyMap);
    return (
      <div>
      <div id='timeGraph'>{scope.renderGraph()}</div>
      <h4>Trip Key</h4>
      <div>{scope.buildKey()}</div>
      </div>
    );
  },
});
module.exports = TimeGraph;
