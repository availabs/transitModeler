var React = require('react'),
    Dropzone = require('react-dropzone');
    
    //-- Components
  
var GtfsDisplay = React.createClass({

    onDrop: function (files) {
      console.log('Received files: ', files);
    },

    renderCurrentData: function(){
        var scope = this;
        //console.log(this.props.datasources.gtfs);
        var rows = Object.keys(this.props.datasources.gtfs).map(function(key){

            var dataset= scope.props.datasources.gtfs[key];
            //console.log(key,dataset);
            return (
                <tr>
                    <td>{dataset.stateFips}</td>
                    <td>{dataset.tableName}</td>
                    <td>
                        <button className="btn btn-danger btn-sm delete" data-toggle="modal" data-target="#deleteModal" data-backdrop="false">
                            <i className="fa fa-trash"></i>
                            <span>Delete</span>
                        </button>
                    </td>
                </tr>
            )
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
                            <td>State Fips</td>
                            <td>TableName</td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                    </table>
                </div>
            </section>
        )
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
                </div>
            </section>
        )
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
      }
});

module.exports = GtfsDisplay;