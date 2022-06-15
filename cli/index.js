// 从gray分支或者release分支切换打包版本文件到master并自动进行commit提交
const path = require('path');
const inquirer = require('inquirer');
// const pathExists = require('path-exists').sync; 

const GitTools = require('./gitTools.js');
const pkg = require('../package.json');
const log = require('./log');
const CONSTANT = require('./constants');
const DdManager = require('./ddMessage');

const gitHandle = new GitTools(path.resolve());

async function deploy() {
    
    // 1. 获取版本 和 gitcommmit信息
    const versionDescription = 'v' + pkg.version.replace(/\./g, '').trim();
    const env = process.argv[2] || 'gray';
    const desc = env === 'gray' ? '灰度' : '正式';
    const remark = `build:${desc}版本${versionDescription}`; // commit备注信息

    log.info(`=====构建版本${remark}=====`);
    // 2. 命令行工具h获取钉钉消息推送人
    const { choicePeople }  = await getOption();
    // 3. git相关操作，打好tag，切换到部署分支（master），提交代码；
    log.info(`=====git相关所有操作开始=====`);
    const isSeccess = await gitHandle.autoUpload(remark, CONSTANT.TARGET_BRANCH, pkg.version);
    log.info(`=====git相关所有操作${isSeccess ? '成功' : '失败'}=====`);
    if (!isSeccess) return;
    // 4. git流程走完后成功后，发送钉钉消息
    const message = `🍎 🍎 🍎 ${CONSTANT.DINGDING_KEYWORD} 🍎 🍎 🍎 \n 🎣 ${remark} \n 🐠 请通过链接增加 printCenterVersion = ${versionDescription} 验证`;
    const isSendDingDingSuccsess = await sendDingDing(choicePeople, message);
    log.info(`=====钉钉消息发送${isSendDingDingSuccsess ? '成功' : '失败'}=====`);
    if(!isSendDingDingSuccsess) return;
    log.success('=====自动化流程结束=====');
}

// 获取用户环境和钉钉消息推送人
async function getOption() {
    return new Promise((resolve, reject) => {
        inquirer
        .prompt([
            {
                type: 'checkbox',
                name: 'choicePeople',
                message: '选择钉钉@对象:',
                // 默认钉钉@对象配置
                default: [],
                choices: CONSTANT.CHECKBOX_LIST,
                validate: val => {
                    return val && val.length > 0;
                },
            }])
        .then((answers) => {
            // Use user feedback for... whatever!!
            resolve(answers);
        })
        .catch((error) => {
            log.error(error);
            reject(error);
        });
    });
}

async function sendDingDing(choicePeople, content) {
    // 如果有所有人，需要单独处理
    const isAtAll = choicePeople.includes(CONSTANT.IS_AT_ALL);
    const atMobiles = isAtAll ? choicePeople.filter(x => x !== CONSTANT.IS_AT_ALL) : choicePeople;
    // 要at的人
    const at = {
        atMobiles,
        isAtAll,
    };

    // 根据钉钉机器人签名生成钉钉url
    const url = CONSTANT.DINGDING_URL;

    const data = {
        msgtype: 'text',
        text: {
            content,  
        },
        at,
    };

    const ddManager = new DdManager(
        url,
        data,
        {
            sendData: CONSTANT.DINGDING_KEYWORD,
            secret: CONSTANT.DINGDING_SECRET,
        },
    );

    const isSendSunccess = await ddManager.send();
    return isSendSunccess;
}

deploy();
