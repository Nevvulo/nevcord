const { getModuleByDisplayName, React } = require('powercord/webpack');
const { TextInput } = require('powercord/components/settings');
const SwitchItem = getModuleByDisplayName('switchitem');

module.exports = class GeneralSettings extends React.Component {
  constructor () {
    super();

    const get = powercord.settingsManager.get.bind(powercord.settingsManager);

    this.state = {
      prefix: get('prefix', '.'),
      openOverlayDevTools: get('openOverlayDevTools', false),
      backendURL: get('backendURL', 'https://powercord.xyz'),
      experiments: get('experiments', false),
      advancedSettings: get('advancedSettings', false)
    };
  }

  render () {
    const settings = this.state;

    const set = (key, value = !settings[key]) => {
      powercord.settingsManager.set(key, value);
      this.setState({
        [key]: value
      });
    };

    return (
      <div>
        <TextInput
          defaultValue={settings.prefix}
          onChange={e => set('prefix', e)}
        >
          Command Prefix
        </TextInput>

        <SwitchItem
          note={
            <span>Exercise caution changing anything in this category if you don't know what you're doing. <b>Seriously.</b></span>
          }
          value={settings.advancedSettings}
          onChange={() => set('advancedSettings')}
        >
          Advanced Settings
        </SwitchItem>
        {settings.advancedSettings && (
          <div>
            <TextInput
              value={settings.backendURL}
              onChange={(e) => set('backendURL', e)}
            >
              Backend URL
            </TextInput>

            <SwitchItem
              note='Should Powercord open overlay devtools when it gets injected (useful for developing themes)'
              value={settings.openOverlayDevTools}
              onChange={() => set('openOverlayDevTools')}
            >
              Overlay DevTools
            </SwitchItem>

            <SwitchItem
              note={
                <span><b style={{ color: 'rgb(240, 71, 71)' }}>WARNING:</b> Enabling this gives you access to features that can be <b>detected by Discord</b> and may result in an <b style={{ color: 'rgb(240, 71, 71)' }}>account termination</b>.
                  Powercord is <b>not responsible</b> for what you do with this feature. Leave it disabled if you are unsure.</span>
              }
              value={settings.experiments}
              onChange={() => set('experiments')}
            >
              Enable Discord Experiments
            </SwitchItem>
          </div>
        )}
      </div>
    );
  }
};
