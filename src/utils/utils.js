import BigNumber from "bignumber.js";
import validUrl from 'valid-url';
import { cointypes } from '../../config';
import { getLocal } from "../background/localStorage";
import { NET_WORK_CONFIG } from "../constant/storageKey";
import { DAPP_CHANGE_NETWORK } from "../constant/types";
import { sendMsg } from "./commonMsg";
/**
 * 地址截取
 * @param {*} address
 */
export function addressSlice(address, sliceLength = 10,lastLength = "") {
    if (address) {
        let realLastLength = lastLength ? lastLength :sliceLength
        return `${address.slice(0, sliceLength)}...${address.slice(-realLastLength)}`
    }
    return address

}

/**
 * 去掉科学计数法
 * @param {*} num_str
 */
export function toNonExponential(ExpNumber) {
    const num = new BigNumber(ExpNumber);
    return num.toFixed();
}
/**
 * 精度换算
 * @param {*} amount
 * @param {*} decimal
 */
export function amountDecimals(amount, decimal = 0) {
    let realBalance = new BigNumber(amount)
        .dividedBy(new BigNumber(10).pow(decimal))
        .toString();
    return realBalance;
}

/**
 * 展示金额转换。默认4位小数
 * @param {*} number
 * @param {*} fixed
 */
export function getDisplayAmount(number, fixed = 4) {
    if (isNaN(parseFloat(number)) || number === 0) {
        return '0.00';
    }
    let showAmount = new BigNumber(number).toFixed(fixed, 1).toString()
    return toNonExponential(showAmount)
}

export function getAmountDisplay(amount, decimal = 0, fixed = 4) {
    return getDisplayAmount(amountDecimals(amount, decimal), fixed)
}
export function getAmountForUI(rawAmount, decimal = cointypes.decimals) {
    return new BigNumber(rawAmount)
        .dividedBy(new BigNumber(10).pow(decimal))
        .toFormat(2,
            BigNumber.ROUND_DOWN,
            {
                groupSeparator: ',',
                groupSize: 3,
                decimalSeparator: '.',
            });
}



/**
 * 去掉字符串前后空格
 * @param {*} str
 */
export function trimSpace(str) {
    if (typeof str !== 'string') {
        return str
    }
    let res = str.replace(/(^\s*)|(\s*$)/g, "")
    res = res.replace(/[\r\n]/g, "")
    return res
}

/**
 * 校验地址是否有效
 * @param {*} url
 */
export function urlValid(url) {
    if (validUrl.isWebUri(url)) {
        return true
    }
    return false
}


/**
 * 判断是不是数字
 * @param n
 * @param includeE 是否认为科学计数法也算作数字 默认不算
 */
export function isNumber(n, includeE = false) {
    let isNum = !!String(n).match(/^\d+(?:\.\d*)?$/);
    if (!isNum && includeE) {
        return !!String(n).match(/^\d+e(-)?\d+$/);
    }
    return isNum;
}

/**
 * 校验是否是大于0 的整数
 * @param {*} n 
 * @param {*} includeE 
 * @returns 
 */
export function isTrueNumber(n) {
    let isNum = !!String(n).match(/^([1-9][0-9]*)$/);
    return isNum;
}

/**
 * 校验用户名长度 默认16位
 * @param {*} name
 * @param {*} defaultLength
 */
export function nameLengthCheck(name, defaultLength = 16) {
    let realLength = 0
    let len = name.length
    let charCode = -1;
    for (let i = 0; i < len; i++) {
        charCode = name.charCodeAt(i);
        if (charCode >= 0 && charCode <= 128) {
            realLength += 1;
        } else {
            realLength += 2;
        }
    }
    if (realLength > defaultLength) {
        return false
    }
    return true;
}

/**
 * 复制文本
 */
export function copyText(text) {
    return navigator.clipboard.writeText(text)
        .catch((error) => { alert(`Copy failed! ${error}`) })
}

/**
 * format connectAccount
 * @param {*} account 
 * @returns 
 */
export function connectAccountDataFilter(account) {
    return {
        address: account.address,
        accountName: account.accountName,
        type: account.type,
        isConnected: account.isConnected,
        isConnecting: account.isConnecting,
    }
}

export function getOriginFromUrl(url) {
    if(!url){
        return ""
    }
    var origin = new URL(url).origin;
    return origin
}
/**
 * get params from input url
 * @param {*} url
 * @returns
 */
export function getQueryStringArgs(queryUrl = "") {
    let paramSplit = queryUrl.split("?")
    let paramUrl = ''
    if (paramSplit.length > 1) {
        paramUrl = paramSplit[1]
    }
    let params = new URLSearchParams(paramUrl);
    let args = {};
    for (const [key, value] of params) {
        args[key] = value
    }
    return args;
}

export function getCurrentNetConfig() {
    let localNetConfig = getLocal(NET_WORK_CONFIG)
    if (localNetConfig) {
        localNetConfig = JSON.parse(localNetConfig)
        return localNetConfig.currentConfig
    }
    return {}
}
/**
 * 处理转账等的返回错误
 * @param {*} error 
 * @returns 
 */
export function getRealErrorMsg(error) {
    let errorMessage = ""
    try {
        if (error.message) {
            errorMessage = error.message
        }
        if (Array.isArray(error) && error.length > 0) {
            // postError
            errorMessage = error[0].message
            
            // buildError
            if(!errorMessage && error.length > 1){
                errorMessage = error[1].c
            }
        }
        if (typeof error === 'string') {
            let lastErrorIndex = error.lastIndexOf("Error:")
            if (lastErrorIndex !== -1) {
                errorMessage = error.slice(lastErrorIndex)
            }
        }
    } catch (error) {
    }
    return errorMessage
}

/**
 * 处理 staking list 的数据
 */
export function parseStakingList(stakingListFromServer) {
    return stakingListFromServer.map(node => {
        return {
            nodeAddress: node.public_key,
            nodeName: node.identity_name,
            totalStake: getAmountForUI(node.stake),
            delegations: node.delegations,
        };
    })
}


/**
 * send network change message 
 * @param {*} netConfig 
 */
export function sendNetworkChangeMsg(netConfig) {
    if (netConfig.netType) {
        sendMsg({
            action: DAPP_CHANGE_NETWORK,
            payload: {
                netConfig: netConfig
            }
        }, () => { })
    }
}

/**
 * get local time from utc time
 * @param {*} time 
 * @returns 
 */
export function getShowTime(time) {
    try {
        const lang = navigator.language || navigator.languages[0];
        let date = new Date(time)
        let timeDate = date.toLocaleString(lang, {
            // timeZone: 'Europe/Moscow',
            hourCycle: 'h23',
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        return timeDate.replaceAll("/", "-")
    } catch (error) {
        return time
    }
}

/**
 * get different from deletedAccountApproved to newAccountApproved
 * @param {*} deletedAccountApproved 
 * @param {*} newAccountApproved 
 * @returns 
 */
export function getArrayDiff(deletedAccountApproved,newAccountApproved){
    let list = []
    for (let index = 0; index < deletedAccountApproved.length; index++) {
      const deletedConnetedUrl = deletedAccountApproved[index];
      if(newAccountApproved.indexOf(deletedConnetedUrl) === -1){
        list.push(deletedConnetedUrl)
      }
    }
    return list
}