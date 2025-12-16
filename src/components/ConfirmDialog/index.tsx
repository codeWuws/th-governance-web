import React from 'react'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import CustomDialog, { CustomDialogProps } from '../CustomDialog'

/**
 * 确认对话框组件的属性接口
 */
export interface ConfirmDialogProps extends Omit<CustomDialogProps, 'children'> {
    /** 确认提示内容 */
    content: React.ReactNode
    /** 确认提示标题，默认为"确认操作" */
    title?: string
    /** 确定按钮文字，默认为"确定" */
    okText?: string
    /** 取消按钮文字，默认为"取消" */
    cancelText?: string
    /** 是否显示警告图标，默认为 true */
    showIcon?: boolean
    /** 图标颜色，默认为 #faad14（警告色） */
    iconColor?: string
}

/**
 * 确认对话框组件
 * 
 * 用于显示确认提示，支持自定义标题、内容和按钮文字
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   title="确认删除"
 *   content="确定要删除此项吗？"
 *   onOk={handleConfirm}
 * />
 * ```
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    content,
    title = '确认操作',
    okText = '确定',
    cancelText = '取消',
    showIcon = true,
    iconColor = '#faad14',
    ...restProps
}) => {
    return (
        <CustomDialog
            title={title}
            okText={okText}
            cancelText={cancelText}
            {...restProps}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {showIcon && (
                    <ExclamationCircleOutlined
                        style={{
                            fontSize: 22,
                            color: iconColor,
                            marginTop: 2,
                            flexShrink: 0,
                        }}
                    />
                )}
                <div style={{ flex: 1, fontSize: 14, lineHeight: '22px', color: 'rgba(0, 0, 0, 0.85)' }}>
                    {content}
                </div>
            </div>
        </CustomDialog>
    )
}

export default ConfirmDialog


