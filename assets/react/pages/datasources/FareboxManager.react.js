var React = require('react'),

    request = require('superagent'),

    FareZoneFilterStore = require('../../stores/FarezoneFilterStore'),

    FareZoneActionsCreator = require('../../actions/FarezoneActionsCreator'),

    Dropzone = require('react-dropzone');

    //-- Components

var GtfsDisplay = React.createClass({

    getInitialState : function(){
      return{
        filters:FareZoneFilterStore.getFarezoneFilters(),
        messages:[]
      };
    },

    uploadStarted:function(err,res){

      console.log('uploadStarted',err,res.body)
       var newMessages = this.state.messages;
      if(res.body.error){

        newMessages.push('Error: '+res.body.error)
        this.setState({messages:newMessages})
      }else if(res.body.data){
        newMessages.push('Success: '+res.body.data.rowCount+' rows added.');
        this.setState({messages:newMessages})
      }

    },

    onDrop: function(files){
        var scope = this;
        if(files && files.length > 0){

            files.forEach( function (file){
                console.log('dropped file',file)
                var req = request.post('/farebox/upload')
                    .attach('file', file, file.name)
                    .end(scope.uploadStarted)
                    .on('progress', function(e) {
                        console.log('Percentage done: ', e.percent);
                    });
            });

        }
    },
    componentDidMount : function(){
      FareZoneFilterStore.addChangeListener(this._onChangeFarezone);
    },
    componentWillUnmount : function(){
      FareZoneFilterStore.removeChangeListener(this._onChangeFarezone);
    },
    _onChangeFarezone : function(){
      this.setState({filters:FareZoneFilterStore.getFarezoneFilters()});
    },

    renderCurrentData: function(){
        var scope = this;
        //console.log(this.props.datasources.gtfs);


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

                    </tbody>
                    </table>
                </div>
            </section>
        );
    },

    renderDataController:function(){
        return (
             <section className="widget">
                <header>
                    <h4>
                        Add Farebox Data
                    </h4>

                </header>
                <div className="body no-margin">
                    <Dropzone onDrop={this.onDrop} size="100%">
                      <div style={{fontSize:'12px'}}>Drop Files here or Click to Upload.</div>
                    </Dropzone>
                </div>
                <div>
                {this.renderMessages()}
                </div>
            </section>
        );
    },
    deleteFilter : function(i){
      var filter = this.state.filters[i];
      FareZoneActionsCreator.deleteFilter(filter);
    },
    renderFarezoneFilters : function(data){
        var scope = this;
        var tableRows = data.map(function(d,i){
          return  (
            <tr >
              <td>{d.filtername}</td>
              <td><div className='col-md-3'
                style={{width:'150px',display:'inline','word-wrap':'break-word'}}
                >{d.filter.toString()}</div></td>
              <td>
                <div className='col-md-3'
                  style={{width:'150px',display:'inline','word-wrap':'break-word'}}
                  >{Object.keys(d.dates||{})}</div>
              </td>
              <td>
                <a className={'btn btn-danger'}
                  onClick={scope.deleteFilter.bind(null,i)}>
                  <i className={'fa fa-trash'}></i>
                  Delete
                </a>
              </td>

            </tr>
          );
        });
        return (
          <section className='widget'>
            <header>
              <h4>Farezone Filters</h4>
            </header>
            <div className='body no-margin'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    <td>Filter Name</td>
                    <td>Excluded Zones</td>
                    <td>Dates</td>
                  </tr>
                </thead>
                <tbody>
                  {tableRows}
                </tbody>
              </table>
            </div>
          </section>
        );
    },

    renderMessages:function(){
      console.log('render messages',this.state.messages)
      return this.state.messages.map(function(m,i){
        return (
          <div key={i} style={{color:'#a00',padding:10}}>
            {m}
          </div>
        )
      })
    },

    render: function() {

        // <div className='col-lg-12'>
        //   {this.renderFarezoneFilters(this.state.filters)}
        // </div>
        // <div className="col-lg-6">
        //     {this.renderCurrentData()}
        //
        // </div>
        return (
            <div className="content container">
                <h2 className="page-title">Farebox<small> Data Upload</small></h2>
                <div className="row">
                    <div className="col-lg-6">
                        {this.renderDataController()}


                    </div>


                </div>
            </div>
        );
      }
});

module.exports = GtfsDisplay;
