import { Plugin, Editor } from "obsidian"
import { TranslatorSettingTab } from './settings'
import { readFile, writeFile } from 'fs/promises'
import { noticeHandler } from './utils'

interface TranslatorSetting {
	appid: string,
	secretId: string,
	from: string,
	to: string
}

const DEFAULT_SETTINGS: Partial<TranslatorSetting> = {
	from: 'auto',
	to: 'auto'
}

export default class TranslatorPlugin extends Plugin {
  settings: TranslatorSetting

  async onload() {
    // load settings
    await this.loadSettings()
    // add setting tab
    this.addSettingTab(new TranslatorSettingTab(this.app, this))
    // add ribbon icon
    this.addRibbonIcon("book", "Translate", () => {
      // @ts-ignore
      // this.app.commands.executeCommandById('obsidian-link-keeper:list-links')
    });
  }

  async loadSettings () {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...await this.loadData()
    }
  }

  async saveSettings () {
    await this.saveData(this.settings)
  }
}
