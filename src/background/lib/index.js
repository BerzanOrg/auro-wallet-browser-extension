import BigNumber from "bignumber.js";
import { cointypes } from '../../../config';
import { getCurrentNetConfig, getRealErrorMsg } from '../../utils/utils';
import { NET_CONFIG_TYPE } from '../../constant/walletType';
import i18n from "i18next"
import { DAppActions } from '@aurowallet/mina-provider';

async function getSignClient(){
    let netConfig = getCurrentNetConfig()
    let netType = ''
    const { default: Client } = await import('mina-signer')
    if(netConfig.netType){
      netType = netConfig.netType
    }
    let client
    if(netType === NET_CONFIG_TYPE.Mainnet){
        client = new Client({ network: "mainnet" });
    }else{
        client = new Client({ network: "testnet" });
    }
    return client
}

/**
 * get signed transaction
 * @param {*} privateKey
 * @param {*} fromAddress
 * @param {*} toAddress
 * @param {*} amount
 * @param {*} fee
 * @param {*} nonce
 * @param {*} memo
 */
export async  function signPayment(privateKey, fromAddress, toAddress, amount, fee, nonce, memo) {
    let signedPayment
    try {
        let signClient = await getSignClient()

        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        let sendAmount = new BigNumber(amount).multipliedBy(decimal).toNumber()
        signedPayment = signClient.signPayment({
            to: toAddress,
            from: fromAddress,
            amount: sendAmount,
            fee: sendFee,
            nonce: nonce,
            memo
        }, privateKey)
    } catch (err) {
        let errorMessage = getRealErrorMsg(err)||i18n.t("buildFailed")
        signedPayment = { error: { message: errorMessage } }
    }
    return signedPayment
}

export async function stakePayment(privateKey, fromAddress, toAddress, fee, nonce, memo) {
    let signedStakingPayment
    try {
        let signClient = await getSignClient()
        let decimal = new BigNumber(10).pow(cointypes.decimals)
        let sendFee = new BigNumber(fee).multipliedBy(decimal).toNumber()
        signedStakingPayment = signClient.signStakeDelegation({
            to: toAddress,
            from: fromAddress,
            fee: sendFee,
            nonce: nonce,
            memo,
        }, privateKey);
    } catch (error) {
        signedStakingPayment = { error: { message: i18n.t("buildFailed") } }
    }
    return signedStakingPayment
}


/**
 * build transaction body
 * @param {*} privateKey 
 * @param {*} fromAddress 
 * @param {*} message
 * @returns
 */
export async function signMessagePayment(privateKey, fromAddress, message) {
    let signedResult
    try {
        let keys = {
            privateKey: privateKey,
            publicKey: fromAddress
        }
        let signClient = await getSignClient()
        signedResult = signClient.signMessage(message, keys)
        signedResult = signedResult.signature
    } catch (error) {
        signedResult = { error: { message: i18n.t("buildFailed") } }
    }
    return signedResult
}


export async function verifyMessage(publicKey,signature,verifyMessage) { 
    let verifyResult
    try {
        const nextSignature = typeof signature === "string" ? JSON.parse(signature):signature
        let signClient = await getSignClient()
        const verifyBody = {
            data:verifyMessage,
            publicKey:publicKey,
            signature:nextSignature
        }
        verifyResult = signClient.verifyMessage(verifyBody)
    } catch (error) {
        verifyResult = { error: { message: "verify failed" } }
    }
    return verifyResult
}


/** QA net sign */
export async function signTransaction(privateKey,params){
    let signResult
    try {
        let signClient = await getSignClient()
        let signBody = {}

        if(params.sendAction === DAppActions.mina_signMessage){
            signBody = params.message
        }else if (params.sendAction === DAppActions.mina_sendTransaction){
            let decimal = new BigNumber(10).pow(cointypes.decimals)
            let sendFee = new BigNumber(params.fee).multipliedBy(decimal).toNumber()
            signBody={
                zkappCommand: JSON.parse(params.transaction),
                feePayer: {
                    feePayer: params.fromAddress,
                    fee: sendFee,
                    nonce: params.nonce,
                    memo:params.memo||""
                },
            }
        }else{
            let decimal = new BigNumber(10).pow(cointypes.decimals)
            let sendFee = new BigNumber(params.fee).multipliedBy(decimal).toNumber()
            signBody = {
                to: params.toAddress,
                from: params.fromAddress,
                fee: sendFee,
                nonce: params.nonce,
                memo:params.memo||""
            }

            if(params.sendAction === DAppActions.mina_sendPayment){
                let sendAmount = new BigNumber(params.amount).multipliedBy(decimal).toNumber()
                signBody.amount = sendAmount
            }
        }
        signResult = signClient.signTransaction(signBody, privateKey)
    } catch (err) {
        let errorMessage = getRealErrorMsg(err)||i18n.t("buildFailed")
        signResult = { error: { message: errorMessage } }
    }
    return signResult
}


export async function signFieldsMessage(privateKey,params){
    let signResult
    try {
        const fields = JSON.parse(params.message)
        if(!Array.isArray(fields)){
           return { error: { message: "Must use array" } }
        }
        const nextFields = fields.map((field)=>{
            if(typeof field === "number"){
                return BigInt(field)
            }
            return field
        })
        let signClient = await getSignClient()
        signResult = signClient.signFields(nextFields, privateKey)
        signResult.data = fields
    } catch (err) {
        let errorMessage = getRealErrorMsg(err)||i18n.t("buildFailed")
        signResult = { error: { message: errorMessage } }
    }
    return signResult
}



export async function verifyFieldsMessage(publicKey,signature,verifyMessage) {
    let verifyResult
    try {
        let signClient = await getSignClient()

        const fields = JSON.parse(verifyMessage)
        if(!Array.isArray(fields)){
           return { error: { message: "Must use array" } }
        }
        const nextFields = fields.map((field)=>{
            if(typeof field === "number"){
                return BigInt(field)
            }
            return field
        })
        const verifyBody = {
            data:nextFields,
            publicKey:publicKey,
            signature:signature
        }
        verifyResult = signClient.verifyFields(verifyBody)
    } catch (error) {
        verifyResult = { error: { message: "verify failed" } }
    }
    return verifyResult
}