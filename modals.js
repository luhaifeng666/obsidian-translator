import { Modal, Setting } from "obsidian";
import { handleTranslate, handleAudio, isEmptyObject, handleMicrosoftTranslate, handleBaiduTranslate, validator, noticeHandler, getLanguageOptions, LANGUAGES, MICROSOFT_LANGUAGES, BAIDU_LANGUAGES, } from "./utils";
const LANGUAGES_MAP = {
    youdao: { key: "yTo", languages: LANGUAGES },
    microsoft: { key: "mTo", languages: MICROSOFT_LANGUAGES },
    baidu: { key: "bTo", languages: BAIDU_LANGUAGES },
};
// translator
export class TranslatorModal extends Modal {
    constructor(app, text, settings) {
        super(app);
        this.prevText = "";
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
    createBlockTitleElement(containerEl, title, type) {
        const { languages } = LANGUAGES_MAP[type];
        const options = getLanguageOptions(languages);
        const titleContainer = containerEl.appendChild(createDiv({
            text: title,
            cls: `translator_container-block-title translator_container-block-title-${type}`,
        }));
        new Setting(titleContainer).addDropdown((dp) => dp
            .addOptions(options)
            .setValue(this.customTo[type] || "")
            .onChange((value) => {
            this.customTo[type] = value;
        }));
    }
    // translate results generator
    translateResultsGenerator(contentObject, container) {
        Object.keys(contentObject).forEach((key) => {
            container.appendChild(createEl("p", {
                cls: `translator_container-${key}`,
                text: contentObject[key],
            }));
        });
    }
    createLoadingElement() {
        return createEl("div", {
            cls: "translator_container-overlay",
            text: "Translating...",
        });
    }
    // youdao translate handler
    youdaoTranslateHandler(containerEl) {
        const { yTo: to, yFrom: from, appId, secretKey, audio } = this.settings;
        const preMessage = `Youdao translation service's`;
        const lastMessage = `shouldn't be empty.`;
        validator([
            { value: appId, message: `${preMessage} appId ${lastMessage}` },
            { value: secretKey, message: `${preMessage} secretKey ${lastMessage}` },
        ], () => {
            const loadingEl = this.createLoadingElement();
            this.createBlockTitleElement(containerEl, "Youdao translation results", "youdao");
            // add overlay mask
            containerEl.appendChild(loadingEl);
            handleTranslate(this.text, { to: this.customTo.youdao || to, appId, secretKey, from }, (data) => {
                containerEl.removeChild(loadingEl);
                if (isEmptyObject(data)) {
                    containerEl.appendChild(this.empty);
                }
                else {
                    const { query, translation, web, basic, l, webdict, tSpeakUrl, speakUrl, } = data;
                    // explain rule
                    const [FROM, TO] = l.split("2");
                    // be translated word
                    containerEl.appendChild(createEl("a", {
                        cls: "translator_container-title",
                        text: query,
                        href: webdict ? webdict.url : "",
                    }));
                    // get audioes
                    const audioesContainer = createEl("div", {
                        cls: "translator_container-audioes",
                    });
                    if (audio) {
                        const speakUrls = {
                            origin: speakUrl,
                            result: tSpeakUrl,
                        };
                        Object.keys(speakUrls).forEach((key) => {
                            new Setting(audioesContainer)
                                .setName(`${key}:`)
                                .addButton((btn) => {
                                btn.setIcon("audio-file").onClick(() => {
                                    // @ts-ignore
                                    document.getElementById(key).play();
                                });
                            });
                            handleAudio(speakUrls[key], (res) => {
                                audioesContainer.appendChild(createEl("div", {
                                    cls: "translator_container-player",
                                }));
                                audioesContainer.appendChild(createEl("audio", {
                                    attr: {
                                        src: URL.createObjectURL(new Blob([res.arrayBuffer], { type: "audio/mp3" })),
                                        id: key,
                                    },
                                }));
                            });
                        });
                        containerEl.appendChild(audioesContainer);
                    }
                    // render explains
                    if (basic) {
                        // symbol
                        let symbolText = basic.phonetic ? `[${basic.phonetic}]` : "";
                        if (FROM === "en" && TO === "zh-CHS") {
                            symbolText = `${basic["us-phonetic"] ? `us: [${basic["us-phonetic"]}]` : ""}
    ${basic["uk-phonetic"] ? `uk: [${basic["uk-phonetic"]}]` : ""}`;
                        }
                        containerEl.appendChild(createEl("p", {
                            cls: "translator_container-soundmark",
                            text: symbolText,
                        }));
                        // explains
                        const explains = FROM === "zh-CHS" && TO === "en"
                            ? [...translation, basic.explains.toString()]
                            : basic.explains;
                        explains.forEach((exp) => {
                            containerEl.appendChild(createEl("p", {
                                cls: "translator_container-explain",
                                text: exp,
                            }));
                        });
                        // word forms
                        if (basic.wfs) {
                            containerEl.appendChild(createEl("p", {
                                cls: "translator_container-title",
                                text: "Word forms",
                            }));
                            containerEl.appendChild(createEl("p", {
                                cls: "translator_container-wfs",
                                text: basic.wfs
                                    .map((item) => `${item.wf.name}: ${item.wf.value}`)
                                    .join(", "),
                            }));
                        }
                    }
                    else {
                        containerEl.appendChild(createEl("p", {
                            cls: "translator_container-explain",
                            text: translation === null || translation === void 0 ? void 0 : translation.toString(),
                        }));
                    }
                    // other
                    if (web) {
                        containerEl.appendChild(createEl("p", {
                            cls: "translator_container-title",
                            text: "Other translations",
                        }));
                        web.forEach((item) => {
                            containerEl.appendChild(createEl("p", {
                                cls: "translator_container-other",
                                text: `${item.key}: ${item.value.toString()}`,
                            }));
                        });
                    }
                }
            });
        });
    }
    // microsoft translate handler
    microsoftTranslateHandler(containerEl) {
        const loadingEl = this.createLoadingElement();
        const { mTo: to, mFrom: from, microsoftSecretKey, microsoftLocation, } = this.settings;
        const preMessage = `Microsoft translation service's`;
        const lastMessage = `shouldn't be empty.`;
        validator([
            {
                value: microsoftSecretKey,
                message: `${preMessage} secret key ${lastMessage}`,
            },
            {
                value: microsoftLocation,
                message: `${preMessage} location ${lastMessage}`,
            },
        ], () => {
            this.createBlockTitleElement(containerEl, "Microsoft translation results", "microsoft");
            // add overlay mask
            containerEl.appendChild(loadingEl);
            handleMicrosoftTranslate(this.text, {
                to: this.customTo.microsoft || to,
                from,
                secretKey: microsoftSecretKey,
                location: microsoftLocation,
            }, (res) => {
                containerEl.removeChild(loadingEl);
                const contentObj = {
                    title: this.text,
                    explain: res,
                };
                this.translateResultsGenerator(contentObj, containerEl);
            });
        });
    }
    // baidu translate handler
    baiduTranslateHandler(containerEl) {
        const { bTo: to, bFrom: from, baiduAppId, baiduSecretKey } = this.settings;
        const preMessage = `Baidu translation service's`;
        const lastMessage = `shouldn't be empty.`;
        validator([
            { value: baiduAppId, message: `${preMessage} appId ${lastMessage}` },
            {
                value: baiduSecretKey,
                message: `${preMessage} secretKey ${lastMessage}`,
            },
        ], () => {
            const loadingEl = this.createLoadingElement();
            this.createBlockTitleElement(containerEl, "Baidu translation results", "baidu");
            // add overlay mask
            containerEl.appendChild(loadingEl);
            handleBaiduTranslate(this.text, {
                to: this.customTo.baidu || to,
                appId: baiduAppId,
                secretKey: baiduSecretKey,
                from,
            }, (res) => {
                if (isEmptyObject(res)) {
                    containerEl.appendChild(this.empty);
                }
                else {
                    const { trans_result, error_code } = res;
                    if (trans_result) {
                        containerEl.removeChild(loadingEl);
                        const resData = trans_result.map(({ src, dst }) => ({
                            title: src,
                            explain: dst,
                        }));
                        resData.forEach((contentObj) => {
                            this.translateResultsGenerator(contentObj, containerEl);
                        });
                    }
                    else {
                        noticeHandler(`No results! (Code ${error_code})`);
                    }
                }
            });
        });
    }
    translate(containerEls) {
        Object.keys(containerEls).forEach((key) => {
            const type = key.replace("Enable", "");
            if (this.text !== this.prevText ||
                this.customTo[type] !== this.customToPre[type]) {
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
        const enableKeys = Object.keys(settings).filter((key) => key.toLowerCase().includes("enable") &&
            settings[key]);
        contentEl.createEl("h1", { text: "Translator", cls: "translator_title" });
        // search
        const setting = new Setting(contentEl)
            .setClass("translator_search")
            .addText((text) => text
            .setValue(this.text)
            .setPlaceholder("To be translated")
            .onChange((value) => {
            this.text = value;
        }));
        const containerEls = enableKeys.reduce((els, key) => (Object.assign(Object.assign({}, els), { [key]: contentEl.createDiv({
                cls: `translator_container translator_container-${key.replace("Enable", "")}`,
            }) })), {});
        const translatorHandler = () => {
            if (this.text) {
                this.translate(containerEls);
            }
            else {
                Object.values(containerEls).forEach((el) => el.empty());
            }
        };
        setting.addButton((btn) => btn.setIcon("search").setCta().onClick(translatorHandler));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBTyxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQy9DLE9BQU8sRUFDTCxlQUFlLEVBQ2YsV0FBVyxFQUNYLGFBQWEsRUFDYix3QkFBd0IsRUFDeEIsb0JBQW9CLEVBQ3BCLFNBQVMsRUFDVCxhQUFhLEVBQ2Isa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCxtQkFBbUIsRUFDbkIsZUFBZSxHQUNoQixNQUFNLFNBQVMsQ0FBQztBQWlCakIsTUFBTSxhQUFhLEdBQUc7SUFDcEIsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFO0lBQzVDLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFO0lBQ3pELEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRTtDQUNsRCxDQUFDO0FBRUYsYUFBYTtBQUNiLE1BQU0sT0FBTyxlQUFnQixTQUFRLEtBQUs7SUFReEMsWUFBWSxHQUFRLEVBQUUsSUFBWSxFQUFFLFFBQTJCO1FBQzdELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQVBiLGFBQVEsR0FBRyxFQUFFLENBQUM7UUFRWixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixnQkFBZ0I7UUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFO1lBQzNCLEdBQUcsRUFBRSw0QkFBNEI7WUFDakMsSUFBSSxFQUFFLGFBQWE7U0FDcEIsQ0FBQyxDQUFDO1FBQ0gsZUFBZTtRQUNmLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FB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Q0FBQyxDQUMxRCxDQUFDO1FBRUYsSUFBSSxRQUFRLEVBQUU7WUFDWixRQUFRLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzdCLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLEVBQUUsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3ZELENBQUMsQ0FBQztTQUNIO1FBRUQsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxjQUFjO0lBQ2QsT0FBTztRQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIE1vZGFsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBoYW5kbGVUcmFuc2xhdGUsXG4gIGhhbmRsZUF1ZGlvLFxuICBpc0VtcHR5T2JqZWN0LFxuICBoYW5kbGVNaWNyb3NvZnRUcmFuc2xhdGUsXG4gIGhhbmRsZUJhaWR1VHJhbnNsYXRlLFxuICB2YWxpZGF0b3IsXG4gIG5vdGljZUhhbmRsZXIsXG4gIGdldExhbmd1YWdlT3B0aW9ucyxcbiAgTEFOR1VBR0VTLFxuICBNSUNST1NPRlRfTEFOR1VBR0VTLFxuICBCQUlEVV9MQU5HVUFHRVMsXG59IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBUcmFuc2xhdG9yU2V0dGluZyB9IGZyb20gXCIuL2ludGVyZmFjZXNcIjtcblxudHlwZSBTcGVha1VybHMgPSB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZztcbn07XG5cbmludGVyZmFjZSBFbGVtZW50T2JqZWN0IHtcbiAgW2tleTogc3RyaW5nXTogSFRNTERpdkVsZW1lbnQ7XG59XG5cbmludGVyZmFjZSBzZXJ2aWNlVHlwZXMge1xuICB5b3VkYW8/OiBzdHJpbmc7XG4gIG1pY3Jvc29mdD86IHN0cmluZztcbiAgYmFpZHU/OiBzdHJpbmc7XG59XG5cbmNvbnN0IExBTkdVQUdFU19NQVAgPSB7XG4gIHlvdWRhbzogeyBrZXk6IFwieVRvXCIsIGxhbmd1YWdlczogTEFOR1VBR0VTIH0sXG4gIG1pY3Jvc29mdDogeyBrZXk6IFwibVRvXCIsIGxhbmd1YWdlczogTUlDUk9TT0ZUX0xBTkdVQUdFUyB9LFxuICBiYWlkdTogeyBrZXk6IFwiYlRvXCIsIGxhbmd1YWdlczogQkFJRFVfTEFOR1VBR0VTIH0sXG59O1xuXG4vLyB0cmFuc2xhdG9yXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRvck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHByZXZUZXh0ID0gXCJcIjtcbiAgY3VzdG9tVG86IHNlcnZpY2VUeXBlcztcbiAgY3VzdG9tVG9QcmU6IHNlcnZpY2VUeXBlcztcbiAgZW1wdHk6IEhUTUxEaXZFbGVtZW50O1xuICBzZXR0aW5nczogVHJhbnNsYXRvclNldHRpbmc7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHRleHQ6IHN0cmluZywgc2V0dGluZ3M6IFRyYW5zbGF0b3JTZXR0aW5nKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgIC8vIGVtcHR5IGVsZW1lbnRcbiAgICB0aGlzLmVtcHR5ID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcInRyYW5zbGF0b3JfY29udGFpbmVyLWVtcHR5XCIsXG4gICAgICB0ZXh0OiBcIk5vIHJlc3VsdHMhXCIsXG4gICAgfSk7XG4gICAgLy8gZ2V0IHNldHRpbmdzXG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgdGhpcy5jdXN0b21UbyA9IHtcbiAgICAgIHlvdWRhbzogXCJ6aC1DSFNcIixcbiAgICAgIG1pY3Jvc29mdDogXCJ6aC1IYW5zXCIsXG4gICAgICBiYWlkdTogXCJ6aFwiLFxuICAgIH07XG4gICAgdGhpcy5jdXN0b21Ub1ByZSA9IHt9O1xuICB9XG5cbiAgLy8gY3JlYXRlIHRpdGxlIGVsZW1lbnRcbiAgY3JlYXRlQmxvY2tUaXRsZUVsZW1lbnQoXG4gICAgY29udGFpbmVyRWw6IEhUTUxEaXZFbGVtZW50LFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgdHlwZTogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IHsgbGFuZ3VhZ2VzIH0gPSBMQU5HVUFHRVNfTUFQW3R5cGUgYXMga2V5b2YgdHlwZW9mIExBTkdVQUdFU19NQVBdO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBnZXRMYW5ndWFnZU9wdGlvbnMobGFuZ3VhZ2VzKTtcbiAgICBjb25zdCB0aXRsZUNvbnRhaW5lciA9IGNvbnRhaW5lckVsLmFwcGVuZENoaWxkKFxuICAgICAgY3JlYXRlRGl2KHtcbiAgICAgICAgdGV4dDogdGl0bGUsXG4gICAgICAgIGNsczogYHRyYW5zbGF0b3JfY29udGFpbmVyLWJsb2NrLXRpdGxlIHRyYW5zbGF0b3JfY29udGFpbmVyLWJsb2NrLXRpdGxlLSR7dHlwZX1gLFxuICAgICAgfSlcbiAgICApO1xuICAgIG5ldyBTZXR0aW5nKHRpdGxlQ29udGFpbmVyKS5hZGREcm9wZG93bigoZHApID0+XG4gICAgICBkcFxuICAgICAgICAuYWRkT3B0aW9ucyhvcHRpb25zKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5jdXN0b21Ub1t0eXBlIGFzIGtleW9mIHNlcnZpY2VUeXBlc10gfHwgXCJcIilcbiAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VzdG9tVG9bdHlwZSBhcyBrZXlvZiBzZXJ2aWNlVHlwZXNdID0gdmFsdWU7XG4gICAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8vIHRyYW5zbGF0ZSByZXN1bHRzIGdlbmVyYXRvclxuICB0cmFuc2xhdGVSZXN1bHRzR2VuZXJhdG9yKFxuICAgIGNvbnRlbnRPYmplY3Q6IHsgdGl0bGU6IHN0cmluZzsgZXhwbGFpbjogc3RyaW5nIH0sXG4gICAgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudFxuICApIHtcbiAgICBPYmplY3Qua2V5cyhjb250ZW50T2JqZWN0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChcbiAgICAgICAgY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgICBjbHM6IGB0cmFuc2xhdG9yX2NvbnRhaW5lci0ke2tleX1gLFxuICAgICAgICAgIHRleHQ6IGNvbnRlbnRPYmplY3Rba2V5IGFzIGtleW9mIHR5cGVvZiBjb250ZW50T2JqZWN0XSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVMb2FkaW5nRWxlbWVudCgpIHtcbiAgICByZXR1cm4gY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcInRyYW5zbGF0b3JfY29udGFpbmVyLW92ZXJsYXlcIixcbiAgICAgIHRleHQ6IFwiVHJhbnNsYXRpbmcuLi5cIixcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHlvdWRhbyB0cmFuc2xhdGUgaGFuZGxlclxuICB5b3VkYW9UcmFuc2xhdGVIYW5kbGVyKGNvbnRhaW5lckVsOiBIVE1MRGl2RWxlbWVudCkge1xuICAgIGNvbnN0IHsgeVRvOiB0bywgeUZyb206IGZyb20sIGFwcElkLCBzZWNyZXRLZXksIGF1ZGlvIH0gPSB0aGlzLnNldHRpbmdzO1xuICAgIGNvbnN0IHByZU1lc3NhZ2UgPSBgWW91ZGFvIHRyYW5zbGF0aW9uIHNlcnZpY2Unc2A7XG4gICAgY29uc3QgbGFzdE1lc3NhZ2UgPSBgc2hvdWxkbid0IGJlIGVtcHR5LmA7XG4gICAgdmFsaWRhdG9yKFxuICAgICAgW1xuICAgICAgICB7IHZhbHVlOiBhcHBJZCwgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gYXBwSWQgJHtsYXN0TWVzc2FnZX1gIH0sXG4gICAgICAgIHsgdmFsdWU6IHNlY3JldEtleSwgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gc2VjcmV0S2V5ICR7bGFzdE1lc3NhZ2V9YCB9LFxuICAgICAgXSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc3QgbG9hZGluZ0VsID0gdGhpcy5jcmVhdGVMb2FkaW5nRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrVGl0bGVFbGVtZW50KFxuICAgICAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgICAgIFwiWW91ZGFvIHRyYW5zbGF0aW9uIHJlc3VsdHNcIixcbiAgICAgICAgICBcInlvdWRhb1wiXG4gICAgICAgICk7XG4gICAgICAgIC8vIGFkZCBvdmVybGF5IG1hc2tcbiAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQobG9hZGluZ0VsKTtcbiAgICAgICAgaGFuZGxlVHJhbnNsYXRlKFxuICAgICAgICAgIHRoaXMudGV4dCxcbiAgICAgICAgICB7IHRvOiB0aGlzLmN1c3RvbVRvLnlvdWRhbyB8fCB0bywgYXBwSWQsIHNlY3JldEtleSwgZnJvbSB9LFxuICAgICAgICAgIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckVsLnJlbW92ZUNoaWxkKGxvYWRpbmdFbCk7XG4gICAgICAgICAgICBpZiAoaXNFbXB0eU9iamVjdChkYXRhKSkge1xuICAgICAgICAgICAgICBjb250YWluZXJFbC5hcHBlbmRDaGlsZCh0aGlzLmVtcHR5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGlvbixcbiAgICAgICAgICAgICAgICB3ZWIsXG4gICAgICAgICAgICAgICAgYmFzaWMsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICB3ZWJkaWN0LFxuICAgICAgICAgICAgICAgIHRTcGVha1VybCxcbiAgICAgICAgICAgICAgICBzcGVha1VybCxcbiAgICAgICAgICAgICAgfSA9IGRhdGE7XG4gICAgICAgICAgICAgIC8vIGV4cGxhaW4gcnVsZVxuICAgICAgICAgICAgICBjb25zdCBbRlJPTSwgVE9dID0gbC5zcGxpdChcIjJcIik7XG5cbiAgICAgICAgICAgICAgLy8gYmUgdHJhbnNsYXRlZCB3b3JkXG4gICAgICAgICAgICAgIGNvbnRhaW5lckVsLmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgIGNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICAgICAgICAgICAgICBjbHM6IFwidHJhbnNsYXRvcl9jb250YWluZXItdGl0bGVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgaHJlZjogd2ViZGljdCA/IHdlYmRpY3QudXJsIDogXCJcIixcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAvLyBnZXQgYXVkaW9lc1xuICAgICAgICAgICAgICBjb25zdCBhdWRpb2VzQ29udGFpbmVyID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgICAgICAgICAgIGNsczogXCJ0cmFuc2xhdG9yX2NvbnRhaW5lci1hdWRpb2VzXCIsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAoYXVkaW8pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGVha1VybHM6IFNwZWFrVXJscyA9IHtcbiAgICAgICAgICAgICAgICAgIG9yaWdpbjogc3BlYWtVcmwsXG4gICAgICAgICAgICAgICAgICByZXN1bHQ6IHRTcGVha1VybCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHNwZWFrVXJscykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgIG5ldyBTZXR0aW5nKGF1ZGlvZXNDb250YWluZXIpXG4gICAgICAgICAgICAgICAgICAgIC5zZXROYW1lKGAke2tleX06YClcbiAgICAgICAgICAgICAgICAgICAgLmFkZEJ1dHRvbigoYnRuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgYnRuLnNldEljb24oXCJhdWRpby1maWxlXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoa2V5KS5wbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgaGFuZGxlQXVkaW8oc3BlYWtVcmxzW2tleV0sIChyZXM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhdWRpb2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsczogXCJ0cmFuc2xhdG9yX2NvbnRhaW5lci1wbGF5ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBhdWRpb2VzQ29udGFpbmVyLmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUVsKFwiYXVkaW9cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6IFVSTC5jcmVhdGVPYmplY3RVUkwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEJsb2IoW3Jlcy5hcnJheUJ1ZmZlcl0sIHsgdHlwZTogXCJhdWRpby9tcDNcIiB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDoga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQoYXVkaW9lc0NvbnRhaW5lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gcmVuZGVyIGV4cGxhaW5zXG4gICAgICAgICAgICAgIGlmIChiYXNpYykge1xuICAgICAgICAgICAgICAgIC8vIHN5bWJvbFxuICAgICAgICAgICAgICAgIGxldCBzeW1ib2xUZXh0ID0gYmFzaWMucGhvbmV0aWMgPyBgWyR7YmFzaWMucGhvbmV0aWN9XWAgOiBcIlwiO1xuICAgICAgICAgICAgICAgIGlmIChGUk9NID09PSBcImVuXCIgJiYgVE8gPT09IFwiemgtQ0hTXCIpIHtcbiAgICAgICAgICAgICAgICAgIHN5bWJvbFRleHQgPSBgJHtiYXNpY1tcInVzLXBob25ldGljXCJdID8gYHVzOiBbJHtiYXNpY1tcInVzLXBob25ldGljXCJdfV1gIDogXCJcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgJHtiYXNpY1tcInVrLXBob25ldGljXCJdID8gYHVrOiBbJHtiYXNpY1tcInVrLXBob25ldGljXCJdfV1gIDogXCJcIn1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250YWluZXJFbC5hcHBlbmRDaGlsZChcbiAgICAgICAgICAgICAgICAgIGNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGNsczogXCJ0cmFuc2xhdG9yX2NvbnRhaW5lci1zb3VuZG1hcmtcIixcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogc3ltYm9sVGV4dCxcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBleHBsYWluc1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cGxhaW5zID1cbiAgICAgICAgICAgICAgICAgIEZST00gPT09IFwiemgtQ0hTXCIgJiYgVE8gPT09IFwiZW5cIlxuICAgICAgICAgICAgICAgICAgICA/IFsuLi50cmFuc2xhdGlvbiwgYmFzaWMuZXhwbGFpbnMudG9TdHJpbmcoKV1cbiAgICAgICAgICAgICAgICAgICAgOiBiYXNpYy5leHBsYWlucztcbiAgICAgICAgICAgICAgICBleHBsYWlucy5mb3JFYWNoKChleHA6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQoXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgY2xzOiBcInRyYW5zbGF0b3JfY29udGFpbmVyLWV4cGxhaW5cIixcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBleHAsXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIHdvcmQgZm9ybXNcbiAgICAgICAgICAgICAgICBpZiAoYmFzaWMud2ZzKSB7XG4gICAgICAgICAgICAgICAgICBjb250YWluZXJFbC5hcHBlbmRDaGlsZChcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwidHJhbnNsYXRvcl9jb250YWluZXItdGl0bGVcIixcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIldvcmQgZm9ybXNcIixcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb250YWluZXJFbC5hcHBlbmRDaGlsZChcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwidHJhbnNsYXRvcl9jb250YWluZXItd2ZzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgdGV4dDogYmFzaWMud2ZzXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAoaXRlbTogeyB3ZjogeyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfSB9KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2l0ZW0ud2YubmFtZX06ICR7aXRlbS53Zi52YWx1ZX1gXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAuam9pbihcIiwgXCIpLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQoXG4gICAgICAgICAgICAgICAgICBjcmVhdGVFbChcInBcIiwge1xuICAgICAgICAgICAgICAgICAgICBjbHM6IFwidHJhbnNsYXRvcl9jb250YWluZXItZXhwbGFpblwiLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0cmFuc2xhdGlvbj8udG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBvdGhlclxuICAgICAgICAgICAgICBpZiAod2ViKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWwuYXBwZW5kQ2hpbGQoXG4gICAgICAgICAgICAgICAgICBjcmVhdGVFbChcInBcIiwge1xuICAgICAgICAgICAgICAgICAgICBjbHM6IFwidHJhbnNsYXRvcl9jb250YWluZXItdGl0bGVcIixcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPdGhlciB0cmFuc2xhdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB3ZWIuZm9yRWFjaCgoaXRlbTogeyB2YWx1ZTogc3RyaW5nW107IGtleTogc3RyaW5nIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsLmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVFbChcInBcIiwge1xuICAgICAgICAgICAgICAgICAgICAgIGNsczogXCJ0cmFuc2xhdG9yX2NvbnRhaW5lci1vdGhlclwiLFxuICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGAke2l0ZW0ua2V5fTogJHtpdGVtLnZhbHVlLnRvU3RyaW5nKCl9YCxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8vIG1pY3Jvc29mdCB0cmFuc2xhdGUgaGFuZGxlclxuICBtaWNyb3NvZnRUcmFuc2xhdGVIYW5kbGVyKGNvbnRhaW5lckVsOiBIVE1MRGl2RWxlbWVudCkge1xuICAgIGNvbnN0IGxvYWRpbmdFbCA9IHRoaXMuY3JlYXRlTG9hZGluZ0VsZW1lbnQoKTtcbiAgICBjb25zdCB7XG4gICAgICBtVG86IHRvLFxuICAgICAgbUZyb206IGZyb20sXG4gICAgICBtaWNyb3NvZnRTZWNyZXRLZXksXG4gICAgICBtaWNyb3NvZnRMb2NhdGlvbixcbiAgICB9ID0gdGhpcy5zZXR0aW5ncztcbiAgICBjb25zdCBwcmVNZXNzYWdlID0gYE1pY3Jvc29mdCB0cmFuc2xhdGlvbiBzZXJ2aWNlJ3NgO1xuICAgIGNvbnN0IGxhc3RNZXNzYWdlID0gYHNob3VsZG4ndCBiZSBlbXB0eS5gO1xuICAgIHZhbGlkYXRvcihcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIHZhbHVlOiBtaWNyb3NvZnRTZWNyZXRLZXksXG4gICAgICAgICAgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gc2VjcmV0IGtleSAke2xhc3RNZXNzYWdlfWAsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogbWljcm9zb2Z0TG9jYXRpb24sXG4gICAgICAgICAgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gbG9jYXRpb24gJHtsYXN0TWVzc2FnZX1gLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy5jcmVhdGVCbG9ja1RpdGxlRWxlbWVudChcbiAgICAgICAgICBjb250YWluZXJFbCxcbiAgICAgICAgICBcIk1pY3Jvc29mdCB0cmFuc2xhdGlvbiByZXN1bHRzXCIsXG4gICAgICAgICAgXCJtaWNyb3NvZnRcIlxuICAgICAgICApO1xuICAgICAgICAvLyBhZGQgb3ZlcmxheSBtYXNrXG4gICAgICAgIGNvbnRhaW5lckVsLmFwcGVuZENoaWxkKGxvYWRpbmdFbCk7XG4gICAgICAgIGhhbmRsZU1pY3Jvc29mdFRyYW5zbGF0ZShcbiAgICAgICAgICB0aGlzLnRleHQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdG86IHRoaXMuY3VzdG9tVG8ubWljcm9zb2Z0IHx8IHRvLFxuICAgICAgICAgICAgZnJvbSxcbiAgICAgICAgICAgIHNlY3JldEtleTogbWljcm9zb2Z0U2VjcmV0S2V5LFxuICAgICAgICAgICAgbG9jYXRpb246IG1pY3Jvc29mdExvY2F0aW9uLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKHJlczogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb250YWluZXJFbC5yZW1vdmVDaGlsZChsb2FkaW5nRWwpO1xuICAgICAgICAgICAgY29uc3QgY29udGVudE9iaiA9IHtcbiAgICAgICAgICAgICAgdGl0bGU6IHRoaXMudGV4dCxcbiAgICAgICAgICAgICAgZXhwbGFpbjogcmVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNsYXRlUmVzdWx0c0dlbmVyYXRvcihjb250ZW50T2JqLCBjb250YWluZXJFbCk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICAvLyBiYWlkdSB0cmFuc2xhdGUgaGFuZGxlclxuICBiYWlkdVRyYW5zbGF0ZUhhbmRsZXIoY29udGFpbmVyRWw6IEhUTUxEaXZFbGVtZW50KSB7XG4gICAgY29uc3QgeyBiVG86IHRvLCBiRnJvbTogZnJvbSwgYmFpZHVBcHBJZCwgYmFpZHVTZWNyZXRLZXkgfSA9IHRoaXMuc2V0dGluZ3M7XG4gICAgY29uc3QgcHJlTWVzc2FnZSA9IGBCYWlkdSB0cmFuc2xhdGlvbiBzZXJ2aWNlJ3NgO1xuICAgIGNvbnN0IGxhc3RNZXNzYWdlID0gYHNob3VsZG4ndCBiZSBlbXB0eS5gO1xuICAgIHZhbGlkYXRvcihcbiAgICAgIFtcbiAgICAgICAgeyB2YWx1ZTogYmFpZHVBcHBJZCwgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gYXBwSWQgJHtsYXN0TWVzc2FnZX1gIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogYmFpZHVTZWNyZXRLZXksXG4gICAgICAgICAgbWVzc2FnZTogYCR7cHJlTWVzc2FnZX0gc2VjcmV0S2V5ICR7bGFzdE1lc3NhZ2V9YCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxvYWRpbmdFbCA9IHRoaXMuY3JlYXRlTG9hZGluZ0VsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5jcmVhdGVCbG9ja1RpdGxlRWxlbWVudChcbiAgICAgICAgICBjb250YWluZXJFbCxcbiAgICAgICAgICBcIkJhaWR1IHRyYW5zbGF0aW9uIHJlc3VsdHNcIixcbiAgICAgICAgICBcImJhaWR1XCJcbiAgICAgICAgKTtcbiAgICAgICAgLy8gYWRkIG92ZXJsYXkgbWFza1xuICAgICAgICBjb250YWluZXJFbC5hcHBlbmRDaGlsZChsb2FkaW5nRWwpO1xuICAgICAgICBoYW5kbGVCYWlkdVRyYW5zbGF0ZShcbiAgICAgICAgICB0aGlzLnRleHQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdG86IHRoaXMuY3VzdG9tVG8uYmFpZHUgfHwgdG8sXG4gICAgICAgICAgICBhcHBJZDogYmFpZHVBcHBJZCxcbiAgICAgICAgICAgIHNlY3JldEtleTogYmFpZHVTZWNyZXRLZXksXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKHJlczogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNFbXB0eU9iamVjdChyZXMpKSB7XG4gICAgICAgICAgICAgIGNvbnRhaW5lckVsLmFwcGVuZENoaWxkKHRoaXMuZW1wdHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgeyB0cmFuc19yZXN1bHQsIGVycm9yX2NvZGUgfSA9IHJlcztcbiAgICAgICAgICAgICAgaWYgKHRyYW5zX3Jlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsLnJlbW92ZUNoaWxkKGxvYWRpbmdFbCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzRGF0YSA9IHRyYW5zX3Jlc3VsdC5tYXAoXG4gICAgICAgICAgICAgICAgICAoeyBzcmMsIGRzdCB9OiB7IHNyYzogc3RyaW5nOyBkc3Q6IHN0cmluZyB9KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogc3JjLFxuICAgICAgICAgICAgICAgICAgICBleHBsYWluOiBkc3QsXG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVzRGF0YS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgKGNvbnRlbnRPYmo6IHsgdGl0bGU6IHN0cmluZzsgZXhwbGFpbjogc3RyaW5nIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVSZXN1bHRzR2VuZXJhdG9yKGNvbnRlbnRPYmosIGNvbnRhaW5lckVsKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vdGljZUhhbmRsZXIoYE5vIHJlc3VsdHMhIChDb2RlICR7ZXJyb3JfY29kZX0pYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHRyYW5zbGF0ZShjb250YWluZXJFbHM6IEVsZW1lbnRPYmplY3QpIHtcbiAgICBPYmplY3Qua2V5cyhjb250YWluZXJFbHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgY29uc3QgdHlwZSA9IGtleS5yZXBsYWNlKFwiRW5hYmxlXCIsIFwiXCIpIGFzIGtleW9mIHNlcnZpY2VUeXBlcztcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy50ZXh0ICE9PSB0aGlzLnByZXZUZXh0IHx8XG4gICAgICAgIHRoaXMuY3VzdG9tVG9bdHlwZV0gIT09IHRoaXMuY3VzdG9tVG9QcmVbdHlwZV1cbiAgICAgICkge1xuICAgICAgICBjb25zdCBjb250YWluZXJFbCA9IGNvbnRhaW5lckVsc1trZXldO1xuICAgICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgY2FzZSBcInlvdWRhb0VuYWJsZVwiOiB7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbVRvW3R5cGVdID0gdGhpcy5zZXR0aW5ncy55VG87XG4gICAgICAgICAgICB0aGlzLnlvdWRhb1RyYW5zbGF0ZUhhbmRsZXIoY29udGFpbmVyRWwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgXCJtaWNyb3NvZnRFbmFibGVcIjoge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21Ub1t0eXBlXSA9IHRoaXMuc2V0dGluZ3MubVRvO1xuICAgICAgICAgICAgdGhpcy5taWNyb3NvZnRUcmFuc2xhdGVIYW5kbGVyKGNvbnRhaW5lckVsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIFwiYmFpZHVFbmFibGVcIjoge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21Ub1t0eXBlXSA9IHRoaXMuc2V0dGluZ3MuYlRvO1xuICAgICAgICAgICAgdGhpcy5iYWlkdVRyYW5zbGF0ZUhhbmRsZXIoY29udGFpbmVyRWwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VzdG9tVG9QcmVbdHlwZV0gPSB0aGlzLmN1c3RvbVRvW3R5cGVdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMucHJldlRleHQgPSB0aGlzLnRleHQ7XG4gIH1cblxuICAvLyBwb2VuIG1vZGFsXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCwgc2V0dGluZ3MgfSA9IHRoaXM7XG4gICAgY29uc3QgZW5hYmxlS2V5cyA9IE9iamVjdC5rZXlzKHNldHRpbmdzKS5maWx0ZXIoXG4gICAgICAoa2V5KSA9PlxuICAgICAgICBrZXkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImVuYWJsZVwiKSAmJlxuICAgICAgICBzZXR0aW5nc1trZXkgYXMga2V5b2YgVHJhbnNsYXRvclNldHRpbmddXG4gICAgKTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoMVwiLCB7IHRleHQ6IFwiVHJhbnNsYXRvclwiLCBjbHM6IFwidHJhbnNsYXRvcl90aXRsZVwiIH0pO1xuICAgIC8vIHNlYXJjaFxuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0Q2xhc3MoXCJ0cmFuc2xhdG9yX3NlYXJjaFwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy50ZXh0KVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIlRvIGJlIHRyYW5zbGF0ZWRcIilcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB2YWx1ZTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgICBjb25zdCBjb250YWluZXJFbHM6IEVsZW1lbnRPYmplY3QgPSBlbmFibGVLZXlzLnJlZHVjZShcbiAgICAgIChlbHM6IEVsZW1lbnRPYmplY3QsIGtleTogc3RyaW5nKSA9PiAoe1xuICAgICAgICAuLi5lbHMsXG4gICAgICAgIFtrZXldOiBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgICAgICBjbHM6IGB0cmFuc2xhdG9yX2NvbnRhaW5lciB0cmFuc2xhdG9yX2NvbnRhaW5lci0ke2tleS5yZXBsYWNlKFxuICAgICAgICAgICAgXCJFbmFibGVcIixcbiAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICApfWAsXG4gICAgICAgIH0pLFxuICAgICAgfSksXG4gICAgICB7fVxuICAgICk7XG5cbiAgICBjb25zdCB0cmFuc2xhdG9ySGFuZGxlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGlmICh0aGlzLnRleHQpIHtcbiAgICAgICAgdGhpcy50cmFuc2xhdGUoY29udGFpbmVyRWxzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC52YWx1ZXMoY29udGFpbmVyRWxzKS5mb3JFYWNoKChlbCkgPT4gZWwuZW1wdHkoKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNldHRpbmcuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICBidG4uc2V0SWNvbihcInNlYXJjaFwiKS5zZXRDdGEoKS5vbkNsaWNrKHRyYW5zbGF0b3JIYW5kbGVyKVxuICAgICk7XG5cbiAgICBpZiAoZG9jdW1lbnQpIHtcbiAgICAgIGRvY3VtZW50Lm9ua2V5ZG93biA9IChldmVudCkgPT4ge1xuICAgICAgICBldmVudCAmJiBldmVudC5rZXlDb2RlID09PSAxMyAmJiB0cmFuc2xhdG9ySGFuZGxlcigpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLnRleHQgJiYgdGhpcy50cmFuc2xhdGUoY29udGFpbmVyRWxzKTtcbiAgfVxuXG4gIC8vIGNsb3NlIG1vZGFsXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLnRleHQgPSB0aGlzLnByZXZUZXh0ID0gXCJcIjtcbiAgfVxufVxuIl19