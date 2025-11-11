import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

// 用户信息接口
export interface User {
    id: number
    username: string
    email: string
    avatar?: string
    role: 'admin' | 'user' | 'guest'
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

// 异步 thunk - 获取用户信息
export const fetchUserInfo = createAsyncThunk(
    'user/fetchUserInfo',
    async (userId: number, { rejectWithValue }) => {
        try {
            // 模拟 API 调用
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 模拟用户数据
            const mockUser: User = {
                id: userId,
                username: `user_${userId}`,
                email: `user${userId}@example.com`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                role: userId === 1 ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
            }

            return mockUser
        } catch {
            return rejectWithValue('获取用户信息失败')
        }
    }
)

// 异步 thunk - 用户登录
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            // 模拟登录 API 调用
            await new Promise(resolve => setTimeout(resolve, 1500))

            // 简单的模拟验证
            if (credentials.username === 'admin' && credentials.password === 'admin123') {
                const user: User = {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                }

                // 模拟保存 token
                localStorage.setItem('access_token', 'mock_jwt_token_' + Date.now())

                return user
            } else {
                throw new Error('用户名或密码错误')
            }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '登录失败')
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
        // 用户登出
        logout: state => {
            state.currentUser = null
            state.isAuthenticated = false
            state.error = null
            localStorage.removeItem('access_token')
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
