import { Notice } from 'obsidian'
const CryptoJS = require('crypto-js')
const path = require('path')
const axios = require('axios')
const jsonpAdapter = require('axios-jsonp')

/**
 * notice handler
 * @param msg: notice message
 */
const noticeHandler = (msg: string) => new Notice(msg)

function truncate (q: string) {
	const len = q.length
	if(len <= 20) return q
	return q.substring(0, 10) + len + q.substring(len - 10, len)
}

/**
 * youdao translate handler
 * @param q: text need translated
 * @param config: youdao config
 * @param cb: callback function
 */
function handleTranslate (q: string, config: {
	appId: string,
	secretKey: string,
	to: string
}, cb: any) {
	const salt = new Date().getTime()
	const curtime = Math.round(new Date().getTime() / 1000)
	const str1 = config.appId + truncate(q) + salt + curtime + config.secretKey
	const sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex)
	const from = 'auto'
	axios({
		method: 'get',
		url: 'http://openapi.youdao.com/api',
		adapter: jsonpAdapter,
		params: { q, appKey: config.appId, salt, from, to: config.to, sign, curtime, signType: 'v3' }
	})
		.then(function (response: any) {
			cb(response.data)
		})
		.catch(function (error: { message: string }) {
			noticeHandler(error.message || 'No results!')
		})
}

// language options defination
const LANGUAGES: { [key: string]: string } = {
	自动: 'auto',
	中文: 'zh-CHS',
	中文繁体: 'zh-CHT',
	英文: 'en',
	日文: 'ja',
	韩文: 'ko',
	法文: 'fr',
	西班牙文: 'es',
	葡萄牙文: 'pt',
	意大利文: 'it',
	俄文: 'ru',
	越南文: 'vi',
	德文: 'de',
	阿拉伯文: 'ar',
	印尼文: 'id',
	南非荷兰语: 'af',
	波斯尼亚语: 'bs',
	保加利亚语: 'bg',
	粤语: 'yue',
	加泰隆语: 'ca',
	克罗地亚语: 'hr',
	捷克语: 'cs',
	丹麦语: 'da',
	荷兰语: 'nl',
	爱沙尼亚语: 'et',
	斐济语: 'fj',
	芬兰语: 'fi',
	希腊语: 'el',
	海地克里奥尔语: 'ht',
	希伯来语: 'he',
	印地语: 'hi',
	白苗语: 'mww',
	匈牙利语: 'hu',
	斯瓦希里语: 'sw',
	克林贡语: 'tlh',
	拉脱维亚语: 'lv',
	立陶宛语: 'lt',
	马来语: 'ms',
	马耳他语: 'mt',
	挪威语: 'no',
	波斯语: 'fa',
	波兰语: 'pl',
	克雷塔罗奥托米语: 'otq',
	罗马尼亚语: 'ro',
	'塞尔维亚语(西里尔文)': 'sr-Cyrl',
	'塞尔维亚语(拉丁文)': 'sr-Latn',
	斯洛伐克语: 'sk',
	斯洛文尼亚语: 'sl',
	瑞典语: 'sv',
	塔希提语: 'ty',
	泰语: 'th',
	汤加语: 'to',
	土耳其语: 'tr',
	乌克兰语: 'uk',
	乌尔都语: 'ur',
	威尔士语: 'cy',
	尤卡坦玛雅语: 'yua',
	阿尔巴尼亚语: 'sq',
	阿姆哈拉语: 'am',
	亚美尼亚语: 'hy',
	阿塞拜疆语: 'az',
	孟加拉语: 'bn',
	巴斯克语: 'eu',
	白俄罗斯语: 'be',
	宿务语: 'ceb',
	科西嘉语: 'co',
	世界语: 'eo',
	菲律宾语: 'tl',
	弗里西语: 'fy',
	加利西亚语: 'gl',
	格鲁吉亚语: 'ka',
	古吉拉特语: 'gu',
	豪萨语: 'ha',
	夏威夷语: 'haw',
	冰岛语: 'is',
	伊博语: 'ig',
	爱尔兰语: 'ga',
	爪哇语: 'jw',
	卡纳达语: 'kn',
	哈萨克语: 'kk',
	高棉语: 'km',
	库尔德语: 'ku',
	柯尔克孜语: 'ky',
	老挝语: 'lo',
	拉丁语: 'la',
	卢森堡语: 'lb',
	马其顿语: 'mk',
	马尔加什语: 'mg',
	马拉雅拉姆语: 'ml',
	毛利语: 'mi',
	马拉地语: 'mr',
	蒙古语: 'mn',
	缅甸语: 'my',
	尼泊尔语: 'ne',
	齐切瓦语: 'ny',
	普什图语: 'ps',
	旁遮普语: 'pa',
	萨摩亚语: 'sm',
	苏格兰盖尔语: 'gd',
	塞索托语: 'st',
	修纳语: 'sn',
	信德语: 'sd',
	僧伽罗语: 'si',
	索马里语: 'so',
	巽他语: 'su',
	塔吉克语: 'tg',
	泰米尔语: 'ta',
	泰卢固语: 'te',
	乌兹别克语: 'uz',
	南非科萨语: 'xh',
	意第绪语: 'yi',
	约鲁巴语: 'yo',
	南非祖鲁语: 'zu',
	自动识别: 'auto'
}

// setting's configuration definations
const options = Object.keys(LANGUAGES).reduce((obj: object, key: string) => ({
	...obj, [LANGUAGES[key]]: `${key}-${LANGUAGES[key]}`
}), {})

export {
	noticeHandler,
	handleTranslate,
	options
}
