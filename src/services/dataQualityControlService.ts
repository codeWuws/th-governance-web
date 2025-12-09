/**
 * 数据质控服务
 * 提供数据质控任务相关的API接口
 */

import type {
    QCTaskConfigListResponse,
    QCTaskLogDetailResponse,
    QCTaskHistoryPageResponse,
    QCTaskHistoryPageParams,
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
}

/**
 * 数据质控服务实例
 * 提供便捷的API调用方法
 */
export const dataQualityControlService = {
    getQCTaskConfigList: DataQualityControlService.getQCTaskConfigList,
    getQCTaskLogDetail: DataQualityControlService.getQCTaskLogDetail,
    getQCTaskHistoryPage: DataQualityControlService.getQCTaskHistoryPage,
}

export default dataQualityControlService

