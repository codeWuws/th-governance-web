/**
 * 数据检索模块类型定义
 */

// 基础数据类型
export interface PatientRecord {
    id: string
    patientId: string
    patientName: string
    gender: 'male' | 'female' | 'unknown'
    age: number
    // 入院日期（部分页面使用该字段）
    admissionDate?: string
    // 就诊日期（部分页面使用该字段）
    visitDate?: string
    department: string
    doctor: string
    diagnosis: string[]
    medications: Medication[]
    // 统一兼容术语：部分页面使用 surgeries 与 labResults
    procedures?: Procedure[]
    surgeries?: Procedure[]
    labTests?: LabTest[]
    labResults?: LabTest[]
    dataQuality: DataQuality
    createdAt: string
    updatedAt: string
}

export interface Medication {
    id: string
    name: string
    dosage: string
    frequency: string
    startDate: string
    endDate?: string
    status: 'active' | 'completed' | 'discontinued'
}

export interface Procedure {
    id: string
    name: string
    date: string
    type: 'surgery' | 'examination' | 'therapy'
    result?: string
    status: 'scheduled' | 'completed' | 'cancelled'
}

export interface LabTest {
    id: string
    name: string
    date: string
    result: string
    unit: string
    referenceRange: string
    status: 'normal' | 'abnormal' | 'critical'
}

export interface DataQuality {
    completeness: number // 0-100
    accuracy: number // 0-100
    consistency: number // 0-100
    timeliness: number // 0-100
    overall: number // 0-100
}

// 检索相关类型
export interface SearchRequest {
    query?: string // 全文检索关键词
    advancedFilters?: AdvancedFilter[]
    conditionTree?: ConditionNode
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AdvancedFilter {
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_equals'
    value: unknown
    valueType: 'string' | 'number' | 'date' | 'array' | 'select'
}

export interface ConditionNode {
    id: string
    type: 'AND' | 'OR' | 'NOT'
    conditions?: ConditionNode[]
    filter?: AdvancedFilter
}

export interface SearchResponse {
    records: PatientRecord[]
    total: number
    page: number
    pageSize: number
    aggregations: SearchAggregations
    searchTime: number
}

export interface SearchAggregations {
    gender: { [key: string]: number }
    ageGroups: { [key: string]: number }
    departments: { [key: string]: number }
    medications: { [key: string]: number }
    dataQuality: { [key: string]: number }
    diagnosis: { [key: string]: number }
}

// 统计分析类型
export interface StatisticalAnalysis {
    genderDistribution: GenderDistribution
    ageDistribution: AgeDistribution[]
    medicationUsage: MedicationUsage[]
    dataQualityMetrics: DataQualityMetrics
    diagnosisFrequency: DiagnosisFrequency[]
}

export interface GenderDistribution {
    male: number
    female: number
    unknown: number
    percentages: {
        male: number
        female: number
        unknown: number
    }
}

export interface AgeDistribution {
    group: string
    count: number
    percentage: number
}

export interface MedicationUsage {
    medication: string
    count: number
    frequency: number
}

export interface DataQualityMetrics {
    averageCompleteness: number
    averageAccuracy: number
    averageConsistency: number
    averageTimeliness: number
    overallAverage: number
}

export interface DiagnosisFrequency {
    diagnosis: string
    count: number
    percentage: number
}

// 可视化类型
export interface VisualizationData {
    timeline: TimelineEvent[]
    threeSixtyView: ThreeSixtyViewData
    charts: ChartData[]
}

export interface TimelineEvent {
    id: string
    date: string
    type: 'visit' | 'medication' | 'procedure' | 'lab_test'
    title: string
    description: string
    data: unknown
}

export interface ThreeSixtyViewData {
    patient: PatientRecord
    summary: {
        totalVisits: number
        totalMedications: number
        totalProcedures: number
        totalLabTests: number
    }
    recentActivities: TimelineEvent[]
}

export interface ChartData {
    type: 'line' | 'bar' | 'pie' | 'scatter'
    title: string
    data: unknown[]
    config: unknown
}

// 通用医疗事件类型（可用于时间轴与时序数据的统一事件表示）
export interface MedicalEvent {
    id: string
    type: 'diagnosis' | 'medication' | 'surgery' | 'lab' | 'procedure' | 'vital'
    title: string
    description?: string
    timestamp: string // ISO 日期字符串
    data?: unknown // 复杂结构按需扩展
}

// 精确化请求类型，避免页面与服务层使用 any
export interface AdvancedSearchRequest extends SearchRequest {
    advancedFilters: AdvancedFilter[]
}

export interface ConditionTreeRequest extends SearchRequest {
    conditionTree: ConditionNode
}

// 时序数据类型，供可视化时序图使用
export interface TimeSeriesData {
    timestamp: string // ISO 日期字符串
    value: number
    type: string // 指标类型，如 blood_pressure、heart_rate 等
    category?: string // 分类标签，用于分组/着色
    seriesId?: string // 系列标识，用于多序列图表
    unit?: string // 单位信息（如 bpm、mmHg）
}

// 可视化配置项，供 VisualizationView 使用
export interface VisualizationConfig {
    showDiagnosis: boolean
    showMedications: boolean
    showSurgeries: boolean
    showLabResults: boolean
    showProcedures: boolean
    showVitalSigns: boolean
    chartColors: string[]
    timeRange: '1month' | '3months' | '6months' | '1year' | 'all'
}

// 枚举定义
export enum SearchType {
    FULL_TEXT = 'full_text',
    ADVANCED = 'advanced',
    CONDITION_TREE = 'condition_tree',
}

export enum DataType {
    PATIENT = 'patient',
    MEDICATION = 'medication',
    PROCEDURE = 'procedure',
    LAB_TEST = 'lab_test',
}
