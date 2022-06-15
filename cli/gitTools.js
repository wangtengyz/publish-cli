// git相关命令操作模块
const { spawn, exec, execSync } = require('child_process');
const pathExists = require('path-exists').sync; // 判断路径是否存在
const path = require('path');

const log = require('./log');
module.exports = class GitTools {

    /**
     * 构造函数
     * @param {String} cwd 工作目录
     * */
    constructor(cwd) {
        this.cwd = cwd;
    }

    /**
     * git add
     * */
    add() {
        const params = [
            'add',
            '.',
        ];

        return this.startChildProcess('git', params);
    }

    /**
     * git stash
     * */
    stash() {
        const params = [
            'stash',
        ];
        return this.startChildProcess('git', params);
    }

    /**
     * git stash pop
     * */
    stashPop() {
        const params = [
            'stash',
            'pop',
        ];
        return this.startChildProcess('git', params);
    }

    /**
     * git tag
     * */
    tag(version) {
        const params = [
            'tag',
            `v${version}`,
        ];
        return this.startChildProcess('git', params);
    }

    /**
     * 查看本地tag
     * */
    findTag(version) {
        const command = `git tag -l v${version}`;
        return this.startExecProcess(command);
    }

    /**
     * 查看远程tag
     * */
    findTagOrigin(version) {
        const command = `git ls-remote --tags origin -l refs/tags/v${version}`;
        return this.startExecProcess(command);
    }

    /**
     * 本地删除tag
     * */
    tagDel(version) {
        const command = `git tag -d v${version}`;
        return this.startExecProcess(command);
    }

    /**
     * 远程删除tag 
     * */
    tagDelOrigin(version) {
        const command = `git push origin --delete v${version}`;
        return this.startExecProcess(command);
    }

    // 验证对应路径是否存在
    dealVersionFile(version) {
        const versionDescription = 'v' + version.replace(/\./g, '').trim();
        const pathFile = path.resolve(process.cwd(), `./printCenter/${versionDescription}`);
        const isExist = pathExists(pathFile);
        // 删除指定路径文件 rm -rf ./printCenter/v220
        if (isExist) {
            const command = `rm -rf ${pathFile}`;
            execSync(command);
            // return this.startExecProcess(command);
        }
        return Promise.resolve('success');
    }
    

    /**
     * git push origin tag 
     * */
    tagPush(version) {
        const params = [
            'push',
            'origin',
            `v${version}`,
        ];
        return this.startChildProcess('git', params);
    }


    /**
     * git commit
     * @param {String} remark 备注信息
     * */
    commit(remark = 'nodejs run git 默认备注信息') {
        const params = [
            'commit',
            '-m',
            remark,
        ];

        return this.startChildProcess('git', params);
    }

    /**
     * git push
     * @param {String} branch 分支名
     * */
    push(branch) {

        if (!branch) {
            throw 'please input branch name !';
        }

        const params = [
            'push',
            'origin',
            branch,
        ];

        return this.startChildProcess('git', params);
    }

    /**
     * git checkout
     * @param {String} branch 分支名
     * */
    checkout(branch) {

        if (!branch) {
            throw 'please input branch name !'
        }

        const params = [
            'checkout',
            branch,
        ];

        return this.startChildProcess('git', params);
    }

    /**
     * git pull
     * @param {String} branch 分支名
     * */
    pull(branch) {

        if (!branch) {
            throw 'please input branch name !'
        }

        const params = [
            'pull',
            'origin',
            branch,
        ];

        return this.startChildProcess('git', params);
    }

    /**
     * git status
     * @return {Boolean} 是否存在修改
     * */
    async status() {

        try {
            const params = [
                'status',
                '-s',
            ];
            const result = await this.startChildProcess('git', params);
            return result ? true : false;
        } catch (err) {
            console.error(err);
        }

        return false;
    }

    /**
     * yarn kdzs-compile build
     * @return {Boolean} 是否存在修改
     * */
    async build() {
        try {
            const result = await this.startChildProcess('yarn', ['build:prod']);
            return result ? true : false;
        } catch (err) {
            console.error(err);
        }

        return false;
    }

    /**
     * 开启子进程
     * @param {String} command  命令 (git/node...)
     * @param {Array} params 参数
     * */
    startChildProcess(command, params) {

        return new Promise((resolve, reject) => {
            const process = spawn(command, params, {
                cwd: this.cwd,
            });

            const logMessage = `${command} ${params[0]}`;
            let cmdMessage = '';

            process.stdout.on('data', (data) => {
                if (!data) {
                    reject(`${logMessage} error1 : ${data}`);
                } else {
                    cmdMessage = data.toString();
                    log.info(`${logMessage} start ---`, cmdMessage);
                }
            });

            process.on('close', (data, e1, e2, e3) => {
                if (data) {
                    log.error(`${logMessage} error2 ! ${data}`);
                    reject(`${logMessage} error2 ! ${data}`);
                } else {
                    log.success(`${logMessage} success !`);
                    resolve('success');
                }
            });
        });
    }

    /**
     * 开启Exec子进程
     * @param {String} command  命令 (git/node...)
     * @param {Array} params 参数
     * */
    startExecProcess(command) {

        return new Promise((resolve, reject) => {
            exec(command, function(err, stdout) {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    sleep(time) {
        return new Promise((resolve) => {
            const timer = setTimeout(() =>{
                clearTimeout(timer);
                resolve('seccess');
            }, time);
        });
    }


    /**
     * 自动上传
     * @param {String} remark 备注的信息 
     * @param {String} branch 目标分支 
     * */
    async autoUpload(remark, branch, version) {
        try {

            // 代码根据当前分支版本号存在打上tag标签
            log.info(`=====当前分支版本号打上tag v${version}标签=====`);

            // 查看对应tag是否有本地 有则先删除
            const localHasTag = await this.findTag(version);
            const onlineHasTag = await this.findTagOrigin(version);
           
            if (localHasTag) {
                // await this.tagDel(version);
                log.error(`版本${version}重复，请修改保存后再运行`);
                return false;
            }

            if (onlineHasTag) {
                // await this.tagDelOrigin(version);
                log.error(`远程版本${version}重复，请修改保存后再运行`);
                return false;
            }

            await this.tag(version);

            // git tag并推送远程 先查看远程是否有tag，有则删除
                
            await this.tagPush(version);

            log.info(`=====项目构建开始=====`);
            await this.build();
            log.info(`=====项目构建完成=====`);

            log.info(`=====修改内容暂存暂存区=====`);
            // 将修改记录放到暂存区
            await this.add();
            await this.stash();

            log.info(`=====git切换分支到${branch}=====`);
            // git checkout branch
            await this.checkout(branch);

            // git pull branch
            await this.pull(branch);

            // 先查看本地是否有对应的版本的构建文件，有则先删除
            // await this.dealVersionFile(version);

            // await this.sleep(1000);

            // 将暂存区数据弹出
            await this.stashPop();

            // git add .
            await this.add();

            // git status -s
            const isChange = await this.status();

            if (isChange) {
                // git commit -m remark
                await this.commit(remark);

                // git push branch
                await this.push(branch);

                // 打在master分支版本
                // if (version) {
                //     // git tag并推送远程
                //     await this.tag(version);
                //     await this.tagPush(version);
                // }

            } else {
                log.warn('not have to upload');
            }

            log.success('uploadauto upload success !');

            return true;
        } catch (err) {
            log.error(err);
        }

        log.error('auto upload error !');
        return false;
    }
};
