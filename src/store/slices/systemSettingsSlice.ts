import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RBACUser, Role } from '../../types/rbac'

interface SystemSettingsState {
    // 用户管理状态
    users: RBACUser[]
    selectedUserIds: string[]
    userLoading: boolean
    userSearchText: string
    userRoleAssignments: Record<string, string[]> // 用户角色分配状态 key: userId, value: roleIds[]

    // 角色管理状态
    roles: Role[]
    selectedRoleIds: string[]
    roleLoading: boolean
    roleSearchText: string

    // 通用状态
    activeTab: 'users' | 'roles'
    modalVisible: boolean
    drawerVisible: boolean
    currentRecord: RBACUser | Role | null
    modalType: 'create' | 'edit' | 'view' | null
}

const initialState: SystemSettingsState = {
    // 用户管理初始状态
    users: [],
    selectedUserIds: [],
    userLoading: false,
    userSearchText: '',
    userRoleAssignments: {},

    // 角色管理初始状态
    roles: [],
    selectedRoleIds: [],
    roleLoading: false,
    roleSearchText: '',

    // 通用状态
    activeTab: 'users',
    modalVisible: false,
    drawerVisible: false,
    currentRecord: null,
    modalType: null,
}

const systemSettingsSlice = createSlice({
    name: 'systemSettings',
    initialState,
    reducers: {
        // 标签页切换
        setActiveTab: (state, action: PayloadAction<'users' | 'roles'>) => {
            state.activeTab = action.payload
        },

        // 用户管理相关
        setUsers: (state, action: PayloadAction<RBACUser[]>) => {
            state.users = action.payload
        },
        setSelectedUserIds: (state, action: PayloadAction<string[]>) => {
            state.selectedUserIds = action.payload
        },
        setUserLoading: (state, action: PayloadAction<boolean>) => {
            state.userLoading = action.payload
        },
        setUserSearchText: (state, action: PayloadAction<string>) => {
            state.userSearchText = action.payload
        },
        addUser: (state, action: PayloadAction<RBACUser>) => {
            state.users.push(action.payload)
        },
        updateUser: (state, action: PayloadAction<RBACUser>) => {
            const index = state.users.findIndex(user => user.id === action.payload.id)
            if (index !== -1) {
                state.users[index] = action.payload
            }
        },
        deleteUser: (state, action: PayloadAction<string>) => {
            state.users = state.users.filter(user => user.id !== action.payload)
            state.selectedUserIds = state.selectedUserIds.filter(id => id !== action.payload)
            // 清理用户角色分配数据
            delete state.userRoleAssignments[action.payload]
        },

        // 用户角色分配相关
        setUserRoleAssignments: (state, action: PayloadAction<Record<string, string[]>>) => {
            state.userRoleAssignments = action.payload
        },
        setUserRoles: (state, action: PayloadAction<{ userId: string; roleIds: string[] }>) => {
            state.userRoleAssignments[action.payload.userId] = action.payload.roleIds
        },
        clearUserRoles: (state, action: PayloadAction<string>) => {
            delete state.userRoleAssignments[action.payload]
        },

        // 角色管理相关
        setRoles: (state, action: PayloadAction<Role[]>) => {
            state.roles = action.payload
        },
        setSelectedRoleIds: (state, action: PayloadAction<string[]>) => {
            state.selectedRoleIds = action.payload
        },
        setRoleLoading: (state, action: PayloadAction<boolean>) => {
            state.roleLoading = action.payload
        },
        setRoleSearchText: (state, action: PayloadAction<string>) => {
            state.roleSearchText = action.payload
        },
        addRole: (state, action: PayloadAction<Role>) => {
            state.roles.push(action.payload)
        },
        updateRole: (state, action: PayloadAction<Role>) => {
            const index = state.roles.findIndex(role => role.id === action.payload.id)
            if (index !== -1) {
                state.roles[index] = action.payload
            }
        },
        deleteRole: (state, action: PayloadAction<string>) => {
            state.roles = state.roles.filter(role => role.id !== action.payload)
            state.selectedRoleIds = state.selectedRoleIds.filter(id => id !== action.payload)
        },

        // 模态框和抽屉控制
        showModal: (
            state,
            action: PayloadAction<{
                type: 'create' | 'edit' | 'view'
                record?: RBACUser | Role
            }>
        ) => {
            state.modalVisible = true
            state.modalType = action.payload.type
            state.currentRecord = action.payload.record || null
        },
        hideModal: state => {
            state.modalVisible = false
            state.modalType = null
            state.currentRecord = null
        },
        showDrawer: (state, action: PayloadAction<RBACUser | Role>) => {
            state.drawerVisible = true
            state.currentRecord = action.payload
        },
        hideDrawer: state => {
            state.drawerVisible = false
            state.currentRecord = null
        },

        // 批量操作
        clearSelection: state => {
            switch (state.activeTab) {
                case 'users':
                    state.selectedUserIds = []
                    break
                case 'roles':
                    state.selectedRoleIds = []
                    break
            }
        },

        // 重置状态
        resetState: () => initialState,
    },
})

// 导出actions
export const {
    setActiveTab,
    setUsers,
    setSelectedUserIds,
    setUserLoading,
    setUserSearchText,
    addUser,
    updateUser,
    deleteUser,
    setUserRoleAssignments,
    setUserRoles,
    clearUserRoles,
    setRoles,
    setSelectedRoleIds,
    setRoleLoading,
    setRoleSearchText,
    addRole,
    updateRole,
    deleteRole,
    showModal,
    hideModal,
    showDrawer,
    hideDrawer,
    clearSelection,
    resetState,
} = systemSettingsSlice.actions

// 导出reducer
export default systemSettingsSlice.reducer
