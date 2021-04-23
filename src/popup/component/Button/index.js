import React, { Component } from "react";
import "./index.scss";
import cx from "classnames";
import PropTypes from 'prop-types'

export const BUTTON_TYPE_CANCEL = "BUTTON_TYPE_CANCEL"
export const BUTTON_TYPE_CONFIRM = "BUTTON_TYPE_CONFIRM"
export const BUTTON_TYPE_HOME_BUTTON = "BUTTON_TYPE_HOME_BUTTON"
export const BUTTON_TYPE_COMMON_BUTTON = "BUTTON_TYPE_COMMON_BUTTON"

export default class Button extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        let { content, onClick, disabled, propsClass, buttonType } = this.props
        let currentClassName = ""
        switch (buttonType) {
            case BUTTON_TYPE_CANCEL:
                currentClassName = cx({
                    "common-button": true,
                    "common-cancel-btn": true,
                    [propsClass]: true,
                    "click-cursor": true,
                })
                break;
            case BUTTON_TYPE_HOME_BUTTON:
                currentClassName = cx({
                    "common-button": true,
                    [propsClass]: true,
                    "click-cursor": !disabled,
                    "click-cursor-disable": disabled,
                })
                break;
            case BUTTON_TYPE_COMMON_BUTTON:
            default:
                currentClassName = cx({
                    "common-button": true,
                    "common-btn-disable": disabled,
                    "common-btn-usable": !disabled,
                    [propsClass]: true,
                    "click-cursor": !disabled,
                    "click-cursor-disable": disabled,
                })
                break;
        }
        return (
            <button
                disabled={disabled}
                className={currentClassName}
                onClick={onClick}>
                {content}
                {this.props.children}
            </button>
        );
    }
}
Button.defaultProps = { 
    content: "",
    onClick: () => { },
    disabled: false,
    propsClass: "",
    buttonType: ""
}
Button.propTypes = {
    /**
     * button text
     */
    content: PropTypes.string,
    /**
     * 点击事件回调
     */
    onClick: PropTypes.func,
    /**
     * 是否可以点击
     */
    disabled: PropTypes.bool,
    /**
      * 私有属性
      */
    propsClass: PropTypes.string,
    /**
     * button 的类型
     */
    buttonType: PropTypes.arrayOf(BUTTON_TYPE_CANCEL,BUTTON_TYPE_CONFIRM,BUTTON_TYPE_HOME_BUTTON)
}