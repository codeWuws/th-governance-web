/**
 * 数据治理服务
 * 提供数据清洗、去重、标准对照、EMPI/EMOI定义发放等功能的API接口
 */

import type {
    ApiResponse,
    DataGovernanceResult,
    DbConnectionPageParams,
    DbConnectionPageResponse,
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
 * 数据治理服务类
 * 封装所有数据治理相关的API调用
 */
export class DataGovernanceService {
    /**
     * 0、清空数据、初始化
     * @description 清空所有数据并进行系统初始化
     * @returns Promise<null>
     */
    static async init(): Promise<null> {
        try {
            return await api.post<null>('/data/governance/init')
        } catch (error) {
            throw new Error(
                `数据初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 1、数据清洗、空格替换
     * @description 对数据进行清洗，替换多余空格
     * @returns Promise<DataGovernanceResult>
     */
    static async cleanDataFields(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/cleanDataFields')
        } catch (error) {
            throw new Error(`数据清洗失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 2、数据去重
     * @description 对数据进行去重处理
     * @returns Promise<DataGovernanceResult>
     */
    static async deduplicateData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/deduplicateData')
        } catch (error) {
            throw new Error(`数据去重失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 4、标准对照
     * @description 应用标准映射规则
     * @returns Promise<DataGovernanceResult>
     */
    static async applyStandardMapping(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/applyStandardMapping')
        } catch (error) {
            throw new Error(`标准对照失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 5、EMPI 定义发放
     * @description 分配和发放EMPI（企业主索引）定义
     * @returns Promise<DataGovernanceResult>
     */
    static async assignEmpi(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/assignEmpi')
        } catch (error) {
            throw new Error(
                `EMPI定义发放失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 6、EMOI 定义发放
     * @description 分配和发放EMOI（企业对象索引）定义
     * @returns Promise<DataGovernanceResult>
     */
    static async assignEmoi(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/assignEmoi')
        } catch (error) {
            throw new Error(
                `EMOI定义发放失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 7、数据归一
     * @description 对数据进行归一化处理
     * @returns Promise<DataGovernanceResult>
     */
    static async normalizeData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/normalizeData')
        } catch (error) {
            throw new Error(`数据归一失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 8、丢孤
     * @description 移除孤立记录
     * @returns Promise<DataGovernanceResult>
     */
    static async removeOrphanRecords(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/removeOrphanRecords')
        } catch (error) {
            throw new Error(`丢孤处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 9、数据脱敏
     * @description 对敏感数据进行脱敏处理
     * @returns Promise<DataGovernanceResult>
     */
    static async maskSensitiveData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/maskSensitiveData')
        } catch (error) {
            throw new Error(`数据脱敏失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 10、同步数据
     * @description 同步数据到目标系统
     * @returns Promise<DataGovernanceResult>
     */
    static async sync(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/sync')
        } catch (error) {
            throw new Error(`数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    // （已移除）数据录入（同步）封装方法 syncDataEntry

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
     * @description 新增数据库连接配置
     * @param connection 数据库连接信息
     * @returns Promise<DataGovernanceResult>
     */
    static async addDbConnection(connection: {
        dbType: string
        dbHost: string
        dbPort: string
        dbName: string
        dbUsername: string
        dbPassword: string
        dbStatus: number
        remark: string
        createUser: string
    }): Promise<ApiResponse<{ id: string }>> {
        try {
            return await api.post<ApiResponse<{ id: string }>>(
                '/data/governance/db-connection',
                connection
            )
        } catch (error) {
            throw new Error(
                `新增数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 分页查询数据库连接配置列表
     * @description 根据条件分页查询数据库连接信息
     * @param params 查询参数 { pageNo, pageSize, dbType?, dbStatus? }
     * @returns Promise<DbConnectionPageResponse>
     */
    static async getDbConnectionPage(
        params: DbConnectionPageParams
    ): Promise<DbConnectionPageResponse> {
        try {
            return await api.get<DbConnectionPageResponse>('/data/governance/db-connection/page', {
                params,
            })
        } catch (error) {
            throw new Error(
                `获取数据库连接列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 删除数据库连接
     */
    static async deleteDbConnection(id: string, updateUser: string): Promise<ApiResponse<boolean>> {
        try {
            return await api.delete<ApiResponse<boolean>>(`/data/governance/db-connection/${id}`, {
                params: { updateUser },
            })
        } catch (error) {
            throw new Error(
                `删除数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 更新数据库连接
     */
    static async updateDbConnection(
        id: string,
        connection: {
            dbType: string
            dbHost: string
            dbPort: string
            dbName: string
            dbUsername: string
            dbPassword: string
            dbStatus: number
            remark: string
            updateUser: string
        }
    ): Promise<ApiResponse<boolean>> {
        try {
            return await api.put<ApiResponse<boolean>>(
                `/data/governance/db-connection/${id}`,
                connection
            )
        } catch (error) {
            throw new Error(
                `更新数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 测试数据库连接
     * @param id 数据库连接ID
     * @returns Promise<any>
     */
    static async testDbConnection(
        id: string
    ): Promise<ApiResponse<{ status: 'success' | 'failed'; message: string }>> {
        try {
            return await api.post<ApiResponse<{ status: 'success' | 'failed'; message: string }>>(
                `/data/governance/db-connection/mock-test/${id}`
            )
        } catch (error) {
            throw new Error(
                `测试数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

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
 * 数据治理服务实例
 * 提供便捷的API调用方法
 */
export const dataGovernanceService = {
    // 数据处理操作
    init: DataGovernanceService.init,
    cleanDataFields: DataGovernanceService.cleanDataFields,
    deduplicateData: DataGovernanceService.deduplicateData,
    applyStandardMapping: DataGovernanceService.applyStandardMapping,
    assignEmpi: DataGovernanceService.assignEmpi,
    assignEmoi: DataGovernanceService.assignEmoi,
    normalizeData: DataGovernanceService.normalizeData,
    removeOrphanRecords: DataGovernanceService.removeOrphanRecords,
    maskSensitiveData: DataGovernanceService.maskSensitiveData,
    sync: DataGovernanceService.sync,
    // （已移除）syncDataEntry

    // 日志查询操作
    getLogPage: DataGovernanceService.getExecutionLogPage,
    getLogDetail: DataGovernanceService.getLogDetail,

    // 数据库配置操作
    addDbConnection: DataGovernanceService.addDbConnection,
    getDbConnectionPage: DataGovernanceService.getDbConnectionPage,
    deleteDbConnection: DataGovernanceService.deleteDbConnection,
    updateDbConnection: DataGovernanceService.updateDbConnection,
    testDbConnection: DataGovernanceService.testDbConnection,

    // 工作流配置相关
    getWorkflowConfig: DataGovernanceService.getWorkflowConfig,
    updateWorkflowConfig: DataGovernanceService.updateWorkflowConfig,

    // 工作流执行相关
    getWorkflowDetail: DataGovernanceService.getWorkflowDetail,
    getCleaningResult: DataGovernanceService.getCleaningResult,
    getDeduplicateResult: DataGovernanceService.getDeduplicateResult,
    getOrphanResult: DataGovernanceService.getOrphanResult,
    getSensitiveResult: DataGovernanceService.getSensitiveResult,
    syncTaskData: DataGovernanceService.syncTaskData,
}

export default dataGovernanceService
