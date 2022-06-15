const log = require('npmlog');

// 前缀
log.heading = 'printCenter';
log.headingStyle = { fg: 'blue', bg: 'black' }

// 自定义日志样式
log.addLevel('success', 2000, { fg: 'green', bold: true });

module.exports = log;