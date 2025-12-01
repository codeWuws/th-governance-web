import { useState, useEffect, useRef, useCallback } from 'react'

// 防抖值hook
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// 防抖回调hook
export const useDebounceCallback = <T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): T => {
    const callbackRef = useRef(callback)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // 更新回调引用
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args)
            }, delay)
        },
        [delay]
    ) as T

    // 清理定时器
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return debouncedCallback
}

// 防抖搜索hook
export const useDebounceSearch = (searchFn: (query: string) => void, delay: number = 300) => {
    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const debouncedQuery = useDebounce(query, delay)

    useEffect(() => {
        if (debouncedQuery) {
            setIsSearching(true)
            searchFn(debouncedQuery)
            setIsSearching(false)
        }
    }, [debouncedQuery, searchFn])

    return {
        query,
        setQuery,
        isSearching,
        debouncedQuery,
    }
}
