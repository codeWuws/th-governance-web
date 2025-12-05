/**
 * 工作流服务
 * 提供工作流配置和执行相关的API接口
 */

import type {
    ApiResponse,
    ExecutionLogPageParams,
    ExecutionLogPageResponse,
    WorkflowConfigResponse,
    WorkflowConfigUpdateItem,
    WorkflowConfigUpdateResponse,
    WorkflowDetailResponse,
    WorkflowLogDetailResponse,
} from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 工作流服务类
 * 封装所有工作流相关的API调用
 */
export class WorkflowService {
    /**
     * 获取工作流配置列表
     * @description 获取所有工作流步骤的配置信息
     * @returns Promise<WorkflowConfigResponse>
     */
    static async getWorkflowConfig(): Promise<WorkflowConfigResponse> {
        try {
            return await api.get<WorkflowConfigResponse>('/data/governance/task/config/list')
        } catch (error) {
            throw new Error(
                `获取工作流配置失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
            return await api.post<WorkflowConfigUpdateResponse>(
                '/data/governance/task/config/update',
                configs
            )
        } catch (error) {
            throw new Error(
                `更新工作流配置失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
            if (!logId) {
                throw new Error('日志ID不能为空')
            }
            return await api.get<WorkflowLogDetailResponse>(`/data/governance/task/log/${logId}`)
        } catch (error) {
            throw new Error(
                `获取日志详情失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取执行历史日志分页列表
     * @param params 分页参数 { pageNo, pageSize }
     * @returns 执行历史日志分页数据
     */
    static async getExecutionLogPage(
        params: ExecutionLogPageParams
    ): Promise<ExecutionLogPageResponse> {
        try {
            return await api.get<ExecutionLogPageResponse>('/data/governance/task/log/page', {
                params,
            })
        } catch (error) {
            throw new Error(
                `获取日志列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
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
        } catch (error) {
            throw new Error(
                `获取数据清洗结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
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
        } catch (error) {
            throw new Error(
                `获取去重步骤结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
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
        } catch (error) {
            throw new Error(
                `获取丢孤儿步骤结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
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
        try {
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
        } catch (error) {
            throw new Error(
                `获取数据脱敏步骤结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 数据录入（数据同步）
     * @description 根据任务ID进行数据录入同步
     * @param taskId 任务ID
     * @returns Promise<ApiResponse<null>>
     */
    static async syncTaskData(taskId: string): Promise<ApiResponse<null>> {
        try {
            if (!taskId) {
                throw new Error('任务ID不能为空')
            }
            return await api.post<ApiResponse<null>>(`/data/governance/task/data/sync/${taskId}`)
        } catch (error) {
            throw new Error(
                `数据录入失败: ${error instanceof Error ? error.message : '未知错误'}`
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
    syncTaskData: WorkflowService.syncTaskData,
}

export default workflowService

