/*globals require,console,module,window*/
'use strict';
var React = require('react'),
    Link = require('react-router').Link,
    // -- Components
    Select2React = require('../../components/utils/Select2.react'),
    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore'),
    UserStore       = require('../../stores/UserStore'),
    // -- Action Creators
    UserActionsCreator = require('../../actions/UserActionsCreator');

var MarketAreaRow = React.createClass({

     _onClick: function(id){
        //console.log('clicked');
    },



    render: function(){

        return (

            <tr>
                <td><Link to="MarketAreaIndex" params={{marketareaID:this.props.marketarea.id}}>{this.props.marketarea.name}</Link></td>
                <td>{this.props.marketarea.routes ? this.props.marketarea.routes.length : 0}</td>
                <td>{this.props.marketarea.zones ? this.props.marketarea.zones.length : 0}</td>
                <td>
                  <a data-toggle="modal" onClick={this.props.select.bind(null,this.props.marketarea.id)} data-target="#shareModal" data-backdrop="false" className="btn btn-sm btn-primary">
                    Share
                  </a>
                </td>
                <td>
                    <Link to="MarketAreaEdit" params={{marketareaID:this.props.marketarea.id}} className="btn btn-sm btn-warning">
                        Edit
                    </Link>
                </td>
                <td>
                    <a data-toggle="modal" onClick={this.props.select.bind(null,this.props.marketarea.id)}data-target="#deleteModal" data-backdrop="false" className="btn btn-sm btn-danger">
                        Delete
                    </a>
                </td>
            </tr>
        );

    }

});

var MarketAreaTable = React.createClass({


    getInitialState: function(){
       return {
            marketareas: MarketAreaStore.getAll(),
            users      : UserStore.getCurrentGroupUsers(),
            selectedMarketarea:null,
            userSelection:[],
            shareState : 'ready',
        };
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onChange);
        UserStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        console.log('MAS',MarketAreaStore.getAll());
        this.setState({marketareas: MarketAreaStore.getAll(),
                       users      : UserStore.getCurrentGroupUsers()});
    },
    _selectMA:function(id){
        this.setState({selectedMarketarea:id});
    },

    render: function(){
        var scope = this;

        var rows = Object.keys(this.state.marketareas).map(function(key){
            var marketarea = scope.state.marketareas[key];
            return (
                <MarketAreaRow key={marketarea.id} marketarea={marketarea}  select={scope._selectMA}/>
            );
        });
        ///var deleteModal = this.deleteModal();
        return (
            <div>
                <table className="table table-hover">
                    <thead><tr>
                        <th>Name</th>
                        <th># of Routes</th>
                        <th># of Zones</th>
                        <th></th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                {this.deleteModal()}
                {this.shareModal()}
            </div>
        );
    },
    onShareResponse : function(){
      this.setState({shareState:'success'});
    },
    shareWithUser : function(){
      var scope = this;
      var user = UserStore.getSessionUser();
      console.log('Sharing with ' + this.state.userSelection[0], this.state.selectedMarketarea);
      UserActionsCreator.shareMarketArea(this.state.selectedMarketarea,this.state.userSelection[0],this.onShareResponse);
      UserActionsCreator.userAction({
        actiondesc:user.name +' shared '+ this.state.marketareas[this.state.selectedMarketarea].name + ' with '+
        this.state.users.filter(function(d){return d.id === scope.state.userSelection[0];})[0].name,
        actiontitle:'Market Area Share',
        stateFips:'',
        maid:-1,
        userid:user.id,
      });
      this.setState({shareState:'waiting'});
    },
    updateSelection : function(e){
      console.log(e.target.value);
      this.setState({shareState:'ready',userSelection:[parseInt(e.target.value)]});
    },
    cancelShare : function(){
      this.setState({userSelection:[],shareState:'ready'});
    },
    shareModal : function(){
      var user = UserStore.getSessionUser();
      var scope = this;
      var userData = scope.state.users.filter(function(d){return d.id !== user.id;}).map(function(d){
        return {id:d.id, text:d.name};
      });
      var button =(
        <button className='   btn btn-primary' onClick={scope.shareWithUser.bind(null,3)}>
          <div className='col-md-1'><span className='glyphicon glyphicon-share' aria-hidden='true'></span></div>
          </button>
      );

      if(this.state.shareState === 'waiting'){
        button = (
          <button className='   btn btn-primary'>
            <div className='col-md-1'><img src={"/img/loading.gif"} style={{width:60,height:60}} /></div>
            </button>
        );
      }else if(this.state.shareState === 'success'){
          button = (<button className='   btn btn-success'>
          <div className='col-md-1'><span className='glyphicon glyphicon-ok' ></span> </div>
          </button>);
      }
      var body =  (<tr>
                  <td>
                    <Select2React
                      id={'UserShareSelector'}
                      dataSet={userData}
                      multiple={false}
                      styleWidth='100%'
                      onSelection={scope.updateSelection}
                      placeholder={'Select a User'}
                      val={scope.state.userSelection}
                      />
                  </td>
                <td>
                {button}
                </td>
        </tr>);


      return (
        <div id="shareModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel3" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type='button' onClick={scope.cancelShare} className='close' data-dismiss="modal" aria-hidden="true">x</button>
                <h4 className="modal-title" id='myModalLabel4'>Share Market Area</h4>
              </div>
              <div className="modal-body">
                <div id='stats' class='tab-pane cleafix active'>
                  <h5 className='tab-header'></h5>
                  <div className='row' style={{height:'100px',overflow:'auto'}}>
                    <div className='col-lg-3'></div>
                    <div className='col-lg-6'>
                  <table className='table table-striped'>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    {body}
                  </table>
                </div>
                  <div className='col-lg-3'></div>
                  </div>

                </div>
              </div>
              <div className="modal-footer">
                <br />
                <button type="button" onClick={scope.cancelShare} className="btn btn-danger" data-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      );
    },
    deleteMarketArea:function(){
        UserActionsCreator.deleteMarketArea(this.state.selectedMarketarea);
        this.setState({selectedMarketarea:null});
    },

    deleteModal:function(){
        var name = this.state.selectedMarketarea ? this.state.marketareas[this.state.selectedMarketarea].name : '';
        var text = <h4>Are you sure you want to delete {name}?</h4>;
        var deleteButton = <button type="button" className="btn btn-info" onClick={this.deleteMarketArea} data-dismiss="modal">Delete</button>;
        if(this.state.selectedMarketarea && this.state.selectedMarketarea < 4){
            text = <h4> You cannot delete {name}. </h4>;
            deleteButton = <span />;
        }
        return (
            <div id="deleteModal" className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title" id="myModalLabel2">Delete Market Area</h4>
                        </div>
                        <div className="modal-body">
                             {text}
                        </div>

                        <div className="modal-footer">
                           <br />
                            <button type="button" className="btn btn-danger" data-dismiss="modal">Cancel</button>
                            {deleteButton}
                        </div>

                    </div>
                </div>
            </div>
        );
    },
});

module.exports = MarketAreaTable;
