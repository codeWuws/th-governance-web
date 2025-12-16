/**
 * 通用基础类型定义
 */

/**
 * 基础实体接口
 */
export interface BaseEntity {
    id: string
    createdAt: string
    updatedAt: string
    createdBy?: string
    updatedBy?: string
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
    records: T[]
    total: number
    page: number
    pageSize: number
}

/**
 * API响应
 */
export interface ApiResponse<T = any> {
    code: number
    msg: string
    data: T
    success: boolean
}

/**
 * 分页查询参数
 */
export interface PageQuery {
    page: number
    pageSize: number
}

/**
 * 树节点接口
 */
export interface TreeNode {
    id: string
    name: string
    parentId?: string
    children?: TreeNode[]
    sortOrder?: number
}

/**
 * 状态枚举
 */
export enum Status {
    ENABLE = 'enable',
    DISABLE = 'disable',
}
