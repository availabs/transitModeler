var React = require('react'),
    myRequest = require('superagent'),
    sailsWebApi = require('../../utils/sailsWebApi'),
    GtfsActionsCreator = require('../../actions/GtfsActionsCreator'),
    Dropzone = require('react-dropzone');

    //-- Components
var action = {true:'unlock',false:'lock'};
var GtfsDisplay = React.createClass({
    getInitialState : function(){
      return{
        currentData: null,
        files : [],
      };
    },
    onDrop: function (files) {
      files.map(function(d){d.file=d.name; return d;});
      console.log('Received files: ', files);
      this.setState({files:files});
    },
    renderButton : function(dataset){
      if(dataset.settings.uploaded){
        return <span></span>;
      }
      var onAction = this.toggleAction(dataset);
        return (<button className="btn btn-info btn-sm" onClick={onAction} >
                <span>{action[dataset.settings.readOnly || false]}</span>
              </button>);
    },
    toggleAction : function(dataset){
      var scope = this;

      return function(){
        dataset.settings.readOnly = (!dataset.settings.readOnly) ? true : !dataset.settings.readOnly;
        dataset.settings = [dataset.settings];

        sailsWebApi.update('datasource',dataset,function(){
          GtfsActionsCreator.refreshDatasources();
        });
      };
    },
    setDataset   : function(dataset){
      this.setState({currentData:dataset});
    },
    renderCurrentData: function(){
        var scope = this;
        //console.log(this.props.datasources.gtfs);
        var rows = Object.keys(this.props.datasources.gtfs).map(function(key){

            var dataset= scope.props.datasources.gtfs[key];
            console.log(dataset);
            //console.log(key,dataset);
            return (
                <tr>
                    <td>{dataset.settings.agency}</td>
                    <td>{(new Date(dataset.settings.started)).toLocaleDateString()}</td>
                    <td>{dataset.tableName}</td>
                    <td>
                      {scope.renderButton(dataset) }
                    </td>
                    <td>
                        <button onClick={scope.setDataset.bind(null,dataset)} className="btn btn-danger btn-sm delete" disabled={dataset.settings.readOnly} data-toggle="modal" data-target="#deleteModal" data-backdrop="false">
                            <i className="fa fa-trash"></i>
                            <span>Delete</span>
                        </button>
                    </td>
                </tr>
            );
        });

        return (
            <section className="widget">
                <header>
                    <h4>
                        Current Data
                    </h4>

                </header>
                <div className="body no-margin">
                    <table className="table table-striped">
                    <thead>
                        <tr>
                            <td>Agency</td>
                            <td>Origin Date</td>
                            <td>TableName</td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                    </table>
                </div>
                {this.deleteModal()}
            </section>
        );
    },
    deleteGtfs : function(){
      if(this.state.currentData && this.state.currentData.id){
          sailsWebApi.deleteGtfs(this.state.currentData);
      }
    },
    resetFiles : function(){
      this.setState({files:[]});
    },
    upload : function(){
      var scope = this;
      var req = myRequest.post('/gtfs/upload');
      this.state.files.forEach(function(file){
        req.attach('files',file);
      });
      req.end(function(err,res){
        console.log('RESPONSE',err,res);
        if(!err){
          scope.setState({files:[]});
        }
      });
    },
    renderDataController:function(){
        return (
             <section className="widget">
                <header>
                    <h4>
                        Add GTFS Data
                    </h4>

                </header>
                <div className="body no-margin">
                    <Dropzone onDrop={this.onDrop} size="100%">
                      <div style={{fontSize:'12px'}}>Drop Files here or Click to Upload.</div>
                    </Dropzone>
                    {(this.state.files.length !==0)?(<div><button onClick={this.upload} type='submit' className={'btn btn-sm btn-info'}> upload</button>
                  <button className={'btn btn-sm btn-danger'} onClick={this.resetFiles}>cancel</button></div>):<span></span>}
                    {this.state.files.map(function(d){return d.name;}).join(',')}
                </div>
            </section>
        );
    },
    render: function() {

        return (
            <div className="content container">
                <h2 className="page-title">GTFS<small>General Transit Feed Specification</small></h2>
                <div className="row">
                    <div className="col-lg-6">
                        {this.renderDataController()}

                    </div>
                    <div className="col-lg-6">
                        {this.renderCurrentData()}

                    </div>

                </div>
            </div>
        );
      },

    deleteModal:function(){
        var name = this.state.currentData ? this.state.currentData.tableName : '';
        var text = <h4>Are you sure you want to delete {name}?</h4>;
        var deleteButton = <button type="button" className="btn btn-danger" onClick={this.deleteGtfs} data-dismiss="modal">Delete</button>;
      if(this.state.currentData && this.state.currentData.settings.readOnly){
            text = <h4> You cannot delete {name}. </h4>;
            deleteButton = <span />;
        }
        return (
            <div id="deleteModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title" id="myModalLabel2">Delete GTFS</h4>
                        </div>
                        <div className="modal-body">
                             {text}
                        </div>

                        <div className="modal-footer">
                           <br />
                            <button type="button" className="btn btn-info" data-dismiss="modal">Cancel</button>
                            {deleteButton}
                        </div>

                    </div>
                </div>
            </div>
        );
    },
});

module.exports = GtfsDisplay;
