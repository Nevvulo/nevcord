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
    // eslint-disable-next-line prefer-template
    codeblock.innerHTML = '<ol>' + codeblock.innerHTML
      .split('\n')
      .map(l => `<li>${l}</li>`)
      .join('') + '</ol>';

    codeblock.style += 'overflow: hidden;position: relative;';

    codeblock.children[0].appendChild(
      createElement('button', {
        className: 'codeblock-copy-btn',
        style: 'background-color: #282727;color: white;border: 1.5px solid #212020;border-radius: 5px;float: right;position: absolute;top: 4px;right:4px;',
        innerHTML: 'copy',
        onclick: () => {
          const range = document.createRange();
          range.selectNode(codeblock.children[0]);
          clipboard.writeText(range.toString().split('').slice(0, -4).join(''));
        }
      })
    );
  }
};
