import { App, Modal, Setting } from "obsidian";
import {
  handleTranslate,
  handleAudio,
  isEmptyObject,
  handleMicrosoftTranslate,
  handleBaiduTranslate,
  validator,
  noticeHandler,
  getLanguageOptions,
  LANGUAGES,
  MICROSOFT_LANGUAGES,
  BAIDU_LANGUAGES,
} from "./utils";
import { TranslatorSetting } from "./interfaces";

type SpeakUrls = {
  [key: string]: string;
};

interface ElementObject {
  [key: string]: HTMLDivElement;
}

interface serviceTypes {
  youdao?: string;
  microsoft?: string;
  baidu?: string;
}

const LANGUAGES_MAP = {
  youdao: { key: "yTo", languages: LANGUAGES },
  microsoft: { key: "mTo", languages: MICROSOFT_LANGUAGES },
  baidu: { key: "bTo", languages: BAIDU_LANGUAGES },
};

// translator
export class TranslatorModal extends Modal {
  text: string;
  prevText = "";
  customTo: serviceTypes;
  customToPre: serviceTypes;
  empty: HTMLDivElement;
  settings: TranslatorSetting;

  constructor(app: App, text: string, settings: TranslatorSetting) {
    super(app);
    this.text = text;
    // empty element
    this.empty = createEl("div", {
      cls: "translator_container-empty",
      text: "No results!",
    });
    // get settings
    this.settings = settings;
    this.text = text;
    this.customTo = {
      youdao: "zh-CHS",
      microsoft: "zh-Hans",
      baidu: "zh",
    };
    this.customToPre = {};
  }

  // create title element
  createBlockTitleElement(
    containerEl: HTMLDivElement,
    title: string,
    type: string
  ) {
    const { languages } = LANGUAGES_MAP[type as keyof typeof LANGUAGES_MAP];
    const options = getLanguageOptions(languages);
    const titleContainer = containerEl.appendChild(
      createDiv({
        text: title,
        cls: `translator_container-block-title translator_container-block-title-${type}`,
      })
    );
    new Setting(titleContainer).addDropdown((dp) =>
      dp
        .addOptions(options)
        .setValue(this.customTo[type as keyof serviceTypes] || "")
        .onChange((value) => {
          this.customTo[type as keyof serviceTypes] = value;
        })
    );
  }

  // translate results generator
  translateResultsGenerator(
    contentObject: { title: string; explain: string },
    container: HTMLDivElement
  ) {
    Object.keys(contentObject).forEach((key) => {
      container.appendChild(
        createEl("p", {
          cls: `translator_container-${key}`,
          text: contentObject[key as keyof typeof contentObject],
        })
      );
    });
  }

  createLoadingElement() {
    return createEl("div", {
      cls: "translator_container-overlay",
      text: "Translating...",
    });
  }

  // youdao translate handler
  youdaoTranslateHandler(containerEl: HTMLDivElement) {
    const { yTo: to, yFrom: from, appId, secretKey, audio } = this.settings;
    const preMessage = `Youdao translation service's`;
    const lastMessage = `shouldn't be empty.`;
    validator(
      [
        { value: appId, message: `${preMessage} appId ${lastMessage}` },
        { value: secretKey, message: `${preMessage} secretKey ${lastMessage}` },
      ],
      () => {
        const loadingEl = this.createLoadingElement();
        this.createBlockTitleElement(
          containerEl,
          "Youdao translation results",
          "youdao"
        );
        // add overlay mask
        containerEl.appendChild(loadingEl);
        handleTranslate(
          this.text,
          { to: this.customTo.youdao || to, appId, secretKey, from },
          (data: any) => {
            containerEl.removeChild(loadingEl);
            if (isEmptyObject(data)) {
              containerEl.appendChild(this.empty);
            } else {
              const {
                query,
                translation,
                web,
                basic,
                l,
                webdict,
                tSpeakUrl,
                speakUrl,
              } = data;
              // explain rule
              const [FROM, TO] = l.split("2");

              // be translated word
              containerEl.appendChild(
                createEl("a", {
                  cls: "translator_container-title",
                  text: query,
                  href: webdict ? webdict.url : "",
                })
              );
              // get audioes
              const audioesContainer = createEl("div", {
                cls: "translator_container-audioes",
              });
              if (audio) {
                const speakUrls: SpeakUrls = {
                  origin: speakUrl,
                  result: tSpeakUrl,
                };
                Object.keys(speakUrls).forEach((key: string) => {
                  new Setting(audioesContainer)
                    .setName(`${key}:`)
                    .addButton((btn) => {
                      btn.setIcon("audio-file").onClick(() => {
                        // @ts-ignore
                        document.getElementById(key).play();
                      });
                    });
                  handleAudio(speakUrls[key], (res: any) => {
                    audioesContainer.appendChild(
                      createEl("div", {
                        cls: "translator_container-player",
                      })
                    );
                    audioesContainer.appendChild(
                      createEl("audio", {
                        attr: {
                          src: URL.createObjectURL(
                            new Blob([res.arrayBuffer], { type: "audio/mp3" })
                          ),
                          id: key,
                        },
                      })
                    );
                  });
                });
                containerEl.appendChild(audioesContainer);
              }
              // render explains
              if (basic) {
                // symbol
                let symbolText = basic.phonetic ? `[${basic.phonetic}]` : "";
                if (FROM === "en" && TO === "zh-CHS") {
                  symbolText = `${basic["us-phonetic"] ? `us: [${basic["us-phonetic"]}]` : ""
                    }
    ${basic["uk-phonetic"] ? `uk: [${basic["uk-phonetic"]}]` : ""}`;
                }
                containerEl.appendChild(
                  createEl("p", {
                    cls: "translator_container-soundmark",
                    text: symbolText,
                  })
                );
                // explains
                const explains =
                  FROM === "zh-CHS" && TO === "en"
                    ? [...translation, basic.explains.toString()]
                    : basic.explains;
                explains.forEach((exp: string) => {
                  containerEl.appendChild(
                    createEl("p", {
                      cls: "translator_container-explain",
                      text: exp,
                    })
                  );
                });
                // word forms
                if (basic.wfs) {
                  containerEl.appendChild(
                    createEl("p", {
                      cls: "translator_container-title",
                      text: "Word forms",
                    })
                  );
                  containerEl.appendChild(
                    createEl("p", {
                      cls: "translator_container-wfs",
                      text: basic.wfs
                        .map(
                          (item: { wf: { name: string; value: string } }) =>
                            `${item.wf.name}: ${item.wf.value}`
                        )
                        .join(", "),
                    })
                  );
                }
              } else {
                containerEl.appendChild(
                  createEl("p", {
                    cls: "translator_container-explain",
                    text: translation?.toString(),
                  })
                );
              }
              // other
              if (web) {
                containerEl.appendChild(
                  createEl("p", {
                    cls: "translator_container-title",
                    text: "Other translations",
                  })
                );
                web.forEach((item: { value: string[]; key: string }) => {
                  containerEl.appendChild(
                    createEl("p", {
                      cls: "translator_container-other",
                      text: `${item.key}: ${item.value.toString()}`,
                    })
                  );
                });
              }
            }
          }
        );
      }
    );
  }

  // microsoft translate handler
  microsoftTranslateHandler(containerEl: HTMLDivElement) {
    const loadingEl = this.createLoadingElement();
    const {
      mTo: to,
      mFrom: from,
      microsoftSecretKey,
      microsoftLocation,
    } = this.settings;
    const preMessage = `Microsoft translation service's`;
    const lastMessage = `shouldn't be empty.`;
    validator(
      [
        {
          value: microsoftSecretKey,
          message: `${preMessage} secret key ${lastMessage}`,
        },
        {
          value: microsoftLocation,
          message: `${preMessage} location ${lastMessage}`,
        },
      ],
      () => {
        this.createBlockTitleElement(
          containerEl,
          "Microsoft translation results",
          "microsoft"
        );
        // add overlay mask
        containerEl.appendChild(loadingEl);
        handleMicrosoftTranslate(
          this.text,
          {
            to: this.customTo.microsoft || to,
            from,
            secretKey: microsoftSecretKey,
            location: microsoftLocation,
          },
          (res: string) => {
            containerEl.removeChild(loadingEl);
            const contentObj = {
              title: this.text,
              explain: res,
            };
            this.translateResultsGenerator(contentObj, containerEl);
          }
        );
      }
    );
  }

  // baidu translate handler
  baiduTranslateHandler(containerEl: HTMLDivElement) {
    const { bTo: to, bFrom: from, baiduAppId, baiduSecretKey } = this.settings;
    const preMessage = `Baidu translation service's`;
    const lastMessage = `shouldn't be empty.`;
    validator(
      [
        { value: baiduAppId, message: `${preMessage} appId ${lastMessage}` },
        {
          value: baiduSecretKey,
          message: `${preMessage} secretKey ${lastMessage}`,
        },
      ],
      () => {
        const loadingEl = this.createLoadingElement();
        this.createBlockTitleElement(
          containerEl,
          "Baidu translation results",
          "baidu"
        );
        // add overlay mask
        containerEl.appendChild(loadingEl);
        handleBaiduTranslate(
          this.text,
          {
            to: this.customTo.baidu || to,
            appId: baiduAppId,
            secretKey: baiduSecretKey,
            from,
          },
          (res: any) => {
            if (isEmptyObject(res)) {
              containerEl.appendChild(this.empty);
            } else {
              const { trans_result, error_code } = res;
              if (trans_result) {
                containerEl.removeChild(loadingEl);
                const resData = trans_result.map(
                  ({ src, dst }: { src: string; dst: string }) => ({
                    title: src,
                    explain: dst,
                  })
                );
                resData.forEach(
                  (contentObj: { title: string; explain: string }) => {
                    this.translateResultsGenerator(contentObj, containerEl);
                  }
                );
              } else {
                noticeHandler(`No results! (Code ${error_code})`);
              }
            }
          }
        );
      }
    );
  }

  translate(containerEls: ElementObject) {
    Object.keys(containerEls).forEach((key) => {
      const type = key.replace("Enable", "") as keyof serviceTypes;
      if (
        this.text !== this.prevText ||
        this.customTo[type] !== this.customToPre[type]
      ) {
        const containerEl = containerEls[key];
        containerEl.empty();

        switch (key) {
          case "youdaoEnable": {
            this.customTo[type] = this.settings.yTo;
            this.youdaoTranslateHandler(containerEl);
            break;
          }
          case "microsoftEnable": {
            this.customTo[type] = this.settings.mTo;
            this.microsoftTranslateHandler(containerEl);
            break;
          }
          case "baiduEnable": {
            this.customTo[type] = this.settings.bTo;
            this.baiduTranslateHandler(containerEl);
            break;
          }
          default:
            break;
        }

        this.customToPre[type] = this.customTo[type];
      }
    });
    this.prevText = this.text;
  }

  // poen modal
  onOpen() {
    const { contentEl, settings } = this;
    const enableKeys = Object.keys(settings).filter(
      (key) =>
        key.toLowerCase().includes("enable") &&
        settings[key as keyof TranslatorSetting]
    );
    contentEl.createEl("h1", { text: "Translator", cls: "translator_title" });
    // search
    const setting = new Setting(contentEl)
      .setClass("translator_search")
      .addText((text) =>
        text
          .setValue(this.text)
          .setPlaceholder("To be translated")
          .onChange((value) => {
            this.text = value;
          })
      );
    const containerEls: ElementObject = enableKeys.reduce(
      (els: ElementObject, key: string) => ({
        ...els,
        [key]: contentEl.createDiv({
          cls: `translator_container translator_container-${key.replace(
            "Enable",
            ""
          )}`,
        }),
      }),
      {}
    );

    const translatorHandler = (): void => {
      if (this.text) {
        this.translate(containerEls);
      } else {
        Object.values(containerEls).forEach((el) => el.empty());
      }
    };

    setting.addButton((btn) =>
      btn.setIcon("search").setCta().onClick(translatorHandler)
    );

    if (document) {
      document.onkeydown = (event) => {
        event && event.keyCode === 13 && translatorHandler();
      };
    }

    this.text && this.translate(containerEls);
  }

  // close modal
  onClose() {
    this.contentEl.empty();
    this.text = this.prevText = "";
  }
}
