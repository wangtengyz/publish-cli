// Node.js向钉钉群发送消息模块
const request = require('request');//加载此模块失败请使用在本目录下使用nmp i request控制台命令
const crypto = require('crypto');

const log = require('./log');

class DdManager {
    constructor(url, data, option = {}) {
        const {
            sendData, // 钉钉机器人关键字
            secret, // 签名
        } = option;
        this.data = data;
        this.sendData = sendData;
        let urlStr = url;
        if (secret) {
            const time = Date.now();//当前时间
            const stringToSign = time + '\n' + secret;
            const base = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
            const sign = encodeURIComponent(base); //签名
            urlStr = url + `&timestamp=${time}&sign=${sign}`;
        }
        this.url = urlStr;
    }

    send() {
        return new Promise((resolve, reject) => {
            console.log('this.data', this.data);
            request.post( //发送post
                this.url,
                {
                    json: this.data,
                    encoding: 'utf-8',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
                function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        resolve(true);
                        return true;
                    } else {
                        log.error('钉钉推送消息失败');
                        reject(error);
                        return false;
                    }
                });
        })
    }
}

module.exports = DdManager;