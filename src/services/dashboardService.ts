/**
 * 仪表盘服务
 * 提供仪表盘统计和执行历史相关的API接口
 */

import type { ApiResponse, DashboardStatistics, ExecutionLogPageParams, ExecutionLogPageData } from '@/types'
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
     * @returns Promise<DashboardStatistics> 响应拦截器已处理业务异常，直接返回data字段
     */
    static async getDashboardStatistics(): Promise<DashboardStatistics> {
        return await api.get<DashboardStatistics>('/data/governance/dashboard/statistics', {
            returnDataOnly: true,
        })
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

