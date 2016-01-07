var React = require('react'),
    // -- Utils
    Fips2State = require('../../utils/data/fips2state'),
    sailsWebApi = require('../../utils/sailsWebApi'),

    //-- Components
    Select2Component = require('../../components/utils/Select2.react');

var ACSDisplay = React.createClass({

    getInitialState:function(){
        return {
            newData:{
                state:null,
                sumLevel:null,
                startYear:null,
                dataSource:'5'
            },
            message:null
        }
    },

    clearMessage:function(){
        this.setState({message:null})
    },

    renderMessage:function(){
        if(this.state.message){
            var messageClass = 'alert alert-danger';
            if(this.state.message === 'Loading Data...'){

                messageClass = 'alert alert-success';

            }
            return (
                <div className={messageClass}>
                    <button type="button" className="close" data-dismiss="alert" aria-hidden="true" onClick={this.clearMessage}>×</button>
                    <strong><i class="fa fa-bell-o"></i></strong>{this.state.message}
                </div>
            )
        }
        return (<span />)
    },

    renderCurrentData: function(){
        var scope = this;
        var rows = Object.keys(this.props.datasources.acs).map(function(key){
            var dataset= scope.props.datasources.acs[key];
            return (
                <tr>
                    <td>{dataset.stateFips}</td>
                    <td>{dataset.settings.year}</td>
                    <td>ACS 5 Year</td>
                    <td>{dataset.settings.level}</td>
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
                            <td>Year</td>
                            <td>Source</td>
                            <td>Sum Level</td>
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
    updateState:function(e,selections){

        var newState = this.state;
        newState.newData.state = selections.id;
        this.setState(newState);

    },

    updateSumLevel:function(e,selections){

        console.log('updateSumLevel',selections.id)
        var newState = this.state;
        newState.newData.sumLevel = selections.id;
        this.setState(newState);

    },

    updateYear:function(e,selections){

        console.log('updateYear',selections.id)

        var newState = this.state;
        newState.newData.startYear = selections.id;
        this.setState(newState);

    },

    renderDataController:function(){
        var data = Object.keys(Fips2State).map(function(key){
            console.log({"id":key,"text":Fips2State[key]});
            return {"id":key,"text":Fips2State[key]};
        }),
        sumlevelData = [{id:'tracts',text:'Tracts'},{id:'blockgroups',text:'Block Groups'}],
        yearsData = [{id:'2010',text:'2010'},{id:'2011',text:'2011'},{id:'2012',text:'2012'},{id:'2013',text:'2013'}];
        data.sort(function(a,b){return parseInt(a.id)-parseInt(b.id);});
        //console.log('acs data controller selec2',data,Fips2State);

        return (
             <section className="widget">
                <header>
                    <h4>
                        Add ACS Data
                    </h4>

                </header>
                <div className="body no-margin">
                     <fieldset>

                        <div className="form-group" style={{marginBottom:'10px',overflow:'auto'}}>
                            <label className="col-sm-3 control-label" htmlFor="grouped-select">State</label>
                            <div className="col-sm-9">
                                 <Select2Component
                                  id="the-hidden-input-id"
                                  dataSet={data}
                                  onSelection={this.updateState}
                                  multiple={false}
                                  styleWidth="100%"
                                  val={this.state.newData.state} />
                            </div>

                        </div>

                        <div className="form-group" style={{marginBottom:'10px',overflow:'auto'}}>
                            <label className="col-sm-3 control-label" htmlFor="grouped-select">Sum Level</label>
                                <div className="col-sm-9">
                                     <Select2Component
                                      id="the-hidden-input-id2"
                                      dataSet={sumlevelData}
                                      onSelection={this.updateSumLevel}
                                      multiple={false}
                                      styleWidth="100%"
                                      val={this.state.newData.sumLevel} />
                                </div>
                        </div>

                        <div className="form-group" style={{marginBottom:'10px',overflow:'auto'}}>
                            <label className="col-sm-3 control-label" htmlFor="grouped-select">Base Year</label>
                                <div className="col-sm-9">
                                     <Select2Component
                                      id="the-hidden-input-id3"
                                      dataSet={yearsData}
                                      onSelection={this.updateYear}
                                      multiple={false}
                                      styleWidth="100%"
                                      val={this.state.newData.startYear} />
                                </div>
                        </div>
                        {this.renderMessage()}
                         <button className="btn btn-lg btn-primary pull-right" onClick={this.uploadData}>
                            Load Data
                        </button>
                    </fieldset>

                </div>
            </section>
        )
    },

    uploadData : function(){

        console.log('upload data',this.state.newData,JSON.stringify(this.state.newData));

        if(!this.state.newData.state){
            this.setState({message:'Must choose a state'})
            return;
        }else if(!this.state.newData.sumLevel){
            this.setState({message:'Must choose a sum level'})
            return;
        }else if(!this.state.newData.startYear){
            this.setState({message:'Must choose a year'})
            return;
        }
        this.setState({message:'Loading Data...'});
        sailsWebApi.loadAcs(this.state.newData);
    },

    render: function() {

        return (
        	<div className="content container">
            	<h2 className="page-title">American Community Survey <small></small></h2>
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

module.exports = ACSDisplay;
