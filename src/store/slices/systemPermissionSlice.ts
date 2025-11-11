import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 权限接口定义
export interface SystemPermission {
    id: string
    name: string
    code: string
    type: 'menu' | 'button' | 'api'
    parentId: string | null
    path?: string | null
    icon?: string | null
    sort: number
    status: 'active' | 'inactive'
    description: string
    createdAt: string
    updatedAt: string
}

// 权限状态接口
interface SystemPermissionState {
    permissions: SystemPermission[]
    loading: boolean
    error: string | null
    selectedPermission: SystemPermission | null
}

// 模拟权限数据（按照左侧菜单模块分级）
const mockPermissions: SystemPermission[] = [
    // 数据治理模块
    {
        id: '1',
        name: '数据治理',
        code: 'data_governance',
        type: 'menu',
        parentId: null,
        path: '/data-governance',
        icon: 'DatabaseOutlined',
        sort: 1,
        status: 'active',
        description: '数据治理模块',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-1',
        name: '仪表盘',
        code: 'dashboard',
        type: 'menu',
        parentId: '1',
        path: '/dashboard',
        icon: 'DashboardOutlined',
        sort: 1,
        status: 'active',
        description: '系统仪表盘页面',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-2',
        name: '数据源管理',
        code: 'database_connection',
        type: 'menu',
        parentId: '1',
        path: '/database-connection',
        icon: 'DatabaseOutlined',
        sort: 2,
        status: 'active',
        description: '数据库连接管理',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-3',
        name: '工作流步骤',
        code: 'workflow_config',
        type: 'menu',
        parentId: '1',
        path: '/data-governance/workflow-config',
        icon: 'SettingOutlined',
        sort: 3,
        status: 'active',
        description: '工作流配置管理',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-4',
        name: '执行历史',
        code: 'execution_history',
        type: 'menu',
        parentId: '1',
        path: '/data-governance/execution-history',
        icon: 'ClockCircleOutlined',
        sort: 4,
        status: 'active',
        description: '工作流执行历史',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    // 数据治理子功能按钮权限
    {
        id: '1-1-1',
        name: '查看仪表盘',
        code: 'dashboard:view',
        type: 'button',
        parentId: '1-1',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '查看仪表盘数据',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-2-1',
        name: '添加数据源',
        code: 'database:add',
        type: 'button',
        parentId: '1-2',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '添加新的数据源连接',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-2-2',
        name: '编辑数据源',
        code: 'database:edit',
        type: 'button',
        parentId: '1-2',
        path: null,
        icon: null,
        sort: 2,
        status: 'active',
        description: '编辑数据源配置',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '1-2-3',
        name: '删除数据源',
        code: 'database:delete',
        type: 'button',
        parentId: '1-2',
        path: null,
        icon: null,
        sort: 3,
        status: 'active',
        description: '删除数据源连接',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },

    // 数据质控模块
    {
        id: '2',
        name: '数据质控',
        code: 'data_quality_control',
        type: 'menu',
        parentId: null,
        path: '/data-quality-control',
        icon: 'SafetyCertificateOutlined',
        sort: 2,
        status: 'active',
        description: '数据质量控制模块',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-1',
        name: '文本质控',
        code: 'text_quality_control',
        type: 'menu',
        parentId: '2',
        path: '/data-quality-control/text',
        icon: 'FileTextOutlined',
        sort: 1,
        status: 'active',
        description: '文本数据质量控制',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-2',
        name: '综合质控',
        code: 'comprehensive_quality_control',
        type: 'menu',
        parentId: '2',
        path: '/data-quality-control/comprehensive',
        icon: 'BarChartOutlined',
        sort: 2,
        status: 'active',
        description: '综合数据质量控制',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-3',
        name: '完整性质控',
        code: 'completeness_quality_control',
        type: 'menu',
        parentId: '2',
        path: '/data-quality-control/completeness',
        icon: 'CheckCircleOutlined',
        sort: 3,
        status: 'active',
        description: '数据完整性质量控制',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-4',
        name: '基础医疗逻辑质控',
        code: 'basic_medical_logic_quality_control',
        type: 'menu',
        parentId: '2',
        path: '/data-quality-control/basic-medical-logic',
        icon: 'LinkOutlined',
        sort: 4,
        status: 'active',
        description: '基础医疗逻辑质量控制',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-5',
        name: '核心数据质控',
        code: 'core_data_quality_control',
        type: 'menu',
        parentId: '2',
        path: '/data-quality-control/core-data',
        icon: 'HeartOutlined',
        sort: 5,
        status: 'active',
        description: '核心数据质量控制',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    // 数据质控子功能按钮权限
    {
        id: '2-1-1',
        name: '执行文本质控',
        code: 'text_quality:execute',
        type: 'button',
        parentId: '2-1',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '执行文本质量控制检查',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2-1-2',
        name: '导出质控报告',
        code: 'text_quality:export',
        type: 'button',
        parentId: '2-1',
        path: null,
        icon: null,
        sort: 2,
        status: 'active',
        description: '导出文本质控报告',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },

    // 系统设置模块
    {
        id: '3',
        name: '系统设置',
        code: 'system_settings',
        type: 'menu',
        parentId: null,
        path: '/system-settings',
        icon: 'SettingOutlined',
        sort: 3,
        status: 'active',
        description: '系统设置模块',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-1',
        name: '用户设置',
        code: 'user_settings',
        type: 'menu',
        parentId: '3',
        path: '/system-settings/users',
        icon: 'UserOutlined',
        sort: 1,
        status: 'active',
        description: '用户管理设置',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-2',
        name: '角色设置',
        code: 'role_settings',
        type: 'menu',
        parentId: '3',
        path: '/system-settings/roles',
        icon: 'TeamOutlined',
        sort: 2,
        status: 'active',
        description: '角色管理设置',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-3',
        name: '权限设置',
        code: 'permission_settings',
        type: 'menu',
        parentId: '3',
        path: '/system-settings/permissions',
        icon: 'SafetyOutlined',
        sort: 3,
        status: 'active',
        description: '权限管理设置',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    // 系统设置子功能按钮权限
    {
        id: '3-1-1',
        name: '添加用户',
        code: 'user:add',
        type: 'button',
        parentId: '3-1',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '添加新用户',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-1-2',
        name: '编辑用户',
        code: 'user:edit',
        type: 'button',
        parentId: '3-1',
        path: null,
        icon: null,
        sort: 2,
        status: 'active',
        description: '编辑用户信息',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-1-3',
        name: '删除用户',
        code: 'user:delete',
        type: 'button',
        parentId: '3-1',
        path: null,
        icon: null,
        sort: 3,
        status: 'active',
        description: '删除用户',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-1-4',
        name: '重置密码',
        code: 'user:reset_password',
        type: 'button',
        parentId: '3-1',
        path: null,
        icon: null,
        sort: 4,
        status: 'active',
        description: '重置用户密码',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-2-1',
        name: '添加角色',
        code: 'role:add',
        type: 'button',
        parentId: '3-2',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '添加新角色',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-2-2',
        name: '编辑角色',
        code: 'role:edit',
        type: 'button',
        parentId: '3-2',
        path: null,
        icon: null,
        sort: 2,
        status: 'active',
        description: '编辑角色信息',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-2-3',
        name: '删除角色',
        code: 'role:delete',
        type: 'button',
        parentId: '3-2',
        path: null,
        icon: null,
        sort: 3,
        status: 'active',
        description: '删除角色',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-2-4',
        name: '分配权限',
        code: 'role:assign_permission',
        type: 'button',
        parentId: '3-2',
        path: null,
        icon: null,
        sort: 4,
        status: 'active',
        description: '为角色分配权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-3-1',
        name: '添加权限',
        code: 'permission:add',
        type: 'button',
        parentId: '3-3',
        path: null,
        icon: null,
        sort: 1,
        status: 'active',
        description: '添加新权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-3-2',
        name: '编辑权限',
        code: 'permission:edit',
        type: 'button',
        parentId: '3-3',
        path: null,
        icon: null,
        sort: 2,
        status: 'active',
        description: '编辑权限信息',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '3-3-3',
        name: '删除权限',
        code: 'permission:delete',
        type: 'button',
        parentId: '3-3',
        path: null,
        icon: null,
        sort: 3,
        status: 'active',
        description: '删除权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },

    // API权限示例
    {
        id: 'api-1',
        name: '用户管理API',
        code: 'api:user_management',
        type: 'api',
        parentId: '3-1',
        path: '/api/users/*',
        icon: null,
        sort: 1,
        status: 'active',
        description: '用户管理相关API接口权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'api-2',
        name: '角色管理API',
        code: 'api:role_management',
        type: 'api',
        parentId: '3-2',
        path: '/api/roles/*',
        icon: null,
        sort: 1,
        status: 'active',
        description: '角色管理相关API接口权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'api-3',
        name: '权限管理API',
        code: 'api:permission_management',
        type: 'api',
        parentId: '3-3',
        path: '/api/permissions/*',
        icon: null,
        sort: 1,
        status: 'active',
        description: '权限管理相关API接口权限',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
]

// 初始状态
const initialState: SystemPermissionState = {
    permissions: mockPermissions,
    loading: false,
    error: null,
    selectedPermission: null,
}

// 创建权限slice
const systemPermissionSlice = createSlice({
    name: 'systemPermission',
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

        // 设置选中的权限
        setSelectedPermission: (state, action: PayloadAction<SystemPermission | null>) => {
            state.selectedPermission = action.payload
        },

        // 添加权限
        addPermission: (
            state,
            action: PayloadAction<Omit<SystemPermission, 'id' | 'createdAt' | 'updatedAt'>>
        ) => {
            const newPermission: SystemPermission = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            state.permissions.push(newPermission)
        },

        // 更新权限
        updatePermission: (state, action: PayloadAction<SystemPermission>) => {
            const index = state.permissions.findIndex(
                permission => permission.id === action.payload.id
            )
            if (index !== -1) {
                state.permissions[index] = {
                    ...action.payload,
                    updatedAt: new Date().toISOString(),
                }
            }
        },

        // 删除权限
        deletePermission: (state, action: PayloadAction<string>) => {
            state.permissions = state.permissions.filter(
                permission => permission.id !== action.payload
            )
        },

        // 批量删除权限
        deletePermissions: (state, action: PayloadAction<string[]>) => {
            state.permissions = state.permissions.filter(
                permission => !action.payload.includes(permission.id)
            )
        },

        // 更新权限状态
        updatePermissionStatus: (
            state,
            action: PayloadAction<{ id: string; status: 'active' | 'inactive' }>
        ) => {
            const permission = state.permissions.find(
                permission => permission.id === action.payload.id
            )
            if (permission) {
                permission.status = action.payload.status
                permission.updatedAt = new Date().toISOString()
            }
        },

        // 更新权限排序
        updatePermissionSort: (state, action: PayloadAction<{ id: string; sort: number }>) => {
            const permission = state.permissions.find(
                permission => permission.id === action.payload.id
            )
            if (permission) {
                permission.sort = action.payload.sort
                permission.updatedAt = new Date().toISOString()
            }
        },
    },
})

// 导出actions
export const {
    setLoading,
    setError,
    setSelectedPermission,
    addPermission,
    updatePermission,
    deletePermission,
    deletePermissions,
    updatePermissionStatus,
    updatePermissionSort,
} = systemPermissionSlice.actions

// 导出reducer
export default systemPermissionSlice.reducer

// 选择器
export const selectPermissions = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.permissions
export const selectPermissionLoading = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.loading
export const selectPermissionError = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.error
export const selectSelectedPermission = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.selectedPermission
export const selectPermissionById = (
    state: { systemPermission: SystemPermissionState },
    id: string
) => state.systemPermission.permissions.find(permission => permission.id === id)
export const selectActivePermissions = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.permissions.filter(permission => permission.status === 'active')
export const selectMenuPermissions = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.permissions.filter(
        permission => permission.type === 'menu' && permission.status === 'active'
    )
export const selectRootMenuPermissions = (state: { systemPermission: SystemPermissionState }) =>
    state.systemPermission.permissions
        .filter(
            permission =>
                permission.type === 'menu' &&
                permission.status === 'active' &&
                permission.parentId === null
        )
        .sort((a, b) => a.sort - b.sort)
export const selectChildMenuPermissions = (
    state: { systemPermission: SystemPermissionState },
    parentId: string
) =>
    state.systemPermission.permissions
        .filter(
            permission =>
                permission.type === 'menu' &&
                permission.status === 'active' &&
                permission.parentId === parentId
        )
        .sort((a, b) => a.sort - b.sort)
