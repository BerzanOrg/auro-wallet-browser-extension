import cx from "classnames";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import downArrow from "../../../assets/images/downArrow.png";
import pwd_right from "../../../assets/images/pwd_right.png";
import arrow from '../../../assets/images/txArrow.png';
import {getBalance, getFeeRecom, sendStackTx} from '../../../background/api';
import { cointypes } from "../../../../config";
import { MINA_SEND_STACK_TRANSTRACTION } from "../../../constant/types";
import { getLanguage } from '../../../i18n';
import { updateNetAccount, updateShouldRequest } from '../../../reducers/accountReducer';
import { sendMsg } from "../../../utils/commonMsg";
import Button from '../../component/Button';
import CustomInput from '../../component/CustomInput';
import CustomView from "../../component/CustomView";
import Loading from '../../component/Loading';
import TestModal from '../../component/TestModal';
import Toast from '../../component/Toast';
import './index.scss';
import {addressValid} from "../../../utils/validator";
import {addressSlice, trimSpace,isTrueNumber,isNumber} from "../../../utils/utils";
import loadingCommon from "../../../assets/images/loadingCommon.gif";
import {ACCOUNT_TYPE} from "../../../constant/walletType";
import {checkLedgerConnect, requestSignDelegation} from "../../../utils/ledger";
import modalClose from "../../../assets/images/modalClose.png";
const FEE_RECOMMED_DEFAULT = 1
const FEE_RECOMMED_CUSTOM = -1

class StakingTransfer extends React.Component {
  constructor(props) {
    super(props);
    let params = props.location?.params || {};
    this.state = {
      fee: 0.01,
      menuAdd: !!params.menuAdd,
      nodeName: params.nodeName,
      nodeAddress: params.nodeAddress,
      memo: "",
      isOpenAdvance: false,
      inputFee: "",
      nonce: "",
      feeList: [
        {
          text: getLanguage("fee_slow"),
          select: false,
          fee: " "
        }, {
          text: getLanguage("fee_default"),
          select: false,
          fee: " "
        },
        {
          text: getLanguage("fee_fast"),
          select: false,
          fee: " "
        }
      ],
      feeSelect: FEE_RECOMMED_DEFAULT,
      confirmModalLoading:false
    }
    this.modal = React.createRef();
    this.isUnMounted = false;
  }
  componentDidMount() {
    this.fetchData();
  }
  componentWillUnmount(){
    this.isUnMounted = true;
  }
  callSetState=(data,callback)=>{
    if(!this.isUnMounted){
      this.setState({
        ...data
      },()=>{
        callback&&callback()
      })
    }
  }
  fetchData = async () => {
    let { currentAccount } = this.props;
    let address = currentAccount.address
    let feeRecom = await getFeeRecom()
    if (feeRecom.length > 0) {
      const feeList = this.state.feeList.map((item, index) => {
        return {
          ...item,
          fee: feeRecom[index].value,
        }
      })
      this.callSetState({
        feeList,
        fee: feeRecom[1].value
      })
    }
    let account = await getBalance(address)
    if (account.account) {
      this.props.dispatch(updateNetAccount(account.account))
    }
  }
  renderBottomBtn = () => {
    return (
      <div className={'reset-bottom-container'}>
        <Button
          content={getLanguage('next')}
          onClick={this.onConfirm}>
        </Button>
      </div>
    )
  }
  ledgerTransfer = async (params) => {
    const {ledgerApp} = await checkLedgerConnect()
    if (ledgerApp) {
      this.modal.current.setModalVisable(false)
      this.callSetState({
        confirmModalLoading: true
      })
      this.modal.current.setModalVisable(true)
      const {signature,payload, error} = await requestSignDelegation(ledgerApp, params)
      this.modal.current.setModalVisable(false)
      this.callSetState({
        confirmModalLoading: false
      })
      if (error) {
        Toast.info(error.message)
        return
      }
      let postRes = await sendStackTx(payload, {rawSignature: signature}).catch(error => error)
      this.onSubmitSuccess(postRes)
    }
  }
  doTransfer = async () => {
    let currentAccount = this.props.currentAccount
    let netAccount = this.props.netAccount
    let fromAddress = currentAccount.address
    let toAddress = this.state.nodeAddress
    let nonce = trimSpace(this.state.nonce) || netAccount.inferredNonce
    let memo = this.state.memo || ""
    let fee = trimSpace(this.state.inputFee) || this.state.fee
    const payload = {
      fromAddress, toAddress, fee, nonce, memo
    }
    if (currentAccount.type === ACCOUNT_TYPE.WALLET_LEDGER) {
      return this.ledgerTransfer(payload)
    }
    this.modal.current.setModalVisable(false)
    Loading.show()
    sendMsg({
      action: MINA_SEND_STACK_TRANSTRACTION,
      payload
    }, (data) => {
      Loading.hide()
      this.onSubmitSuccess(data)
    })
  }
  onSubmitSuccess = (data) => {
    if (data.error) {
      let err = data.error
      let errorMessage = getLanguage('postFailed')
      if(data.error.message){
        errorMessage = data.error.message
      }
      if (err.length > 0) {
        errorMessage = err[0].message || getLanguage('postFailed')
      }
      Toast.info(errorMessage)
      return
    }
    Toast.info(getLanguage('postSuccess'))
    this.props.dispatch(updateShouldRequest(true))
    let detail = data.sendDelegation && data.sendDelegation.delegation || {}
    this.props.history.replace({
      pathname: "/record_page",
      params: {
        txDetail: detail
      }
    })
  }
  onCancel = () => {
    if (this.state.menuAdd && !this.state.nodeAddress) {
      Toast.info(getLanguage('inputNodeAddress'));
      return;
    }
    this.modal.current.setModalVisable(false)
  }
  onConfirm = () => {
    if (!addressValid(this.state.nodeAddress)) {
      Toast.info(getLanguage('sendAddressError'))
      return
    }
    if (this.state.fee > this.props.balance) {
      Toast.info(getLanguage('balanceNotEnough'));
      return;
    }
    let inputFee = trimSpace(this.state.inputFee)
    if (inputFee.length > 0 && !isNumber(inputFee)) {
      Toast.info(getLanguage('inputFeeError'))
      return
    }
    let nonce = trimSpace(this.state.nonce)
    if (nonce.length > 0 && !isTrueNumber(nonce)) {
      Toast.info(getLanguage('inputNonceError'))
      return
    }
    this.modal.current.setModalVisable(true)
  }
  onMemoChange = (e) => {
    let memo = e.target.value;
    this.callSetState({
      memo: memo
    }, () => {
      this.setBtnStatus()
    })
  }
  onClickFee = (item, index) => {
    this.callSetState({
      feeSelect: index,
      fee: item.fee
    })
  }
  onFeeInput = (e) => {
    let fee = e.target.value
    this.callSetState({
      inputFee: fee
    }, () => {
      this.setBtnStatus()
      this.callSetState({
        feeSelect: FEE_RECOMMED_CUSTOM
      })
    })
  }
  setBtnStatus = () => {
  }
  onNonceInput = (e) => {
    let nonce = e.target.value
    this.callSetState({
      nonce: nonce
    })
  }
  onOpenAdvance = () => {
    this.callSetState({
      isOpenAdvance: !this.state.isOpenAdvance
    })
  }
  onProviderChange = (e) => {
    let providerAddress = e.target.value;
    this.callSetState({
      nodeAddress: providerAddress
    });
  }
  onChooseNode = () => {
    this.props.history.replace({
      pathname: "/stacking_list",
      params: {
        nodeAddress: this.state.nodeAddress,
        fromPage: 'stackingTransfer'
      }
    });
  }
  renderConfirmItem = (title, content, isHighlight) => {
    return (
      <div className={"confirm-item-container"}>
        <div>
          <p className={"confirm-item-title"}>{title}</p>
        </div>
        <p className={
          cx({
            "confirm-item-content": true,
            "confirm-item-content-purple": isHighlight
          })
        }>{content}</p>
      </div>
    )
  }
  renderLoadingView=()=>{
    return (
      <div className={"confirm-loading"}>
        <p className={"confirm-loading-desc"}>{getLanguage('confirmInfoLedger')}</p>
        <img className={"confirm-loading-img"} src={loadingCommon} />
      </div>)
  }
  onCloseModal = () => {
    this.modal.current.setModalVisable(false)
  }
  renderConfirmModal = () => {
    let title = this.state.confirmModalLoading ? "waitLedgerConfirm":"sendDetail"
    return (<TestModal
      ref={this.modal}
      touchToClose={true}
      title={getLanguage(title)}
    >
      {this.state.confirmModalLoading ? this.renderLoadingView(): this.renderConfirmView()}
      {this.state.confirmModalLoading ? <></> : <img onClick={this.onCloseModal} className="modal-close click-cursor" src={modalClose} />}
    </TestModal>)
  }
  renderConfirmView = () => {
    let lastFee = this.state.inputFee ? this.state.inputFee : this.state.fee;
    let nonce = this.state.nonce;
    let memo = this.state.memo;
    return (
      <div className={"confirm-modal-container"}>
        {this.state.nodeName ? this.renderConfirmItem(getLanguage('stackProvider'), this.state.nodeName, true) : null }
        {this.renderConfirmItem(getLanguage('providerAddress'), this.state.nodeAddress)}
        {this.renderConfirmItem(getLanguage('fromAddress'), this.props.currentAccount.address)}
        {nonce && this.renderConfirmItem("Nonce", nonce)}
        {memo && this.renderConfirmItem("Memo", memo)}
        {this.renderConfirmItem(getLanguage('fee'), lastFee + " "+cointypes.symbol, true)}
        {this.renderConfirmButton()}
      </div>
    )
  }
  renderConfirmButton = () => {
    return (
      <Button
        content={getLanguage('confirm')}
        onClick={this.doTransfer}
      />
    )
  }
  renderNodeProvider = () => {
    if (this.state.menuAdd) {
      return <CustomInput
        label={getLanguage('stackingProviderName')}
        onTextInput={this.onProviderChange} />
    } else {
      return <div className={'select-node-con'}>
        <label className={'provider-title'}>{getLanguage('stackingProviderName')}</label>
        <div className={'selected-value click-cursor'} onClick={this.onChooseNode}>
          <div className={'selected-value-text'}>{this.state.nodeName ?? addressSlice(this.state.nodeAddress)}</div>
          <div className={'arrow-con'}>
            <img src={arrow} />
          </div>
        </div>
      </div>
    }
  }
  renderButtonFee = () => {
    return (
      <div className={"button-fee-container"}>
        <div className={"lable-container fee-style"}>
          <p className="pwd-lable-1">{getLanguage('fee')}</p>
          <p className="pwd-lable-desc-1">{this.state.fee}</p>
        </div>
        <div className={"fee-item-container"}>
          {this.state.feeList.map((item, index) => {
            let selected = index === this.state.feeSelect
            return (
              <div key={index + ""} onClick={() => this.onClickFee(item, index)}
                className={
                  cx({
                    "fee-common": true,
                    "fee-select": selected,
                    "click-cursor":true
                  })
                }>
                <img src={pwd_right} className={
                  cx({
                    "fee-select-img": selected,
                    "fee-select-img-none": !selected,
                  })
                } />
                <p className={"fee-text"}>{item.text}</p>
              </div>
            )

          })}
        </div>
      </div>
    )
  }
  renderAdvance = () => {
    const { isOpenAdvance } = this.state;
    return (
      <div className="advancer-outer-container">
        <div
          onClick={this.onOpenAdvance}
          className="advancer-container click-cursor">
          <p className="advance-content">{getLanguage('advanceMode')}</p>
          <img className={cx({
            "down-normal": true,
            "up-advance": isOpenAdvance,
            "down-advance": !isOpenAdvance
          })} src={downArrow}></img>
        </div>
      </div>)
  }
  renderAdvanceOption = () => {
    let netAccount = this.props.netAccount
    let nonceHolder = netAccount.inferredNonce ? "Nonce " + netAccount.inferredNonce : "Nonce "
    return (
      <div className={
        cx({
          "advance-option-show": this.state.isOpenAdvance,
          "advance-option-hide": !this.state.isOpenAdvance,
        })
      }>
        <CustomInput
          value={this.state.inputFee}
          placeholder={getLanguage('feePlaceHolder')}
          onTextInput={this.onFeeInput}
        />
        <CustomInput
          value={this.state.nonce}
          placeholder={nonceHolder}
          onTextInput={this.onNonceInput}
        />
      </div>
    )
  }

  render() {
    return <CustomView
      title={getLanguage('staking')}
      history={this.props.history}>
      <div className={'page-content'}>
        <div className={'staking-transfer-root'}>
          <div className={'transfer-form-con'}>
            {
              this.renderNodeProvider()
            }
            <div className={'memo-con'}>
              <CustomInput
                label={getLanguage('memo')}
                onTextInput={this.onMemoChange} />
            </div>
            <div className={'slider-container'}>
              {
                this.renderButtonFee()
              }
            </div>
            {this.renderAdvance()}
            {this.renderAdvanceOption()}
          </div>
          {
            this.renderBottomBtn()
          }
        </div>
      </div>
      {this.renderConfirmModal()}
    </CustomView>
  }
}
const mapStateToProps = (state) => ({
  balance: state.accountInfo.balance,
  currentAccount: state.accountInfo.currentAccount,
  netAccount: state.accountInfo.netAccount,
});
export default withRouter(
  connect(mapStateToProps)(StakingTransfer)
);
