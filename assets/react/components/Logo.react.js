var React = require('react');

var Logo = React.createClass({

  render: function() {
    return (
    	<div className="logo">
        	<h4><a href="/">NJTDM <strong>Admin</strong></a></h4>
    	</div>
    );
  }
});

module.exports = Logo;