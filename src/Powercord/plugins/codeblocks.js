const Plugin = require('powercord/Plugin');
const { createElement } = require('powercord/util');
const { clipboard } = require('electron');

module.exports = class Codeblocks extends Plugin {
  constructor () {
    super({
      dependencies: [ 'StateWatcher' ]
    });
  }

  start () {
    powercord
      .plugins
      .get('StateWatcher')
      .on('codeblock', this.inject);
  }

  inject (codeblock) {
    if (
      codeblock.querySelector('.powercord-codeblock-copy-btn') ||
      codeblock.closest('.search-result-message')
    ) {
      return;
    }

    // Attribution: noodlebox
    // eslint-disable-next-line prefer-template
    codeblock.innerHTML = '<ol>' + codeblock.innerHTML
      .split('\n')
      .map(l => `<li>${l}</li>`)
      .join('') + '</ol>';

    const lang = codeblock.className.split(' ').find(c => !c.includes('-') && c !== 'hljs');
    if (lang) {
      codeblock.appendChild(
        createElement('div', {
          className: 'powercord-codeblock-lang',
          innerHTML: lang
        })
      );
    }
    codeblock.style += 'overflow: hidden;position: relative;';
    codeblock.appendChild(
      createElement('button', {
        className: 'powercord-codeblock-copy-btn',
        innerHTML: 'copy',
        onclick: ({ target }) => {
          if (target.classList.contains('copied')) {
            return;
          }

          target.innerText = 'copied!';
          target.classList.add('copied');
          setTimeout(() => {
            target.innerText = 'copy';
            target.classList.remove('copied');
          }, 1000);

          const range = document.createRange();
          range.selectNode(codeblock.children[0]);

          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          clipboard.writeText(selection.toString());

          selection.removeAllRanges();
        }
      })
    );
  }
};
