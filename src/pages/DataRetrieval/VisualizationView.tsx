/**
 * 检索结果可视化查看页面
 * 提供360度视图和时序图等数据可视化查看能力
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Row,
    Col,
    Tabs,
    Spin,
    message,
    Empty,
    Button,
    Space,
    Select,
    DatePicker,
    Tag,
    Timeline,
    Statistic,
    Divider,
    Modal,
    Checkbox,
    Drawer,
} from 'antd'
import { uiMessage } from '@/utils/uiMessage'
import {
    EyeOutlined,
    ReloadOutlined,
    DownloadOutlined,
    SettingOutlined,
    CalendarOutlined,
    MedicineBoxOutlined,
    UserOutlined,
    FileTextOutlined,
    LineChartOutlined,
} from '@ant-design/icons'
import { useApi } from '@/hooks/useApi'
import { PatientRecord, TimeSeriesData, VisualizationConfig } from './types'
import { dataRetrievalService } from './services/dataRetrievalService'
import { useParams } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import moment from 'moment'
import { generateMockPatient, generateMockTimeSeriesData } from './utils/mock'
import './VisualizationView.scss'

const { TabPane } = Tabs
const { Option } = Select
const { RangePicker } = DatePicker

const COLORS = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#722ed1',
    '#13c2c2',
    '#eb2f96',
    '#fa8c16',
]
// 安全读取自定义环境变量，避免使用 any
const USE_MOCK =
    (import.meta as unknown as { env: Record<string, string> }).env
        ?.VITE_APP_USE_MOCK_DATA_RETRIEVAL === 'true'

interface TimelineEvent {
    id: string
    type: 'diagnosis' | 'medication' | 'surgery' | 'lab' | 'procedure'
    title: string
    description: string
    timestamp: string
    data: unknown
    color: string
    icon: React.ReactNode
}

const VisualizationView: React.FC = () => {
    const [patientData, setPatientData] = useState<PatientRecord | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<string>('360view')
    const [timeRange, setTimeRange] = useState<string[]>([])
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(['all'])
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
    const [chartType, setChartType] = useState<string>('line')
    const [configModalVisible, setConfigModalVisible] = useState<boolean>(false)
    const [visualizationConfig, setVisualizationConfig] = useState<VisualizationConfig>({
        showDiagnosis: true,
        showMedications: true,
        showSurgeries: true,
        showLabResults: true,
        showProcedures: true,
        showVitalSigns: true,
        chartColors: COLORS,
        timeRange: '1year',
    })
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false)

    const { id } = useParams<{ id: string }>()
    // 正确使用 useApi：传入具体的 API 函数，并显式标注返回与参数类型
    // 获取患者详情
    const { execute: execPatientDetail } = useApi<{ data: PatientRecord }, [string]>(
        dataRetrievalService.getPatientDetail,
        { immediate: false }
    )
    // 获取患者时序数据
    const { execute: execTimeSeries } = useApi<
        TimeSeriesData[],
        [
            string,
            {
                startDate: string
                endDate: string
                eventTypes: string[]
            },
        ]
    >(dataRetrievalService.getPatientTimeSeriesData, { immediate: false })

    // 加载患者数据（稳定引用，避免依赖抖动）
    const loadPatientData = useCallback(async () => {
        // 边界处理：无 id 时直接返回，避免不必要的请求与报错
        if (!id) {
            message.warning('缺少患者ID，无法加载患者数据')
            return
        }
        setLoading(true)
        try {
            const response = await execPatientDetail(id)

            if (response && response.data) {
                setPatientData(response.data)
                // 初始化时间范围
                if (!timeRange.length) {
                    setTimeRange([
                        moment().subtract(1, 'year').format('YYYY-MM-DD'),
                        moment().format('YYYY-MM-DD'),
                    ])
                }
            }
        } catch (err) {
            // 统一的错误处理：避免控制台噪音，向用户反馈
            console.error('加载患者数据失败:', err)
            uiMessage.handleSystemError('加载患者数据失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }, [execPatientDetail, id, timeRange.length])

    // 加载时序数据（稳定引用）
    const loadTimeSeriesData = useCallback(async () => {
        if (!id) return
        try {
            const response = await execTimeSeries(id, {
                startDate: timeRange[0],
                endDate: timeRange[1],
                eventTypes: selectedEventTypes.includes('all')
                    ? ['diagnosis', 'medication', 'surgery', 'lab', 'procedure']
                    : selectedEventTypes,
            })

            if (response && Array.isArray(response)) {
                setTimeSeriesData(response)
            }
        } catch (err) {
            console.error('加载时序数据失败:', err)
            uiMessage.handleSystemError('加载时序数据失败')
        }
    }, [execTimeSeries, id, timeRange, selectedEventTypes])

    // 处理时间轴事件（稳定引用）
    const processTimelineEvents = useCallback(() => {
        if (!patientData) return

        const events: TimelineEvent[] = []

        // 诊断事件
        if (visualizationConfig.showDiagnosis && patientData.diagnosis) {
            patientData.diagnosis.forEach((diag, index) => {
                events.push({
                    id: `diag-${index}`,
                    type: 'diagnosis',
                    title: '诊断',
                    description: diag,
                    timestamp: patientData.admissionDate,
                    data: { diagnosis: diag },
                    color: '#ff4d4f',
                    icon: <FileTextOutlined />,
                })
            })
        }

        // 用药事件
        if (visualizationConfig.showMedications && patientData.medications) {
            patientData.medications.forEach((med, index) => {
                events.push({
                    id: `med-${index}`,
                    type: 'medication',
                    title: '用药',
                    description: `${med.name} - ${med.dosage}`,
                    timestamp: med.startDate,
                    data: med,
                    color: '#1890ff',
                    icon: <MedicineBoxOutlined />,
                })
            })
        }

        // 手术事件
        if (visualizationConfig.showSurgeries && patientData.surgeries) {
            patientData.surgeries.forEach((surgery, index) => {
                events.push({
                    id: `surgery-${index}`,
                    type: 'surgery',
                    title: '手术',
                    description: surgery.name,
                    timestamp: surgery.date,
                    data: surgery,
                    color: '#faad14',
                    icon: <CalendarOutlined />,
                })
            })
        }

        // 检验检查事件
        if (visualizationConfig.showLabResults && patientData.labResults) {
            patientData.labResults.forEach((lab, index) => {
                const labMeta = lab as { name?: string; testName?: string }
                events.push({
                    id: `lab-${index}`,
                    type: 'lab',
                    title: '检验检查',
                    description: `${labMeta.name || labMeta.testName || '检验项目'}: ${lab.result}`,
                    timestamp: lab.date,
                    data: lab,
                    color: '#52c41a',
                    icon: <LineChartOutlined />,
                })
            })
        }

        // 按时间排序
        events.sort((a, b) => (moment(a.timestamp).isBefore(moment(b.timestamp)) ? -1 : 1))

        setTimelineEvents(events)
    }, [patientData, visualizationConfig])

    // 加载患者数据
    useEffect(() => {
        if (id) {
            loadPatientData()
        }
        // 未提供ID时的回退：开发/演示环境加载模拟患者
        if (!id && USE_MOCK && !patientData) {
            const mock = generateMockPatient(1)
            setPatientData(mock)
            if (!timeRange.length) {
                setTimeRange([
                    moment().subtract(1, 'year').format('YYYY-MM-DD'),
                    moment().format('YYYY-MM-DD'),
                ])
            }
            setTimeSeriesData(generateMockTimeSeriesData(90))
        }
    }, [id, USE_MOCK, patientData, timeRange.length, loadPatientData])

    // 处理时间范围变化
    useEffect(() => {
        if (patientData && timeRange.length === 2) {
            loadTimeSeriesData()
            processTimelineEvents()
        }
    }, [timeRange, patientData, selectedEventTypes, loadTimeSeriesData, processTimelineEvents])

    // 处理事件类型选择变化
    const handleEventTypeChange = (checkedValues: string[]) => {
        if (checkedValues.includes('all')) {
            setSelectedEventTypes(['all'])
        } else {
            setSelectedEventTypes(checkedValues)
        }
    }

    // 导出可视化数据
    const handleExportData = () => {
        if (!patientData) return

        const exportData = {
            patientInfo: patientData,
            timelineEvents,
            timeSeriesData,
            exportTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            config: visualizationConfig,
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

        const exportFileDefaultName = `patient_visualization_${patientData.patientId}_${moment().format('YYYYMMDDHHmmss')}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
    }

    // 刷新数据
    const handleRefresh = () => {
        loadPatientData()
        loadTimeSeriesData()
        processTimelineEvents()
    }

    // 事件类型标签与颜色映射（需在使用前定义以满足 ESLint）
    const getEventTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            diagnosis: '诊断',
            medication: '用药',
            surgery: '手术',
            lab: '检验检查',
            procedure: '治疗',
        }
        return labels[type] || type
    }

    const getEventTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            diagnosis: '#ff4d4f',
            medication: '#1890ff',
            surgery: '#faad14',
            lab: '#52c41a',
            procedure: '#722ed1',
        }
        return colors[type] || '#d9d9d9'
    }

    // 准备图表数据（用于ECharts）
    const prepareChartData = () => {
        if (!timeSeriesData.length) return []
        return timeSeriesData.map(item => ({
            date: moment(item.timestamp).format('MM-DD'),
            value: item.value,
            type: item.type,
            category: item.category,
        }))
    }

    // 准备分类数据
    const prepareCategoryData = () => {
        const categoryMap = new Map()

        timelineEvents.forEach(event => {
            const category = event.type
            if (categoryMap.has(category)) {
                categoryMap.set(category, categoryMap.get(category) + 1)
            } else {
                categoryMap.set(category, 1)
            }
        })

        return Array.from(categoryMap.entries()).map(([name, value]) => ({
            name: getEventTypeLabel(name),
            value,
            color: getEventTypeColor(name),
        }))
    }

    // 360度视图组件
    const render360View = () => (
        <div className='view-360'>
            <Row gutter={16}>
                {/* 患者基本信息 */}
                <Col span={8}>
                    <Card title='患者基本信息' className='info-card'>
                        <div className='patient-info'>
                            <div className='info-item'>
                                <UserOutlined className='info-icon' />
                                <div>
                                    <div className='info-label'>姓名</div>
                                    <div className='info-value'>{patientData?.patientName}</div>
                                </div>
                            </div>
                            <div className='info-item'>
                                <span className='info-icon'>ID</span>
                                <div>
                                    <div className='info-label'>患者ID</div>
                                    <div className='info-value'>{patientData?.patientId}</div>
                                </div>
                            </div>
                            <div className='info-item'>
                                <span className='info-icon'>性别</span>
                                <div>
                                    <div className='info-label'>性别</div>
                                    <div className='info-value'>
                                        <Tag
                                            color={patientData?.gender === 'male' ? 'blue' : 'pink'}
                                        >
                                            {patientData?.gender === 'male' ? '男' : '女'}
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                            <div className='info-item'>
                                <span className='info-icon'>年龄</span>
                                <div>
                                    <div className='info-label'>年龄</div>
                                    <div className='info-value'>{patientData?.age}岁</div>
                                </div>
                            </div>
                            <div className='info-item'>
                                <CalendarOutlined className='info-icon' />
                                <div>
                                    <div className='info-label'>入院日期</div>
                                    <div className='info-value'>{patientData?.admissionDate}</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* 诊断信息 */}
                <Col span={8}>
                    <Card title='诊断信息' className='diagnosis-card'>
                        <div className='diagnosis-list'>
                            {patientData?.diagnosis?.length ? (
                                patientData.diagnosis.map((diag, index) => (
                                    <div key={index} className='diagnosis-item'>
                                        <Tag color='red' className='diagnosis-tag'>
                                            {diag}
                                        </Tag>
                                    </div>
                                ))
                            ) : (
                                <Empty description='暂无诊断信息' />
                            )}
                        </div>
                    </Card>
                </Col>

                {/* 用药信息 */}
                <Col span={8}>
                    <Card title='当前用药' className='medication-card'>
                        <div className='medication-list'>
                            {patientData?.medications?.length ? (
                                patientData.medications.slice(0, 5).map((med, index) => (
                                    <div key={index} className='medication-item'>
                                        <MedicineBoxOutlined className='med-icon' />
                                        <div className='med-info'>
                                            <div className='med-name'>{med.name}</div>
                                            <div className='med-dosage'>{med.dosage}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <Empty description='暂无用药信息' />
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* 数据质量指标 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title='数据质量概览'>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title='数据完整度'
                                    value={patientData?.dataQuality?.completeness || 0}
                                    precision={1}
                                    suffix='%'
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title='数据准确性'
                                    value={patientData?.dataQuality?.accuracy || 0}
                                    precision={1}
                                    suffix='%'
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title='数据一致性'
                                    value={patientData?.dataQuality?.consistency || 0}
                                    precision={1}
                                    suffix='%'
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title='数据时效性'
                                    value={patientData?.dataQuality?.timeliness || 0}
                                    precision={1}
                                    suffix='%'
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* 事件分类统计 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                    <Card title='事件分类统计'>
                        {/* 使用ECharts饼图，可点击切换筛选 */}
                        <ReactECharts
                            style={{ width: '100%', height: 300 }}
                            option={{
                                tooltip: { trigger: 'item' },
                                legend: { orient: 'horizontal', bottom: 0 },
                                series: [
                                    {
                                        type: 'pie',
                                        radius: '60%',
                                        label: { formatter: '{b} {d}%' },
                                        data: prepareCategoryData().map(d => ({
                                            name: d.name,
                                            value: d.value,
                                            itemStyle: { color: d.color },
                                        })),
                                    },
                                ],
                            }}
                            onEvents={{
                                click: (params: any) => {
                                    // 点击饼图扇区时按类型筛选
                                    const name = params.name
                                    const reverseLabels: { [key: string]: string } = {
                                        诊断: 'diagnosis',
                                        用药: 'medication',
                                        手术: 'surgery',
                                        检验检查: 'lab',
                                        治疗: 'procedure',
                                    }
                                    const type = reverseLabels[name] || 'all'
                                    setSelectedEventTypes(type === 'all' ? ['all'] : [type])
                                },
                            }}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title='事件时间分布'>
                        {/* 使用ECharts柱状图 */}
                        <ReactECharts
                            style={{ width: '100%', height: 300 }}
                            option={{
                                tooltip: { trigger: 'axis' },
                                grid: { left: 40, right: 20, top: 20, bottom: 40 },
                                xAxis: {
                                    type: 'category',
                                    data: prepareCategoryData().map(d => d.name),
                                },
                                yAxis: { type: 'value' },
                                series: [
                                    {
                                        type: 'bar',
                                        data: prepareCategoryData().map(d => ({
                                            value: d.value,
                                            itemStyle: { color: d.color },
                                        })),
                                    },
                                ],
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    )

    // 时序图组件
    const renderTimeSeries = () => (
        <div className='time-series'>
            <Row gutter={16}>
                {/* 时间轴 */}
                <Col span={8}>
                    <Card title='医疗事件时间轴' className='timeline-card'>
                        <div className='timeline-container'>
                            <Timeline mode='left'>
                                {timelineEvents.map(event => (
                                    <Timeline.Item
                                        key={event.id}
                                        color={event.color}
                                        dot={event.icon}
                                        label={moment(event.timestamp).format('MM-DD HH:mm')}
                                    >
                                        <div className='timeline-content'>
                                            <div className='timeline-title'>{event.title}</div>
                                            <div className='timeline-description'>
                                                {event.description}
                                            </div>
                                            <div className='timeline-timestamp'>
                                                {moment(event.timestamp).format('YYYY-MM-DD HH:mm')}
                                            </div>
                                        </div>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </div>
                    </Card>
                </Col>

                {/* 时序图表 */}
                <Col span={16}>
                    <Card
                        title='时序数据可视化'
                        className='chart-card'
                        extra={
                            <Space>
                                <Select
                                    value={chartType}
                                    onChange={setChartType}
                                    style={{ width: 120 }}
                                >
                                    <Option value='line'>折线图</Option>
                                    <Option value='area'>面积图</Option>
                                    <Option value='bar'>柱状图</Option>
                                </Select>
                                <RangePicker
                                    value={
                                        timeRange.length === 2
                                            ? [moment(timeRange[0]), moment(timeRange[1])]
                                            : undefined
                                    }
                                    onChange={dates =>
                                        setTimeRange(
                                            dates
                                                ? dates.map(
                                                      date => date?.format('YYYY-MM-DD') || ''
                                                  )
                                                : []
                                        )
                                    }
                                    style={{ width: 240 }}
                                />
                            </Space>
                        }
                    >
                        {/* 使用ECharts绘制时序图，支持折线/面积/柱状切换 */}
                        {prepareChartData().length ? (
                            <ReactECharts
                                style={{ width: '100%', height: 400 }}
                                option={{
                                    tooltip: { trigger: 'axis' },
                                    toolbox: { feature: { saveAsImage: {}, dataZoom: {} } },
                                    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
                                    grid: { left: 40, right: 20, top: 30, bottom: 60 },
                                    xAxis: {
                                        type: 'category',
                                        data: prepareChartData().map(d => d.date),
                                    },
                                    yAxis: { type: 'value' },
                                    series: [
                                        chartType === 'line'
                                            ? {
                                                  type: 'line',
                                                  smooth: true,
                                                  symbol: 'circle',
                                                  symbolSize: 6,
                                                  lineStyle: { width: 2, color: '#1890ff' },
                                                  itemStyle: { color: '#1890ff' },
                                                  areaStyle: undefined,
                                                  data: prepareChartData().map(d => d.value),
                                              }
                                            : chartType === 'area'
                                              ? {
                                                    type: 'line',
                                                    smooth: true,
                                                    symbol: 'none',
                                                    lineStyle: { width: 2, color: '#1890ff' },
                                                    areaStyle: { color: 'rgba(24,144,255,0.3)' },
                                                    data: prepareChartData().map(d => d.value),
                                                }
                                              : {
                                                    type: 'bar',
                                                    itemStyle: { color: '#1890ff' },
                                                    data: prepareChartData().map(d => d.value),
                                                },
                                    ],
                                }}
                            />
                        ) : (
                            <Empty description='暂无时序数据' />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* 事件类型筛选 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title='事件类型筛选'>
                        <Checkbox.Group
                            value={selectedEventTypes}
                            onChange={handleEventTypeChange}
                            style={{ width: '100%' }}
                        >
                            <Row>
                                <Col span={4}>
                                    <Checkbox value='all'>全部</Checkbox>
                                </Col>
                                <Col span={4}>
                                    <Checkbox value='diagnosis'>诊断</Checkbox>
                                </Col>
                                <Col span={4}>
                                    <Checkbox value='medication'>用药</Checkbox>
                                </Col>
                                <Col span={4}>
                                    <Checkbox value='surgery'>手术</Checkbox>
                                </Col>
                                <Col span={4}>
                                    <Checkbox value='lab'>检验检查</Checkbox>
                                </Col>
                                <Col span={4}>
                                    <Checkbox value='procedure'>治疗</Checkbox>
                                </Col>
                            </Row>
                        </Checkbox.Group>
                    </Card>
                </Col>
            </Row>
        </div>
    )

    return (
        <div className='visualization-view-container'>
            <div className='header-actions'>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                        刷新
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExportData}>
                        导出
                    </Button>
                    <Button icon={<SettingOutlined />} onClick={() => setConfigModalVisible(true)}>
                        配置
                    </Button>
                    <Button icon={<EyeOutlined />} onClick={() => setDrawerVisible(true)}>
                        详细信息
                    </Button>
                </Space>
            </div>

            <Spin spinning={loading}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} className='visualization-tabs'>
                    <TabPane tab='360度视图' key='360view'>
                        {render360View()}
                    </TabPane>
                    <TabPane tab='时序图' key='timeseries'>
                        {renderTimeSeries()}
                    </TabPane>
                </Tabs>
            </Spin>

            {/* 配置模态框 */}
            <Modal
                title='可视化配置'
                visible={configModalVisible}
                onOk={() => setConfigModalVisible(false)}
                onCancel={() => setConfigModalVisible(false)}
                width={600}
            >
                <div className='config-form'>
                    <div className='config-section'>
                        <h4>显示选项</h4>
                        <Checkbox
                            checked={visualizationConfig.showDiagnosis}
                            onChange={e =>
                                setVisualizationConfig({
                                    ...visualizationConfig,
                                    showDiagnosis: e.target.checked,
                                })
                            }
                        >
                            显示诊断信息
                        </Checkbox>
                        <Checkbox
                            checked={visualizationConfig.showMedications}
                            onChange={e =>
                                setVisualizationConfig({
                                    ...visualizationConfig,
                                    showMedications: e.target.checked,
                                })
                            }
                        >
                            显示用药信息
                        </Checkbox>
                        <Checkbox
                            checked={visualizationConfig.showSurgeries}
                            onChange={e =>
                                setVisualizationConfig({
                                    ...visualizationConfig,
                                    showSurgeries: e.target.checked,
                                })
                            }
                        >
                            显示手术信息
                        </Checkbox>
                        <Checkbox
                            checked={visualizationConfig.showLabResults}
                            onChange={e =>
                                setVisualizationConfig({
                                    ...visualizationConfig,
                                    showLabResults: e.target.checked,
                                })
                            }
                        >
                            显示检验检查结果
                        </Checkbox>
                    </div>
                    <div className='config-section'>
                        <h4>时间范围</h4>
                        <Select
                            value={visualizationConfig.timeRange}
                            onChange={value =>
                                setVisualizationConfig({
                                    ...visualizationConfig,
                                    timeRange: value,
                                })
                            }
                            style={{ width: '100%' }}
                        >
                            <Option value='1month'>最近1个月</Option>
                            <Option value='3months'>最近3个月</Option>
                            <Option value='6months'>最近6个月</Option>
                            <Option value='1year'>最近1年</Option>
                            <Option value='all'>全部</Option>
                        </Select>
                    </div>
                </div>
            </Modal>

            {/* 详细信息抽屉 */}
            <Drawer
                title='患者详细信息'
                placement='right'
                width={800}
                onClose={() => setDrawerVisible(false)}
                visible={drawerVisible}
            >
                {patientData && (
                    <div className='patient-detail-drawer'>
                        <div className='detail-section'>
                            <h4>基本信息</h4>
                            <p>
                                <strong>姓名:</strong> {patientData.patientName}
                            </p>
                            <p>
                                <strong>ID:</strong> {patientData.patientId}
                            </p>
                            <p>
                                <strong>性别:</strong> {patientData.gender === 'male' ? '男' : '女'}
                            </p>
                            <p>
                                <strong>年龄:</strong> {patientData.age}岁
                            </p>
                            <p>
                                <strong>入院日期:</strong> {patientData.admissionDate}
                            </p>
                        </div>
                        <Divider />
                        <div className='detail-section'>
                            <h4>诊断详情</h4>
                            {patientData.diagnosis.map((diag, index) => (
                                <p key={index}>
                                    {index + 1}. {diag}
                                </p>
                            ))}
                        </div>
                        <Divider />
                        <div className='detail-section'>
                            <h4>用药详情</h4>
                            {patientData.medications.map((med, index) => (
                                <div key={index}>
                                    <p>
                                        <strong>药物名称:</strong> {med.name}
                                    </p>
                                    <p>
                                        <strong>剂量:</strong> {med.dosage}
                                    </p>
                                    <p>
                                        <strong>开始时间:</strong> {med.startDate}
                                    </p>
                                    {med.endDate && (
                                        <p>
                                            <strong>结束时间:</strong> {med.endDate}
                                        </p>
                                    )}
                                    <br />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    )
}

export default VisualizationView
