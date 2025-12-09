import React, { useState, useEffect } from 'react'
import {
    Alert,
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
    Badge,
    InputNumber,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface IndexMergeRule {
    id: string
    name: string
    code: string
    description: string
    ruleType: 'automatic' | 'manual' | 'semi-automatic'
    mergeType: 'merge' | 'split' | 'both'
    sourceFields: string[]
    targetField: string
    confidenceThreshold: number
    matchAlgorithm: 'exact' | 'fuzzy' | 'probabilistic' | 'machine-learning'
    weightConfig: Record<string, number>
    blockingRules: string[]
    validationRules: string[]
    status: 'active' | 'inactive' | 'testing'
    successRate: number
    totalProcessed: number
    totalMerged: number
    totalSplit: number
    createTime: string
    updateTime: string
    creator: string
    lastExecutor: string
    lastExecutionTime: string
}

const mockMergeRules: IndexMergeRule[] = [
    {
        id: '1',
        name: '患者主索引合并规则',
        code: 'PATIENT_MPI_MERGE',
        description: '基于姓名、身份证号、出生日期等信息的患者主索引自动合并规则',
        ruleType: 'automatic',
        mergeType: 'merge',
        sourceFields: ['name', 'id_card', 'birth_date', 'gender', 'phone'],
        targetField: 'patient_mpi',
        confidenceThreshold: 0.85,
        matchAlgorithm: 'probabilistic',
        weightConfig: {
            name: 0.3,
            id_card: 0.4,
            birth_date: 0.2,
            gender: 0.05,
            phone: 0.05,
        },
        blockingRules: ['birth_date', 'gender'],
        validationRules: ['id_card_format', 'phone_format', 'name_length'],
        status: 'active',
        successRate: 92.5,
        totalProcessed: 12580,
        totalMerged: 3420,
        totalSplit: 0,
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '张三',
        lastExecutor: '李四',
        lastExecutionTime: '2024-01-15 14:30:00',
    },
    {
        id: '2',
        name: '患者主索引拆分规则',
        code: 'PATIENT_MPI_SPLIT',
        description: '基于数据质量问题的患者主索引拆分规则',
        ruleType: 'manual',
        mergeType: 'split',
        sourceFields: ['patient_mpi', 'data_quality_score', 'conflict_flags'],
        targetField: 'patient_mpi',
        confidenceThreshold: 0.95,
        matchAlgorithm: 'exact',
        weightConfig: {
            data_quality_score: 0.7,
            conflict_flags: 0.3,
        },
        blockingRules: ['patient_mpi'],
        validationRules: ['data_quality_threshold', 'manual_review_required'],
        status: 'testing',
        successRate: 98.2,
        totalProcessed: 156,
        totalMerged: 0,
        totalSplit: 89,
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '王五',
        lastExecutor: '赵六',
        lastExecutionTime: '2024-01-16 16:45:00',
    },
    {
        id: '3',
        name: '就诊记录合并规则',
        code: 'VISIT_MERGE_RULE',
        description: '同一患者多次就诊记录的合并规则',
        ruleType: 'semi-automatic',
        mergeType: 'both',
        sourceFields: ['patient_mpi', 'visit_date', 'visit_type', 'department'],
        targetField: 'visit_group_id',
        confidenceThreshold: 0.75,
        matchAlgorithm: 'fuzzy',
        weightConfig: {
            patient_mpi: 0.6,
            visit_date: 0.25,
            visit_type: 0.1,
            department: 0.05,
        },
        blockingRules: ['patient_mpi'],
        validationRules: ['visit_date_range', 'department_validation'],
        status: 'active',
        successRate: 87.3,
        totalProcessed: 45620,
        totalMerged: 12340,
        totalSplit: 567,
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-17 09:30:00',
        creator: '孙七',
        lastExecutor: '周八',
        lastExecutionTime: '2024-01-17 09:30:00',
    },
]

const IndexMergeRules: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexMergeRule[]>([])
    const [filteredData, setFilteredData] = useState<IndexMergeRule[]>([])
    const [searchText, setSearchText] = useState('')
    const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('')
    const [mergeTypeFilter, setMergeTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexMergeRule | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexMergeRule | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockMergeRules)
        } catch {
            message.error('获取主索引合并规则失败')
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
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (ruleTypeFilter) {
            filtered = filtered.filter(item => item.ruleType === ruleTypeFilter)
        }

        if (mergeTypeFilter) {
            filtered = filtered.filter(item => item.mergeType === mergeTypeFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, ruleTypeFilter, mergeTypeFilter, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: IndexMergeRule) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: IndexMergeRule) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }


    const _handleCopy = (_record: IndexMergeRule) => {
        const newRecord = {
            ..._record,
            id: Date.now().toString(),
            name: `${_record.name}_副本`,
            code: `${_record.code}_COPY`,
            status: 'inactive' as const,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString(),
            successRate: 0,
            totalMerged: 0,
            totalSplit: 0,
        }
        setData([...data, newRecord])
        message.success('复制成功')
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
                const newRecord: IndexMergeRule = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                    lastExecutor: '',
                    lastExecutionTime: '',
                    successRate: 0,
                    totalProcessed: 0,
                    totalMerged: 0,
                    totalSplit: 0,
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

    const getRuleTypeColor = (type: string) => {
        switch (type) {
            case 'automatic':
                return 'green'
            case 'manual':
                return 'orange'
            case 'semi-automatic':
                return 'blue'
            default:
                return 'default'
        }
    }

    const getMergeTypeColor = (type: string) => {
        switch (type) {
            case 'merge':
                return 'blue'
            case 'split':
                return 'orange'
            case 'both':
                return 'purple'
            default:
                return 'default'
        }
    }

    const _getStatusColor = (status: string) => {
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

    const getRuleTypeText = (type: string) => {
        switch (type) {
            case 'automatic':
                return '自动'
            case 'manual':
                return '手动'
            case 'semi-automatic':
                return '半自动'
            default:
                return type
        }
    }

    const getMergeTypeText = (type: string) => {
        switch (type) {
            case 'merge':
                return '合并'
            case 'split':
                return '拆分'
            case 'both':
                return '合并/拆分'
            default:
                return type
        }
    }

    const columns = [
        {
            title: '规则名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span style={{ fontWeight: 'bold' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '规则编码',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: (text: string) => (
                <Tooltip title={text}>
                    <code
                        style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}
                    >
                        {text}
                    </code>
                </Tooltip>
            ),
        },
        {
            title: '规则类型',
            dataIndex: 'ruleType',
            key: 'ruleType',
            width: 80,
            render: (text: string) => (
                <Tag color={getRuleTypeColor(text)}>{getRuleTypeText(text)}</Tag>
            ),
        },
        {
            title: '合并类型',
            dataIndex: 'mergeType',
            key: 'mergeType',
            width: 100,
            render: (text: string) => (
                <Tag color={getMergeTypeColor(text)}>{getMergeTypeText(text)}</Tag>
            ),
        },
        {
            title: '置信度阈值',
            dataIndex: 'confidenceThreshold',
            key: 'confidenceThreshold',
            width: 100,
            render: (text: number) => (
                <Tag color={text >= 0.9 ? 'green' : text >= 0.7 ? 'orange' : 'red'}>
                    {(text * 100).toFixed(0)}%
                </Tag>
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
            title: '处理数量',
            dataIndex: 'totalProcessed',
            key: 'totalProcessed',
            width: 100,
            render: (text: number) => (
                <span style={{ fontWeight: 'bold' }}>{text.toLocaleString()}</span>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (text: string) => (
                <Badge
                    status={
                        text === 'active' ? 'success' : text === 'testing' ? 'warning' : 'error'
                    }
                    text={getStatusText(text)}
                />
            ),
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
        },
        {
            title: '最后执行',
            dataIndex: 'lastExecutionTime',
            key: 'lastExecutionTime',
            width: 150,
            render: (text: string) => text || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: unknown, record: IndexMergeRule) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
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
                        title='确定要删除这个主索引合并规则吗？'
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
        <div style={{ padding: 0 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    主索引合并规则
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增规则
                    </Button>
                </Space>
            </div>
            <Alert
                message='主索引合并规则'
                description='维护主索引的合并/拆分规则，支持搜索、筛选与执行。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Search
                        placeholder='搜索名称、编码或描述'
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 250 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder='规则类型'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setRuleTypeFilter}
                    >
                        <Option value='automatic'>自动</Option>
                        <Option value='manual'>手动</Option>
                        <Option value='semi-automatic'>半自动</Option>
                    </Select>
                    <Select
                        placeholder='合并类型'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setMergeTypeFilter}
                    >
                        <Option value='merge'>合并</Option>
                        <Option value='split'>拆分</Option>
                        <Option value='both'>合并/拆分</Option>
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
                </Space>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1800 }}
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
                title={editingRecord ? '编辑主索引合并规则' : '新增主索引合并规则'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={900}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'testing',
                        confidenceThreshold: 0.8,
                        successRate: 0,
                        totalProcessed: 0,
                        totalMerged: 0,
                        totalSplit: 0,
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='规则名称'
                                rules={[{ required: true, message: '请输入规则名称' }]}
                            >
                                <Input placeholder='请输入规则名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='code'
                                label='规则编码'
                                rules={[{ required: true, message: '请输入规则编码' }]}
                            >
                                <Input placeholder='请输入规则编码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='ruleType'
                                label='规则类型'
                                rules={[{ required: true, message: '请选择规则类型' }]}
                            >
                                <Select placeholder='请选择规则类型'>
                                    <Option value='automatic'>自动</Option>
                                    <Option value='manual'>手动</Option>
                                    <Option value='semi-automatic'>半自动</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='mergeType'
                                label='合并类型'
                                rules={[{ required: true, message: '请选择合并类型' }]}
                            >
                                <Select placeholder='请选择合并类型'>
                                    <Option value='merge'>合并</Option>
                                    <Option value='split'>拆分</Option>
                                    <Option value='both'>合并/拆分</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='status'
                                label='状态'
                                rules={[{ required: true, message: '请选择状态' }]}
                            >
                                <Select placeholder='请选择状态'>
                                    <Option value='active'>启用</Option>
                                    <Option value='inactive'>禁用</Option>
                                    <Option value='testing'>测试中</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='matchAlgorithm'
                                label='匹配算法'
                                rules={[{ required: true, message: '请选择匹配算法' }]}
                            >
                                <Select placeholder='请选择匹配算法'>
                                    <Option value='exact'>精确匹配</Option>
                                    <Option value='fuzzy'>模糊匹配</Option>
                                    <Option value='probabilistic'>概率匹配</Option>
                                    <Option value='machine-learning'>机器学习</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='confidenceThreshold'
                                label='置信度阈值'
                                rules={[{ required: true, message: '请输入置信度阈值' }]}
                            >
                                <InputNumber
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    placeholder='0.00-1.00'
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='规则描述'
                        rules={[{ required: true, message: '请输入规则描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入规则描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item
                        name='targetField'
                        label='目标字段'
                        rules={[{ required: true, message: '请输入目标字段' }]}
                    >
                        <Input placeholder='请输入目标字段' />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='主索引合并规则详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1000}
            >
                {viewingRecord && (
                    <>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label='规则名称' span={2}>
                                {viewingRecord.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='规则编码'>
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
                            <Descriptions.Item label='规则类型'>
                                <Tag color={getRuleTypeColor(viewingRecord.ruleType)}>
                                    {getRuleTypeText(viewingRecord.ruleType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='合并类型'>
                                <Tag color={getMergeTypeColor(viewingRecord.mergeType)}>
                                    {getMergeTypeText(viewingRecord.mergeType)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='置信度阈值'>
                                <Tag
                                    color={
                                        viewingRecord.confidenceThreshold >= 0.9
                                            ? 'green'
                                            : viewingRecord.confidenceThreshold >= 0.7
                                              ? 'orange'
                                              : 'red'
                                    }
                                >
                                    {(viewingRecord.confidenceThreshold * 100).toFixed(0)}%
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='匹配算法'>
                                <Tag color='blue'>{viewingRecord.matchAlgorithm}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='目标字段'>
                                <code
                                    style={{
                                        background: '#f5f5f5',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {viewingRecord.targetField}
                                </code>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Badge
                                    status={
                                        viewingRecord.status === 'active'
                                            ? 'success'
                                            : viewingRecord.status === 'testing'
                                              ? 'warning'
                                              : 'error'
                                    }
                                    text={getStatusText(viewingRecord.status)}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='成功率'>
                                <Progress
                                    percent={viewingRecord.successRate}
                                    size='small'
                                    status={
                                        viewingRecord.successRate >= 95
                                            ? 'success'
                                            : viewingRecord.successRate >= 80
                                              ? 'active'
                                              : 'exception'
                                    }
                                    format={percent => `${percent?.toFixed(1)}%`}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='处理数量'>
                                <span style={{ fontWeight: 'bold' }}>
                                    {viewingRecord.totalProcessed.toLocaleString()}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label='合并数量'>
                                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                    {viewingRecord.totalMerged.toLocaleString()}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label='拆分数量'>
                                <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                                    {viewingRecord.totalSplit.toLocaleString()}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label='创建人'>
                                {viewingRecord.creator}
                            </Descriptions.Item>
                            <Descriptions.Item label='最后执行人'>
                                {viewingRecord.lastExecutor || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='创建时间'>
                                {viewingRecord.createTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='最后执行时间'>
                                {viewingRecord.lastExecutionTime || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='更新时间'>
                                {viewingRecord.updateTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='描述' span={2}>
                                {viewingRecord.description}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation='left'>源字段配置</Divider>
                        <Space wrap>
                            {viewingRecord.sourceFields.map((field, index) => (
                                <Tag key={index} color='blue'>
                                    {field}
                                </Tag>
                            ))}
                        </Space>

                        <Divider orientation='left'>权重配置</Divider>
                        <Descriptions bordered column={2} size='small'>
                            {Object.entries(viewingRecord.weightConfig).map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                    <Progress
                                        percent={value * 100}
                                        size='small'
                                        format={percent => `${percent?.toFixed(1)}%`}
                                    />
                                </Descriptions.Item>
                            ))}
                        </Descriptions>

                        <Divider orientation='left'>阻塞规则</Divider>
                        <Space wrap>
                            {viewingRecord.blockingRules.map((rule, index) => (
                                <Tag key={index} color='orange'>
                                    {rule}
                                </Tag>
                            ))}
                        </Space>

                        <Divider orientation='left'>验证规则</Divider>
                        <Space wrap>
                            {viewingRecord.validationRules.map((rule, index) => (
                                <Tag key={index} color='green'>
                                    {rule}
                                </Tag>
                            ))}
                        </Space>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default IndexMergeRules
