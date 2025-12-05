/**
 * 仪表盘服务
 * 提供仪表盘统计和执行历史相关的API接口
 */

import type { ApiResponse, DashboardStatisticsResponse, ExecutionLogPageParams, ExecutionLogPageResponse } from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 仪表盘服务类
 * 封装所有仪表盘相关的API调用
 */
export class DashboardService {
    /**
     * 获取仪表盘统计数据
     * @description 获取数据治理仪表盘的统计信息，包括工作流数量、执行状态、成功率、步骤配置等
     * @returns Promise<DashboardStatisticsResponse>
     */
    static async getDashboardStatistics(): Promise<DashboardStatisticsResponse> {
        try {
            return await api.get<DashboardStatisticsResponse>('/data/governance/dashboard/statistics')
        } catch (error) {
            throw new Error(
                `获取仪表盘统计数据失败: ${error instanceof Error ? error.message : '未知错误'}`
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
}

/**
 * 仪表盘服务实例
 * 提供便捷的API调用方法
 */
export const dashboardService = {
    getDashboardStatistics: DashboardService.getDashboardStatistics,
    getExecutionLogPage: DashboardService.getExecutionLogPage,
}

export default dashboardService

