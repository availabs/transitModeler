/*globals $,require,module,console,document,navigator,Blob*/
'use strict';
var React = require('react'),

    idGen = require('./randomId');
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
      lines += line + '%0A';
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

  downloadFile :function(type,output,filename,elem){
    var csvContent = type+output;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");

    if(link.download !== undefined){
      console.log('download');
      link.setAttribute("href", type+output);
      link.setAttribute("download", filename);
      link.setAttribute('target', '_blank');
      link.click();
    }
    else if(navigator.msSaveBlob) { // IE 10+
      var blob = new Blob([output], {
        "type": "text/csv;charset=utf8;"
      });
      navigator.msSaveBlob(blob, filename);
    }
    else{
      console.log('none');
      //var encodedUri = encodeURI(csvContent);
      //window.open(encodedUri);
       $(elem)
            .attr({
            'download': filename,
            'href': encodedUri,
            'target': '_blank'
        });
        $(elem).click();
    }

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
