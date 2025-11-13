import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Modal,
    Form,
    Row,
    Col,
    Typography,
    message,
    Tooltip,
    Popconfirm,
    Descriptions,
    Divider,
    Steps,
    Alert,
    Badge,
    Progress,
    Timeline,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input
const { Step } = Steps

interface IndexProcessingTask {
    id: string
    name: string
    code: string
    description: string
    processingType: 'manual' | 'batch' | 'automatic'
    taskType: 'merge' | 'split' | 'validate' | 'correct'
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    sourceDataCount: number
    processedCount: number
    successCount: number
    failedCount: number
    progress: number
    estimatedTime: number
    actualTime: number
    executor: string
    reviewer: string
    createTime: string
    startTime: string
    endTime: string
    updateTime: string
    parameters: Record<string, string | number | boolean>
    executionSteps: ExecutionStep[]
    errorLog: string[]
    approvalRequired: boolean
    approvalStatus: 'pending' | 'approved' | 'rejected'
}

interface ExecutionStep {
    id: string
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startTime: string
    endTime: string
    description: string
    error?: string
}

const mockProcessingTasks: IndexProcessingTask[] = [
    {
        id: '1',
        name: '患者主索引手动合并',
        code: 'MANUAL_PATIENT_MERGE_001',
        description: '对疑似重复的患者记录进行手动合并处理',
        processingType: 'manual',
        taskType: 'merge',
        status: 'completed',
        priority: 'high',
        sourceDataCount: 156,
        processedCount: 156,
        successCount: 148,
        failedCount: 8,
        progress: 100,
        estimatedTime: 120,
        actualTime: 135,
        executor: '张医生',
        reviewer: '李主任',
        createTime: '2024-01-15 09:00:00',
        startTime: '2024-01-15 09:30:00',
        endTime: '2024-01-15 11:45:00',
        updateTime: '2024-01-15 11:45:00',
        parameters: {
            confidenceThreshold: 0.85,
            manualReviewRequired: true,
            mergeStrategy: 'conservative',
        },
        executionSteps: [
            {
                id: '1',
                name: '数据预处理',
                status: 'completed',
                startTime: '2024-01-15 09:30:00',
                endTime: '2024-01-15 09:35:00',
                description: '清洗和标准化患者数据',
            },
            {
                id: '2',
                name: '相似度计算',
                status: 'completed',
                startTime: '2024-01-15 09:35:00',
                endTime: '2024-01-15 10:15:00',
                description: '计算患者记录间的相似度',
            },
            {
                id: '3',
                name: '人工审核',
                status: 'completed',
                startTime: '2024-01-15 10:15:00',
                endTime: '2024-01-15 11:30:00',
                description: '医生人工审核合并建议',
            },
            {
                id: '4',
                name: '合并执行',
                status: 'completed',
                startTime: '2024-01-15 11:30:00',
                endTime: '2024-01-15 11:45:00',
                description: '执行最终的合并操作',
            },
        ],
        errorLog: [],
        approvalRequired: true,
        approvalStatus: 'approved',
    },
    {
        id: '2',
        name: '批量患者索引拆分',
        code: 'BATCH_PATIENT_SPLIT_002',
        description: '对数据质量问题导致的错误合并进行批量拆分',
        processingType: 'batch',
        taskType: 'split',
        status: 'running',
        priority: 'medium',
        sourceDataCount: 89,
        processedCount: 56,
        successCount: 52,
        failedCount: 4,
        progress: 63,
        estimatedTime: 60,
        actualTime: 38,
        executor: '系统管理员',
        reviewer: '',
        createTime: '2024-01-16 14:00:00',
        startTime: '2024-01-16 14:15:00',
        endTime: '',
        updateTime: '2024-01-16 14:53:00',
        parameters: {
            splitStrategy: 'quality_based',
            qualityThreshold: 0.7,
            autoApproval: true,
        },
        executionSteps: [
            {
                id: '1',
                name: '质量检测',
                status: 'completed',
                startTime: '2024-01-16 14:15:00',
                endTime: '2024-01-16 14:25:00',
                description: '检测数据质量问题',
            },
            {
                id: '2',
                name: '拆分分析',
                status: 'running',
                startTime: '2024-01-16 14:25:00',
                endTime: '',
                description: '分析需要拆分的记录',
            },
            {
                id: '3',
                name: '拆分执行',
                status: 'pending',
                startTime: '',
                endTime: '',
                description: '执行拆分操作',
            },
            {
                id: '4',
                name: '结果验证',
                status: 'pending',
                startTime: '',
                endTime: '',
                description: '验证拆分结果',
            },
        ],
        errorLog: [],
        approvalRequired: false,
        approvalStatus: 'pending',
    },
    {
        id: '3',
        name: '患者索引验证任务',
        code: 'PATIENT_INDEX_VALIDATE_003',
        description: '验证患者主索引的一致性和准确性',
        processingType: 'automatic',
        taskType: 'validate',
        status: 'failed',
        priority: 'urgent',
        sourceDataCount: 1240,
        processedCount: 1156,
        successCount: 1089,
        failedCount: 67,
        progress: 93,
        estimatedTime: 30,
        actualTime: 28,
        executor: '系统',
        reviewer: '',
        createTime: '2024-01-17 08:00:00',
        startTime: '2024-01-17 08:05:00',
        endTime: '2024-01-17 08:33:00',
        updateTime: '2024-01-17 08:33:00',
        parameters: {
            validationLevel: 'strict',
            checkDuplicates: true,
            checkConsistency: true,
        },
        executionSteps: [
            {
                id: '1',
                name: '数据加载',
                status: 'completed',
                startTime: '2024-01-17 08:05:00',
                endTime: '2024-01-17 08:10:00',
                description: '加载待验证数据',
            },
            {
                id: '2',
                name: '重复性检查',
                status: 'completed',
                startTime: '2024-01-17 08:10:00',
                endTime: '2024-01-17 08:20:00',
                description: '检查重复的患者索引',
            },
            {
                id: '3',
                name: '一致性验证',
                status: 'failed',
                startTime: '2024-01-17 08:20:00',
                endTime: '2024-01-17 08:30:00',
                description: '验证数据一致性',
                error: '发现数据不一致：患者ID冲突',
            },
            {
                id: '4',
                name: '报告生成',
                status: 'skipped',
                startTime: '',
                endTime: '',
                description: '生成验证报告',
            },
        ],
        errorLog: [
            '2024-01-17 08:30:00 - 发现患者ID冲突: P123456 与 P123457',
            '2024-01-17 08:31:00 - 数据一致性问题：同一患者对应多个不同ID',
        ],
        approvalRequired: false,
        approvalStatus: 'pending',
    },
]

const IndexProcessingManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexProcessingTask[]>([])
    const [filteredData, setFilteredData] = useState<IndexProcessingTask[]>([])
    const [searchText, setSearchText] = useState('')
    const [processingTypeFilter, setProcessingTypeFilter] = useState<string>('')
    const [taskTypeFilter, setTaskTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [priorityFilter, setPriorityFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexProcessingTask | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexProcessingTask | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockProcessingTasks)
        } catch {
            message.error('获取主索引处理任务失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        let filtered = [...data]

        if (debouncedSearchText) {
            filtered = filtered.filter(
                item =>
                    item.name.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.code.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.executor.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (processingTypeFilter) {
            filtered = filtered.filter(item => item.processingType === processingTypeFilter)
        }

        if (taskTypeFilter) {
            filtered = filtered.filter(item => item.taskType === taskTypeFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (priorityFilter) {
            filtered = filtered.filter(item => item.priority === priorityFilter)
        }

        setFilteredData(filtered)
    }, [
        data,
        debouncedSearchText,
        processingTypeFilter,
        taskTypeFilter,
        statusFilter,
        priorityFilter,
    ])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: IndexProcessingTask) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: IndexProcessingTask) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleExecute = async (_record: IndexProcessingTask) => {
        try {
            message.loading('正在启动任务...', 2)
            await new Promise(resolve => setTimeout(resolve, 2000))
            message.success('任务启动成功')
        } catch {
            message.error('任务启动失败')
        }
    }

    const handleCancel = async (_record: IndexProcessingTask) => {
        try {
            message.loading('正在取消任务...', 2)
            await new Promise(resolve => setTimeout(resolve, 2000))
            message.success('任务取消成功')
        } catch {
            message.error('任务取消失败')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            setData(data.filter(item => item.id !== id))
            message.success('删除成功')
        } catch {
            message.error('删除失败')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            if (editingRecord) {
                // 编辑
                const updatedData = data.map(item =>
                    item.id === editingRecord.id
                        ? { ...item, ...values, updateTime: new Date().toLocaleString() }
                        : item
                )
                setData(updatedData)
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: IndexProcessingTask = {
                    ...values,
                    id: Date.now().toString(),
                    code: `TASK_${Date.now()}`,
                    status: 'pending',
                    progress: 0,
                    sourceDataCount: 0,
                    processedCount: 0,
                    successCount: 0,
                    failedCount: 0,
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    executionSteps: [],
                    errorLog: [],
                }
                setData([...data, newRecord])
                message.success('添加成功')
            }

            setModalVisible(false)
            form.resetFields()
        } catch {
            message.error('操作失败')
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success'
            case 'running':
                return 'processing'
            case 'failed':
                return 'error'
            case 'cancelled':
                return 'warning'
            case 'pending':
                return 'default'
            default:
                return 'default'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return '已完成'
            case 'running':
                return '运行中'
            case 'failed':
                return '失败'
            case 'cancelled':
                return '已取消'
            case 'pending':
                return '待处理'
            default:
                return status
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'red'
            case 'high':
                return 'orange'
            case 'medium':
                return 'blue'
            case 'low':
                return 'green'
            default:
                return 'default'
        }
    }

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return '紧急'
            case 'high':
                return '高'
            case 'medium':
                return '中'
            case 'low':
                return '低'
            default:
                return priority
        }
    }

    const getProcessingTypeText = (type: string) => {
        switch (type) {
            case 'manual':
                return '手动'
            case 'batch':
                return '批量'
            case 'automatic':
                return '自动'
            default:
                return type
        }
    }

    const getTaskTypeText = (type: string) => {
        switch (type) {
            case 'merge':
                return '合并'
            case 'split':
                return '拆分'
            case 'validate':
                return '验证'
            case 'correct':
                return '修正'
            default:
                return type
        }
    }

    const getStepStatus = (status: string) => {
        switch (status) {
            case 'completed':
                return 'finish'
            case 'running':
                return 'process'
            case 'failed':
                return 'error'
            case 'skipped':
                return 'wait'
            default:
                return 'wait'
        }
    }

    const columns = [
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: IndexProcessingTask) => (
                <Space direction='vertical' size={0}>
                    <Tooltip title={text}>
                        <span style={{ fontWeight: 'bold' }}>{text}</span>
                    </Tooltip>
                    <Tooltip title={record.code}>
                        <code style={{ fontSize: '12px', color: '#666' }}>{record.code}</code>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: '类型',
            dataIndex: 'processingType',
            key: 'processingType',
            width: 80,
            render: (text: string) => <Tag color='blue'>{getProcessingTypeText(text)}</Tag>,
        },
        {
            title: '任务类型',
            dataIndex: 'taskType',
            key: 'taskType',
            width: 80,
            render: (text: string) => <Tag color='green'>{getTaskTypeText(text)}</Tag>,
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            key: 'priority',
            width: 80,
            render: (text: string) => (
                <Tag color={getPriorityColor(text)}>{getPriorityText(text)}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (text: string) => (
                <Badge
                    status={getStatusColor(text) as BadgeProps['status']}
                    text={getStatusText(text)}
                />
            ),
        },
        {
            title: '进度',
            dataIndex: 'progress',
            key: 'progress',
            width: 120,
            render: (text: number, record: IndexProcessingTask) => (
                <Progress
                    percent={text}
                    size='small'
                    status={record.status === 'failed' ? 'exception' : 'active'}
                    format={percent => `${percent}%`}
                />
            ),
        },
        {
            title: '数据处理',
            dataIndex: 'processedCount',
            key: 'processedCount',
            width: 120,
            render: (text: number, record: IndexProcessingTask) => (
                <Space direction='vertical' size={0}>
                    <span style={{ fontSize: '12px' }}>
                        {text}/{record.sourceDataCount}
                    </span>
                    <span style={{ fontSize: '11px', color: '#52c41a' }}>
                        成功: {record.successCount}
                    </span>
                    <span style={{ fontSize: '11px', color: '#ff4d4f' }}>
                        失败: {record.failedCount}
                    </span>
                </Space>
            ),
        },
        {
            title: '执行时间',
            dataIndex: 'estimatedTime',
            key: 'estimatedTime',
            width: 120,
            render: (text: number, record: IndexProcessingTask) => (
                <Space direction='vertical' size={0}>
                    <span style={{ fontSize: '12px' }}>预计: {text}分钟</span>
                    {record.actualTime > 0 && (
                        <span style={{ fontSize: '11px', color: '#666' }}>
                            实际: {record.actualTime}分钟
                        </span>
                    )}
                </Space>
            ),
        },
        {
            title: '执行人',
            dataIndex: 'executor',
            key: 'executor',
            width: 100,
            render: (text: string) => (
                <Space size={4}>
                    <UserOutlined style={{ fontSize: '12px' }} />
                    <span style={{ fontSize: '12px' }}>{text}</span>
                </Space>
            ),
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            width: 150,
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right' as const,
            render: (_: unknown, record: IndexProcessingTask) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <Tooltip title='启动任务'>
                            <Button
                                type='text'
                                icon={<PlayCircleOutlined />}
                                size='small'
                                onClick={() => handleExecute(record)}
                            />
                        </Tooltip>
                    )}
                    {record.status === 'running' && (
                        <Tooltip title='取消任务'>
                            <Button
                                type='text'
                                danger
                                icon={<CloseCircleOutlined />}
                                size='small'
                                onClick={() => handleCancel(record)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title='编辑'>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            size='small'
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个主索引处理任务吗？'
                        onConfirm={() => handleDelete(record.id)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Tooltip title='删除'>
                            <Button type='text' danger icon={<DeleteOutlined />} size='small' />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align='middle'>
                        <Col flex='auto'>
                            <Title level={3} style={{ margin: 0 }}>
                                患者索引处理
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Search
                                    placeholder='搜索任务名称、编码或执行人'
                                    allowClear
                                    onSearch={handleSearch}
                                    style={{ width: 250 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder='处理方式'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setProcessingTypeFilter}
                                >
                                    <Option value='manual'>手动</Option>
                                    <Option value='batch'>批量</Option>
                                    <Option value='automatic'>自动</Option>
                                </Select>
                                <Select
                                    placeholder='任务类型'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setTaskTypeFilter}
                                >
                                    <Option value='merge'>合并</Option>
                                    <Option value='split'>拆分</Option>
                                    <Option value='validate'>验证</Option>
                                    <Option value='correct'>修正</Option>
                                </Select>
                                <Select
                                    placeholder='优先级'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setPriorityFilter}
                                >
                                    <Option value='urgent'>紧急</Option>
                                    <Option value='high'>高</Option>
                                    <Option value='medium'>中</Option>
                                    <Option value='low'>低</Option>
                                </Select>
                                <Select
                                    placeholder='状态'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setStatusFilter}
                                >
                                    <Option value='pending'>待处理</Option>
                                    <Option value='running'>运行中</Option>
                                    <Option value='completed'>已完成</Option>
                                    <Option value='failed'>失败</Option>
                                    <Option value='cancelled'>已取消</Option>
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                                <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                                    新增任务
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 2000 }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 20,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑主索引处理任务' : '新增主索引处理任务'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'pending',
                        priority: 'medium',
                        processingType: 'manual',
                        taskType: 'merge',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='任务名称'
                                rules={[{ required: true, message: '请输入任务名称' }]}
                            >
                                <Input placeholder='请输入任务名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='priority'
                                label='优先级'
                                rules={[{ required: true, message: '请选择优先级' }]}
                            >
                                <Select placeholder='请选择优先级'>
                                    <Option value='low'>低</Option>
                                    <Option value='medium'>中</Option>
                                    <Option value='high'>高</Option>
                                    <Option value='urgent'>紧急</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='processingType'
                                label='处理方式'
                                rules={[{ required: true, message: '请选择处理方式' }]}
                            >
                                <Select placeholder='请选择处理方式'>
                                    <Option value='manual'>手动</Option>
                                    <Option value='batch'>批量</Option>
                                    <Option value='automatic'>自动</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='taskType'
                                label='任务类型'
                                rules={[{ required: true, message: '请选择任务类型' }]}
                            >
                                <Select placeholder='请选择任务类型'>
                                    <Option value='merge'>合并</Option>
                                    <Option value='split'>拆分</Option>
                                    <Option value='validate'>验证</Option>
                                    <Option value='correct'>修正</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='executor'
                                label='执行人'
                                rules={[{ required: true, message: '请输入执行人' }]}
                            >
                                <Input placeholder='请输入执行人' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='任务描述'
                        rules={[{ required: true, message: '请输入任务描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入任务描述' maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='主索引处理任务详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1200}
            >
                {viewingRecord && (
                    <>
                        <Descriptions bordered column={2} size='small'>
                            <Descriptions.Item label='任务名称' span={2}>
                                {viewingRecord.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='任务编码'>
                                <code
                                    style={{
                                        background: '#f5f5f5',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {viewingRecord.code}
                                </code>
                            </Descriptions.Item>
                            <Descriptions.Item label='处理方式'>
                                <Tag color='blue'>
                                    {getProcessingTypeText(viewingRecord.processingType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='任务类型'>
                                <Tag color='green'>{getTaskTypeText(viewingRecord.taskType)}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='优先级'>
                                <Tag color={getPriorityColor(viewingRecord.priority)}>
                                    {getPriorityText(viewingRecord.priority)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Badge
                                    status={
                                        getStatusColor(viewingRecord.status) as BadgeProps['status']
                                    }
                                    text={getStatusText(viewingRecord.status)}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='执行人'>
                                <Space size={4}>
                                    <UserOutlined />
                                    {viewingRecord.executor}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label='审核人'>
                                {viewingRecord.reviewer || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='创建时间'>
                                {viewingRecord.createTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='开始时间'>
                                {viewingRecord.startTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='结束时间'>
                                {viewingRecord.endTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='更新时间'>
                                {viewingRecord.updateTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='描述' span={2}>
                                {viewingRecord.description}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation='left'>执行进度</Divider>
                        <div style={{ marginBottom: '16px' }}>
                            <Progress
                                percent={viewingRecord.progress}
                                status={viewingRecord.status === 'failed' ? 'exception' : 'active'}
                                format={percent => `${percent}%`}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Space>
                                    <span>
                                        数据处理: {viewingRecord.processedCount}/
                                        {viewingRecord.sourceDataCount}
                                    </span>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    <span>成功: {viewingRecord.successCount}</span>
                                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    <span>失败: {viewingRecord.failedCount}</span>
                                </Space>
                            </div>
                        </div>

                        <Divider orientation='left'>执行步骤</Divider>
                        <Steps
                            current={viewingRecord.executionSteps.findIndex(
                                step => step.status === 'running'
                            )}
                            status={viewingRecord.status === 'failed' ? 'error' : 'process'}
                            style={{ marginBottom: '16px' }}
                        >
                            {viewingRecord.executionSteps.map(step => (
                                <Step
                                    key={step.id}
                                    title={step.name}
                                    description={step.description}
                                    status={getStepStatus(step.status)}
                                />
                            ))}
                        </Steps>

                        {viewingRecord.errorLog.length > 0 && (
                            <>
                                <Divider orientation='left'>错误日志</Divider>
                                <Alert
                                    message='执行错误'
                                    description={
                                        <Timeline>
                                            {viewingRecord.errorLog.map((error, index) => (
                                                <Timeline.Item key={index} color='red'>
                                                    {error}
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    }
                                    type='error'
                                />
                            </>
                        )}
                    </>
                )}
            </Modal>
        </div>
    )
}

export default IndexProcessingManagement
