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
            // 模拟登录 API 调用延迟
            await new Promise(resolve => setTimeout(resolve, 1000))

            const account = MOCK_ACCOUNTS[credentials.username]
            
            // 验证用户名和密码
            if (account && account.password === credentials.password) {
                const user: User = {
                    id: credentials.username === 'admin' ? 1 : credentials.username === 'doctor' ? 2 : 3,
                    ...account.user,
                    createdAt: new Date().toISOString(),
                }

                // 模拟保存 token
                localStorage.setItem('access_token', `mock_jwt_token_${credentials.username}_${Date.now()}`)

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
