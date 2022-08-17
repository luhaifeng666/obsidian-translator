/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-17 14:47:03
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-17 18:53:34
 * @Description: 
 */
export interface TranslatorSetting {
  // Youdao Settings
  youdaoEnable: boolean,
	appId: string,
	secretKey: string,
  from: string,
	to: string,
	audio: boolean,
  // Microsoft Settings
  microsoftEnable: boolean,
  microsoftSecretKey: string,
  microsoftLocation: string
}
