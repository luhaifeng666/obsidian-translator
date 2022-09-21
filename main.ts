/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-09 11:38:39
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-22 19:59:55
 * @Description: 
 */
import { Plugin } from "obsidian"
import { TranslatorSettingTab } from './settings'
import { TranslatorModal } from './modals'
import { noticeHandler } from './utils'
import { TranslatorSetting } from './interfaces'

const DEFAULT_SETTINGSF: TranslatorSetting = {
   // Youdao Settings
   youdaoEnable: false,
   appId: '',
   secretKey: '',
   yFrom: '',
   yTo: '',
   audio: false,
   // Microsoft Settings
   microsoftEnable: false,
   microsoftSecretKey: '',
   microsoftLocation: '',
   mFrom: '',
   mTo: '',
   // Baidu Settings
   baiduEnable: false,
   baiduSecretKey: '',
   baiduAppId: '',
   bFrom: '',
   bTo: ''
}

export default class TranslatorPlugin extends Plugin {
  settings: TranslatorSetting

  async onload() {
    // load settings
    await this.loadSettings()
    // add setting tab
    this.addSettingTab(new TranslatorSettingTab(this.app, this))
    // add ribbon icon
    this.addRibbonIcon('book', 'Translate', () => {
      // @ts-ignore
      this.app.commands.executeCommandById('obsidian-translator:translate')
    });
		// add command
		this.addCommand({
			id: 'translate',
			name: 'translate',
			editorCallback: (editor, view) => {
				const { appId, secretKey } = this.settings
				if (appId && secretKey) {
					const sel = editor.getSelection()
					new TranslatorModal(this.app, sel, this.settings).open()
				} else {
					noticeHandler('AppId or secretKey can not be empty!')
				}
			}
		})
  }

  async loadSettings () {
    this.settings = {
      ...DEFAULT_SETTINGSF,
      ...(await this.loadData() || {})
    }
  }

  async saveSettings () {
    await this.saveData(this.settings)
  }
}
