/**
 * 数据库连接服务
 * 提供数据库连接配置管理相关的API接口
 */

import type { ApiResponse, DbConnectionPageParams, DbConnectionPageResponse } from '@/types'
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
     * @param id 数据库连接ID
     * @param updateUser 更新用户
     * @returns Promise<ApiResponse<boolean>>
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
     * @param id 数据库连接ID
     * @param connection 数据库连接信息
     * @returns Promise<ApiResponse<boolean>>
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
     * @returns Promise<ApiResponse<{ status: 'success' | 'failed'; message: string }>>
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

