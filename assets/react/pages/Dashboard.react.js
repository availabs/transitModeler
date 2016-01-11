var React = require('react'),

    //-- Components
    MarketAreaTable = require('../components/dashboard/MarketAreaTable.react'),
    UserMessageDisplay = require('../components/dashboard/UserMessages.react'),
    JobDisplay = require('../components/job/JobDisplay.react');
var SamplePage = React.createClass({



    render: function() {

        return (
        	<div className="content container">
            	<h2 className="page-title">Dashboard <small> Overview &amp; shortcuts</small></h2>
                <div className="row">
                	<div className="col-lg-12">
                        <section className="widget">
                            <header>
                                <h4>
                                    Market Areas
                                    <small>
                                        For Analysis and  Modeling
                                    </small>
                                </h4>
                                <div className="widget-controls">

                                </div>
                            </header>
                            <div className="body no-margin">
                                <div id="marketareaList">
                                   <MarketAreaTable />
                                </div>
                                <div className="visits-info well well-sm">

                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="col-lg-6">
                      <JobDisplay
                        title={"Recently Completed Jobs"}
                        jobs={this.props.jobhistory}
                        criteria={function(d){return d.isFinished;}}
                        length={5}
                        />
                    </div>
                    <div className='col-lg-6'>
                      <UserMessageDisplay/>
                    </div>
                </div>
        	</div>
        );
    }
});

module.exports = SamplePage;
