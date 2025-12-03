import React, { useState } from 'react'
import { Modal, ModalProps } from 'antd'
import { showDialog } from '@/utils/showDialog'

/**
 * CustomDialog 组件的属性接口
 * 完全兼容 Antd Modal 的所有属性，并扩展了自定义事件处理
 */
export interface CustomDialogProps extends Omit<ModalProps, 'open' | 'onOk' | 'onCancel'> {
    /** 控制弹窗的显示/隐藏 */
    open?: boolean
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
    open = false,
    onOk,
    onCancel,
    onClose,
    okText,
    cancelText,
    footer,
    children,
    okClose = true,
    cancelClose = true,
    ...restProps
}) => {
    const [loading, setLoading] = useState(false)

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
        // 如果 okClose 为 false，返回 false 阻止弹窗关闭
        if (!okClose) {
            return false
        }
    }

    // 处理取消按钮点击
    const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
        if (onCancel) {
            onCancel(e)
        }
        // 如果 cancelClose 为 false，返回 false 阻止弹窗关闭
        if (!cancelClose) {
            return false
        }
        if (onClose) {
            onClose()
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
            {...restProps}
        >
            {children}
        </Modal>
    )
}

export default CustomDialog
