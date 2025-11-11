import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import userReducer from './slices/userSlice'
import dataGovernanceReducer from './slices/dataGovernanceSlice'
import systemUserReducer from './slices/systemUserSlice'
import systemRoleReducer from './slices/systemRoleSlice'
import systemPermissionReducer from './slices/systemPermissionSlice'
import workflowExecutionReducer from './slices/workflowExecutionSlice'

// 配置 Redux store
// 扩展 Window 接口以支持 Redux DevTools
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__?: () => unknown
    }
}

export const store = configureStore({
    reducer: {
        counter: counterReducer,
        user: userReducer,
        dataGovernance: dataGovernanceReducer,
        systemUser: systemUserReducer,
        systemRole: systemRoleReducer,
        systemPermission: systemPermissionReducer,
        workflowExecution: workflowExecutionReducer,
    },
    // 开发环境启用 Redux DevTools
    devTools: typeof window !== 'undefined' && !!window.__REDUX_DEVTOOLS_EXTENSION__,
    // 中间件配置
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
})

// 导出类型定义
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
