/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-17 14:47:03
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-22 19:46:16
 * @Description: 
 */
export interface TranslatorSetting {
  // Youdao Settings
  youdaoEnable: boolean,
	appId: string,
	secretKey: string,
  yFrom: string,
	yTo: string,
	audio: boolean,
  // Microsoft Settings
  microsoftEnable: boolean,
  microsoftSecretKey: string,
  microsoftLocation: string,
  mFrom: string,
	mTo: string,
  // Baidu Settings
  baiduEnable: boolean,
  baiduSecretKey: string,
  baiduAppId: string,
  bFrom: string,
	bTo: string,
  baiduAudio: boolean
}
