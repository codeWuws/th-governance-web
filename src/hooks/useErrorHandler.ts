import { useCallback, useState, useEffect } from 'react'
import { logger } from '../utils/logger'

interface ErrorState {
    error: Error | null
    hasError: boolean
}

interface UseErrorHandlerReturn {
    error: Error | null
    hasError: boolean
    handleError: (error: Error) => void
    clearError: () => void
    resetError: () => void
}

// 异步错误处理 Hook
export const useErrorHandler = (): UseErrorHandlerReturn => {
    const [errorState, setErrorState] = useState<ErrorState>({
        error: null,
        hasError: false,
    })

    const handleError = useCallback((error: Error) => {
        logger.error('Async error caught:', error)

        // 错误上报
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            type: 'async',
        }

        logger.debug('Async error report:', errorReport)

        setErrorState({
            error,
            hasError: true,
        })
    }, [])

    const clearError = useCallback(() => {
        setErrorState({
            error: null,
            hasError: false,
        })
    }, [])

    const resetError = useCallback(() => {
        clearError()
    }, [clearError])

    return {
        error: errorState.error,
        hasError: errorState.hasError,
        handleError,
        clearError,
        resetError,
    }
}

// 安全的异步函数执行 Hook
export const useSafeAsync = () => {
    const { handleError } = useErrorHandler()

    const safeAsync = useCallback(
        async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
            try {
                return await asyncFn()
            } catch (error) {
                handleError(error as Error)
                return null
            }
        },
        [handleError]
    )

    return { safeAsync }
}

// 网络请求错误处理 Hook
export const useNetworkErrorHandler = () => {
    const [networkError, setNetworkError] = useState<string | null>(null)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    const handleNetworkError = useCallback((error: Error | string) => {
        const errorMessage = typeof error === 'string' ? error : error.message

        // 判断错误类型
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            setNetworkError('网络连接失败，请检查您的网络设置')
        } else if (errorMessage.includes('timeout')) {
            setNetworkError('请求超时，请稍后重试')
        } else if (errorMessage.includes('404')) {
            setNetworkError('请求的资源不存在')
        } else if (errorMessage.includes('500')) {
            setNetworkError('服务器内部错误，请稍后重试')
        } else {
            setNetworkError('网络请求失败，请稍后重试')
        }

        logger.error('Network error:', error instanceof Error ? error : new Error(String(error)))
    }, [])

    const clearNetworkError = useCallback(() => {
        setNetworkError(null)
    }, [])

    // 监听网络状态
    const handleOnline = useCallback(() => {
        setIsOffline(false)
        clearNetworkError()
    }, [clearNetworkError])

    const handleOffline = useCallback(() => {
        setIsOffline(true)
        setNetworkError('网络连接已断开')
    }, [])

    // 添加网络状态监听器
    useEffect(() => {
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [handleOnline, handleOffline])

    return {
        networkError,
        isOffline,
        handleNetworkError,
        clearNetworkError,
    }
}

// 表单验证错误处理 Hook
export const useFormErrorHandler = () => {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [generalError, setGeneralError] = useState<string | null>(null)

    const setFieldError = useCallback((field: string, error: string) => {
        setFieldErrors(prev => ({
            ...prev,
            [field]: error,
        }))
    }, [])

    const clearFieldError = useCallback((field: string) => {
        setFieldErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
        })
    }, [])

    const clearAllErrors = useCallback(() => {
        setFieldErrors({})
        setGeneralError(null)
    }, [])

    const hasErrors = Object.keys(fieldErrors).length > 0 || generalError !== null

    return {
        fieldErrors,
        generalError,
        hasErrors,
        setFieldError,
        setGeneralError,
        clearFieldError,
        clearAllErrors,
    }
}
