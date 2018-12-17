const Plugin = require('powercord/Plugin');

module.exports = class StateWatcher extends Plugin {
  constructor () {
    super();

    this.observer = null;
  }

  start () {
    this.observer = new MutationObserver(this.onMutation.bind(this));
    this.observer.observe(document.querySelector('#app-mount'), {
      childList: true,
      subtree: true
    });
  }

  onMutation (mutations) {
    for (const mutation of mutations) {
      if (!mutation.addedNodes[0]) {
        continue;
      }

      for (const node of [ ...mutation.addedNodes ]
        .concat(...mutation.removedNodes)
        .concat(mutation.target)
      ) {
        if (!node.classList) {
          continue;
        }

        const codeblocks = [ ...node.querySelectorAll('.hljs') ];
        if (node.classList.contains('hljs')) {
          codeblocks.push(node);
        }
        if (codeblocks[0]) {
          for (const codeblock of codeblocks) {
            this.emit('codeblock', codeblock);
          }
        }
      }
    }
  }
};
