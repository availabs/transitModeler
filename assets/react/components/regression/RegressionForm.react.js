'use strict';

var React = require('react'),
    
    
    // -- Action Creators
    SailsWebAip = require('../../utils/sailsWebApi'),
    
    // -- Components
    Select2Component = require('../utils/Select2.react'),
    

    // -- Stores
    RegressionStore = require('../../stores/RegressionStore'),
    CensusStore = require('../../stores/CensusStore'),
    MarketAreaStore = require('../../stores/MarketAreaStore');


function getStateFromStores(){
    return {
        regressions: RegressionStore.getAll(),
        editUser: RegressionStore.getEditUserId(),
    }
};

var RegressionForm = React.createClass({

    getInitialState: function() {

        return {
            regression:{name:'',censusVariables:[],constant:0},
            globalCensusVariables:CensusStore.getCurrentDataSet().getTotalData(),
            marketareas:MarketAreaStore.getAll()
        };
               
    },

    componentDidMount: function() {
        RegressionStore.addChangeListener(this._regressionChange);
        MarketAreaStore.addChangeListener(this._marketAreaChange);
        
    },

    componentWillUnmount: function() {
        RegressionStore.removeChangeListener(this._regressionChange);
        MarketAreaStore.removeChangeListener(this._marketAreaChange);
    },

    _marketAreaChange:function(){
        this.setState({marketareas:MarketAreaStore.getAll()})
    },
    _regressionChange: function(){
        //if this is an edit form, update the user on user events
        if(this.props.data.formType !== 'create'){
                        
            var regression = getStateFromStores().regressions[getStateFromStores().editUser];
            if(regression){
                this.setState({regression:regression});    
            }
        }
    },


    handleSubmit:function(e){
        var scope = this;
        e.preventDefault();
        
            setTimeout(function(){
                var errors = document.getElementsByClassName('parsley-errors-list filled');
                /*
                /50ms timout to let parsley parse
                /I don't love this solution
                /but it still seems better than forcing
                /jquery and parsley through commonjs
                */
                console.log(errors.length,errors[0],errors);
                
                
                if(errors.length === 0){
                    if(scope.props.data.formType == 'create'){
                        SailsWebAip.create('regression',scope.state.regression);
                        scope.setState({regression:{name:'',censusVariables:[],marketarea:0}});
                    }
                }
            },50);
    
    },
    
    handleChange: function(event) {
        var el = event.target,
            name = el.name,
            type = el.type,
            newState = this.state;

        if(el.name=='regressionName'){

            newState.regression.name = event.target.value
            this.setState(newState);

        }else if(el.name=='regressionConstant'){

            newState.regression.constant = event.target.value
            this.setState(newState);

        }else{
            newState.regression.censusVariables[name].coef = event.target.value;
            this.setState(newState);
        }
    },
    _addCenVar:function(){
        
        if(this.refs.newCenVar.getDOMNode().childNodes[1].getAttribute("value") !== ''){
            var addVariable= this.refs.newCenVar.getDOMNode().childNodes[1].getAttribute("value")
            var newState = this.state;
            newState.regression.censusVariables.push({name:addVariable,coef:0});
            delete newState.globalCensusVariables[addVariable];
            this.setState(newState);
        }
    
    },
    changeRegression: function (e, selections) {
       var newState = this.state;
       newState.regression.marketarea = selections.id;
       this.setState(newState);
    },
    render: function(){
        var scope = this;
        
        var data = Object.keys(this.state.globalCensusVariables).map(function(cv,i){
            return {"id":cv,"text":cv}
        });

        var marketareaData = Object.keys(this.state.marketareas).map(function(key,i){
            return {"id":key,"text":scope.state.marketareas[key].name}
        });

        var currentVariables = this.state.regression.censusVariables.map(function(cv,i){
          return (
            <div key={i} className="form-group">
                <label htmlFor="normal-field" className="col-sm-7 control-label">{cv.name}</label>
                <div className="col-sm-5">
                    <input type="text" id="normal-field" className="form-control"
                        name={i}
                        onChange={scope.handleChange} value={scope.state.regression.censusVariables[i].coef} />
                </div>
            </div>
          )  
        });

        return (
            <form data-parsley-validate onSubmit={this.handleSubmit}>
                
                <div className="form-group">
                    <div className="input-group input-group">
                        
                        <Select2Component
                          id="newCenVar"
                          dataSet={data}
                          multiple={false}
                          styleWidth="100%"
                          ref="newCenVar"
                          val={[]}
                          placeholder="Select Census Var" />

                        <div className="input-group-btn">
                            <button type="button" className="btn btn-warning" onClick={this._addCenVar}><i className="fa fa-plus"></i></button>
                        </div>
                    </div>
                    <fieldset>
                    <div className="col-sm-7"><h4>Name</h4></div>
                    <div className="col-sm-5"><h4>Coefficient</h4></div>
                        {currentVariables}
                    </fieldset>
                    <div class="form-group">
                        <label htmlFor="dropdown-appended">Model Constant</label>
                        <div className="input-group col-sm-12">
                            <input type="text" className="form-control" id="dropdown-appended" placeholder="Constant"
                                name="regressionConstant" 
                                onChange={scope.handleChange} value={scope.state.regression.constant}/>
                        </div>
                    </div>
                    <div class="form-group">
                        <label htmlFor="marketareas">Market Area</label>
                        <div className="input-group col-sm-12">
                            <Select2Component
                              id="selectedMarketArea"
                              dataSet={marketareaData}
                              multiple={false}
                              onSelection={this.changeRegression}
                              styleWidth="100%"
                              ref="selectedMarketArea"
                              val={[this.state.regression.marketarea]}
                              placeholder="Select MarketArea" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label htmlFor="dropdown-appended">Model Name</label>
                        <div className="input-group col-sm-12">
                            <input type="text" className="form-control" id="dropdown-appended" placeholder="My Regression Name"
                                name="regressionName" 
                                onChange={scope.handleChange} value={scope.state.regression.name}/>
                        </div>
                    </div>
                </div>

                <input type='submit' className="btn btn-lg btn-primary btn-block" value={this.props.data.buttonText} />
            </form>
        );
    },

});

module.exports = RegressionForm;