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
import React, { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

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
    targetDatabase: string
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

    // 对比维度选项
    const comparisonOptions = [
        { label: '时间对比', value: 'time_comparison' },
        { label: '科室对比', value: 'department_comparison' },
        { label: '医生对比', value: 'doctor_comparison' },
        { label: '行业基准对比', value: 'benchmark_comparison' },
    ]

    // 执行核心数据质控
    const handleCoreDataCheck = async (_values: CoreDataFormValues) => {
        setLoading(true)
        try {
            // 模拟检查过程
            await new Promise(resolve => setTimeout(resolve, 3500))

            // 模拟核心数据质量指标
            const mockMetrics: CoreDataMetric[] = [
                {
                    key: '1',
                    dataType: '患者基础信息',
                    description: '姓名、性别、年龄、身份证号等基础信息',
                    totalRecords: 50000,
                    qualifiedRecords: 48500,
                    qualityScore: 97.0,
                    issues: ['部分患者身份证号格式不正确', '少数患者年龄计算异常'],
                    trend: 'up',
                    status: 'excellent',
                },
                {
                    key: '2',
                    dataType: '诊断信息',
                    description: 'ICD-10诊断编码、诊断名称、诊断类型',
                    totalRecords: 120000,
                    qualifiedRecords: 108000,
                    qualityScore: 90.0,
                    issues: ['部分诊断编码不规范', '主诊断标识缺失'],
                    trend: 'stable',
                    status: 'excellent',
                },
                {
                    key: '3',
                    dataType: '手术信息',
                    description: 'ICD-9-CM-3手术编码、手术名称、手术日期',
                    totalRecords: 15000,
                    qualifiedRecords: 12750,
                    qualityScore: 85.0,
                    issues: ['手术编码与名称不匹配', '手术时间记录不完整'],
                    trend: 'down',
                    status: 'good',
                },
                {
                    key: '4',
                    dataType: '用药信息',
                    description: '药品编码、用法用量、给药途径',
                    totalRecords: 200000,
                    qualifiedRecords: 150000,
                    qualityScore: 75.0,
                    issues: ['用法用量描述不规范', '药品编码缺失', '给药频次不明确'],
                    trend: 'up',
                    status: 'warning',
                },
                {
                    key: '5',
                    dataType: '检验检查',
                    description: '检验项目、检查结果、参考值范围',
                    totalRecords: 300000,
                    qualifiedRecords: 270000,
                    qualityScore: 90.0,
                    issues: ['部分检验结果单位不统一', '参考值范围缺失'],
                    trend: 'stable',
                    status: 'excellent',
                },
                {
                    key: '6',
                    dataType: '生命体征',
                    description: '体温、血压、心率、呼吸等生命体征',
                    totalRecords: 80000,
                    qualifiedRecords: 52000,
                    qualityScore: 65.0,
                    issues: ['数值超出正常范围', '测量时间不准确', '记录不完整'],
                    trend: 'down',
                    status: 'poor',
                },
            ]

            // 模拟对比分析结果
            const mockComparisons: ComparisonResult[] = [
                {
                    key: '1',
                    metric: '患者信息完整率',
                    currentPeriod: 97.0,
                    previousPeriod: 95.5,
                    changeRate: 1.5,
                    changeType: 'increase',
                    benchmark: 95.0,
                    meetsBenchmark: true,
                },
                {
                    key: '2',
                    metric: '诊断编码准确率',
                    currentPeriod: 90.0,
                    previousPeriod: 92.0,
                    changeRate: -2.0,
                    changeType: 'decrease',
                    benchmark: 90.0,
                    meetsBenchmark: true,
                },
                {
                    key: '3',
                    metric: '手术记录完整率',
                    currentPeriod: 85.0,
                    previousPeriod: 87.0,
                    changeRate: -2.0,
                    changeType: 'decrease',
                    benchmark: 88.0,
                    meetsBenchmark: false,
                },
                {
                    key: '4',
                    metric: '用药信息规范率',
                    currentPeriod: 75.0,
                    previousPeriod: 72.0,
                    changeRate: 3.0,
                    changeType: 'increase',
                    benchmark: 80.0,
                    meetsBenchmark: false,
                },
                {
                    key: '5',
                    metric: '检验数据质量',
                    currentPeriod: 90.0,
                    previousPeriod: 89.5,
                    changeRate: 0.5,
                    changeType: 'stable',
                    benchmark: 85.0,
                    meetsBenchmark: true,
                },
            ]

            setCoreMetrics(mockMetrics)
            setComparisonResults(mockComparisons)

            // 计算整体统计
            const totalDataTypes = mockMetrics.length
            const avgQualityScore = Math.round(
                mockMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalDataTypes
            )
            const excellentCount = mockMetrics.filter(m => m.status === 'excellent').length
            const poorCount = mockMetrics.filter(m => m.status === 'poor').length
            const benchmarkMeetRate = Math.round(
                (mockComparisons.filter(c => c.meetsBenchmark).length / mockComparisons.length) *
                    100
            )

            setOverallStats({
                totalDataTypes,
                avgQualityScore,
                excellentCount,
                poorCount,
                benchmarkMeetRate,
            })

            uiMessage.success('核心数据质控分析完成！')
        } catch (error) {
            logger.error(
                '核心数据质控分析失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('核心数据质控分析失败，请重试')
        } finally {
            setLoading(false)
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
            uiMessage.error('导出失败，请重试')
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

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!autoStart || loading) return
            try {
                await handleCoreDataCheck({
                    targetDatabase: 'dw_db',
                    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
                } as unknown as CoreDataFormValues)
            } finally {
                if (!cancelled) onAutoDone && onAutoDone()
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [autoStart])

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

            {/* 整体统计 */}
            {overallStats.totalDataTypes > 0 && (
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
                                comparison: 'time_comparison',
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
                                label='对比维度'
                                name='comparison'
                                rules={[{ required: true, message: '请选择对比维度' }]}
                            >
                                <Select
                                    placeholder='请选择对比分析维度'
                                    options={comparisonOptions}
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
                                >
                                    开始核心数据分析
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：分析结果 */}
                <Col xs={24} lg={16}>
                    {/* 核心数据质量指标 */}
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

                    {/* 对比分析结果 */}
                    {comparisonResults.length > 0 && (
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
