/**
 * 数据管理服务
 * 提供数据管理相关的API接口（患者索引等）
 */

import type {
    ApiResponse,
    PatientEmpiListParams,
    PatientEmpiListResponse,
    PatientEmpiRecord,
    StandardDictionaryMappingPageParams,
    StandardDictionaryMappingPageResponse,
    StandardDictionaryMappingDetailResponse,
    StandardDictionaryMappingSaveParams,
    StandardDictionaryMappingSaveResponse,
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
     * 获取标准字典对照分页列表
     * @description 分页查询标准字典对照数据
     * @param params 查询参数
     * @returns Promise<StandardDictionaryMappingPageResponse>
     */
    static async getStandardDictionaryMappingPage(
        params: StandardDictionaryMappingPageParams
    ): Promise<StandardDictionaryMappingPageResponse> {
        try {
            logger.debug('发送获取标准字典对照列表请求到: /data/standard/page', params)
            const response = await api.get<StandardDictionaryMappingPageResponse>(
                '/data/standard/page',
                {
                    params,
                }
            )
            logger.debug('获取标准字典对照列表API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取标准字典对照列表API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取标准字典对照列表失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 获取标准字典对照详情
     * @description 根据ID获取标准字典对照详情
     * @param id 记录ID
     * @returns Promise<StandardDictionaryMappingDetailResponse>
     */
    static async getStandardDictionaryMappingDetail(
        id: string
    ): Promise<StandardDictionaryMappingDetailResponse> {
        try {
            logger.debug('发送获取标准字典对照详情请求到: /data/standard/detail/' + id, { id })
            const response = await api.get<StandardDictionaryMappingDetailResponse>(
                `/data/standard/detail/${id}`
            )
            logger.debug('获取标准字典对照详情API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '获取标准字典对照详情API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取标准字典对照详情失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 保存标准字典对照
     * @description 新增或更新标准字典对照数据
     * @param params 保存参数
     * @returns Promise<StandardDictionaryMappingSaveResponse>
     */
    static async saveStandardDictionaryMapping(
        params: StandardDictionaryMappingSaveParams
    ): Promise<StandardDictionaryMappingSaveResponse> {
        try {
            logger.debug('发送保存标准字典对照请求到: /data/standard/save', params)
            const response = await api.post<StandardDictionaryMappingSaveResponse>(
                '/data/standard/save',
                params
            )
            logger.debug('保存标准字典对照API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '保存标准字典对照API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `保存标准字典对照失败: ${error instanceof Error ? error.message : '未知错误'}`
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
    getStandardDictionaryMappingPage: DataManagementService.getStandardDictionaryMappingPage,
    getStandardDictionaryMappingDetail: DataManagementService.getStandardDictionaryMappingDetail,
    saveStandardDictionaryMapping: DataManagementService.saveStandardDictionaryMapping,
}

export default dataManagementService

