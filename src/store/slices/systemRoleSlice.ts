import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 角色接口定义
export interface SystemRole {
    id: string
    name: string
    code: string
    description: string
    status: 'active' | 'inactive'
    permissionIds: string[]
    userIds: string[]
    createdAt: string
    updatedAt: string
}

// 角色状态接口
interface SystemRoleState {
    roles: SystemRole[]
    loading: boolean
    error: string | null
    selectedRole: SystemRole | null
}

// 模拟角色数据
const mockRoles: SystemRole[] = [
    {
        id: '1',
        name: '超级管理员',
        code: 'super_admin',
        description: '拥有系统所有权限的超级管理员',
        status: 'active',
        permissionIds: [
            '1',
            '1-1',
            '1-2',
            '1-3',
            '1-4',
            '1-1-1',
            '1-2-1',
            '1-2-2',
            '1-2-3',
            '2',
            '2-1',
            '2-2',
            '2-3',
            '2-4',
            '2-5',
            '2-1-1',
            '2-1-2',
            '3',
            '3-1',
            '3-2',
            '3-3',
            '3-1-1',
            '3-1-2',
            '3-1-3',
            '3-1-4',
            '3-2-1',
            '3-2-2',
            '3-2-3',
            '3-2-4',
            '3-3-1',
            '3-3-2',
            '3-3-3',
            'api-1',
            'api-2',
            'api-3',
        ],
        userIds: ['1'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2',
        name: '业务管理员',
        code: 'business_admin',
        description: '负责数据治理和数据质控相关功能的管理员',
        status: 'active',
        permissionIds: [
            '1',
            '1-1',
            '1-2',
            '1-3',
            '1-4',
            '1-1-1',
            '1-2-1',
            '1-2-2',
            '2',
            '2-1',
            '2-2',
            '2-3',
            '2-4',
            '2-5',
            '2-1-1',
            '2-1-2',
        ],
        userIds: ['2'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    },
    {
        id: '3',
        name: '系统管理员',
        code: 'system_admin',
        description: '负责系统设置相关功能的管理员',
        status: 'active',
        permissionIds: [
            '1',
            '1-1',
            '1-1-1',
            '3',
            '3-1',
            '3-2',
            '3-3',
            '3-1-1',
            '3-1-2',
            '3-1-3',
            '3-1-4',
            '3-2-1',
            '3-2-2',
            '3-2-3',
            '3-2-4',
            '3-3-1',
            '3-3-2',
            '3-3-3',
            'api-1',
            'api-2',
            'api-3',
        ],
        userIds: ['3'],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
    },
    {
        id: '4',
        name: '普通用户',
        code: 'normal_user',
        description: '系统普通用户，拥有基础查看权限',
        status: 'active',
        permissionIds: ['1', '1-1', '1-1-1', '2', '2-1', '2-2', '2-3', '2-4', '2-5'],
        userIds: ['4', '5'],
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
    },
    {
        id: '5',
        name: '访客',
        code: 'guest',
        description: '访客用户，仅有查看权限',
        status: 'inactive',
        permissionIds: ['1', '1-1', '1-1-1'],
        userIds: [],
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z',
    },
]

// 初始状态
const initialState: SystemRoleState = {
    roles: mockRoles,
    loading: false,
    error: null,
    selectedRole: null,
}

// 创建角色slice
const systemRoleSlice = createSlice({
    name: 'systemRole',
    initialState,
    reducers: {
        // 设置加载状态
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },

        // 设置错误信息
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },

        // 设置选中的角色
        setSelectedRole: (state, action: PayloadAction<SystemRole | null>) => {
            state.selectedRole = action.payload
        },

        // 添加角色
        addRole: (
            state,
            action: PayloadAction<Omit<SystemRole, 'id' | 'createdAt' | 'updatedAt'>>
        ) => {
            const newRole: SystemRole = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            state.roles.push(newRole)
        },

        // 更新角色
        updateRole: (state, action: PayloadAction<SystemRole>) => {
            const index = state.roles.findIndex(role => role.id === action.payload.id)
            if (index !== -1) {
                state.roles[index] = {
                    ...action.payload,
                    updatedAt: new Date().toISOString(),
                }
            }
        },

        // 删除角色
        deleteRole: (state, action: PayloadAction<string>) => {
            state.roles = state.roles.filter(role => role.id !== action.payload)
        },

        // 批量删除角色
        deleteRoles: (state, action: PayloadAction<string[]>) => {
            state.roles = state.roles.filter(role => !action.payload.includes(role.id))
        },

        // 更新角色状态
        updateRoleStatus: (
            state,
            action: PayloadAction<{ id: string; status: 'active' | 'inactive' }>
        ) => {
            const role = state.roles.find(role => role.id === action.payload.id)
            if (role) {
                role.status = action.payload.status
                role.updatedAt = new Date().toISOString()
            }
        },

        // 分配权限给角色
        assignPermissionsToRole: (
            state,
            action: PayloadAction<{ roleId: string; permissionIds: string[] }>
        ) => {
            const role = state.roles.find(role => role.id === action.payload.roleId)
            if (role) {
                role.permissionIds = action.payload.permissionIds
                role.updatedAt = new Date().toISOString()
            }
        },

        // 分配用户给角色
        assignUsersToRole: (
            state,
            action: PayloadAction<{ roleId: string; userIds: string[] }>
        ) => {
            const role = state.roles.find(role => role.id === action.payload.roleId)
            if (role) {
                role.userIds = action.payload.userIds
                role.updatedAt = new Date().toISOString()
            }
        },

        // 从角色中移除用户
        removeUserFromRole: (state, action: PayloadAction<{ roleId: string; userId: string }>) => {
            const role = state.roles.find(role => role.id === action.payload.roleId)
            if (role) {
                role.userIds = role.userIds.filter(id => id !== action.payload.userId)
                role.updatedAt = new Date().toISOString()
            }
        },

        // 添加用户到角色
        addUserToRole: (state, action: PayloadAction<{ roleId: string; userId: string }>) => {
            const role = state.roles.find(role => role.id === action.payload.roleId)
            if (role && !role.userIds.includes(action.payload.userId)) {
                role.userIds.push(action.payload.userId)
                role.updatedAt = new Date().toISOString()
            }
        },
    },
})

// 导出actions
export const {
    setLoading,
    setError,
    setSelectedRole,
    addRole,
    updateRole,
    deleteRole,
    deleteRoles,
    updateRoleStatus,
    assignPermissionsToRole,
    assignUsersToRole,
    removeUserFromRole,
    addUserToRole,
} = systemRoleSlice.actions

// 导出reducer
export default systemRoleSlice.reducer

// 选择器
export const selectRoles = (state: { systemRole: SystemRoleState }) => state.systemRole.roles
export const selectRoleLoading = (state: { systemRole: SystemRoleState }) =>
    state.systemRole.loading
export const selectRoleError = (state: { systemRole: SystemRoleState }) => state.systemRole.error
export const selectSelectedRole = (state: { systemRole: SystemRoleState }) =>
    state.systemRole.selectedRole
export const selectRoleById = (state: { systemRole: SystemRoleState }, id: string) =>
    state.systemRole.roles.find(role => role.id === id)
export const selectActiveRoles = (state: { systemRole: SystemRoleState }) =>
    state.systemRole.roles.filter(role => role.status === 'active')
export const selectRolesByUserId = (state: { systemRole: SystemRoleState }, userId: string) =>
    state.systemRole.roles.filter(role => role.userIds.includes(userId))
