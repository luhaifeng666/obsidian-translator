import TranslatorPlugin from './main'
import { App, PluginSettingTab, Setting } from 'obsidian'
import { options } from './utils'

const SETTINGS = [
	{
		name: 'appId',
		desc: 'Please set your app id.',
		type: 'text'
	}, {
		name: 'secretKey',
		desc: 'Please set you secret id.',
		type: 'text'
	}, {
		name: 'to',
		desc: 'Choose which language you wanna translate into.',
		type: 'select'
	}, {
		name: 'audio',
		desc: 'Whether to enable the audio function?',
		type: 'toggle'
	}
]

export class TranslatorSettingTab extends PluginSettingTab {
  plugin: TranslatorPlugin

  constructor (app: App, plugin: TranslatorPlugin) {
    super (app, plugin)
    this.plugin = plugin
  }

  display(): void {
		const { containerEl } = this
    containerEl.empty()

		// Add Setting title
		containerEl.createEl("h2", { text: "Translator Settings" });
		const descEl = containerEl.createEl("p",{
			text: "Before using this plugin, you need browse to ",
			cls: 'desc'
		});
		descEl.appendChild(createEl('a', {
			text: 'https://ai.youdao.com/#/',
			href: 'https://ai.youdao.com/#/',
		}))
		descEl.appendText(' to register first!')
		// Init settings
		SETTINGS.forEach(set => {
			const { name, desc, type } = set
			const el = new Setting(containerEl)
				.setName(name)
				.setDesc(desc)
			switch (type) {
				case 'text':
					el.addText((text) =>
						text
							.setPlaceholder(name)
							// @ts-ignore
							.setValue(this.plugin.settings[name])
							.onChange(async (value) => {
								// @ts-ignore
								this.plugin.settings[name] = value
								await this.plugin.saveSettings()
							})
					)
					break
				case 'select':
					el.addDropdown(dp =>
						dp
							.addOptions(options)
							.setValue(this.plugin.settings.to)
							.onChange(async value => {
								this.plugin.settings.to = value
								await this.plugin.saveSettings()
							})
					)
					break
				case 'toggle':
					el.addToggle(tg => {
						tg
							.setValue(this.plugin.settings.audio)
							.onChange(async val => {
							this.plugin.settings.audio = val
							await this.plugin.saveSettings()
						})
					})
					break
				default: break
			}
		})
  }
}
