import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { AuthService, type UserInfoDetail } from '@/services/authService'

// 用户信息接口
export interface User {
    id: number
    username: string
    nickName?: string // 昵称
    email: string
    phoneNumber?: string // 手机号
    avatar?: string
    role: 'admin' | 'user' | 'guest'
    roles?: string[] // 角色列表
    deptId?: number // 部门ID
    permissions?: string[] // 权限列表
    createdAt: string
}

// 用户状态接口
export interface UserState {
    currentUser: User | null
    users: User[]
    loading: boolean
    error: string | null
    isAuthenticated: boolean
}

// 初始状态
const initialState: UserState = {
    currentUser: null,
    users: [],
    loading: false,
    error: null,
    isAuthenticated: false,
}

// 异步 thunk - 获取用户信息（通过 /auth/info 接口）
export const refreshUserInfo = createAsyncThunk(
    'user/refreshUserInfo',
    async (_, { rejectWithValue }) => {
        try {
            // 通过 /auth/info 接口获取用户详细信息
            const userInfo = await AuthService.getUserInfo()
            
            // 将 UserInfoDetail 转换为 User 类型
            const user: User = {
                id: userInfo.user.id,
                username: userInfo.user.username,
                nickName: userInfo.user.nickName || undefined,
                email: userInfo.user.email || '',
                phoneNumber: userInfo.user.phoneNumber || undefined,
                avatar: userInfo.user.avatar || undefined,
                role: userInfo.roles.includes('admin') ? 'admin' : 'user',
                roles: userInfo.roles,
                deptId: userInfo.deptId,
                permissions: userInfo.permissions,
                createdAt: userInfo.user.createTime || new Date().toISOString(),
            }
            
            return user
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '获取用户信息失败')
        }
    }
)

// 异步 thunk - 获取用户信息（兼容旧接口，通过 userId）
export const fetchUserInfo = createAsyncThunk(
    'user/fetchUserInfo',
    async (userId: number, { rejectWithValue }) => {
        try {
            // 模拟 API 调用
            await new Promise(resolve => setTimeout(resolve, 500))

            // 根据用户ID返回对应的用户信息
            const userMap: Record<number, User> = {
                1: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                },
                2: {
                    id: 2,
                    username: 'doctor',
                    email: 'doctor@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                },
                3: {
                    id: 3,
                    username: 'researcher',
                    email: 'researcher@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                },
            }

            const user = userMap[userId]
            if (!user) {
                throw new Error('用户不存在')
            }

            return user
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '获取用户信息失败')
        }
    }
)

// 模拟账号数据
const MOCK_ACCOUNTS: Record<string, { password: string; user: Omit<User, 'id' | 'createdAt'> }> = {
    admin: {
        password: '123456',
        user: {
            username: 'admin',
            email: 'admin@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            role: 'admin',
        },
    },
    doctor: {
        password: '123456',
        user: {
            username: 'doctor',
            email: 'doctor@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
            role: 'user',
        },
    },
    researcher: {
        password: '123456',
        user: {
            username: 'researcher',
            email: 'researcher@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher',
            role: 'user',
        },
    },
}

// 异步 thunk - 用户登录
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            // 调用登录接口获取 token（token 已在 login 方法中持久化存储）
            await AuthService.login(credentials)
            
            // 通过 /auth/info 接口获取用户详细信息
            const userInfo = await AuthService.getUserInfo()
            
            // 将 UserInfoDetail 转换为 User 类型
            const user: User = {
                id: userInfo.user.id,
                username: userInfo.user.username,
                nickName: userInfo.user.nickName || undefined,
                email: userInfo.user.email || '',
                phoneNumber: userInfo.user.phoneNumber || undefined,
                avatar: userInfo.user.avatar || undefined,
                role: userInfo.roles.includes('admin') ? 'admin' : 'user',
                roles: userInfo.roles,
                deptId: userInfo.deptId,
                permissions: userInfo.permissions,
                createdAt: userInfo.user.createTime || new Date().toISOString(),
            }
            
            return user
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '登录失败')
        }
    }
)

// 异步 thunk - 用户登出
export const logoutUser = createAsyncThunk(
    'user/logout',
    async (_, { rejectWithValue }) => {
        try {
            // 调用登出接口清除服务端状态
            await AuthService.logout()
            // AuthService.logout() 内部已经清除了本地存储的 token
        } catch (error) {
            // 即使登出接口失败，也清除本地状态
            console.warn('登出接口调用失败，但已清除本地凭证', error)
            // 确保清除本地存储
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_type')
            localStorage.removeItem('mqtt_key')
            localStorage.removeItem('user_id')
            localStorage.removeItem('token_expires_at')
            return rejectWithValue(error instanceof Error ? error.message : '登出失败')
        }
    }
)

// 创建用户 slice
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // 设置当前用户
        setCurrentUser: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload
            state.isAuthenticated = true
            state.error = null
        },
        // 用户登出（同步 reducer，用于立即清除状态）
        logout: state => {
            state.currentUser = null
            state.isAuthenticated = false
            state.error = null
        },
        // 更新用户信息
        updateUserInfo: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload }
            }
        },
        // 添加用户到列表
        addUser: (state, action: PayloadAction<User>) => {
            state.users.push(action.payload)
        },
        // 清除错误
        clearError: state => {
            state.error = null
        },
        // 设置加载状态
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
    },
    extraReducers: builder => {
        // 处理 refreshUserInfo 异步操作
        builder
            .addCase(refreshUserInfo.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(refreshUserInfo.fulfilled, (state, action) => {
                state.loading = false
                state.currentUser = action.payload
                state.isAuthenticated = true
            })
            .addCase(refreshUserInfo.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
                // 如果获取用户信息失败，清除认证状态
                state.isAuthenticated = false
                state.currentUser = null
            })

        // 处理 fetchUserInfo 异步操作
        builder
            .addCase(fetchUserInfo.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchUserInfo.fulfilled, (state, action) => {
                state.loading = false
                state.currentUser = action.payload
                state.isAuthenticated = true
            })
            .addCase(fetchUserInfo.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })

        // 处理 loginUser 异步操作
        builder
            .addCase(loginUser.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.currentUser = action.payload
                state.isAuthenticated = true
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })

        // 处理 logoutUser 异步操作
        builder
            .addCase(logoutUser.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(logoutUser.fulfilled, state => {
                state.loading = false
                state.currentUser = null
                state.isAuthenticated = false
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false
                // 即使登出接口失败，也清除状态
                state.currentUser = null
                state.isAuthenticated = false
                state.error = action.payload as string
            })
    },
})

// 导出 actions
export const { setCurrentUser, logout, updateUserInfo, addUser, clearError, setLoading } =
    userSlice.actions

// 导出 reducer
export default userSlice.reducer

// 选择器函数
export const selectUser = (state: { user: UserState }) => state.user
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser
export const selectIsAuthenticated = (state: { user: UserState }) => state.user.isAuthenticated
export const selectUserLoading = (state: { user: UserState }) => state.user.loading
export const selectUserError = (state: { user: UserState }) => state.user.error
export const selectUsers = (state: { user: UserState }) => state.user.users
