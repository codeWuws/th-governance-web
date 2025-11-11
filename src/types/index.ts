// 全局类型定义
import type { ComponentType, ChangeEvent, MouseEvent, FormEvent } from 'react'

export interface ApiResponse<T = unknown> {
    success: boolean
    data: T
    message?: string
    code?: number
}

export interface PaginationParams {
    page: number
    pageSize: number
    total?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: PaginationParams
}

export interface User {
    id: string
    name: string
    email: string
    avatar?: string
    role: 'admin' | 'user' | 'guest'
    createdAt: string
    updatedAt: string
}

// Redux 相关类型定义
export interface CounterState {
    value: number
    step: number
    history: number[]
}

export interface UserState {
    currentUser: User | null
    users: User[]
    loading: boolean
    error: string | null
}

// Redux Store 类型 (从 store 导入)
export type { AppDispatch, RootState } from '../store'

export interface RouteConfig {
    path: string
    component: ComponentType
    exact?: boolean
    meta?: {
        title?: string
        requireAuth?: boolean
        roles?: string[]
    }
}

// 环境变量类型
export interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_API_BASE_URL: string
    readonly VITE_APP_ENV: 'development' | 'production' | 'test'
}

// 通用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 事件处理类型
export type EventHandler<T = Event> = (event: T) => void
export type ChangeHandler = EventHandler<ChangeEvent<HTMLInputElement>>
export type ClickHandler = EventHandler<MouseEvent<HTMLElement>>
export type SubmitHandler = EventHandler<FormEvent<HTMLFormElement>>

// 表单相关类型
export interface FormField {
    name: string
    label: string
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
    required?: boolean
    placeholder?: string
    options?: Array<{ label: string; value: string | number }>
}

export interface FormErrors {
    [key: string]: string | undefined
}

// HTTP 请求相关类型
export interface HttpResponse<T = unknown> {
    code: number
    message: string
    data: T
    success: boolean
    timestamp?: number
}

// 工作流详情响应类型
export interface WorkflowDetailResponse {
    code: number
    msg: string
    data: WorkflowDetailData
}

// 工作流详情数据类型
export interface WorkflowDetailData {
    log_id: number
    batch_id: number
    step_no: number
    step_status: number
    step_name: string
    details: string // JSON字符串，包含具体的执行详情
    create_time: string
    end_time: string
}

export interface HttpError {
    code: number
    message: string
    details?: unknown
    stack?: string
}

export interface RequestOptions {
    timeout?: number
    retries?: number
    skipErrorHandler?: boolean
    showLoading?: boolean
    headers?: Record<string, string>
}

// API 状态类型
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ApiState<T = unknown> {
    data: T | null
    loading: boolean
    error: string | null
    status: ApiStatus
}

// 分页请求类型
export interface PaginationRequest {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, unknown>
}

// 文件上传类型
export interface UploadFile {
    uid: string
    name: string
    status: 'uploading' | 'done' | 'error'
    url?: string
    percent?: number
    response?: unknown
    error?: unknown
}

export interface UploadOptions {
    accept?: string
    multiple?: boolean
    maxSize?: number
    maxCount?: number
    beforeUpload?: (file: File) => boolean | Promise<boolean>
    onProgress?: (percent: number, file: File) => void
    onSuccess?: (response: unknown, file: File) => void
    onError?: (error: unknown, file: File) => void
}

// ==================== 数据治理相关类型定义 ====================

// 数据治理操作结果类型
export interface DataGovernanceResult {
    code: number
    msg: string
}

/**
 * 工作流步骤日志详情
 */
export interface WorkflowStepLog {
    /** 日志ID */
    log_id: number
    /** 批次ID */
    batch_id: number
    /** 步骤序号 */
    step_no: number
    /** 步骤状态 （ 1-5：0未执行，1执行中，2已完成，3暂停，4跳过，5失败） */
    step_status: number
    /** 步骤名称 */
    step_name: string
    /** 详细信息 */
    details: string | null
    /** 创建时间 */
    create_time: string
    /** 结束时间 */
    end_time: string
    /** 更新时间 */
    update_time: string
    /** 是否启用 */
    enabled: boolean
    /** 是否自动执行 */
    is_auto: boolean
    /** 步骤节点类型 */
    node_type: string
    /** 已完成数量 (通过SSE动态更新) */
    completedQuantity?: number
    /** 总表数量 (通过SSE动态更新) */
    table_quantity?: number
    /** 描述信息 */
    descript?: string
}

/**
 * 工作流任务摘要信息
 */
export interface WorkflowLogSummary {
    /** 任务ID */
    id: number
    /** 批次ID */
    batch_id: number
    /** 任务名称 */
    name: string
    /** 任务状态 */
    status: number
    /** 开始时间 */
    start_time: string
    /** 结束时间 */
    end_time: string
    /** 节点类型 */
    node_type: string
}

/**
 * 工作流详情数据
 */
export interface WorkflowLogDetailData {
    /** 步骤日志列表 */
    logList: WorkflowStepLog[]
    /** 任务摘要信息 */
    logSummary: WorkflowLogSummary
}

/**
 * 工作流详情响应
 */
export interface WorkflowLogDetailResponse {
    /** 响应码 */
    code: number
    /** 响应消息 */
    msg: string
    /** 响应数据 */
    data: WorkflowLogDetailData
}

/**
 * 数据治理日志详情 (保持向后兼容)
 * @deprecated 请使用 WorkflowLogDetailResponse
 */
export interface DataGovernanceLog {
    /** 日志ID */
    id: string
    /** 操作类型 */
    operationType: string
    /** 操作描述 */
    description: string
    /** 操作状态 */
    status: 'success' | 'failed' | 'running'
    /** 开始时间 */
    startTime: string
    /** 结束时间 */
    endTime?: string
    /** 操作结果 */
    result?: DataGovernanceResult
    /** 错误信息 */
    errorMessage?: string
    /** 操作人员 */
    operator?: string
    /** 创建时间 */
    createTime: string
    /** 更新时间 */
    updateTime: string
}

// 日志分页查询参数
export interface LogPageParams extends PaginationParams {
    /** 操作类型筛选 */
    operationType?: string
    /** 状态筛选 */
    status?: 'success' | 'failed' | 'running'
    /** 开始时间 */
    startTime?: string
    /** 结束时间 */
    endTime?: string
    /** 操作人员 */
    operator?: string
}

// 日志分页响应
export type LogPageResponse = PaginatedResponse<DataGovernanceLog>

// 数据治理操作枚举
export const DataGovernanceOperation = {
    /** 清空数据、初始化 */
    INIT: 'init',
    /** 数据清洗、空格替换 */
    CLEAN_DATA_FIELDS: 'cleanDataFields',
    /** 数据去重 */
    DEDUPLICATE_DATA: 'deduplicateData',
    /** 标准对照 */
    APPLY_STANDARD_MAPPING: 'applyStandardMapping',
    /** EMPI 定义发放 */
    ASSIGN_EMPI: 'assignEmpi',
    /** EMOI 定义发放 */
    ASSIGN_EMOI: 'assignEmoi',
    /** 数据归一 */
    NORMALIZE_DATA: 'normalizeData',
    /** 丢孤 */
    REMOVE_ORPHAN_RECORDS: 'removeOrphanRecords',
    /** 数据脱敏 */
    MASK_SENSITIVE_DATA: 'maskSensitiveData',
    /** 同步数据 */
    SYNC: 'sync',
} as const

export type DataGovernanceOperation =
    (typeof DataGovernanceOperation)[keyof typeof DataGovernanceOperation]

// 数据库连接相关类型定义
export interface DbConnection {
    id: string
    connectionName: string
    dbType: string
    dbHost: string
    dbPort: string
    dbName: string
    dbUsername: string
    dbPassword: string
    dbStatus: number
    remark: string
    createUser: string
    createTime: string
}

export interface DbConnectionPageParams {
    pageNo: number
    pageSize: number
    dbType?: string
    dbStatus?: number
}

export interface DbConnectionPageData {
    pageNo: number
    pageSize: number
    total: number
    list: DbConnection[]
    statusStats: {
        abnormalCount: number
        connectedCount: number
        totalConnections: number
    }
}

export interface DbConnectionPageResponse {
    code: number
    msg: string
    data: DbConnectionPageData
}

// 工作流配置相关类型定义
export interface WorkflowNode {
    /** 节点ID */
    id: number
    /** 节点名称 */
    nodeName: string
    /** 节点类型 */
    nodeType: WorkflowNodeType
    /** 节点步骤序号 */
    nodeStep: number
    /** 是否启用 */
    enabled: boolean
    /** 是否自动执行 */
    isAuto: boolean
    /** 节点描述 */
    descript: string
}

/**
 * 工作流执行消息类型
 * 用于SSE推送的实时执行状态信息
 */
export interface WorkflowExecutionMessage {
    /** 表数量 */
    tableQuantity: number
    /** 节点信息 */
    node: {
        /** 节点ID */
        id: number
        /** 节点名称 */
        nodeName: string
        /** 节点类型 */
        nodeType: string
        /** 节点步骤 */
        nodeStep: number
        /** 是否启用 */
        enabled: boolean
        /** 是否自动执行 */
        isAuto: boolean
        /** 节点描述 */
        descript: string
    }
    /** 执行状态 */
    executionStatus: string
    /** 进度百分比 */
    progress: number
    /** 已完成数量 */
    completedQuantity: number
    /** 任务ID */
    taskId: number
    /** 状态码 */
    status: number
}

export interface WorkflowConfigResponse {
    /** 响应状态码 */
    code: number
    /** 响应消息 */
    msg: string
    /** 工作流节点配置数据 */
    data: WorkflowNode[]
}

// 工作流节点类型枚举
export const WorkflowNodeType = {
    /** 数据清洗 */
    DATA_CLEANSING: 'DataCleansing',
    /** 数据去重 */
    DATA_DEDUPLICATION: 'DataDeduplication',
    /** 数据转换 */
    DATA_TRANSFORM: 'dataTransform',
    /** 标准字典对照 */
    STANDARD_MAPPING: 'StandardMapping',
    /** EMPI发放 */
    EMPI_DEFINITION_DISTRIBUTION: 'EMPIDefinitionDistribution',
    /** EMOI发放 */
    EMOI_DEFINITION_DISTRIBUTION: 'EMOIDefinitionDistribution',
    /** 数据归一 */
    DATA_STANDARDIZATION: 'DataStandardization',
    /** 孤儿数据处理 */
    DATA_ORPHAN: 'DataOrphan',
    /** 数据脱敏 */
    DATA_DESENSITIZATION: 'DataDesensitization',
} as const

export type WorkflowNodeType = (typeof WorkflowNodeType)[keyof typeof WorkflowNodeType]

// 工作流配置更新相关类型
export interface WorkflowConfigUpdateItem {
    /** 工作流节点ID */
    id: number
    /** 是否启用 */
    enabled?: boolean
    /** 是否自动流转 */
    is_auto?: boolean
}

export interface WorkflowConfigUpdateRequest {
    /** 批量更新的配置项列表 */
    configs: WorkflowConfigUpdateItem[]
}

export interface WorkflowConfigUpdateResponse {
    /** 响应状态码 */
    code: number
    /** 响应消息 */
    msg: string
    /** 响应数据 */
    data?: boolean
}

// ==================== 执行历史日志相关类型定义 ====================

// （已移除）数据录入（同步）相关类型
// DataEntryRequest / DataEntryResult / DataEntryResponse

/** 执行历史日志项 */
export interface ExecutionLogItem {
    /** 任务ID */
    id: number
    /** 批次ID */
    batch_id: number
    /** 任务名称 */
    name: string
    /** 任务状态 */
    status: number
    /** 开始时间 */
    start_time: string
    /** 结束时间 */
    end_time?: string
    /** 节点类型 */
    node_type: string
}

/** 执行历史日志分页请求参数 */
export interface ExecutionLogPageParams {
    /** 页码，从1开始 */
    pageNo: number
    /** 每页数量 */
    pageSize: number
}

/** 执行历史日志分页数据 */
export interface ExecutionLogPageData {
    /** 总条数 */
    total: number
    /** 当前页数据列表 */
    list: ExecutionLogItem[]
}

/** 执行历史日志分页响应（后端返回包含 total 和 list 的对象） */
export interface ExecutionLogPageResponse {
    /** 响应状态码 */
    code: number
    /** 响应消息 */
    msg: string
    /** 分页数据对象 */
    data: ExecutionLogPageData
}

/** 步骤状态枚举 */
export const ExecutionStepStatus = {
    SUCCESS: 0,
    FAILED: 1,
    RUNNING: 2,
} as const

export type ExecutionStepStatus = (typeof ExecutionStepStatus)[keyof typeof ExecutionStepStatus]

/** 步骤状态标签映射 */
export const ExecutionStepStatusLabels = {
    [ExecutionStepStatus.SUCCESS]: '成功',
    [ExecutionStepStatus.FAILED]: '失败',
    [ExecutionStepStatus.RUNNING]: '进行中',
} as const

/** 步骤状态颜色映射 */
export const ExecutionStepStatusColors = {
    [ExecutionStepStatus.SUCCESS]: 'success',
    [ExecutionStepStatus.FAILED]: 'error',
    [ExecutionStepStatus.RUNNING]: 'processing',
} as const

// 详情字段解析后的类型定义

/** 数据重复检查详情 */
export interface DuplicateCheckDetails {
    table: string
    total: number
    problems: Array<{
        field: string
        total_count: number
        duplicate_groups: Array<{
            ids: string[]
            count: number
            value: string
        }>
    }>
}

/** 特殊字符检查详情 */
export interface SpecialCharCheckDetails {
    table: string
    total_count: number
    problem_fields: Array<{
        ids: string[]
        count: number
        field: string
        problem_type: string
    }>
}

/** 丢孤检查详情 */
export interface OrphanCheckDetails {
    table: string
    masterTable: string
    orphanCount: number
    orphanDetails: Array<{
        id: string
        fields: Record<string, string>
        reason: string
    }>
    relatedFields: string[]
}
