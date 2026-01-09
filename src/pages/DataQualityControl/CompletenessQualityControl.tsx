import {
    CheckCircleOutlined,
    DatabaseOutlined,
    ExclamationCircleOutlined,
    PieChartOutlined,
    SearchOutlined,
    TableOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
    Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import { dataManagementService } from '@/services/dataManagementService'
import type { TableInfoItem, DatabaseOption, CompletenessQCRateRecord } from '@/types'
import { api, type SSEManager } from '@/utils/request'
import { store } from '@/store'
import { initializeQCExecution, addQCMessage } from '@/store/slices/qcExecutionSlice'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages } from '@/store/slices/qcExecutionSlice'
import JsonToTable from '@/components/JsonToTable'
import { isDemoVersion } from '@/utils/versionControl'

const { Title, Text } = Typography

interface TableCompleteness {
    key: string
    tableName: string
    tableComment: string
    totalRecords: number
    completenessRate: number
    incompleteRecords: number
    status: 'excellent' | 'good' | 'warning' | 'poor'
}

interface FieldCompleteness {
    key: string
    fieldName: string
    fieldComment: string
    dataType: string
    totalRecords: number
    filledRecords: number
    emptyRecords: number
    fillRate: number
    isRequired: boolean
}

interface CompletenessFormValues {
    dataBaseId: string
    tableName: string[]
    tableFilter?: string // 表单中是字符串，提交时转换为数组
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const CompletenessQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [tableCompleteness, setTableCompleteness] = useState<TableCompleteness[]>([])
    const [fieldCompleteness, setFieldCompleteness] = useState<FieldCompleteness[]>([])
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [showRequiredOnly, setShowRequiredOnly] = useState(false)
    const [overallStats, setOverallStats] = useState({
        totalTables: 0,
        avgCompleteness: 0,
        excellentTables: 0,
        poorTables: 0,
    })
    
    // 新增状态
    const [databaseOptions, setDatabaseOptions] = useState<Array<{ label: string; value: string }>>([])
    const [databaseLoading, setDatabaseLoading] = useState(false)
    const [tableOptions, setTableOptions] = useState<Array<{ label: string; value: string }>>([])
    const [tableLoading, setTableLoading] = useState(false)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const sseManagerRef = useRef<SSEManager | null>(null)
    
    // 结果数据相关状态
    const [resultData, setResultData] = useState<CompletenessQCRateRecord[]>([])
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

    // 加载结果数据
    const loadResultData = async (taskId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setResultLoading(true)
            const response = await dataQualityControlService.getCompletenessQCRatePage({
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
                logger.info('完整性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取完整性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载完整性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('加载结果失败，请重试')
        } finally {
            setResultLoading(false)
        }
    }

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
                    uiMessage.success('完整性检查完成！')
                    logger.info('完整性检查完成')
                    
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

    // 组件卸载时清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])

    // 执行完整性检查
    const handleCompletenessCheck = async (values: CompletenessFormValues) => {
        try {
            // 验证表单字段
            if (!values.dataBaseId) {
                uiMessage.warning('请选择数据库')
                return
            }
            if (!values.tableName || values.tableName.length === 0) {
                uiMessage.warning('请至少选择一个数据表')
                return
            }

            setLoading(true)
            setProgress(0)

            // 处理tableFilter：将逗号分隔的字符串转换为数组
            const tableFilterArray = values.tableFilter
                ? values.tableFilter.split(',').map(item => item.trim()).filter(item => item.length > 0)
                : []

            // 构建请求参数
            const requestParams = {
                dataBaseId: values.dataBaseId,
                tableName: values.tableName, // 表名数组
                tableFilter: tableFilterArray, // 表过滤条件数组
            }

            // 创建SSE连接
            try {
                const sseManager = api.createSSE({
                    url: '/data/qc/completenessQc',
                    method: 'POST',
                    data: requestParams,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('完整性质控SSE连接已建立', requestParams)
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
                            logger.info('完整性质控SSE消息', messageData)
                            
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
                            logger.info('完整性质控SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('完整性质控SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.handleSystemError('完整性检查连接异常，请检查网络')
                        setLoading(false)
                        setCurrentTaskId(null)
                        setProgress(0)
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('完整性质控SSE连接已关闭')
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
                uiMessage.handleSystemError('启动完整性检查连接失败，请稍后重试')
                setLoading(false)
                setCurrentTaskId(null)
                setProgress(0)
                throw sseError
            }
        } catch (error) {
            logger.error(
                '完整性检查失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.handleSystemError('完整性检查失败，请重试')
            setLoading(false)
            setCurrentTaskId(null)
            setProgress(0)
        }
    }

    // 查看表字段详情
    const handleViewTableDetail = (tableName: string) => {
        setSelectedTable(tableName)

        // 模拟字段级完整性数据
        const mockFieldData: FieldCompleteness[] = [
            {
                key: '1',
                fieldName: 'patient_id',
                fieldComment: '患者ID',
                dataType: 'VARCHAR(20)',
                totalRecords: 50000,
                filledRecords: 50000,
                emptyRecords: 0,
                fillRate: 100,
                isRequired: true,
            },
            {
                key: '2',
                fieldName: 'patient_name',
                fieldComment: '患者姓名',
                dataType: 'VARCHAR(50)',
                totalRecords: 50000,
                filledRecords: 49850,
                emptyRecords: 150,
                fillRate: 99.7,
                isRequired: true,
            },
            {
                key: '3',
                fieldName: 'id_card',
                fieldComment: '身份证号',
                dataType: 'VARCHAR(18)',
                totalRecords: 50000,
                filledRecords: 47500,
                emptyRecords: 2500,
                fillRate: 95.0,
                isRequired: true,
            },
            {
                key: '4',
                fieldName: 'phone',
                fieldComment: '联系电话',
                dataType: 'VARCHAR(15)',
                totalRecords: 50000,
                filledRecords: 42000,
                emptyRecords: 8000,
                fillRate: 84.0,
                isRequired: false,
            },
            {
                key: '5',
                fieldName: 'address',
                fieldComment: '家庭地址',
                dataType: 'VARCHAR(200)',
                totalRecords: 50000,
                filledRecords: 35000,
                emptyRecords: 15000,
                fillRate: 70.0,
                isRequired: false,
            },
        ]
        setFieldCompleteness(mockFieldData)
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

    const handleExportTables = () => {
        const rows = tableCompleteness.map(t => ({
            tableName: t.tableName,
            tableComment: t.tableComment,
            totalRecords: t.totalRecords,
            completenessRate: t.completenessRate,
            incompleteRecords: t.incompleteRecords,
            status: t.status,
        }))
        exportCsv(rows, '完整性质控_表级.csv')
    }

    const handleExportFields = () => {
        const rows = fieldCompleteness.map(f => ({
            fieldName: f.fieldName,
            fieldComment: f.fieldComment,
            dataType: f.dataType,
            totalRecords: f.totalRecords,
            filledRecords: f.filledRecords,
            emptyRecords: f.emptyRecords,
            fillRate: f.fillRate,
            isRequired: f.isRequired ? '是' : '否',
        }))
        exportCsv(rows, `完整性质控_字段_${selectedTable || '未选择'}.csv`)
    }

    // 自动启动逻辑已移除，因为需要用户选择数据库和表

    // 表级完整性表格列配置
    const tableColumns: ColumnsType<TableCompleteness> = [
        {
            title: '表名',
            dataIndex: 'tableName',
            key: 'tableName',
            width: 150,
            render: (text: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '表注释',
            dataIndex: 'tableComment',
            key: 'tableComment',
            width: 150,
        },
        {
            title: '总记录数',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 100,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '完整性',
            dataIndex: 'completenessRate',
            key: 'completenessRate',
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
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => {
                const statusConfig = {
                    excellent: { color: '#52c41a', text: '优秀' },
                    good: { color: '#1890ff', text: '良好' },
                    warning: { color: '#faad14', text: '警告' },
                    poor: { color: '#ff4d4f', text: '较差' },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return <span style={{ color: config.color }}>{config.text}</span>
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type='link'
                    size='small'
                    icon={<SearchOutlined />}
                    onClick={() => handleViewTableDetail(record.tableName)}
                >
                    详情
                </Button>
            ),
        },
    ]

    // 字段级完整性表格列配置
    const fieldColumns: ColumnsType<FieldCompleteness> = [
        {
            title: '字段名',
            dataIndex: 'fieldName',
            key: 'fieldName',
            width: 120,
            render: (text: string, record) => (
                <Space>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    {record.isRequired && <span style={{ color: '#ff4d4f', fontSize: 12 }}>*</span>}
                </Space>
            ),
        },
        {
            title: '字段注释',
            dataIndex: 'fieldComment',
            key: 'fieldComment',
            width: 120,
        },
        {
            title: '数据类型',
            dataIndex: 'dataType',
            key: 'dataType',
            width: 100,
            render: (text: string) => (
                <Text type='secondary' style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '总记录',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '已填充',
            dataIndex: 'filledRecords',
            key: 'filledRecords',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '空值',
            dataIndex: 'emptyRecords',
            key: 'emptyRecords',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#ff4d4f' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '填充率',
            dataIndex: 'fillRate',
            key: 'fillRate',
            width: 100,
            render: (rate: number, record) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={
                        record.isRequired
                            ? rate >= 95
                                ? 'success'
                                : rate >= 80
                                  ? 'active'
                                  : 'exception'
                            : rate >= 80
                              ? 'success'
                              : rate >= 60
                                ? 'active'
                                : 'exception'
                    }
                />
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
                    <PieChartOutlined style={{ marginRight: 8 }} />
                    完整性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='完整性质控功能'
                description='检查数据表和字段的填充率，识别空值和缺失数据，评估数据完整性水平。支持表级和字段级的详细分析。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体统计 - 仅在demo模式下显示 */}
            {isDemoVersion() && overallStats.totalTables > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='检查表数'
                                value={overallStats.totalTables}
                                suffix='张'
                                prefix={<TableOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='平均完整性'
                                value={overallStats.avgCompleteness}
                                suffix='%'
                                valueStyle={{
                                    color:
                                        overallStats.avgCompleteness >= 90
                                            ? '#52c41a'
                                            : overallStats.avgCompleteness >= 70
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                }}
                                prefix={<PieChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='优秀表数'
                                value={overallStats.excellentTables}
                                suffix='张'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='问题表数'
                                value={overallStats.poorTables}
                                suffix='张'
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
                                <DatabaseOutlined style={{ marginRight: 8 }} />
                                检查配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleCompletenessCheck}
                        >
                            <Form.Item
                                label='选择数据库'
                                name='dataBaseId'
                                rules={[{ required: true, message: '请选择数据库' }]}
                            >
                                <Select
                                    placeholder={databaseLoading ? '正在加载数据库...' : '请选择要检查的数据库'}
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
                                name='tableName'
                                rules={[{ required: true, message: '请至少选择一个数据表' }]}
                            >
                                <Select
                                    mode='multiple'
                                    placeholder={tableLoading ? '正在加载表信息...' : '请选择要进行质控的数据表（可多选）'}
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
                                label='表名过滤' 
                                name='tableFilter'
                                tooltip='输入表名关键字进行过滤，多个关键字用逗号分隔'
                            >
                                <Input 
                                    placeholder='输入表名关键字，多个用逗号分隔（可选）' 
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
                                    开始完整性检查
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
                    {/* 表级完整性结果 - 仅在demo模式下显示 */}
                    {isDemoVersion() && (
                        <Card
                            title={
                                <>
                                    <TableOutlined style={{ marginRight: 8 }} />
                                    表级完整性
                                </>
                            }
                            extra={
                                tableCompleteness.length > 0 ? (
                                    <Button type='link' onClick={handleExportTables}>
                                        导出CSV
                                    </Button>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            {tableCompleteness.length > 0 ? (
                                <Table
                                    columns={tableColumns}
                                    dataSource={tableCompleteness}
                                    pagination={{ pageSize: 10 }}
                                    size='middle'
                                    scroll={{ x: 800 }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <PieChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                    <div>暂无检查结果</div>
                                    <div style={{ fontSize: 12, marginTop: 8 }}>请先执行完整性检查</div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* 字段级完整性结果 */}
                    {fieldCompleteness.length > 0 && (
                        <Card
                            title={
                                <>
                                    <DatabaseOutlined style={{ marginRight: 8 }} />
                                    字段级完整性 - {selectedTable}
                                </>
                            }
                            extra={
                                fieldCompleteness.length > 0 ? (
                                    <Space>
                                        <Button
                                            type='link'
                                            onClick={() => setShowRequiredOnly(s => !s)}
                                        >
                                            {showRequiredOnly ? '显示全部字段' : '仅显示必填字段'}
                                        </Button>
                                        <Button type='link' onClick={handleExportFields}>
                                            导出CSV
                                        </Button>
                                    </Space>
                                ) : undefined
                            }
                            style={{ marginBottom: 16 }}
                        >
                            <Table
                                columns={fieldColumns}
                                dataSource={
                                    showRequiredOnly
                                        ? fieldCompleteness.filter(f => f.isRequired)
                                        : fieldCompleteness
                                }
                                pagination={false}
                                size='middle'
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    )}

                    {/* 完整性质控结果 */}
                    {resultData.length > 0 && (
                        <Card
                            title={
                                <>
                                    <TableOutlined style={{ marginRight: 8 }} />
                                    完整性质控结果
                                </>
                            }
                        >
                            <Spin spinning={resultLoading}>
                                <JsonToTable
                                    data={resultData}
                                    columnMapping={{
                                        id: 'ID',
                                        batchId: '批次ID',
                                        tableName: '表名',
                                        fieldName: '字段名',
                                        tableComment: '表注释',
                                        fieldComment: '字段注释',
                                        tableTotalRecords: '表总记录数',
                                        fieldFillRecords: '字段填充记录数',
                                        fieldFillRate: '字段填充率',
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
        </div>
    )
}

export default CompletenessQualityControl
