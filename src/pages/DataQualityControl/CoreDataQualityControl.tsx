import {
    AreaChartOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    HeartOutlined,
    SearchOutlined,
    TrophyOutlined,
    WarningOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { api, type SSEManager } from '@/utils/request'
import { store } from '@/store'
import { initializeQCExecution, addQCMessage } from '@/store/slices/qcExecutionSlice'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages } from '@/store/slices/qcExecutionSlice'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { AccuracyQCRecord } from '@/types'
import JsonToTable from '@/components/JsonToTable'
import { Spin } from 'antd'
import { isDemoVersion } from '@/utils/versionControl'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface CoreDataMetric {
    key: string
    dataType: string
    description: string
    totalRecords: number
    qualifiedRecords: number
    qualityScore: number
    issues: string[]
    trend: 'up' | 'down' | 'stable'
    status: 'excellent' | 'good' | 'warning' | 'poor'
}

interface ComparisonResult {
    key: string
    metric: string
    currentPeriod: number
    previousPeriod: number
    changeRate: number
    changeType: 'increase' | 'decrease' | 'stable'
    benchmark: number
    meetsBenchmark: boolean
}

interface CoreDataFormValues {
    dataType: string
    compareUnread: string
    dateRange: [dayjs.Dayjs, dayjs.Dayjs]
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const CoreDataQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [coreMetrics, setCoreMetrics] = useState<CoreDataMetric[]>([])
    const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([])
    const [overallStats, setOverallStats] = useState({
        totalDataTypes: 0,
        avgQualityScore: 0,
        excellentCount: 0,
        poorCount: 0,
        benchmarkMeetRate: 0,
    })
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [detailModalContent, setDetailModalContent] = useState<{
        title: string
        content: string
    } | null>(null)
    
    // 新增状态
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const sseManagerRef = useRef<SSEManager | null>(null)
    
    // 结果数据相关状态
    const [resultData, setResultData] = useState<AccuracyQCRecord[]>([])
    const [resultLoading, setResultLoading] = useState(false)
    const [resultPagination, setResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })
    
    // 从Redux获取SSE消息
    const qcMessages = useAppSelector(
        state => (currentTaskId ? selectQCMessages(currentTaskId)(state) : [])
    )

    // 监听SSE消息，更新进度
    useEffect(() => {
        if (qcMessages.length > 0) {
            const lastMessage = qcMessages[qcMessages.length - 1]
            // 更新进度
            if (lastMessage.progress !== undefined && lastMessage.progress !== null) {
                setProgress(Math.round(Number(lastMessage.progress)))
            }
            
            // 检查是否完成
            if (lastMessage.executionStatus === 'completed' || lastMessage.executionStatus === 'end') {
                // 延迟一下再提示，确保最后的消息已处理
                setTimeout(async () => {
                    uiMessage.success('准确性质控分析完成！')
                    logger.info('准确性质控分析完成')
                    
                    // 获取taskId并加载结果数据
                    const taskId = currentTaskId || (lastMessage.taskId ? String(lastMessage.taskId) : null)
                    if (taskId) {
                        await loadResultData(taskId, 1, 10)
                    }
                    
                    // 断开SSE连接
                    if (sseManagerRef.current) {
                        sseManagerRef.current.disconnect()
                        sseManagerRef.current = null
                    }
                    // 重置状态（保留taskId以便查看结果）
                    setLoading(false)
                    setProgress(0)
                    if (onAutoDone) {
                        onAutoDone()
                    }
                }, 500)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qcMessages, onAutoDone, currentTaskId])

    // 加载结果数据
    const loadResultData = async (taskId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setResultLoading(true)
            const response = await dataQualityControlService.getAccuracyQCPage({
                pageNum,
                pageSize,
                batchId: taskId,
            })
            
            if (response.code === 200 && response.data) {
                setResultData(response.data.records)
                setResultPagination({
                    current: Number(response.data.current),
                    pageSize: Number(response.data.size),
                    total: Number(response.data.total),
                })
                logger.info('准确性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取准确性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载准确性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('加载结果失败，请重试')
        } finally {
            setResultLoading(false)
        }
    }

    // 组件卸载时清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])

    // 数据类型选项
    const dataTypeOptions = [
        { label: '全部核心数据', value: 'all' },
        { label: '患者基础信息', value: 'patient_basic' },
        { label: '诊断信息', value: 'diagnosis' },
        { label: '手术信息', value: 'surgery' },
        { label: '用药信息', value: 'medication' },
        { label: '检验检查', value: 'lab_exam' },
        { label: '生命体征', value: 'vital_signs' },
        { label: '护理记录', value: 'nursing' },
    ]

    // 对比未读选项
    const compareUnreadOptions = [
        { label: '是', value: 'true' },
        { label: '否', value: 'false' },
    ]

    // 执行核心数据质控
    const handleCoreDataCheck = async (values: CoreDataFormValues) => {
        try {
            // 验证表单字段
            if (!values.dataType) {
                uiMessage.warning('请选择数据类型')
                return
            }
            if (!values.compareUnread) {
                uiMessage.warning('请选择是否对比未读数据')
                return
            }
            if (!values.dateRange || values.dateRange.length !== 2) {
                uiMessage.warning('请选择时间范围')
                return
            }

            setLoading(true)
            setProgress(0)

            // 将日期范围转换为字符串格式
            // sd: 开始时间（start date）
            // ed: 结束时间（end date）
            const sd = values.dateRange[0].format('YYYY-MM-DD')
            const ed = values.dateRange[1].format('YYYY-MM-DD')

            // 构建请求参数
            const requestParams = {
                dataType: values.dataType,
                compareUnread: values.compareUnread,
                sd: sd, // 开始时间
                ed: ed, // 结束时间
            }

            // 创建SSE连接
            try {
                const sseManager = api.createSSE({
                    url: '/data/qc/accuracyQc',
                    method: 'POST',
                    data: requestParams,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('准确性质控SSE连接已建立', requestParams)
                    },
                    onMessage: (event: MessageEvent) => {
                        console.log('=== SSE消息 ===', {
                            type: event.type,
                            data: event.data,
                            timestamp: new Date().toISOString(),
                        })
                        
                        // 尝试解析JSON数据
                        try {
                            const messageData = JSON.parse(event.data) as Record<string, unknown>
                            console.log('=== SSE消息内容（解析后）===', messageData)
                            logger.info('准确性质控SSE消息', messageData)
                            
                            // 从消息中提取taskId
                            let extractedTaskId: string | null = messageData.taskId as string | null
                            
                            // 如果没有taskId，尝试从其他字段获取
                            if (!extractedTaskId && messageData.id) {
                                extractedTaskId = String(messageData.id)
                            }

                            if (extractedTaskId) {
                                console.log('=== 提取到taskId ===', extractedTaskId)
                                
                                // 设置当前taskId
                                setCurrentTaskId(extractedTaskId)
                                
                                // 初始化质控流程执行（如果不存在）
                                const state = store.getState()
                                if (!state.qcExecution.executions[extractedTaskId]) {
                                    store.dispatch(initializeQCExecution({ taskId: extractedTaskId }))
                                    console.log('=== 初始化质控流程执行 ===', extractedTaskId)
                                }
                                
                                // 添加消息到Redux
                                store.dispatch(
                                    addQCMessage({
                                        taskId: extractedTaskId,
                                        message: messageData,
                                    })
                                )
                            } else {
                                console.warn('=== 未找到taskId，消息未存储 ===', messageData)
                            }
                        } catch (parseError) {
                            // 如果不是JSON格式，直接输出原始数据
                            console.log('=== SSE消息内容（原始）===', event.data)
                            logger.info('准确性质控SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('准确性质控SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.handleSystemError('准确性质控分析连接异常，请检查网络')
                        setLoading(false)
                        setCurrentTaskId(null)
                        setProgress(0)
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('准确性质控SSE连接已关闭')
                    },
                })

                // 保存SSE连接引用
                sseManagerRef.current = sseManager

                // 建立连接
                sseManager.connect()

                // 等待一小段时间确保连接建立
                await new Promise(resolve => setTimeout(resolve, 500))
                
            } catch (sseError) {
                logger.error('启动SSE连接失败:', sseError instanceof Error ? sseError : new Error(String(sseError)))
                console.error('=== 启动SSE连接失败 ===', sseError)
                uiMessage.handleSystemError('启动准确性质控分析连接失败，请稍后重试')
                setLoading(false)
                setCurrentTaskId(null)
                setProgress(0)
                throw sseError
            }
        } catch (error) {
            logger.error(
                '准确性质控分析失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.handleSystemError('准确性质控分析失败，请重试')
            setLoading(false)
            setCurrentTaskId(null)
            setProgress(0)
        }
    }

    const exportCsv = (rows: Record<string, unknown>[], filename: string) => {
        try {
            if (!rows || rows.length === 0) {
                uiMessage.warning('暂无可导出的数据')
                return
            }
            const firstRow = rows[0]
            if (!firstRow) {
                uiMessage.warning('暂无可导出的数据')
                return
            }
            const headers = Object.keys(firstRow)
            const escape = (val: unknown) => {
                const s = String(val ?? '')
                const needQuote = /[",\n]/.test(s)
                const escaped = s.replace(/"/g, '""')
                return needQuote ? `"${escaped}"` : escaped
            }
            const csv = [
                headers.join(','),
                ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
            ].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            window.URL.revokeObjectURL(url)
            uiMessage.success('导出成功')
        } catch (e) {
            logger.error('导出失败', e instanceof Error ? e : new Error(String(e)))
            uiMessage.handleSystemError('导出失败，请重试')
        }
    }

    const handleExportMetrics = () => {
        const rows = coreMetrics.map(m => ({
            dataType: m.dataType,
            totalRecords: m.totalRecords,
            qualifiedRecords: m.qualifiedRecords,
            qualityScore: m.qualityScore,
            trend: m.trend,
            status: m.status,
            issues: m.issues.join(' | '),
        }))
        exportCsv(rows, '核心数据质控_质量指标.csv')
    }

    const handleExportComparisons = () => {
        const rows = comparisonResults.map(c => ({
            metric: c.metric,
            currentPeriod: c.currentPeriod,
            previousPeriod: c.previousPeriod,
            changeRate: c.changeRate,
            changeType: c.changeType,
            benchmark: c.benchmark,
            meetsBenchmark: c.meetsBenchmark ? '是' : '否',
        }))
        exportCsv(rows, '核心数据质控_对比分析.csv')
    }

    // 自动启动逻辑已移除，因为需要用户选择数据类型、对比未读和时间范围

    // 核心数据指标表格列配置
    const metricsColumns: ColumnsType<CoreDataMetric> = [
        {
            title: '数据类型',
            dataIndex: 'dataType',
            key: 'dataType',
            width: 120,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            render: (text: string) => (
                <Text type='secondary' style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '总记录数',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 100,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '合格记录',
            dataIndex: 'qualifiedRecords',
            key: 'qualifiedRecords',
            width: 100,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '质量得分',
            dataIndex: 'qualityScore',
            key: 'qualityScore',
            width: 100,
            render: (score: number, record) => (
                <Space>
                    <Progress
                        type='circle'
                        size={40}
                        percent={score}
                        status={score >= 90 ? 'success' : score >= 70 ? 'active' : 'exception'}
                        format={() => `${score}%`}
                    />
                    {record.trend === 'up' && <span style={{ color: '#52c41a' }}>↗</span>}
                    {record.trend === 'down' && <span style={{ color: '#ff4d4f' }}>↘</span>}
                    {record.trend === 'stable' && <span style={{ color: '#1890ff' }}>→</span>}
                </Space>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => {
                const statusConfig = {
                    excellent: { color: '#52c41a', text: '优秀', icon: <TrophyOutlined /> },
                    good: { color: '#1890ff', text: '良好', icon: <CheckCircleOutlined /> },
                    warning: { color: '#faad14', text: '警告', icon: <WarningOutlined /> },
                    poor: { color: '#ff4d4f', text: '较差', icon: <ExclamationCircleOutlined /> },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return (
                    <span style={{ color: config.color }}>
                        {config.icon} {config.text}
                    </span>
                )
            },
        },
        {
            title: '主要问题',
            dataIndex: 'issues',
            key: 'issues',
            render: (issues: string[], record) => (
                <div>
                    {issues.slice(0, 2).map((issue, index) => (
                        <div key={index} style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                            • {issue}
                        </div>
                    ))}
                    <Button
                        type='link'
                        size='small'
                        onClick={() => {
                            setDetailModalContent({
                                title: record.dataType,
                                content: issues.join('\n'),
                            })
                            setDetailModalVisible(true)
                        }}
                    >
                        查看全部
                    </Button>
                </div>
            ),
        },
    ]

    // 对比分析表格列配置
    const comparisonColumns: ColumnsType<ComparisonResult> = [
        {
            title: '指标名称',
            dataIndex: 'metric',
            key: 'metric',
            width: 150,
        },
        {
            title: '当前周期',
            dataIndex: 'currentPeriod',
            key: 'currentPeriod',
            width: 100,
            render: (value: number) => `${value}%`,
        },
        {
            title: '上一周期',
            dataIndex: 'previousPeriod',
            key: 'previousPeriod',
            width: 100,
            render: (value: number) => `${value}%`,
        },
        {
            title: '变化',
            key: 'change',
            width: 100,
            render: (_, record) => {
                const { changeRate, changeType } = record
                const color =
                    changeType === 'increase'
                        ? '#52c41a'
                        : changeType === 'decrease'
                          ? '#ff4d4f'
                          : '#1890ff'
                const icon =
                    changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : '→'
                return (
                    <span style={{ color }}>
                        {icon} {Math.abs(changeRate)}%
                    </span>
                )
            },
        },
        {
            title: '行业基准',
            dataIndex: 'benchmark',
            key: 'benchmark',
            width: 100,
            render: (value: number) => `${value}%`,
        },
        {
            title: '达标情况',
            dataIndex: 'meetsBenchmark',
            key: 'meetsBenchmark',
            width: 100,
            render: (meets: boolean) => (
                <span style={{ color: meets ? '#52c41a' : '#ff4d4f' }}>
                    {meets ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                    {meets ? ' 达标' : ' 未达标'}
                </span>
            ),
        },
    ]

    return (
        <div>
            {/* 页面标题 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <HeartOutlined style={{ marginRight: 8 }} />
                    准确性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='准确性质控功能'
                description='针对核心医疗数据开展准确性评估，包括编码规范、字段值校验与跨周期/科室/医生维度的对比分析。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体统计 - 仅在demo模式下显示 */}
            {isDemoVersion() && overallStats.totalDataTypes > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='数据类型数'
                                value={overallStats.totalDataTypes}
                                suffix='类'
                                prefix={<AreaChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='平均质量得分'
                                value={overallStats.avgQualityScore}
                                suffix='分'
                                valueStyle={{
                                    color:
                                        overallStats.avgQualityScore >= 90
                                            ? '#52c41a'
                                            : overallStats.avgQualityScore >= 70
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                }}
                                prefix={<TrophyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='优秀数据类型'
                                value={overallStats.excellentCount}
                                suffix='类'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='基准达标率'
                                value={overallStats.benchmarkMeetRate}
                                suffix='%'
                                valueStyle={{
                                    color:
                                        overallStats.benchmarkMeetRate >= 80
                                            ? '#52c41a'
                                            : '#ff4d4f',
                                }}
                                prefix={<TrophyOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={[16, 16]}>
                {/* 左侧：分析配置 */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <>
                                <HeartOutlined style={{ marginRight: 8 }} />
                                分析配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleCoreDataCheck}
                            initialValues={{
                                dataType: 'all',
                                compareUnread: 'false',
                                dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                            }}
                        >
                            <Form.Item
                                label='数据类型'
                                name='dataType'
                                rules={[{ required: true, message: '请选择数据类型' }]}
                            >
                                <Select
                                    placeholder='请选择要分析的数据类型'
                                    options={dataTypeOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='对比未读数据'
                                name='compareUnread'
                                rules={[{ required: true, message: '请选择是否对比未读数据' }]}
                            >
                                <Select
                                    placeholder='请选择是否对比未读数据'
                                    options={compareUnreadOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='分析时间范围'
                                name='dateRange'
                                rules={[{ required: true, message: '请选择时间范围' }]}
                            >
                                <RangePicker size='large' style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    loading={loading}
                                    icon={<SearchOutlined />}
                                    size='large'
                                    block
                                    disabled={loading}
                                >
                                    开始核心数据分析
                                </Button>
                            </Form.Item>
                            
                            {/* 进度条显示 */}
                            {loading && (
                                <Form.Item>
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <Progress
                                                percent={progress}
                                                size='small'
                                                status={progress === 100 ? 'success' : 'active'}
                                                showInfo={false}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        {qcMessages.length > 0 && (
                                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                                {qcMessages[qcMessages.length - 1]?.tableName && (
                                                    <span>正在处理: {qcMessages[qcMessages.length - 1].tableName}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Form.Item>
                            )}
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：分析结果 */}
                <Col xs={24} lg={16}>
                    {/* 核心数据质量指标 - 仅在demo模式下显示 */}
                    {isDemoVersion() && (
                        <Card
                            title={
                                <>
                                    <AreaChartOutlined style={{ marginRight: 8 }} />
                                    核心数据质量指标
                                </>
                            }
                            extra={
                                coreMetrics.length > 0 ? (
                                    <Button type='link' onClick={handleExportMetrics}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            {coreMetrics.length > 0 ? (
                                <Table
                                    columns={metricsColumns}
                                    dataSource={coreMetrics}
                                    pagination={false}
                                    size='middle'
                                    scroll={{ x: 1200 }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <HeartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                    <div>暂无分析结果</div>
                                    <div style={{ fontSize: 12, marginTop: 8 }}>
                                        请先执行核心数据质控分析
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* 对比分析结果 - 仅在demo模式下显示 */}
                    {isDemoVersion() && comparisonResults.length > 0 && (
                        <Card
                            title={
                                <>
                                    <TrophyOutlined style={{ marginRight: 8 }} />
                                    对比分析结果
                                </>
                            }
                            extra={
                                comparisonResults.length > 0 ? (
                                    <Button type='link' onClick={handleExportComparisons}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            <Table
                                columns={comparisonColumns}
                                dataSource={comparisonResults}
                                pagination={false}
                                size='middle'
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    )}

                    {/* 准确性质控结果 */}
                    {resultData.length > 0 && (
                        <Card
                            title={
                                <>
                                    <HeartOutlined style={{ marginRight: 8 }} />
                                    准确性质控结果
                                </>
                            }
                        >
                            <Spin spinning={resultLoading}>
                                <JsonToTable
                                    data={resultData as unknown as Array<Record<string, unknown>>}
                                    columnMapping={{
                                        id: 'ID',
                                        ruleCode: '规则编码',
                                        mainTable: '主表',
                                        subTable: '次表',
                                        mainTableName: '主表名称',
                                        subTableName: '次表名称',
                                        mainCount: '主表数量',
                                        subCount: '次表数量',
                                        issueDesc: '问题描述',
                                        batchId: '批次ID',
                                    }}
                                    tableProps={{
                                        pagination: {
                                            current: resultPagination.current,
                                            pageSize: resultPagination.pageSize,
                                            total: resultPagination.total,
                                            showSizeChanger: true,
                                            showTotal: (total) => `共 ${total} 条`,
                                            onChange: (page, pageSize) => {
                                                if (currentTaskId) {
                                                    loadResultData(currentTaskId, page, pageSize)
                                                }
                                            },
                                            onShowSizeChange: (current, size) => {
                                                if (currentTaskId) {
                                                    loadResultData(currentTaskId, current, size)
                                                }
                                            },
                                        },
                                        scroll: { x: 'max-content' },
                                    }}
                                />
                            </Spin>
                        </Card>
                    )}
                </Col>
            </Row>
            <Modal
                title={detailModalContent?.title}
                open={detailModalVisible}
                onOk={() => setDetailModalVisible(false)}
                onCancel={() => setDetailModalVisible(false)}
                width={700}
            >
                <pre style={{ whiteSpace: 'pre-wrap' }}>{detailModalContent?.content}</pre>
            </Modal>
        </div>
    )
}

export default CoreDataQualityControl
