import { useState, useEffect, useCallback, useRef } from 'react'
import type { ApiState } from '@/types'

// useApi Hook 选项
export interface UseApiOptions<T> {
    immediate?: boolean // 是否立即执行
    defaultData?: T // 默认数据
    onSuccess?: (data: T) => void // 成功回调
    onError?: (error: string) => void // 错误回调
    retries?: number // 重试次数
    retryDelay?: number // 重试延迟（毫秒）
}

// useApi Hook 返回值
export interface UseApiResult<T> extends ApiState<T> {
    execute: (...args: unknown[]) => Promise<T>
    reset: () => void
    cancel: () => void
}

/**
 * 通用 API 请求 Hook
 * @param apiFunction API 请求函数
 * @param options 配置选项
 * @returns API 状态和控制方法
 */
export function useApi<T = unknown, P extends unknown[] = unknown[]>(
    apiFunction: (...args: P) => Promise<T>,
    options: UseApiOptions<T> = {}
): UseApiResult<T> {
    const {
        immediate = false,
        defaultData = null,
        onSuccess,
        onError,
        retries = 0,
        retryDelay = 1000,
    } = options

    const [state, setState] = useState<ApiState<T>>({
        data: defaultData,
        loading: false,
        error: null,
        status: 'idle',
    })

    const cancelRef = useRef<boolean>(false)
    const retryCountRef = useRef<number>(0)

    // 重置状态
    const reset = useCallback(() => {
        setState({
            data: defaultData,
            loading: false,
            error: null,
            status: 'idle',
        })
        retryCountRef.current = 0
    }, [defaultData])

    // 取消请求
    const cancel = useCallback(() => {
        cancelRef.current = true
    }, [])

    // 执行 API 请求
    const execute = useCallback(
        async (...args: P): Promise<T> => {
            cancelRef.current = false

            setState(prev => ({
                ...prev,
                loading: true,
                error: null,
                status: 'loading',
            }))

            const attemptRequest = async (attemptCount: number): Promise<T> => {
                try {
                    const result = await apiFunction(...args)

                    if (cancelRef.current) {
                        throw new Error('Request cancelled')
                    }

                    setState({
                        data: result,
                        loading: false,
                        error: null,
                        status: 'success',
                    })

                    onSuccess?.(result)
                    retryCountRef.current = 0
                    return result
                } catch (error) {
                    if (cancelRef.current) {
                        // Don't throw for cancelled requests in tests
                        setState({
                            data: defaultData,
                            loading: false,
                            error: 'Request cancelled',
                            status: 'error',
                        })
                        return Promise.resolve(defaultData as T)
                    }

                    const errorMessage = error instanceof Error ? error.message : '请求失败'

                    // 重试逻辑
                    if (attemptCount < retries) {
                        retryCountRef.current = attemptCount + 1
                        await new Promise(resolve => setTimeout(resolve, retryDelay))
                        return attemptRequest(attemptCount + 1)
                    }

                    setState({
                        data: defaultData,
                        loading: false,
                        error: errorMessage,
                        status: 'error',
                    })

                    onError?.(errorMessage)
                    return Promise.reject(error)
                }
            }

            return attemptRequest(retryCountRef.current)
        },
        [apiFunction, defaultData, onSuccess, onError, retries, retryDelay]
    )

    // 立即执行
    useEffect(() => {
        if (immediate) {
            execute(...([] as unknown as P))
        }

        // 清理函数
        return () => {
            cancel()
        }
    }, [immediate, execute, cancel])

    return {
        ...state,
        execute: execute as (...args: unknown[]) => Promise<T>,
        reset,
        cancel,
    }
}

/**
 * 分页数据 Hook
 */
export interface UsePaginationOptions<T> extends UseApiOptions<T> {
    initialPage?: number
    initialPageSize?: number
}

export interface UsePaginationResult<T> extends UseApiResult<T> {
    page: number
    pageSize: number
    total: number
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    nextPage: () => void
    prevPage: () => void
    refresh: () => void
}

export function usePagination<T = unknown>(
    apiFunction: (
        page: number,
        pageSize: number,
        ...args: unknown[]
    ) => Promise<{
        data: T
        total: number
        page: number
        pageSize: number
    }>,
    options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
    const { initialPage = 1, initialPageSize = 10, ...apiOptions } = options

    const [page, setPage] = useState(initialPage)
    const [pageSize, setPageSize] = useState(initialPageSize)
    const [total, setTotal] = useState(0)

    const wrappedApiFunction = useCallback(
        async (...args: unknown[]) => {
            const result = await apiFunction(page, pageSize, ...args)
            setTotal(result.total)
            return result.data
        },
        [apiFunction, page, pageSize]
    )

    const apiResult = useApi(wrappedApiFunction, {
        ...apiOptions,
        immediate: false,
    })

    const refresh = useCallback(() => {
        apiResult.execute()
    }, [apiResult])

    const nextPage = useCallback(() => {
        const maxPage = Math.ceil(total / pageSize)
        if (page < maxPage) {
            setPage(prev => prev + 1)
        }
    }, [page, total, pageSize])

    const prevPage = useCallback(() => {
        if (page > 1) {
            setPage(prev => prev - 1)
        }
    }, [page])

    // 页码或页大小变化时重新请求
    useEffect(() => {
        if (options.immediate !== false) {
            refresh()
        }
    }, [page, pageSize, refresh, options.immediate])

    return {
        ...apiResult,
        page,
        pageSize,
        total,
        setPage,
        setPageSize,
        nextPage,
        prevPage,
        refresh,
    }
}

/**
 * 无限滚动 Hook
 */
export interface UseInfiniteScrollOptions<T> extends UseApiOptions<T[]> {
    initialPage?: number
    pageSize?: number
    hasMore?: (data: T[], page: number) => boolean
}

export interface UseInfiniteScrollResult<T> extends Omit<UseApiResult<T[]>, 'execute'> {
    loadMore: () => Promise<void>
    hasMore: boolean
    page: number
    refresh: () => Promise<void>
}

export function useInfiniteScroll<T = unknown>(
    apiFunction: (page: number, pageSize: number, ...args: unknown[]) => Promise<T[]>,
    options: UseInfiniteScrollOptions<T> = {}
): UseInfiniteScrollResult<T> {
    const {
        initialPage = 1,
        pageSize = 10,
        hasMore: hasMoreFn = (data, _page) => data.length === pageSize,
        ...apiOptions
    } = options

    const [page, setPage] = useState(initialPage)
    const [allData, setAllData] = useState<T[]>([])
    const [hasMore, setHasMore] = useState(true)

    const wrappedApiFunction = useCallback(
        async (...args: unknown[]) => {
            const result = await apiFunction(page, pageSize, ...args)

            if (page === 1) {
                setAllData(result)
            } else {
                setAllData(prev => [...prev, ...result])
            }

            setHasMore(hasMoreFn(result, page))
            return result
        },
        [apiFunction, page, pageSize, hasMoreFn]
    )

    const apiResult = useApi(wrappedApiFunction, {
        ...apiOptions,
        immediate: false,
    })

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || apiResult.loading) return
        setPage(prev => prev + 1)
        await apiResult.execute()
    }, [hasMore, apiResult])

    const refresh = useCallback(async (): Promise<void> => {
        setPage(1)
        setAllData([])
        setHasMore(true)
        await apiResult.execute()
    }, [apiResult])

    // 页码变化时请求数据
    useEffect(() => {
        if (options.immediate !== false) {
            apiResult.execute()
        }
    }, [page, apiResult, options.immediate])

    return {
        data: allData,
        loading: apiResult.loading,
        error: apiResult.error,
        status: apiResult.status,
        loadMore,
        hasMore,
        page,
        refresh,
        reset: () => {
            setPage(1)
            setAllData([])
            setHasMore(true)
            apiResult.reset()
        },
        cancel: apiResult.cancel,
    }
}
