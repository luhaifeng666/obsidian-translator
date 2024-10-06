import { __awaiter } from "tslib";
import { PluginSettingTab, Setting } from "obsidian";
import { getLanguageOptions, LANGUAGES, MICROSOFT_LANGUAGES, BAIDU_LANGUAGES, } from "./utils";
const SETTING_BLOCKS = [
    {
        title: "Youdao Translator Settings",
        desc: [
            { type: "text", text: "Before using this plugin, you need browse to " },
            {
                type: "href",
                href: "https://ai.youdao.com/#/",
                text: "https://ai.youdao.com/#/",
            },
            { type: "text", text: "to register first!" },
        ],
        settings: [
            {
                name: "Enable",
                desc: "Enable the youdao translator service.",
                type: "toggle",
                key: "youdaoEnable",
                default: true,
            },
            {
                name: "AppId",
                desc: "Please set your app id.",
                type: "text",
                key: "appId",
                default: "",
            },
            {
                name: "SecretKey",
                desc: "Please set your secret id.",
                type: "text",
                key: "secretKey",
                default: "",
            },
            {
                name: "From",
                desc: "Choose which language you wanna translate from.",
                type: "select",
                key: "yFrom",
                default: "en",
                options: getLanguageOptions(LANGUAGES),
            },
            {
                name: "To",
                desc: "Choose which language you wanna translate into.",
                type: "select",
                key: "yTo",
                default: "zh-CHS",
                options: getLanguageOptions(LANGUAGES),
            },
            {
                name: "Audio",
                desc: "Whether to enable the audio function?",
                type: "toggle",
                key: "audio",
                default: false,
            },
        ],
    },
    {
        title: "Microsoft Translator Settings",
        desc: [
            { type: "text", text: "For more infomation on using it, refer to " },
            {
                type: "href",
                href: "https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator",
                text: "https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator",
            },
            { type: "text", text: "." },
        ],
        settings: [
            {
                name: "Enable",
                desc: "Enable the Microsoft translator service.",
                type: "toggle",
                key: "microsoftEnable",
                default: false,
            },
            {
                name: "SecretKey",
                desc: "Please set your secret key.",
                type: "text",
                key: "microsoftSecretKey",
                default: "",
            },
            {
                name: "Location",
                desc: "Please set your transaction service location.",
                type: "text",
                key: "microsoftLocation",
                default: "",
            },
            {
                name: "From",
                desc: "Choose which language you wanna translate from.",
                type: "select",
                key: "mFrom",
                default: "en",
                options: getLanguageOptions(MICROSOFT_LANGUAGES),
            },
            {
                name: "To",
                desc: "Choose which language you wanna translate into.",
                type: "select",
                key: "mTo",
                default: "zh-Hans",
                options: getLanguageOptions(MICROSOFT_LANGUAGES),
            },
        ],
    },
    {
        title: "Baidu Translator Settings",
        desc: [
            { type: "text", text: "Before using this plugin, you need browse to " },
            {
                type: "href",
                href: "http://api.fanyi.baidu.com/",
                text: "http://api.fanyi.baidu.com/",
            },
            { type: "text", text: "to register first!" },
        ],
        settings: [
            {
                name: "Enable",
                desc: "Enable the baidu translator service.",
                type: "toggle",
                key: "baiduEnable",
                default: true,
            },
            {
                name: "AppId",
                desc: "Please set your baidu app id.",
                type: "text",
                key: "baiduAppId",
                default: "",
            },
            {
                name: "SecretKey",
                desc: "Please set your baidu secret id.",
                type: "text",
                key: "baiduSecretKey",
                default: "",
            },
            {
                name: "From",
                desc: "Choose which language you wanna translate from.",
                type: "select",
                key: "bFrom",
                default: "en",
                options: getLanguageOptions(BAIDU_LANGUAGES),
            },
            {
                name: "To",
                desc: "Choose which language you wanna translate into.",
                type: "select",
                key: "bTo",
                default: "zh",
                options: getLanguageOptions(BAIDU_LANGUAGES),
            },
            // {
            //   name: 'Audio',
            //   desc: 'Whether to enable the audio function?',
            //   type: 'toggle',
            //   key: 'audio',
            //   default: false
            // }
        ],
    },
];
// desc creator
function createDesc(container, desc) {
    const descEl = container.createEl("p", { cls: "transaction_container-desc" });
    desc.forEach(({ type, text, href }) => {
        switch (type) {
            case "text":
                descEl.appendText(text);
                break;
            case "href":
                descEl.appendChild(createEl("a", {
                    text,
                    href,
                }));
                break;
        }
    });
}
export class TranslatorSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        // Add Setting title
        containerEl.createEl("h2", { text: "Translator Settings" });
        // Init settings
        SETTING_BLOCKS.forEach(({ title, settings, desc }) => {
            containerEl.createEl("h6", { text: title });
            desc && createDesc(containerEl, desc);
            settings.forEach((set) => {
                const { name, desc, type, key, default: defaultValue, options } = set;
                const el = new Setting(containerEl).setName(name).setDesc(desc);
                const val = this.plugin.settings[key];
                switch (type) {
                    case "text":
                        el.addText((text) => text
                            .setPlaceholder(name)
                            .setValue((val || defaultValue))
                            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                            this.plugin.settings[key] = value.trim();
                            yield this.plugin.saveSettings();
                        })));
                        break;
                    case "select":
                        el.addDropdown((dp) => dp
                            .addOptions(options || {})
                            .setValue((val || defaultValue))
                            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                            this.plugin.settings[key] = value;
                            yield this.plugin.saveSettings();
                        })));
                        break;
                    case "toggle":
                        el.addToggle((tg) => {
                            tg.setValue((val === undefined ? defaultValue : val)).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                                this.plugin.settings[key] = value;
                                yield this.plugin.saveSettings();
                            }));
                        });
                        break;
                    default:
                        break;
                }
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsT0FBTyxFQUFPLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMxRCxPQUFPLEVBQ04sa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCxtQkFBbUIsRUFDbkIsZUFBZSxHQUNmLE1BQU0sU0FBUyxDQUFDO0FBd0JqQixNQUFNLGNBQWMsR0FBaUI7SUFDcEM7UUFDQyxLQUFLLEVBQUUsNEJBQTRCO1FBQ25DLElBQUksRUFBRTtZQUNMLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0NBQStDLEVBQUU7WUFDdkU7Z0JBQ0MsSUFBSSxFQUFFLE1BQU07Z0JBQ1osSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsSUFBSSxFQUFFLDBCQUEwQjthQUNoQztZQUNELEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7U0FDNUM7UUFDRCxRQUFRLEVBQUU7WUFDVDtnQkFDQyxJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsdUNBQXVDO2dCQUM3QyxJQUFJLEVBQUUsUUFBUTtnQkFDZCxHQUFHLEVBQUUsY0FBYztnQkFDbkIsT0FBTyxFQUFFLElBQUk7YUFDYjtZQUNEO2dCQUNDLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSx5QkFBeUI7Z0JBQy9CLElBQUksRUFBRSxNQUFNO2dCQUNaLEdBQUcsRUFBRSxPQUFPO2dCQUNaLE9BQU8sRUFBRSxFQUFFO2FBQ1g7WUFDRDtnQkFDQyxJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLDRCQUE0QjtnQkFDbEMsSUFBSSxFQUFFLE1BQU07Z0JBQ1osR0FBRyxFQUFFLFdBQVc7Z0JBQ2hCLE9BQU8sRUFBRSxFQUFFO2FBQ1g7WUFDRDtnQkFDQyxJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUs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LENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBWSxDQUNuRCxDQUFDLFFBQVEsQ0FBQyxDQUFPLEtBQUssRUFBRSxFQUFFO2dDQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FDcEIsR0FBOEIsQ0FDbEIsR0FBRyxLQUFLLENBQUM7Z0NBQ3RCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQzs0QkFDbEMsQ0FBQyxDQUFBLENBQUMsQ0FBQzt3QkFDSixDQUFDLENBQUMsQ0FBQzt3QkFDSCxNQUFNO29CQUNQO3dCQUNDLE1BQU07aUJBQ1A7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRyYW5zbGF0b3JQbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuXHRnZXRMYW5ndWFnZU9wdGlvbnMsXG5cdExBTkdVQUdFUyxcblx0TUlDUk9TT0ZUX0xBTkdVQUdFUyxcblx0QkFJRFVfTEFOR1VBR0VTLFxufSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgVHJhbnNsYXRvclNldHRpbmcgfSBmcm9tIFwiLi9pbnRlcmZhY2VzXCI7XG5cbmludGVyZmFjZSBEZXNjIHtcblx0dHlwZTogc3RyaW5nO1xuXHRocmVmPzogc3RyaW5nO1xuXHR0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBTZXR0aW5nSXRlbSB7XG5cdG5hbWU6IHN0cmluZztcblx0dHlwZTogc3RyaW5nO1xuXHRrZXk6IHN0cmluZztcblx0ZGVzYzogc3RyaW5nO1xuXHRkZWZhdWx0OiBib29sZWFuIHwgc3RyaW5nO1xuXHRvcHRpb25zPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbn1cblxuaW50ZXJmYWNlIEJsb2NrIHtcblx0dGl0bGU6IHN0cmluZztcblx0ZGVzYz86IEFycmF5PERlc2M+O1xuXHRzZXR0aW5nczogQXJyYXk8U2V0dGluZ0l0ZW0+O1xufVxuXG5jb25zdCBTRVRUSU5HX0JMT0NLUzogQXJyYXk8QmxvY2s+ID0gW1xuXHR7XG5cdFx0dGl0bGU6IFwiWW91ZGFvIFRyYW5zbGF0b3IgU2V0dGluZ3NcIixcblx0XHRkZXNjOiBbXG5cdFx0XHR7IHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIkJlZm9yZSB1c2luZyB0aGlzIHBsdWdpbiwgeW91IG5lZWQgYnJvd3NlIHRvIFwiIH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6IFwiaHJlZlwiLFxuXHRcdFx0XHRocmVmOiBcImh0dHBzOi8vYWkueW91ZGFvLmNvbS8jL1wiLFxuXHRcdFx0XHR0ZXh0OiBcImh0dHBzOi8vYWkueW91ZGFvLmNvbS8jL1wiLFxuXHRcdFx0fSxcblx0XHRcdHsgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IFwidG8gcmVnaXN0ZXIgZmlyc3QhXCIgfSxcblx0XHRdLFxuXHRcdHNldHRpbmdzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwiRW5hYmxlXCIsXG5cdFx0XHRcdGRlc2M6IFwiRW5hYmxlIHRoZSB5b3VkYW8gdHJhbnNsYXRvciBzZXJ2aWNlLlwiLFxuXHRcdFx0XHR0eXBlOiBcInRvZ2dsZVwiLFxuXHRcdFx0XHRrZXk6IFwieW91ZGFvRW5hYmxlXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIkFwcElkXCIsXG5cdFx0XHRcdGRlc2M6IFwiUGxlYXNlIHNldCB5b3VyIGFwcCBpZC5cIixcblx0XHRcdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0XHRcdGtleTogXCJhcHBJZFwiLFxuXHRcdFx0XHRkZWZhdWx0OiBcIlwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJTZWNyZXRLZXlcIixcblx0XHRcdFx0ZGVzYzogXCJQbGVhc2Ugc2V0IHlvdXIgc2VjcmV0IGlkLlwiLFxuXHRcdFx0XHR0eXBlOiBcInRleHRcIixcblx0XHRcdFx0a2V5OiBcInNlY3JldEtleVwiLFxuXHRcdFx0XHRkZWZhdWx0OiBcIlwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJGcm9tXCIsXG5cdFx0XHRcdGRlc2M6IFwiQ2hvb3NlIHdoaWNoIGxhbmd1YWdlIHlvdSB3YW5uYSB0cmFuc2xhdGUgZnJvbS5cIixcblx0XHRcdFx0dHlwZTogXCJzZWxlY3RcIixcblx0XHRcdFx0a2V5OiBcInlGcm9tXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IFwiZW5cIixcblx0XHRcdFx0b3B0aW9uczogZ2V0TGFuZ3VhZ2VPcHRpb25zKExBTkdVQUdFUyksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIlRvXCIsXG5cdFx0XHRcdGRlc2M6IFwiQ2hvb3NlIHdoaWNoIGxhbmd1YWdlIHlvdSB3YW5uYSB0cmFuc2xhdGUgaW50by5cIixcblx0XHRcdFx0dHlwZTogXCJzZWxlY3RcIixcblx0XHRcdFx0a2V5OiBcInlUb1wiLFxuXHRcdFx0XHRkZWZhdWx0OiBcInpoLUNIU1wiLFxuXHRcdFx0XHRvcHRpb25zOiBnZXRMYW5ndWFnZU9wdGlvbnMoTEFOR1VBR0VTKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwiQXVkaW9cIixcblx0XHRcdFx0ZGVzYzogXCJXaGV0aGVyIHRvIGVuYWJsZSB0aGUgYXVkaW8gZnVuY3Rpb24/XCIsXG5cdFx0XHRcdHR5cGU6IFwidG9nZ2xlXCIsXG5cdFx0XHRcdGtleTogXCJhdWRpb1wiLFxuXHRcdFx0XHRkZWZhdWx0OiBmYWxzZSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSxcblx0e1xuXHRcdHRpdGxlOiBcIk1pY3Jvc29mdCBUcmFuc2xhdG9yIFNldHRpbmdzXCIsXG5cdFx0ZGVzYzogW1xuXHRcdFx0eyB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJGb3IgbW9yZSBpbmZvbWF0aW9uIG9uIHVzaW5nIGl0LCByZWZlciB0byBcIiB9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiBcImhyZWZcIixcblx0XHRcdFx0aHJlZjogXCJodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS96aC1jbi9henVyZS9jb2duaXRpdmUtc2VydmljZXMvdHJhbnNsYXRvci9xdWlja3N0YXJ0LXRyYW5zbGF0b3JcIixcblx0XHRcdFx0dGV4dDogXCJodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS96aC1jbi9henVyZS9jb2duaXRpdmUtc2VydmljZXMvdHJhbnNsYXRvci9xdWlja3N0YXJ0LXRyYW5zbGF0b3JcIixcblx0XHRcdH0sXG5cdFx0XHR7IHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIi5cIiB9LFxuXHRcdF0sXG5cdFx0c2V0dGluZ3M6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJFbmFibGVcIixcblx0XHRcdFx0ZGVzYzogXCJFbmFibGUgdGhlIE1pY3Jvc29mdCB0cmFuc2xhdG9yIHNlcnZpY2UuXCIsXG5cdFx0XHRcdHR5cGU6IFwidG9nZ2xlXCIsXG5cdFx0XHRcdGtleTogXCJtaWNyb3NvZnRFbmFibGVcIixcblx0XHRcdFx0ZGVmYXVsdDogZmFsc2UsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIlNlY3JldEtleVwiLFxuXHRcdFx0XHRkZXNjOiBcIlBsZWFzZSBzZXQgeW91ciBzZWNyZXQga2V5LlwiLFxuXHRcdFx0XHR0eXBlOiBcInRleHRcIixcblx0XHRcdFx0a2V5OiBcIm1pY3Jvc29mdFNlY3JldEtleVwiLFxuXHRcdFx0XHRkZWZhdWx0OiBcIlwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJMb2NhdGlvblwiLFxuXHRcdFx0XHRkZXNjOiBcIlBsZWFzZSBzZXQgeW91ciB0cmFuc2FjdGlvbiBzZXJ2aWNlIGxvY2F0aW9uLlwiLFxuXHRcdFx0XHR0eXBlOiBcInRleHRcIixcblx0XHRcdFx0a2V5OiBcIm1pY3Jvc29mdExvY2F0aW9uXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IFwiXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIkZyb21cIixcblx0XHRcdFx0ZGVzYzogXCJDaG9vc2Ugd2hpY2ggbGFuZ3VhZ2UgeW91IHdhbm5hIHRyYW5zbGF0ZSBmcm9tLlwiLFxuXHRcdFx0XHR0eXBlOiBcInNlbGVjdFwiLFxuXHRcdFx0XHRrZXk6IFwibUZyb21cIixcblx0XHRcdFx0ZGVmYXVsdDogXCJlblwiLFxuXHRcdFx0XHRvcHRpb25zOiBnZXRMYW5ndWFnZU9wdGlvbnMoTUlDUk9TT0ZUX0xBTkdVQUdFUyksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIlRvXCIsXG5cdFx0XHRcdGRlc2M6IFwiQ2hvb3NlIHdoaWNoIGxhbmd1YWdlIHlvdSB3YW5uYSB0cmFuc2xhdGUgaW50by5cIixcblx0XHRcdFx0dHlwZTogXCJzZWxlY3RcIixcblx0XHRcdFx0a2V5OiBcIm1Ub1wiLFxuXHRcdFx0XHRkZWZhdWx0OiBcInpoLUhhbnNcIixcblx0XHRcdFx0b3B0aW9uczogZ2V0TGFuZ3VhZ2VPcHRpb25zKE1JQ1JPU09GVF9MQU5HVUFHRVMpLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9LFxuXHR7XG5cdFx0dGl0bGU6IFwiQmFpZHUgVHJhbnNsYXRvciBTZXR0aW5nc1wiLFxuXHRcdGRlc2M6IFtcblx0XHRcdHsgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IFwiQmVmb3JlIHVzaW5nIHRoaXMgcGx1Z2luLCB5b3UgbmVlZCBicm93c2UgdG8gXCIgfSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogXCJocmVmXCIsXG5cdFx0XHRcdGhyZWY6IFwiaHR0cDovL2FwaS5mYW55aS5iYWlkdS5jb20vXCIsXG5cdFx0XHRcdHRleHQ6IFwiaHR0cDovL2FwaS5mYW55aS5iYWlkdS5jb20vXCIsXG5cdFx0XHR9LFxuXHRcdFx0eyB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJ0byByZWdpc3RlciBmaXJzdCFcIiB9LFxuXHRcdF0sXG5cdFx0c2V0dGluZ3M6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJFbmFibGVcIixcblx0XHRcdFx0ZGVzYzogXCJFbmFibGUgdGhlIGJhaWR1IHRyYW5zbGF0b3Igc2VydmljZS5cIixcblx0XHRcdFx0dHlwZTogXCJ0b2dnbGVcIixcblx0XHRcdFx0a2V5OiBcImJhaWR1RW5hYmxlXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIkFwcElkXCIsXG5cdFx0XHRcdGRlc2M6IFwiUGxlYXNlIHNldCB5b3VyIGJhaWR1IGFwcCBpZC5cIixcblx0XHRcdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0XHRcdGtleTogXCJiYWlkdUFwcElkXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IFwiXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcIlNlY3JldEtleVwiLFxuXHRcdFx0XHRkZXNjOiBcIlBsZWFzZSBzZXQgeW91ciBiYWlkdSBzZWNyZXQgaWQuXCIsXG5cdFx0XHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdFx0XHRrZXk6IFwiYmFpZHVTZWNyZXRLZXlcIixcblx0XHRcdFx0ZGVmYXVsdDogXCJcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwiRnJvbVwiLFxuXHRcdFx0XHRkZXNjOiBcIkNob29zZSB3aGljaCBsYW5ndWFnZSB5b3Ugd2FubmEgdHJhbnNsYXRlIGZyb20uXCIsXG5cdFx0XHRcdHR5cGU6IFwic2VsZWN0XCIsXG5cdFx0XHRcdGtleTogXCJiRnJvbVwiLFxuXHRcdFx0XHRkZWZhdWx0OiBcImVuXCIsXG5cdFx0XHRcdG9wdGlvbnM6IGdldExhbmd1YWdlT3B0aW9ucyhCQUlEVV9MQU5HVUFHRVMpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJUb1wiLFxuXHRcdFx0XHRkZXNjOiBcIkNob29zZSB3aGljaCBsYW5ndWFnZSB5b3Ugd2FubmEgdHJhbnNsYXRlIGludG8uXCIsXG5cdFx0XHRcdHR5cGU6IFwic2VsZWN0XCIsXG5cdFx0XHRcdGtleTogXCJiVG9cIixcblx0XHRcdFx0ZGVmYXVsdDogXCJ6aFwiLFxuXHRcdFx0XHRvcHRpb25zOiBnZXRMYW5ndWFnZU9wdGlvbnMoQkFJRFVfTEFOR1VBR0VTKSxcblx0XHRcdH0sXG5cdFx0XHQvLyB7XG5cdFx0XHQvLyAgIG5hbWU6ICdBdWRpbycsXG5cdFx0XHQvLyAgIGRlc2M6ICdXaGV0aGVyIHRvIGVuYWJsZSB0aGUgYXVkaW8gZnVuY3Rpb24/Jyxcblx0XHRcdC8vICAgdHlwZTogJ3RvZ2dsZScsXG5cdFx0XHQvLyAgIGtleTogJ2F1ZGlvJyxcblx0XHRcdC8vICAgZGVmYXVsdDogZmFsc2Vcblx0XHRcdC8vIH1cblx0XHRdLFxuXHR9LFxuXTtcblxuLy8gZGVzYyBjcmVhdG9yXG5mdW5jdGlvbiBjcmVhdGVEZXNjKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGRlc2M6IEFycmF5PERlc2M+KSB7XG5cdGNvbnN0IGRlc2NFbCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwidHJhbnNhY3Rpb25fY29udGFpbmVyLWRlc2NcIiB9KTtcblx0ZGVzYy5mb3JFYWNoKCh7IHR5cGUsIHRleHQsIGhyZWYgfSkgPT4ge1xuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSBcInRleHRcIjpcblx0XHRcdFx0ZGVzY0VsLmFwcGVuZFRleHQodGV4dCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImhyZWZcIjpcblx0XHRcdFx0ZGVzY0VsLmFwcGVuZENoaWxkKFxuXHRcdFx0XHRcdGNyZWF0ZUVsKFwiYVwiLCB7XG5cdFx0XHRcdFx0XHR0ZXh0LFxuXHRcdFx0XHRcdFx0aHJlZixcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xufVxuXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRvclNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcblx0cGx1Z2luOiBUcmFuc2xhdG9yUGx1Z2luO1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFRyYW5zbGF0b3JQbHVnaW4pIHtcblx0XHRzdXBlcihhcHAsIHBsdWdpbik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRkaXNwbGF5KCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdC8vIEFkZCBTZXR0aW5nIHRpdGxlXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiVHJhbnNsYXRvciBTZXR0aW5nc1wiIH0pO1xuXHRcdC8vIEluaXQgc2V0dGluZ3Ncblx0XHRTRVRUSU5HX0JMT0NLUy5mb3JFYWNoKCh7IHRpdGxlLCBzZXR0aW5ncywgZGVzYyB9KSA9PiB7XG5cdFx0XHRjb250YWluZXJFbC5jcmVhdGVFbChcImg2XCIsIHsgdGV4dDogdGl0bGUgfSk7XG5cdFx0XHRkZXNjICYmIGNyZWF0ZURlc2MoY29udGFpbmVyRWwsIGRlc2MpO1xuXHRcdFx0c2V0dGluZ3MuZm9yRWFjaCgoc2V0KSA9PiB7XG5cdFx0XHRcdGNvbnN0IHsgbmFtZSwgZGVzYywgdHlwZSwga2V5LCBkZWZhdWx0OiBkZWZhdWx0VmFsdWUsIG9wdGlvbnMgfSA9IHNldDtcblx0XHRcdFx0Y29uc3QgZWwgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZShuYW1lKS5zZXREZXNjKGRlc2MpO1xuXHRcdFx0XHRjb25zdCB2YWwgPSB0aGlzLnBsdWdpbi5zZXR0aW5nc1trZXkgYXMga2V5b2YgVHJhbnNsYXRvclNldHRpbmddO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0XHRjYXNlIFwidGV4dFwiOlxuXHRcdFx0XHRcdFx0ZWwuYWRkVGV4dCgodGV4dCkgPT5cblx0XHRcdFx0XHRcdFx0dGV4dFxuXHRcdFx0XHRcdFx0XHRcdC5zZXRQbGFjZWhvbGRlcihuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdC5zZXRWYWx1ZSgodmFsIHx8IGRlZmF1bHRWYWx1ZSkgYXMgc3RyaW5nKVxuXHRcdFx0XHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdCh0aGlzLnBsdWdpbi5zZXR0aW5nc1tcblx0XHRcdFx0XHRcdFx0XHRcdFx0a2V5IGFzIGtleW9mIFRyYW5zbGF0b3JTZXR0aW5nXG5cdFx0XHRcdFx0XHRcdFx0XHRdIGFzIHN0cmluZykgPSB2YWx1ZS50cmltKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgXCJzZWxlY3RcIjpcblx0XHRcdFx0XHRcdGVsLmFkZERyb3Bkb3duKChkcCkgPT5cblx0XHRcdFx0XHRcdFx0ZHBcblx0XHRcdFx0XHRcdFx0XHQuYWRkT3B0aW9ucyhvcHRpb25zIHx8IHt9KVxuXHRcdFx0XHRcdFx0XHRcdC5zZXRWYWx1ZSgodmFsIHx8IGRlZmF1bHRWYWx1ZSkgYXMgc3RyaW5nKVxuXHRcdFx0XHRcdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdCh0aGlzLnBsdWdpbi5zZXR0aW5nc1tcblx0XHRcdFx0XHRcdFx0XHRcdFx0a2V5IGFzIGtleW9mIFRyYW5zbGF0b3JTZXR0aW5nXG5cdFx0XHRcdFx0XHRcdFx0XHRdIGFzIHN0cmluZykgPSB2YWx1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBcInRvZ2dsZVwiOlxuXHRcdFx0XHRcdFx0ZWwuYWRkVG9nZ2xlKCh0ZykgPT4ge1xuXHRcdFx0XHRcdFx0XHR0Zy5zZXRWYWx1ZShcblx0XHRcdFx0XHRcdFx0XHQodmFsID09PSB1bmRlZmluZWQgPyBkZWZhdWx0VmFsdWUgOiB2YWwpIGFzIGJvb2xlYW5cblx0XHRcdFx0XHRcdFx0KS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHQodGhpcy5wbHVnaW4uc2V0dGluZ3NbXG5cdFx0XHRcdFx0XHRcdFx0XHRrZXkgYXMga2V5b2YgVHJhbnNsYXRvclNldHRpbmdcblx0XHRcdFx0XHRcdFx0XHRdIGFzIGJvb2xlYW4pID0gdmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG59XG4iXX0=