/**
 * 工作流执行详情 Redux Slice
 * 管理工作流执行过程中的实时数据和状态
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { WorkflowExecutionMessage } from '../../types'

// 节点信息类型
export interface WorkflowNode {
    id: number // 节点ID
    nodeName: string // 节点名称
    nodeType: string // 节点类型，如 "dataAccess"
    nodeStep: number // 节点步骤
    enabled: boolean // 是否启用
    isAuto: boolean // 是否自动执行
    descript: string // 节点描述
}

// 工作流执行状态类型
export type WorkflowExecutionStatus =
    | 'idle'
    | 'starting'
    | 'running'
    | 'completed'
    | 'error'
    | 'cancelled'

// 单个工作流执行信息
export interface WorkflowExecutionInfo {
    taskId: string
    status: WorkflowExecutionStatus
    startTime: number
    endTime: number | null
    progress: number
    messages: WorkflowExecutionMessage[] // 修改为WorkflowExecutionMessage数组类型
    loading: boolean
    error: string | null
}

// 工作流执行详情状态
export interface WorkflowExecutionState {
    // 按taskId组织的工作流执行信息
    executions: Record<string, WorkflowExecutionInfo>
 
    // 当前活跃的工作流taskId列表
    activeTaskIds: string[]

    // 全局UI状态
    globalLoading: boolean
    globalError: string | null
}

// 初始状态
const initialState: WorkflowExecutionState = {
    executions: {},
    activeTaskIds: [],
    globalLoading: false,
    globalError: null,
}

// 创建 slice
const workflowExecutionSlice = createSlice({
    name: 'workflowExecution',
    initialState,
    reducers: {
        // 初始化工作流执行
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

            // 如果工作流执行信息不存在，先初始化
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

            // 添加WorkflowExecutionMessage对象到数组
            state.executions[taskId].messages.push(message)
        },

        // 清空指定工作流的消息
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

        // 设置工作流加载状态
        setExecutionLoading: (
            state,
            action: PayloadAction<{ taskId: string; loading: boolean }>
        ) => {
            const { taskId, loading } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].loading = loading
            }
        },

        // 设置工作流错误
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

        // 移除工作流执行记录
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

        // 批量更新工作流状态
        updateExecutionStatus: (
            state,
            action: PayloadAction<{
                taskId: string
                status: WorkflowExecutionStatus
                endTime?: number
            }>
        ) => {
            const { taskId, status, endTime } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].status = status
                if (endTime) {
                    state.executions[taskId].endTime = endTime
                }

                // 如果工作流结束，从活跃列表中移除
                if (status === 'completed' || status === 'error' || status === 'cancelled') {
                    const index = state.activeTaskIds.indexOf(taskId)
                    if (index > -1) {
                        state.activeTaskIds.splice(index, 1)
                    }
                    state.executions[taskId].loading = false
                }
            }
        },

        // 清理已完成的工作流（保留最近N个）
        cleanupCompletedExecutions: (state, action: PayloadAction<{ keepCount?: number }>) => {
            const { keepCount = 10 } = action.payload
            const completedExecutions = Object.values(state.executions)
                .filter(exec => exec.status === 'completed' || exec.status === 'error')
                .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))

            // 保留最近的N个已完成工作流，删除其余的
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
} = workflowExecutionSlice.actions

// 选择器
export const selectWorkflowExecution = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution

// 获取所有工作流执行信息
export const selectAllExecutions = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution.executions

// 获取指定工作流的执行信息
export const selectExecutionByTaskId =
    (taskId: string) => (state: { workflowExecution: WorkflowExecutionState }) =>
        state.workflowExecution.executions[taskId]

// 获取指定工作流的消息列表
export const selectExecutionMessages =
    (taskId: string) => (state: { workflowExecution: WorkflowExecutionState }) =>
        state.workflowExecution.executions[taskId]?.messages || []

// 获取活跃的工作流任务ID列表
export const selectActiveTaskIds = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution.activeTaskIds

// 获取全局状态
export const selectGlobalLoading = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution.globalLoading

export const selectGlobalError = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution.globalError

// 检查是否有工作流正在运行
export const selectHasActiveWorkflows = (state: { workflowExecution: WorkflowExecutionState }) =>
    state.workflowExecution.activeTaskIds.length > 0

// 获取工作流数量统计
export const selectWorkflowStats = (state: { workflowExecution: WorkflowExecutionState }) => {
    const executions = state.workflowExecution.executions
    const total = Object.keys(executions).length
    const active = state.workflowExecution.activeTaskIds.length
    const completed = Object.values(executions).filter(exec => exec.status === 'completed').length
    const failed = Object.values(executions).filter(exec => exec.status === 'error').length

    return { total, active, completed, failed }
}

// 导出 reducer
export default workflowExecutionSlice.reducer
