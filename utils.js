import { __awaiter } from "tslib";
import { Notice, request, requestUrl } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { MD5 } from "./md5";
/**
 * notice handler
 * @param msg: notice message
 */
const noticeHandler = (msg) => new Notice(msg);
function truncate(q) {
    const len = q.length;
    if (len <= 20)
        return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
}
/**
 * getRequest
 * @param url
 * @param cb callback function
 */
function getRequest(url, cb) {
    request({
        method: "get",
        url,
    })
        .then(function (response) {
        cb(JSON.parse(response || "{}"));
    })
        .catch(function (error) {
        noticeHandler(error.message || "No results!");
    });
}
/**
 * youdao translate handler
 * @param q: text need translated
 * @param config: youdao config
 * @param cb: callback function
 */
function handleTranslate(q, config, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = new Date().getTime();
        const curtime = Math.round(new Date().getTime() / 1000);
        const str1 = config.appId + truncate(q) + salt + curtime + config.secretKey;
        // encode as (utf-8) Uint8Array
        const hashBuffer = yield crypto.subtle.digest("SHA-256", new TextEncoder().encode(str1));
        // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const sign = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
        const from = config.from || "auto";
        const params = {
            q,
            appKey: config.appId,
            salt,
            from,
            to: config.to,
            sign,
            curtime,
            signType: "v3",
        };
        const query = Object.keys(params)
            .map((key) => `${key}=${params[key]}`)
            .join("&");
        getRequest(`https://openapi.youdao.com/api?${query}`, cb);
    });
}
function handleMicrosoftTranslate(q, config, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = "https://api-apc.cognitive.microsofttranslator.com";
        const { from = "en", to, secretKey, location } = config;
        // Add your location, also known as region. The default is global.
        // This is required if using a Cognitive Services resource.
        // TODO: replace with `requestUrl` method
        axios({
            url: `${endpoint}/translate?api-version=3.0&from=${from}&to=${to}&includeAlignment=true&textType=html`,
            method: "post",
            headers: {
                "Ocp-Apim-Subscription-Key": secretKey,
                "Ocp-Apim-Subscription-Region": location,
                "Content-type": "application/json",
                "X-ClientTraceId": uuidv4().toString(),
            },
            data: [{ text: q }],
            responseType: "json",
        })
            .then(({ data }) => {
            const res = (data || []).reduce((str, item) => {
                const { translations = [] } = item;
                return str + translations.map(({ text }) => text).join(", ");
            }, "");
            cb(res);
        })
            .catch((e) => {
            noticeHandler("Network Error!");
        });
    });
}
function handleBaiduTranslate(q, config, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const { to, from, appId, secretKey } = config;
        const salt = new Date().getTime();
        // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
        const sign = MD5(`${appId}${q}${salt}${secretKey}`);
        getRequest(`http://api.fanyi.baidu.com/api/trans/vip/translate?q=${q}&from=${from || "en"}&to=${to || "zh"}&appid=${appId}&salt=${salt}&sign=${sign}`, cb);
    });
}
function handleAudio(url, cb) {
    requestUrl({ method: "post", url })
        .then((res) => {
        cb(res);
    })
        .catch(function (error) {
        noticeHandler(error.message || "No results!");
    });
}
// language options defination
const LANGUAGES = {
    // 自动: 'auto',
    简体中文: "zh-CHS",
    繁体中文: "zh-CHT",
    英文: "en",
    日文: "ja",
    韩文: "ko",
    法文: "fr",
    西班牙文: "es",
    葡萄牙文: "pt",
    意大利文: "it",
    俄文: "ru",
    越南文: "vi",
    德文: "de",
    阿拉伯文: "ar",
    印尼文: "id",
    南非荷兰语: "af",
    波斯尼亚语: "bs",
    保加利亚语: "bg",
    中文粤语: "yue",
    加泰隆语: "ca",
    克罗地亚语: "hr",
    捷克语: "cs",
    丹麦语: "da",
    荷兰语: "nl",
    爱沙尼亚语: "et",
    斐济语: "fj",
    芬兰语: "fi",
    希腊语: "el",
    海地克里奥尔语: "ht",
    希伯来语: "he",
    印地语: "hi",
    白苗语: "mww",
    匈牙利语: "hu",
    斯瓦希里语: "sw",
    克林贡语: "tlh",
    拉脱维亚语: "lv",
    立陶宛语: "lt",
    马来语: "ms",
    马耳他语: "mt",
    挪威语: "no",
    波斯语: "fa",
    波兰语: "pl",
    克雷塔罗奥托米语: "otq",
    罗马尼亚语: "ro",
    "塞尔维亚语(西里尔文)": "sr-Cyrl",
    "塞尔维亚语(拉丁文)": "sr-Latn",
    斯洛伐克语: "sk",
    斯洛文尼亚语: "sl",
    瑞典语: "sv",
    塔希提语: "ty",
    泰语: "th",
    汤加语: "to",
    土耳其语: "tr",
    乌克兰语: "uk",
    乌尔都语: "ur",
    威尔士语: "cy",
    尤卡坦玛雅语: "yua",
    阿尔巴尼亚语: "sq",
    阿姆哈拉语: "am",
    亚美尼亚语: "hy",
    阿塞拜疆语: "az",
    孟加拉语: "bn",
    巴斯克语: "eu",
    白俄罗斯语: "be",
    宿务语: "ceb",
    科西嘉语: "co",
    世界语: "eo",
    菲律宾语: "tl",
    弗里西语: "fy",
    加利西亚语: "gl",
    格鲁吉亚语: "ka",
    古吉拉特语: "gu",
    豪萨语: "ha",
    夏威夷语: "haw",
    冰岛语: "is",
    伊博语: "ig",
    爱尔兰语: "ga",
    爪哇语: "jw",
    卡纳达语: "kn",
    哈萨克语: "kk",
    高棉语: "km",
    库尔德语: "ku",
    柯尔克孜语: "ky",
    老挝语: "lo",
    拉丁语: "la",
    卢森堡语: "lb",
    马其顿语: "mk",
    马尔加什语: "mg",
    马拉雅拉姆语: "ml",
    毛利语: "mi",
    马拉地语: "mr",
    蒙古语: "mn",
    缅甸语: "my",
    尼泊尔语: "ne",
    齐切瓦语: "ny",
    普什图语: "ps",
    旁遮普语: "pa",
    萨摩亚语: "sm",
    苏格兰盖尔语: "gd",
    塞索托语: "st",
    修纳语: "sn",
    信德语: "sd",
    僧伽罗语: "si",
    索马里语: "so",
    巽他语: "su",
    塔吉克语: "tg",
    泰米尔语: "ta",
    泰卢固语: "te",
    乌兹别克语: "uz",
    南非科萨语: "xh",
    意第绪语: "yi",
    约鲁巴语: "yo",
    南非祖鲁语: "zu",
    自动识别: "auto",
};
// Microsoft languages
const MICROSOFT_LANGUAGES = {
    南非荷兰语: "af",
    阿尔巴尼亚语: "sq",
    阿姆哈拉语: "am",
    阿拉伯语: "ar",
    亚美尼亚语: "hy",
    阿萨姆语: "as",
    "阿塞拜疆语(拉丁语)": "az",
    Bangla: "bn",
    巴什基尔语: "ba",
    巴斯克语: "eu",
    "波斯尼亚语(拉丁语系)": "bs",
    保加利亚语: "bg",
    中文粤语: "yue",
    加泰罗尼亚语: "ca",
    中文文学: "lzh",
    简体中文: "zh-Hans",
    繁体中文: "zh-Hant",
    克罗地亚语: "hr",
    捷克语: "cs",
    丹麦语: "da",
    达里语: "prs",
    马尔代夫语: "dv",
    荷兰语: "nl",
    英语: "en",
    爱沙尼亚语: "et",
    法罗语: "fo",
    斐济语: "fj",
    菲律宾语: "fil",
    芬兰语: "fi",
    法语: "fr",
    "法语（加拿大）": "fr-ca",
    加利西亚语: "gl",
    格鲁吉亚语: "ka",
    德语: "de",
    希腊语: "el",
    古吉拉特语: "gu",
    海地克里奥尔语: "ht",
    希伯来语: "he",
    Hindi: "hi",
    "白苗语（拉丁语）": "mww",
    匈牙利语: "hu",
    冰岛语: "is",
    印度尼西亚语: "id",
    因纽纳敦语: "ikt",
    因纽特语: "iu",
    "因纽特语(拉丁语)": "iu-Latn",
    爱尔兰语: "ga",
    意大利语: "it",
    日语: "ja",
    卡纳达语: "kn",
    哈萨克语: "kk",
    高棉语: "km",
    克林贡语: "tlh-Latn",
    "克林贡语(plqaD)": "tlh-Piqd",
    韩语: "ko",
    "库尔德语(中部)": "ku",
    "库尔德语(北部)": "kmr",
    "吉尔吉斯语(西里尔语)": "ky",
    老挝语: "lo",
    拉脱维亚语: "lv",
    立陶宛语: "lt",
    马其顿语: "mk",
    马达加斯加语: "mg",
    "马来语(拉丁语系)": "ms",
    马拉雅拉姆语: "ml",
    马耳他语: "mt",
    毛利语: "mi",
    马拉地语: "mr",
    "蒙古语(西里尔文)": "mn-Cyrl",
    "蒙古语(传统)": "mn-Mong",
    缅甸: "my",
    尼泊尔语: "ne",
    挪威语: "nb",
    奥里亚语: "or",
    普什图语: "ps",
    波斯语: "fa",
    波兰语: "pl",
    "葡萄牙语（巴西）": "pt",
    "葡萄牙语(葡萄牙)": "pt-pt",
    旁遮普语: "pa",
    克雷塔罗奥托米语: "otq",
    罗马尼亚语: "ro",
    俄语: "ru",
    "萨摩亚语(拉丁语)": "sm",
    "塞尔维亚语（西里尔）": "sr-Cyrl",
    "塞尔维亚语（拉丁）": "sr-Latn",
    斯洛伐克语: "sk",
    斯洛文尼亚语: "sl",
    "索马里语（阿拉伯语）": "so",
    西班牙语: "es",
    "斯瓦希里语（拉丁语）": "sw",
    瑞典语: "sv",
    塔希提语: "ty",
    泰米尔语: "ta",
    "鞑靼语（拉丁语）": "tt",
    泰卢固语: "te",
    泰语: "th",
    藏语: "bo",
    提格里尼亚语: "ti",
    汤加语: "to",
    土耳其语: "tr",
    "土库曼语(拉丁语)": "tk",
    乌克兰语: "uk",
    上索布语: "hsb",
    乌尔都语: "ur",
    "维吾尔语（阿拉伯语）": "ug",
    "乌兹别克语(拉丁语)": "uz",
    越南语: "vi",
    威尔士语: "cy",
    尤卡坦玛雅语: "yua",
    祖鲁语: "zu",
};
// Baidu languages
const BAIDU_LANGUAGES = {
    阿拉伯语: "ara",
    爱尔兰语: "gle",
    奥克语: "oci",
    阿尔巴尼亚语: "alb",
    阿尔及利亚阿拉伯语: "arq",
    阿肯语: "aka",
    阿拉贡语: "arg",
    阿姆哈拉语: "amh",
    阿萨姆语: "asm",
    艾马拉语: "aym",
    阿塞拜疆语: "aze",
    阿斯图里亚斯语: "ast",
    奥塞梯语: "oss",
    爱沙尼亚语: "est",
    奥杰布瓦语: "oji",
    奥里亚语: "ori",
    奥罗莫语: "orm",
    波兰语: "pl",
    波斯语: "per",
    布列塔尼语: "bre",
    巴什基尔语: "bak",
    巴斯克语: "baq",
    巴西葡萄牙语: "pot",
    白俄罗斯语: "bel",
    柏柏尔语: "ber",
    邦板牙语: "pam",
    保加利亚语: "bul",
    北方萨米语: "sme",
    北索托语: "ped",
    本巴语: "bem",
    比林语: "bli",
    比斯拉马语: "bis",
    俾路支语: "bal",
    冰岛语: "ice",
    波斯尼亚语: "bos",
    博杰普尔语: "bho",
    楚瓦什语: "chv",
    聪加语: "tso",
    丹麦语: "dan",
    德语: "de",
    鞑靼语: "tat",
    掸语: "sha",
    德顿语: "tet",
    迪维希语: "div",
    低地德语: "log",
    俄语: "ru",
    法语: "fra",
    菲律宾语: "fil",
    芬兰语: "fin",
    梵语: "san",
    弗留利语: "fri",
    富拉尼语: "ful",
    法罗语: "fao",
    盖尔语: "gla",
    刚果语: "kon",
    高地索布语: "ups",
    高棉语: "hkm",
    格陵兰语: "kal",
    格鲁吉亚语: "geo",
    古吉拉特语: "guj",
    古希腊语: "gra",
    古英语: "eno",
    瓜拉尼语: "grn",
    韩语: "kor",
    荷兰语: "nl",
    胡帕语: "hup",
    哈卡钦语: "hak",
    海地语: "ht",
    黑山语: "mot",
    豪萨语: "hau",
    吉尔吉斯语: "kir",
    加利西亚语: "glg",
    加拿大法语: "frn",
    加泰罗尼亚语: "cat",
    捷克语: "cs",
    卡拜尔语: "kab",
    卡纳达语: "kan",
    卡努里语: "kau",
    卡舒比语: "kah",
    康瓦尔语: "cor",
    科萨语: "xho",
    科西嘉语: "cos",
    克里克语: "cre",
    克里米亚鞑靼语: "cri",
    克林贡语: "kli",
    克罗地亚语: "hrv",
    克丘亚语: "que",
    克什米尔语: "kas",
    孔卡尼语: "kok",
    库尔德语: "kur",
    拉丁语: "lat",
    老挝语: "lao",
    罗马尼亚语: "rom",
    拉特加莱语: "lag",
    拉脱维亚语: "lav",
    林堡语: "lim",
    林加拉语: "lin",
    卢干达语: "lug",
    卢森堡语: "ltz",
    卢森尼亚语: "ruy",
    卢旺达语: "kin",
    立陶宛语: "lit",
    罗曼什语: "roh",
    罗姆语: "ro",
    逻辑语: "loj",
    马来语: "may",
    缅甸语: "bur",
    马拉地语: "mar",
    马拉加斯语: "mg",
    马拉雅拉姆语: "mal",
    马其顿语: "mac",
    马绍尔语: "mah",
    迈蒂利语: "mai",
    曼克斯语: "glv",
    毛里求斯克里奥尔语: "mau",
    毛利语: "mao",
    孟加拉语: "ben",
    马耳他语: "mlt",
    苗语: "hmn",
    挪威语: "nor",
    那不勒斯语: "nea",
    南恩德贝莱语: "nbl",
    南非荷兰语: "afr",
    南索托语: "sot",
    尼泊尔语: "nep",
    葡萄牙语: "pt",
    旁遮普语: "pan",
    帕皮阿门托语: "pap",
    普什图语: "pus",
    齐切瓦语: "nya",
    契维语: "twi",
    切罗基语: "chr",
    日语: "jp",
    瑞典语: "swe",
    萨丁尼亚语: "srd",
    萨摩亚语: "sm",
    "塞尔维亚-克罗地亚语": "sec",
    塞尔维亚语: "srp",
    桑海语: "sol",
    僧伽罗语: "sin",
    世界语: "epo",
    书面挪威语: "nob",
    斯洛伐克语: "sk",
    斯洛文尼亚语: "slo",
    斯瓦希里语: "swa",
    "塞尔维亚语（西里尔）": "src",
    索马里语: "som",
    泰语: "th",
    土耳其语: "tr",
    塔吉克语: "tgk",
    泰米尔语: "tam",
    他加禄语: "tgl",
    提格利尼亚语: "tir",
    泰卢固语: "tel",
    突尼斯阿拉伯语: "tua",
    土库曼语: "tuk",
    乌克兰语: "ukr",
    瓦隆语: "wln",
    威尔士语: "wel",
    文达语: "ven",
    沃洛夫语: "wol",
    乌尔都语: "urd",
    西班牙语: "spa",
    希伯来语: "heb",
    希腊语: "el",
    匈牙利语: "hu",
    西弗里斯语: "fry",
    西里西亚语: "sil",
    希利盖农语: "hil",
    下索布语: "los",
    夏威夷语: "haw",
    新挪威语: "nno",
    西非书面语: "nqo",
    信德语: "snd",
    修纳语: "sna",
    宿务语: "ceb",
    叙利亚语: "syr",
    巽他语: "sun",
    英语: "en",
    印地语: "hi",
    印尼语: "id",
    意大利语: "it",
    越南语: "vie",
    意第绪语: "yid",
    因特语: "ina",
    亚齐语: "ach",
    印古什语: "ing",
    伊博语: "ibo",
    伊多语: "ido",
    约鲁巴语: "yor",
    亚美尼亚语: "arm",
    伊努克提图特语: "iku",
    伊朗语: "ir",
    简体中文: "zh",
    繁体中文: "cht",
    文言文: "wyw",
    中文粤语: "yue",
    扎扎其语: "zaz",
    中古法语: "frm",
    祖鲁语: "zul",
    爪哇语: "jav",
};
// setting's configuration definations
function getLanguageOptions(languages) {
    return Object.keys(languages).reduce((obj, key) => (Object.assign(Object.assign({}, obj), { [languages[key]]: `${key}-${languages[key]}` })), {});
}
function isObject(obj) {
    return (obj !== null && Object.prototype.toString.call(obj) === "[object Object]");
}
function isEmptyObject(obj = {}) {
    return isObject(obj) && Object.keys(obj).length < 1;
}
function validator(items, cb) {
    const errorMessages = items
        .filter((item) => !item.value)
        .map((item) => item.message);
    if (errorMessages.length) {
        noticeHandler(errorMessages.join(", "));
        return;
    }
    else {
        cb();
    }
}
const cleanMarkup = (md) => {
    let output = md || "";
    // Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
    output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*/gm, "");
    output = output
        // Remove HTML tags
        .replace(/<[^>]*>/g, "");
    output = output
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Remove setext-style headers
        .replace(/^[=-]{2,}\s*$/g, "")
        // Remove footnotes?
        .replace(/\[\^.+?\](: .*?$)?/g, "")
        .replace(/\s{0,2}\[.*?\]: .*?$/g, "")
        // Remove images
        .replace(/!\[(.*?)\][[(].*?[\])]/g, "$1")
        // Remove inline links
        .replace(/\[([^\]]*?)\][[(].*?[\])]/g, "$1")
        // Remove blockquotes
        .replace(/^(\n)?\s{0,3}>\s?/gm, "$1")
        // .replace(/(^|\n)\s{0,3}>\s?/g, '\n\n')
        // Remove reference-style links?
        .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "")
        // Remove atx-style headers
        .replace(/^(\n)?\s{0,}#{1,6}\s*( (.+))? +#+$|^(\n)?\s{0,}#{1,6}\s*( (.+))?$/gm, "$1$3$4$6")
        // Remove * emphasis
        .replace(/([*]+)(\S)(.*?\S)??\1/g, "$2$3")
        // Remove _ emphasis. Unlike *, _ emphasis gets rendered only if
        //   1. Either there is a whitespace character before opening _ and after closing _.
        //   2. Or _ is at the start/end of the string.
        .replace(/(^|\W)([_]+)(\S)(.*?\S)??\2($|\W)/g, "$1$3$4$5")
        // Remove code blocks
        .replace(/^```\w*$\n?/gm, "")
        // Remove inline code
        .replace(/`(.+?)`/g, "$1")
        // Replace strike through
        .replace(/~(.*?)~/g, "$1")
        // remove better bibtex citekeys
        .replace(/\[\s*@[\w,\s]+\s*\]/g, "")
        // remove criticmarkup comments
        .replace(/\{>>.*?<<\}/g, "");
    return output;
};
export { noticeHandler, handleTranslate, handleAudio, getLanguageOptions, isEmptyObject, handleMicrosoftTranslate, validator, handleBaiduTranslate, cleanMarkup, LANGUAGES, MICROSOFT_LANGUAGES, BAIDU_LANGUAGES, };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3ZELE9BQU8sRUFBRSxFQUFFLElBQUksTUFBTSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3BDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBZ0I1Qjs7O0dBR0c7QUFDSCxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFFdkQsU0FBUyxRQUFRLENBQUMsQ0FBUztJQUMxQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ3JCLElBQUksR0FBRyxJQUFJLEVBQUU7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4QixPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxHQUFXLEVBQUUsRUFBcUI7SUFDckQsT0FBTyxDQUFDO1FBQ1AsTUFBTSxFQUFFLEtBQUs7UUFDYixHQUFHO0tBQ0gsQ0FBQztTQUNBLElBQUksQ0FBQyxVQUFVLFFBQWE7UUFDNUIsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEMsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLFVBQVUsS0FBMEI7UUFDMUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksYUFBYSxDQUFDLENBQUM7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QUFJO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxLQUFLLEVBQUUsSUFBSTtJQUNYLElBQUksRUFBRSxJQUFJO0lBQ1YsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxJQUFJO0lBQ1QsR0FBRyxFQUFFLElBQUk7SUFDVCxHQUFHLEVBQUUsSUFBSTtJQUNULFFBQVEsRUFBRSxLQUFLO0lBQ2YsS0FBSyxFQUFFLElBQUk7SUFDWCxhQUFhLEVBQUUsU0FBUztJQUN4QixZQUFZLEVBQUUsU0FBUztJQUN2QixLQUFLLEVBQUUsSUFBSTtJQUNYLE1BQU0sRUFBRSxJQUFJO0lBQ1osR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLEVBQUUsRUFBRSxJQUFJO0lBQ1IsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLE1BQU0sRUFBRSxLQUFLO0lBQ2IsTUFBTSxFQUFFLElBQUk7SUFDWixLQUFLLEVBQUUsSUFBSTtJQUNYLEtBQUssRUFBRSxJQUFJO0lBQ1gsS0FBSyxFQUFFLElBQUk7SUFDWCxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsS0FBSyxFQUFFLElBQUk7SUFDWCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsS0FBSyxFQUFFLElBQUk7SUFDWCxLQUFLLEVBQUUsSUFBSTtJQUNYLEtBQUssRUFBRSxJQUFJO0lBQ1gsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsS0FBSztJQUNYLEdBQUcsRUFBRSxJQUFJO0lBQ1QsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixLQUFLLEVBQUUsSUFBSTtJQUNYLEdBQUcsRUFBRSxJQUFJO0lBQ1QsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsS0FBSyxFQUFFLElBQUk7SUFDWCxNQUFNLEVBQUUsSUFBSTtJQUNaLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLE1BQU0sRUFBRSxJQUFJO0lBQ1osSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsS0FBSyxFQUFFLElBQUk7SUFDWCxLQUFLLEVBQUUsSUFBSTtJQUNYLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixLQUFLLEVBQUUsSUFBSTtJQUNYLElBQUksRUFBRSxNQUFNO0NBQ1osQ0FBQztBQUVGLHNCQUFzQjtBQUN0QixNQUFNLG1CQUFtQixHQUFvQjtJQUM1QyxLQUFLLEVBQUUsSUFBSTtJQUNYLE1BQU0sRUFBRSxJQUFJO0lBQ1osS0FBSyxFQUFFLElBQUk7SUFDWCxJQUFJLEVBQUUsSUFBSTtJQUNWLEtBQUssRUFBRSxJQUFJO0lBQ1gsSUFBSSxFQUFFLElBQUk7SUFDVixZQUFZLEVBQUUsSUFBSTtJQUNsQixN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QUs7SUFDWixJQUFJLEVBQUUsS0FBSztJQUNYLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLEtBQUssRUFBRSxLQUFLO0lBQ1osSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsRUFBRSxFQUFFLElBQUk7SUFDUixHQUFHLEVBQUUsS0FBSztJQUNWLEVBQUUsRUFBRSxLQUFLO0lBQ1QsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsRUFBRSxFQUFFLElBQUk7SUFDUixFQUFFLEVBQUUsS0FBSztJQUNULElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixFQUFFLEVBQUUsS0FBSztJQUNULElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLEtBQUs7SUFDWCxLQUFLLEVBQUUsS0FBSztJQUNaLEtBQUssRUFBRSxLQUFLO0lBQ1osSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsRUFBRSxFQUFFLEtBQUs7SUFDVCxHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLEtBQUssRUFBRSxLQUFLO0lBQ1osS0FBSyxFQUFFLEtBQUs7SUFDWixNQUFNLEVBQUUsS0FBSztJQUNiLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLE9BQU8sRUFBRSxLQUFLO0lBQ2QsSUFBSSxFQUFFLEtBQUs7SUFDWCxLQUFLLEVBQUUsS0FBSztJQUNaLElBQUksRUFBRSxLQUFLO0lBQ1gsS0FBSyxFQUFFLEtBQUs7SUFDWixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEtBQUssRUFBRSxLQUFLO0lBQ1osS0FBSyxFQUFFLEtBQUs7SUFDWixLQUFLLEVBQUUsS0FBSztJQUNaLEdBQUcsRUFBRSxLQUFLO0lBQ1YsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsS0FBSyxFQUFFLEtBQUs7SUFDWixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsSUFBSTtJQUNULEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsS0FBSyxFQUFFLElBQUk7SUFDWCxNQUFNLEVBQUUsS0FBSztJQUNiLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsU0FBUyxFQUFFLEtBQUs7SUFDaEIsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsRUFBRSxFQUFFLEtBQUs7SUFDVCxHQUFHLEVBQUUsS0FBSztJQUNWLEtBQUssRUFBRSxLQUFLO0lBQ1osTUFBTSxFQUFFLEtBQUs7SUFDYixLQUFLLEVBQUUsS0FBSztJQUNaLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsTUFBTSxFQUFFLEtBQUs7SUFDYixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsS0FBSztJQUNYLEVBQUUsRUFBRSxJQUFJO0lBQ1IsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLElBQUksRUFBRSxJQUFJO0lBQ1YsWUFBWSxFQUFFLEtBQUs7SUFDbkIsS0FBSyxFQUFFLEtBQUs7SUFDWixHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixLQUFLLEVBQUUsS0FBSztJQUNaLEtBQUssRUFBRSxJQUFJO0lBQ1gsTUFBTSxFQUFFLEtBQUs7SUFDYixLQUFLLEVBQUUsS0FBSztJQUNaLFlBQVksRUFBRSxLQUFLO0lBQ25CLElBQUksRUFBRSxLQUFLO0lBQ1gsRUFBRSxFQUFFLElBQUk7SUFDUixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLE1BQU0sRUFBRSxLQUFLO0lBQ2IsSUFBSSxFQUFFLEtBQUs7SUFDWCxPQUFPLEVBQUUsS0FBSztJQUNkLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxLQUFLO0lBQ1gsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFF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K0I7U0FDOUIsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUU5QixPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLE9BQU8sRUFDTixhQUFhLEVBQ2IsZUFBZSxFQUNmLFdBQVcsRUFDWCxrQkFBa0IsRUFDbEIsYUFBYSxFQUNiLHdCQUF3QixFQUN4QixTQUFTLEVBQ1Qsb0JBQW9CLEVBQ3BCLFdBQVcsRUFDWCxTQUFTLEVBQ1QsbUJBQW1CLEVBQ25CLGVBQWUsR0FDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTm90aWNlLCByZXF1ZXN0LCByZXF1ZXN0VXJsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tIFwidXVpZFwiO1xuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xuaW1wb3J0IHsgTUQ1IH0gZnJvbSBcIi4vbWQ1XCI7XG5cbmludGVyZmFjZSBQYXJhbXMge1xuXHRba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXI7XG59XG5cbmludGVyZmFjZSBMYW5ndWFnZU9wdGlvbnMge1xuXHRba2V5OiBzdHJpbmddOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBNaWNyb3NvZnRUcmFuc2xhdGlvbnMge1xuXHR0cmFuc2xhdGlvbnM6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbnR5cGUgVHJhbnNsYXRlQ2FsbGJhY2sgPSAocmVzOiBhbnkpID0+IHZvaWQ7XG5cbi8qKlxuICogbm90aWNlIGhhbmRsZXJcbiAqIEBwYXJhbSBtc2c6IG5vdGljZSBtZXNzYWdlXG4gKi9cbmNvbnN0IG5vdGljZUhhbmRsZXIgPSAobXNnOiBzdHJpbmcpID0+IG5ldyBOb3RpY2UobXNnKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocTogc3RyaW5nKSB7XG5cdGNvbnN0IGxlbiA9IHEubGVuZ3RoO1xuXHRpZiAobGVuIDw9IDIwKSByZXR1cm4gcTtcblx0cmV0dXJuIHEuc3Vic3RyaW5nKDAsIDEwKSArIGxlbiArIHEuc3Vic3RyaW5nKGxlbiAtIDEwLCBsZW4pO1xufVxuXG4vKipcbiAqIGdldFJlcXVlc3RcbiAqIEBwYXJhbSB1cmxcbiAqIEBwYXJhbSBjYiBjYWxsYmFjayBmdW5jdGlvblxuICovXG5mdW5jdGlvbiBnZXRSZXF1ZXN0KHVybDogc3RyaW5nLCBjYjogVHJhbnNsYXRlQ2FsbGJhY2spIHtcblx0cmVxdWVzdCh7XG5cdFx0bWV0aG9kOiBcImdldFwiLFxuXHRcdHVybCxcblx0fSlcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2U6IGFueSkge1xuXHRcdFx0Y2IoSlNPTi5wYXJzZShyZXNwb25zZSB8fCBcInt9XCIpKTtcblx0XHR9KVxuXHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyb3I6IHsgbWVzc2FnZTogc3RyaW5nIH0pIHtcblx0XHRcdG5vdGljZUhhbmRsZXIoZXJyb3IubWVzc2FnZSB8fCBcIk5vIHJlc3VsdHMhXCIpO1xuXHRcdH0pO1xufVxuXG4vKipcbiAqIHlvdWRhbyB0cmFuc2xhdGUgaGFuZGxlclxuICogQHBhcmFtIHE6IHRleHQgbmVlZCB0cmFuc2xhdGVkXG4gKiBAcGFyYW0gY29uZmlnOiB5b3VkYW8gY29uZmlnXG4gKiBAcGFyYW0gY2I6IGNhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVRyYW5zbGF0ZShcblx0cTogc3RyaW5nLFxuXHRjb25maWc6IHtcblx0XHRhcHBJZDogc3RyaW5nO1xuXHRcdHNlY3JldEtleTogc3RyaW5nO1xuXHRcdGZyb20/OiBzdHJpbmc7XG5cdFx0dG86IHN0cmluZztcblx0fSxcblx0Y2I6IFRyYW5zbGF0ZUNhbGxiYWNrXG4pIHtcblx0Y29uc3Qgc2FsdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRjb25zdCBjdXJ0aW1lID0gTWF0aC5yb3VuZChuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDApO1xuXHRjb25zdCBzdHIxID0gY29uZmlnLmFwcElkICsgdHJ1bmNhdGUocSkgKyBzYWx0ICsgY3VydGltZSArIGNvbmZpZy5zZWNyZXRLZXk7XG5cdC8vIGVuY29kZSBhcyAodXRmLTgpIFVpbnQ4QXJyYXlcblx0Y29uc3QgaGFzaEJ1ZmZlciA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuXHRcdFwiU0hBLTI1NlwiLFxuXHRcdG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzdHIxKVxuXHQpO1xuXHQvLyBoYXNoIHRoZSBtZXNzYWdlXG5cdGNvbnN0IGhhc2hBcnJheSA9IEFycmF5LmZyb20obmV3IFVpbnQ4QXJyYXkoaGFzaEJ1ZmZlcikpOyAvLyBjb252ZXJ0IGJ1ZmZlciB0byBieXRlIGFycmF5XG5cdGNvbnN0IHNpZ24gPSBoYXNoQXJyYXkubWFwKChiKSA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCJcIik7IC8vIGNvbnZlcnQgYnl0ZXMgdG8gaGV4IHN0cmluZ1xuXHRjb25zdCBmcm9tID0gY29uZmlnLmZyb20gfHwgXCJhdXRvXCI7XG5cdGNvbnN0IHBhcmFtczogUGFyYW1zID0ge1xuXHRcdHEsXG5cdFx0YXBwS2V5OiBjb25maWcuYXBwSWQsXG5cdFx0c2FsdCxcblx0XHRmcm9tLFxuXHRcdHRvOiBjb25maWcudG8sXG5cdFx0c2lnbixcblx0XHRjdXJ0aW1lLFxuXHRcdHNpZ25UeXBlOiBcInYzXCIsXG5cdH07XG5cdGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmtleXMocGFyYW1zKVxuXHRcdC5tYXAoKGtleSkgPT4gYCR7a2V5fT0ke3BhcmFtc1trZXldfWApXG5cdFx0LmpvaW4oXCImXCIpO1xuXHRnZXRSZXF1ZXN0KGBodHRwczovL29wZW5hcGkueW91ZGFvLmNvbS9hcGk/JHtxdWVyeX1gLCBjYik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1pY3Jvc29mdFRyYW5zbGF0ZShcblx0cTogc3RyaW5nLFxuXHRjb25maWc6IHtcblx0XHRzZWNyZXRLZXk6IHN0cmluZztcblx0XHRmcm9tPzogc3RyaW5nO1xuXHRcdHRvOiBzdHJpbmc7XG5cdFx0bG9jYXRpb246IHN0cmluZztcblx0fSxcblx0Y2I6IFRyYW5zbGF0ZUNhbGxiYWNrXG4pIHtcblx0Y29uc3QgZW5kcG9pbnQgPSBcImh0dHBzOi8vYXBpLWFwYy5jb2duaXRpdmUubWljcm9zb2Z0dHJhbnNsYXRvci5jb21cIjtcblx0Y29uc3QgeyBmcm9tID0gXCJlblwiLCB0bywgc2VjcmV0S2V5LCBsb2NhdGlvbiB9ID0gY29uZmlnO1xuXG5cdC8vIEFkZCB5b3VyIGxvY2F0aW9uLCBhbHNvIGtub3duIGFzIHJlZ2lvbi4gVGhlIGRlZmF1bHQgaXMgZ2xvYmFsLlxuXHQvLyBUaGlzIGlzIHJlcXVpcmVkIGlmIHVzaW5nIGEgQ29nbml0aXZlIFNlcnZpY2VzIHJlc291cmNlLlxuXHQvLyBUT0RPOiByZXBsYWNlIHdpdGggYHJlcXVlc3RVcmxgIG1ldGhvZFxuXHRheGlvcyh7XG5cdFx0dXJsOiBgJHtlbmRwb2ludH0vdHJhbnNsYXRlP2FwaS12ZXJzaW9uPTMuMCZmcm9tPSR7ZnJvbX0mdG89JHt0b30maW5jbHVkZUFsaWdubWVudD10cnVlJnRleHRUeXBlPWh0bWxgLFxuXHRcdG1ldGhvZDogXCJwb3N0XCIsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0XCJPY3AtQXBpbS1TdWJzY3JpcHRpb24tS2V5XCI6IHNlY3JldEtleSxcblx0XHRcdFwiT2NwLUFwaW0tU3Vic2NyaXB0aW9uLVJlZ2lvblwiOiBsb2NhdGlvbixcblx0XHRcdFwiQ29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuXHRcdFx0XCJYLUNsaWVudFRyYWNlSWRcIjogdXVpZHY0KCkudG9TdHJpbmcoKSxcblx0XHR9LFxuXHRcdGRhdGE6IFt7IHRleHQ6IHEgfV0sXG5cdFx0cmVzcG9uc2VUeXBlOiBcImpzb25cIixcblx0fSlcblx0XHQudGhlbigoeyBkYXRhIH0pID0+IHtcblx0XHRcdGNvbnN0IHJlcyA9IChkYXRhIHx8IFtdKS5yZWR1Y2UoXG5cdFx0XHRcdChzdHI6IHN0cmluZywgaXRlbTogTWljcm9zb2Z0VHJhbnNsYXRpb25zKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgeyB0cmFuc2xhdGlvbnMgPSBbXSB9ID0gaXRlbTtcblx0XHRcdFx0XHRyZXR1cm4gc3RyICsgdHJhbnNsYXRpb25zLm1hcCgoeyB0ZXh0IH0pID0+IHRleHQpLmpvaW4oXCIsIFwiKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0XCJcIlxuXHRcdFx0KTtcblx0XHRcdGNiKHJlcyk7XG5cdFx0fSlcblx0XHQuY2F0Y2goKGUpID0+IHtcblx0XHRcdG5vdGljZUhhbmRsZXIoXCJOZXR3b3JrIEVycm9yIVwiKTtcblx0XHR9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlQmFpZHVUcmFuc2xhdGUoXG5cdHE6IHN0cmluZyxcblx0Y29uZmlnOiB7XG5cdFx0YXBwSWQ6IHN0cmluZztcblx0XHRzZWNyZXRLZXk6IHN0cmluZztcblx0XHRmcm9tPzogc3RyaW5nO1xuXHRcdHRvOiBzdHJpbmc7XG5cdH0sXG5cdGNiOiBUcmFuc2xhdGVDYWxsYmFja1xuKSB7XG5cdGNvbnN0IHsgdG8sIGZyb20sIGFwcElkLCBzZWNyZXRLZXkgfSA9IGNvbmZpZztcblx0Y29uc3Qgc2FsdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHQvLyDlpJrkuKpxdWVyeeWPr+S7peeUqFxcbui/nuaOpSAg5aaCIHF1ZXJ5PSdhcHBsZVxcbm9yYW5nZVxcbmJhbmFuYVxcbnBlYXInXG5cdGNvbnN0IHNpZ24gPSBNRDUoYCR7YXBwSWR9JHtxfSR7c2FsdH0ke3NlY3JldEtleX1gKTtcblx0Z2V0UmVxdWVzdChcblx0XHRgaHR0cDovL2FwaS5mYW55aS5iYWlkdS5jb20vYXBpL3RyYW5zL3ZpcC90cmFuc2xhdGU/cT0ke3F9JmZyb209JHtcblx0XHRcdGZyb20gfHwgXCJlblwiXG5cdFx0fSZ0bz0ke3RvIHx8IFwiemhcIn0mYXBwaWQ9JHthcHBJZH0mc2FsdD0ke3NhbHR9JnNpZ249JHtzaWdufWAsXG5cdFx0Y2Jcblx0KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQXVkaW8odXJsOiBzdHJpbmcsIGNiOiBhbnkpIHtcblx0cmVxdWVzdFVybCh7IG1ldGhvZDogXCJwb3N0XCIsIHVybCB9KVxuXHRcdC50aGVuKChyZXM6IGFueSkgPT4ge1xuXHRcdFx0Y2IocmVzKTtcblx0XHR9KVxuXHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyb3I6IHsgbWVzc2FnZTogc3RyaW5nIH0pIHtcblx0XHRcdG5vdGljZUhhbmRsZXIoZXJyb3IubWVzc2FnZSB8fCBcIk5vIHJlc3VsdHMhXCIpO1xuXHRcdH0pO1xufVxuXG4vLyBsYW5ndWFnZSBvcHRpb25zIGRlZmluYXRpb25cbmNvbnN0IExBTkdVQUdFUzogTGFuZ3VhZ2VPcHRpb25zID0ge1xuXHQvLyDoh6rliqg6ICdhdXRvJyxcblx0566A5L2T5Lit5paHOiBcInpoLUNIU1wiLFxuXHTnuYHkvZPkuK3mloc6IFwiemgtQ0hUXCIsXG5cdOiLseaWhzogXCJlblwiLFxuXHTml6Xmloc6IFwiamFcIixcblx06Z+p5paHOiBcImtvXCIsXG5cdOazleaWhzogXCJmclwiLFxuXHTopb/nj63niZnmloc6IFwiZXNcIixcblx06JGh6JCE54mZ5paHOiBcInB0XCIsXG5cdOaEj+Wkp+WIqeaWhzogXCJpdFwiLFxuXHTkv4Tmloc6IFwicnVcIixcblx06LaK5Y2X5paHOiBcInZpXCIsXG5cdOW+t+aWhzogXCJkZVwiLFxuXHTpmL/mi4nkvK/mloc6IFwiYXJcIixcblx05Y2w5bC85paHOiBcImlkXCIsXG5cdOWNl+mdnuiNt+WFsOivrTogXCJhZlwiLFxuXHTms6Lmlq/lsLzkupror606IFwiYnNcIixcblx05L+d5Yqg5Yip5Lqa6K+tOiBcImJnXCIsXG5cdOS4reaWh+eypOivrTogXCJ5dWVcIixcblx05Yqg5rOw6ZqG6K+tOiBcImNhXCIsXG5cdOWFi+e9l+WcsOS6muivrTogXCJoclwiLFxuXHTmjbflhYvor606IFwiY3NcIixcblx05Li56bqm6K+tOiBcImRhXCIsXG5cdOiNt+WFsOivrTogXCJubFwiLFxuXHTniLHmspnlsLzkupror606IFwiZXRcIixcblx05paQ5rWO6K+tOiBcImZqXCIsXG5cdOiKrOWFsOivrTogXCJmaVwiLFxuXHTluIzohYror606IFwiZWxcIixcblx05rW35Zyw5YWL6YeM5aWl5bCU6K+tOiBcImh0XCIsXG5cdOW4jOS8r+adpeivrTogXCJoZVwiLFxuXHTljbDlnLDor606IFwiaGlcIixcblx055m96IuX6K+tOiBcIm13d1wiLFxuXHTljIjniZnliKnor606IFwiaHVcIixcblx05pav55Om5biM6YeM6K+tOiBcInN3XCIsXG5cdOWFi+ael+i0oeivrTogXCJ0bGhcIixcblx05ouJ6ISx57u05Lqa6K+tOiBcImx2XCIsXG5cdOeri+mZtuWum+ivrTogXCJsdFwiLFxuXHTpqazmnaXor606IFwibXNcIixcblx06ams6ICz5LuW6K+tOiBcIm10XCIsXG5cdOaMquWogeivrTogXCJub1wiLFxuXHTms6Lmlq/or606IFwiZmFcIixcblx05rOi5YWw6K+tOiBcInBsXCIsXG5cdOWFi+mbt+WhlOe9l+WlpeaJmOexs+ivrTogXCJvdHFcIixcblx0572X6ams5bC85Lqa6K+tOiBcInJvXCIsXG5cdFwi5aGe5bCU57u05Lqa6K+tKOilv+mHjOWwlOaWhylcIjogXCJzci1DeXJsXCIsXG5cdFwi5aGe5bCU57u05Lqa6K+tKOaLieS4geaWhylcIjogXCJzci1MYXRuXCIsXG5cdOaWr+a0m+S8kOWFi+ivrTogXCJza1wiLFxuXHTmlq/mtJvmloflsLzkupror606IFwic2xcIixcblx055Ge5YW46K+tOiBcInN2XCIsXG5cdOWhlOW4jOaPkOivrTogXCJ0eVwiLFxuXHTms7Dor606IFwidGhcIixcblx05rGk5Yqg6K+tOiBcInRvXCIsXG5cdOWcn+iAs+WFtuivrTogXCJ0clwiLFxuXHTkuYzlhYvlhbDor606IFwidWtcIixcblx05LmM5bCU6YO96K+tOiBcInVyXCIsXG5cdOWogeWwlOWjq+ivrTogXCJjeVwiLFxuXHTlsKTljaHlnabnjpvpm4Xor606IFwieXVhXCIsXG5cdOmYv+WwlOW3tOWwvOS6muivrTogXCJzcVwiLFxuXHTpmL/lp4blk4jmi4nor606IFwiYW1cIixcblx05Lqa576O5bC85Lqa6K+tOiBcImh5XCIsXG5cdOmYv+WhnuaLnOeWhuivrTogXCJhelwiLFxuXHTlrZ/liqDmi4nor606IFwiYm5cIixcblx05be05pav5YWL6K+tOiBcImV1XCIsXG5cdOeZveS/hOe9l+aWr+ivrTogXCJiZVwiLFxuXHTlrr/liqHor606IFwiY2ViXCIsXG5cdOenkeilv+WYieivrTogXCJjb1wiLFxuXHTkuJbnlYzor606IFwiZW9cIixcblx06I+y5b6L5a6+6K+tOiBcInRsXCIsXG5cdOW8l+mHjOilv+ivrTogXCJmeVwiLFxuXHTliqDliKnopb/kupror606IFwiZ2xcIixcblx05qC86bKB5ZCJ5Lqa6K+tOiBcImthXCIsXG5cdOWPpOWQieaLieeJueivrTogXCJndVwiLFxuXHTosarokKjor606IFwiaGFcIixcblx05aSP5aiB5aS36K+tOiBcImhhd1wiLFxuXHTlhrDlspvor606IFwiaXNcIixcblx05LyK5Y2a6K+tOiBcImlnXCIsXG5cdOeIseWwlOWFsOivrTogXCJnYVwiLFxuXHTniKrlk4for606IFwiandcIixcblx05Y2h57qz6L6+6K+tOiBcImtuXCIsXG5cdOWTiOiQqOWFi+ivrTogXCJra1wiLFxuXHTpq5jmo4nor606IFwia21cIixcblx05bqT5bCU5b636K+tOiBcImt1XCIsXG5cdOafr+WwlOWFi+WtnOivrTogXCJreVwiLFxuXHTogIHmjJ3or606IFwibG9cIixcblx05ouJ5LiB6K+tOiBcImxhXCIsXG5cdOWNouajruWgoeivrTogXCJsYlwiLFxuXHTpqazlhbbpob/or606IFwibWtcIixcblx06ams5bCU5Yqg5LuA6K+tOiBcIm1nXCIsXG5cdOmprOaLiembheaLieWnhuivrTogXCJtbFwiLFxuXHTmr5vliKnor606IFwibWlcIixcblx06ams5ouJ5Zyw6K+tOiBcIm1yXCIsXG5cdOiSmeWPpOivrTogXCJtblwiLFxuXHTnvIXnlLjor606IFwibXlcIixcblx05bC85rOK5bCU6K+tOiBcIm5lXCIsXG5cdOm9kOWIh+eTpuivrTogXCJueVwiLFxuXHTmma7ku4Dlm77or606IFwicHNcIixcblx05peB6YGu5pmu6K+tOiBcInBhXCIsXG5cdOiQqOaRqeS6muivrTogXCJzbVwiLFxuXHToi4/moLzlhbDnm5blsJTor606IFwiZ2RcIixcblx05aGe57Si5omY6K+tOiBcInN0XCIsXG5cdOS/rue6s+ivrTogXCJzblwiLFxuXHTkv6Hlvrfor606IFwic2RcIixcblx05YOn5Ly9572X6K+tOiBcInNpXCIsXG5cdOe0oumprOmHjOivrTogXCJzb1wiLFxuXHTlt73ku5bor606IFwic3VcIixcblx05aGU5ZCJ5YWL6K+tOiBcInRnXCIsXG5cdOazsOexs+WwlOivrTogXCJ0YVwiLFxuXHTms7DljaLlm7ror606IFwidGVcIixcblx05LmM5YW55Yir5YWL6K+tOiBcInV6XCIsXG5cdOWNl+mdnuenkeiQqOivrTogXCJ4aFwiLFxuXHTmhI/nrKznu6ror606IFwieWlcIixcblx057qm6bKB5be06K+tOiBcInlvXCIsXG5cdOWNl+mdnuellumygeivrTogXCJ6dVwiLFxuXHToh6rliqjor4bliKs6IFwiYXV0b1wiLFxufTtcblxuLy8gTWljcm9zb2Z0IGxhbmd1YWdlc1xuY29uc3QgTUlDUk9TT0ZUX0xBTkdVQUdFUzogTGFuZ3VhZ2VPcHRpb25zID0ge1xuXHTljZfpnZ7ojbflhbDor606IFwiYWZcIixcblx06Zi/5bCU5be05bC85Lqa6K+tOiBcInNxXCIsXG5cdOmYv+WnhuWTiOaLieivrTogXCJhbVwiLFxuXHTpmL/mi4nkvK/or606IFwiYXJcIixcblx05Lqa576O5bC85Lqa6K+tOiBcImh5XCIsXG5cdOmYv+iQqOWnhuivrTogXCJhc1wiLFxuXHRcIumYv+WhnuaLnOeWhuivrSjmi4nkuIHor60pXCI6IFwiYXpcIixcblx0QmFuZ2xhOiBcImJuXCIsXG5cdOW3tOS7gOWfuuWwlOivrTogXCJiYVwiLFxuXHTlt7Tmlq/lhYvor606IFwiZXVcIixcblx0XCLms6Lmlq/lsLzkupror60o5ouJ5LiB6K+t57O7KVwiOiBcImJzXCIsXG5cdOS/neWKoOWIqeS6muivrTogXCJiZ1wiLFxuXHTkuK3mlofnsqTor606IFwieXVlXCIsXG5cdOWKoOazsOe9l+WwvOS6muivrTogXCJjYVwiLFxuXHTkuK3mlofmloflraY6IFwibHpoXCIsXG5cdOeugOS9k+S4reaWhzogXCJ6aC1IYW5zXCIsXG5cdOe5geS9k+S4reaWhzogXCJ6aC1IYW50XCIsXG5cdOWFi+e9l+WcsOS6muivrTogXCJoclwiLFxuXHTmjbflhYvor606IFwiY3NcIixcblx05Li56bqm6K+tOiBcImRhXCIsXG5cdOi+vumHjOivrTogXCJwcnNcIixcblx06ams5bCU5Luj5aSr6K+tOiBcImR2XCIsXG5cdOiNt+WFsOivrTogXCJubFwiLFxuXHToi7Hor606IFwiZW5cIixcblx054ix5rKZ5bC85Lqa6K+tOiBcImV0XCIsXG5cdOazlee9l+ivrTogXCJmb1wiLFxuXHTmlpDmtY7or606IFwiZmpcIixcblx06I+y5b6L5a6+6K+tOiBcImZpbFwiLFxuXHToiqzlhbDor606IFwiZmlcIixcblx05rOV6K+tOiBcImZyXCIsXG5cdFwi5rOV6K+t77yI5Yqg5ou/5aSn77yJXCI6IFwiZnItY2FcIixcblx05Yqg5Yip6KW/5Lqa6K+tOiBcImdsXCIsXG5cdOagvOmygeWQieS6muivrTogXCJrYVwiLFxuXHTlvrfor606IFwiZGVcIixcblx05biM6IWK6K+tOiBcImVsXCIsXG5cdOWPpOWQieaLieeJueivrTogXCJndVwiLFxuXHTmtbflnLDlhYvph4zlpaXlsJTor606IFwiaHRcIixcblx05biM5Lyv5p2l6K+tOiBcImhlXCIsXG5cdEhpbmRpOiBcImhpXCIsXG5cdFwi55m96IuX6K+t77yI5ouJ5LiB6K+t77yJXCI6IFwibXd3XCIsXG5cdOWMiOeJmeWIqeivrTogXCJodVwiLFxuXHTlhrDlspvor606IFwiaXNcIixcblx05Y2w5bqm5bC86KW/5Lqa6K+tOiBcImlkXCIsXG5cdOWboOe6vee6s+aVpuivrTogXCJpa3RcIixcblx05Zug57q954m56K+tOiBcIml1XCIsXG5cdFwi5Zug57q954m56K+tKOaLieS4geivrSlcIjogXCJpdS1MYXRuXCIsXG5cdOeIseWwlOWFsOivrTogXCJnYVwiLFxuXHTmhI/lpKfliKnor606IFwiaXRcIixcblx05pel6K+tOiBcImphXCIsXG5cdOWNoee6s+i+vuivrTogXCJrblwiLFxuXHTlk4jokKjlhYvor606IFwia2tcIixcblx06auY5qOJ6K+tOiBcImttXCIsXG5cdOWFi+ael+i0oeivrTogXCJ0bGgtTGF0blwiLFxuXHRcIuWFi+ael+i0oeivrShwbHFhRClcIjogXCJ0bGgtUGlxZFwiLFxuXHTpn6nor606IFwia29cIixcblx0XCLlupPlsJTlvrfor60o5Lit6YOoKVwiOiBcImt1XCIsXG5cdFwi5bqT5bCU5b636K+tKOWMl+mDqClcIjogXCJrbXJcIixcblx0XCLlkInlsJTlkInmlq/or60o6KW/6YeM5bCU6K+tKVwiOiBcImt5XCIsXG5cdOiAgeaMneivrTogXCJsb1wiLFxuXHTmi4nohLHnu7Tkupror606IFwibHZcIixcblx056uL6Zm25a6b6K+tOiBcImx0XCIsXG5cdOmprOWFtumhv+ivrTogXCJta1wiLFxuXHTpqazovr7liqDmlq/liqDor606IFwibWdcIixcblx0XCLpqazmnaXor60o5ouJ5LiB6K+t57O7KVwiOiBcIm1zXCIsXG5cdOmprOaLiembheaLieWnhuivrTogXCJtbFwiLFxuXHTpqazogLPku5bor606IFwibXRcIixcblx05q+b5Yip6K+tOiBcIm1pXCIsXG5cdOmprOaLieWcsOivrTogXCJtclwiLFxuXHRcIuiSmeWPpOivrSjopb/ph4zlsJTmlocpXCI6IFwibW4tQ3lybFwiLFxuXHRcIuiSmeWPpOivrSjkvKDnu58pXCI6IFwibW4tTW9uZ1wiLFxuXHTnvIXnlLg6IFwibXlcIixcblx05bC85rOK5bCU6K+tOiBcIm5lXCIsXG5cdOaMquWogeivrTogXCJuYlwiLFxuXHTlpaXph4zkupror606IFwib3JcIixcblx05pmu5LuA5Zu+6K+tOiBcInBzXCIsXG5cdOazouaWr+ivrTogXCJmYVwiLFxuXHTms6LlhbDor606IFwicGxcIixcblx0XCLokaHokITniZnor63vvIjlt7Topb/vvIlcIjogXCJwdFwiLFxuXHRcIuiRoeiQhOeJmeivrSjokaHokITniZkpXCI6IFwicHQtcHRcIixcblx05peB6YGu5pmu6K+tOiBcInBhXCIsXG5cdOWFi+mbt+WhlOe9l+WlpeaJmOexs+ivrTogXCJvdHFcIixcblx0572X6ams5bC85Lqa6K+tOiBcInJvXCIsXG5cdOS/hOivrTogXCJydVwiLFxuXHRcIuiQqOaRqeS6muivrSjmi4nkuIHor60pXCI6IFwic21cIixcblx0XCLloZ7lsJTnu7Tkupror63vvIjopb/ph4zlsJTvvIlcIjogXCJzci1DeXJsXCIsXG5cdFwi5aGe5bCU57u05Lqa6K+t77yI5ouJ5LiB77yJXCI6IFwic3ItTGF0blwiLFxuXHTmlq/mtJvkvJDlhYvor606IFwic2tcIixcblx05pav5rSb5paH5bC85Lqa6K+tOiBcInNsXCIsXG5cdFwi57Si6ams6YeM6K+t77yI6Zi/5ouJ5Lyv6K+t77yJXCI6IFwic29cIixcblx06KW/54+t54mZ6K+tOiBcImVzXCIsXG5cdFwi5pav55Om5biM6YeM6K+t77yI5ouJ5LiB6K+t77yJXCI6IFwic3dcIixcblx055Ge5YW46K+tOiBcInN2XCIsXG5cdOWhlOW4jOaPkOivrTogXCJ0eVwiLFxuXHTms7DnsbPlsJTor606IFwidGFcIixcblx0XCLpnpHpnbzor63vvIjmi4nkuIHor63vvIlcIjogXCJ0dFwiLFxuXHTms7DljaLlm7ror606IFwidGVcIixcblx05rOw6K+tOiBcInRoXCIsXG5cdOiXj+ivrTogXCJib1wiLFxuXHTmj5DmoLzph4zlsLzkupror606IFwidGlcIixcblx05rGk5Yqg6K+tOiBcInRvXCIsXG5cdOWcn+iAs+WFtuivrTogXCJ0clwiLFxuXHRcIuWcn+W6k+abvOivrSjmi4nkuIHor60pXCI6IFwidGtcIixcblx05LmM5YWL5YWw6K+tOiBcInVrXCIsXG5cdOS4iue0ouW4g+ivrTogXCJoc2JcIixcblx05LmM5bCU6YO96K+tOiBcInVyXCIsXG5cdFwi57u05ZC+5bCU6K+t77yI6Zi/5ouJ5Lyv6K+t77yJXCI6IFwidWdcIixcblx0XCLkuYzlhbnliKvlhYvor60o5ouJ5LiB6K+tKVwiOiBcInV6XCIsXG5cdOi2iuWNl+ivrTogXCJ2aVwiLFxuXHTlqIHlsJTlo6vor606IFwiY3lcIixcblx05bCk5Y2h5Z2m546b6ZuF6K+tOiBcInl1YVwiLFxuXHTnpZbpsoHor606IFwienVcIixcbn07XG5cbi8vIEJhaWR1IGxhbmd1YWdlc1xuY29uc3QgQkFJRFVfTEFOR1VBR0VTOiBMYW5ndWFnZU9wdGlvbnMgPSB7XG5cdOmYv+aLieS8r+ivrTogXCJhcmFcIixcblx054ix5bCU5YWw6K+tOiBcImdsZVwiLFxuXHTlpaXlhYvor606IFwib2NpXCIsXG5cdOmYv+WwlOW3tOWwvOS6muivrTogXCJhbGJcIixcblx06Zi/5bCU5Y+K5Yip5Lqa6Zi/5ouJ5Lyv6K+tOiBcImFycVwiLFxuXHTpmL/ogq/or606IFwiYWthXCIsXG5cdOmYv+aLiei0oeivrTogXCJhcmdcIixcblx06Zi/5aeG5ZOI5ouJ6K+tOiBcImFtaFwiLFxuXHTpmL/okKjlp4bor606IFwiYXNtXCIsXG5cdOiJvumprOaLieivrTogXCJheW1cIixcblx06Zi/5aGe5ouc55aG6K+tOiBcImF6ZVwiLFxuXHTpmL/mlq/lm77ph4zkuprmlq/or606IFwiYXN0XCIsXG5cdOWlpeWhnuair+ivrTogXCJvc3NcIixcblx054ix5rKZ5bC85Lqa6K+tOiBcImVzdFwiLFxuXHTlpaXmnbDluIPnk6bor606IFwib2ppXCIsXG5cdOWlpemHjOS6muivrTogXCJvcmlcIixcblx05aWl572X6I6r6K+tOiBcIm9ybVwiLFxuXHTms6LlhbDor606IFwicGxcIixcblx05rOi5pav6K+tOiBcInBlclwiLFxuXHTluIPliJfloZTlsLzor606IFwiYnJlXCIsXG5cdOW3tOS7gOWfuuWwlOivrTogXCJiYWtcIixcblx05be05pav5YWL6K+tOiBcImJhcVwiLFxuXHTlt7Topb/okaHokITniZnor606IFwicG90XCIsXG5cdOeZveS/hOe9l+aWr+ivrTogXCJiZWxcIixcblx05p+P5p+P5bCU6K+tOiBcImJlclwiLFxuXHTpgqbmnb/niZnor606IFwicGFtXCIsXG5cdOS/neWKoOWIqeS6muivrTogXCJidWxcIixcblx05YyX5pa56JCo57Gz6K+tOiBcInNtZVwiLFxuXHTljJfntKLmiZjor606IFwicGVkXCIsXG5cdOacrOW3tOivrTogXCJiZW1cIixcblx05q+U5p6X6K+tOiBcImJsaVwiLFxuXHTmr5Tmlq/mi4npqazor606IFwiYmlzXCIsXG5cdOS/vui3r+aUr+ivrTogXCJiYWxcIixcblx05Yaw5bKb6K+tOiBcImljZVwiLFxuXHTms6Lmlq/lsLzkupror606IFwiYm9zXCIsXG5cdOWNmuadsOaZruWwlOivrTogXCJiaG9cIixcblx05qWa55Om5LuA6K+tOiBcImNodlwiLFxuXHTogarliqDor606IFwidHNvXCIsXG5cdOS4uem6puivrTogXCJkYW5cIixcblx05b636K+tOiBcImRlXCIsXG5cdOmekemdvOivrTogXCJ0YXRcIixcblx05o646K+tOiBcInNoYVwiLFxuXHTlvrfpob/or606IFwidGV0XCIsXG5cdOi/que7tOW4jOivrTogXCJkaXZcIixcblx05L2O5Zyw5b636K+tOiBcImxvZ1wiLFxuXHTkv4Tor606IFwicnVcIixcblx05rOV6K+tOiBcImZyYVwiLFxuXHToj7Llvovlrr7or606IFwiZmlsXCIsXG5cdOiKrOWFsOivrTogXCJmaW5cIixcblx05qK16K+tOiBcInNhblwiLFxuXHTlvJfnlZnliKnor606IFwiZnJpXCIsXG5cdOWvjOaLieWwvOivrTogXCJmdWxcIixcblx05rOV572X6K+tOiBcImZhb1wiLFxuXHTnm5blsJTor606IFwiZ2xhXCIsXG5cdOWImuaenOivrTogXCJrb25cIixcblx06auY5Zyw57Si5biD6K+tOiBcInVwc1wiLFxuXHTpq5jmo4nor606IFwiaGttXCIsXG5cdOagvOmZteWFsOivrTogXCJrYWxcIixcblx05qC86bKB5ZCJ5Lqa6K+tOiBcImdlb1wiLFxuXHTlj6TlkInmi4nnibnor606IFwiZ3VqXCIsXG5cdOWPpOW4jOiFiuivrTogXCJncmFcIixcblx05Y+k6Iux6K+tOiBcImVub1wiLFxuXHTnk5zmi4nlsLzor606IFwiZ3JuXCIsXG5cdOmfqeivrTogXCJrb3JcIixcblx06I235YWw6K+tOiBcIm5sXCIsXG5cdOiDoeW4leivrTogXCJodXBcIixcblx05ZOI5Y2h6ZKm6K+tOiBcImhha1wiLFxuXHTmtbflnLDor606IFwiaHRcIixcblx06buR5bGx6K+tOiBcIm1vdFwiLFxuXHTosarokKjor606IFwiaGF1XCIsXG5cdOWQieWwlOWQieaWr+ivrTogXCJraXJcIixcblx05Yqg5Yip6KW/5Lqa6K+tOiBcImdsZ1wiLFxuXHTliqDmi7/lpKfms5Xor606IFwiZnJuXCIsXG5cdOWKoOazsOe9l+WwvOS6muivrTogXCJjYXRcIixcblx05o235YWL6K+tOiBcImNzXCIsXG5cdOWNoeaLnOWwlOivrTogXCJrYWJcIixcblx05Y2h57qz6L6+6K+tOiBcImthblwiLFxuXHTljaHliqrph4zor606IFwia2F1XCIsXG5cdOWNoeiIkuavlOivrTogXCJrYWhcIixcblx05bq355Om5bCU6K+tOiBcImNvclwiLFxuXHTnp5HokKjor606IFwieGhvXCIsXG5cdOenkeilv+WYieivrTogXCJjb3NcIixcblx05YWL6YeM5YWL6K+tOiBcImNyZVwiLFxuXHTlhYvph4znsbPkuprpnpHpnbzor606IFwiY3JpXCIsXG5cdOWFi+ael+i0oeivrTogXCJrbGlcIixcblx05YWL572X5Zyw5Lqa6K+tOiBcImhydlwiLFxuXHTlhYvkuJjkupror606IFwicXVlXCIsXG5cdOWFi+S7gOexs+WwlOivrTogXCJrYXNcIixcblx05a2U5Y2h5bC86K+tOiBcImtva1wiLFxuXHTlupPlsJTlvrfor606IFwia3VyXCIsXG5cdOaLieS4geivrTogXCJsYXRcIixcblx06ICB5oyd6K+tOiBcImxhb1wiLFxuXHTnvZfpqazlsLzkupror606IFwicm9tXCIsXG5cdOaLieeJueWKoOiOseivrTogXCJsYWdcIixcblx05ouJ6ISx57u05Lqa6K+tOiBcImxhdlwiLFxuXHTmnpfloKHor606IFwibGltXCIsXG5cdOael+WKoOaLieivrTogXCJsaW5cIixcblx05Y2i5bmy6L6+6K+tOiBcImx1Z1wiLFxuXHTljaLmo67loKHor606IFwibHR6XCIsXG5cdOWNouajruWwvOS6muivrTogXCJydXlcIixcblx05Y2i5pe66L6+6K+tOiBcImtpblwiLFxuXHTnq4vpmbblrpvor606IFwibGl0XCIsXG5cdOe9l+abvOS7gOivrTogXCJyb2hcIixcblx0572X5aeG6K+tOiBcInJvXCIsXG5cdOmAu+i+keivrTogXCJsb2pcIixcblx06ams5p2l6K+tOiBcIm1heVwiLFxuXHTnvIXnlLjor606IFwiYnVyXCIsXG5cdOmprOaLieWcsOivrTogXCJtYXJcIixcblx06ams5ouJ5Yqg5pav6K+tOiBcIm1nXCIsXG5cdOmprOaLiembheaLieWnhuivrTogXCJtYWxcIixcblx06ams5YW26aG/6K+tOiBcIm1hY1wiLFxuXHTpqaznu43lsJTor606IFwibWFoXCIsXG5cdOi/iOiSguWIqeivrTogXCJtYWlcIixcblx05pu85YWL5pav6K+tOiBcImdsdlwiLFxuXHTmr5vph4zmsYLmlq/lhYvph4zlpaXlsJTor606IFwibWF1XCIsXG5cdOavm+WIqeivrTogXCJtYW9cIixcblx05a2f5Yqg5ouJ6K+tOiBcImJlblwiLFxuXHTpqazogLPku5bor606IFwibWx0XCIsXG5cdOiLl+ivrTogXCJobW5cIixcblx05oyq5aiB6K+tOiBcIm5vclwiLFxuXHTpgqPkuI3li5Lmlq/or606IFwibmVhXCIsXG5cdOWNl+aBqeW+t+i0neiOseivrTogXCJuYmxcIixcblx05Y2X6Z2e6I235YWw6K+tOiBcImFmclwiLFxuXHTljZfntKLmiZjor606IFwic290XCIsXG5cdOWwvOaziuWwlOivrTogXCJuZXBcIixcblx06JGh6JCE54mZ6K+tOiBcInB0XCIsXG5cdOaXgemBruaZruivrTogXCJwYW5cIixcblx05biV55qu6Zi/6Zeo5omY6K+tOiBcInBhcFwiLFxuXHTmma7ku4Dlm77or606IFwicHVzXCIsXG5cdOm9kOWIh+eTpuivrTogXCJueWFcIixcblx05aWR57u06K+tOiBcInR3aVwiLFxuXHTliIfnvZfln7ror606IFwiY2hyXCIsXG5cdOaXpeivrTogXCJqcFwiLFxuXHTnkZ7lhbjor606IFwic3dlXCIsXG5cdOiQqOS4geWwvOS6muivrTogXCJzcmRcIixcblx06JCo5pGp5Lqa6K+tOiBcInNtXCIsXG5cdFwi5aGe5bCU57u05LqaLeWFi+e9l+WcsOS6muivrVwiOiBcInNlY1wiLFxuXHTloZ7lsJTnu7Tkupror606IFwic3JwXCIsXG5cdOahkea1t+ivrTogXCJzb2xcIixcblx05YOn5Ly9572X6K+tOiBcInNpblwiLFxuXHTkuJbnlYzor606IFwiZXBvXCIsXG5cdOS5pumdouaMquWogeivrTogXCJub2JcIixcblx05pav5rSb5LyQ5YWL6K+tOiBcInNrXCIsXG5cdOaWr+a0m+aWh+WwvOS6muivrTogXCJzbG9cIixcblx05pav55Om5biM6YeM6K+tOiBcInN3YVwiLFxuXHRcIuWhnuWwlOe7tOS6muivre+8iOilv+mHjOWwlO+8iVwiOiBcInNyY1wiLFxuXHTntKLpqazph4zor606IFwic29tXCIsXG5cdOazsOivrTogXCJ0aFwiLFxuXHTlnJ/ogLPlhbbor606IFwidHJcIixcblx05aGU5ZCJ5YWL6K+tOiBcInRna1wiLFxuXHTms7DnsbPlsJTor606IFwidGFtXCIsXG5cdOS7luWKoOemhOivrTogXCJ0Z2xcIixcblx05o+Q5qC85Yip5bC85Lqa6K+tOiBcInRpclwiLFxuXHTms7DljaLlm7ror606IFwidGVsXCIsXG5cdOeqgeWwvOaWr+mYv+aLieS8r+ivrTogXCJ0dWFcIixcblx05Zyf5bqT5pu86K+tOiBcInR1a1wiLFxuXHTkuYzlhYvlhbDor606IFwidWtyXCIsXG5cdOeTpumahuivrTogXCJ3bG5cIixcblx05aiB5bCU5aOr6K+tOiBcIndlbFwiLFxuXHTmlofovr7or606IFwidmVuXCIsXG5cdOayg+a0m+Wkq+ivrTogXCJ3b2xcIixcblx05LmM5bCU6YO96K+tOiBcInVyZFwiLFxuXHTopb/nj63niZnor606IFwic3BhXCIsXG5cdOW4jOS8r+adpeivrTogXCJoZWJcIixcblx05biM6IWK6K+tOiBcImVsXCIsXG5cdOWMiOeJmeWIqeivrTogXCJodVwiLFxuXHTopb/lvJfph4zmlq/or606IFwiZnJ5XCIsXG5cdOilv+mHjOilv+S6muivrTogXCJzaWxcIixcblx05biM5Yip55uW5Yac6K+tOiBcImhpbFwiLFxuXHTkuIvntKLluIPor606IFwibG9zXCIsXG5cdOWkj+WogeWkt+ivrTogXCJoYXdcIixcblx05paw5oyq5aiB6K+tOiBcIm5ub1wiLFxuXHTopb/pnZ7kuabpnaLor606IFwibnFvXCIsXG5cdOS/oeW+t+ivrTogXCJzbmRcIixcblx05L+u57qz6K+tOiBcInNuYVwiLFxuXHTlrr/liqHor606IFwiY2ViXCIsXG5cdOWPmeWIqeS6muivrTogXCJzeXJcIixcblx05be95LuW6K+tOiBcInN1blwiLFxuXHToi7Hor606IFwiZW5cIixcblx05Y2w5Zyw6K+tOiBcImhpXCIsXG5cdOWNsOWwvOivrTogXCJpZFwiLFxuXHTmhI/lpKfliKnor606IFwiaXRcIixcblx06LaK5Y2X6K+tOiBcInZpZVwiLFxuXHTmhI/nrKznu6ror606IFwieWlkXCIsXG5cdOWboOeJueivrTogXCJpbmFcIixcblx05Lqa6b2Q6K+tOiBcImFjaFwiLFxuXHTljbDlj6Tku4Dor606IFwiaW5nXCIsXG5cdOS8iuWNmuivrTogXCJpYm9cIixcblx05LyK5aSa6K+tOiBcImlkb1wiLFxuXHTnuqbpsoHlt7Tor606IFwieW9yXCIsXG5cdOS6mue+juWwvOS6muivrTogXCJhcm1cIixcblx05LyK5Yqq5YWL5o+Q5Zu+54m56K+tOiBcImlrdVwiLFxuXHTkvIrmnJfor606IFwiaXJcIixcblx0566A5L2T5Lit5paHOiBcInpoXCIsXG5cdOe5geS9k+S4reaWhzogXCJjaHRcIixcblx05paH6KiA5paHOiBcInd5d1wiLFxuXHTkuK3mlofnsqTor606IFwieXVlXCIsXG5cdOaJjuaJjuWFtuivrTogXCJ6YXpcIixcblx05Lit5Y+k5rOV6K+tOiBcImZybVwiLFxuXHTnpZbpsoHor606IFwienVsXCIsXG5cdOeIquWTh+ivrTogXCJqYXZcIixcbn07XG5cbi8vIHNldHRpbmcncyBjb25maWd1cmF0aW9uIGRlZmluYXRpb25zXG5mdW5jdGlvbiBnZXRMYW5ndWFnZU9wdGlvbnMobGFuZ3VhZ2VzOiBMYW5ndWFnZU9wdGlvbnMpOiBMYW5ndWFnZU9wdGlvbnMge1xuXHRyZXR1cm4gT2JqZWN0LmtleXMobGFuZ3VhZ2VzKS5yZWR1Y2UoXG5cdFx0KG9iajogTGFuZ3VhZ2VPcHRpb25zLCBrZXk6IHN0cmluZykgPT4gKHtcblx0XHRcdC4uLm9iaixcblx0XHRcdFtsYW5ndWFnZXNba2V5XV06IGAke2tleX0tJHtsYW5ndWFnZXNba2V5XX1gLFxuXHRcdH0pLFxuXHRcdHt9XG5cdCk7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iajogYW55KSB7XG5cdHJldHVybiAoXG5cdFx0b2JqICE9PSBudWxsICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG5cdCk7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHlPYmplY3Qob2JqID0ge30pIHtcblx0cmV0dXJuIGlzT2JqZWN0KG9iaikgJiYgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPCAxO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0b3IoXG5cdGl0ZW1zOiBBcnJheTx7IHZhbHVlOiBzdHJpbmc7IG1lc3NhZ2U6IHN0cmluZyB9Pixcblx0Y2I6ICgpID0+IHZvaWRcbikge1xuXHRjb25zdCBlcnJvck1lc3NhZ2VzID0gaXRlbXNcblx0XHQuZmlsdGVyKChpdGVtKSA9PiAhaXRlbS52YWx1ZSlcblx0XHQubWFwKChpdGVtKSA9PiBpdGVtLm1lc3NhZ2UpO1xuXHRpZiAoZXJyb3JNZXNzYWdlcy5sZW5ndGgpIHtcblx0XHRub3RpY2VIYW5kbGVyKGVycm9yTWVzc2FnZXMuam9pbihcIiwgXCIpKTtcblx0XHRyZXR1cm47XG5cdH0gZWxzZSB7XG5cdFx0Y2IoKTtcblx0fVxufVxuXG5jb25zdCBjbGVhbk1hcmt1cCA9IChtZDogc3RyaW5nKSA9PiB7XG5cdGxldCBvdXRwdXQgPSBtZCB8fCBcIlwiO1xuXG5cdC8vIFJlbW92ZSBob3Jpem9udGFsIHJ1bGVzIChzdHJpcExpc3RIZWFkZXJzIGNvbmZsaWN0IHdpdGggdGhpcyBydWxlLCB3aGljaCBpcyB3aHkgaXQgaGFzIGJlZW4gbW92ZWQgdG8gdGhlIHRvcClcblx0b3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL14oLVxccyo/fFxcKlxccyo/fF9cXHMqPyl7Myx9XFxzKi9nbSwgXCJcIik7XG5cblx0b3V0cHV0ID0gb3V0cHV0XG5cdFx0Ly8gUmVtb3ZlIEhUTUwgdGFnc1xuXHRcdC5yZXBsYWNlKC88W14+XSo+L2csIFwiXCIpO1xuXG5cdG91dHB1dCA9IG91dHB1dFxuXHRcdC8vIFJlbW92ZSBIVE1MIHRhZ3Ncblx0XHQucmVwbGFjZSgvPFtePl0qPi9nLCBcIlwiKVxuXHRcdC8vIFJlbW92ZSBzZXRleHQtc3R5bGUgaGVhZGVyc1xuXHRcdC5yZXBsYWNlKC9eWz0tXXsyLH1cXHMqJC9nLCBcIlwiKVxuXHRcdC8vIFJlbW92ZSBmb290bm90ZXM/XG5cdFx0LnJlcGxhY2UoL1xcW1xcXi4rP1xcXSg6IC4qPyQpPy9nLCBcIlwiKVxuXHRcdC5yZXBsYWNlKC9cXHN7MCwyfVxcWy4qP1xcXTogLio/JC9nLCBcIlwiKVxuXHRcdC8vIFJlbW92ZSBpbWFnZXNcblx0XHQucmVwbGFjZSgvIVxcWyguKj8pXFxdW1soXS4qP1tcXF0pXS9nLCBcIiQxXCIpXG5cdFx0Ly8gUmVtb3ZlIGlubGluZSBsaW5rc1xuXHRcdC5yZXBsYWNlKC9cXFsoW15cXF1dKj8pXFxdW1soXS4qP1tcXF0pXS9nLCBcIiQxXCIpXG5cdFx0Ly8gUmVtb3ZlIGJsb2NrcXVvdGVzXG5cdFx0LnJlcGxhY2UoL14oXFxuKT9cXHN7MCwzfT5cXHM/L2dtLCBcIiQxXCIpXG5cdFx0Ly8gLnJlcGxhY2UoLyhefFxcbilcXHN7MCwzfT5cXHM/L2csICdcXG5cXG4nKVxuXHRcdC8vIFJlbW92ZSByZWZlcmVuY2Utc3R5bGUgbGlua3M/XG5cdFx0LnJlcGxhY2UoL15cXHN7MSwyfVxcWyguKj8pXFxdOiAoXFxTKykoIFwiLio/XCIpP1xccyokL2csIFwiXCIpXG5cdFx0Ly8gUmVtb3ZlIGF0eC1zdHlsZSBoZWFkZXJzXG5cdFx0LnJlcGxhY2UoXG5cdFx0XHQvXihcXG4pP1xcc3swLH0jezEsNn1cXHMqKCAoLispKT8gKyMrJHxeKFxcbik/XFxzezAsfSN7MSw2fVxccyooICguKykpPyQvZ20sXG5cdFx0XHRcIiQxJDMkNCQ2XCJcblx0XHQpXG5cdFx0Ly8gUmVtb3ZlICogZW1waGFzaXNcblx0XHQucmVwbGFjZSgvKFsqXSspKFxcUykoLio/XFxTKT8/XFwxL2csIFwiJDIkM1wiKVxuXHRcdC8vIFJlbW92ZSBfIGVtcGhhc2lzLiBVbmxpa2UgKiwgXyBlbXBoYXNpcyBnZXRzIHJlbmRlcmVkIG9ubHkgaWZcblx0XHQvLyAgIDEuIEVpdGhlciB0aGVyZSBpcyBhIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGJlZm9yZSBvcGVuaW5nIF8gYW5kIGFmdGVyIGNsb3NpbmcgXy5cblx0XHQvLyAgIDIuIE9yIF8gaXMgYXQgdGhlIHN0YXJ0L2VuZCBvZiB0aGUgc3RyaW5nLlxuXHRcdC5yZXBsYWNlKC8oXnxcXFcpKFtfXSspKFxcUykoLio/XFxTKT8/XFwyKCR8XFxXKS9nLCBcIiQxJDMkNCQ1XCIpXG5cdFx0Ly8gUmVtb3ZlIGNvZGUgYmxvY2tzXG5cdFx0LnJlcGxhY2UoL15gYGBcXHcqJFxcbj8vZ20sIFwiXCIpXG5cdFx0Ly8gUmVtb3ZlIGlubGluZSBjb2RlXG5cdFx0LnJlcGxhY2UoL2AoLis/KWAvZywgXCIkMVwiKVxuXHRcdC8vIFJlcGxhY2Ugc3RyaWtlIHRocm91Z2hcblx0XHQucmVwbGFjZSgvfiguKj8pfi9nLCBcIiQxXCIpXG5cdFx0Ly8gcmVtb3ZlIGJldHRlciBiaWJ0ZXggY2l0ZWtleXNcblx0XHQucmVwbGFjZSgvXFxbXFxzKkBbXFx3LFxcc10rXFxzKlxcXS9nLCBcIlwiKVxuXHRcdC8vIHJlbW92ZSBjcml0aWNtYXJrdXAgY29tbWVudHNcblx0XHQucmVwbGFjZSgvXFx7Pj4uKj88PFxcfS9nLCBcIlwiKTtcblxuXHRyZXR1cm4gb3V0cHV0O1xufTtcblxuZXhwb3J0IHtcblx0bm90aWNlSGFuZGxlcixcblx0aGFuZGxlVHJhbnNsYXRlLFxuXHRoYW5kbGVBdWRpbyxcblx0Z2V0TGFuZ3VhZ2VPcHRpb25zLFxuXHRpc0VtcHR5T2JqZWN0LFxuXHRoYW5kbGVNaWNyb3NvZnRUcmFuc2xhdGUsXG5cdHZhbGlkYXRvcixcblx0aGFuZGxlQmFpZHVUcmFuc2xhdGUsXG5cdGNsZWFuTWFya3VwLFxuXHRMQU5HVUFHRVMsXG5cdE1JQ1JPU09GVF9MQU5HVUFHRVMsXG5cdEJBSURVX0xBTkdVQUdFUyxcbn07XG4iXX0=