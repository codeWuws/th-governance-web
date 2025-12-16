/**
 * 数据管理服务
 * 提供数据管理相关的API接口（患者索引等）
 */

import type {
    ApiResponse,
    PatientEmpiListParams,
    PatientEmpiListResponse,
    PatientEmpiRecord,
    AssetTreeParams,
    AssetTreeResponse,
    AssetTableListResponse,
    AddAssetRequest,
    AddAssetResponse,
    UpdateAssetRequest,
    DatabaseOptionsResponse,
    ColumnDetailsParams,
    ColumnDetailsResponse,
    TableInfoResponse,
} from '@/types'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 数据管理服务类
 * 封装所有数据管理相关的API调用
 */
export class DataManagementService {
    /**
     * 获取患者索引列表
     * @description 分页查询患者索引数据
     * @param params 查询参数
     * @returns Promise<PatientEmpiListResponse>
     */
    static async getPatientEmpiList(
        params: PatientEmpiListParams
    ): Promise<PatientEmpiListResponse> {
        try {
            logger.debug('发送获取患者索引列表请求到: /data/primary-index/patient/empi/list', params)
            const response = await api.post<PatientEmpiListResponse>(
                '/data/primary-index/patient/empi/list',
                params
            )
            logger.debug('获取患者索引列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取患者索引列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取患者索引列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 合并患者索引
     * @description 将多个患者记录合并为一个主索引
     * @param patients 要合并的患者信息数组
     * @returns Promise<ApiResponse<null>>
     */
    static async mergePatientEmpi(
        patients: Array<{
            patientName: string
            sexCode: string
            birthDate: string
            idNumber: string
            phone: string
            hospitalNo: string
            registrationNumber: string
            consulationType: string
            address: string
            deptName: string
            selected?: boolean
        }>
    ): Promise<ApiResponse<null>> {
        try {
            if (!patients || patients.length === 0) {
                throw new Error('患者信息不能为空')
            }
            logger.debug('发送合并患者索引请求到: /data/primary-index/patient/empi/merge', {
                patientCount: patients.length,
            })
            const response = await api.post<ApiResponse<null>>(
                '/data/primary-index/patient/empi/merge',
                patients
            )
            logger.debug('合并患者索引API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '合并患者索引API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `合并患者索引失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取合并历史记录列表
     * @description 分页查询患者索引合并历史记录
     * @param params 查询参数
     * @returns Promise<ApiResponse<PatientEmpiDistributionRecordResponse>>
     */
    static async getPatientEmpiDistributionRecordList(
        params: {
            condition?: string
            pageNum: number
            pageSize: number
            sortField?: string
            sortOrder?: 'asc' | 'desc'
            name?: string
            sexCode?: string
            idNumber?: string
            hospitalNo?: string
        }
    ): Promise<ApiResponse<{
        records: PatientEmpiRecord[]
        total: string
        size: string
        current: string
        pages: string
    }>> {
        try {
            logger.debug('发送获取合并历史记录请求到: /data/primary-index/patient/empi/distribution/record/list', params)
            const response = await api.post<ApiResponse<{
                records: PatientEmpiRecord[]
                total: string
                size: string
                current: string
                pages: string
            }>>(
                '/data/primary-index/patient/empi/distribution/record/list',
                params
            )
            logger.debug('获取合并历史记录API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取合并历史记录API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取合并历史记录失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 查询资产树
     * @description 获取数据资产树结构，支持按名称模糊查询
     * @param params 查询参数
     * @returns Promise<AssetTreeResponse>
     */
    static async getAssetTree(params?: AssetTreeParams): Promise<AssetTreeResponse> {
        try {
            logger.debug('发送查询资产树请求到: /data/asset/tree', params)
            const response = await api.get<AssetTreeResponse>('/data/asset/tree', {
                params,
            })
            logger.debug('查询资产树API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '查询资产树API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `查询资产树失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取资产类别下的表列表
     * @description 根据资产类别ID获取该类别下的所有表信息
     * @param categoryId 资产类别ID
     * @returns Promise<AssetTableListResponse>
     */
    static async getAssetTableList(categoryId: string): Promise<AssetTableListResponse> {
        try {
            logger.debug('发送获取表列表请求到: /data/asset/table/list', { id: categoryId })
            const response = await api.get<AssetTableListResponse>('/data/asset/table/list', {
                params: { id: categoryId },
            })
            logger.debug('获取表列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取表列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取表列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 新增资产
     * @description 添加新的资产节点（库节点或类别节点）
     * @param params 新增资产请求参数
     * @returns Promise<AddAssetResponse>
     */
    static async addAsset(params: AddAssetRequest): Promise<AddAssetResponse> {
        try {
            logger.debug('发送新增资产请求到: /data/asset/add/asset', params)
            const response = await api.post<AddAssetResponse>('/data/asset/add/asset', params)
            logger.debug('新增资产API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增资产API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增资产失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 新增资产类别
     * @description 添加新的资产类别节点
     * @param params 新增资产类别请求参数
     * @returns Promise<AddAssetResponse>
     */
    static async addAssetCategory(params: AddAssetRequest): Promise<AddAssetResponse> {
        try {
            logger.debug('发送新增资产类别请求到: /data/asset/add/category', params)
            const response = await api.post<AddAssetResponse>('/data/asset/add/category', params)
            logger.debug('新增资产类别API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增资产类别API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增资产类别失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取数据库选项列表
     * @description 获取可用的数据库选项列表
     * @returns Promise<DatabaseOptionsResponse>
     */
    static async getDatabaseOptions(): Promise<DatabaseOptionsResponse> {
        try {
            logger.debug('发送获取数据库选项请求到: /data/asset/options')
            const response = await api.get<DatabaseOptionsResponse>('/data/asset/options')
            logger.debug('获取数据库选项API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取数据库选项API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取数据库选项失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 删除资产或类别
     * @description 根据ID删除资产节点或资产类别节点
     * @param id 资产或类别的ID
     * @returns Promise<AddAssetResponse>
     */
    static async deleteAsset(id: string): Promise<AddAssetResponse> {
        try {
            logger.debug('发送删除资产请求到: /data/asset/delete/' + id)
            const response = await api.delete<AddAssetResponse>(`/data/asset/delete/${id}`)
            logger.debug('删除资产API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '删除资产API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `删除资产失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 更新资产或类别
     * @description 根据ID更新资产节点或资产类别节点
     * @param params 更新资产请求参数
     * @returns Promise<AddAssetResponse>
     */
    static async updateAsset(params: UpdateAssetRequest): Promise<AddAssetResponse> {
        try {
            logger.debug('发送更新资产请求到: /data/asset/update', params)
            const response = await api.post<AddAssetResponse>('/data/asset/update', params)
            logger.debug('更新资产API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '更新资产API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `更新资产失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取表字段详情
     * @description 根据类别ID和表名获取表的字段详情信息
     * @param params 查询参数
     * @returns Promise<ColumnDetailsResponse>
     */
    static async getColumnDetails(params: ColumnDetailsParams): Promise<ColumnDetailsResponse> {
        try {
            logger.debug('发送获取字段详情请求到: /data/asset/columns/details', params)
            const response = await api.get<ColumnDetailsResponse>('/data/asset/columns/details', {
                params,
            })
            logger.debug('获取字段详情API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取字段详情API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取字段详情失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取表信息列表
     * @description 获取可用的表信息列表，用于新增资产类别时选择表
     * @returns Promise<TableInfoResponse>
     */
    static async getTableInfo(): Promise<TableInfoResponse> {
        try {
            logger.debug('发送获取表信息请求到: /data/asset/getTableInfo')
            const response = await api.get<TableInfoResponse>('/data/asset/getTableInfo')
            logger.debug('获取表信息API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取表信息API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取表信息失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }
}

/**
 * 数据管理服务实例
 * 提供便捷的API调用方法
 */
export const dataManagementService = {
    getPatientEmpiList: DataManagementService.getPatientEmpiList,
    mergePatientEmpi: DataManagementService.mergePatientEmpi,
    getPatientEmpiDistributionRecordList: DataManagementService.getPatientEmpiDistributionRecordList,
    getAssetTree: DataManagementService.getAssetTree,
    getAssetTableList: DataManagementService.getAssetTableList,
    addAsset: DataManagementService.addAsset,
    addAssetCategory: DataManagementService.addAssetCategory,
    getDatabaseOptions: DataManagementService.getDatabaseOptions,
    deleteAsset: DataManagementService.deleteAsset,
    updateAsset: DataManagementService.updateAsset,
    getColumnDetails: DataManagementService.getColumnDetails,
    getTableInfo: DataManagementService.getTableInfo,
}

export default dataManagementService

