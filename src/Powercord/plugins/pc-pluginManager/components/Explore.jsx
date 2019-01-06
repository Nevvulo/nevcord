const { React } = require('powercord/webpack');
const { Button } = require('powercord/components');

module.exports = class Explore extends React.Component {
  render () {
    return <div className='powercord-plugins'>
      <div className='powercord-plugins-wip'>This part of Powercord is a WIP. Expect unavailable features and crashes here</div>
      <div className='powercord-plugins-header'>
        <h3>Explore plugins</h3>
        <Button onClick={() => this.props.goToInstalled()}>Installed Plugins</Button>
      </div>
    </div>;
  }
};
