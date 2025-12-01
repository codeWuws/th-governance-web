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
    Progress,
    Statistic,
    Row as AntRow,
    Col as AntCol,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    PlayCircleOutlined,
    DatabaseOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface DataQualityControl {
    id: string
    name: string
    code: string
    description: string
    controlType:
        | 'completeness'
        | 'consistency'
        | 'accuracy'
        | 'validity'
        | 'uniqueness'
        | 'timeliness'
    scope: 'field' | 'record' | 'dataset' | 'system'
    severity: 'low' | 'medium' | 'high' | 'critical'
    status: 'active' | 'inactive' | 'testing'
    checkFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'on-demand'
    totalRecords: number
    errorRecords: number
    errorRate: number
    successRate: number
    lastExecutionTime: string
    nextExecutionTime: string
    executor: string
    createTime: string
    updateTime: string
    rules: QualityRule[]
    parameters: Record<string, unknown>
}

interface QualityRule {
    id: string
    name: string
    expression: string
    threshold: number
    operator: '>' | '<' | '=' | '>=' | '<=' | '!='
    description: string
}

const mockQualityControls: DataQualityControl[] = [
    {
        id: '1',
        name: '患者信息完整性检查',
        code: 'PATIENT_COMPLETENESS_CHECK',
        description: '检查患者基本信息字段的完整性',
        controlType: 'completeness',
        scope: 'record',
        severity: 'high',
        status: 'active',
        checkFrequency: 'daily',
        totalRecords: 15620,
        errorRecords: 234,
        errorRate: 1.5,
        successRate: 98.5,
        lastExecutionTime: '2024-01-15 02:00:00',
        nextExecutionTime: '2024-01-16 02:00:00',
        executor: '系统调度',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 02:00:00',
        rules: [
            {
                id: '1',
                name: '姓名完整性',
                expression: 'patient_name IS NOT NULL AND LENGTH(TRIM(patient_name)) > 0',
                threshold: 100,
                operator: '>=',
                description: '患者姓名不能为空',
            },
            {
                id: '2',
                name: '身份证号完整性',
                expression: 'id_card IS NOT NULL AND LENGTH(id_card) = 18',
                threshold: 95,
                operator: '>=',
                description: '身份证号必须为18位',
            },
        ],
        parameters: {
            requiredFields: ['patient_name', 'id_card', 'birth_date', 'gender'],
            allowNullFields: ['phone', 'address'],
        },
    },
    {
        id: '2',
        name: '数据一致性检查',
        code: 'DATA_CONSISTENCY_CHECK',
        description: '检查患者数据在不同系统间的一致性',
        controlType: 'consistency',
        scope: 'dataset',
        severity: 'critical',
        status: 'active',
        checkFrequency: 'real-time',
        totalRecords: 8920,
        errorRecords: 89,
        errorRate: 1.0,
        successRate: 99.0,
        lastExecutionTime: '2024-01-15 14:30:00',
        nextExecutionTime: '2024-01-15 15:00:00',
        executor: '实时检测',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-15 14:30:00',
        rules: [
            {
                id: '3',
                name: '性别一致性',
                expression: 'gender IN ("M", "F", "Male", "Female")',
                threshold: 100,
                operator: '=',
                description: '性别值必须在标准范围内',
            },
            {
                id: '4',
                name: '出生日期一致性',
                expression: 'birth_date <= CURRENT_DATE AND birth_date >= "1900-01-01"',
                threshold: 100,
                operator: '>=',
                description: '出生日期必须在合理范围内',
            },
        ],
        parameters: {
            referenceTables: ['patient_info', 'medical_record'],
            consistencyFields: ['patient_id', 'gender', 'birth_date'],
        },
    },
    {
        id: '3',
        name: '数据准确性验证',
        code: 'DATA_ACCURACY_VALIDATION',
        description: '验证患者数据的准确性和合理性',
        controlType: 'accuracy',
        scope: 'field',
        severity: 'medium',
        status: 'testing',
        checkFrequency: 'weekly',
        totalRecords: 4560,
        errorRecords: 156,
        errorRate: 3.4,
        successRate: 96.6,
        lastExecutionTime: '2024-01-14 10:00:00',
        nextExecutionTime: '2024-01-21 10:00:00',
        executor: '数据管理员',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-14 10:00:00',
        rules: [
            {
                id: '5',
                name: '手机号格式',
                expression: 'phone REGEXP "^1[3-9]\\d{9}$"',
                threshold: 98,
                operator: '>=',
                description: '手机号必须符合中国手机号格式',
            },
            {
                id: '6',
                name: '身份证号格式',
                expression: 'id_card REGEXP "^\\d{17}[\\dXx]$"',
                threshold: 99,
                operator: '>=',
                description: '身份证号必须符合国家标准',
            },
        ],
        parameters: {
            validationRules: ['phone_format', 'id_card_format', 'email_format'],
            crossValidation: true,
        },
    },
]

const DataQualityControl: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DataQualityControl[]>([])
    const [filteredData, setFilteredData] = useState<DataQualityControl[]>([])
    const [searchText, setSearchText] = useState('')
    const [controlTypeFilter, setControlTypeFilter] = useState<string>('')
    const [scopeFilter, setScopeFilter] = useState<string>('')
    const [severityFilter, setSeverityFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataQualityControl | null>(null)
    const [viewingRecord, setViewingRecord] = useState<DataQualityControl | null>(null)
    const [form] = Form.useForm()

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockQualityControls)
        } catch {
            message.error('获取数据质控失败')
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearchText = useDebounce(searchText, 300)

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

        if (controlTypeFilter) {
            filtered = filtered.filter(item => item.controlType === controlTypeFilter)
        }

        if (scopeFilter) {
            filtered = filtered.filter(item => item.scope === scopeFilter)
        }

        if (severityFilter) {
            filtered = filtered.filter(item => item.severity === severityFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, controlTypeFilter, scopeFilter, severityFilter, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: DataQualityControl) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: DataQualityControl) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleExecute = async (_record: DataQualityControl) => {
        try {
            message.loading('正在执行质控规则...', 2)
            await new Promise(resolve => setTimeout(resolve, 2000))
            message.success('质控规则执行成功')
        } catch {
            message.error('质控规则执行失败')
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
                const newRecord: DataQualityControl = {
                    ...values,
                    id: Date.now().toString(),
                    code: `QC_${Date.now()}`,
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    executor: '当前用户',
                    totalRecords: 0,
                    errorRecords: 0,
                    errorRate: 0,
                    successRate: 100,
                    lastExecutionTime: '',
                    nextExecutionTime: '',
                    rules: [],
                    parameters: {},
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

    const getControlTypeColor = (type: string) => {
        switch (type) {
            case 'completeness':
                return 'blue'
            case 'consistency':
                return 'green'
            case 'accuracy':
                return 'orange'
            case 'validity':
                return 'purple'
            case 'uniqueness':
                return 'red'
            case 'timeliness':
                return 'cyan'
            default:
                return 'default'
        }
    }

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'field':
                return 'blue'
            case 'record':
                return 'green'
            case 'dataset':
                return 'orange'
            case 'system':
                return 'red'
            default:
                return 'default'
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'low':
                return 'green'
            case 'medium':
                return 'orange'
            case 'high':
                return 'red'
            case 'critical':
                return 'red'
            default:
                return 'default'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'inactive':
                return 'error'
            case 'testing':
                return 'warning'
            default:
                return 'default'
        }
    }

    const getFrequencyColor = (frequency: string) => {
        switch (frequency) {
            case 'real-time':
                return 'red'
            case 'daily':
                return 'orange'
            case 'weekly':
                return 'blue'
            case 'monthly':
                return 'green'
            case 'on-demand':
                return 'purple'
            default:
                return 'default'
        }
    }

    const getControlTypeText = (type: string) => {
        switch (type) {
            case 'completeness':
                return '完整性'
            case 'consistency':
                return '一致性'
            case 'accuracy':
                return '准确性'
            case 'validity':
                return '有效性'
            case 'uniqueness':
                return '唯一性'
            case 'timeliness':
                return '及时性'
            default:
                return type
        }
    }

    const getScopeText = (scope: string) => {
        switch (scope) {
            case 'field':
                return '字段'
            case 'record':
                return '记录'
            case 'dataset':
                return '数据集'
            case 'system':
                return '系统'
            default:
                return scope
        }
    }

    const getSeverityText = (severity: string) => {
        switch (severity) {
            case 'low':
                return '低'
            case 'medium':
                return '中'
            case 'high':
                return '高'
            case 'critical':
                return '严重'
            default:
                return severity
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '启用'
            case 'inactive':
                return '禁用'
            case 'testing':
                return '测试中'
            default:
                return status
        }
    }

    const getFrequencyText = (frequency: string) => {
        switch (frequency) {
            case 'real-time':
                return '实时'
            case 'daily':
                return '每日'
            case 'weekly':
                return '每周'
            case 'monthly':
                return '每月'
            case 'on-demand':
                return '按需'
            default:
                return frequency
        }
    }

    const columns = [
        {
            title: '质控名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: DataQualityControl) => (
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
            title: '质控类型',
            dataIndex: 'controlType',
            key: 'controlType',
            width: 80,
            render: (text: string) => (
                <Tag color={getControlTypeColor(text)}>{getControlTypeText(text)}</Tag>
            ),
        },
        {
            title: '范围',
            dataIndex: 'scope',
            key: 'scope',
            width: 80,
            render: (text: string) => <Tag color={getScopeColor(text)}>{getScopeText(text)}</Tag>,
        },
        {
            title: '严重程度',
            dataIndex: 'severity',
            key: 'severity',
            width: 80,
            render: (text: string) => (
                <Tag color={getSeverityColor(text)}>{getSeverityText(text)}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (text: string) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
        },
        {
            title: '频率',
            dataIndex: 'checkFrequency',
            key: 'checkFrequency',
            width: 80,
            render: (text: string) => (
                <Tag color={getFrequencyColor(text)}>{getFrequencyText(text)}</Tag>
            ),
        },
        {
            title: '成功率',
            dataIndex: 'successRate',
            key: 'successRate',
            width: 120,
            render: (text: number) => (
                <Progress
                    percent={text}
                    size='small'
                    status={text >= 95 ? 'success' : text >= 80 ? 'active' : 'exception'}
                    format={percent => `${percent?.toFixed(1)}%`}
                />
            ),
        },
        {
            title: '错误率',
            dataIndex: 'errorRate',
            key: 'errorRate',
            width: 80,
            render: (text: number) => (
                <Tag color={text <= 1 ? 'green' : text <= 5 ? 'orange' : 'red'}>
                    {text.toFixed(1)}%
                </Tag>
            ),
        },
        {
            title: '数据量',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 100,
            render: (text: number) => (
                <span style={{ fontWeight: 'bold' }}>{text.toLocaleString()}</span>
            ),
        },
        {
            title: '执行人',
            dataIndex: 'executor',
            key: 'executor',
            width: 100,
        },
        {
            title: '最后执行',
            dataIndex: 'lastExecutionTime',
            key: 'lastExecutionTime',
            width: 150,
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right' as const,
            render: (_: unknown, record: DataQualityControl) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='执行质控'>
                        <Button
                            type='text'
                            icon={<PlayCircleOutlined />}
                            size='small'
                            onClick={() => handleExecute(record)}
                            disabled={record.status !== 'active'}
                        />
                    </Tooltip>
                    <Tooltip title='编辑'>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            size='small'
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个数据质控吗？'
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
                                数据质控
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Search
                                    placeholder='搜索质控名称、编码或描述'
                                    allowClear
                                    onSearch={handleSearch}
                                    style={{ width: 250 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder='质控类型'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setControlTypeFilter}
                                >
                                    <Option value='completeness'>完整性</Option>
                                    <Option value='consistency'>一致性</Option>
                                    <Option value='accuracy'>准确性</Option>
                                    <Option value='validity'>有效性</Option>
                                    <Option value='uniqueness'>唯一性</Option>
                                    <Option value='timeliness'>及时性</Option>
                                </Select>
                                <Select
                                    placeholder='检查范围'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setScopeFilter}
                                >
                                    <Option value='field'>字段</Option>
                                    <Option value='record'>记录</Option>
                                    <Option value='dataset'>数据集</Option>
                                    <Option value='system'>系统</Option>
                                </Select>
                                <Select
                                    placeholder='严重程度'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setSeverityFilter}
                                >
                                    <Option value='low'>低</Option>
                                    <Option value='medium'>中</Option>
                                    <Option value='high'>高</Option>
                                    <Option value='critical'>严重</Option>
                                </Select>
                                <Select
                                    placeholder='状态'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setStatusFilter}
                                >
                                    <Option value='active'>启用</Option>
                                    <Option value='inactive'>禁用</Option>
                                    <Option value='testing'>测试中</Option>
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                                <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                                    新增质控
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
                title={editingRecord ? '编辑数据质控' : '新增数据质控'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'testing',
                        severity: 'medium',
                        checkFrequency: 'daily',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='质控名称'
                                rules={[{ required: true, message: '请输入质控名称' }]}
                            >
                                <Input placeholder='请输入质控名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='severity'
                                label='严重程度'
                                rules={[{ required: true, message: '请选择严重程度' }]}
                            >
                                <Select placeholder='请选择严重程度'>
                                    <Option value='low'>低</Option>
                                    <Option value='medium'>中</Option>
                                    <Option value='high'>高</Option>
                                    <Option value='critical'>严重</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='controlType'
                                label='质控类型'
                                rules={[{ required: true, message: '请选择质控类型' }]}
                            >
                                <Select placeholder='请选择质控类型'>
                                    <Option value='completeness'>完整性</Option>
                                    <Option value='consistency'>一致性</Option>
                                    <Option value='accuracy'>准确性</Option>
                                    <Option value='validity'>有效性</Option>
                                    <Option value='uniqueness'>唯一性</Option>
                                    <Option value='timeliness'>及时性</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='scope'
                                label='检查范围'
                                rules={[{ required: true, message: '请选择检查范围' }]}
                            >
                                <Select placeholder='请选择检查范围'>
                                    <Option value='field'>字段</Option>
                                    <Option value='record'>记录</Option>
                                    <Option value='dataset'>数据集</Option>
                                    <Option value='system'>系统</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='checkFrequency'
                                label='检查频率'
                                rules={[{ required: true, message: '请选择检查频率' }]}
                            >
                                <Select placeholder='请选择检查频率'>
                                    <Option value='real-time'>实时</Option>
                                    <Option value='daily'>每日</Option>
                                    <Option value='weekly'>每周</Option>
                                    <Option value='monthly'>每月</Option>
                                    <Option value='on-demand'>按需</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='数据质控详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1000}
            >
                {viewingRecord && (
                    <>
                        <Descriptions bordered column={2} size='small'>
                            <Descriptions.Item label='质控名称' span={2}>
                                {viewingRecord.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='质控编码'>
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
                            <Descriptions.Item label='质控类型'>
                                <Tag color={getControlTypeColor(viewingRecord.controlType)}>
                                    {getControlTypeText(viewingRecord.controlType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='检查范围'>
                                <Tag color={getScopeColor(viewingRecord.scope)}>
                                    {getScopeText(viewingRecord.scope)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='严重程度'>
                                <Tag color={getSeverityColor(viewingRecord.severity)}>
                                    {getSeverityText(viewingRecord.severity)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='检查频率'>
                                <Tag color={getFrequencyColor(viewingRecord.checkFrequency)}>
                                    {getFrequencyText(viewingRecord.checkFrequency)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Tag color={getStatusColor(viewingRecord.status)}>
                                    {getStatusText(viewingRecord.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='执行人'>
                                {viewingRecord.executor}
                            </Descriptions.Item>
                            <Descriptions.Item label='最后执行'>
                                {viewingRecord.lastExecutionTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='下次执行'>
                                {viewingRecord.nextExecutionTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='创建时间'>
                                {viewingRecord.createTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='更新时间'>
                                {viewingRecord.updateTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='描述' span={2}>
                                {viewingRecord.description}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation='left'>质控统计</Divider>
                        <AntRow gutter={16}>
                            <AntCol span={6}>
                                <Statistic
                                    title='总记录数'
                                    value={viewingRecord.totalRecords}
                                    prefix={<DatabaseOutlined />}
                                />
                            </AntCol>
                            <AntCol span={6}>
                                <Statistic
                                    title='错误记录数'
                                    value={viewingRecord.errorRecords}
                                    valueStyle={{ color: '#cf1322' }}
                                    prefix={<CloseCircleOutlined />}
                                />
                            </AntCol>
                            <AntCol span={6}>
                                <Statistic
                                    title='错误率'
                                    value={viewingRecord.errorRate}
                                    precision={2}
                                    suffix='%'
                                    valueStyle={{
                                        color: viewingRecord.errorRate <= 1 ? '#3f8600' : '#cf1322',
                                    }}
                                    prefix={<ExclamationCircleOutlined />}
                                />
                            </AntCol>
                            <AntCol span={6}>
                                <Statistic
                                    title='成功率'
                                    value={viewingRecord.successRate}
                                    precision={2}
                                    suffix='%'
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </AntCol>
                        </AntRow>

                        <Divider orientation='left'>质控规则</Divider>
                        <Table
                            columns={[
                                {
                                    title: '规则名称',
                                    dataIndex: 'name',
                                    key: 'name',
                                    width: 120,
                                },
                                {
                                    title: '表达式',
                                    dataIndex: 'expression',
                                    key: 'expression',
                                    ellipsis: {
                                        showTitle: false,
                                    },
                                    render: (text: string) => (
                                        <Tooltip title={text}>
                                            <code
                                                style={{
                                                    background: '#f5f5f5',
                                                    padding: '2px 4px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {text}
                                            </code>
                                        </Tooltip>
                                    ),
                                },
                                {
                                    title: '阈值',
                                    dataIndex: 'threshold',
                                    key: 'threshold',
                                    width: 80,
                                    render: (text: number) => (
                                        <span style={{ fontWeight: 'bold' }}>{text}</span>
                                    ),
                                },
                                {
                                    title: '操作符',
                                    dataIndex: 'operator',
                                    key: 'operator',
                                    width: 80,
                                },
                                {
                                    title: '描述',
                                    dataIndex: 'description',
                                    key: 'description',
                                    ellipsis: {
                                        showTitle: false,
                                    },
                                    render: (text: string) => (
                                        <Tooltip title={text}>
                                            <span style={{ fontSize: '12px' }}>{text}</span>
                                        </Tooltip>
                                    ),
                                },
                            ]}
                            dataSource={viewingRecord.rules}
                            rowKey='id'
                            size='small'
                            pagination={false}
                        />
                    </>
                )}
            </Modal>
        </div>
    )
}

export default DataQualityControl
