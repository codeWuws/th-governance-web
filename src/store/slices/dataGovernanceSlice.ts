import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { WorkflowNode } from '@/types'
import { workflowService } from '@/services/workflowService'

// 连接测试错误接口
interface ConnectionTestError {
    connectionId: string
    status: 'error'
    lastTestTime: string
}

// 数据库连接接口
export interface DatabaseConnection {
    id: string
    name: string
    type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver'
    host: string
    port: number
    database: string
    username: string
    status: 'connected' | 'disconnected' | 'error'
    createTime: string
    lastTestTime: string
}

// 统计数据接口
export interface StatisticData {
    totalTables: number
    processedTables: number
    totalRecords: number
    cleanedRecords: number
    duplicateRecords: number
    errorRecords: number
}

// 状态接口
interface DataGovernanceState {
    connections: DatabaseConnection[]
    statistics: StatisticData
    workflowConfig: WorkflowNode[]
    workflowLoading: boolean
    loading: boolean
    error: string | null
}

// 初始状态
const initialState: DataGovernanceState = {
    connections: [
        {
            id: '1',
            name: 'HIS主数据库',
            type: 'mysql',
            host: '192.168.1.100',
            port: 3306,
            database: 'his_main',
            username: 'his_user',
            status: 'connected',
            createTime: '2024-01-10 09:00:00',
            lastTestTime: '2024-01-15 16:30:00',
        },
        {
            id: '2',
            name: 'LIS检验系统',
            type: 'oracle',
            host: '192.168.1.101',
            port: 1521,
            database: 'lis_db',
            username: 'lis_user',
            status: 'connected',
            createTime: '2024-01-10 10:30:00',
            lastTestTime: '2024-01-15 15:45:00',
        },
        {
            id: '3',
            name: 'PACS影像系统',
            type: 'postgresql',
            host: '192.168.1.102',
            port: 5432,
            database: 'pacs_db',
            username: 'pacs_user',
            status: 'error',
            createTime: '2024-01-10 11:15:00',
            lastTestTime: '2024-01-15 14:20:00',
        },
    ],
    statistics: {
        totalTables: 40,
        processedTables: 32,
        totalRecords: 1250000,
        cleanedRecords: 1180000,
        duplicateRecords: 45000,
        errorRecords: 25000,
    },
    workflowConfig: [
        {
            id: 1,
            nodeName: '数据清洗',
            nodeType: 'DataCleansing',
            nodeStep: 1,
            enabled: true,
            isAuto: false,
            descript:
                '脏数据主要是数据值域内包含了一些无效字符、特殊字符、过渡态的拼接符等。脏数据处理是通过清洗函数等工程手段，在固定环节调用，将数据装载到ODS数据中心的过程。',
        },
        {
            id: 2,
            nodeName: '数据去重',
            nodeType: 'DataDeduplication',
            nodeStep: 2,
            enabled: true,
            isAuto: false,
            descript: 'PK完全相同的某一条数据，或者某部分数据。',
        },
        {
            id: 3,
            nodeName: '类型转换',
            nodeType: 'DataTransform',
            nodeStep: 3,
            enabled: true,
            isAuto: false,
            descript: '将string类型转化为模型中约束的类型的过程。',
        },
        {
            id: 4,
            nodeName: '标准对照',
            nodeType: 'StandardMapping',
            nodeStep: 4,
            enabled: true,
            isAuto: false,
            descript: '对多源数据依据标准字典对照，及对数据清洗成标准字典的一系列过程。',
        },
        {
            id: 5,
            nodeName: 'EMPI定义发放',
            nodeType: 'EMPIDefinitionDistribution',
            nodeStep: 5,
            enabled: true,
            isAuto: false,
            descript:
                '将同一个区域医院中同一个患者的多个患者号进行标记识别，合并患者，统一发布患者唯一主索引。',
        },
        {
            id: 6,
            nodeName: 'EMOI定义发放',
            nodeType: 'EMOIDefinitionDistribution',
            nodeStep: 6,
            enabled: true,
            isAuto: false,
            descript:
                '将同一个区域同一个患者的多次就诊号进行标记识别，根据就诊时间标明检查检验所属就诊时间，统一发布检查检验就诊唯一主索引。',
        },
        {
            id: 7,
            nodeName: '数据归一',
            nodeType: 'DataStandardization',
            nodeStep: 7,
            enabled: true,
            isAuto: false,
            descript:
                '数据格式标准化的一种，基于国家规定，将所需数据进行标准归一，定义所有数据标准格式和标准值。',
        },
        {
            id: 8,
            nodeName: '丢孤儿',
            nodeType: 'DataDeduplication',
            nodeStep: 8,
            enabled: true,
            isAuto: false,
            descript:
                '数据中无法与主表有任何关联的数据，可能是系统上线前测试或违规操作产生，无使用价值。',
        },
        {
            id: 9,
            nodeName: '数据脱敏',
            nodeType: 'DataDesensitization',
            nodeStep: 9,
            enabled: true,
            isAuto: false,
            descript: '出于数据安全考虑，对数据中的关键字段进行脱敏处理。',
        },
    ],
    workflowLoading: false,
    loading: false,
    error: null,
}

// 异步操作：获取工作流配置
export const fetchWorkflowConfig = createAsyncThunk(
    'dataGovernance/fetchWorkflowConfig',
    async (_, { rejectWithValue }) => {
        try {
            // 响应拦截器已处理业务异常，直接返回data字段（WorkflowNode[]）
            const response = await workflowService.getWorkflowConfig();
            return response
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '获取工作流配置失败'
            return rejectWithValue(errorMessage)
        }
    }
)

// 异步操作：更新工作流配置
export const updateWorkflowConfig = createAsyncThunk(
    'dataGovernance/updateWorkflowConfig',
    async (
        updates: Array<{ id: number; enabled?: boolean; is_auto?: boolean }>,
        { rejectWithValue, dispatch }
    ) => {
        try {
            await workflowService.updateWorkflowConfig(updates)
            // 更新成功后重新获取数据
            dispatch(fetchWorkflowConfig())
            return updates
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '更新工作流配置失败'
            return rejectWithValue(errorMessage)
        }
    }
)

// 异步操作：测试数据库连接
export const testConnection = createAsyncThunk(
    'dataGovernance/testConnection',
    async (connectionId: string, { rejectWithValue }) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 2000))
            const success = Math.random() > 0.3 // 70% 成功率

            if (!success) {
                throw new Error('连接测试失败')
            }

            return {
                connectionId,
                status: 'connected' as const,
                lastTestTime: new Date().toLocaleString('zh-CN'),
            }
        } catch {
            return rejectWithValue({
                connectionId,
                status: 'error' as const,
                lastTestTime: new Date().toLocaleString('zh-CN'),
            })
        }
    }
)

// 创建 slice
const dataGovernanceSlice = createSlice({
    name: 'dataGovernance',
    initialState,
    reducers: {
        // 更新工作流配置（本地状态）
        updateWorkflowConfigLocal: (
            state,
            action: PayloadAction<{ id: number; enabled?: boolean; isAuto?: boolean }>
        ) => {
            const { id, enabled, isAuto } = action.payload
            const node = state.workflowConfig.find(n => n.id === id)
            if (node) {
                if (enabled !== undefined) {
                    node.enabled = enabled
                    // 如果禁用步骤，同时禁用自动流转
                    if (!enabled) {
                        node.isAuto = false
                    }
                }
                if (isAuto !== undefined) {
                    node.isAuto = isAuto
                }
            }
        },

        // 设置工作流配置
        setWorkflowConfig: (state, action: PayloadAction<WorkflowNode[]>) => {
            state.workflowConfig = action.payload
        },

        // 添加数据库连接
        addConnection: (
            state,
            action: PayloadAction<
                Omit<DatabaseConnection, 'id' | 'createTime' | 'lastTestTime' | 'status'>
            >
        ) => {
            const newConnection: DatabaseConnection = {
                ...action.payload,
                id: Date.now().toString(),
                status: 'disconnected',
                createTime: new Date().toLocaleString('zh-CN'),
                lastTestTime: '-',
            }
            state.connections.push(newConnection)
        },

        // 更新数据库连接
        updateConnection: (state, action: PayloadAction<DatabaseConnection>) => {
            const index = state.connections.findIndex(conn => conn.id === action.payload.id)
            if (index !== -1) {
                state.connections[index] = action.payload
            }
        },

        // 删除数据库连接
        removeConnection: (state, action: PayloadAction<string>) => {
            state.connections = state.connections.filter(conn => conn.id !== action.payload)
        },

        // 更新统计数据
        updateStatistics: (state, action: PayloadAction<Partial<StatisticData>>) => {
            state.statistics = { ...state.statistics, ...action.payload }
        },

        // 清除错误
        clearError: state => {
            state.error = null
        },
    },
    extraReducers: builder => {
        builder
            // 获取工作流配置
            .addCase(fetchWorkflowConfig.pending, state => {
                state.workflowLoading = true
                state.error = null
            })
            .addCase(fetchWorkflowConfig.fulfilled, (state, action) => {
                state.workflowLoading = false
                // 为了防止后端返回空数据或非数组，进行健壮性处理
                // 当响应的 data 为 null/undefined 或非数组时，回退为空数组，避免前端运行时异常
                state.workflowConfig = Array.isArray(action.payload) ? action.payload : []
            })
            .addCase(fetchWorkflowConfig.rejected, (state, action) => {
                state.workflowLoading = false
                state.error = action.payload as string
            })

            // 更新工作流配置
            .addCase(updateWorkflowConfig.pending, state => {
                state.workflowLoading = true
                state.error = null
            })
            .addCase(updateWorkflowConfig.fulfilled, state => {
                state.workflowLoading = false
            })
            .addCase(updateWorkflowConfig.rejected, (state, action) => {
                state.workflowLoading = false
                state.error = action.payload as string
            })

            // 测试连接
            .addCase(testConnection.pending, state => {
                state.loading = true
            })
            .addCase(testConnection.fulfilled, (state, action) => {
                state.loading = false
                const { connectionId, status, lastTestTime } = action.payload
                const connection = state.connections.find(conn => conn.id === connectionId)
                if (connection) {
                    connection.status = status
                    connection.lastTestTime = lastTestTime
                }
            })
            .addCase(testConnection.rejected, (state, action) => {
                state.loading = false
                const payload = action.payload as ConnectionTestError
                const connection = state.connections.find(conn => conn.id === payload.connectionId)
                if (connection) {
                    connection.status = payload.status
                    connection.lastTestTime = payload.lastTestTime
                }
            })
    },
})

// 导出 actions
export const {
    updateWorkflowConfigLocal,
    setWorkflowConfig,
    addConnection,
    updateConnection,
    removeConnection,
    updateStatistics,
    clearError,
} = dataGovernanceSlice.actions

// 导出 reducer
export default dataGovernanceSlice.reducer
