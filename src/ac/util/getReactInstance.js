module.exports = (node) => node[
  Object.keys(node).find((key) => key.startsWith('__reactInternalInstance'))
];
