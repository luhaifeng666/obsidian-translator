import { App, Modal, Setting } from 'obsidian'
import { handleTranslate, options, handleAudio, isEmptyObject, handleMicrosoftTranslate, validator } from './utils'
import { TranslatorSetting } from './interfaces'

type SpeakUrls = {
	[key: string]: string
}

interface ElementObject {
  [key: string]: HTMLDivElement 
}

// translator
export class TranslatorModal extends Modal {
	text: string
	customTo: string
	containerEl: HTMLDivElement
  empty: HTMLDivElement
	settings: TranslatorSetting

  constructor (
    app: App,
		text: string,
		settings: TranslatorSetting
  ) {
    super(app)
		this.text = text
    // empty element
    this.empty = createEl('div', {
      cls: 'translator_container-empty',
      text: 'No results!'
    })
		// get settings
		this.settings = settings
  }

  // create title element
  createBlockTitleElement(containerEl: HTMLDivElement, title: string) {
    containerEl.appendChild(createEl('p', {
      text: title,
      cls: 'translator_container-block-title'
    }))
  }

  createLoadingElement() {
    return createEl('div', {
			cls: 'translator_container-overlay',
			text: 'Translating...'
		})
  }

  // youdao translate handler
  youdaoTranslateHandler(containerEl: HTMLDivElement) {
    const { to, from, appId, secretKey, audio } = this.settings
    const preMessage = `Microsoft translation service's`
    const lastMessage = `shouldn't be empty.`
    validator([
      { value: appId, message: `${preMessage} appId ${lastMessage}` },
      { value: secretKey, message: `${preMessage} secretKey ${lastMessage}` }
    ], () => {
      const loadingEl = this.createLoadingElement()
      this.createBlockTitleElement(containerEl, 'Youdao translation results')
      // add overlay mask
      containerEl.appendChild(loadingEl)
      handleTranslate(this.text, { to: this.customTo || to, appId, secretKey, from }, (data: any) => {
        containerEl.removeChild(loadingEl)
        if (isEmptyObject(data)) {
          containerEl.appendChild(this.empty)
        } else {
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
              text: translation?.toString()
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
        }
      })
    })
  }

  // microsoft translate handler
  microsoftTranslateHandler(containerEl: HTMLDivElement) {
    const loadingEl = this.createLoadingElement()
    const { to, from, microsoftSecretKey, microsoftLocation } = this.settings
    const preMessage = `Microsoft translation service's`
    const lastMessage = `shouldn't be empty.`
    validator([
      { value: microsoftSecretKey, message: `${preMessage} secret key ${lastMessage}` },
      { value: microsoftLocation, message: `${preMessage} location ${lastMessage}`}
    ], () => {
      this.createBlockTitleElement(containerEl, 'Microsoft translation results')
      // add overlay mask
      containerEl.appendChild(loadingEl)
      handleMicrosoftTranslate(this.text, {
        to, from, secretKey: microsoftSecretKey, location: microsoftLocation
      }, (res: string) => {
        containerEl.removeChild(loadingEl)
        const contentObj = {
          title: this.text,
          explian: res
        }
        Object.keys(contentObj).forEach(key => {
          containerEl.appendChild(createEl('p', {
            cls: `translator_container-${key}`,
            text: contentObj[key as keyof typeof contentObj]
          }))
        })
      })
    })
  }

	translate (containerEls: ElementObject) {
    Object.keys(containerEls).forEach(key => {
      const containerEl = containerEls[key]
      containerEl.empty()

      switch(key) {
        case 'youdaoEnable': {
          this.youdaoTranslateHandler(containerEl)
          break
        }
        case 'microsoftEnable': {
          this.microsoftTranslateHandler(containerEl)
          break
        }
        default: break
      }
    })
		
	}

	// poen modal
	onOpen () {
		const { contentEl, settings } = this
    const enableKeys = Object.keys(settings).filter(key => key.toLowerCase().includes('enable') && settings[key as keyof TranslatorSetting])

		contentEl.createEl('h1', { text: 'Translator', cls: 'translator_title' })
		// search
		const setting = new Setting(contentEl).setClass('translator_search').addText(text =>
			text.setValue(this.text).setPlaceholder('To be translated').onChange((value) => {
				this.text = value
			})
		)
    const containerEls: ElementObject = enableKeys.reduce((els: ElementObject, key: string) => (
      {...els, [key]: contentEl.createDiv({ cls: `translator_container translator_container-${key.replace('Enable', '')}` })}
    ), {})
    setting.addButton((btn) =>
			btn
				.setIcon('search')
				.setCta()
				.onClick(() => {
					if (this.text) {
						this.translate(containerEls)
					} else {
						Object.values(containerEls).forEach(el => el.empty())
					}
				})
		).addDropdown(dp =>
			dp.addOptions(options).setValue(this.settings.to).onChange(value => {
				this.customTo = value
			})
		)
		this.text && this.translate(containerEls)
	}

	// close modal
	onClose () {
    this.contentEl.empty()
	}
}
