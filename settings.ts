import TranslatorPlugin from './main'
import { App, PluginSettingTab, Setting } from 'obsidian'
import { getLanguageOptions, LANGUAGES, MICROSOFT_LANGUAGES, BAIDU_LANGUAGES } from './utils'
import { TranslatorSetting } from './interfaces';

interface Desc {
  type: string
  href?: string
  text: string
}

interface SettingItem {
  name: string
  type: string
  key: string
  desc: string
  default: boolean | string
  options?: {[key: string]: string}
}

interface Block {
  title: string,
  desc?: Array<Desc>,
  settings: Array<SettingItem>
}


const SETTING_BLOCKS: Array<Block> = [
  {
    title: 'Youdao Translator Settings',
    desc: [
      { type: 'text', text: 'Before using this plugin, you need browse to ' },
      { type: 'href', href: 'https://ai.youdao.com/#/', text: 'https://ai.youdao.com/#/' },
      { type: 'text', text: 'to register first!' }
    ],
    settings: [
      {
        name: 'Enable',
        desc: 'Enable the youdao translator service.',
        type: 'toggle',
        key: 'youdaoEnable',
        default: true
      },
      {
        name: 'AppId',
        desc: 'Please set your app id.',
        type: 'text',
        key: 'appId',
        default: ''
      }, {
        name: 'SecretKey',
        desc: 'Please set your secret id.',
        type: 'text',
        key: 'secretKey',
        default: ''
      }, {
        name: 'From',
        desc: 'Choose which language you wanna translate from.',
        type: 'select',
        key: 'yFrom',
        default: 'en',
        options: getLanguageOptions(LANGUAGES)
      }, {
        name: 'To',
        desc: 'Choose which language you wanna translate into.',
        type: 'select',
        key: 'yTo',
        default: 'en',
        options: getLanguageOptions(LANGUAGES)
      }, {
        name: 'Audio',
        desc: 'Whether to enable the audio function?',
        type: 'toggle',
        key: 'audio',
        default: false
      }
    ]
  },
  {
    title: 'Microsoft Translator Settings',
    desc: [
      { type: 'text', text: 'For more infomation on using it, refer to ' },
      {
        type: 'href',
        href: 'https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator',
        text: 'https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator'
      },
      { type: 'text', text: '.' }
    ],
    settings: [
      {
        name: 'Enable',
        desc: 'Enable the Microsoft translator service.',
        type: 'toggle',
        key: 'microsoftEnable',
        default: false
      }, {
        name: 'SecretKey',
        desc: 'Please set your secret key.',
        type: 'text',
        key: 'microsoftSecretKey',
        default: ''
      }, {
        name: 'Location',
        desc:'Please set your transaction service location.',
        type: 'text',
        key: 'microsoftLocation',
        default: ''
      }, {
        name: 'From',
        desc: 'Choose which language you wanna translate from.',
        type: 'select',
        key: 'mFrom',
        default: 'en',
        options: getLanguageOptions(MICROSOFT_LANGUAGES)
      }, {
        name: 'To',
        desc: 'Choose which language you wanna translate into.',
        type: 'select',
        key: 'mTo',
        default: 'en',
        options: getLanguageOptions(MICROSOFT_LANGUAGES)
      }
    ]
  },
  {
    title: 'Baidu Translator Settings',
    desc: [
      { type: 'text', text: 'Before using this plugin, you need browse to ' },
      { type: 'href', href: 'http://api.fanyi.baidu.com/', text: 'http://api.fanyi.baidu.com/' },
      { type: 'text', text: 'to register first!' }
    ],
    settings: [
      {
        name: 'Enable',
        desc: 'Enable the baidu translator service.',
        type: 'toggle',
        key: 'baiduEnable',
        default: true
      },
      {
        name: 'AppId',
        desc: 'Please set your baidu app id.',
        type: 'text',
        key: 'baiduAppId',
        default: ''
      }, {
        name: 'SecretKey',
        desc: 'Please set your baidu secret id.',
        type: 'text',
        key: 'baiduSecretKey',
        default: ''
      },
      {
        name: 'From',
        desc: 'Choose which language you wanna translate from.',
        type: 'select',
        key: 'bFrom',
        default: 'en',
        options: getLanguageOptions(BAIDU_LANGUAGES)
      }, {
        name: 'To',
        desc: 'Choose which language you wanna translate into.',
        type: 'select',
        key: 'bTo',
        default: 'en',
        options: getLanguageOptions(BAIDU_LANGUAGES)
      }
      // {
      //   name: 'Audio',
      //   desc: 'Whether to enable the audio function?',
      //   type: 'toggle',
      //   key: 'audio',
      //   default: false
      // }
    ]
  }
]

// desc creator
function createDesc(container: HTMLElement, desc: Array<Desc>) {
  const descEl = container.createEl("p", { cls: 'transaction_container-desc' });
  desc.forEach(({ type, text, href }) => {
    switch(type) {
      case 'text':
        descEl.appendText(text)
        break
      case 'href':
        descEl.appendChild(createEl('a', {
          text, href
        }))
        break
    }
  })
}

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
		// Init settings
    SETTING_BLOCKS.forEach(({ title, settings, desc }) => {
      containerEl.createEl("h6", { text: title })
      desc && createDesc(containerEl, desc)
      settings.forEach(set => {
        const { name, desc, type, key, default: defaultValue, options } = set
        const el = new Setting(containerEl)
          .setName(name)
          .setDesc(desc)
        const val = this.plugin.settings[key as keyof TranslatorSetting]
        switch (type) {
          case 'text':
            el.addText((text) =>
              text
                .setPlaceholder(name)
                .setValue((val || defaultValue) as string)
                .onChange(async (value) => {
                  (this.plugin.settings[key as keyof TranslatorSetting] as string) = value.trim()
                  await this.plugin.saveSettings()
                })
            )
            break
          case 'select':
            el.addDropdown(dp =>
              dp
                .addOptions(options)
                .setValue((val || defaultValue) as string)
                .onChange(async value => {
                  (this.plugin.settings[key as keyof TranslatorSetting] as string) = value
                  await this.plugin.saveSettings()
                })
            )
            break
          case 'toggle':
            el.addToggle(tg => {
              tg
                .setValue((val === undefined ? defaultValue : val) as boolean)
                .onChange(async value => {
                  (this.plugin.settings[key as keyof TranslatorSetting] as boolean) = value
                  await this.plugin.saveSettings()
                })
            })
            break
          default: break
        }
      })
    })
  }
}
