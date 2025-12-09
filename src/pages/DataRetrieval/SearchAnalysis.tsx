/**
 * 检索结果分析页面
 * 提供检索条件的性别、年龄、用药、数据质量等统计分析能力
 * 以及病历查看和患者数据查看功能
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tag,
    Space,
    Button,
    Select,
    DatePicker,
    Spin,
    message,
    Empty,
    Tabs,
    Progress,
} from 'antd'
import {
    BarChartOutlined,
    PieChartOutlined,
    LineChartOutlined,
    EyeOutlined,
    ReloadOutlined,
    FilterOutlined,
} from '@ant-design/icons'
import { useApi } from '../../hooks/useApi'
import { StatisticalAnalysis, PatientRecord, SearchAggregations, SearchType } from './types'
import { dataRetrievalService } from './services/dataRetrievalService'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import moment from 'moment'
import './SearchAnalysis.scss'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

// 颜色常量在本页未使用，移除以减少未使用变量的 ESLint 报错

const SearchAnalysis: React.FC = () => {
    const [analysisData, setAnalysisData] = useState<StatisticalAnalysis | null>(null)
    const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
    const [aggregations, setAggregations] = useState<SearchAggregations | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [selectedTimeRange, setSelectedTimeRange] = useState<string[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    const [activeTab, setActiveTab] = useState<string>('overview')

    const navigate = useNavigate()
    const location = useLocation()
    // 统一从环境获取 mock 开关
    const USE_MOCK = (import.meta as any)?.env?.VITE_APP_USE_MOCK_DATA_RETRIEVAL === 'true'
    // 正确使用 useApi：传入具体的 API 函数，执行时只传参数
    const { execute: execAnalysis } = useApi(dataRetrievalService.getStatisticalAnalysis, {
        immediate: false,
    })
    const { execute: execSearch } = useApi(dataRetrievalService.search as unknown as any, {
        immediate: false,
    })

    // 执行分析（使用 useCallback 保持稳定引用，避免依赖不稳定导致的重复执行）
    const performAnalysis = useCallback(async () => {
        setLoading(true)
        try {
            const result = await execAnalysis({
                timeRange: selectedTimeRange,
                department: selectedDepartment,
            })
            if (result) {
                setAnalysisData(result.analysis)
                setAggregations(result.aggregations)
            }
        } catch (err) {
            console.error('分析失败:', err)
            message.error('数据分析失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }, [selectedTimeRange, selectedDepartment, execAnalysis])

    // 加载默认分析数据
    const loadDefaultAnalysis = useCallback(async () => {
        setLoading(true)
        try {
            const result = await execAnalysis({})
            if (result) {
                setAnalysisData(result.analysis)
                setAggregations(result.aggregations)
            }
        } catch (err) {
            console.error('默认分析失败:', err)
        } finally {
            setLoading(false)
        }
    }, [execAnalysis])

    // 默认加载检索结果（mock 环境）
    const loadDefaultSearchResults = useCallback(async () => {
        try {
            const resp = await execSearch(
                {
                    query: '示例',
                    page: 1,
                    pageSize: 20,
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                },
                SearchType.FULL_TEXT
            )
            if (resp && resp.data) {
                setSearchResults(resp.data.records || [])
            }
        } catch (err) {
            console.error('默认检索数据加载失败:', err)
        }
    }, [execSearch])

    // 从路由状态获取搜索参数
    useEffect(() => {
        if (location.state?.searchQuery || location.state?.searchResults) {
            if (location.state?.searchResults) {
                setSearchResults(location.state.searchResults)
            }
            // 执行分析
            performAnalysis()
        } else {
            // 默认加载一些数据
            loadDefaultAnalysis()
            // 当没有传入搜索结果时，默认加载一份 mock 检索结果，便于概览统计展示
            if (USE_MOCK && searchResults.length === 0) {
                loadDefaultSearchResults()
            }
        }
        // 将依赖补充完整以满足 exhaustive-deps 要求，同时保证函数引用稳定
    }, [
        location,
        USE_MOCK,
        searchResults.length,
        performAnalysis,
        loadDefaultAnalysis,
        loadDefaultSearchResults,
    ])

    // 处理筛选条件变化
    const handleFilterChange = () => {
        performAnalysis()
    }

    // 重置筛选
    const handleResetFilter = () => {
        setSelectedTimeRange([])
        setSelectedDepartment('')
        performAnalysis()
    }

    // 查看患者详情
    const handleViewPatient = (record: PatientRecord) => {
        navigate(`/data-retrieval/visualization/${record.id}`)
    }


    // 表格列定义
    const columns = [
        {
            title: '患者信息',
            dataIndex: 'patientName',
            key: 'patientName',
            width: 150,
            render: (text: string, record: PatientRecord) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.patientId}</div>
                </div>
            ),
        },
        {
            title: '基本信息',
            dataIndex: 'gender',
            key: 'basicInfo',
            width: 100,
            render: (gender: string, record: PatientRecord) => (
                <div>
                    <Tag
                        color={
                            gender === 'male' ? 'blue' : gender === 'female' ? 'pink' : 'default'
                        }
                    >
                        {gender === 'male' ? '男' : gender === 'female' ? '女' : '未知'}
                    </Tag>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.age}岁</div>
                </div>
            ),
        },
        {
            title: '诊断',
            dataIndex: 'diagnosis',
            key: 'diagnosis',
            width: 200,
            render: (diagnosis: string[]) => (
                <div>
                    {diagnosis.slice(0, 2).map((d, index) => (
                        <Tag key={index} color='red' style={{ marginBottom: '4px' }}>
                            {d}
                        </Tag>
                    ))}
                    {diagnosis.length > 2 && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                            +{diagnosis.length - 2} 更多
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: '用药',
            dataIndex: 'medications',
            key: 'medications',
            width: 150,
            render: (medications: any[]) => (
                <div>
                    {medications.slice(0, 3).map((med, index) => (
                        <div key={index} style={{ fontSize: '12px' }}>
                            {med.name}
                        </div>
                    ))}
                    {medications.length > 3 && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                            +{medications.length - 3} 更多
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: '数据质量',
            dataIndex: 'dataQuality',
            key: 'dataQuality',
            width: 120,
            render: (dataQuality: any) => (
                <div>
                    <Progress
                        percent={dataQuality.overall}
                        size='small'
                        strokeColor={
                            dataQuality.overall >= 80
                                ? '#52c41a'
                                : dataQuality.overall >= 60
                                  ? '#faad14'
                                  : '#ff4d4f'
                        }
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        完整度: {dataQuality.completeness.toFixed(1)}
                    </div>
                </div>
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 100,
            fixed: 'right' as const,
            render: (record: PatientRecord) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handleViewPatient(record)}
                    >
                        查看
                    </Button>
                </Space>
            ),
        },
    ]

    // 准备图表数据
    const prepareAgeDistributionData = () => {
        if (!analysisData?.ageDistribution) return []
        return analysisData.ageDistribution.map(item => ({
            name: item.group,
            count: item.count,
            percentage: item.percentage,
        }))
    }

    const prepareMedicationData = () => {
        if (!analysisData?.medicationUsage) return []
        return analysisData.medicationUsage.slice(0, 10).map(item => ({
            name: item.medication,
            count: item.count,
            frequency: item.frequency,
        }))
    }

    const prepareGenderData = () => {
        if (!analysisData?.genderDistribution) return []
        return [
            { name: '男', value: analysisData.genderDistribution.male, color: '#1890ff' },
            { name: '女', value: analysisData.genderDistribution.female, color: '#ff4d8f' },
            { name: '未知', value: analysisData.genderDistribution.unknown, color: '#d9d9d9' },
        ]
    }

    const prepareDiagnosisData = () => {
        if (!analysisData?.diagnosisFrequency) return []
        return analysisData.diagnosisFrequency
            .slice(0, 10)
            .map(item => ({ name: item.diagnosis, count: item.count, percentage: item.percentage }))
    }

    const prepareDepartmentData = () => {
        if (!aggregations?.departments) return []
        const list = Object.entries(aggregations.departments).map(([dept, cnt]) => ({
            name: dept,
            count: cnt as number,
        }))
        return list.sort((a, b) => b.count - a.count).slice(0, 10)
    }

    const prepareQualityDistribution = () => {
        if (!aggregations?.dataQuality) return []
        const dq = aggregations.dataQuality
        return [
            { name: '高', value: dq.high || dq['高'] || 0, color: '#52c41a' },
            { name: '中', value: dq.medium || dq['中'] || 0, color: '#faad14' },
            { name: '低', value: dq.low || dq['低'] || 0, color: '#ff4d4f' },
        ]
    }

    // 使用 useMemo 以减少重复计算，优化渲染性能
    const genderOption = useMemo(
        () => ({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [
                {
                    type: 'pie',
                    radius: '60%',
                    label: { formatter: '{b} {d}%' },
                    data: prepareGenderData().map(d => ({
                        name: d.name,
                        value: d.value,
                        itemStyle: { color: d.color },
                    })),
                },
            ],
        }),
        [analysisData]
    )

    const ageOption = useMemo(
        () => ({
            tooltip: { trigger: 'axis' },
            grid: { left: 40, right: 20, top: 20, bottom: 40 },
            xAxis: { type: 'category', data: prepareAgeDistributionData().map(d => d.name) },
            yAxis: { type: 'value' },
            series: [
                {
                    type: 'bar',
                    data: prepareAgeDistributionData().map(d => d.count),
                    itemStyle: { color: '#1890ff' },
                },
            ],
        }),
        [analysisData]
    )

    const diagnosisOption = useMemo(
        () => ({
            tooltip: { trigger: 'axis' },
            grid: { left: 100, right: 20, top: 20, bottom: 60 },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: prepareDiagnosisData().map(d => d.name) },
            series: [
                {
                    type: 'bar',
                    data: prepareDiagnosisData().map(d => d.count),
                    itemStyle: { color: '#f5222d' },
                },
            ],
        }),
        [analysisData]
    )

    const departmentOption = useMemo(
        () => ({
            tooltip: { trigger: 'axis' },
            grid: { left: 100, right: 20, top: 20, bottom: 60 },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: prepareDepartmentData().map(d => d.name) },
            series: [
                {
                    type: 'bar',
                    data: prepareDepartmentData().map(d => d.count),
                    itemStyle: { color: '#13c2c2' },
                },
            ],
        }),
        [aggregations]
    )

    const qualityOption = useMemo(
        () => ({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [
                {
                    type: 'pie',
                    radius: '60%',
                    label: { formatter: '{b} {d}%' },
                    data: prepareQualityDistribution().map(d => ({
                        name: d.name,
                        value: d.value,
                        itemStyle: { color: d.color },
                    })),
                },
            ],
        }),
        [aggregations]
    )

    return (
        <div className='search-analysis-container'>
            <Card className='filter-card' size='small'>
                <Row gutter={16} align='middle'>
                    <Col span={6}>
                        <span>时间范围：</span>
                        <RangePicker
                            value={
                                selectedTimeRange.length === 2
                                    ? [moment(selectedTimeRange[0]), moment(selectedTimeRange[1])]
                                    : undefined
                            }
                            onChange={dates =>
                                setSelectedTimeRange(
                                    dates ? dates.map(date => date?.format('YYYY-MM-DD') || '') : []
                                )
                            }
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={4}>
                        <span>科室：</span>
                        <Select
                            placeholder='选择科室'
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            <Option value='内科'>内科</Option>
                            <Option value='外科'>外科</Option>
                            <Option value='妇产科'>妇产科</Option>
                            <Option value='儿科'>儿科</Option>
                            <Option value='急诊科'>急诊科</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Space>
                            <Button
                                type='primary'
                                icon={<FilterOutlined />}
                                onClick={handleFilterChange}
                                loading={loading}
                            >
                                应用筛选
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
                                重置
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Spin spinning={loading}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} className='analysis-tabs'>
                    <TabPane tab='概览统计' key='overview'>
                        <div className='overview-section'>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title='总患者数'
                                            value={searchResults.length}
                                            prefix={<PieChartOutlined />}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title='平均数据质量'
                                            value={
                                                analysisData?.dataQualityMetrics?.overallAverage ||
                                                0
                                            }
                                            precision={1}
                                            suffix='分'
                                            prefix={<BarChartOutlined />}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title='男性比例'
                                            value={
                                                analysisData?.genderDistribution?.percentages
                                                    ?.male || 0
                                            }
                                            precision={1}
                                            suffix='%'
                                            prefix={<LineChartOutlined />}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title='女性比例'
                                            value={
                                                analysisData?.genderDistribution?.percentages
                                                    ?.female || 0
                                            }
                                            precision={1}
                                            suffix='%'
                                            prefix={<LineChartOutlined />}
                                            valueStyle={{ color: '#ff4d8f' }}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginTop: 16 }}>
                                <Col span={12}>
                                    <Card title='性别分布'>
                                        {prepareGenderData().length > 0 ? (
                                            <ReactECharts
                                                style={{ width: '100%', height: 300 }}
                                                option={genderOption}
                                            />
                                        ) : (
                                            <Empty description='暂无数据' />
                                        )}
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title='年龄分布'>
                                        {prepareAgeDistributionData().length > 0 ? (
                                            <ReactECharts
                                                style={{ width: '100%', height: 300 }}
                                                option={ageOption}
                                            />
                                        ) : (
                                            <Empty description='暂无数据' />
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginTop: 16 }}>
                                <Col span={12}>
                                    <Card title='诊断频次 Top10'>
                                        {prepareDiagnosisData().length > 0 ? (
                                            <ReactECharts
                                                style={{ width: '100%', height: 320 }}
                                                option={diagnosisOption}
                                            />
                                        ) : (
                                            <Empty description='暂无数据' />
                                        )}
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title='科室分布 Top10'>
                                        {prepareDepartmentData().length > 0 ? (
                                            <ReactECharts
                                                style={{ width: '100%', height: 320 }}
                                                option={departmentOption}
                                            />
                                        ) : (
                                            <Empty description='暂无数据' />
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginTop: 16 }}>
                                <Col span={12}>
                                    <Card title='数据质量分布'>
                                        {prepareQualityDistribution().length > 0 ? (
                                            <ReactECharts
                                                style={{ width: '100%', height: 300 }}
                                                option={qualityOption}
                                            />
                                        ) : (
                                            <Empty description='暂无数据' />
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </TabPane>

                    <TabPane tab='数据质量分析' key='quality'>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card title='数据质量指标'>
                                    {analysisData?.dataQualityMetrics && (
                                        <div className='quality-metrics'>
                                            <div className='metric-item'>
                                                <span>完整度</span>
                                                <Progress
                                                    percent={
                                                        analysisData.dataQualityMetrics
                                                            .averageCompleteness
                                                    }
                                                    strokeColor='#52c41a'
                                                />
                                            </div>
                                            <div className='metric-item'>
                                                <span>准确性</span>
                                                <Progress
                                                    percent={
                                                        analysisData.dataQualityMetrics
                                                            .averageAccuracy
                                                    }
                                                    strokeColor='#1890ff'
                                                />
                                            </div>
                                            <div className='metric-item'>
                                                <span>一致性</span>
                                                <Progress
                                                    percent={
                                                        analysisData.dataQualityMetrics
                                                            .averageConsistency
                                                    }
                                                    strokeColor='#faad14'
                                                />
                                            </div>
                                            <div className='metric-item'>
                                                <span>时效性</span>
                                                <Progress
                                                    percent={
                                                        analysisData.dataQualityMetrics
                                                            .averageTimeliness
                                                    }
                                                    strokeColor='#722ed1'
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title='用药分析'>
                                    <ReactECharts
                                        style={{ width: '100%', height: 300 }}
                                        option={{
                                            tooltip: { trigger: 'axis' },
                                            grid: { left: 100, right: 20, top: 20, bottom: 40 },
                                            xAxis: { type: 'value' },
                                            yAxis: {
                                                type: 'category',
                                                data: prepareMedicationData().map(d => d.name),
                                            },
                                            series: [
                                                {
                                                    type: 'bar',
                                                    data: prepareMedicationData().map(d => d.count),
                                                    itemStyle: { color: '#1890ff' },
                                                },
                                            ],
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab='详细数据' key='details'>
                        <Card title='患者列表'>
                            <Table
                                columns={columns}
                                dataSource={searchResults}
                                rowKey='id'
                                loading={loading}
                                pagination={{
                                    current: currentPage,
                                    pageSize,
                                    total: searchResults.length,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) =>
                                        `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                                    onChange: (page, size) => {
                                        setCurrentPage(page)
                                        if (size) setPageSize(size)
                                    },
                                }}
                                scroll={{ x: 1200 }}
                                locale={{
                                    emptyText: <Empty description='暂无数据' />,
                                }}
                            />
                        </Card>
                    </TabPane>
                </Tabs>
            </Spin>
        </div>
    )
}

export default SearchAnalysis
