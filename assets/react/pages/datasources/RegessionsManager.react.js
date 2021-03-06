'use strict';

var React = require('react'),
    
    // -- Components 
    WidgetHeader = require('../../components/WidgetHeader.react'),
    RegressionForm = require('../../components/regression/RegressionForm.react'),
    RegressionTable = require('../../components/regression/RegressionTable.react'),
    
    // -- Action Creators
    RegressionActionsCreator = require('../../actions/RegressionActionsCreator');

    

    // -- Misc
var panelData = [
    {
      title:"Create Regression",
      name:'createRegression',
      expanded:'true',
      formData:{
        buttonText:'Create Regression',
        formType:'create'
      }
    }
];




var AccordianPanel = React.createClass({
    render: function(){
    
        var id = '#'+this.props.data.name;
        var display = 'panel-collapse collapse ';
        
        if(this.props.data.expanded == 'true'){
            display += 'in';
        }

        return (
            <div className="panel">
                <div className="panel-heading">
                    <a className="accordion-toggle" data-toggle="collapse" data-parent="#accordion2" href={id} aria-expanded={this.props.data.expanded}>
                        {this.props.data.title}
                    </a>
                </div>

                <div id={this.props.data.name} className={display} aria-expanded={this.props.data.expanded}>
                    <div className="panel-body">
                        <RegressionForm data={this.props.data.formData} />
                    </div>
                </div>
            </div>
        )
    }
})


var EditAccordian = React.createClass({
    
    render: function(){

        var panels = this.props.panelData.map(function(panel,i){
            return (
                <AccordianPanel key={i} data={panel} />
            )
        })
        return(
            <div className="panel-group" id="accordion2">
                {panels}
            </div>
        )

    }
});



var RegressionPage = React.createClass({


    render: function() {
        return (
            <div className="content container">
                <h2 className="page-title">Regression Models <small>Management</small></h2>
                <div className="row">
                    <div className="col-lg-9">
                        <section className="widget whitesmoke">
                            <div className="body">
                                <RegressionTable marketareas={this.props.marketareas} regressions={this.props.regressions} /> 
                            </div>
                        </section>                        
                    </div>
                    <div className="col-lg-3">
                         <EditAccordian panelData={panelData} /> 
                    </div>
                </div>
            </div>
        );
    },
    
    _onChange: function() {
        var data = getStateFromStores();
        console.log(data);
        this.setState(getStateFromStores());
    }

});

module.exports = RegressionPage;