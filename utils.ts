import { Notice, request, requestUrl } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

interface Params {
	[key: string]: string | number
}

interface LanguageOptions {
  [key: string]: string
}

interface MicrosoftTranslations {
  translations: Array<{ text: string, [key: string]: string }>
}

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
async function handleTranslate (q: string, config: {
	appId: string,
	secretKey: string,
  from?: string,
	to: string
}, cb: any) {
	const salt = new Date().getTime()
	const curtime = Math.round(new Date().getTime() / 1000)
	const str1 = config.appId + truncate(q) + salt + curtime + config.secretKey
	// encode as (utf-8) Uint8Array
	const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str1));
	// hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
	const from = config.from || 'auto'
	const params: Params = { q, appKey: config.appId, salt, from, to: config.to, sign, curtime, signType: 'v3' }
	const query = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
	request({
		method: 'get',
		url: `https://openapi.youdao.com/api?${query}`
	}).then(function (response: any) {
		cb(JSON.parse(response || '{}'))
	})
	.catch(function (error: { message: string }) {
		noticeHandler(error.message || 'No results!')
	})
}

async function handleMicrosoftTranslate(q: string, config: {
  secretKey: string,
  from?: string,
  to: string,
  location: string
}, cb: any) {
	const endpoint = 'https://api-apc.cognitive.microsofttranslator.com'
  const { from = 'en', to, secretKey, location } = config

	// Add your location, also known as region. The default is global.
	// This is required if using a Cognitive Services resource.
  // TODO: replace with `requestUrl` method
	axios({
		url: `${endpoint}/translate?api-version=3.0&from=${from}&to=${to}&includeAlignment=true&textType=html`,
		method: 'post',
		headers: {
			'Ocp-Apim-Subscription-Key': secretKey,
			'Ocp-Apim-Subscription-Region': location,
			'Content-type': 'application/json',
			'X-ClientTraceId': uuidv4().toString()
		},
    data: [{ text: q }],
		responseType: 'json'
	}).then(( { data } ) => {
		const res = (data || []).reduce((str: string, item: MicrosoftTranslations) => {
			const { translations = [] } = item
			return str + translations.map(({ text }) => text).join(', ')
		}, '')
    cb(res)
	}).catch((e) => {
    noticeHandler('Network Error!')
  })
}

function handleAudio (url: string, cb: any) {
	requestUrl({ method: 'post', url }).then((res: any) => {
		cb(res)
	}).catch(function (error: { message: string }) {
		noticeHandler(error.message || 'No results!')
	})
}

// language options defination
const LANGUAGES: LanguageOptions = {
	// 自动: 'auto',
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

// Microsoft languages
const MICROSOFT_LANGUAGES: LanguageOptions = {
	'南非荷兰语': 'af',
	'阿尔巴尼亚语': 'sq',
	'阿姆哈拉语': 'am',
	'阿拉伯语': 'ar',
	'亚美尼亚语': 'hy',
	'阿萨姆语': 'as',
	'阿塞拜疆语(拉丁语)': 'az',
	'Bangla': 'bn',
	'巴什基尔语': 'ba',
	'巴斯克语': 'eu',
	'波斯尼亚语(拉丁语系)': 'bs',
	'保加利亚语': 'bg',
	'粤语(繁体)': 'yue',
	'加泰罗尼亚语': 'ca',
	'中文（文学）': 'lzh',
	'简体中文': 'zh-Hans',
	'中文(繁体)': 'zh-Hant',
	'克罗地亚语': 'hr',
	'捷克语': 'cs',
	'丹麦语': 'da',
	'达里语': 'prs',
	'马尔代夫语': 'dv',
	'荷兰语': 'nl',
	'英语': 'en',
	'爱沙尼亚语': 'et',
	'法罗语': 'fo',
	'斐济语': 'fj',
	'菲律宾语': 'fil',
	'芬兰语': 'fi',
	'法语': 'fr',
	'法语（加拿大）': 'fr-ca',
	'加利西亚语': 'gl',
	'格鲁吉亚语': 'ka',
	'德语': 'de',
	'希腊语': 'el',
	'古吉拉特语': 'gu',
	'海地克里奥尔语': 'ht',
	'希伯来语': 'he',
	'Hindi': 'hi',
	'白苗语（拉丁语）': 'mww',
	'匈牙利语': 'hu',
	'冰岛语': 'is',
	'印度尼西亚语': 'id',
	'因纽纳敦语': 'ikt',
	'因纽特语': 'iu',
	'因纽特语(拉丁语)': 'iu-Latn',
	'爱尔兰语': 'ga',
	'意大利语': 'it',
	'日语': 'ja',
	'卡纳达语': 'kn',
	'哈萨克语': 'kk',
	'高棉语': 'km',
	'克林贡语': 'tlh-Latn',
	'克林贡语(plqaD)': 'tlh-Piqd',
	'朝鲜语': 'ko',
	'库尔德语(中部)': 'ku',
	'库尔德语(北部)': 'kmr',
	'吉尔吉斯语(西里尔语)': 'ky',
	'老挝语': 'lo',
	'拉脱维亚语': 'lv',
	'立陶宛语': 'lt',
	'马其顿语': 'mk',
	'马达加斯加语': 'mg',
	'马来语(拉丁语系)': 'ms',
	'马拉雅拉姆语': 'ml',
	'马耳他语': 'mt',
	'毛利语': 'mi',
	'马拉地语': 'mr',
	'蒙古语(西里尔文)': 'mn-Cyrl',
	'蒙古语(传统)': 'mn-Mong',
	'缅甸': 'my',
	'尼泊尔语': 'ne',
	'挪威语': 'nb',
	'奥里亚语': 'or',
	'普什图语': 'ps',
	'波斯语': 'fa',
	'波兰语': 'pl',
	'葡萄牙语（巴西）': 'pt',
	'葡萄牙语(葡萄牙)': 'pt-pt',
	'旁遮普语': 'pa',
	'克雷塔罗奥托米语': 'otq',
	'罗马尼亚语': 'ro',
	'俄语': 'ru',
	'萨摩亚语(拉丁语)': 'sm',
	'塞尔维亚语（西里尔）': 'sr-Cyrl',
	'塞尔维亚语（拉丁）': 'sr-Latn',
	'斯洛伐克语': 'sk',
	'斯洛文尼亚语': 'sl',
	'索马里语（阿拉伯语）': 'so',
	'西班牙语': 'es',
	'斯瓦希里语（拉丁语）': 'sw',
	'瑞典语': 'sv',
	'塔希提语': 'ty',
	'泰米尔语': 'ta',
	'鞑靼语（拉丁语）': 'tt',
	'泰卢固语': 'te',
	'泰语': 'th',
	'藏语': 'bo',
	'提格里尼亚语': 'ti',
	'汤加语': 'to',
	'土耳其语': 'tr',
	'土库曼语(拉丁语)': 'tk',
	'乌克兰语': 'uk',
	'上索布语': 'hsb',
	'乌尔都语': 'ur',
	'维吾尔语（阿拉伯语）': 'ug',
	'乌兹别克语(拉丁语)': 'uz',
	'越南语': 'vi',
	'威尔士语': 'cy',
	'尤卡坦玛雅语': 'yua',
	'祖鲁语': 'zu',
}

// get all languages
function getAllLanguages(languages: LanguageOptions): LanguageOptions {
  return Object.keys(languages).reduce((res: LanguageOptions, key: string) => {
    const languageCode = languages[key]
    if (!res[languageCode]) res[languageCode] = key
    return res
  }, {})
}

// setting's configuration definations
function getLanguageOptions(languages: LanguageOptions): LanguageOptions {
  return Object.keys(languages).reduce((obj: object, key: string) => ({
    ...obj, [key]: `${languages[key]}-${key}`
  }), {})
}
const options = getLanguageOptions(getAllLanguages({ ...LANGUAGES, ...MICROSOFT_LANGUAGES }))

function isObject(obj: any) {
  return obj !== null && Object.prototype.toString.call(obj) === '[object Object]'
}

function isEmptyObject (obj = {}) { return isObject(obj) && Object.keys(obj).length < 1 }

function validator(items: Array<{ value: string, message: string }>, cb: () => void) {
  const errorMessages = items.filter(item => !item.value).map(item => item.message)
  if (errorMessages.length) {
    noticeHandler(errorMessages.join(', '))
    return
  } else {
    cb()
  }
}

export {
	noticeHandler,
	handleTranslate,
	handleAudio,
	options,
  isEmptyObject,
  handleMicrosoftTranslate,
  validator
}
