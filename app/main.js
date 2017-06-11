const electron = require('electron')
// Module to control application life.
const app = electron.app

// Copyright (c) The LHTML team
// See LICENSE for details.

const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

process.env.NODE_ENV = 'production'

// electron-log
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// 热更新
function sendStatusToWindow(text) {
  log.info(text);
  dialog.showMessageBox({message: text})
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (ev, err) => {
  sendStatusToWindow(err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds');
});

autoUpdater.on('update-downloaded', (ev, info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 5000)
})

// 注册默认协议，实现从其他应用跳转回来
// FIXME 非安装包可能使用不了
app.setAsDefaultProtocolClient('electron-demo')

app.on('open-url', function (event, url) {
  dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
})

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow,
	Menu = electron.Menu,
	MenuItem = electron.MenuItem,
	ipc = electron.ipcMain,
	dialog = electron.dialog,
	globalShortcut = electron.globalShortcut,
	Tray = electron.Tray,
    shell = electron.shell

const path = require('path')
const url = require('url')
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow,
	appIcon

let template = [{
	label: 'Edit',
	submenu: [{
		label: 'Undo',
		accelerator: 'CmdOrCtrl+Z',
		role: 'undo'
	}, {
		label: 'Redo',
		accelerator: 'Shift+CmdOrCtrl+Z',
		role: 'redo'
	}]
}, {
	label: 'View',
	submenu: [{
			label: 'Reload',
			accelerator: 'CmdOrCtrl+R',
			click: (item, focusedWindow) => {
				if (focusedWindow) {
					if (focusedWindow.id === 1) {
						BrowserWindow.getAllWindows().forEach((win) => {
							if (win.id > 1) win.close()
						})
					}
					focusedWindow.reload()
				}
			}
		},
		{
			label: 'Toggle Developer Tools',
			accelerator: (function() {
				if (process.platform === 'darwin') {
					return 'Alt+Command+I'
				} else {
					return 'Ctrl+Shift+I'
				}
			})(),
			click: function(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.toggleDevTools()
				}
			}
		}
	]
}, {
    label: 'Help',
    submenu: [{
        label: 'About',
        role: 'about'
    }]
}]

function createWindow() {
    //检测版本
    autoUpdater.checkForUpdates()

	// 自定义顶部菜单
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)

	// 添加任务栏图标，linux需特殊处理
	const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'iconTemplate.png'
	const iconPath = path.join(__dirname, iconName)
	appIcon = new Tray(iconPath)
	const contextMenu = Menu.buildFromTemplate([{
		label: 'Remove',
		click: () => {
			appIcon.destroy()
		}
	}])
	appIcon.setToolTip('浮动提示')
	appIcon.setContextMenu(contextMenu) // 右键菜单

	let r = globalShortcut.register('CommandOrControl+Alt+D', ()  => {
		dialog.showMessageBox({
			type: 'info',
			message: 'Success!',
			detail: '自定义快捷键触发',
			buttons: ['OK']
		})
	})

	if (!r) {
		console.log('快捷键注册失败！');
	}

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600
	})

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

app.on('will-quit', () => {
	// 取消快捷键
	globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 创建新菜单列表
const menu = new Menu()
menu.append(new MenuItem({
	label: 'hello'
}))
menu.append(new MenuItem({
	type: 'separator'
}))
menu.append(new MenuItem({
	label: 'Electron',
	type: 'checkbox',
	checked: true
}))

app.on('browser-window-created', (event, win) => {
	// 右键事件监听
	win.webContents.on('context-menu', (e, params) => {
		menu.popup(win, params.x, params.y)
	})
})

// 通过ipcMain,ipcRenderer监听自定义事件
// 显示右键菜单事件
ipc.on('show-context-menu', (event) => {
	// 获取事件触发窗口
	const win = BrowserWindow.fromWebContents(event.sender)
	menu.popup(win)
})
ipc.on('ipc-async', (event) => {
	event.sender.send('back-ipc-async', '异步交流成功')
})
ipc.on('ipc-sync', (event) => {
	event.returnValue = '同步交流成功'
})
