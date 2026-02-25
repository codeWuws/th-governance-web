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
 * 用户分页查询请求参数（匹配后端接口格式）
 */
export interface UserPageRequest {
    email?: string // 邮箱
    nickName?: string // 昵称（模糊）
    pageNum?: number // 当前页码
    pageSize?: number // 每页数量
    phoneNumber?: string // 手机号
    postId?: number // 岗位ID
    sortField?: string // 排序字段（可选）
    sortOrder?: string // 排序方向（asc/desc）
    status?: string[] // 状态（0正常 1停用）
    username?: string // 用户名（模糊）
    [property: string]: any
}

/**
 * 用户分页查询响应数据
 */
export interface UserPageResponse {
    records: UserPageRecord[] // 用户列表
    total: string // 总记录数
    size: string // 每页数量
    current: string // 当前页码
    pages: string // 总页数
}

/**
 * 用户分页查询记录
 */
export interface UserPageRecord {
    id: string
    username: string
    nickName: string
    email: string
    phoneNumber: string
    sex: string // 0-男，1-女
    avatar: string | null
    password: string
    status: string // 0-正常，1-停用
    deptId: string | null
    deptName: string | null
    postId: string | null
    postName: string | null
    roles: string[] // 角色名称列表
    roleVos: any | null
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
 * 角色分页查询请求参数（匹配后端接口格式）
 */
export interface RolePageRequest {
    pageNum?: number // 当前页码
    pageSize?: number // 每页数量
    roleKey?: string // 角色标识（唯一key），模糊匹配
    roleName?: string // 角色名称，模糊匹配
    sortField?: string // 排序字段（可选）
    sortOrder?: string // 排序方向（asc/desc）
    status?: string[] // 状态（0正常 1停用）
    [property: string]: any
}

/**
 * 角色分页查询响应数据
 */
export interface RolePageResponse {
    records: RolePageRecord[] // 角色列表
    total: string // 总记录数
    size: string // 每页数量
    current: string // 当前页码
    pages: string // 总页数
}

/**
 * 角色分页查询记录
 */
export interface RolePageRecord {
    id: string
    roleName: string // 角色名称
    roleKey: string // 角色编码
    roleSort: number // 排序
    status: string // 状态：0-正常，1-停用
    userCount: string // 用户数量
    createBy: string | null // 创建人
    createTime: string // 创建时间
    updateBy: string | null // 更新人
    updateTime: string | null // 更新时间
    remark: string | null // 备注
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
 * 用户新增/编辑请求数据（匹配后端接口格式）
 */
export interface UserAddEditRequest {
    id?: string // 编辑时必传
    username: string
    nickName?: string // 昵称
    email: string
    phoneNumber?: string // 手机号
    sex?: string // 性别：1-男，2-女
    avatar?: string
    password?: string // 新增时必传
    status: string // 状态：0-启用，1-禁用
    deptId?: number // 部门ID
    deptName?: string // 部门名称
    postId?: number // 职位ID
    postName?: string // 职位名称
    roleIds?: number[] // 角色ID列表
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
 * 角色新增/编辑请求数据（匹配后端接口格式）
 */
export interface RoleAddEditRequest {
    id?: string // 编辑时必传
    roleName: string // 角色名称
    roleKey: string // 角色编码
    roleSort: number // 排序
    status: string // 状态：0-启用，1-禁用
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

/**
 * 权限树节点
 */
export interface PermissionTreeNode {
    id: string
    parentId: string
    title: string
    key: string
    orderNum: number
    children: PermissionTreeNode[]
}

/**
 * 权限树响应数据
 */
export interface PermissionTreeResponse {
    nodes: PermissionTreeNode[]
    checkedIds: string[]
}

/**
 * 权限类型：M-目录/菜单 C-菜单/页面 F-按钮/权限
 */
export type PermissionType = 'M' | 'C' | 'F'

/**
 * 用户菜单权限节点（/system/permission/menus 接口返回）
 */
export interface PermissionMenu {
    id: string
    parentId: string
    title: string
    key: string
    orderNum: number
    permissionType: PermissionType
    path: string | null
    component: string | null
    icon: string | null
    visible: string
    children: PermissionMenu[]
}