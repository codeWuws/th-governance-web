import React, { useState, useEffect } from 'react'
import { Modal, ModalProps, Button } from 'antd'
import { showDialog } from '@/utils/showDialog'

/**
 * CustomDialog 组件的属性接口
 * 完全兼容 Antd Modal 的所有属性，并扩展了自定义事件处理
 * 
 * 注意：CustomDialog 内部管理 open 状态，不需要传递 open 属性
 * 通过 okClose 和 cancelClose 来控制点击按钮后是否关闭弹窗
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
    /** 强制关闭弹窗（用于外部控制，如 showDialog） */
    forceClose?: boolean
}

/**
 * CustomDialog 组件
 * 
 * 基于 Antd Modal 封装，完全兼容 Antd Modal 的所有属性和样式
 * 支持自定义事件处理，特别是支持异步的 onOk 回调
 * 内部管理 open 状态，通过 okClose 和 cancelClose 控制关闭行为
 * 
 * 使用方式：
 * 1. 通过 showDialog 使用（推荐）：
 * ```tsx
 * const result = await showDialog({
 *   title: "提示",
 *   children: <p>确定要执行此操作吗？</p>,
 *   onOk: async () => {
 *     // 执行操作
 *   }
 * })
 * ```
 * 
 * 2. 直接使用 CustomDialog 组件：
 * ```tsx
 * <CustomDialog 
 *   title="提示" 
 *   onOk={handleOk} 
 *   okClose={false}  // 点击确定后不关闭
 *   cancelClose={true}  // 点击取消后关闭
 * >
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
    forceClose = false,
    style,
    bodyStyle,
    ...restProps
}) => {
    // 内部管理 open 状态，初始值为 true（弹窗创建时默认显示）
    const [open, setOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    
    // 监听 forceClose，当外部需要强制关闭时（如 showDialog）
    useEffect(() => {
        if (forceClose) {
            setOpen(false)
        }
    }, [forceClose])
    
    // 计算最大高度：屏幕可视高度 - 200px
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 600
    
    // 合并样式，限制弹窗最大高度
    const mergedStyle: React.CSSProperties = {
        maxHeight: `${maxHeight}px`,
        ...style,
    }
    
    // 合并 body 样式，内容区域可滚动
    const mergedBodyStyle: React.CSSProperties = {
        maxHeight: `calc(${maxHeight}px - 110px)`, // 减去标题栏和底部按钮的高度
        overflow: 'auto',
        ...bodyStyle,
    }

    // 内部关闭弹窗的方法
    const handleClose = () => {
        setOpen(false)
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
            handleClose()
            if (onClose) {
                onClose()
            }
        }
    }

    // 处理取消按钮点击（仅用于取消按钮，不用于遮罩层和 ESC 键）
    const handleCancelButton = (e: React.MouseEvent<HTMLElement>) => {
        if (onCancel) {
            onCancel(e)
        }
        // 根据 cancelClose 决定是否关闭弹窗
        if (cancelClose) {
            handleClose()
            if (onClose) {
                onClose()
            }
        }
    }

    // 处理关闭事件（点击遮罩层或 ESC 键，这些情况下总是关闭）
    const handleModalCancel = (e: React.MouseEvent<HTMLElement>) => {
        // 遮罩层和 ESC 键总是关闭弹窗
        handleClose()
        if (onClose) {
            onClose()
        }
    }

    // 处理关闭事件（弹窗完全关闭后的回调）
    const handleAfterClose = () => {
        if (onClose) {
            onClose()
        }
    }

    // 合并 footer 配置
    // 如果用户没有自定义 footer，我们需要自定义 footer 来区分取消按钮和遮罩层/ESC 键
    const mergedFooter = footer === null 
        ? null 
        : footer !== undefined 
        ? footer 
        : (
            // 自定义默认 footer，以便区分取消按钮的点击
            <div style={{ textAlign: 'right' }}>
                <Button onClick={handleCancelButton} style={{ marginRight: 8 }}>
                    {cancelText || '取消'}
                </Button>
                <Button type="primary" onClick={handleOk} loading={loading}>
                    {okText || '确定'}
                </Button>
            </div>
        )

    return (
        <Modal
            open={open}
            onCancel={handleModalCancel}
            afterClose={handleAfterClose}
            footer={mergedFooter}
            style={mergedStyle}
            bodyStyle={mergedBodyStyle}
            {...restProps}
        >
            {children}
        </Modal>
    )
}

export default CustomDialog
