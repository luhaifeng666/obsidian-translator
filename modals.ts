import { App, Modal, Setting } from 'obsidian'
import { noticeHandler, handleTranslate, options, handleAudio } from './utils'

type SpeakUrls = {
	[key: string]: string
}

interface TranslatorSetting {
	appId: string,
	secretKey: string,
	to: string,
	audio: boolean
}

// translator
export class TranslatorModal extends Modal {
	text: string
	customTo: string
	containerEl: HTMLDivElement
	loading: HTMLDivElement
	settings: TranslatorSetting

  constructor (
    app: App,
		text: string,
		settings: TranslatorSetting
  ) {
    super(app)
		this.text = text
		// init loading
		this.loading = createEl('div', {
			cls: 'translator_container-overlay',
			text: 'Translating...'
		})
		// get settings
		this.settings = settings
  }

	translate (containerEl: HTMLDivElement) {
		containerEl.empty()
		// add overlay mask
		containerEl.appendChild(this.loading)
		const { to, appId, secretKey, audio } = this.settings
		handleTranslate(this.text, { to: this.customTo || to, appId, secretKey }, (data: any) => {
			containerEl.removeChild(this.loading)
			const { query, translation, web, basic, l, webdict, tSpeakUrl, speakUrl } = data
			// explain rule
			const [FROM, TO] = l.split('2')

			// be translated word
			containerEl.appendChild(createEl('a', {
				cls: 'translator_container-title',
				text: query,
				href: webdict ? webdict.url : ''
			}))
			// get audioes
			const audioesContainer = createEl('div', { cls: 'translator_container-audioes' })
			if (audio) {
				const speakUrls: SpeakUrls = {origin: speakUrl, result: tSpeakUrl}
				Object.keys(speakUrls).forEach((key: string) => {
					new Setting(audioesContainer)
						.setName(`${key}:`)
						.addButton(btn => {
						btn.setIcon('audio-file')
							.onClick(() => {
								// @ts-ignore
								document.getElementById(key).play()
							})
					})
					handleAudio(speakUrls[key], (res: any) => {
						audioesContainer.appendChild(createEl('div', {
							cls: 'translator_container-player'
						}))
						audioesContainer.appendChild(createEl('audio', {
							attr: {
								src:  URL.createObjectURL(new Blob([res.arrayBuffer], { type: 'audio/mp3' })),
								id: key
							}
						}))
					})
				})
				containerEl.appendChild(audioesContainer)
			}
			// render explains
			if (basic) {
				// symbol
				let symbolText = basic.phonetic ? `[${basic.phonetic}]` : ''
				if (FROM === 'en' && TO === 'zh-CHS') {
					symbolText = `${basic['us-phonetic'] ? `us: [${basic['us-phonetic']}]` : ''}
${basic['uk-phonetic'] ? `uk: [${basic['uk-phonetic']}]` : ''}`
				}
				containerEl.appendChild(createEl('p', {
					cls: 'translator_container-soundmark',
					text: symbolText
				}))
				// explains
				const explains = FROM === 'zh-CHS' && TO === 'en'
					? [...translation, basic.explains.toString()]
					: basic.explains
				explains.forEach((exp: string) => {
					containerEl.appendChild(createEl('p', {
						cls: 'translator_container-explain',
						text: exp
					}))
				})
				// word forms
				if (basic.wfs) {
					containerEl.appendChild(createEl('p', {
						cls: 'translator_container-title',
						text: 'Word forms'
					}))
					containerEl.appendChild(createEl('p', {
						cls: 'translator_container-wfs',
						text: basic.wfs.map((item: {
							wf: { name: string, value: string }
						}) => `${item.wf.name}: ${item.wf.value}`).join(', ')
					}))
				}
			} else {
				containerEl.appendChild(createEl('p', {
					cls: 'translator_container-explain',
					text: translation.toString()
				}))
			}
			// other
			if (web) {
				containerEl.appendChild(createEl('p', {
					cls: 'translator_container-title',
					text: 'Other translations'
				}))
				web.forEach((item: { value: string[], key: string}) => {
					containerEl.appendChild(createEl('p', {
						cls: 'translator_container-other',
						text: `${item.key}: ${item.value.toString()}`
					}))
				})
			}
		})
	}

	// poen modal
	onOpen () {
		const { contentEl } = this

		contentEl.createEl('h1', { text: 'Translator', cls: 'translator_title' })
		let containerEl: HTMLDivElement
		// search
		new Setting(contentEl).setClass('translator_search').addText(text =>
			text.setValue(this.text).setPlaceholder('To be translated').onChange((value) => {
				this.text = value
			})
		).addButton((btn) =>
			btn
				.setIcon('search')
				.setCta()
				.onClick(() => {
					if (this.text) {
						this.translate(containerEl)
					} else {
						containerEl.empty()
					}
				})
		).addDropdown(dp =>
			dp.addOptions(options).setValue(this.settings.to).onChange(value => {
				this.customTo = value
			})
		)

		containerEl = contentEl.createDiv({ cls: 'translator_container' })

		this.text && this.translate(containerEl)
	}

	// close modal
	onClose () {
    this.contentEl.empty()
	}
}
