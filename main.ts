/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-09 11:38:39
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-10-26 18:41:04
 * @Description:
 */
import { Plugin } from "obsidian";
import { TranslatorSettingTab } from "./settings";
import { TranslatorModal } from "./modals";
import { noticeHandler, cleanMarkup } from "./utils";
import { TranslatorSetting } from "./interfaces";

const DEFAULT_SETTINGS: TranslatorSetting = {
	// Youdao Settings
	youdaoEnable: false,
	appId: "",
	secretKey: "",
	yFrom: "",
	yTo: "",
	audio: false,
	// Microsoft Settings
	microsoftEnable: false,
	microsoftSecretKey: "",
	microsoftLocation: "",
	mFrom: "",
	mTo: "",
	// Baidu Settings
	baiduEnable: false,
	baiduSecretKey: "",
	baiduAppId: "",
	bFrom: "",
	bTo: "",
};

type Config = keyof TranslatorSetting;

export default class TranslatorPlugin extends Plugin {
	settings: TranslatorSetting = DEFAULT_SETTINGS;

	async onload() {
		// load settings
		await this.loadSettings();
		// add setting tab
		this.addSettingTab(new TranslatorSettingTab(this.app, this));
		// add ribbon icon
		this.addRibbonIcon("book", "Translate", () => {
			// @ts-ignore
			this.app.commands.executeCommandById("obsidian-translator:translate");
		});
		// validator
		const validator = () => {
			const {
				youdaoEnable,
				appId,
				secretKey,
				baiduAppId,
				baiduEnable,
				baiduSecretKey,
				microsoftEnable,
				microsoftLocation,
				microsoftSecretKey,
			} = this.settings;
			const getKeys = (obj: { [name: string]: string }): string[] => {
				return Object.keys(obj).filter((key: string) => !obj[key]);
			};
			const getRes = (
				enable: boolean,
				idOrLocation: string,
				key: string
			): boolean => (enable && !!idOrLocation && !!key) || !enable;
			const validateFailedList = [
				...(getRes(youdaoEnable, appId, secretKey)
					? []
					: getKeys({ appId, secretKey })),
				...(getRes(baiduEnable, baiduAppId, baiduSecretKey)
					? []
					: getKeys({ baiduAppId, baiduSecretKey })),
				...(getRes(microsoftEnable, microsoftLocation, microsoftSecretKey)
					? []
					: getKeys({ microsoftLocation, microsoftSecretKey })),
			];
			return validateFailedList;
		};
		// add command
		this.addCommand({
			id: "translate",
			name: "translate",
			editorCallback: (editor) => {
				const { settings } = this;
				const enableKeys = Object.keys(settings).filter(
					(key) =>
						key.toLowerCase().includes("enable") &&
						settings[key as keyof TranslatorSetting]
				);
				if (enableKeys.length) {
					const messages = validator();
					if (!messages.length) {
						const sel = cleanMarkup(editor.getSelection())
							.replace(/[^\w\s]/gi, " ")
							.trim();
						new TranslatorModal(this.app, sel, settings).open();
					} else {
						noticeHandler(`${messages.join(", ")} can not be empty!`);
					}
				}
			},
		});
	}

	async loadSettings() {
		const settings = await this.loadData();
		this.settings = {
			...DEFAULT_SETTINGS,
			...(settings || {}),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
