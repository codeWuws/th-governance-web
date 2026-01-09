import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Badge,
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
    Timeline,
} from 'antd'
import type { BadgeProps } from 'antd'
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
    StarOutlined,
    UserOutlined,
    CalendarOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons'
import { uiMessage } from '@/utils/uiMessage'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface DataQualityAssessment {
    id: string
    name: string
    code: string
    description: string
    assessmentType: 'manual' | 'automatic' | 'semi-automatic'
    dataType: 'emr' | 'lab' | 'image' | 'prescription' | 'diagnosis'
    scope: 'patient' | 'visit' | 'document' | 'department' | 'hospital'
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'critical'
    totalRecords: number
    assessedRecords: number
    qualityScore: number
    accuracyRate: number
    completenessRate: number
    consistencyRate: number
    timelinessRate: number
    assessor: string
    reviewer: string
    startTime: string
    endTime: string
    createTime: string
    updateTime: string
    annotations: QualityAnnotation[]
    issues: QualityIssue[]
    recommendations: string[]
}

interface QualityAnnotation {
    id: string
    field: string
    originalValue: string
    correctedValue: string
    confidence: number
    annotationType: 'error' | 'warning' | 'suggestion'
    description: string
    annotator: string
    createTime: string
}

interface QualityIssue {
    id: string
    category: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    count: number
    percentage: number
    status: 'open' | 'resolved' | 'wont-fix'
}
//     severity: 'low' | 'medium' | 'high' | 'critical'
//     description: string
//     count: number
//     percentage: number
//     status: 'open' | 'resolved' | 'wont-fix'
// }

const mockAssessments: DataQualityAssessment[] = [
    {
        id: '1',
        name: '电子病历数据质量评估',
        code: 'EMR_QUALITY_ASSESS_001',
        description: '对电子病历数据的质量进行全面评估，包括完整性、准确性、一致性等方面',
        assessmentType: 'semi-automatic',
        dataType: 'emr',
        scope: 'patient',
        status: 'completed',
        priority: 'high',
        totalRecords: 12560,
        assessedRecords: 12560,
        qualityScore: 87.5,
        accuracyRate: 92.3,
        completenessRate: 89.7,
        consistencyRate: 85.2,
        timelinessRate: 91.8,
        assessor: '张医生',
        reviewer: '李主任',
        startTime: '2024-01-15 09:00:00',
        endTime: '2024-01-15 17:30:00',
        createTime: '2024-01-14 16:00:00',
        updateTime: '2024-01-15 17:30:00',
        annotations: [
            {
                id: '1',
                field: 'diagnosis_code',
                originalValue: 'ICD10:123.45',
                correctedValue: 'ICD10:A12.3',
                confidence: 0.95,
                annotationType: 'error',
                description: '诊断编码格式错误，应为ICD-10标准格式',
                annotator: '张医生',
                createTime: '2024-01-15 10:30:00',
            },
            {
                id: '2',
                field: 'medication_dosage',
                originalValue: '2片/天',
                correctedValue: '200mg，每日2次',
                confidence: 0.88,
                annotationType: 'suggestion',
                description: '建议明确剂量单位和用药频次',
                annotator: '张医生',
                createTime: '2024-01-15 11:15:00',
            },
        ],
        issues: [
            {
                id: '1',
                category: '诊断编码',
                severity: 'high',
                description: '诊断编码格式不规范',
                count: 234,
                percentage: 1.86,
                status: 'open',
            },
            {
                id: '2',
                category: '用药信息',
                severity: 'medium',
                description: '用药剂量信息不完整',
                count: 567,
                percentage: 4.51,
                status: 'open',
            },
            {
                id: '3',
                category: '时间戳',
                severity: 'low',
                description: '记录时间戳缺失或不准确',
                count: 89,
                percentage: 0.71,
                status: 'resolved',
            },
        ],
        recommendations: [
            '建立标准化的诊断编码体系，确保使用ICD-10标准',
            '完善用药信息的结构化录入，包括剂量、频次、疗程等',
            '加强数据录入培训，提高医护人员的录入质量',
            '建立实时数据质量监控系统，及时发现和纠正问题',
        ],
    },
    {
        id: '2',
        name: '检验报告数据质量评估',
        code: 'LAB_QUALITY_ASSESS_002',
        description: '对检验报告数据的质量进行评估，重点关注数据准确性和完整性',
        assessmentType: 'automatic',
        dataType: 'lab',
        scope: 'visit',
        status: 'in-progress',
        priority: 'medium',
        totalRecords: 8960,
        assessedRecords: 6720,
        qualityScore: 91.2,
        accuracyRate: 94.8,
        completenessRate: 93.5,
        consistencyRate: 89.1,
        timelinessRate: 95.3,
        assessor: '系统',
        reviewer: '王主任',
        startTime: '2024-01-16 08:00:00',
        endTime: '',
        createTime: '2024-01-16 07:30:00',
        updateTime: '2024-01-16 14:45:00',
        annotations: [],
        issues: [
            {
                id: '4',
                category: '参考范围',
                severity: 'medium',
                description: '部分检验项目缺少参考范围',
                count: 123,
                percentage: 1.83,
                status: 'open',
            },
        ],
        recommendations: [
            '完善检验项目的参考范围数据库',
            '建立检验结果异常值自动识别机制',
            '优化检验报告的数据结构',
        ],
    },
    {
        id: '3',
        name: '影像报告数据质量评估',
        code: 'IMAGE_QUALITY_ASSESS_003',
        description: '对医学影像报告的数据质量进行评估',
        assessmentType: 'manual',
        dataType: 'image',
        scope: 'document',
        status: 'pending',
        priority: 'low',
        totalRecords: 3450,
        assessedRecords: 0,
        qualityScore: 0,
        accuracyRate: 0,
        completenessRate: 0,
        consistencyRate: 0,
        timelinessRate: 0,
        assessor: '陈医生',
        reviewer: '',
        startTime: '',
        endTime: '',
        createTime: '2024-01-17 09:00:00',
        updateTime: '2024-01-17 09:00:00',
        annotations: [],
        issues: [],
        recommendations: [],
    },
]

const DataQualityAssessment: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DataQualityAssessment[]>([])
    const [filteredData, setFilteredData] = useState<DataQualityAssessment[]>([])
    const [searchText, setSearchText] = useState('')
    const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>('')
    const [dataTypeFilter, setDataTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [priorityFilter, setPriorityFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataQualityAssessment | null>(null)
    const [viewingRecord, setViewingRecord] = useState<DataQualityAssessment | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockAssessments)
        } catch {
            uiMessage.handleSystemError('获取数据质量评估失败')
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
                    item.assessor.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (assessmentTypeFilter) {
            filtered = filtered.filter(item => item.assessmentType === assessmentTypeFilter)
        }

        if (dataTypeFilter) {
            filtered = filtered.filter(item => item.dataType === dataTypeFilter)
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
        assessmentTypeFilter,
        dataTypeFilter,
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

    const handleEdit = (record: DataQualityAssessment) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: DataQualityAssessment) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleStart = async (_record: DataQualityAssessment) => {
        try {
            message.loading('正在启动评估任务...', 2)
            await new Promise(resolve => setTimeout(resolve, 2000))
            message.success('评估任务启动成功')
        } catch {
            uiMessage.handleSystemError('评估任务启动失败')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            setData(data.filter(item => item.id !== id))
            message.success('删除成功')
        } catch {
            uiMessage.handleSystemError('删除失败')
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
                const newRecord: DataQualityAssessment = {
                    ...values,
                    id: Date.now().toString(),
                    code: `ASSESS_${Date.now()}`,
                    status: 'pending',
                    totalRecords: 0,
                    assessedRecords: 0,
                    qualityScore: 0,
                    accuracyRate: 0,
                    completenessRate: 0,
                    consistencyRate: 0,
                    timelinessRate: 0,
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    annotations: [],
                    issues: [],
                    recommendations: [],
                }
                setData([...data, newRecord])
                message.success('添加成功')
            }

            setModalVisible(false)
            form.resetFields()
        } catch {
            uiMessage.handleSystemError('操作失败')
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
            case 'in-progress':
                return 'processing'
            case 'pending':
                return 'warning'
            case 'cancelled':
                return 'error'
            default:
                return 'default'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
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

    const getAssessmentTypeColor = (type: string) => {
        switch (type) {
            case 'manual':
                return 'blue'
            case 'automatic':
                return 'green'
            case 'semi-automatic':
                return 'orange'
            default:
                return 'default'
        }
    }

    const getDataTypeColor = (type: string) => {
        switch (type) {
            case 'emr':
                return 'blue'
            case 'lab':
                return 'green'
            case 'image':
                return 'orange'
            case 'prescription':
                return 'purple'
            case 'diagnosis':
                return 'red'
            default:
                return 'default'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return '已完成'
            case 'in-progress':
                return '进行中'
            case 'pending':
                return '待处理'
            case 'cancelled':
                return '已取消'
            default:
                return status
        }
    }

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'critical':
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

    const getAssessmentTypeText = (type: string) => {
        switch (type) {
            case 'manual':
                return '手动'
            case 'automatic':
                return '自动'
            case 'semi-automatic':
                return '半自动'
            default:
                return type
        }
    }

    const getDataTypeText = (type: string) => {
        switch (type) {
            case 'emr':
                return '电子病历'
            case 'lab':
                return '检验报告'
            case 'image':
                return '影像报告'
            case 'prescription':
                return '处方信息'
            case 'diagnosis':
                return '诊断信息'
            default:
                return type
        }
    }

    const getScopeText = (scope: string) => {
        switch (scope) {
            case 'patient':
                return '患者'
            case 'visit':
                return '就诊'
            case 'document':
                return '文档'
            case 'department':
                return '科室'
            case 'hospital':
                return '医院'
            default:
                return scope
        }
    }

    const getQualityScoreColor = (score: number) => {
        if (score >= 90) return '#3f8600'
        if (score >= 80) return '#fa8c16'
        return '#cf1322'
    }

    const columns = [
        {
            title: '评估名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: DataQualityAssessment) => (
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
            title: '评估方式',
            dataIndex: 'assessmentType',
            key: 'assessmentType',
            width: 80,
            render: (text: string) => (
                <Tag color={getAssessmentTypeColor(text)}>{getAssessmentTypeText(text)}</Tag>
            ),
        },
        {
            title: '数据类型',
            dataIndex: 'dataType',
            key: 'dataType',
            width: 80,
            render: (text: string) => (
                <Tag color={getDataTypeColor(text)}>{getDataTypeText(text)}</Tag>
            ),
        },
        {
            title: '范围',
            dataIndex: 'scope',
            key: 'scope',
            width: 80,
            render: (text: string) => <Tag color='blue'>{getScopeText(text)}</Tag>,
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
            title: '质量评分',
            dataIndex: 'qualityScore',
            key: 'qualityScore',
            width: 120,
            render: (text: number) =>
                text > 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <Progress
                            type='circle'
                            percent={text}
                            width={40}
                            strokeColor={getQualityScoreColor(text)}
                            format={percent => (
                                <span
                                    style={{ fontSize: '10px', color: getQualityScoreColor(text) }}
                                >
                                    {percent?.toString()}
                                </span>
                            )}
                        />
                        <div
                            style={{
                                fontSize: '11px',
                                color: getQualityScoreColor(text),
                                marginTop: '4px',
                            }}
                        >
                            {text.toFixed(1)}
                        </div>
                    </div>
                ) : (
                    <span>-</span>
                ),
        },
        {
            title: '进度',
            dataIndex: 'assessedRecords',
            key: 'assessedRecords',
            width: 120,
            render: (text: number, record: DataQualityAssessment) => (
                <Progress
                    percent={record.totalRecords > 0 ? (text / record.totalRecords) * 100 : 0}
                    size='small'
                    status={record.status === 'cancelled' ? 'exception' : 'active'}
                    format={() => `${text}/${record.totalRecords}`}
                />
            ),
        },
        {
            title: '评估人',
            dataIndex: 'assessor',
            key: 'assessor',
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
            render: (_: unknown, record: DataQualityAssessment) => (
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
                        <Tooltip title='开始评估'>
                            <Button
                                type='text'
                                icon={<PlayCircleOutlined />}
                                size='small'
                                onClick={() => handleStart(record)}
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
                        title='确定要删除这个数据质量评估吗？'
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
                                数据质量评估
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Search
                                    placeholder='搜索评估名称、编码或评估人'
                                    allowClear
                                    onSearch={handleSearch}
                                    style={{ width: 250 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder='评估方式'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setAssessmentTypeFilter}
                                >
                                    <Option value='manual'>手动</Option>
                                    <Option value='automatic'>自动</Option>
                                    <Option value='semi-automatic'>半自动</Option>
                                </Select>
                                <Select
                                    placeholder='数据类型'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setDataTypeFilter}
                                >
                                    <Option value='emr'>电子病历</Option>
                                    <Option value='lab'>检验报告</Option>
                                    <Option value='image'>影像报告</Option>
                                    <Option value='prescription'>处方信息</Option>
                                    <Option value='diagnosis'>诊断信息</Option>
                                </Select>
                                <Select
                                    placeholder='状态'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setStatusFilter}
                                >
                                    <Option value='pending'>待处理</Option>
                                    <Option value='in-progress'>进行中</Option>
                                    <Option value='completed'>已完成</Option>
                                    <Option value='cancelled'>已取消</Option>
                                </Select>
                                <Select
                                    placeholder='优先级'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setPriorityFilter}
                                >
                                    <Option value='low'>低</Option>
                                    <Option value='medium'>中</Option>
                                    <Option value='high'>高</Option>
                                    <Option value='critical'>紧急</Option>
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                                <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                                    新增评估
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
                    scroll={{ x: 2200 }}
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
                title={editingRecord ? '编辑数据质量评估' : '新增数据质量评估'}
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
                        assessmentType: 'semi-automatic',
                        dataType: 'emr',
                        scope: 'patient',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='评估名称'
                                rules={[{ required: true, message: '请输入评估名称' }]}
                            >
                                <Input placeholder='请输入评估名称' />
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
                                    <Option value='critical'>紧急</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='assessmentType'
                                label='评估方式'
                                rules={[{ required: true, message: '请选择评估方式' }]}
                            >
                                <Select placeholder='请选择评估方式'>
                                    <Option value='manual'>手动</Option>
                                    <Option value='automatic'>自动</Option>
                                    <Option value='semi-automatic'>半自动</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='dataType'
                                label='数据类型'
                                rules={[{ required: true, message: '请选择数据类型' }]}
                            >
                                <Select placeholder='请选择数据类型'>
                                    <Option value='emr'>电子病历</Option>
                                    <Option value='lab'>检验报告</Option>
                                    <Option value='image'>影像报告</Option>
                                    <Option value='prescription'>处方信息</Option>
                                    <Option value='diagnosis'>诊断信息</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='scope'
                                label='评估范围'
                                rules={[{ required: true, message: '请选择评估范围' }]}
                            >
                                <Select placeholder='请选择评估范围'>
                                    <Option value='patient'>患者</Option>
                                    <Option value='visit'>就诊</Option>
                                    <Option value='document'>文档</Option>
                                    <Option value='department'>科室</Option>
                                    <Option value='hospital'>医院</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='assessor'
                                label='评估人'
                                rules={[{ required: true, message: '请输入评估人' }]}
                            >
                                <Input placeholder='请输入评估人' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='reviewer' label='审核人'>
                                <Input placeholder='请输入审核人' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={4} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='数据质量评估详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1400}
            >
                {viewingRecord && (
                    <>
                        <Descriptions bordered column={2} size='small'>
                            <Descriptions.Item label='评估名称' span={2}>
                                {viewingRecord.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='评估编码'>
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
                            <Descriptions.Item label='评估方式'>
                                <Tag color={getAssessmentTypeColor(viewingRecord.assessmentType)}>
                                    {getAssessmentTypeText(viewingRecord.assessmentType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='数据类型'>
                                <Tag color={getDataTypeColor(viewingRecord.dataType)}>
                                    {getDataTypeText(viewingRecord.dataType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='评估范围'>
                                <Tag color='blue'>{getScopeText(viewingRecord.scope)}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='优先级'>
                                <Tag color={getPriorityColor(viewingRecord.priority)}>
                                    {getPriorityText(viewingRecord.priority)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Badge
                                    status={getStatusColor(viewingRecord.status) as BadgeProps['status']}
                                    text={getStatusText(viewingRecord.status)}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='评估人'>
                                <Space size={4}>
                                    <UserOutlined />
                                    {viewingRecord.assessor}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label='审核人'>
                                {viewingRecord.reviewer || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='开始时间'>
                                {viewingRecord.startTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='结束时间'>
                                {viewingRecord.endTime || '-'}
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

                        {viewingRecord.qualityScore > 0 && (
                            <>
                                <Divider orientation='left'>质量评分</Divider>
                                <AntRow gutter={16}>
                                    <AntCol span={4}>
                                        <Statistic
                                            title='综合质量评分'
                                            value={viewingRecord.qualityScore}
                                            precision={1}
                                            valueStyle={{
                                                color: getQualityScoreColor(
                                                    viewingRecord.qualityScore
                                                ),
                                            }}
                                            prefix={<StarOutlined />}
                                            suffix='分'
                                        />
                                    </AntCol>
                                    <AntCol span={4}>
                                        <Statistic
                                            title='准确性'
                                            value={viewingRecord.accuracyRate}
                                            precision={1}
                                            valueStyle={{
                                                color: getQualityScoreColor(
                                                    viewingRecord.accuracyRate
                                                ),
                                            }}
                                            suffix='%'
                                        />
                                    </AntCol>
                                    <AntCol span={4}>
                                        <Statistic
                                            title='完整性'
                                            value={viewingRecord.completenessRate}
                                            precision={1}
                                            valueStyle={{
                                                color: getQualityScoreColor(
                                                    viewingRecord.completenessRate
                                                ),
                                            }}
                                            suffix='%'
                                        />
                                    </AntCol>
                                    <AntCol span={4}>
                                        <Statistic
                                            title='一致性'
                                            value={viewingRecord.consistencyRate}
                                            precision={1}
                                            valueStyle={{
                                                color: getQualityScoreColor(
                                                    viewingRecord.consistencyRate
                                                ),
                                            }}
                                            suffix='%'
                                        />
                                    </AntCol>
                                    <AntCol span={4}>
                                        <Statistic
                                            title='及时性'
                                            value={viewingRecord.timelinessRate}
                                            precision={1}
                                            valueStyle={{
                                                color: getQualityScoreColor(
                                                    viewingRecord.timelinessRate
                                                ),
                                            }}
                                            suffix='%'
                                        />
                                    </AntCol>
                                </AntRow>
                            </>
                        )}

                        {viewingRecord.annotations.length > 0 && (
                            <>
                                <Divider orientation='left'>数据标注</Divider>
                                <Timeline>
                                    {viewingRecord.annotations.map(annotation => (
                                        <Timeline.Item
                                            key={annotation.id}
                                            color={
                                                annotation.annotationType === 'error'
                                                    ? 'red'
                                                    : annotation.annotationType === 'warning'
                                                      ? 'orange'
                                                      : 'blue'
                                            }
                                            dot={
                                                annotation.annotationType === 'error' ? (
                                                    <CloseCircleOutlined />
                                                ) : annotation.annotationType === 'warning' ? (
                                                    <ExclamationCircleOutlined />
                                                ) : (
                                                    <CheckCircleOutlined />
                                                )
                                            }
                                        >
                                            <Space direction='vertical' size={2}>
                                                <div>
                                                    <strong>{annotation.field}</strong> -
                                                    <Tag
                                                        color={
                                                            annotation.annotationType === 'error'
                                                                ? 'red'
                                                                : annotation.annotationType ===
                                                                    'warning'
                                                                  ? 'orange'
                                                                  : 'blue'
                                                        }
                                                    >
                                                        {annotation.annotationType === 'error'
                                                            ? '错误'
                                                            : annotation.annotationType ===
                                                                'warning'
                                                              ? '警告'
                                                              : '建议'}
                                                    </Tag>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    原始值: <code>{annotation.originalValue}</code>{' '}
                                                    → 修正值:{' '}
                                                    <code>{annotation.correctedValue}</code>
                                                </div>
                                                <div style={{ fontSize: '12px' }}>
                                                    {annotation.description}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#999' }}>
                                                    <UserOutlined /> {annotation.annotator} |
                                                    <CalendarOutlined /> {annotation.createTime}
                                                </div>
                                            </Space>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </>
                        )}

                        {viewingRecord.issues.length > 0 && (
                            <>
                                <Divider orientation='left'>发现的问题</Divider>
                                <Table
                                    columns={[
                                        {
                                            title: '问题分类',
                                            dataIndex: 'category',
                                            key: 'category',
                                            width: 120,
                                        },
                                        {
                                            title: '严重程度',
                                            dataIndex: 'severity',
                                            key: 'severity',
                                            width: 80,
                                            render: (text: string) => (
                                                <Tag
                                                    color={
                                                        text === 'critical'
                                                            ? 'red'
                                                            : text === 'high'
                                                              ? 'orange'
                                                              : text === 'medium'
                                                                ? 'yellow'
                                                                : 'green'
                                                    }
                                                >
                                                    {text === 'critical'
                                                        ? '严重'
                                                        : text === 'high'
                                                          ? '高'
                                                          : text === 'medium'
                                                            ? '中'
                                                            : '低'}
                                                </Tag>
                                            ),
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
                                        {
                                            title: '数量',
                                            dataIndex: 'count',
                                            key: 'count',
                                            width: 80,
                                            render: (text: number) => (
                                                <span style={{ fontWeight: 'bold' }}>{text}</span>
                                            ),
                                        },
                                        {
                                            title: '占比',
                                            dataIndex: 'percentage',
                                            key: 'percentage',
                                            width: 80,
                                            render: (text: number) => (
                                                <span
                                                    style={{
                                                        color: text > 5 ? '#cf1322' : '#3f8600',
                                                    }}
                                                >
                                                    {text.toFixed(2)}%
                                                </span>
                                            ),
                                        },
                                        {
                                            title: '状态',
                                            dataIndex: 'status',
                                            key: 'status',
                                            width: 80,
                                            render: (text: string) => (
                                                <Tag
                                                    color={
                                                        text === 'resolved'
                                                            ? 'green'
                                                            : text === 'wont-fix'
                                                              ? 'default'
                                                              : 'orange'
                                                    }
                                                >
                                                    {text === 'resolved'
                                                        ? '已解决'
                                                        : text === 'wont-fix'
                                                          ? '不修复'
                                                          : '待处理'}
                                                </Tag>
                                            ),
                                        },
                                    ]}
                                    dataSource={viewingRecord.issues}
                                    rowKey='id'
                                    size='small'
                                    pagination={false}
                                />
                            </>
                        )}

                        {viewingRecord.recommendations.length > 0 && (
                            <>
                                <Divider orientation='left'>改进建议</Divider>
                                <ol>
                                    {viewingRecord.recommendations.map((recommendation, index) => (
                                        <li key={index} style={{ marginBottom: '8px' }}>
                                            {recommendation}
                                        </li>
                                    ))}
                                </ol>
                            </>
                        )}
                    </>
                )}
            </Modal>
        </div>
    )
}

export default DataQualityAssessment
