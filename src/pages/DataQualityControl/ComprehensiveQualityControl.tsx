import {
    BarChartOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    FileExcelOutlined,
    InboxOutlined,
    UploadOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
    Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd/es/upload'
import React, { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Title } = Typography
const { Dragger } = Upload

interface QualityMetric {
    key: string
    metric: string
    score: number
    status: 'excellent' | 'good' | 'warning' | 'poor'
    description: string
}

interface QualityReport {
    key: string
    category: string
    totalItems: number
    passedItems: number
    failedItems: number
    passRate: number
    status?: 'success' | 'warning' | 'error'
    details?: string
}

interface ComprehensiveFormValues {
    targetDatabase: string
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const ComprehensiveQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([])
    const [qualityReports, setQualityReports] = useState<QualityReport[]>([])
    const [overallScore, setOverallScore] = useState(0)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [detailModalContent, setDetailModalContent] = useState<{
        title: string
        content: string
    } | null>(null)

    // 数据源选项
    const dataSourceOptions = [
        { label: '全部数据表', value: 'all_tables' },
        { label: '事件流/实时', value: 'streaming' },
        { label: '批处理/日更', value: 'batch_daily' },
        { label: '批处理/周更', value: 'batch_weekly' },
    ]

    // 解析Excel结果
    const parseExcelResults = () => {
        // 模拟Excel解析结果
        const mockReports: QualityReport[] = [
            {
                key: '1',
                category: '刷新延迟（分钟）',
                totalItems: 1000,
                passedItems: 900,
                failedItems: 100,
                passRate: 90,
                status: 'success',
                details: '大部分表延迟≤15分钟',
            },
            {
                key: '2',
                category: '准点率（定时任务）',
                totalItems: 800,
                passedItems: 720,
                failedItems: 80,
                passRate: 90,
                status: 'success',
                details: '定时任务按计划执行，偶发延迟',
            },
            {
                key: '3',
                category: '增量覆盖率',
                totalItems: 1200,
                passedItems: 1020,
                failedItems: 180,
                passRate: 85,
                status: 'warning',
                details: '部分增量批次未全量覆盖',
            },
            {
                key: '4',
                category: '实时管道稳定性',
                totalItems: 500,
                passedItems: 425,
                failedItems: 75,
                passRate: 85,
                status: 'warning',
                details: '高峰期间吞吐下降，需优化缓冲',
            },
        ]
        setQualityReports(mockReports)

        // 计算综合得分
        const totalScore = mockReports.reduce((sum, report) => sum + report.passRate, 0)
        const avgScore = Math.round(totalScore / mockReports.length)
        setOverallScore(avgScore)
    }

    // Excel文件上传配置
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.xlsx,.xls',
        beforeUpload: file => {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel'
            if (!isExcel) {
                uiMessage.error('只支持 Excel 格式的文件！')
                return false
            }
            const isLt5M = file.size / 1024 / 1024 < 5
            if (!isLt5M) {
                uiMessage.error('文件大小不能超过 5MB！')
                return false
            }
            return false // 阻止自动上传
        },
        onChange: info => {
            const { status } = info.file
            if (status === 'done') {
                uiMessage.success(`${info.file.name} 文件上传成功`)
                // 模拟解析Excel文件
                parseExcelResults()
            } else if (status === 'error') {
                uiMessage.error(`${info.file.name} 文件上传失败`)
            }
        },
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

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!autoStart || loading) return
            try {
                await handleComprehensiveCheck({ targetDatabase: '' } as unknown as ComprehensiveFormValues)
            } finally {
                if (!cancelled) onAutoDone && onAutoDone()
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [autoStart])

    const handleExportMetrics = () => {
        const rows = qualityMetrics.map(m => ({
            metric: m.metric,
            score: m.score,
            status: m.status,
            description: m.description,
        }))
        exportCsv(rows, '综合质控_指标.csv')
    }

    const handleExportReports = () => {
        const rows = qualityReports.map(r => ({
            category: r.category,
            totalItems: r.totalItems,
            passedItems: r.passedItems,
            failedItems: r.failedItems,
            passRate: r.passRate,
            status: r.status ?? '',
            details: r.details ?? '',
        }))
        exportCsv(rows, '综合质控_Excel解析结果.csv')
    }

    // 执行综合质控
    const handleComprehensiveCheck = async (_values: ComprehensiveFormValues) => {
        setLoading(true)
        try {
            // 模拟质控检查过程
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 模拟质控指标结果
            const mockMetrics: QualityMetric[] = [
                {
                    key: '1',
                    metric: '刷新延迟控制',
                    score: 93,
                    status: 'excellent',
                    description: '绝大多数表延迟≤15分钟',
                },
                {
                    key: '2',
                    metric: '准点率（调度）',
                    score: 88,
                    status: 'good',
                    description: '定时任务准点率≥88%，偶发延迟',
                },
                {
                    key: '3',
                    metric: '实时管道稳定性',
                    score: 80,
                    status: 'warning',
                    description: '高峰吞吐下降，需优化缓冲与重试策略',
                },
                {
                    key: '4',
                    metric: '迟到记录占比',
                    score: 86,
                    status: 'good',
                    description: '迟到记录占比≤14%，总体可控',
                },
                {
                    key: '5',
                    metric: '增量覆盖率',
                    score: 82,
                    status: 'warning',
                    description: '部分批次增量缺失，需补偿同步',
                },
            ]

            setQualityMetrics(mockMetrics)
            const avgScore = Math.round(
                mockMetrics.reduce((sum, item) => sum + item.score, 0) / mockMetrics.length
            )
            setOverallScore(avgScore)
            uiMessage.success('及时性质控检查完成！')
        } catch (error) {
            logger.error('质控检查失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('质控检查失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    // 质控指标表格列配置
    const metricsColumns: ColumnsType<QualityMetric> = [
        {
            title: '质控指标',
            dataIndex: 'metric',
            key: 'metric',
            width: 120,
        },
        {
            title: '得分',
            dataIndex: 'score',
            key: 'score',
            width: 80,
            render: (score: number) => (
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{score}</span>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const statusConfig = {
                    excellent: { color: '#52c41a', text: '优秀', icon: <CheckCircleOutlined /> },
                    good: { color: '#1890ff', text: '良好', icon: <CheckCircleOutlined /> },
                    warning: {
                        color: '#faad14',
                        text: '警告',
                        icon: <ExclamationCircleOutlined />,
                    },
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
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (text: string, record) => (
                <Space>
                    <span>{text}</span>
                    <Button
                        type='link'
                        size='small'
                        onClick={() => {
                            setDetailModalContent({
                                title: record.metric,
                                content: record.description,
                            })
                            setDetailModalVisible(true)
                        }}
                    >
                        详情
                    </Button>
                </Space>
            ),
        },
    ]

    // 质控报告表格列配置
    const reportsColumns: ColumnsType<QualityReport> = [
        {
            title: '质控类别',
            dataIndex: 'category',
            key: 'category',
            width: 120,
        },
        {
            title: '总数',
            dataIndex: 'totalItems',
            key: 'totalItems',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '通过',
            dataIndex: 'passedItems',
            key: 'passedItems',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '失败',
            dataIndex: 'failedItems',
            key: 'failedItems',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#ff4d4f' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '通过率',
            dataIndex: 'passRate',
            key: 'passRate',
            width: 120,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 90 ? 'success' : rate >= 70 ? 'active' : 'exception'}
                />
            ),
        },
        {
            title: '详情',
            key: 'details',
            render: (_, record) => (
                <Button
                    type='link'
                    size='small'
                    onClick={() => {
                        setDetailModalContent({
                            title: record.category,
                            content: record.details || '无详情',
                        })
                        setDetailModalVisible(true)
                    }}
                >
                    查看
                </Button>
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
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    及时性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='及时性质控功能'
                description='聚焦数据的时效性与延迟控制，评估刷新延迟、准点率、实时管道稳定性与增量覆盖率；支持上传Excel结果进行解析。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体质控得分 */}
            {overallScore > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title='综合质控得分'
                                value={overallScore}
                                suffix='分'
                                valueStyle={{
                                    color:
                                        overallScore >= 90
                                            ? '#52c41a'
                                            : overallScore >= 70
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                    fontSize: 32,
                                }}
                                prefix={<BarChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title='检查项目数'
                                value={qualityMetrics.length}
                                suffix='项'
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title='优秀项目数'
                                value={qualityMetrics.filter(m => m.status === 'excellent').length}
                                suffix='项'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={[16, 16]}>
                {/* 左侧：质控配置 */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <>
                                <BarChartOutlined style={{ marginRight: 8 }} />
                                质控配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleComprehensiveCheck}
                            initialValues={{ dataSource: 'all_tables' }}
                        >
                            <Form.Item
                                label='选择数据源'
                                name='dataSource'
                                rules={[{ required: true, message: '请选择数据源' }]}
                            >
                                <Select
                                    placeholder='请选择要进行质控的数据源'
                                    options={dataSourceOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    loading={loading}
                                    icon={<UploadOutlined />}
                                    size='large'
                                    block
                                >
                                    开始及时质控
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    {/* Excel结果上传 */}
                    <Card
                        title={
                            <>
                                <FileExcelOutlined style={{ marginRight: 8 }} />
                                Excel结果上传
                            </>
                        }
                        style={{ marginTop: 16 }}
                    >
                        <Dragger {...uploadProps}>
                            <p className='ant-upload-drag-icon'>
                                <InboxOutlined />
                            </p>
                            <p className='ant-upload-text'>上传Excel质控结果</p>
                            <p className='ant-upload-hint'>
                                支持 .xlsx、.xls 格式，文件大小不超过 5MB
                            </p>
                        </Dragger>
                    </Card>
                </Col>

                {/* 右侧：质控结果 */}
                <Col xs={24} lg={16}>
                    {/* 质控指标 */}
                    <Card
                        title={
                            <>
                                <CheckCircleOutlined style={{ marginRight: 8 }} />
                                时效指标
                            </>
                        }
                        extra={
                            qualityMetrics.length > 0 ? (
                                <Button type='link' onClick={handleExportMetrics}>
                                    导出CSV
                                </Button>
                            ) : undefined
                        }
                        style={{ marginBottom: 16 }}
                    >
                        {qualityMetrics.length > 0 ? (
                            <Table
                                columns={metricsColumns}
                                dataSource={qualityMetrics}
                                pagination={false}
                                size='middle'
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                <BarChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <div>暂无质控结果</div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>
                                    请先执行及时性质控检查
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Excel解析结果 */}
                    {qualityReports.length > 0 && (
                        <Card
                            title={
                                <>
                                    <FileExcelOutlined style={{ marginRight: 8 }} />
                                    时效结果解析（Excel）
                                </>
                            }
                            extra={
                                qualityReports.length > 0 ? (
                                    <Button type='link' onClick={handleExportReports}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                        >
                            <Table
                                columns={reportsColumns}
                                dataSource={qualityReports}
                                pagination={false}
                                size='middle'
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
            >
                <div>{detailModalContent?.content}</div>
            </Modal>
        </div>
    )
}

export default ComprehensiveQualityControl
