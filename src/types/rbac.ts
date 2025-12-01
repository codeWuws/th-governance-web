/**
 * RBAC (基于角色的访问控制) 系统类型定义
 * User - 系统的使用者
 * Role - 权限的集合
 */

import { BaseEntity, PageResponse, ApiResponse } from './common'

// 导出通用类型以便使用
export type { PageResponse, ApiResponse }

/**
 * 用户状态枚举
 */
export enum UserStatus {
    ACTIVE = 'active', // 启用
    DISABLED = 'disabled', // 禁用
    LOCKED = 'locked', // 锁定
}

/**
 * 角色状态枚举
 */
export enum RoleStatus {
    ACTIVE = 'active', // 启用
    DISABLED = 'disabled', // 禁用
}

/**
 * 角色实体
 */
export interface Role extends BaseEntity {
    id: string
    name: string // 角色名称
    code: string // 角色编码 (唯一)
    description?: string // 角色描述
    status: RoleStatus
    userCount?: number // 关联的用户数量
    sortOrder: number // 排序
    permissions?: string[] // 角色权限（菜单路由 key 列表）
}

/**
 * 用户实体 (扩展基础用户)
 */
export interface RBACUser extends BaseEntity {
    id: string
    username: string // 用户名
    email: string // 邮箱
    phone?: string // 手机号
    realName: string // 真实姓名
    avatar?: string // 头像URL
    status: UserStatus
    roles: Role[] // 关联的角色
    lastLoginTime?: string // 最后登录时间
    lastLoginIp?: string // 最后登录IP
    department?: string // 部门
    position?: string // 职位
}

/**
 * 用户类型别名（向后兼容）
 */
export type User = RBACUser

/**
 * 用户查询参数
 */
export interface UserQueryParams {
    keyword?: string // 搜索关键词 (用户名/邮箱/姓名)
    status?: UserStatus
    roleId?: string // 角色ID筛选
    department?: string // 部门筛选
    page: number
    pageSize: number
}

/**
 * 角色查询参数
 */
export interface RoleQueryParams {
    keyword?: string // 搜索关键词 (角色名/编码)
    status?: 'active' | 'disabled'
    page: number
    pageSize: number
}

/**
 * 用户表单数据
 */
export interface UserFormData {
    username: string
    email: string
    phone?: string
    realName: string
    avatar?: string
    status: UserStatus
    roleIds: string[] // 关联的角色ID列表
    department?: string
    position?: string
    password?: string // 新建用户时需要
}

/**
 * 角色表单数据
 */
export interface RoleFormData {
    name: string
    code: string
    description?: string
    status: 'active' | 'disabled'
    sortOrder: number
}

/**
 * 批量操作参数
 */
export interface BatchOperationParams {
    ids: string[] // 操作ID列表
    operation: 'enable' | 'disable' | 'delete'
}

/**
 * 用户角色分配数据
 */
export interface UserRoleData {
    userId: string
    roleIds: string[]
}
