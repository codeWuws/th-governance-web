import {
    BarChartOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LinkOutlined,
    SearchOutlined,
    TableOutlined,
    WarningOutlined,
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
    Statistic,
    Table,
    Typography,
    Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState, useRef } from 'react'
import uiMessage from '@/utils/uiMessage'
import { logger } from '@/utils/logger'
import { api, type SSEManager } from '@/utils/request'
import { store } from '@/store'
import { initializeQCExecution, addQCMessage } from '@/store/slices/qcExecutionSlice'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages } from '@/store/slices/qcExecutionSlice'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { ConsistencyQCRelationRecord } from '@/types'
import JsonToTable from '@/components/JsonToTable'
import { isDemoVersion } from '@/utils/versionControl'

const { Title, Text } = Typography

interface TableRelation {
    key: string
    mainTable: string
    mainTableComment: string
    subTable: string
    subTableComment: string
    relationField: string
    mainCount: number
    subCount: number
    matchedCount: number
    unmatchedCount: number
    matchRate: number
    status: 'normal' | 'warning' | 'error'
}

interface LogicCheckResult {
    key: string
    checkType: string
    description: string
    totalChecked: number
    passedCount: number
    failedCount: number
    passRate: number
    errorDetails: string[]
}

interface LogicFormValues {
    businessModule: string
    checkType: string
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const BasicMedicalLogicQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [tableRelations, setTableRelations] = useState<TableRelation[]>([])
    const [logicResults, setLogicResults] = useState<LogicCheckResult[]>([])
    const [overallStats, setOverallStats] = useState({
        totalRelations: 0,
        normalRelations: 0,
        warningRelations: 0,
        errorRelations: 0,
        avgMatchRate: 0,
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
    const [resultData, setResultData] = useState<ConsistencyQCRelationRecord[]>([])
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
                // 立即更新进度为100%并停止loading，避免进度条继续转动
                setProgress(100)
                setLoading(false)
                
                // 延迟一下再提示，确保最后的消息已处理
                setTimeout(async () => {
                    uiMessage.success('一致性质控检查完成！')
                    logger.info('一致性质控检查完成')
                    
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
                    
                    // 延迟一下再重置进度，让用户看到100%完成状态
                    setTimeout(() => {
                        setProgress(0)
                    }, 1000)
                    
                    if (onAutoDone) {
                        onAutoDone()
                    }
                }, 500)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qcMessages, onAutoDone, currentTaskId])

    // 加载一致性质控结果数据
    const loadResultData = async (taskId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setResultLoading(true)
            const response = await dataQualityControlService.getConsistencyQCRelationPage({
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
                logger.info('一致性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取一致性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载一致性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('加载结果失败，请重试')
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

    // 业务模块选项
    const moduleOptions = [
        { label: '全部模块', value: 'all' },
        { label: '门诊业务', value: 'outpatient' },
        { label: '住院业务', value: 'inpatient' },
        { label: '检查检验', value: 'examination' },
        { label: '药品管理', value: 'pharmacy' },
        { label: '手术管理', value: 'surgery' },
        { label: '护理管理', value: 'nursing' },
    ]

    // 检查类型选项
    const checkTypeOptions = [
        { label: '主附表关联检查', value: 'relation_check' },
        { label: '数据一致性检查', value: 'consistency_check' },
        { label: '业务逻辑检查', value: 'logic_check' },
        { label: '时间逻辑检查', value: 'time_check' },
    ]

    // 执行医疗逻辑检查
    const handleLogicCheck = async (values: LogicFormValues) => {
        try {
            // 验证表单字段
            if (!values.businessModule) {
                uiMessage.warning('请选择业务模块')
                return
            }
            if (!values.checkType) {
                uiMessage.warning('请选择检查类型')
                return
            }

            setLoading(true)
            setProgress(0)

            // 构建请求参数
            const requestParams = {
                businessModule: values.businessModule,
                checkType: values.checkType,
            }

            // 创建SSE连接
            try {
                const sseManager = api.createSSE({
                    url: '/data/qc/consistencyQc',
                    method: 'POST',
                    data: requestParams,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('一致性质控SSE连接已建立', requestParams)
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
                            logger.info('一致性质控SSE消息', messageData)
                            
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
                            logger.info('一致性质控SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('一致性质控SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.error('一致性质控检查连接异常，请检查网络')
                        setLoading(false)
                        setCurrentTaskId(null)
                        setProgress(0)
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('一致性质控SSE连接已关闭')
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
                uiMessage.error('启动一致性质控检查连接失败，请稍后重试')
                setLoading(false)
                setCurrentTaskId(null)
                setProgress(0)
                throw sseError
            }
        } catch (error) {
            logger.error(
                '一致性质控检查失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('一致性质控检查失败，请重试')
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
            uiMessage.error('导出失败，请重试')
        }
    }

    const handleExportRelations = () => {
        const rows = tableRelations.map(r => ({
            mainTable: r.mainTable,
            subTable: r.subTable,
            relationField: r.relationField,
            mainCount: r.mainCount,
            subCount: r.subCount,
            matchedCount: r.matchedCount,
            unmatchedCount: r.unmatchedCount,
            matchRate: r.matchRate,
            status: r.status,
        }))
        exportCsv(rows, '医疗逻辑质控_主附表关联.csv')
    }

    const handleExportLogic = () => {
        const rows = logicResults.map(l => ({
            checkType: l.checkType,
            description: l.description,
            totalChecked: l.totalChecked,
            passedCount: l.passedCount,
            failedCount: l.failedCount,
            passRate: l.passRate,
            errorDetails: l.errorDetails.join(' | '),
        }))
        exportCsv(rows, '医疗逻辑质控_业务逻辑.csv')
    }

    // 自动启动逻辑已移除，因为需要用户选择业务模块和检查类型

    // 主附表关联表格列配置
    const relationColumns: ColumnsType<TableRelation> = [
        {
            title: '主表',
            dataIndex: 'mainTable',
            key: 'mainTable',
            width: 120,
            render: (text: string, record) => (
                <div>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {record.mainTableComment}
                    </div>
                </div>
            ),
        },
        {
            title: '附表',
            dataIndex: 'subTable',
            key: 'subTable',
            width: 120,
            render: (text: string, record) => (
                <div>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {record.subTableComment}
                    </div>
                </div>
            ),
        },
        {
            title: '关联字段',
            dataIndex: 'relationField',
            key: 'relationField',
            width: 100,
            render: (text: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '主表记录',
            dataIndex: 'mainCount',
            key: 'mainCount',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '附表记录',
            dataIndex: 'subCount',
            key: 'subCount',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '匹配记录',
            dataIndex: 'matchedCount',
            key: 'matchedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '未匹配',
            dataIndex: 'unmatchedCount',
            key: 'unmatchedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
                    {value.toLocaleString()}
                </span>
            ),
        },
        {
            title: '匹配率',
            dataIndex: 'matchRate',
            key: 'matchRate',
            width: 100,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 99 ? 'success' : rate >= 95 ? 'active' : 'exception'}
                />
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => {
                const statusConfig = {
                    normal: { color: '#52c41a', text: '正常', icon: <CheckCircleOutlined /> },
                    warning: { color: '#faad14', text: '警告', icon: <WarningOutlined /> },
                    error: { color: '#ff4d4f', text: '异常', icon: <ExclamationCircleOutlined /> },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return (
                    <span style={{ color: config.color }}>
                        {config.icon} {config.text}
                    </span>
                )
            },
        },
    ]

    // 逻辑检查结果表格列配置
    const logicColumns: ColumnsType<LogicCheckResult> = [
        {
            title: '检查类型',
            dataIndex: 'checkType',
            key: 'checkType',
            width: 120,
        },
        {
            title: '检查描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
        },
        {
            title: '检查总数',
            dataIndex: 'totalChecked',
            key: 'totalChecked',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '通过数',
            dataIndex: 'passedCount',
            key: 'passedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '失败数',
            dataIndex: 'failedCount',
            key: 'failedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#ff4d4f' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '通过率',
            dataIndex: 'passRate',
            key: 'passRate',
            width: 100,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 98 ? 'success' : rate >= 95 ? 'active' : 'exception'}
                />
            ),
        },
        {
            title: '错误示例',
            dataIndex: 'errorDetails',
            key: 'errorDetails',
            render: (details: string[], record) => (
                <div>
                    {details.slice(0, 2).map((detail, index) => (
                        <div key={index} style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                            {detail}
                        </div>
                    ))}
                    <Button
                        type='link'
                        size='small'
                        onClick={() => {
                            setDetailModalContent({
                                title: record.checkType,
                                content: details.join('\n'),
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
                    <LinkOutlined style={{ marginRight: 8 }} />
                    一致性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='一致性质控功能'
                description='检查主附表数据关联关系与规则一致性，包含时间、年龄、性别等基础逻辑校验，识别不一致与异常。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体统计 - 仅在demo模式下显示 */}
            {isDemoVersion() && overallStats.totalRelations > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='检查关系数'
                                value={overallStats.totalRelations}
                                suffix='个'
                                prefix={<LinkOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='平均匹配率'
                                value={overallStats.avgMatchRate}
                                suffix='%'
                                valueStyle={{
                                    color:
                                        overallStats.avgMatchRate >= 99
                                            ? '#52c41a'
                                            : overallStats.avgMatchRate >= 95
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                }}
                                prefix={<BarChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='正常关系'
                                value={overallStats.normalRelations}
                                suffix='个'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='异常关系'
                                value={overallStats.errorRelations}
                                suffix='个'
                                valueStyle={{ color: '#ff4d4f' }}
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={[16, 16]}>
                {/* 左侧：检查配置 */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <>
                                <LinkOutlined style={{ marginRight: 8 }} />
                                检查配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleLogicCheck}
                            initialValues={{ businessModule: 'all', checkType: 'relation_check' }}
                        >
                            <Form.Item
                                label='业务模块'
                                name='businessModule'
                                rules={[{ required: true, message: '请选择业务模块' }]}
                            >
                                <Select
                                    placeholder='请选择要检查的业务模块'
                                    options={moduleOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='检查类型'
                                name='checkType'
                                rules={[{ required: true, message: '请选择检查类型' }]}
                            >
                                <Select
                                    placeholder='请选择检查类型'
                                    options={checkTypeOptions}
                                    size='large'
                                />
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
                                    开始逻辑检查
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

                {/* 右侧：检查结果 */}
                <Col xs={24} lg={16}>
                    {/* 主附表关联检查 - 仅在demo模式下显示 */}
                    {isDemoVersion() && (
                        <Card
                            title={
                                <>
                                    <TableOutlined style={{ marginRight: 8 }} />
                                    主附表关联检查
                                </>
                            }
                            extra={
                                tableRelations.length > 0 ? (
                                    <Button type='link' onClick={handleExportRelations}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            {tableRelations.length > 0 ? (
                                <Table
                                    columns={relationColumns}
                                    dataSource={tableRelations}
                                    pagination={false}
                                    size='middle'
                                    scroll={{ x: 1000 }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <LinkOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                    <div>暂无检查结果</div>
                                    <div style={{ fontSize: 12, marginTop: 8 }}>
                                        请先执行医疗逻辑检查
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* 业务逻辑检查结果 - 仅在demo模式下显示 */}
                    {isDemoVersion() && logicResults.length > 0 && (
                        <Card
                            title={
                                <>
                                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                                    业务逻辑检查
                                </>
                            }
                            extra={
                                logicResults.length > 0 ? (
                                    <Button type='link' onClick={handleExportLogic}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            <Table
                                columns={logicColumns}
                                dataSource={logicResults}
                                pagination={false}
                                size='middle'
                                scroll={{ x: 1000 }}
                            />
                        </Card>
                    )}

                    {/* 一致性质控结果 */}
                    {resultData.length > 0 && (
                        <Card
                            title={
                                <>
                                    <LinkOutlined style={{ marginRight: 8 }} />
                                    一致性质控结果
                                </>
                            }
                        >
                            <Spin spinning={resultLoading}>
                                <JsonToTable
                                    data={resultData as unknown as Array<Record<string, unknown>>}
                                    columnMapping={{
                                        id: 'ID',
                                        batchId: '批次ID',
                                        mainTableName: '主表名称',
                                        subTableName: '次表名称',
                                        relationField: '关联字段',
                                        mainCount: '主表数量',
                                        subCount: '次表数量',
                                        matchedCount: '匹配数量',
                                        unmatchedCount: '未匹配数量',
                                        matchRate: '匹配率',
                                        status: '状态',
                                        mainTableComment: '主表注释',
                                        subTableComment: '次表注释',
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

export default BasicMedicalLogicQualityControl
