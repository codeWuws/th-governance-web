/**
 * RBAC系统API服务
 * 提供用户、角色、权限的CRUD操作和关联管理
 */

import { request, api, type RequestConfig } from '@/utils/request'
import {
    RBACUser,
    Role,
    UserQueryParams,
    RoleQueryParams,
    UserFormData,
    RoleFormData,
    BatchOperationParams,
    UserRoleData,
    UserAddEditRequest,
    UserPageRequest,
    UserPageResponse,
    RoleAddEditRequest,
    RolePageRequest,
    RolePageResponse,
    PermissionTreeResponse,
    PermissionMenu,
} from '@/types/rbac'
import { PageResponse, ApiResponse } from '@/types/common'

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
     * 获取用户详情（新接口）
     */
    getUserByIdNew: (id: string | number) => {
        return request.post<ApiResponse<any>>('/system/user/getUserById', { id })
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
     * 新增用户（新接口）
     */
    addUser: (data: UserAddEditRequest) => {
        return request.post<ApiResponse<RBACUser>>('/system/user/add', data)
    },

    /**
     * 编辑用户（新接口）
     */
    editUser: (data: UserAddEditRequest) => {
        return request.put<ApiResponse<RBACUser>>('/system/user/edit', data)
    },

    /**
     * 分页查询用户列表（新接口）
     */
    getUserPage: (params: UserPageRequest) => {
        const config: RequestConfig = { returnDataOnly: false }
        return request.post<ApiResponse<UserPageResponse>>('/system/user/page', params, config)
    },

    /**
     * 删除用户
     */
    deleteUser: (id: string) => {
        return request.delete<ApiResponse<void>>(`/api/users/${id}`)
    },

    /**
     * 删除用户（新接口）
     */
    deleteUserById: (id: string) => {
        return request.delete<ApiResponse<void>>(`/system/user/delete/${id}`)
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

    /**
     * 获取角色权限列表
     */
    getRolePermissions: (id: string) => {
        return request.get<ApiResponse<string[]>>(`/api/roles/${id}/permissions`)
    },

    /**
     * 更新角色权限
     */
    updateRolePermissions: (id: string, permissions: string[]) => {
        return request.put<ApiResponse<string[]>>(`/api/roles/${id}/permissions`, { permissions })
    },

    /**
     * 新增角色（新接口）
     */
    addRole: (data: RoleAddEditRequest) => {
        return request.post<ApiResponse<Role>>('/system/role/add', data)
    },

    /**
     * 编辑角色（新接口）
     */
    editRole: (data: RoleAddEditRequest) => {
        return request.put<ApiResponse<Role>>('/system/role/edit', data)
    },

    /**
     * 分页查询角色列表（新接口）
     */
    getRolePage: (params: RolePageRequest) => {
        const config: RequestConfig = { returnDataOnly: false }
        return request.post<ApiResponse<RolePageResponse>>('/system/role/page', params, config)
    },

    /**
     * 删除角色（新接口）
     */
    deleteRoleById: (id: string | number) => {
        return request.delete<ApiResponse<void>>('/system/role/delete', {
            data: { id },
        })
    },

    /**
     * 获取角色权限树（新接口）
     */
    getRolePermissionTree: (id: string | number) => {
        return request.post<ApiResponse<PermissionTreeResponse>>('/system/role-permission/permission-tree', { id })
    },

    /**
     * 保存角色权限（授权接口）
     */
    authorizeRolePermissions: (roleId: string, permissionIds: (string | number)[]) => {
        return request.put<ApiResponse<void>>('/system/role-permission/authorize', {
            roleId,
            permissionIds,
        })
    },
}

/**
 * 权限管理API
 */
export const permissionApi = {
    /**
     * 获取权限树
     */
    getPermissionTree: () => {
        return request.post<ApiResponse<PermissionTreeResponse>>('/system/permission/tree', {})
    },

    /**
     * 根据当前用户获取可访问的菜单列表（用于动态渲染侧边栏与路由）
     */
    getMenus: () => {
        const config: RequestConfig = {
            returnDataOnly: true,
            skipErrorHandler: true, // 菜单失败时仅清空菜单，不弹全局错误
        }
        return api.get<PermissionMenu[]>('/system/permission/menus', config)
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
