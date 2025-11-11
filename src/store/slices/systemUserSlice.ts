import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 用户接口定义
export interface SystemUser {
    id: string
    username: string
    email: string
    phone: string
    realName: string
    avatar?: string
    status: 'active' | 'inactive'
    roleIds: string[]
    department: string
    position: string
    createdAt: string
    updatedAt: string
}

// 用户状态接口
interface SystemUserState {
    users: SystemUser[]
    loading: boolean
    error: string | null
    selectedUser: SystemUser | null
}

// 模拟用户数据
const mockUsers: SystemUser[] = [
    {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        phone: '13800138000',
        realName: '系统管理员',
        avatar: '',
        status: 'active',
        roleIds: ['1'],
        department: '技术部',
        position: '系统管理员',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2',
        username: 'user001',
        email: 'user001@example.com',
        phone: '13800138001',
        realName: '张三',
        avatar: '',
        status: 'active',
        roleIds: ['2'],
        department: '业务部',
        position: '业务专员',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    },
    {
        id: '3',
        username: 'user002',
        email: 'user002@example.com',
        phone: '13800138002',
        realName: '李四',
        avatar: '',
        status: 'active',
        roleIds: ['3'],
        department: '运营部',
        position: '运营专员',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
    },
    {
        id: '4',
        username: 'user003',
        email: 'user003@example.com',
        phone: '13800138003',
        realName: '王五',
        avatar: '',
        status: 'inactive',
        roleIds: ['3'],
        department: '财务部',
        position: '财务专员',
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
    },
]

// 初始状态
const initialState: SystemUserState = {
    users: mockUsers,
    loading: false,
    error: null,
    selectedUser: null,
}

// 创建用户slice
const systemUserSlice = createSlice({
    name: 'systemUser',
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

        // 设置选中的用户
        setSelectedUser: (state, action: PayloadAction<SystemUser | null>) => {
            state.selectedUser = action.payload
        },

        // 添加用户
        addUser: (
            state,
            action: PayloadAction<Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>>
        ) => {
            const newUser: SystemUser = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            state.users.push(newUser)
        },

        // 更新用户
        updateUser: (state, action: PayloadAction<SystemUser>) => {
            const index = state.users.findIndex(user => user.id === action.payload.id)
            if (index !== -1) {
                state.users[index] = {
                    ...action.payload,
                    updatedAt: new Date().toISOString(),
                }
            }
        },

        // 删除用户
        deleteUser: (state, action: PayloadAction<string>) => {
            state.users = state.users.filter(user => user.id !== action.payload)
        },

        // 批量删除用户
        deleteUsers: (state, action: PayloadAction<string[]>) => {
            state.users = state.users.filter(user => !action.payload.includes(user.id))
        },

        // 更新用户状态
        updateUserStatus: (
            state,
            action: PayloadAction<{ id: string; status: 'active' | 'inactive' }>
        ) => {
            const user = state.users.find(user => user.id === action.payload.id)
            if (user) {
                user.status = action.payload.status
                user.updatedAt = new Date().toISOString()
            }
        },

        // 分配角色给用户
        assignRolesToUser: (
            state,
            action: PayloadAction<{ userId: string; roleIds: string[] }>
        ) => {
            const user = state.users.find(user => user.id === action.payload.userId)
            if (user) {
                user.roleIds = action.payload.roleIds
                user.updatedAt = new Date().toISOString()
            }
        },
    },
})

// 导出actions
export const {
    setLoading,
    setError,
    setSelectedUser,
    addUser,
    updateUser,
    deleteUser,
    deleteUsers,
    updateUserStatus,
    assignRolesToUser,
} = systemUserSlice.actions

// 导出reducer
export default systemUserSlice.reducer

// 选择器
export const selectUsers = (state: { systemUser: SystemUserState }) => state.systemUser.users
export const selectUserLoading = (state: { systemUser: SystemUserState }) =>
    state.systemUser.loading
export const selectUserError = (state: { systemUser: SystemUserState }) => state.systemUser.error
export const selectSelectedUser = (state: { systemUser: SystemUserState }) =>
    state.systemUser.selectedUser
export const selectUserById = (state: { systemUser: SystemUserState }, id: string) =>
    state.systemUser.users.find(user => user.id === id)
export const selectActiveUsers = (state: { systemUser: SystemUserState }) =>
    state.systemUser.users.filter(user => user.status === 'active')
