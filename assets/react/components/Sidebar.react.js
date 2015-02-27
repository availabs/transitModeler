'use strict';
var React = require('react'),
    Link = require('react-router').Link,

    // -- Components
    JobSidebar = require('./job/JobSidebar.react');



var MenuItem = React.createClass({

    render:function(){
    //recursive render
        if(this.props.data.menuItems){
            var name = this.props.data.text;
            //If there is a safe name use it for collapes function
            if(typeof this.props.data.name != 'undefined'){
                name =  this.props.data.name;
            }

            var dataParent = "#side-nav";
            if(typeof this.props.parent != 'undefined'){
                dataParent = this.props.parent;
            }

            var collapse_string = '#'+name+'-collapse',
                collapse_id = name+'-collapse';

            var menus = this.props.data.menuItems.map(function(item,i){
                return (
                    <MenuItem key={i} data={item} parent={collapse_string} />
                )
            });

            return (
                <li className="panel">
                    <a className="accordion-toggle collapsed" data-toggle="collapse" data-parent={dataParent} href={collapse_string}>
                    <i className={this.props.data.icon}></i> <span className="name">{this.props.data.text}</span></a>
                    <ul id={collapse_id} className="panel-collapse collapse ">
                        {menus}
                    </ul>
                </li>
            )
        }else{
            if(this.props.data.type === 'Route'){
                return (
                    <li>
                        <Link to={this.props.data.action} params={this.props.data.params}><i className={this.props.data.icon}></i> <span className="name">{this.props.data.text}</span></Link>
                    </li>
                )
            }else{
                return (
                    <li>
                        <a href={this.props.data.action}><i className={this.props.data.icon}></i> <span className="name">{this.props.data.text}</span></a>
                    </li>
                )
            }
        }
    }

})


var Sidebar = React.createClass({
    
    propTypes: {
      
      menuItems: React.PropTypes.array
    
    },
    getDefaultProps: function() {
      return {
        menuItems: [], 
      };
    },
    render: function() {
        var menus = this.props.menuItems.map(function(item,i){
            return (
                <MenuItem key={i} data={item} />
            )
        });

        return (
          	<nav id="sidebar" className="sidebar nav-collapse collapse">
                <ul id="side-nav" className="side-nav">
                	{menus}
            	</ul>
                <JobSidebar activeJobs={this.props.activeJobs} />
            </nav>
        );
    }
});

module.exports = Sidebar;




                
                
        
            