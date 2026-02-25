import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { permissionApi } from '@/api/rbac'
import type { PermissionMenu } from '@/types/rbac'
import { logoutUser } from './userSlice'

/** 菜单权限状态 */
export interface MenuState {
    /** 当前用户可访问的菜单树 */
    menus: PermissionMenu[]
    loading: boolean
    error: string | null
}

const initialState: MenuState = {
    menus: [],
    loading: false,
    error: null,
}

/** 拉取当前用户菜单权限（登录后、刷新系统后调用） */
export const fetchMenus = createAsyncThunk(
    'menu/fetchMenus',
    async (_, { rejectWithValue }) => {
        try {
            const data = await permissionApi.getMenus()
            return Array.isArray(data) ? data : []
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '获取菜单失败')
        }
    }
)

const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        /** 清空菜单（登出时调用） */
        clearMenus: state => {
            state.menus = []
            state.error = null
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchMenus.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMenus.fulfilled, (state, action) => {
                state.loading = false
                state.menus = action.payload
            })
            .addCase(fetchMenus.rejected, (state, action) => {
                state.loading = false
                state.error = (action.payload as string) || '获取菜单失败'
                state.menus = []
            })
            .addCase(logoutUser.fulfilled, state => {
                state.menus = []
                state.error = null
            })
    },
})

export const { clearMenus } = menuSlice.actions
export default menuSlice.reducer

export const selectMenus = (state: { menu: MenuState }) => state.menu.menus
export const selectMenuLoading = (state: { menu: MenuState }) => state.menu.loading
export const selectMenuError = (state: { menu: MenuState }) => state.menu.error
