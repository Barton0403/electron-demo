// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow,
      dialog = electron.remote.dialog,
      ipc = electron.ipcRenderer,
      shell = electron.shell;

const os = require('os');
const path = require('path');
const fs = require('fs')

// 新建正常窗口
const newWindowBtn = document.querySelector('#new-window');
newWindowBtn.addEventListener('click', (event) => {
    const modalPath = path.join('file://', __dirname, 'modal.html');
    let win = new BrowserWindow({
        width: 400,
        height: 320,
        //frame: false, // 无边框
        //transparent: true, // 背景透明
        //show: true // 后台运行
    });
    win.on('resize', updateReply);
    win.on('move', updateReply)
    win.on('close', () => { win = null });
    // 监听内容进程关闭后
    win.webContents.on('crashed', () => {
        const options = {
            type: 'info',
            title: '关闭进程',
            message: '这个进程已经结束',
            buttons: ['重新加载', 'Close']
        }

        // 提示框
        dialog.showMessageBox(options, (index) => {
            if (index === 0) win.reload()
            else win.close()
        })
    })
    // 监听进程状态后每30s事件
    win.on('unresponsive', () => {
        const options = {
            type: 'info',
            title: '暂停进程',
            message: '这个进程已经暂停',
            buttons: ['重新加载', 'Close']
        }

        // 提示框
        dialog.showMessageBox(options, (index) => {
            if (index === 0) win.reload()
            else win.close()
        })
    })
    // 监听恢复响应后触发事件
    win.on('responsive', () => {
        alert('窗口恢复响应')
    })

    win.loadURL(modalPath);
    win.show();

    function updateReply() {
        const txtReplyEl = document.querySelector('.txtReply');
        const message = `大小：${win.getSize()}，位置：${win.getPosition()}`;
        txtReplyEl.innerText = message;
    }
});

// 新建不可见窗口
document.querySelector('#new-bgwindow').addEventListener('click', (event) => {
    const windowID = BrowserWindow.getFocusedWindow().id
    const invisPath = path.join('file://', __dirname, 'bgwindow.html')
    let win = new BrowserWindow({
        with: 400,
        height: 400,
        show: false
    })
    win.loadURL(invisPath)

    win.webContents.on('did-finish-load', () => {
        const input = 100
        win.webContents.send('compute-facorial', input, windowID)
    })
})
ipc.on('factorial-computed', (event, input, output) => {
    const message = `递归方法，输入${input}输出${output}`
    document.querySelector('.txtReply').innerText = message
})

// 右键按钮
document.querySelector('#context-menu').addEventListener('click', () => {
    ipc.send('show-context-menu')
})

// 打开本地文件链接
document.querySelector('#open-file-manager').addEventListener('click', () => {
    shell.showItemInFolder(os.homedir())
    console.log(os.homedir());
})
document.querySelector('#open-file-manager-d').addEventListener('click', () => {
    shell.showItemInFolder('d:')
})

const links = document.querySelectorAll('a[href]');
Array.prototype.forEach.call(links, (link) => {
    const url = link.getAttribute('href');
    link.addEventListener('click', (e) => {
        e.preventDefault()
        shell.openExternal(url)
    })
})

// 打开系统文件
document.querySelector('#select-directory').addEventListener('click', () => {
	dialog.showOpenDialog({
		properties: ['openFile', 'openDirectory', 'multiSelections']
	}, (files) => {
		if (files) document.querySelector('.txt-selected-filepath').innerText = `文件夹位置：${files}`
	})
})
// 保存文件地址
document.querySelector('#show-save-dialog').addEventListener('click', () => {
    dialog.showSaveDialog({
        title: '保存标题',
        filters: [
            { name: '图片格式:jpg,png,gif', extensions: ['jpg', 'png', 'gif'] }
        ]
    })
})

// 报错提示
document.querySelector('#show-error-dialog').addEventListener('click', () => {
    dialog.showErrorBox('错误', '错误提示文本')
})
// info信息
document.querySelector('#show-info-dialog').addEventListener('click', () => {
    dialog.showMessageBox({
        type: 'info',
        title: '信息标题',
        message: '信息文本',
        buttons: ['重新加载', 'Yes', 'No', 'Close']
    }, (index) => {
        console.log(index)
    })
})

// ipc 进程交流
document.querySelector('#ipc-async').addEventListener('click', () => {
    ipc.send('ipc-async')
})
ipc.on('back-ipc-async', (event, arg) => {
    dialog.showMessageBox({
        type: 'info',
        title: '异步交流测试',
        message: arg
    })
})
document.querySelector('#ipc-sync').addEventListener('click', () => {
    const message = ipc.sendSync('ipc-sync')
    dialog.showMessageBox({
        type: 'info',
        title: '同步交流测试',
        message: message
    })
})

// 系统信息
const homedirEl = document.querySelector('.homedir'),
    screensizeEl = document.querySelector('.screensize'),
    workAreaScreenSizeEl = document.querySelector('.workArea_screensize'),
    nodevEl = document.querySelector('.nodev'),
    chromevEl = document.querySelector('.chromev'),
    electronvEl = document.querySelector('.electronv'),
    appdirEl = document.querySelector('.appdir')

homedirEl.innerText = os.homedir()
const size = electron.screen.getPrimaryDisplay().size,
    workAreaSize = electron.screen.getPrimaryDisplay().workAreaSize
screensizeEl.innerText = `${size.width}x${size.height}`
workAreaScreenSizeEl.innerText = `${workAreaSize.width}x${workAreaSize.height}`
nodevEl.innerText = process.versions.node
chromevEl.innerText = process.versions.chrome
electronvEl.innerText = process.versions.electron
// 由于asar影响，根目录会获取失败，改用此方法获取
appdirEl.innerText = path.dirname(electron.remote.app.getPath("exe"))

// 点击复制/粘贴
const copyInputEl = document.querySelector('.copytxt'),
    pastetxtEl = document.querySelector('.pastetxt')
document.querySelector('#copy').addEventListener('click', () => {
    electron.clipboard.writeText(copyInputEl.value)
    dialog.showMessageBox({
        message: '复制成功'
    })
})
document.querySelector('#paste').addEventListener('click', () => {
    pastetxtEl.innerText = electron.clipboard.readText();
})

// 返回APP连接
document.querySelector('#show-backpage').addEventListener('click', () => {
    console.log(__dirname);
    electron.shell.openExternal(path.join('file://', __dirname, 'backapp.html'))
})


// pdf打印
document.querySelector('#page-to-pdf').addEventListener('click', () => {
    const pdfPath = path.join(electron.remote.app.getPath("desktop"), 'print.pdf'),
        win = BrowserWindow.getFocusedWindow()
    win.webContents.printToPDF({}, (error, data) => {
        if (error) throw error

        fs.writeFile(pdfPath, data, (error) => {
            if (error) throw error

            shell.openExternal('file://' + pdfPath)
        })
    })
})

// 截屏
document.querySelector('#take-screen').addEventListener('click', () => {
    const thumbSize = determineScreenShotSize()
    electron.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: thumbSize
    }, (error, sources) => {
        if (error) throw error

        sources.forEach((source) => {
            if (source.name === 'Entire screen' || source.name === 'Screen 1') {
                const screenshotPath = path.join(electron.remote.app.getPath("desktop"), 'screenshot.png')

                fs.writeFile(screenshotPath, source.thumbnail.toPng(), (error) => {
                    if (error) throw error

                    shell.openExternal('file://' + screenshotPath)
                })
            }
        })
    })
})

function determineScreenShotSize() {
    const screenSize = electron.screen.getPrimaryDisplay().workAreaSize
    const maxDimension = Math.max(screenSize.width, screenSize.height)
    return {
        width: maxDimension * window.devicePixelRatio,
        height: maxDimension * window.devicePixelRatio
    }
}
