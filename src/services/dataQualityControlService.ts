/**
 * 数据质控服务
 * 提供数据质控任务相关的API接口
 */

import type {
    QCTaskConfigListResponse,
    QCTaskLogDetailResponse,
    QCTaskPageParams,
    QCTaskPageResponse,
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
            // 直接抛出原始错误，保留错误堆栈信息
            throw error
        }
    }

    /**
     * 获取质控任务日志详情
     * @description 根据任务ID获取质控任务的执行日志详情
     * @param taskId 任务ID（批次ID）
     * @returns Promise<QCTaskLogDetailResponse>
     */
    static async getQCTaskLogDetail(taskId: string): Promise<QCTaskLogDetailResponse> {
        if (!taskId) {
            throw new Error('任务ID不能为空')
        }
        try {
            logger.debug(`发送获取质控任务日志详情请求到: /data/qc/task/log/${taskId}`)
            const response = await api.get<QCTaskLogDetailResponse>(`/data/qc/task/log/${taskId}`)
            logger.debug('获取质控任务日志详情API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取质控任务日志详情API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            // 直接抛出原始错误，保留错误堆栈信息
            throw error
        }
    }

    /**
     * 获取质控任务分页列表
     * @description 分页查询质控任务执行历史记录
     * @param params 查询参数
     * @returns Promise<QCTaskPageResponse>
     */
    static async getQCTaskPage(params: QCTaskPageParams): Promise<QCTaskPageResponse> {
        try {
            // 打印请求参数
            console.log('=== 调用接口 /data/qc/task/page ===')
            console.log('=== 请求参数 ===', params)

            logger.debug('发送获取质控任务分页列表请求到: /data/qc/task/page', params)

            // 构建请求体，确保参数格式正确
            const requestBody: QCTaskPageParams = {
                pageNum: params.pageNum,
                pageSize: params.pageSize,
            }

            // 添加可选参数
            if (params.condition) {
                requestBody.condition = params.condition
            }
            if (params.sortField) {
                requestBody.sortField = params.sortField
            }
            if (params.sortOrder) {
                requestBody.sortOrder = params.sortOrder
            }
            if (params.idOrName) {
                requestBody.idOrName = params.idOrName
            }
            if (params.status !== undefined) {
                requestBody.status = params.status
            }
            if (params.taskTypes) {
                // 确保 taskTypes 是数组格式
                requestBody.taskTypes = Array.isArray(params.taskTypes)
                    ? params.taskTypes
                    : [params.taskTypes]
            }
            if (params.startTimeFrom) {
                requestBody.startTimeFrom = params.startTimeFrom
            }
            if (params.startTimeTo) {
                requestBody.startTimeTo = params.startTimeTo
            }

            console.log('=== 最终请求体 ===', requestBody)

            // 使用 POST 方法调用接口
            const response = await api.post<QCTaskPageResponse>('/data/qc/task/page', requestBody)

            // 打印响应数据
            console.log('=== 接口响应 ===', {
                code: response.code,
                msg: response.msg,
                data: response.data,
                timestamp: new Date().toISOString(),
            })

            if (response.data) {
                console.log('=== 分页数据详情 ===', {
                    records: response.data.records,
                    recordsCount: response.data.records?.length || 0,
                    total: response.data.total,
                    size: response.data.size,
                    current: response.data.current,
                    pages: response.data.pages,
                })

                // 打印每条记录
                if (response.data.records && response.data.records.length > 0) {
                    console.log('=== 任务记录列表 ===')
                    response.data.records.forEach((record, index) => {
                        console.log(`=== 任务记录 ${index + 1} ===`, record)
                    })
                }
            }

            logger.debug('获取质控任务分页列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取质控任务分页列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            console.error('=== 接口调用失败 ===', error)
            // 直接抛出原始错误，保留错误堆栈信息
            throw error
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
    getQCTaskPage: DataQualityControlService.getQCTaskPage,
}

export default dataQualityControlService

