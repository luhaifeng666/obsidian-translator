import { Plugin, Editor } from "obsidian"
import { LinkKeeperSettingTab } from './settings'
import { readFile, writeFile } from 'fs/promises'
import { noticeHandler } from './utils'
interface LinkKeeperSettings {
  filepath: string
}

const DEFAULT_SETTINGS: Partial<LinkKeeperSettings> = {
	filepath: `${process.env.HOME}/etl.json`
}

export default class TranslatorPlugin extends Plugin {
  settings: LinkKeeperSettings

  async onload() {
    // load settings
    await this.loadSettings()
    // add setting tab
    this.addSettingTab(new LinkKeeperSettingTab(this.app, this))
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
