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
    BusinessDatasetPageParams,
    BusinessDatasetPageResponse,
    DataSourceOptionsResponse,
    BusinessDatasetDeleteResponse,
    AddBusinessDatasetRequest,
    UpdateBusinessDatasetRequest,
    BusinessDatasetSaveResponse,
    AutomaticMappingRequest,
    AutomaticMappingResponse,
    CategoryListResponse,
    AddMedicalDictRequest,
    UpdateMedicalDictRequest,
    MedicalDictSaveResponse,
    MedicalDictDeleteResponse,
    MedicalDictPageParams,
    MedicalDictPageResponse,
    StatusDictPageParams,
    StatusDictPageResponse,
    AddStatusDictRequest,
    UpdateStatusDictRequest,
    StatusDictSaveResponse,
    StatusDictDeleteResponse,
} from '@/types'
import { api, request } from '@/utils/request'
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

    /**
     * 业务数据集分页查询
     * @description 根据条件分页查询业务数据集列表
     * @param params 查询参数
     * @returns Promise<BusinessDatasetPageResponse>
     */
    static async getBusinessDatasetPage(
        params: BusinessDatasetPageParams
    ): Promise<BusinessDatasetPageResponse> {
        try {
            logger.debug('发送业务数据集分页查询请求到: /data/standard/business-dataset/page', params)
            const response = await api.post<BusinessDatasetPageResponse>(
                '/data/standard/business-dataset/page',
                params
            )
            logger.debug('业务数据集分页查询API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '业务数据集分页查询API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取业务数据集列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取业务数据集数据源选项列表
     * @description 获取业务数据集新增和编辑时使用的数据源下拉选项
     * @returns Promise<DataSourceOptionsResponse>
     */
    static async getBusinessDatasetDataSourceOptions(): Promise<DataSourceOptionsResponse> {
        try {
            logger.debug('发送获取业务数据集数据源选项请求到: /data/standard/business-dataset/dataSourceOptions')
            const response = await api.get<DataSourceOptionsResponse>(
                '/data/standard/business-dataset/dataSourceOptions'
            )
            logger.debug('获取业务数据集数据源选项API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取业务数据集数据源选项API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取数据源选项失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 删除业务数据集
     * @description 根据ID删除业务数据集
     * @param id 业务数据集ID
     * @returns Promise<BusinessDatasetDeleteResponse>
     */
    static async deleteBusinessDataset(id: string): Promise<BusinessDatasetDeleteResponse> {
        try {
            logger.debug('发送删除业务数据集请求到: /data/standard/business-dataset/' + id)
            const response = await api.delete<BusinessDatasetDeleteResponse>(
                `/data/standard/business-dataset/${id}`
            )
            logger.debug('删除业务数据集API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '删除业务数据集API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `删除业务数据集失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 新增业务数据集
     * @description 创建新的业务数据集
     * @param params 新增业务数据集请求参数
     * @returns Promise<BusinessDatasetSaveResponse>
     */
    static async addBusinessDataset(
        params: AddBusinessDatasetRequest
    ): Promise<BusinessDatasetSaveResponse> {
        try {
            logger.debug('发送新增业务数据集请求到: /data/standard/business-dataset/add', params)
            const response = await api.post<BusinessDatasetSaveResponse>(
                '/data/standard/business-dataset/add',
                params
            )
            logger.debug('新增业务数据集API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增业务数据集API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增业务数据集失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 更新业务数据集
     * @description 根据ID更新业务数据集信息
     * @param params 更新业务数据集请求参数
     * @returns Promise<BusinessDatasetSaveResponse>
     */
    static async updateBusinessDataset(
        params: UpdateBusinessDatasetRequest
    ): Promise<BusinessDatasetSaveResponse> {
        try {
            logger.debug('发送更新业务数据集请求到: /data/standard/business-dataset/update', params)
            const response = await api.post<BusinessDatasetSaveResponse>(
                '/data/standard/business-dataset/update',
                params
            )
            logger.debug('更新业务数据集API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '更新业务数据集API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `更新业务数据集失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 自动映射业务数据集
     * @description 对业务数据集执行自动映射操作
     * @param params 自动映射请求参数（可选，如果不传id则对所有数据集进行映射）
     * @returns Promise<AutomaticMappingResponse>
     */
    static async automaticMapping(
        params?: AutomaticMappingRequest
    ): Promise<AutomaticMappingResponse> {
        try {
            logger.debug('发送自动映射请求到: /data/standard/business-dataset/automaticMapping', params)
            const response = await api.post<AutomaticMappingResponse>(
                '/data/standard/business-dataset/automaticMapping',
                params || {}
            )
            logger.debug('自动映射API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '自动映射API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `自动映射失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取分类列表
     * @description 获取业务数据集分类列表
     * @returns Promise<CategoryListResponse>
     */
    static async getCategoryList(): Promise<CategoryListResponse> {
        try {
            logger.debug('发送获取分类列表请求到: /data/standard/category/list')
            const response = await api.get<CategoryListResponse>('/data/standard/category/list')
            logger.debug('获取分类列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取分类列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取分类列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 新增医疗字典
     * @description 创建新的医疗字典
     * @param params 新增医疗字典请求参数
     * @returns Promise<MedicalDictSaveResponse>
     */
    static async addMedicalDict(params: AddMedicalDictRequest): Promise<MedicalDictSaveResponse> {
        try {
            logger.debug('发送新增医疗字典请求到: /data/standard/medical-dict/add', params)
            const response = await api.post<MedicalDictSaveResponse>(
                '/data/standard/medical-dict/add',
                params
            )
            logger.debug('新增医疗字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增医疗字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增医疗字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 更新医疗字典
     * @description 根据ID更新医疗字典信息
     * @param params 更新医疗字典请求参数
     * @returns Promise<MedicalDictSaveResponse>
     */
    static async updateMedicalDict(
        params: UpdateMedicalDictRequest
    ): Promise<MedicalDictSaveResponse> {
        try {
            logger.debug('发送更新医疗字典请求到: /data/standard/medical-dict/update', params)
            const response = await api.post<MedicalDictSaveResponse>(
                '/data/standard/medical-dict/update',
                params
            )
            logger.debug('更新医疗字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '更新医疗字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `更新医疗字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 删除医疗字典
     * @description 根据ID删除医疗字典
     * @param id 医疗字典ID
     * @returns Promise<MedicalDictDeleteResponse>
     */
    static async deleteMedicalDict(id: string): Promise<MedicalDictDeleteResponse> {
        try {
            logger.debug('发送删除医疗字典请求到: /data/standard/medical-dict/' + id)
            const response = await api.delete<MedicalDictDeleteResponse>(
                `/data/standard/medical-dict/${id}`
            )
            logger.debug('删除医疗字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '删除医疗字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `删除医疗字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 医疗字典分页查询
     * @description 根据条件分页查询医疗字典列表
     * @param params 查询参数
     * @returns Promise<MedicalDictPageResponse>
     */
    static async getMedicalDictPage(params: MedicalDictPageParams): Promise<MedicalDictPageResponse> {
        try {
            logger.debug('发送医疗字典分页查询请求到: /data/standard/medical-dict/page', params)
            const response = await api.post<MedicalDictPageResponse>(
                '/data/standard/medical-dict/page',
                params
            )
            logger.debug('医疗字典分页查询API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '医疗字典分页查询API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取医疗字典列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 状态字典分页查询
     * @description 根据条件分页查询状态字典列表
     * @param params 查询参数
     * @returns Promise<StatusDictPageResponse>
     */
    static async getStatusDictPage(params: StatusDictPageParams): Promise<StatusDictPageResponse> {
        try {
            logger.debug('发送状态字典分页查询请求到: /data/standard/status-dict/page', params)
            const response = await api.post<StatusDictPageResponse>(
                '/data/standard/status-dict/page',
                params
            )
            logger.debug('状态字典分页查询API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '状态字典分页查询API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取状态字典列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 新增状态字典
     * @description 创建新的状态字典
     * @param params 新增状态字典请求参数
     * @returns Promise<StatusDictSaveResponse>
     */
    static async addStatusDict(params: AddStatusDictRequest): Promise<StatusDictSaveResponse> {
        try {
            logger.debug('发送新增状态字典请求到: /data/standard/status-dict/add', params)
            const response = await api.post<StatusDictSaveResponse>(
                '/data/standard/status-dict/add',
                params
            )
            logger.debug('新增状态字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增状态字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增状态字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 更新状态字典
     * @description 根据ID更新状态字典信息
     * @param params 更新状态字典请求参数
     * @returns Promise<StatusDictSaveResponse>
     */
    static async updateStatusDict(
        params: UpdateStatusDictRequest
    ): Promise<StatusDictSaveResponse> {
        try {
            logger.debug('发送更新状态字典请求到: /data/standard/status-dict/update', params)
            const response = await api.post<StatusDictSaveResponse>(
                '/data/standard/status-dict/update',
                params
            )
            logger.debug('更新状态字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '更新状态字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `更新状态字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 删除状态字典
     * @description 根据ID删除状态字典
     * @param id 状态字典ID
     * @returns Promise<StatusDictDeleteResponse>
     */
    static async deleteStatusDict(id: string): Promise<StatusDictDeleteResponse> {
        try {
            logger.debug('发送删除状态字典请求到: /data/standard/status-dict/' + id)
            const response = await api.delete<StatusDictDeleteResponse>(
                `/data/standard/status-dict/${id}`
            )
            logger.debug('删除状态字典API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '删除状态字典API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `删除状态字典失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 导出状态字典
     * @description 根据条件导出状态字典数据
     * @param params 查询参数（与分页查询参数相同）
     * @returns Promise<void> 下载文件
     */
    static async exportStatusDict(params: StatusDictPageParams): Promise<void> {
        try {
            logger.debug('发送状态字典导出请求到: /data/standard/status-dict/export', params)
            
            // 使用POST请求，设置responseType为blob
            // 注意：当responseType为blob时，响应拦截器会直接返回response对象
            // 所以需要使用request.post而不是api.post
            const response = await request.post<Blob>(
                '/data/standard/status-dict/export',
                params,
                {
                    responseType: 'blob',
                }
            )
            
            logger.debug('状态字典导出API响应:', response)
            
            // 从响应头获取Content-Type
            const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
            
            // 从响应头获取Content-Disposition，提取文件名
            const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'] || ''
            let fileName = ''
            
            // 解析Content-Disposition头中的文件名
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (fileNameMatch && fileNameMatch[1]) {
                    // 移除引号
                    fileName = fileNameMatch[1].replace(/['"]/g, '')
                    // 处理URL编码的文件名
                    try {
                        fileName = decodeURIComponent(fileName)
                    } catch (e) {
                        // 如果解码失败，使用原始文件名
                    }
                }
            }
            
            // 如果没有从响应头获取到文件名，根据Content-Type推断文件扩展名
            if (!fileName) {
                const dateStr = new Date().toISOString().split('T')[0]
                let extension = ''
                
                if (contentType.includes('excel') || contentType.includes('spreadsheet') || contentType.includes('xlsx')) {
                    extension = '.xlsx'
                } else if (contentType.includes('csv')) {
                    extension = '.csv'
                } else if (contentType.includes('json')) {
                    extension = '.json'
                } else if (contentType.includes('pdf')) {
                    extension = '.pdf'
                } else if (contentType.includes('zip')) {
                    extension = '.zip'
                } else {
                    // 默认使用xlsx
                    extension = '.xlsx'
                }
                
                fileName = `状态字典管理_${dateStr}${extension}`
            }
            
            // 使用响应头中的Content-Type创建Blob，如果没有则使用默认值
            const blobType = contentType || 'application/octet-stream'
            const blob = response.data instanceof Blob 
                ? response.data 
                : new Blob([response.data], {
                    type: blobType,
                })
            
            // 创建下载链接
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            
            // 触发下载
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // 释放URL对象
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            logger.error(
                '状态字典导出API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `导出状态字典失败: ${error instanceof Error ? error.message : '未知错误'}`
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
    getBusinessDatasetPage: DataManagementService.getBusinessDatasetPage,
    getBusinessDatasetDataSourceOptions: DataManagementService.getBusinessDatasetDataSourceOptions,
    deleteBusinessDataset: DataManagementService.deleteBusinessDataset,
    addBusinessDataset: DataManagementService.addBusinessDataset,
    updateBusinessDataset: DataManagementService.updateBusinessDataset,
    automaticMapping: DataManagementService.automaticMapping,
    getCategoryList: DataManagementService.getCategoryList,
    addMedicalDict: DataManagementService.addMedicalDict,
    updateMedicalDict: DataManagementService.updateMedicalDict,
    deleteMedicalDict: DataManagementService.deleteMedicalDict,
    getMedicalDictPage: DataManagementService.getMedicalDictPage,
    getStatusDictPage: DataManagementService.getStatusDictPage,
    addStatusDict: DataManagementService.addStatusDict,
    updateStatusDict: DataManagementService.updateStatusDict,
    deleteStatusDict: DataManagementService.deleteStatusDict,
    exportStatusDict: DataManagementService.exportStatusDict,
}

export default dataManagementService

