'use strict';
var React = require('react'),
    Link = require('react-router').Link,
    // -- Components 
    
    // -- Stores
    MarketAreaStore = require('../../stores/MarketAreaStore'),
    
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
        )
        
    }
    
})

var MarketAreaTable = React.createClass({
    
    
    getInitialState: function(){
       return {
            marketareas: MarketAreaStore.getAll(),
            selectedMarketarea:null
        }
    },

    componentDidMount: function() {
        MarketAreaStore.addChangeListener(this._onChange);
        
    },

    componentWillUnmount: function() {
        MarketAreaStore.removeChangeListener(this._onChange);
    },

    _onChange:function(){
        this.setState({marketareas: MarketAreaStore.getAll()});
    },
    _selectMA:function(id){
        this.setState({selectedMarketarea:id})
    },

    render: function(){
        var scope = this;
        
        var rows = Object.keys(this.state.marketareas).map(function(key){
            var marketarea = scope.state.marketareas[key];
            return (
                <MarketAreaRow key={marketarea.id} marketarea={marketarea}  select={scope._selectMA}/>
            )
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
            </div>
        )
    },

    deleteMarketArea:function(){
        UserActionsCreator.deleteMarketArea(this.state.selectedMarketarea);
        this.setState({selectedMarketarea:null})
    },
    
    deleteModal:function(){
        var name = this.state.selectedMarketarea ? this.state.marketareas[this.state.selectedMarketarea].name : '';
        var text = <h4>Are you sure you want to delete {name}?</h4>;
        var deleteButton = <button type="button" className="btn btn-info" onClick={this.deleteMarketArea} data-dismiss="modal">Delete</button>
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
        )
    },
});

module.exports = MarketAreaTable;