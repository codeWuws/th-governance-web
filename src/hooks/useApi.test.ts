import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi, usePagination, useInfiniteScroll } from './useApi'

// Mock API function
const mockApiFunction = vi.fn()
const mockPaginationApiFunction = vi.fn()

describe('useApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('useApi', () => {
        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => useApi(mockApiFunction, { immediate: false }))

            expect(result.current.data).toBeNull()
            expect(result.current.loading).toBe(false)
            expect(result.current.error).toBeNull()
            expect(result.current.status).toBe('idle')
        })

        it('should execute API function immediately when immediate is true', async () => {
            const mockData = { id: 1, name: 'test' }
            mockApiFunction.mockResolvedValue(mockData)

            const { result } = renderHook(() => useApi(mockApiFunction, { immediate: true }))

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(mockApiFunction).toHaveBeenCalledTimes(1)
            expect(result.current.data).toEqual(mockData)
            expect(result.current.status).toBe('success')
        })

        it('should not execute immediately when immediate is false', () => {
            renderHook(() => useApi(mockApiFunction, { immediate: false }))

            expect(mockApiFunction).not.toHaveBeenCalled()
        })

        it('should execute API function manually', async () => {
            const mockData = { id: 1, name: 'test' }
            mockApiFunction.mockResolvedValue(mockData)

            const { result } = renderHook(() => useApi(mockApiFunction, { immediate: false }))

            await act(async () => {
                await result.current.execute()
            })

            expect(mockApiFunction).toHaveBeenCalledTimes(1)
            expect(result.current.data).toEqual(mockData)
            expect(result.current.loading).toBe(false)
            expect(result.current.status).toBe('success')
        })

        it('should handle API errors', async () => {
            const errorMessage = 'API Error'
            mockApiFunction.mockRejectedValue(new Error(errorMessage))

            const { result } = renderHook(() => useApi(mockApiFunction, { immediate: false }))

            await act(async () => {
                try {
                    await result.current.execute()
                } catch {
                    // Expected to throw
                }
            })

            expect(result.current.error).toBe(errorMessage)
            expect(result.current.loading).toBe(false)
            expect(result.current.status).toBe('error')
        })

        it('should call success callback on successful request', async () => {
            const mockData = { id: 1, name: 'test' }
            const onSuccess = vi.fn()
            mockApiFunction.mockResolvedValue(mockData)

            const { result } = renderHook(() =>
                useApi(mockApiFunction, { immediate: false, onSuccess })
            )

            await act(async () => {
                await result.current.execute()
            })

            expect(onSuccess).toHaveBeenCalledWith(mockData)
        })

        it('should call error callback on failed request', async () => {
            const errorMessage = 'API Error'
            const onError = vi.fn()
            mockApiFunction.mockRejectedValue(new Error(errorMessage))

            const { result } = renderHook(() =>
                useApi(mockApiFunction, { immediate: false, onError })
            )

            await act(async () => {
                try {
                    await result.current.execute()
                } catch {
                    // Expected to throw
                }
            })

            expect(onError).toHaveBeenCalledWith(errorMessage)
        })

        it('should reset state correctly', async () => {
            const mockData = { id: 1, name: 'test' }
            const defaultData = { id: 0, name: 'default' }
            mockApiFunction.mockResolvedValue(mockData)

            const { result } = renderHook(() =>
                useApi(mockApiFunction, { immediate: false, defaultData })
            )

            await act(async () => {
                await result.current.execute()
            })

            expect(result.current.data).toEqual(mockData)

            act(() => {
                result.current.reset()
            })

            expect(result.current.data).toEqual(defaultData)
            expect(result.current.loading).toBe(false)
            expect(result.current.error).toBeNull()
            expect(result.current.status).toBe('idle')
        })

        it('should handle retries on failure', async () => {
            const errorMessage = 'API Error'
            mockApiFunction
                .mockRejectedValueOnce(new Error(errorMessage))
                .mockRejectedValueOnce(new Error(errorMessage))
                .mockResolvedValue({ id: 1, name: 'test' })

            const { result } = renderHook(() =>
                useApi(mockApiFunction, {
                    immediate: false,
                    retries: 2,
                    retryDelay: 10, // Short delay for testing
                })
            )

            await act(async () => {
                await result.current.execute()
            })

            expect(mockApiFunction).toHaveBeenCalledTimes(3)
            expect(result.current.status).toBe('success')
        })

        it('should cancel request', async () => {
            let resolvePromise: (value: unknown) => void
            const mockPromise = new Promise(resolve => {
                resolvePromise = resolve
            })

            mockApiFunction.mockReturnValue(mockPromise)

            const { result } = renderHook(() => useApi(mockApiFunction, { immediate: false }))

            // Start the request
            await act(async () => {
                result.current.execute()
            })

            expect(result.current.loading).toBe(true)

            // Cancel the request
            act(() => {
                result.current.cancel()
            })

            // Resolve the promise to simulate completion
            await act(async () => {
                resolvePromise({ data: 'test' })
            })

            // The request should be cancelled
            expect(result.current.loading).toBe(false)
            expect(result.current.error).toBe('Request cancelled')
            expect(result.current.status).toBe('error')
        })
    })

    describe('usePagination', () => {
        beforeEach(() => {
            mockPaginationApiFunction.mockResolvedValue({
                data: [
                    { id: 1, name: 'item1' },
                    { id: 2, name: 'item2' },
                ],
                total: 100,
                page: 1,
                pageSize: 10,
            })
        })

        it('should initialize with correct pagination state', () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, {
                    immediate: false,
                    initialPage: 2,
                    initialPageSize: 20,
                })
            )

            expect(result.current.page).toBe(2)
            expect(result.current.pageSize).toBe(20)
            expect(result.current.total).toBe(0)
        })

        it('should update page correctly', async () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, { immediate: false })
            )

            act(() => {
                result.current.setPage(3)
            })

            expect(result.current.page).toBe(3)
        })

        it('should update page size correctly', async () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, { immediate: false })
            )

            act(() => {
                result.current.setPageSize(25)
            })

            expect(result.current.pageSize).toBe(25)
        })

        it('should go to next page', async () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, { immediate: false })
            )

            // Set total first
            await act(async () => {
                await result.current.refresh()
            })

            act(() => {
                result.current.nextPage()
            })

            expect(result.current.page).toBe(2)
        })

        it('should go to previous page', async () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, {
                    immediate: false,
                    initialPage: 3,
                })
            )

            act(() => {
                result.current.prevPage()
            })

            expect(result.current.page).toBe(2)
        })

        it('should not go to previous page when on first page', () => {
            const { result } = renderHook(() =>
                usePagination(mockPaginationApiFunction, { immediate: false })
            )

            act(() => {
                result.current.prevPage()
            })

            expect(result.current.page).toBe(1)
        })
    })

    describe('useInfiniteScroll', () => {
        const mockInfiniteApiFunction = vi.fn()

        beforeEach(() => {
            mockInfiniteApiFunction.mockResolvedValue([
                { id: 1, name: 'item1' },
                { id: 2, name: 'item2' },
            ])
        })

        it('should initialize with correct infinite scroll state', () => {
            const { result } = renderHook(() =>
                useInfiniteScroll(mockInfiniteApiFunction, { immediate: false })
            )

            expect(result.current.data).toEqual([])
            expect(result.current.hasMore).toBe(true)
            expect(result.current.page).toBe(1)
        })

        it('should load more data correctly', async () => {
            const { result } = renderHook(() =>
                useInfiniteScroll(mockInfiniteApiFunction, { immediate: false })
            )

            await act(async () => {
                await result.current.loadMore()
            })

            expect(result.current.data).toHaveLength(2)
            expect(result.current.page).toBe(2)
        })

        it('should append new data when loading more', async () => {
            mockInfiniteApiFunction
                .mockResolvedValueOnce([{ id: 1, name: 'item1' }])
                .mockResolvedValueOnce([{ id: 2, name: 'item2' }])

            const { result } = renderHook(() =>
                useInfiniteScroll(mockInfiniteApiFunction, { immediate: false })
            )

            await act(async () => {
                await result.current.loadMore()
            })

            expect(result.current.data).toHaveLength(1)

            await act(async () => {
                await result.current.loadMore()
            })

            // Wait for state updates to complete
            await waitFor(() => {
                expect(result.current.data).toHaveLength(2)
            })

            expect(result.current.data).toEqual([
                { id: 1, name: 'item1' },
                { id: 2, name: 'item2' },
            ])
        })

        it('should refresh data correctly', async () => {
            const { result } = renderHook(() =>
                useInfiniteScroll(mockInfiniteApiFunction, { immediate: false })
            )

            // Load some data first
            await act(async () => {
                await result.current.loadMore()
            })

            expect(result.current.page).toBe(2)

            // Refresh should reset to page 1
            await act(async () => {
                result.current.refresh()
            })

            await waitFor(() => {
                expect(result.current.page).toBe(1)
            })
        })

        it('should handle hasMore correctly', async () => {
            const customHasMore = vi.fn().mockReturnValue(false)

            const { result } = renderHook(() =>
                useInfiniteScroll(mockInfiniteApiFunction, {
                    immediate: false,
                    hasMore: customHasMore,
                })
            )

            await act(async () => {
                await result.current.loadMore()
            })

            expect(result.current.hasMore).toBe(false)
            expect(customHasMore).toHaveBeenCalledWith(expect.any(Array), expect.any(Number))
        })
    })
})
