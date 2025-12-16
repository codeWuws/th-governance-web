/**
 * 数据库连接服务
 * 提供数据库连接配置管理相关的API接口
 */

import type {
    ApiResponse,
    DbConnectionPageParams,
    DbConnectionPageData,
    DbConnectionPageResponseRaw,
} from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 数据库连接服务类
 * 封装所有数据库连接相关的API调用
 */
export class DatabaseConnectionService {
    /**
     * 新增数据库连接配置
     * @description 新增数据库连接信息
     * @param connection 数据库连接信息
     * @returns Promise<ApiResponse<{ id: string }>>
     */
    static async addDbConnection(connection: {
        connectionName: string
        dbType: string
        dbHost: string
        dbPort: string
        dbName: string
        dbUsername: string
        dbPassword: string
        dbStatus: number
        remark: string
    }): Promise<ApiResponse<{ id: string }>> {
        return await api.post<ApiResponse<{ id: string }>>(
            '/data/governance/db-connection/add',
            connection
        )
    }

    /**
     * 分页查询数据库连接配置列表
     * @description 根据条件分页查询数据库连接信息
     * @param params 查询参数
     * @returns Promise<DbConnectionPageData> 响应拦截器已处理业务异常，直接返回data字段
     */
    static async getDbConnectionPage(
        params: DbConnectionPageParams
    ): Promise<DbConnectionPageData> {
        // 将前端的 pageNo 转换为后端需要的 pageNum，构建符合后端要求的请求体
        const requestBody = {
            pageNum: params.pageNo || 1,
            pageSize: params.pageSize,
        }
        // 调用接口，使用 returnDataOnly 配置只返回 data 字段（原始数据结构）
        const rawData = await api.post<DbConnectionPageResponseRaw>(
            '/data/governance/db-connection/page',
            requestBody,
            { returnDataOnly: true }
        )

        // 转换数据格式：将后端的字符串类型转换为数字，records 转换为 list
        const records = rawData.records || []
        const total = Number.parseInt(rawData.total || '0', 10)
        const pageSize = Number.parseInt(rawData.size || String(params.pageSize), 10)
        const pageNo = Number.parseInt(rawData.current || '1', 10)
        const pages = Number.parseInt(rawData.pages || '0', 10)

        // 计算状态统计
        const connectedCount = records.filter(conn => conn.dbStatus === 1).length
        const abnormalCount = records.filter(conn => conn.dbStatus !== 1).length

        // 返回转换后的数据格式，保持向后兼容
        return {
            pageNo,
            pageSize,
            total,
            pages,
            list: records,
            statusStats: {
                totalConnections: records.length,
                connectedCount,
                abnormalCount,
            },
        }
    }

    /**
     * 删除数据库连接
     * @param id 数据库连接ID
     * @param updateUser 更新用户
     * @returns Promise<ApiResponse<boolean>>
     */
    static async deleteDbConnection(id: string, updateUser: string): Promise<ApiResponse<boolean>> {
        return await api.delete<ApiResponse<boolean>>(`/data/governance/db-connection/${id}`, {
            params: { updateUser },
        })
    }

    /**
     * 更新数据库连接
     * @param connection 数据库连接信息（包含id）
     * @returns Promise<ApiResponse<boolean>>
     */
    static async updateDbConnection(connection: {
        id: string | number
        connectionName: string
        dbType: string
        dbHost: string
        dbPort: string
        dbName: string
        dbUsername: string
        dbPassword: string
        dbStatus: number
        remark: string
    }): Promise<ApiResponse<boolean>> {
        return await api.post<ApiResponse<boolean>>(
            '/data/governance/db-connection/update',
            connection
        )
    }

    /**
     * 测试数据库连接
     * @param id 数据库连接ID
     * @returns Promise<ApiResponse<{ status: 'success' | 'failed'; message: string }>>
     */
    static async testDbConnection(
        id: string
    ): Promise<ApiResponse<{ status: 'success' | 'failed'; message: string }>> {
        return await api.post<ApiResponse<{ status: 'success' | 'failed'; message: string }>>(
            `/data/governance/db-connection/mock-test/${id}`
        )
    }
}

/**
 * 数据库连接服务实例
 * 提供便捷的API调用方法
 */
export const databaseConnectionService = {
    addDbConnection: DatabaseConnectionService.addDbConnection,
    getDbConnectionPage: DatabaseConnectionService.getDbConnectionPage,
    deleteDbConnection: DatabaseConnectionService.deleteDbConnection,
    updateDbConnection: DatabaseConnectionService.updateDbConnection,
    testDbConnection: DatabaseConnectionService.testDbConnection,
}

export default databaseConnectionService

