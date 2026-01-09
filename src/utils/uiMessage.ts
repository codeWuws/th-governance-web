import type { ArgsProps } from 'antd/es/message/interface'
import { messageBus } from '@/utils/messageBus'

// Generate a unique key if caller does not provide one
const uniqueKey = (): string => `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`

/**
 * 判断是否是表单验证错误
 * Antd Form验证错误通常包含errorFields属性
 */
const isValidationError = (error: unknown): boolean => {
    if (error && typeof error === 'object') {
        // Antd Form验证错误通常包含errorFields属性
        if ('errorFields' in error && Array.isArray((error as { errorFields: unknown }).errorFields)) {
            return true
        }
        // 检查错误消息中是否包含验证相关的关键词
        if ('message' in error) {
            const message = String((error as { message: string }).message).toLowerCase()
            const validationKeywords = ['验证', '校验', 'validate', 'validation', 'required', '必填', '格式', 'format']
            if (validationKeywords.some(keyword => message.includes(keyword))) {
                return true
            }
        }
    }
    return false
}

export const uiMessage = {
    open(args: ArgsProps): void {
        messageBus.publish({ type: 'open', args })
    },
    success(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'success', content, duration })
    },
    error(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'error', content, duration })
    },
    info(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'info', content, duration })
    },
    warning(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'warning', content, duration })
    },
    /**
     * Loading message. Returns a key that can be used to destroy later.
     * For React 19 compatibility, we recommend using key-based destroy.
     */
    loading(content: ArgsProps['content'], duration: number = 0, key?: string): string {
        const k = key || uniqueKey()
        this.open({ type: 'loading', content, duration, key: k })
        return k
    },
    /** Destroy message by key or destroy all if key is undefined */
    destroy(key?: string): void {
        messageBus.publish({ type: 'destroy', key })
    },
    /**
     * 统一的系统错误处理函数
     * 除了校验错误外，其他所有错误都使用"系统繁忙"并使用warning提示
     * @param error 错误对象或错误消息
     * @param isValidationError 是否明确指定为校验错误（可选，如果不提供则自动判断）
     */
    handleSystemError(error: unknown, isValidationErrorFlag?: boolean): void {
        // 如果明确指定为校验错误，或者自动判断为校验错误，则使用error提示
        const isValidation = isValidationErrorFlag !== undefined ? isValidationErrorFlag : isValidationError(error)
        
        if (isValidation) {
            // 校验错误保持原样，使用error提示
            const errorMessage = error instanceof Error ? error.message : String(error)
            this.error(errorMessage)
        } else {
            // 其他所有错误统一显示"系统繁忙"，使用warning提示
            this.warning('系统繁忙，请稍后重试')
        }
    },
}

export default uiMessage
