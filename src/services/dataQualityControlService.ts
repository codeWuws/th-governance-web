/**
 * 数据质控服务
 * 提供数据质控任务相关的API接口
 */

import type {
    QCTaskConfigListResponse,
    QCTaskLogDetailResponse,
    QCTaskHistoryPageResponse,
    QCTaskHistoryPageParams,
    AccuracyQCResultPageResponse,
    AccuracyQCResultPageParams,
    CompletenessQCResultPageResponse,
    CompletenessQCResultPageParams,
    ConsistencyQCResultPageResponse,
    ConsistencyQCResultPageParams,
    TableInfoListResponse,
    ReliabilityQCSaveParams,
    ReliabilityQCSaveResponse,
    CompletenessQCCheckParams,
    CompletenessQCCheckResponse,
} from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 数据质控服务类
 * 封装所有数据质控相关的API调用
 */
export class DataQualityControlService {
    /**
     * 获取质控任务配置列表
     * @description 获取质控流程管理中的质控类型配置列表
     * @returns Promise<QCTaskConfigListResponse>
     */
    static async getQCTaskConfigList(): Promise<QCTaskConfigListResponse> {
        try {
            logger.debug('发送获取质控任务配置列表请求到: /data/qc/task/config/list')
            const response = await api.get<QCTaskConfigListResponse>('/data/qc/task/config/list')
            logger.debug('获取质控任务配置列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取质控任务配置列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取质控任务配置列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取质控任务日志详情
     * @description 根据任务ID获取质控任务的执行日志详情
     * @param taskId 任务ID（批次ID）
     * @returns Promise<QCTaskLogDetailResponse>
     */
    static async getQCTaskLogDetail(taskId: string): Promise<QCTaskLogDetailResponse> {
        try {
            if (!taskId) {
                throw new Error('任务ID不能为空')
            }
            logger.debug(`发送获取质控任务日志详情请求到: /data/qc/task/log/${taskId}`)
            const response = await api.get<QCTaskLogDetailResponse>(`/data/qc/task/log/${taskId}`)
            logger.debug('获取质控任务日志详情API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取质控任务日志详情API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取质控任务日志详情失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取质控任务执行历史列表（分页）
     * @description 获取质控任务的执行历史记录，支持分页和筛选
     * @param params 查询参数
     * @returns Promise<QCTaskHistoryPageResponse>
     */
    static async getQCTaskHistoryPage(
        params: QCTaskHistoryPageParams
    ): Promise<QCTaskHistoryPageResponse> {
        try {
            logger.debug('发送获取质控任务执行历史列表请求到: /data/qc/task/page', params)
            const response = await api.post<QCTaskHistoryPageResponse>('/data/qc/task/page', params)
            logger.debug('获取质控任务执行历史列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取质控任务执行历史列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取质控任务执行历史列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取准确性质控执行结果（分页）
     * @description 获取准确性质控的执行结果记录，支持分页
     * @param params 查询参数
     * @returns Promise<AccuracyQCResultPageResponse>
     */
    static async getAccuracyQCResultPage(
        params: AccuracyQCResultPageParams
    ): Promise<AccuracyQCResultPageResponse> {
        try {
            logger.debug('发送获取准确性质控执行结果请求到: /data/governance/task/logs/qc/accuracy/page', params)
            const response = await api.post<AccuracyQCResultPageResponse>(
                '/data/governance/task/logs/qc/accuracy/page',
                params
            )
            logger.debug('获取准确性质控执行结果API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取准确性质控执行结果API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取准确性质控执行结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取完整性质控执行结果（分页）
     * @description 获取完整性质控的执行结果记录，支持分页
     * @param params 查询参数
     * @returns Promise<CompletenessQCResultPageResponse>
     */
    static async getCompletenessQCResultPage(
        params: CompletenessQCResultPageParams
    ): Promise<CompletenessQCResultPageResponse> {
        try {
            logger.debug('发送获取完整性质控执行结果请求到: /data/governance/task/logs/qc/rate/page', params)
            const response = await api.post<CompletenessQCResultPageResponse>(
                '/data/governance/task/logs/qc/rate/page',
                params
            )
            logger.debug('获取完整性质控执行结果API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取完整性质控执行结果API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取完整性质控执行结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取表信息列表
     * @description 获取所有可用的数据表信息，用于可靠性质控的表选择
     * @returns Promise<TableInfoListResponse>
     */
    static async getTableInfo(): Promise<TableInfoListResponse> {
        try {
            logger.debug('发送获取表信息列表请求到: /data/qc/getTableInfo')
            const response = await api.get<TableInfoListResponse>('/data/qc/getTableInfo')
            logger.debug('获取表信息列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取表信息列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取表信息列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 保存可靠性质控结果
     * @description 保存可靠性质控的质控结果
     * @param params 保存参数
     * @returns Promise<ReliabilityQCSaveResponse>
     */
    static async saveReliabilityQC(params: ReliabilityQCSaveParams): Promise<ReliabilityQCSaveResponse> {
        try {
            logger.debug('发送保存可靠性质控结果请求到: /data/qc/reliabilityQc', params)
            const response = await api.post<ReliabilityQCSaveResponse>('/data/qc/reliabilityQc', params)
            logger.debug('保存可靠性质控结果API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '保存可靠性质控结果API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `保存可靠性质控结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 执行完整性质控检查
     * @description 执行完整性质控的完整检查
     * @param params 检查参数
     * @returns Promise<CompletenessQCCheckResponse>
     */
    static async checkCompletenessQC(params: CompletenessQCCheckParams): Promise<CompletenessQCCheckResponse> {
        try {
            logger.debug('发送完整性质控检查请求到: /data/qc/completenessQc', params)
            const response = await api.post<CompletenessQCCheckResponse>('/data/qc/completenessQc', params)
            logger.debug('完整性质控检查API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '完整性质控检查API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `完整性质控检查失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取一致性质控执行结果（分页）
     * @description 获取一致性质控的执行结果记录，支持分页
     * @param params 查询参数
     * @returns Promise<ConsistencyQCResultPageResponse>
     */
    static async getConsistencyQCResultPage(
        params: ConsistencyQCResultPageParams
    ): Promise<ConsistencyQCResultPageResponse> {
        try {
            logger.debug('发送获取一致性质控执行结果请求到: /data/governance/task/logs/qc/relation/page', params)
            const response = await api.post<ConsistencyQCResultPageResponse>(
                '/data/governance/task/logs/qc/relation/page',
                params
            )
            logger.debug('获取一致性质控执行结果API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取一致性质控执行结果API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取一致性质控执行结果失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }
}

/**
 * 数据质控服务实例
 * 提供便捷的API调用方法
 */
export const dataQualityControlService = {
    getQCTaskConfigList: DataQualityControlService.getQCTaskConfigList,
    getQCTaskLogDetail: DataQualityControlService.getQCTaskLogDetail,
    getQCTaskHistoryPage: DataQualityControlService.getQCTaskHistoryPage,
    getAccuracyQCResultPage: DataQualityControlService.getAccuracyQCResultPage,
    getCompletenessQCResultPage: DataQualityControlService.getCompletenessQCResultPage,
    getConsistencyQCResultPage: DataQualityControlService.getConsistencyQCResultPage,
    getTableInfo: DataQualityControlService.getTableInfo,
    saveReliabilityQC: DataQualityControlService.saveReliabilityQC,
    checkCompletenessQC: DataQualityControlService.checkCompletenessQC,
}

export default dataQualityControlService

