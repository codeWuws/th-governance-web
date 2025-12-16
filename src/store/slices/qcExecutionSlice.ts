/**
 * 质控流程执行详情 Redux Slice
 * 管理质控流程执行过程中的实时SSE消息数据
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// 质控流程节点信息
export interface QCNode {
    /** 节点ID */
    id: number
    /** 节点名称 */
    nodeName: string
    /** 节点类型 */
    nodeType: string
    /** 节点步骤序号 */
    nodeStep: number
    /** 是否启用 */
    enabled: boolean
    /** 是否自动执行 */
    isAuto: boolean
    /** 节点描述 */
    descript: string
}

// 质控流程执行消息类型（从SSE接收的原始消息）
export interface QCExecutionMessage {
    /** 任务ID */
    taskId: string | number
    /** 表数量 */
    tableQuantity?: number
    /** 节点信息 */
    node?: QCNode
    /** 执行状态：running | start | end | completed */
    executionStatus?: string
    /** 进度百分比 */
    progress?: number
    /** 已完成数量 */
    completedQuantity?: number
    /** 表标识 */
    table?: string
    /** 步骤状态：0未执行, 1执行中, 2已完成, 3暂停, 4跳过, 5失败 */
    status?: number
    /** 表名称 */
    tableName?: string
    // 允许其他未知字段，保持向后兼容
    [key: string]: unknown
}

// 单个质控流程执行信息
export interface QCExecutionInfo {
    taskId: string
    messages: QCExecutionMessage[] // SSE消息数组
    startTime: number
    lastUpdateTime: number
}

// 质控流程执行详情状态
export interface QCExecutionState {
    // 按taskId组织的质控流程执行信息
    executions: Record<string, QCExecutionInfo>
    // 当前活跃的质控流程taskId列表
    activeTaskIds: string[]
}

// 初始状态
const initialState: QCExecutionState = {
    executions: {},
    activeTaskIds: [],
}

// 创建 slice
const qcExecutionSlice = createSlice({
    name: 'qcExecution',
    initialState,
    reducers: {
        // 初始化质控流程执行
        initializeQCExecution: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload

            if (!state.executions[taskId]) {
                state.executions[taskId] = {
                    taskId,
                    messages: [],
                    startTime: Date.now(),
                    lastUpdateTime: Date.now(),
                }

                // 添加到活跃任务列表
                if (!state.activeTaskIds.includes(taskId)) {
                    state.activeTaskIds.push(taskId)
                }
            }
        },

        // 添加执行消息（按taskId分组）
        addQCMessage: (
            state,
            action: PayloadAction<{ taskId: string; message: QCExecutionMessage }>
        ) => {
            const { taskId, message } = action.payload

            // 如果质控流程执行信息不存在，先初始化
            if (!state.executions[taskId]) {
                state.executions[taskId] = {
                    taskId,
                    messages: [],
                    startTime: Date.now(),
                    lastUpdateTime: Date.now(),
                }

                if (!state.activeTaskIds.includes(taskId)) {
                    state.activeTaskIds.push(taskId)
                }
            }

            // 添加消息到数组
            state.executions[taskId].messages.push(message)
            state.executions[taskId].lastUpdateTime = Date.now()
        },

        // 清空指定质控流程的消息
        clearQCMessages: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload
            if (state.executions[taskId]) {
                state.executions[taskId].messages = []
                state.executions[taskId].lastUpdateTime = Date.now()
            }
        },

        // 清空所有消息
        clearAllQCMessages: state => {
            Object.keys(state.executions).forEach(taskId => {
                state.executions[taskId].messages = []
                state.executions[taskId].lastUpdateTime = Date.now()
            })
        },

        // 移除质控流程执行记录
        removeQCExecution: (state, action: PayloadAction<{ taskId: string }>) => {
            const { taskId } = action.payload
            delete state.executions[taskId]

            const index = state.activeTaskIds.indexOf(taskId)
            if (index > -1) {
                state.activeTaskIds.splice(index, 1)
            }
        },
    },
})

// 导出 actions
export const {
    initializeQCExecution,
    addQCMessage,
    clearQCMessages,
    clearAllQCMessages,
    removeQCExecution,
} = qcExecutionSlice.actions

// 选择器
export const selectQCExecution = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution

// 获取所有质控流程执行信息
export const selectAllQCExecutions = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.executions

// 获取指定质控流程的执行信息
export const selectQCExecutionByTaskId =
    (taskId: string) => (state: { qcExecution: QCExecutionState }) =>
        state.qcExecution.executions[taskId]

// 获取指定质控流程的消息列表
export const selectQCMessages =
    (taskId: string) => (state: { qcExecution: QCExecutionState }) =>
        state.qcExecution.executions[taskId]?.messages || []

// 获取活跃的质控流程任务ID列表
export const selectActiveQCTaskIds = (state: { qcExecution: QCExecutionState }) =>
    state.qcExecution.activeTaskIds

// 导出 reducer
export default qcExecutionSlice.reducer

