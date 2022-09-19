import i18n from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SEC_DELETE_ACCOUNT, SEC_SHOW_MNEMONIC, SEC_SHOW_PRIVATE_KEY } from "../../../constant/secTypes";
import Button from "../../component/Button";
import CustomView from "../../component/CustomView";
import Input from "../../component/Input";
import { PopupModal } from "../../component/PopupModal";
import styles from "./index.module.scss";

const SecurityPwd = ({
  onClickCheck = () => { },
  action = "",
  pageTitle = ""
}) => {

  const [inputValue, setInputValue] = useState("")
  const [btnClick, setBtnClick] = useState(false)
  const [reminderModalStatus, setReminderModalStatus] = useState(true)

  const onSubmit = (event) => {
    event.preventDefault();
  }

  const onPwdInput = useCallback((e) => {
    setInputValue(e.target.value)
  }, [])

  useEffect(() => {
    if (inputValue.trim().length > 0) {
      setBtnClick(true)
    } else {
      setBtnClick(false)
    }
  }, [inputValue])

  const onConfirm = useCallback(() => {
    onClickCheck(inputValue)
  }, [inputValue])

  const onCloseModal = useCallback(() => {
    setReminderModalStatus(false)
  }, [])

  const { modalContent } = useMemo(() => {
    let modalContent = []
    switch (action) {
      case SEC_DELETE_ACCOUNT:
        modalContent = [i18n.t('deleteAccountTip')]
        break
      case SEC_SHOW_PRIVATE_KEY:
        modalContent = [
          i18n.t('privateKeyTip_1'),
          i18n.t('privateKeyTip_2')]
        break
      case SEC_SHOW_MNEMONIC:
        modalContent = [
          i18n.t('backTips_1'),
          i18n.t('backTips_2'),
          i18n.t('backTips_3'),]
        break
    }
    return {
      modalContent
    }
  }, [action])
  return (
    <>
      <CustomView title={pageTitle || i18n.t('security')}>
        <form onSubmit={onSubmit} className={styles.container}>
          <div >
            <Input
              label={i18n.t('inputPassword')}
              onChange={onPwdInput}
              value={inputValue}
              inputType={'password'}
            />
          </div>
          <div className={styles.hold} />
          <div className={styles.bottomContainer}>
            <Button
              disable={!btnClick}
              onClick={onConfirm}>
              {i18n.t('next')}
            </Button>
          </div>
        </form>
      </CustomView>
      <PopupModal
        title={i18n.t('tips')}
        rightBtnContent={i18n.t('ok')}
        onRightBtnClick={onCloseModal}
        contentList={modalContent}
        modalVisable={reminderModalStatus} />
    </>
  )
}

export default SecurityPwd