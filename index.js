const { execFile, execFileSync } = require('child_process');
const iconv = require('iconv-lite');
const path = require('path');

const MAX_BUFFER_SIZE = 100 * 1024 * 1024;

const wmic = path.join(process.env.SystemRoot, 'System32', 'wbem', 'WMIC.exe');

const aliasList = execFileSync(wmic, ['ALIAS', 'LIST', 'BRIEF'], { maxBuffer: MAX_BUFFER_SIZE });
const aliasLines = iconv.decode(aliasList, 'GB2312').split(/\r\n/);
const aliasItems = aliasLines.slice(1, aliasLines.length - 2).map(line => line.split(/\s{2,}/)[0]);

const data = {};

for (let aliasItem of aliasItems) {
  data[aliasItem] = () =>
    new Promise((resolve, reject) => {
      execFile(wmic, [aliasItem, 'get', '/VALUE'], { maxBuffer: MAX_BUFFER_SIZE }, (err, stdout, stderr) => {
        if (err || stderr) {
          reject(err || stderr);
        }

        const group = stdout.trim().split(/[\r\r\n]{5,}/);
        const jsonGroup = [];
        for (const item of group) {
          const list = item.split(/\r\r\n/);
          const jsonItem = {};
          for (const d of list) {
            const eqPos = d.indexOf('=');
            jsonItem[d.slice(0, eqPos)] = d.slice(eqPos + 1);
          }
          jsonGroup.push(jsonItem);
        }
        resolve(jsonGroup);
      });
    });
}

module.exports = data;
