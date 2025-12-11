import React, { useState } from 'react'
import { Modal, ModalProps } from 'antd'
import { showDialog } from '@/utils/showDialog'

/**
 * CustomDialog 组件的属性接口
 * 完全兼容 Antd Modal 的所有属性，并扩展了自定义事件处理
 */
export interface CustomDialogProps extends Omit<ModalProps, 'open' | 'onOk' | 'onCancel'> {
    /** 点击确定按钮的回调，支持异步操作 */
    onOk?: (e: React.MouseEvent<HTMLElement>) => void | Promise<void>
    /** 点击取消按钮的回调 */
    onCancel?: (e: React.MouseEvent<HTMLElement>) => void
    /** 弹窗关闭时的回调（包括取消、点击遮罩层、ESC 键等） */
    onClose?: () => void
    /** 确定按钮文字 */
    okText?: string
    /** 取消按钮文字 */
    cancelText?: string
    /** 自定义底部内容，设置为 null 时隐藏底部 */
    footer?: React.ReactNode | null
    /** 弹窗内容 */
    children?: React.ReactNode
    /** 点击确定按钮后是否关闭弹窗，默认为 true */
    okClose?: boolean
    /** 点击取消按钮后是否关闭弹窗，默认为 true */
    cancelClose?: boolean
}

/**
 * CustomDialog 组件
 * 
 * 基于 Antd Modal 封装，完全兼容 Antd Modal 的所有属性和样式
 * 支持自定义事件处理，特别是支持异步的 onOk 回调
 * 
 * @example
 * ```tsx
 * <CustomDialog title="提示" open={true} onOk={handleOk}>
 *   我是dialog内容
 * </CustomDialog>
 * ```
 */
const CustomDialog: React.FC<CustomDialogProps> = ({
    onOk,
    onCancel,
    onClose,
    okText,
    cancelText,
    footer,
    children,
    okClose = true,
    cancelClose = true,
    style,
    bodyStyle,
    styles,
    ...restProps
}) => {
    // 使用内部 state 控制弹窗显示/隐藏
    const [open, setOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    
    // 计算最大高度：屏幕可视高度 - 200px
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 600
    
    // 合并样式，限制弹窗最大高度
    const mergedStyle: React.CSSProperties = {
        maxHeight: `${maxHeight}px`,
        ...style,
    }
    
    // 合并 body 样式，内容区域可滚动
    // 使用新的 styles.body API（Antd 5.x），兼容旧的 bodyStyle
    const mergedBodyStyle: React.CSSProperties = {
        maxHeight: `calc(${maxHeight}px - 110px)`, // 减去标题栏和底部按钮的高度
        overflow: 'auto',
        ...bodyStyle,
        ...styles?.body,
    }
    
    // 合并 styles 对象
    const mergedStyles = {
        body: mergedBodyStyle,
        ...styles,
    }

    // 处理确定按钮点击
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        if (onOk) {
            try {
                setLoading(true)
                await onOk(e)
            } catch (error) {
                console.error('Dialog onOk error:', error)
                throw error
            } finally {
                setLoading(false)
            }
        }
        // 根据 okClose 决定是否关闭弹窗
        if (okClose) {
            setOpen(false)
            if (onClose) {
                onClose()
            }
        }
    }

    // 处理取消按钮点击
    const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
        if (onCancel) {
            onCancel(e)
        }
        // 根据 cancelClose 决定是否关闭弹窗
        if (cancelClose) {
            setOpen(false)
            if (onClose) {
                onClose()
            }
        }
    }

    // 处理关闭事件（点击遮罩层或 ESC 键）
    const handleAfterClose = () => {
        if (onClose) {
            onClose()
        }
    }

    // 合并 footer 配置
    const mergedFooter = footer === null 
        ? null 
        : footer !== undefined 
        ? footer 
        : undefined // 使用 Modal 默认 footer

    return (
        <Modal
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            afterClose={handleAfterClose}
            okText={okText}
            cancelText={cancelText}
            confirmLoading={loading}
            footer={mergedFooter}
            style={mergedStyle}
            styles={mergedStyles}
            {...restProps}
        >
            {children}
        </Modal>
    )
}

export default CustomDialog
