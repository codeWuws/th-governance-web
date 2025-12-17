/**
 * 类别标准服务
 * 提供类别标准数据的统一访问封装（支持真实接口与其他模块复用）
 */

import { api } from '@/utils/request'
import { logger } from '@/utils/logger'

/**
 * 类别标准分页查询入参
 * 对应后端 `/data/standard/category/page` 接口
 */
export interface CategoryStandardPageParams {
    /** 关键字段模糊查询 */
    condition?: string
    /** 页码，从1开始 */
    pageNum: number
    /** 每页大小 */
    pageSize: number
    /** 排序字段 */
    sortField?: string
    /** 排序顺序：asc | desc */
    sortOrder?: 'asc' | 'desc'
    /** 类别名称 */
    categoryName?: string
    /** 类别编码 */
    categoryCode?: string
    /** 类别状态：0-禁用，1-启用 */
    categoryStatus?: number
}

/**
 * 后端返回的类别标准原始记录结构
 */
export interface CategoryStandardRecord {
    id: string
    categoryName: string
    categoryCode: string
    categoryStatus: number
    createBy: string
    createTime: string
    updateBy: string | null
    updateTime: string | null
    remark?: string | null
    delFlag: number
}

/**
 * 后端返回的分页数据结构
 */
export interface CategoryStandardPageData {
    records: CategoryStandardRecord[]
    total: string
    size: string
    current: string
    pages: string
}

/**
 * 后端返回的完整响应结构
 */
export interface CategoryStandardPageResponse {
    code: number
    msg: string
    data: CategoryStandardPageData
}

/**
 * 前端在多个模块中复用的类别标准模型
 * 对后端字段做了一层语义转换，便于页面使用
 */
export interface CategoryStandard {
    /** 主键ID */
    id: string
    /** 类别名称 */
    name: string
    /** 类别编码 */
    code: string
    /** 描述/备注 */
    description?: string
    /** 状态：active-启用，inactive-停用 */
    status: 'active' | 'inactive'
    /** 创建人 */
    creator: string
    /** 创建时间 */
    createTime: string
    /** 更新时间 */
    updateTime: string
}

/**
 * 将后端原始记录转换为前端使用的类别标准模型
 * @param record 后端返回的原始记录
 */
export const mapCategoryStandardRecordToModel = (
    record: CategoryStandardRecord
): CategoryStandard => {
    return {
        id: record.id,
        name: record.categoryName,
        code: record.categoryCode,
        description: record.remark ?? undefined,
        status: record.categoryStatus === 1 ? 'active' : 'inactive',
        creator: record.createBy,
        createTime: record.createTime,
        updateTime: record.updateTime ?? '',
    }
}

/**
 * 类别标准服务类
 * 封装所有与类别标准相关的接口调用
 */
export class CategoryStandardService {
    /**
     * 分页查询类别标准
     * @param params 查询参数
     */
    static async getCategoryStandardPage(
        params: CategoryStandardPageParams
    ): Promise<CategoryStandardPageResponse> {
        try {
            logger.debug('发送类别标准分页查询请求到: /data/standard/category/page', params)
            const response = await api.post<CategoryStandardPageResponse>(
                '/data/standard/category/page',
                params
            )
            logger.debug('类别标准分页查询API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '类别标准分页查询API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `获取类别标准列表失败: ${
                    error instanceof Error ? error.message : '未知错误'
                }`
            )
        }
    }

    /**
     * 获取所有启用的类别标准（用于下拉选择等场景）
     * 内部采用大页查询，并做统一字段映射
     */
    static async getActiveCategoryStandards(): Promise<CategoryStandard[]> {
        // 约定一次拉取足够多的数据，避免多次请求
        const params: CategoryStandardPageParams = {
            pageNum: 1,
            pageSize: 1000,
            sortField: 'create_time',
            sortOrder: 'desc',
            categoryStatus: 1,
        }

        const response = await this.getCategoryStandardPage(params)
        const { records } = response.data

        return records
            .filter(item => item.categoryStatus === 1)
            .map(mapCategoryStandardRecordToModel)
    }

    /**
     * 获取所有类别标准（不区分状态）
     * 仅在数据量较小场景下使用
     */
    static async getCategoryStandards(): Promise<CategoryStandard[]> {
        const params: CategoryStandardPageParams = {
            pageNum: 1,
            pageSize: 1000,
            sortField: 'create_time',
            sortOrder: 'desc',
        }

        const response = await this.getCategoryStandardPage(params)
        return response.data.records.map(mapCategoryStandardRecordToModel)
    }

    /**
     * 根据名称获取启用状态的类别标准
     * @param name 类别名称
     */
    static async getCategoryStandardByName(
        name: string
    ): Promise<CategoryStandard | undefined> {
        const list = await this.getActiveCategoryStandards()
        return list.find(item => item.name === name)
    }

    /**
     * 新增类别标准
     * @param params 新增请求参数
     */
    static async addCategoryStandard(
        params: AddCategoryStandardRequest
    ): Promise<CategoryStandardApiResponse> {
        try {
            logger.debug('发送新增类别标准请求到: /data/standard/category/add', params)
            const response = await api.post<CategoryStandardApiResponse>(
                '/data/standard/category/add',
                params
            )
            logger.debug('新增类别标准API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '新增类别标准API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `新增类别标准失败: ${
                    error instanceof Error ? error.message : '未知错误'
                }`
            )
        }
    }

    /**
     * 修改类别标准
     * @param params 修改请求参数
     */
    static async updateCategoryStandard(
        params: UpdateCategoryStandardRequest
    ): Promise<CategoryStandardApiResponse> {
        try {
            logger.debug('发送修改类别标准请求到: /data/standard/category/update', params)
            const response = await api.post<CategoryStandardApiResponse>(
                '/data/standard/category/update',
                params
            )
            logger.debug('修改类别标准API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '修改类别标准API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `修改类别标准失败: ${
                    error instanceof Error ? error.message : '未知错误'
                }`
            )
        }
    }

    /**
     * 删除类别标准
     * @param id 类别标准ID
     */
    static async deleteCategoryStandard(id: string): Promise<CategoryStandardApiResponse> {
        try {
            logger.debug('发送删除类别标准请求到: /data/standard/category/' + id)
            const response = await api.delete<CategoryStandardApiResponse>(
                `/data/standard/category/${id}`
            )
            logger.debug('删除类别标准API响应:', response)
            return response
        } catch (error) {
            logger.error(
                '删除类别标准API调用失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            throw new Error(
                `删除类别标准失败: ${
                    error instanceof Error ? error.message : '未知错误'
                }`
            )
        }
    }
}

/**
 * 新增类别标准请求参数
 */
export interface AddCategoryStandardRequest {
    /** 类别名称 */
    categoryName: string
    /** 类别编码 */
    categoryCode: string
    /** 类别状态：0-禁用，1-启用 */
    categoryStatus: number
    /** 备注 */
    remark?: string
}

/**
 * 修改类别标准请求参数
 */
export interface UpdateCategoryStandardRequest {
    /** 主键ID（修改时必填） */
    id: string
    /** 类别名称 */
    categoryName: string
    /** 类别编码 */
    categoryCode: string
    /** 类别状态：0-禁用，1-启用 */
    categoryStatus: number
    /** 备注 */
    remark?: string
}

/**
 * 通用API响应结构
 */
export interface CategoryStandardApiResponse {
    code: number
    msg: string
    data?: unknown
}

/**
 * 为兼容现有调用导出实例方法
 * 后续新增模块请优先使用 CategoryStandardService 静态方法
 */
export const getCategoryStandards = (): Promise<CategoryStandard[]> => {
    return CategoryStandardService.getCategoryStandards()
}

export const getActiveCategoryStandards =
    (): Promise<CategoryStandard[]> => {
        return CategoryStandardService.getActiveCategoryStandards()
    }

export const getCategoryStandardByName = (
    name: string
): Promise<CategoryStandard | undefined> => {
    return CategoryStandardService.getCategoryStandardByName(name)
}

