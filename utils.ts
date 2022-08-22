import { Notice, request, requestUrl } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { MD5 } from './md5'

interface Params {
	[key: string]: string | number
}

interface LanguageOptions {
  [key: string]: string
}

interface MicrosoftTranslations {
  translations: Array<{ text: string, [key: string]: string }>
}

type TranslateCallback = (res: any) => void

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
 * getRequest
 * @param url 
 * @param cb callback function
 */
function getRequest(url: string, cb: TranslateCallback) {
  request({
		method: 'get',
		url
	}).then(function (response: any) {
		cb(JSON.parse(response || '{}'))
	})
	.catch(function (error: { message: string }) {
		noticeHandler(error.message || 'No results!')
	})
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
}, cb: TranslateCallback) {
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
  getRequest(`https://openapi.youdao.com/api?${query}`, cb)
}

async function handleMicrosoftTranslate(q: string, config: {
  secretKey: string,
  from?: string,
  to: string,
  location: string
}, cb: TranslateCallback) {
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

async function handleBaiduTranslate(q: string, config: {
  appId: string,
	secretKey: string,
  from?: string,
	to: string
}, cb: TranslateCallback) {
  const { to, from, appId, secretKey } = config
  const salt = (new Date).getTime();
  // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  const sign = MD5(`${appId}${q}${salt}${secretKey}`);
  getRequest(`http://api.fanyi.baidu.com/api/trans/vip/translate?q=${q}&from=${from}&to=${to}&appid=${appId}&salt=${salt}&sign=${sign}`, cb)
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
	简体中文: 'zh-CHS',
	繁体中文: 'zh-CHT',
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
	中文粤语: 'yue',
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
	'中文粤语': 'yue',
	'加泰罗尼亚语': 'ca',
	'中文文学': 'lzh',
	'简体中文': 'zh-Hans',
	'繁体中文': 'zh-Hant',
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
	'韩语': 'ko',
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

// Baidu languages
const BAIDU_LANGUAGES: LanguageOptions = {
  阿拉伯语: 'ara',
  爱尔兰语: 'gle',
  奥克语: 'oci',
  阿尔巴尼亚语: 'alb',
  阿尔及利亚阿拉伯语: 'arq',
  阿肯语: 'aka',
  阿拉贡语: 'arg',
  阿姆哈拉语: 'amh',
  阿萨姆语: 'asm',
  艾马拉语: 'aym',
  阿塞拜疆语: 'aze',
  阿斯图里亚斯语: 'ast',
  奥塞梯语: 'oss',
  爱沙尼亚语: 'est',
  奥杰布瓦语: 'oji',
  奥里亚语: 'ori',
  奥罗莫语: 'orm',
  波兰语: 'pl',
  波斯语: 'per',
  布列塔尼语: 'bre',
  巴什基尔语: 'bak',
  巴斯克语: 'baq',
  巴西葡萄牙语: 'pot',
  白俄罗斯语: 'bel',
  柏柏尔语: 'ber',
  邦板牙语: 'pam',
  保加利亚语: 'bul',
  北方萨米语: 'sme',
  北索托语: 'ped',
  本巴语: 'bem',
  比林语: 'bli',
  比斯拉马语: 'bis',
  俾路支语: 'bal',
  冰岛语: 'ice',
  波斯尼亚语: 'bos',
  博杰普尔语: 'bho',
  楚瓦什语: 'chv',
  聪加语: 'tso',
  丹麦语: 'dan',
  德语: 'de',
  鞑靼语: 'tat',
  掸语: 'sha',
  德顿语: 'tet',
  迪维希语: 'div',
  低地德语: 'log',
  俄语: 'ru',
  法语: 'fra',
  菲律宾语: 'fil',
  芬兰语: 'fin',
  梵语: 'san',
  弗留利语: 'fri',
  富拉尼语: 'ful',
  法罗语: 'fao',
  盖尔语: 'gla',
  刚果语: 'kon',
  高地索布语: 'ups',
  高棉语: 'hkm',
  格陵兰语: 'kal',
  格鲁吉亚语: 'geo',
  古吉拉特语: 'guj',
  古希腊语: 'gra',
  古英语: 'eno',
  瓜拉尼语: 'grn',
  韩语: 'kor',
  荷兰语: 'nl',
  胡帕语: 'hup',
  哈卡钦语: 'hak',
  海地语: 'ht',
  黑山语: 'mot',
  豪萨语: 'hau',
  吉尔吉斯语: 'kir',
  加利西亚语: 'glg',
  加拿大法语: 'frn',
  加泰罗尼亚语: 'cat',
  捷克语: 'cs',
  卡拜尔语: 'kab',
  卡纳达语: 'kan',
  卡努里语: 'kau',
  卡舒比语: 'kah',
  康瓦尔语: 'cor',
  科萨语: 'xho',
  科西嘉语: 'cos',
  克里克语: 'cre',
  克里米亚鞑靼语: 'cri',
  克林贡语: 'kli',
  克罗地亚语: 'hrv',
  克丘亚语: 'que',
  克什米尔语: 'kas',
  孔卡尼语: 'kok',
  库尔德语: 'kur',
  拉丁语: 'lat',
  老挝语: 'lao',
  罗马尼亚语: 'rom',
  拉特加莱语: 'lag',
  拉脱维亚语: 'lav',
  林堡语: 'lim',
  林加拉语: 'lin',
  卢干达语: 'lug',
  卢森堡语: 'ltz',
  卢森尼亚语: 'ruy',
  卢旺达语: 'kin',
  立陶宛语: 'lit',
  罗曼什语: 'roh',
  罗姆语: 'ro',
  逻辑语: 'loj',
  马来语: 'may',
  缅甸语: 'bur',
  马拉地语: 'mar',
  马拉加斯语: 'mg',
  马拉雅拉姆语: 'mal',
  马其顿语: 'mac',
  马绍尔语: 'mah',
  迈蒂利语: 'mai',
  曼克斯语: 'glv',
  毛里求斯克里奥尔语: 'mau',
  毛利语: 'mao',
  孟加拉语: 'ben',
  马耳他语: 'mlt',
  苗语: 'hmn',
  挪威语: 'nor',
  那不勒斯语: 'nea',
  南恩德贝莱语: 'nbl',
  南非荷兰语: 'afr',
  南索托语: 'sot',
  尼泊尔语: 'nep',
  葡萄牙语: 'pt',
  旁遮普语: 'pan',
  帕皮阿门托语: 'pap',
  普什图语: 'pus',
  齐切瓦语: 'nya',
  契维语: 'twi',
  切罗基语: 'chr',
  日语: 'jp',
  瑞典语: 'swe',
  萨丁尼亚语: 'srd',
  萨摩亚语: 'sm',
  '塞尔维亚-克罗地亚语': 'sec',
  塞尔维亚语: 'srp',
  桑海语: 'sol',
  僧伽罗语: 'sin',
  世界语: 'epo',
  书面挪威语: 'nob',
  斯洛伐克语: 'sk',
  斯洛文尼亚语: 'slo',
  斯瓦希里语: 'swa',
  '塞尔维亚语（西里尔）': 'src',
  索马里语: 'som',
  泰语: 'th',
  土耳其语: 'tr',
  塔吉克语: 'tgk',
  泰米尔语: 'tam',
  他加禄语: 'tgl',
  提格利尼亚语: 'tir',
  泰卢固语: 'tel',
  突尼斯阿拉伯语: 'tua',
  土库曼语: 'tuk',
  乌克兰语: 'ukr',
  瓦隆语: 'wln',
  威尔士语: 'wel',
  文达语: 'ven',
  沃洛夫语: 'wol',
  乌尔都语: 'urd',
  西班牙语: 'spa',
  希伯来语: 'heb',
  希腊语: 'el',
  匈牙利语: 'hu',
  西弗里斯语: 'fry',
  西里西亚语: 'sil',
  希利盖农语: 'hil',
  下索布语: 'los',
  夏威夷语: 'haw',
  新挪威语: 'nno',
  西非书面语: 'nqo',
  信德语: 'snd',
  修纳语: 'sna',
  宿务语: 'ceb',
  叙利亚语: 'syr',
  巽他语: 'sun',
  英语: 'en',
  印地语: 'hi',
  印尼语: 'id',
  意大利语: 'it',
  越南语: 'vie',
  意第绪语: 'yid',
  因特语: 'ina',
  亚齐语: 'ach',
  印古什语: 'ing',
  伊博语: 'ibo',
  伊多语: 'ido',
  约鲁巴语: 'yor',
  亚美尼亚语: 'arm',
  伊努克提图特语: 'iku',
  伊朗语: 'ir',
  简体中文: 'zh',
  繁体中文: 'cht',
  文言文: 'wyw',
  中文粤语: 'yue',
  扎扎其语: 'zaz',
  中古法语: 'frm',
  祖鲁语: 'zul',
  爪哇语: 'jav'
}

// setting's configuration definations
function getLanguageOptions(languages: LanguageOptions): LanguageOptions {
  return Object.keys(languages).reduce((obj: LanguageOptions, key: string) => ({
    ...obj, [languages[key]]: `${key}-${languages[key]}`
  }), {})
}

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
	getLanguageOptions,
  isEmptyObject,
  handleMicrosoftTranslate,
  validator,
  handleBaiduTranslate,
  LANGUAGES,
  MICROSOFT_LANGUAGES,
  BAIDU_LANGUAGES
}
