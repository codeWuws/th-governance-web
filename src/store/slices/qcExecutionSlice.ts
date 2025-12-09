/**
 * 数据质控执行详情 Redux Slice
 * 管理数据质控执行过程中的实时数据和状态
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { WorkflowExecutionMessage } from '../../types'

// 数据质控执行状态类型
export type QCExecutionStatus =
    | 'idle'
    | 'starting'
    | 'running'
    | 'completed'
    | 'error'
    | 'cancelled'

// 单个质控任务执行信息
export interface QCExecutionInfo {
    taskId: string
    status: QCExecutionStatus
    startTime: number
    endTime: number | null
    progress: number
    messages: WorkflowExecutionMessage[] // 使用WorkflowExecutionMessage类型
    loading: boolean
    error: string | null
}

// 数据质控执行详情状态
export interface QCExecutionState {
    // 按taskId组织的质控任务执行信息
    executions: Record<string, QCExecutionInfo>

    // 当前活跃的质控任务taskId列表
    activeTaskIds: string[]

    // 全局UI状态
    globalLoading: boolean
    globalError: string | null
}

// 初始状态
const initialState: QCExecutionState = {
    executions: {},
    activeTaskIds: [],
    globalLoading: false,
    globalError: null,
}

// 创建 slice
const qcExecutionSlice = createSlice({
    name: 'qcExecution',
    initialState,
    reducers: {
        // 初始化质控任务执行
        initializeExecution: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload

            if (!state.executions[taskId]) {
                state.executions[taskId] = {
                    taskId,
                    status: 'starting',
                    startTime: Date.now(),
                    endTime: null,
                    progress: 0,
                    messages: [],
                    loading: true,
                    error: null,
                }

                // 添加到活跃任务列表
                if (!state.activeTaskIds.includes(taskId)) {
                    state.activeTaskIds.push(taskId)
                }
            }
        },

        // 添加执行消息（按taskId分组）
        addMessage: (
            state,
            action: PayloadAction<{ taskId: string; message: WorkflowExecutionMessage }>
        ) => {
            const { taskId, message } = action.payload

            // 如果质控任务执行信息不存在，先初始化
            if (!state.executions[taskId]) {
                state.executions[taskId] = {
                    taskId,
                    status: 'starting',
                    startTime: Date.now(),
                    endTime: null,
                    progress: 0,
                    messages: [],
                    loading: true,
                    error: null,
                }

                if (!state.activeTaskIds.includes(taskId)) {
                    state.activeTaskIds.push(taskId)
                }
            }

            // 添加消息到数组
            state.executions[taskId].messages.push(message)

            // 更新进度和状态
            if (message.progress !== undefined) {
                state.executions[taskId].progress = message.progress
            }

            // 根据executionStatus更新状态
            if (message.executionStatus === 'running') {
                state.executions[taskId].status = 'running'
            } else if (message.executionStatus === 'completed' || message.executionStatus === 'end') {
                state.executions[taskId].status = 'completed'
                state.executions[taskId].endTime = Date.now()
                state.executions[taskId].loading = false
            } else if (message.executionStatus === 'error' || message.executionStatus === 'failed') {
                state.executions[taskId].status = 'error'
                state.executions[taskId].loading = false
            }
        },

        // 清空指定质控任务的消息
        clearMessages: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].messages = []
            }
        },

        // 清空所有消息
        clearAllMessages: state => {
            Object.keys(state.executions).forEach(taskId => {
                state.executions[taskId].messages = []
            })
        },

        // 设置质控任务加载状态
        setExecutionLoading: (
            state,
            action: PayloadAction<{ taskId: string; loading: boolean }>
        ) => {
            const { taskId, loading } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].loading = loading
            }
        },

        // 设置质控任务错误
        setExecutionError: (
            state,
            action: PayloadAction<{ taskId: string; error: string | null }>
        ) => {
            const { taskId, error } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].error = error
                if (error) {
                    state.executions[taskId].status = 'error'
                    state.executions[taskId].loading = false
                }
            }
        },

        // 设置全局加载状态
        setGlobalLoading: (state, action: PayloadAction<boolean>) => {
            state.globalLoading = action.payload
        },

        // 设置全局错误
        setGlobalError: (state, action: PayloadAction<string | null>) => {
            state.globalError = action.payload
        },

        // 移除质控任务执行记录
        removeExecution: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload
            delete state.executions[taskId]

            const index = state.activeTaskIds.indexOf(taskId)
            if (index > -1) {
                state.activeTaskIds.splice(index, 1)
            }
        },

        // 恢复执行状态（用于页面刷新后恢复状态）
        restoreExecution: (
            state,
            action: PayloadAction<{ taskId: string; messages: WorkflowExecutionMessage[] }>
        ) => {
            const { taskId, messages } = action.payload

            if (!state.executions[taskId]) {
                state.executions[taskId] = {
                    taskId,
                    status: 'running',
                    startTime: Date.now(),
                    endTime: null,
                    progress: 0,
                    messages: [],
                    loading: false,
                    error: null,
                }
            }

            state.executions[taskId].messages = [...messages]
        },

        // 批量更新质控任务状态
        updateExecutionStatus: (
            state,
            action: PayloadAction<{
                taskId: string
                status: QCExecutionStatus
                endTime?: number
            }>
        ) => {
            const { taskId, status, endTime } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].status = status
                if (endTime) {
                    state.executions[taskId].endTime = endTime
                }

                // 如果质控任务结束，从活跃列表中移除
                if (status === 'completed' || status === 'error' || status === 'cancelled') {
                    const index = state.activeTaskIds.indexOf(taskId)
                    if (index > -1) {
                        state.activeTaskIds.splice(index, 1)
                    }
                    state.executions[taskId].loading = false
                }
            }
        },

        // 清理已完成的质控任务（保留最近N个）
        cleanupCompletedExecutions: (state, action: PayloadAction<{ keepCount?: number }>) => {
            const { keepCount = 10 } = action.payload
            const completedExecutions = Object.values(state.executions)
                .filter(exec => exec.status === 'completed' || exec.status === 'error')
                .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))

            // 保留最近的N个已完成质控任务，删除其余的
            if (completedExecutions.length > keepCount) {
                const toRemove = completedExecutions.slice(keepCount)
                toRemove.forEach(exec => {
                    delete state.executions[exec.taskId]
                })
            }
        },
    },
})

// 导出 actions
export const {
    initializeExecution,
    addMessage,
    clearMessages,
    clearAllMessages,
    setExecutionLoading,
    setExecutionError,
    setGlobalLoading,
    setGlobalError,
    removeExecution,
    restoreExecution,
    updateExecutionStatus,
    cleanupCompletedExecutions,
} = qcExecutionSlice.actions

// 选择器
export const selectQCExecution = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution

// 获取所有质控任务执行信息
export const selectAllExecutions = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.executions

// 获取指定质控任务的执行信息
export const selectExecutionByTaskId =
    (taskId: string) => (state: { qcExecution: QCExecutionState }) =>
        state.qcExecution.executions[taskId]

// 获取指定质控任务的消息列表
export const selectExecutionMessages =
    (taskId: string) => (state: { qcExecution: QCExecutionState }) =>
        state.qcExecution.executions[taskId]?.messages || []

// 获取活跃的质控任务ID列表
export const selectActiveTaskIds = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.activeTaskIds

// 获取全局状态
export const selectGlobalLoading = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.globalLoading

export const selectGlobalError = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.globalError

// 检查是否有质控任务正在运行
export const selectHasActiveQCTasks = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.activeTaskIds.length > 0

// 获取质控任务数量统计
export const selectQCTaskStats = (state: { qcExecution: QCExecutionState }) => {
    const executions = state.qcExecution.executions
    const total = Object.keys(executions).length
    const active = state.qcExecution.activeTaskIds.length
    const completed = Object.values(executions).filter(exec => exec.status === 'completed').length
    const failed = Object.values(executions).filter(exec => exec.status === 'error').length

    return { total, active, completed, failed }
}

// 导出 reducer
export default qcExecutionSlice.reducer

