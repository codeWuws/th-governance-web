/**
 * RBAC系统API服务
 * 提供用户、角色、权限的CRUD操作和关联管理
 */

import { request } from '@/utils/request'
import {
    RBACUser,
    Role,
    UserQueryParams,
    RoleQueryParams,
    UserFormData,
    RoleFormData,
    BatchOperationParams,
    UserRoleData,
    PageResponse,
    ApiResponse,
} from '@/types/rbac'

/**
 * 用户管理API
 */
export const userApi = {
    /**
     * 获取用户列表
     */
    getUserList: (params: UserQueryParams) => {
        return request.get<ApiResponse<PageResponse<RBACUser>>>('/api/users', { params })
    },

    /**
     * 获取用户详情
     */
    getUserById: (id: string) => {
        return request.get<ApiResponse<RBACUser>>(`/api/users/${id}`)
    },

    /**
     * 创建用户
     */
    createUser: (data: UserFormData) => {
        return request.post<ApiResponse<RBACUser>>('/api/users', data)
    },

    /**
     * 更新用户
     */
    updateUser: (id: string, data: Partial<UserFormData>) => {
        return request.put<ApiResponse<RBACUser>>(`/api/users/${id}`, data)
    },

    /**
     * 删除用户
     */
    deleteUser: (id: string) => {
        return request.delete<ApiResponse<void>>(`/api/users/${id}`)
    },

    /**
     * 批量删除用户
     */
    batchDeleteUsers: (ids: string[]) => {
        return request.delete<ApiResponse<void>>('/api/users/batch', { data: { ids } })
    },

    /**
     * 重置用户密码
     */
    resetPassword: (id: string, password: string) => {
        return request.put<ApiResponse<void>>(`/api/users/${id}/password`, { password })
    },

    /**
     * 更新用户角色
     */
    updateUserRoles: (userId: string, roleIds: string[]) => {
        const data: UserRoleData = { userId, roleIds }
        return request.put<ApiResponse<void>>(`/api/users/${userId}/roles`, data)
    },

    /**
     * 批量操作用户
     */
    batchOperation: (params: BatchOperationParams) => {
        return request.post<ApiResponse<void>>('/api/users/batch-operation', params)
    },
}

/**
 * 角色管理API
 */
export const roleApi = {
    /**
     * 获取角色列表
     */
    getRoleList: (params: RoleQueryParams) => {
        return request.get<ApiResponse<PageResponse<Role>>>('/api/roles', { params })
    },

    /**
     * 获取角色详情
     */
    getRoleById: (id: string) => {
        return request.get<ApiResponse<Role>>(`/api/roles/${id}`)
    },

    /**
     * 创建角色
     */
    createRole: (data: RoleFormData) => {
        return request.post<ApiResponse<Role>>('/api/roles', data)
    },

    /**
     * 更新角色
     */
    updateRole: (id: string, data: Partial<RoleFormData>) => {
        return request.put<ApiResponse<Role>>(`/api/roles/${id}`, data)
    },

    /**
     * 删除角色
     */
    deleteRole: (id: string) => {
        return request.delete<ApiResponse<void>>(`/api/roles/${id}`)
    },

    /**
     * 批量删除角色
     */
    batchDeleteRoles: (ids: string[]) => {
        return request.delete<ApiResponse<void>>('/api/roles/batch', { data: { ids } })
    },



    /**
     * 获取所有角色 (用于下拉选择)
     */
    getAllRoles: () => {
        return request.get<ApiResponse<Role[]>>('/api/roles/all')
    },

    /**
     * 批量操作角色
     */
    batchOperation: (params: BatchOperationParams) => {
        return request.post<ApiResponse<void>>('/api/roles/batch-operation', params)
    },
}

/**
 * RBAC统计API
 */
export const rbacStatsApi = {
    /**
     * 获取RBAC统计信息
     */
    getStats: () => {
        return request.get<
            ApiResponse<{
                totalUsers: number
                totalRoles: number
                activeUsers: number
                activeRoles: number
            }>
        >('/api/rbac/stats')
    },
}
