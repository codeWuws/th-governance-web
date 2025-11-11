import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { api, RequestCanceler } from './request'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
})

describe('Request Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Request Canceler', () => {
        let canceler: RequestCanceler

        beforeEach(() => {
            canceler = new RequestCanceler()
        })

        it('should add request to pending list', () => {
            const config = { url: '/test', method: 'get' }
            canceler.addRequest(config)

            // 验证请求被添加到待处理列表
            expect(canceler['pendingRequests'].size).toBe(1)
        })

        it('should cancel specific request', () => {
            const config = { url: '/test', method: 'get' }
            canceler.addRequest(config)

            const requestKey = canceler['getRequestKey'](config)
            canceler.cancelRequest(requestKey)

            // 验证请求被取消
            expect(canceler['pendingRequests'].size).toBe(0)
        })

        it('should cancel all requests', () => {
            const config1 = { url: '/test1', method: 'get' }
            const config2 = { url: '/test2', method: 'post' }

            canceler.addRequest(config1)
            canceler.addRequest(config2)

            expect(canceler['pendingRequests'].size).toBe(2)

            canceler.cancelAllRequests()

            expect(canceler['pendingRequests'].size).toBe(0)
        })

        it('should remove request from pending list', () => {
            const config = { url: '/test', method: 'get' }
            canceler.addRequest(config)

            expect(canceler['pendingRequests'].size).toBe(1)

            canceler.removeRequest(config)

            expect(canceler['pendingRequests'].size).toBe(0)
        })

        it('should generate consistent request key', () => {
            const config1 = { url: '/test', method: 'get', params: { id: 1 } }
            const config2 = { url: '/test', method: 'get', params: { id: 1 } }

            const key1 = canceler['getRequestKey'](config1)
            const key2 = canceler['getRequestKey'](config2)

            expect(key1).toBe(key2)
        })
    })

    describe('Request Instance', () => {
        beforeEach(() => {
            mockedAxios.create.mockReturnValue({
                interceptors: {
                    request: { use: vi.fn() },
                    response: { use: vi.fn() },
                },
                get: vi.fn(),
                post: vi.fn(),
                put: vi.fn(),
                patch: vi.fn(),
                delete: vi.fn(),
            } as unknown as typeof axios)
        })

        it('should create axios instance with correct config', () => {
            expect(mockedAxios.create).toHaveBeenCalledWith({
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        })

        it('should handle successful response', async () => {
            const mockResponse = {
                data: { code: 0, message: 'success', data: { id: 1 } },
                status: 200,
                config: { method: 'get', url: '/test' },
            }

            mockedAxios.get.mockResolvedValue(mockResponse)

            const result = await api.get('/test')
            expect(result).toEqual(mockResponse.data)
        })

        it('should handle error response', async () => {
            const mockError = {
                response: {
                    status: 500,
                    data: { code: 500, message: 'Server Error' },
                },
                config: { method: 'get', url: '/test' },
            }

            mockedAxios.get.mockRejectedValue(mockError)

            await expect(api.get('/test')).rejects.toThrow()
        })

        it('should handle network error', async () => {
            const mockError = {
                code: 'ERR_NETWORK',
                message: 'Network Error',
                config: { method: 'get', url: '/test' },
            }

            mockedAxios.get.mockRejectedValue(mockError)

            await expect(api.get('/test')).rejects.toThrow()
        })

        it('should handle timeout error', async () => {
            const mockError = {
                code: 'ECONNABORTED',
                message: 'timeout of 10000ms exceeded',
                config: { method: 'get', url: '/test' },
            }

            mockedAxios.get.mockRejectedValue(mockError)

            await expect(api.get('/test')).rejects.toThrow('请求超时，请稍后重试')
        })
    })

    describe('API Methods', () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({ data: 'get response' })
            mockedAxios.post.mockResolvedValue({ data: 'post response' })
            mockedAxios.put.mockResolvedValue({ data: 'put response' })
            mockedAxios.patch.mockResolvedValue({ data: 'patch response' })
            mockedAxios.delete.mockResolvedValue({ data: 'delete response' })
        })

        it('should make GET request', async () => {
            await api.get('/test')
            expect(mockedAxios.get).toHaveBeenCalledWith('/test', undefined)
        })

        it('should make POST request', async () => {
            const data = { name: 'test' }
            await api.post('/test', data)
            expect(mockedAxios.post).toHaveBeenCalledWith('/test', data, undefined)
        })

        it('should make PUT request', async () => {
            const data = { name: 'test' }
            await api.put('/test', data)
            expect(mockedAxios.put).toHaveBeenCalledWith('/test', data, undefined)
        })

        it('should make PATCH request', async () => {
            const data = { name: 'test' }
            await api.patch('/test', data)
            expect(mockedAxios.patch).toHaveBeenCalledWith('/test', data, undefined)
        })

        it('should make DELETE request', async () => {
            await api.delete('/test')
            expect(mockedAxios.delete).toHaveBeenCalledWith('/test', undefined)
        })

        it('should handle file upload', async () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' })

            mockedAxios.post.mockResolvedValue({ data: { url: 'uploaded-file-url' } })

            await api.upload('/upload', file)

            expect(mockedAxios.post).toHaveBeenCalledWith(
                '/upload',
                expect.any(FormData),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'multipart/form-data',
                    }),
                })
            )
        })

        it('should handle file download', async () => {
            const mockBlob = new Blob(['file content'], { type: 'application/pdf' })
            mockedAxios.get.mockResolvedValue(mockBlob)

            // Mock DOM methods
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
                remove: vi.fn(),
            }

            vi.spyOn(document, 'createElement').mockReturnValue(
                mockLink as unknown as HTMLAnchorElement
            )
            vi.spyOn(document.body, 'appendChild').mockImplementation(
                () => mockLink as unknown as Node
            )

            await api.download('/download/test.pdf')

            expect(mockedAxios.get).toHaveBeenCalledWith('/download/test.pdf', {
                responseType: 'blob',
            })
            expect(mockLink.click).toHaveBeenCalled()
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })
})
