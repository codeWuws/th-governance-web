/**
 * 数据检索服务层
 * 提供全文检索、高级检索、条件树检索等API服务
 * 支持统计分析、患者数据获取、时序数据获取等功能
 */

import {
    SearchRequest,
    SearchResponse,
    PatientRecord,
    StatisticalAnalysis,
    SearchAggregations,
    TimeSeriesData,
    AdvancedSearchRequest,
    ConditionTreeRequest,
    VisualizationConfig,
    SearchType,
} from '../types'
import { request } from '../../../utils/request'
import {
    generateMockPatient,
    generateMockPatients,
    generateMockSearchResponse,
    generateMockStatisticalAnalysis,
    generateMockTimeSeriesData,
} from '../utils/mock'

// 是否启用数据检索的模拟数据。
// 生产环境应关闭，仅在开发/联调场景下打开，用于保证页面可交互。
const USE_MOCK = (import.meta as any).env?.VITE_APP_USE_MOCK_DATA_RETRIEVAL === 'true'

// API基础路径
const API_BASE = '/api/v1/data-retrieval'

/**
 * 数据检索服务类
 */
export class DataRetrievalService {
    /**
     * 通用检索入口，根据 SearchType 选择对应检索接口
     * 统一返回 { data: SearchResponse } 以适配页面 useApi 调用形态
     */
    async search(
        searchRequest: SearchRequest,
        type: SearchType
    ): Promise<{ data: SearchResponse }> {
        try {
            let resp: SearchResponse
            switch (type) {
                case 'full_text':
                    resp = await this.fullTextSearch(
                        searchRequest.query || '',
                        searchRequest.page || 1,
                        searchRequest.pageSize || 10
                    )
                    break
                case 'advanced':
                    resp = await this.advancedSearch(
                        searchRequest as unknown as AdvancedSearchRequest
                    )
                    break
                case 'condition_tree':
                    resp = await this.conditionTreeSearch(
                        searchRequest as unknown as ConditionTreeRequest
                    )
                    break
                default:
                    resp = await this.fullTextSearch(
                        searchRequest.query || '',
                        searchRequest.page || 1,
                        searchRequest.pageSize || 10
                    )
            }
            return { data: resp }
        } catch (error) {
            console.error('统一检索接口失败:', error)
            if (USE_MOCK) {
                const count = searchRequest.pageSize || 10
                const mock = generateMockSearchResponse(count)
                const total = Math.max(100, count * 5)
                return {
                    data: { ...mock, page: searchRequest.page || 1, pageSize: count, total },
                }
            }
            throw error
        }
    }
    /**
     * 全文检索
     * @param query 搜索查询
     * @param page 页码
     * @param size 每页大小
     * @returns 搜索结果
     */
    async fullTextSearch(
        query: string,
        page: number = 1,
        size: number = 10
    ): Promise<SearchResponse> {
        try {
            const response = await request.get(`${API_BASE}/search/fulltext`, {
                params: {
                    q: query,
                    page,
                    size,
                },
            })
            return response.data
        } catch (error) {
            console.error('全文检索失败:', error)
            if (USE_MOCK) {
                const mock = generateMockSearchResponse(size)
                return { ...mock, page, pageSize: size, total: Math.max(100, size * 5) }
            }
            throw error
        }
    }

    /**
     * 高级检索
     * @param request 高级搜索请求
     * @returns 搜索结果
     */
    async advancedSearch(payload: AdvancedSearchRequest): Promise<SearchResponse> {
        try {
            const response = await request.post(`${API_BASE}/search/advanced`, payload)
            return response.data
        } catch (error) {
            console.error('高级检索失败:', error)
            if (USE_MOCK) {
                const size = (payload as any)?.pageSize || 10
                const page = (payload as any)?.page || 1
                const mock = generateMockSearchResponse(size)
                return { ...mock, page, pageSize: size, total: Math.max(100, size * 5) }
            }
            throw error
        }
    }

    /**
     * 条件树检索
     * @param request 条件树搜索请求
     * @returns 搜索结果
     */
    async conditionTreeSearch(payload: ConditionTreeRequest): Promise<SearchResponse> {
        try {
            const response = await request.post(`${API_BASE}/search/condition-tree`, payload)
            return response.data
        } catch (error) {
            console.error('条件树检索失败:', error)
            if (USE_MOCK) {
                const size = (payload as any)?.pageSize || 10
                const page = (payload as any)?.page || 1
                const mock = generateMockSearchResponse(size)
                return { ...mock, page, pageSize: size, total: Math.max(100, size * 5) }
            }
            throw error
        }
    }

    /**
     * 获取统计分析数据
     * @param filters 筛选条件
     * @returns 统计分析结果
     */
    async getStatisticalAnalysis(filters: {
        timeRange?: string[]
        department?: string
        searchQuery?: string
    }): Promise<{
        analysis: StatisticalAnalysis
        aggregations: SearchAggregations
    }> {
        try {
            const response = await request.get(`${API_BASE}/analysis/statistics`, {
                params: filters,
            })
            return response.data
        } catch (error) {
            // 错误处理：记录后回退到模拟数据（在允许的情况下）。
            console.error('获取统计分析失败:', error)
            if (USE_MOCK) {
                const mockList = generateMockPatients(30)
                return generateMockStatisticalAnalysis(mockList)
            }
            throw error
        }
    }

    /**
     * 获取患者详细信息
     * @param patientId 患者ID
     * @returns 患者详细信息
     */
    async getPatientDetail(patientId: string): Promise<{
        data: PatientRecord
    }> {
        try {
            const response = await request.get(`${API_BASE}/patient/${patientId}`)
            return response.data
        } catch (error) {
            // 错误处理：记录后回退到模拟数据（在允许的情况下）。
            console.error('获取患者详情失败:', error)
            if (USE_MOCK) {
                return { data: generateMockPatient(Number(patientId) || 1) }
            }
            throw error
        }
    }

    /**
     * 获取患者时序数据
     * @param patientId 患者ID
     * @param params 查询参数
     * @returns 时序数据
     */
    async getPatientTimeSeriesData(
        patientId: string,
        params: {
            startDate: string
            endDate: string
            eventTypes: string[]
        }
    ): Promise<TimeSeriesData[]> {
        try {
            const response = await request.get(`${API_BASE}/patient/${patientId}/timeseries`, {
                params,
            })
            return response.data
        } catch (error) {
            // 错误处理：记录后回退到模拟数据（在允许的情况下）。
            console.error('获取时序数据失败:', error)
            if (USE_MOCK) {
                return generateMockTimeSeriesData(90)
            }
            throw error
        }
    }

    /**
     * 获取搜索建议
     * @param query 查询关键词
     * @returns 搜索建议列表
     */
    async getSearchSuggestions(query: string): Promise<string[]> {
        try {
            const response = await request.get(`${API_BASE}/search/suggestions`, {
                params: { q: query },
            })
            return response.data
        } catch (error) {
            console.error('获取搜索建议失败:', error)
            // 在启用模拟数据时，根据聚合结果生成建议，保证输入联想可用
            if (USE_MOCK) {
                const mock = generateMockSearchResponse(30)
                const candidates = [
                    ...Object.keys(mock.aggregations.diagnosis || {}),
                    ...Object.keys(mock.aggregations.medications || {}),
                    ...Object.keys(mock.aggregations.departments || {}),
                ]
                const deduped = Array.from(new Set(candidates))
                const filtered = query
                    ? deduped.filter(k => k.toLowerCase().includes(String(query).toLowerCase()))
                    : deduped
                return filtered.slice(0, 10)
            }
            return []
        }
    }

    /**
     * 获取聚合统计信息
     * @param query 查询条件
     * @returns 聚合统计结果
     */
    async getAggregations(query?: string): Promise<SearchAggregations> {
        try {
            const response = await request.get(`${API_BASE}/search/aggregations`, {
                params: { q: query },
            })
            return response.data
        } catch (error) {
            console.error('获取聚合统计失败:', error)
            if (USE_MOCK) {
                // 使用模拟搜索响应中的聚合数据作为替代
                const mock = generateMockSearchResponse(50)
                return mock.aggregations
            }
            throw error
        }
    }

    /**
     * 导出搜索结果
     * @param searchParams 搜索参数
     * @param format 导出格式
     * @returns 导出文件URL
     */
    async exportSearchResults(
        searchParams: SearchRequest,
        format: 'csv' | 'json' | 'xlsx' = 'csv'
    ): Promise<string> {
        try {
            const response = await request.post(`${API_BASE}/export/${format}`, searchParams, {
                responseType: 'blob',
            })

            // 创建下载链接
            const blob = new Blob([response.data], {
                type:
                    format === 'csv'
                        ? 'text/csv'
                        : format === 'json'
                          ? 'application/json'
                          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            const url = window.URL.createObjectURL(blob)
            return url
        } catch (error) {
            console.error('导出搜索结果失败:', error)
            if (USE_MOCK) {
                // 基于模拟数据生成导出内容，保证导出功能可用
                const count = Math.max(20, searchParams.pageSize || 20)
                const mock = generateMockSearchResponse(count)
                if (format === 'json') {
                    const blob = new Blob([JSON.stringify(mock.records, null, 2)], {
                        type: 'application/json',
                    })
                    return window.URL.createObjectURL(blob)
                }
                // 简化的CSV导出：仅导出核心字段
                const header = [
                    'id',
                    'patientId',
                    'patientName',
                    'gender',
                    'age',
                    'department',
                    'diagnosisCount',
                    'medicationCount',
                    'qualityOverall',
                ]
                const rows = mock.records.map(r =>
                    [
                        r.id,
                        r.patientId,
                        r.patientName,
                        r.gender,
                        r.age,
                        r.department,
                        (r.diagnosis || []).length,
                        (r.medications || []).length,
                        r.dataQuality?.overall ?? 0,
                    ].join(',')
                )
                const csv = [header.join(','), ...rows].join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                return window.URL.createObjectURL(blob)
            }
            throw error
        }
    }

    /**
     * 批量获取患者数据
     * @param patientIds 患者ID列表
     * @returns 患者数据列表
     */
    async batchGetPatients(patientIds: string[]): Promise<PatientRecord[]> {
        try {
            const response = await request.post(`${API_BASE}/patient/batch`, {
                patientIds,
            })
            return response.data
        } catch (error) {
            console.error('批量获取患者数据失败:', error)
            if (USE_MOCK) {
                return (patientIds || []).map((id, idx) =>
                    generateMockPatient(Number(id) || idx + 1)
                )
            }
            throw error
        }
    }

    /**
     * 获取数据质量报告
     * @param patientId 患者ID
     * @returns 数据质量报告
     */
    async getDataQualityReport(patientId: string): Promise<{
        completeness: number
        accuracy: number
        consistency: number
        timeliness: number
        overall: number
        details: any[]
    }> {
        try {
            const response = await request.get(`${API_BASE}/patient/${patientId}/quality`)
            return response.data
        } catch (error) {
            console.error('获取数据质量报告失败:', error)
            if (USE_MOCK) {
                const mock = generateMockPatient(Number(patientId) || 1)
                const q = mock.dataQuality || {
                    completeness: 85,
                    accuracy: 82,
                    consistency: 80,
                    timeliness: 78,
                    overall: 81,
                }
                return {
                    completeness: q.completeness,
                    accuracy: q.accuracy,
                    consistency: q.consistency,
                    timeliness: q.timeliness,
                    overall: q.overall,
                    details: [
                        { field: '基本信息', score: q.completeness, issues: [] },
                        { field: '诊断记录', score: q.accuracy, issues: [] },
                        { field: '用药记录', score: q.consistency, issues: [] },
                        { field: '时效性', score: q.timeliness, issues: [] },
                    ],
                }
            }
            throw error
        }
    }

    /**
     * 获取可视化配置
     * @param configType 配置类型
     * @returns 可视化配置
     */
    async getVisualizationConfig(configType: string): Promise<VisualizationConfig> {
        try {
            const response = await request.get(`${API_BASE}/config/visualization`, {
                params: { type: configType },
            })
            return response.data
        } catch (error) {
            console.error('获取可视化配置失败:', error)
            if (USE_MOCK) {
                // 默认可视化配置，保障页面渲染
                return {
                    showDiagnosis: true,
                    showMedications: true,
                    showSurgeries: true,
                    showLabResults: true,
                    showProcedures: true,
                    showVitalSigns: true,
                    chartColors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1'],
                    timeRange: '3months',
                }
            }
            throw error
        }
    }

    /**
     * 保存可视化配置
     * @param config 配置对象
     * @returns 保存结果
     */
    async saveVisualizationConfig(config: VisualizationConfig): Promise<boolean> {
        try {
            const response = await request.post(`${API_BASE}/config/visualization`, config)
            return response.data.success
        } catch (error) {
            console.error('保存可视化配置失败:', error)
            if (USE_MOCK) {
                // 直接返回成功，模拟配置保存
                return true
            }
            throw error
        }
    }

    /**
     * 获取热门搜索关键词
     * @param limit 返回数量限制
     * @returns 热门关键词列表
     */
    async getHotKeywords(limit: number = 10): Promise<
        Array<{
            keyword: string
            count: number
            trend: 'up' | 'down' | 'stable'
        }>
    > {
        try {
            const response = await request.get(`${API_BASE}/search/hot-keywords`, {
                params: { limit },
            })
            return response.data
        } catch (error) {
            console.error('获取热门关键词失败:', error)
            if (USE_MOCK) {
                const mock = generateMockSearchResponse(60)
                const keys = [
                    ...Object.keys(mock.aggregations.diagnosis || {}),
                    ...Object.keys(mock.aggregations.medications || {}),
                    ...Object.keys(mock.aggregations.departments || {}),
                ]
                return keys.slice(0, limit).map((k, i) => ({
                    keyword: k,
                    count: Math.max(
                        10,
                        (mock.aggregations.diagnosis?.[k] ||
                            mock.aggregations.medications?.[k] ||
                            mock.aggregations.departments?.[k] ||
                            1) * 3
                    ),
                    trend: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : 'stable',
                }))
            }
            return []
        }
    }

    /**
     * 获取搜索历史
     * @param userId 用户ID
     * @param limit 返回数量限制
     * @returns 搜索历史列表
     */
    async getSearchHistory(userId: string, limit: number = 20): Promise<string[]> {
        try {
            const response = await request.get(`${API_BASE}/search/history`, {
                params: { userId, limit },
            })
            return response.data
        } catch (error) {
            console.error('获取搜索历史失败:', error)
            if (USE_MOCK) {
                const mock = generateMockSearchResponse(40)
                const queries = [
                    ...Object.keys(mock.aggregations.diagnosis || {}),
                    ...Object.keys(mock.aggregations.medications || {}),
                    ...Object.keys(mock.aggregations.departments || {}),
                ]
                return Array.from(new Set(queries)).slice(0, limit)
            }
            return []
        }
    }

    /**
     * 保存搜索历史
     * @param userId 用户ID
     * @param query 搜索查询
     * @returns 保存结果
     */
    async saveSearchHistory(userId: string, query: string): Promise<boolean> {
        try {
            const response = await request.post(`${API_BASE}/search/history`, {
                userId,
                query,
                timestamp: new Date().toISOString(),
            })
            return response.data.success
        } catch (error) {
            console.error('保存搜索历史失败:', error)
            if (USE_MOCK) {
                return !!query
            }
            return false
        }
    }

    /**
     * 获取相关患者
     * @param patientId 当前患者ID
     * @param similarityType 相似性类型
     * @param limit 返回数量限制
     * @returns 相关患者列表
     */
    async getRelatedPatients(
        patientId: string,
        similarityType: 'diagnosis' | 'medication' | 'demographics' = 'diagnosis',
        limit: number = 5
    ): Promise<PatientRecord[]> {
        try {
            const response = await request.get(`${API_BASE}/patient/${patientId}/related`, {
                params: { similarityType, limit },
            })
            return response.data
        } catch (error) {
            console.error('获取相关患者失败:', error)
            if (USE_MOCK) {
                return generateMockPatients(limit).filter(p => p.patientId !== patientId)
            }
            return []
        }
    }

    /**
     * 获取患者统计信息
     * @param filters 筛选条件
     * @returns 统计信息
     */
    async getPatientStatistics(filters: {
        department?: string
        dateRange?: string[]
        ageGroup?: string
    }): Promise<{
        totalPatients: number
        averageAge: number
        genderDistribution: { male: number; female: number; unknown: number }
        departmentDistribution: { [key: string]: number }
        monthlyTrend: Array<{ month: string; count: number }>
    }> {
        try {
            const response = await request.get(`${API_BASE}/statistics/patients`, {
                params: filters,
            })
            return response.data
        } catch (error) {
            console.error('获取患者统计信息失败:', error)
            if (USE_MOCK) {
                const list = generateMockPatients(100)
                const totalPatients = list.length
                const averageAge = Math.round(
                    list.reduce((s, p) => s + (p.age || 0), 0) / Math.max(1, totalPatients)
                )
                const genderDistribution = list.reduce(
                    (acc, p) => {
                        acc[p.gender] = (acc[p.gender] || 0) + 1
                        return acc
                    },
                    { male: 0, female: 0, unknown: 0 } as {
                        male: number
                        female: number
                        unknown: number
                    }
                )
                const departmentDistribution = list.reduce((acc: Record<string, number>, p) => {
                    acc[p.department] = (acc[p.department] || 0) + 1
                    return acc
                }, {})
                const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
                    month: `${i + 1}`.padStart(2, '0'),
                    count: Math.max(5, Math.round(totalPatients / 12) + ((i % 3) - 1) * 3),
                }))
                return {
                    totalPatients,
                    averageAge,
                    genderDistribution,
                    departmentDistribution,
                    monthlyTrend,
                }
            }
            throw error
        }
    }
}

// 创建服务实例
export const dataRetrievalService = new DataRetrievalService()
