/*globals $,require,module,console,document,navigator,Blob*/
'use strict';
var React = require('react'),

    idGen = require('./randomId'),
    downloadFile = require('./downloadHelper');
var extension = '.csv',
    type = 'data:text/csv;charset=utf-8,';
var CsvLink = React.createClass({
  getDefaultProps : function(){
    return {
      id :idGen('downloadLink'),
      classes:"btn btn-primary col-sm-4 pull-right",
      style : {marginTop:'-12px'},
      label : "Download CSV",
      target: "_blank",
      data:[],
      headers:[],
      filename:'data',
      keys:[],
      format:{}
    };
  },
  processData : function(data){
    var lines = '';
    var scope = this;
    this.props.data.forEach(function(rec){
      var line = scope.props.keys.map(function(k){
                    if(scope.props.format)
                    return rec[k].toString();
                  }).join(',');
      if(navigator.msSaveBlob){ //IF WE R IN IE :(
          lines += line + '\r\n';
      }else{
          lines += line + '%0A';
      }

    });
    if(this.props.headers){
      lines = this.props.headers.join(',') + '\n' + lines;
    }
    return lines;
  },
  getInitialState : function(){
    if(this.props.data){
      var lines = this.processData(this.props.data);
      return {data:lines};
    }else
      return {data:null};
  },
  componentWillReceiveProps : function(nextProps){
    if(this.props.data !== nextProps.data){
      this.setState({data:this.processData(nextProps.data)});
    }
  },
  clickAction : function(id){
    var fname = this.props.filename + extension;
    this.downloadFile(type,this.state.data,fname,id);
  },

	render: function() {
    return (  <a id={this.props.id}
         className={this.props.classes}
         style={this.props.style}
         onClick={this.clickAction.bind(null,this.props.id)}
         >{this.props.label}</a>);
	},



});

module.exports = CsvLink;
