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
import type { UploadFile, UploadProps } from 'antd/es/upload'
import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import { dataManagementService } from '@/services/dataManagementService'
import type { TableInfoItem, DatabaseOption } from '@/types'
import { api, type SSEManager } from '@/utils/request'
import { store } from '@/store'
import { initializeQCExecution, addQCMessage } from '@/store/slices/qcExecutionSlice'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages } from '@/store/slices/qcExecutionSlice'

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
    dataBaseId: string
    targetTable: string
    uploadFile?: UploadFile<any>[]
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
    
    // 新增状态
    const [databaseOptions, setDatabaseOptions] = useState<Array<{ label: string; value: string }>>([])
    const [databaseLoading, setDatabaseLoading] = useState(false)
    const [tableOptions, setTableOptions] = useState<Array<{ label: string; value: string }>>([])
    const [tableLoading, setTableLoading] = useState(false)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const sseManagerRef = useRef<SSEManager | null>(null)
    
    // 从Redux获取SSE消息
    const qcMessages = useAppSelector(
        state => (currentTaskId ? selectQCMessages(currentTaskId)(state) : [])
    )
    
    const normFile = (e: any) => {
        if (Array.isArray(e)) return e
        return e?.fileList || []
    }

    // 加载数据库选项
    const loadDatabaseOptions = async () => {
        try {
            setDatabaseLoading(true)
            const response = await dataManagementService.getDatabaseOptions()
            if (response.code === 200 && response.data) {
                const options = response.data.map((item: DatabaseOption) => ({
                    label: `${item.dbName} (${item.dbType})`,
                    value: item.id,
                }))
                setDatabaseOptions(options)
                logger.info('数据库选项加载成功:', options)
            } else {
                logger.warn('获取数据库选项失败:', response.msg)
                uiMessage.warning(response.msg || '获取数据库选项失败')
            }
        } catch (error) {
            logger.error('加载数据库选项失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('加载数据库选项失败，请重试')
        } finally {
            setDatabaseLoading(false)
        }
    }

    // 加载表信息
    const loadTableInfo = async () => {
        try {
            setTableLoading(true)
            const response = await dataQualityControlService.getTableInfo()
            if (response.code === 200 && response.data) {
                const options = response.data.map((item: TableInfoItem) => ({
                    label: item.tableComment 
                        ? `${item.tableName} - ${item.tableComment}` 
                        : item.tableName,
                    value: item.tableName,
                }))
                setTableOptions(options)
                logger.info('表信息加载成功:', options)
            } else {
                logger.warn('获取表信息失败:', response.msg)
                uiMessage.warning(response.msg || '获取表信息失败')
            }
        } catch (error) {
            logger.error('加载表信息失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('加载表信息失败，请重试')
        } finally {
            setTableLoading(false)
        }
    }

    // 组件挂载时加载数据
    useEffect(() => {
        loadDatabaseOptions()
        loadTableInfo()
    }, [])

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
                setTimeout(() => {
                    uiMessage.success('及时性质控检查完成！')
                    logger.info('及时性质控检查完成')
                    // 断开SSE连接
                    if (sseManagerRef.current) {
                        sseManagerRef.current.disconnect()
                        sseManagerRef.current = null
                    }
                    // 重置状态
                    setLoading(false)
                    setCurrentTaskId(null)
                    setProgress(0)
                    if (onAutoDone) {
                        onAutoDone()
                    }
                }, 500)
            }
        }
    }, [qcMessages, onAutoDone])

    // 组件卸载时清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])

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

    // Excel文件上传配置（用于结果上传）
    const excelUploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.xlsx,.xls',
        beforeUpload: file => {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel'
            if (!isExcel) {
                uiMessage.handleSystemError('只支持 Excel 格式的文件！')
                return false
            }
            const isLt5M = file.size / 1024 / 1024 < 5
            if (!isLt5M) {
                uiMessage.handleSystemError('文件大小不能超过 5MB！')
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
                uiMessage.handleSystemError(`${info.file.name} 文件上传失败`)
            }
        },
    }

    // 质控文件上传配置（用于质控执行）
    const qcFileUploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.xlsx,.xls,.txt,.doc,.docx,.pdf',
        beforeUpload: file => {
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
                uiMessage.handleSystemError('文件大小不能超过 10MB！')
                return false
            }
            return false // 阻止自动上传
        },
        onChange: info => {
            const fileList = info.fileList || []
            try {
                form.setFieldsValue({ uploadFile: fileList })
                form.validateFields(['uploadFile']).catch(() => {})
            } catch {}
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
            uiMessage.handleSystemError('导出失败，请重试')
        }
    }

    // 自动启动逻辑已移除，因为需要用户选择数据库、表和文件

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
    const handleComprehensiveCheck = async (values: ComprehensiveFormValues) => {
        try {
            // 验证表单字段
            if (!values.dataBaseId) {
                uiMessage.warning('请选择数据库')
                return
            }
            if (!values.targetTable) {
                uiMessage.warning('请选择数据表')
                return
            }

            // 检查文件
            const fileList = values.uploadFile as UploadFile<any>[] | undefined
            if (!fileList || fileList.length === 0) {
                uiMessage.warning('请上传文件')
                return
            }

            const file = fileList[0]
            const originFile = file.originFileObj as File | undefined
            if (!originFile) {
                uiMessage.handleSystemError('文件信息异常，请重新上传')
                return
            }

            setLoading(true)
            setProgress(0)

            // 使用模拟的 fileId（待文件上传接口开发完成后替换）
            const mockFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // 构建请求参数
            const requestParams = {
                dataBaseId: values.dataBaseId,
                fileId: mockFileId,
                fileName: originFile.name,
            }

            // 创建SSE连接
            try {
                const sseManager = api.createSSE({
                    url: '/data/qc/timelinessQc',
                    method: 'POST',
                    data: requestParams,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('及时性质控SSE连接已建立', requestParams)
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
                            logger.info('及时性质控SSE消息', messageData)
                            
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
                            logger.info('及时性质控SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('及时性质控SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.handleSystemError('质控检查连接异常，请检查网络')
                        setLoading(false)
                        setCurrentTaskId(null)
                        setProgress(0)
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('及时性质控SSE连接已关闭')
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
                uiMessage.handleSystemError('启动质控检查连接失败，请稍后重试')
                setLoading(false)
                setCurrentTaskId(null)
                setProgress(0)
                throw sseError
            }
        } catch (error) {
            logger.error('质控检查失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('质控检查失败，请重试')
            setLoading(false)
            setCurrentTaskId(null)
            setProgress(0)
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
                        >
                            <Form.Item
                                label='选择数据库'
                                name='dataBaseId'
                                rules={[{ required: true, message: '请选择数据库' }]}
                            >
                                <Select
                                    placeholder={databaseLoading ? '正在加载数据库...' : '请选择数据库'}
                                    options={databaseOptions}
                                    size='large'
                                    loading={databaseLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const label = String(option?.label ?? '')
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item
                                label='选择数据表'
                                name='targetTable'
                                rules={[{ required: true, message: '请选择数据表' }]}
                            >
                                <Select
                                    placeholder={tableLoading ? '正在加载表信息...' : '请选择要进行质控的数据表'}
                                    options={tableOptions}
                                    size='large'
                                    loading={tableLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const label = String(option?.label ?? '')
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item
                                label='上传文件'
                                name='uploadFile'
                                valuePropName='fileList'
                                getValueFromEvent={normFile}
                                rules={[
                                    {
                                        validator: async (_rule, value) => {
                                            const hasFile = Array.isArray(value) && value.length > 0
                                            if (!hasFile) {
                                                return Promise.reject('请上传文件')
                                            }
                                            return Promise.resolve()
                                        },
                                    },
                                ]}
                            >
                                <Upload {...qcFileUploadProps}>
                                    <Button icon={<InboxOutlined />}>选择文件</Button>
                                </Upload>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    loading={loading}
                                    icon={<UploadOutlined />}
                                    size='large'
                                    block
                                    disabled={loading}
                                >
                                    开始及时质控
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
