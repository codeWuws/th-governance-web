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

// 防重复弹窗机制：记录最近显示的错误消息和时间戳
const recentErrors = new Map<string, number>()
const ERROR_DEBOUNCE_TIME = 2000 // 2秒内相同错误不重复显示

/**
 * 检查是否应该显示错误（防重复）
 */
const shouldShowError = (errorMessage: string): boolean => {
    const now = Date.now()
    const lastTime = recentErrors.get(errorMessage)
    
    if (lastTime && now - lastTime < ERROR_DEBOUNCE_TIME) {
        // 2秒内相同错误不重复显示
        return false
    }
    
    // 记录当前错误和时间戳
    recentErrors.set(errorMessage, now)
    
    // 清理过期的记录（保留最近10条）
    if (recentErrors.size > 10) {
        const sortedEntries = Array.from(recentErrors.entries()).sort((a, b) => b[1] - a[1])
        recentErrors.clear()
        sortedEntries.slice(0, 10).forEach(([msg, time]) => {
            recentErrors.set(msg, time)
        })
    }
    
    return true
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
     * 显示实际的错误信息，而不是统一显示"系统繁忙"
     * @param error 错误对象或错误消息
     * @param isValidationErrorFlag 是否明确指定为校验错误（可选，如果不提供则自动判断）
     */
    handleSystemError(error: unknown, isValidationErrorFlag?: boolean): void {
        // 提取错误消息
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // 如果错误消息为空，使用默认提示
        const displayMessage = errorMessage || '操作失败，请稍后重试'
        
        // 如果明确指定为校验错误，或者自动判断为校验错误，则使用error提示
        const isValidation = isValidationErrorFlag !== undefined ? isValidationErrorFlag : isValidationError(error)
        
        // 防重复弹窗检查
        if (!shouldShowError(displayMessage)) {
            return
        }
        
        if (isValidation) {
            // 校验错误使用error提示
            this.error(displayMessage)
        } else {
            // 其他错误显示实际错误信息，使用error提示（而不是warning）
            this.error(displayMessage)
        }
    },
}

export default uiMessage
