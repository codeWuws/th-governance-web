import { showDialog } from './showDialog'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

/**
 * 显示确认对话框的配置选项
 */
export interface ShowConfirmOptions {
    /** 确认提示标题，默认为"确认操作" */
    title?: string
    /** 确认提示内容 */
    content: React.ReactNode
    /** 确定按钮文字，默认为"确定" */
    okText?: string
    /** 取消按钮文字，默认为"取消" */
    cancelText?: string
    /** 是否显示警告图标，默认为 true */
    showIcon?: boolean
    /** 图标颜色，默认为 #faad14（警告色） */
    iconColor?: string
    /** 确定按钮类型，默认为 'danger' */
    okType?: 'primary' | 'default' | 'dashed' | 'link' | 'text' | 'danger'
    /** 点击确定按钮的回调，支持异步操作 */
    onOk?: () => void | Promise<void>
    /** 点击取消按钮的回调 */
    onCancel?: () => void
    /** 弹窗关闭时的回调 */
    onClose?: () => void
    /** 弹窗宽度，默认为 416px */
    width?: number | string
}

/**
 * 显示确认对话框
 * 
 * 基于 showDialog 和 ConfirmDialog 封装的确认提示工具函数
 * 
 * @param options - 确认对话框配置选项
 * @returns Promise<boolean> - 返回 true 表示点击了确定，false 表示取消或关闭
 * 
 * @example
 * ```tsx
 * // 基础用法
 * const confirmed = await showConfirm({
 *   title: '确认删除',
 *   content: '确定要删除此项吗？删除后无法恢复。',
 * })
 * 
 * if (confirmed) {
 *   // 执行删除操作
 *   handleDelete()
 * }
 * 
 * // 带回调的用法
 * await showConfirm({
 *   title: '确认删除',
 *   content: '确定要删除此项吗？',
 *   onOk: async () => {
 *     await deleteItem()
 *     message.success('删除成功')
 *   },
 * })
 * ```
 */
export function showConfirm(options: ShowConfirmOptions): Promise<boolean> {
    const {
        title = '确认操作',
        content,
        okText = '确定',
        cancelText = '取消',
        showIcon = true,
        iconColor = '#faad14',
        okType = 'danger',
        onOk,
        onCancel,
        onClose,
        width = 416,
    } = options

    return showDialog<ConfirmDialogProps>(ConfirmDialog, {
        title,
        content,
        okText,
        cancelText,
        showIcon,
        iconColor,
        okType,
        width,
        onOk,
        onCancel,
        onClose,
    })
}

/**
 * 显示删除确认对话框（快捷方法）
 * 
 * @param content - 确认提示内容
 * @param onOk - 确定按钮回调
 * @returns Promise<boolean>
 * 
 * @example
 * ```tsx
 * await showDeleteConfirm('确定要删除此项吗？', async () => {
 *   await deleteItem()
 * })
 * ```
 */
export function showDeleteConfirm(
    content: React.ReactNode,
    onOk?: () => void | Promise<void>
): Promise<boolean> {
    return showConfirm({
        title: '确认删除',
        content,
        okText: '确定',
        cancelText: '取消',
        okType: 'danger',
        onOk,
    })
}


