const Plugin = require('@ac/plugin');
const { createElement } = require('@ac/util');
const { clipboard } = require('electron');

module.exports = class Codeblocks extends Plugin {
  constructor () {
    super({
      stage: 2,
      dependencies: [ 'StateWatcher' ]
    });
  }

  start () {
    aethcord
      .plugins
      .get('StateWatcher')
      .on('codeblock', this.inject);
  }

  inject (codeblock) {
    if (codeblock.children[0]) {
      return;
    }

    // Attribution: noodlebox
    codeblock.innerHTML = '<ol>' + codeblock.innerHTML
      .split('\n')
      .map(l => `<li>${l}</li>`)
      .join('') + '</ol>';

    codeblock.appendChild(
      createElement('button', {
        className: 'codeblock-copy-btn',
        style: `background-color: #282727;color: white;border: 1.5px solid #212020;border-radius: 5px;float: right;position: relative;top: -5px;`,
        innerHTML: 'copy',
        onclick: () => {
          const range = document.createRange();
          range.selectNode(codeblock.children[0]);
          clipboard.writeText(range.toString());
        }
      })
    );
  }
};
