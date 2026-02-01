/**
 * 工作流服务
 * 提供工作流配置和执行相关的API接口
 */

import type {
    ApiResponse,
    ExecutionLogPageParams,
    ExecutionLogPageData,
    WorkflowConfigResponse,
    WorkflowConfigUpdateItem,
    WorkflowConfigUpdateResponse,
    WorkflowDetailResponse,
    WorkflowLogDetailResponse,
    WorkflowNode,
} from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'
import { getRuntimeConfig } from '@/utils/configLoader'
import { getEnv } from '@/utils/env'

/**
 * 工作流服务类
 * 封装所有工作流相关的API调用
 */
export class WorkflowService {
    /**
     * 获取工作流配置列表
     * @description 获取所有工作流步骤的配置信息
     * @returns Promise<WorkflowNode[]> 响应拦截器已处理业务异常，直接返回data字段
     */
    static async getWorkflowConfig(): Promise<WorkflowNode[]> {
        return await api.get<WorkflowNode[]>('/data/governance/task/config/list', {
            returnDataOnly: true,
        })
    }

    /**
     * 批量更新工作流配置
     * @description 批量更新工作流步骤的启用状态和自动流转设置
     * @param configs 要更新的配置项列表
     * @returns Promise<WorkflowConfigUpdateResponse>
     */
    static async updateWorkflowConfig(
        configs: WorkflowConfigUpdateItem[]
    ): Promise<WorkflowConfigUpdateResponse> {
        return await api.post<WorkflowConfigUpdateResponse>(
            '/data/governance/task/config/update',
            configs
        )
    }

    /**
     * 获取工作流详情
     * @description 根据批次ID获取工作流执行的详细信息
     * @param batchId 批次ID
     * @returns Promise<WorkflowDetailResponse>
     */
    static async getWorkflowDetail(batchId: string): Promise<WorkflowDetailResponse> {
        try {
            logger.debug(`发送获取工作流详情请求到: /data/governance/log/${batchId}`)
            const response = await api.get<WorkflowDetailResponse>(
                `/data/governance/log/${batchId}`
            )
            logger.debug('获取工作流详情API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取工作流详情API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取工作流详情失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取执行日志详情
     * @description 根据日志ID获取工作流执行的详细信息，包含步骤列表和任务摘要
     * @param logId 日志ID
     * @returns Promise<WorkflowLogDetailResponse>
     */
    static async getLogDetail(logId: string): Promise<WorkflowLogDetailResponse> {
        if (!logId) {
            throw new Error('日志ID不能为空')
        }
        return await api.get<WorkflowLogDetailResponse>(`/data/governance/task/log/${logId}`)
    }

    /**
     * 获取执行历史日志分页列表
     * @param params 分页参数 { pageNo, pageSize }
     * @returns 执行历史日志分页数据 响应拦截器已处理业务异常，直接返回data字段
     */
    static async getExecutionLogPage(
        params: ExecutionLogPageParams
    ): Promise<ExecutionLogPageData> {
        return await api.get<ExecutionLogPageData>('/data/governance/task/log/page', {
            params,
            returnDataOnly: true,
        })
    }

    /**
     * 获取数据清洗结果
     * @description 根据批次ID获取数据清洗的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getCleaningResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 10
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/cleaning/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 获取去重步骤结果
     * @description 根据批次ID获取去重步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<{ id: number, batchId: number, ids: string, tableName: string, columnName: string }>, total: number, size: number, current: number, pages: number }>>
     */
    static async getDeduplicateResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20
    ): Promise<
        ApiResponse<{
            records: Array<{
                id: number
                batchId: number
                ids: string
                tableName: string
                columnName: string
            }>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<{
                    id: number
                    batchId: number
                    ids: string
                    tableName: string
                    columnName: string
                }>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/deduplicate/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 获取丢孤儿步骤结果
     * @description 根据批次ID获取丢孤儿步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getOrphanResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/orphan/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 获取数据脱敏步骤结果
     * @description 根据批次ID获取数据脱敏步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getSensitiveResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/sensitive/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 获取EMPI步骤结果
     * @description 根据批次ID获取EMPI步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getEmpiResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/empi/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 获取EMOI步骤结果
     * @description 根据批次ID获取EMOI步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @param condition 关键字段模糊查询（可选）
     * @param sortField 排序字段（可选，默认create_time）
     * @param sortOrder 排序顺序（可选，默认desc）
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getEmoiResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20,
        condition?: string,
        sortField = 'create_time',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/emoi/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
            condition,
            sortField,
            sortOrder,
        })
    }

    /**
     * 获取标准对照步骤结果
     * @description 根据批次ID获取标准对照步骤的详细结果（分页）
     * @param batchId 批次ID
     * @param pageNum 当前页码，从1开始
     * @param pageSize 每页大小
     * @returns Promise<ApiResponse<{ records: Array<Record<string, unknown>>, total: number, size: number, current: number, pages: number }>>
     */
    static async getStandardMappingResult(
        batchId: number | string,
        pageNum = 1,
        pageSize = 20
    ): Promise<
        ApiResponse<{
            records: Array<Record<string, unknown>>
            total: number
            size: number
            current: number
            pages: number
        }>
    > {
        return await api.post<
            ApiResponse<{
                records: Array<Record<string, unknown>>
                total: number
                size: number
                current: number
                pages: number
            }>
        >('/data/governance/task/logs/standard-mapping/page', {
            batchId: Number(batchId),
            pageNum,
            pageSize,
        })
    }

    /**
     * 数据录入（数据同步）
     * @description 根据任务ID进行数据录入同步
     * @param taskId 任务ID
     * @returns Promise<ApiResponse<null>>
     */
    static async syncTaskData(taskId: string): Promise<ApiResponse<null>> {
        if (!taskId) {
            throw new Error('任务ID不能为空')
        }
        return await api.post<ApiResponse<null>>(`/data/governance/task/data/sync/${taskId}`)
    }

    /**
     * 导出数据清洗结果
     * @description 根据批次ID导出数据清洗结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportCleaningResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/cleaning/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('数据清洗结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出数据清洗结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出数据清洗结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出数据去重结果
     * @description 根据批次ID导出数据去重结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportDeduplicateResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/deduplicate/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('数据去重结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出数据去重结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出数据去重结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出丢孤儿结果
     * @description 根据批次ID导出丢孤儿结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportOrphanResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/orphan/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('丢孤儿结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出丢孤儿结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出丢孤儿结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出数据脱敏结果
     * @description 根据批次ID导出数据脱敏结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportSensitiveResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/sensitive/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('数据脱敏结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出数据脱敏结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出数据脱敏结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出EMOI结果
     * @description 根据批次ID导出EMOI结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportEmoiResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/emoi/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('EMOI结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出EMOI结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出EMOI结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出标准对照结果
     * @description 根据批次ID导出标准对照结果为文件
     * @param batchId 批次ID
     * @returns Promise<void>
     */
    static async exportStandardMappingResult(batchId: number | string): Promise<void> {
        if (!batchId) {
            throw new Error('批次ID不能为空')
        }
        
        try {
            // 优先从运行时配置获取，如果未加载则从环境变量获取
            const runtimeConfig = getRuntimeConfig()
            const baseURL = runtimeConfig.apiBaseUrl || getEnv('VITE_APP_API_BASE_URL', '/api')
            const url = `${baseURL}/data/governance/task/logs/standard-mapping/export`
            
            // 获取认证token
            const token = localStorage.getItem('access_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            }
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            // 使用fetch发起POST请求下载文件
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ batchId: Number(batchId) }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`)
            }

            // 从响应头中获取文件名（接口直接返回文件，使用接口返回的文件名）
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'download' // 默认文件名，如果接口没有返回则使用此默认值
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '')
                    // 处理 filename*=UTF-8''xxx 格式
                    if (filename.includes('UTF-8')) {
                        const utf8Match = filename.match(/UTF-8''(.+)/)
                        if (utf8Match && utf8Match[1]) {
                            filename = decodeURIComponent(utf8Match[1])
                        }
                    }
                }
            }

            // 创建blob并下载
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            
            logger.info('标准对照结果导出成功', { batchId, filename })
        } catch (error) {
            logger.error(
                '导出标准对照结果失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出标准对照结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }
}

/**
 * 工作流服务实例
 * 提供便捷的API调用方法
 */
export const workflowService = {
    getWorkflowConfig: WorkflowService.getWorkflowConfig,
    updateWorkflowConfig: WorkflowService.updateWorkflowConfig,
    getWorkflowDetail: WorkflowService.getWorkflowDetail,
    getLogDetail: WorkflowService.getLogDetail,
    getExecutionLogPage: WorkflowService.getExecutionLogPage,
    getCleaningResult: WorkflowService.getCleaningResult,
    getDeduplicateResult: WorkflowService.getDeduplicateResult,
    getOrphanResult: WorkflowService.getOrphanResult,
    getSensitiveResult: WorkflowService.getSensitiveResult,
    getEmpiResult: WorkflowService.getEmpiResult,
    getEmoiResult: WorkflowService.getEmoiResult,
    getStandardMappingResult: WorkflowService.getStandardMappingResult,
    syncTaskData: WorkflowService.syncTaskData,
    exportCleaningResult: WorkflowService.exportCleaningResult,
    exportDeduplicateResult: WorkflowService.exportDeduplicateResult,
    exportOrphanResult: WorkflowService.exportOrphanResult,
    exportSensitiveResult: WorkflowService.exportSensitiveResult,
    exportEmoiResult: WorkflowService.exportEmoiResult,
    exportStandardMappingResult: WorkflowService.exportStandardMappingResult,
}

export default workflowService

