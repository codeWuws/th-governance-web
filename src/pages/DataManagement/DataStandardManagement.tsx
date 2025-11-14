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
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    CopyOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import TextArea from 'antd/es/input/TextArea'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface DataStandard {
    id: string
    name: string
    code: string
    category: string
    version: string
    status: 'draft' | 'published' | 'deprecated'
    description: string
    definition: string
    dataType: string
    length?: number
    precision?: number
    nullable: boolean
    defaultValue: string
    valueRange: string
    createTime: string
    updateTime: string
    effectiveTime: string
    author: string
    approver: string
}

const mockStandards: DataStandard[] = [
    {
        id: '1',
        name: '患者姓名',
        code: 'PATIENT_NAME',
        category: '患者信息',
        version: 'v1.0',
        status: 'published',
        description: '患者姓名标准',
        definition: '患者的正式姓名，按照身份证或护照等有效证件上的姓名填写',
        dataType: 'VARCHAR',
        length: 100,
        precision: 0,
        nullable: false,
        defaultValue: '',
        valueRange: '中文字符、英文字母、空格，长度不超过100个字符',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        effectiveTime: '2024-01-15 00:00:00',
        author: '张三',
        approver: '李四',
    },
    {
        id: '2',
        name: '性别代码',
        code: 'GENDER_CODE',
        category: '患者信息',
        version: 'v1.0',
        status: 'published',
        description: '性别代码标准',
        definition: '表示患者性别的标准化代码',
        dataType: 'CHAR',
        length: 1,
        precision: 0,
        nullable: false,
        defaultValue: '',
        valueRange: '1:男, 2:女, 3:未知',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        effectiveTime: '2024-01-16 00:00:00',
        author: '王五',
        approver: '赵六',
    },
    {
        id: '3',
        name: '出生日期',
        code: 'BIRTH_DATE',
        category: '患者信息',
        version: 'v1.1',
        status: 'draft',
        description: '出生日期标准',
        definition: '患者出生日期，按照公历日期格式表示',
        dataType: 'DATE',
        length: 0,
        precision: 0,
        nullable: false,
        defaultValue: '',
        valueRange: '1900-01-01 至当前日期',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-22 09:30:00',
        effectiveTime: '',
        author: '孙七',
        approver: '',
    },
]

const DataStandardManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DataStandard[]>([])
    const [filteredData, setFilteredData] = useState<DataStandard[]>([])
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataStandard | null>(null)
    const [viewingRecord, setViewingRecord] = useState<DataStandard | null>(null)
    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockStandards)
        } catch {
            message.error('获取数据标准失败')
        } finally {
            setLoading(false)
        }
    }

    const [form] = Form.useForm()

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
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (categoryFilter) {
            filtered = filtered.filter(item => item.category === categoryFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, categoryFilter, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: DataStandard) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: DataStandard) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleCopy = (_record: DataStandard) => {
        const newRecord = {
            ..._record,
            id: Date.now().toString(),
            name: `${_record.name}_副本`,
            code: `${_record.code}_COPY`,
            version: 'v1.0',
            status: 'draft' as const,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString(),
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
                const newRecord: DataStandard = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    author: '当前用户',
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

    /**
     * 根据数据标准状态返回 AntD Tag 预设颜色标识
     * - 使用预设语义色，保证视觉统一与可读性
     * - 对未知状态返回 'default' 以避免运行时错误
     */
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'success'
            case 'draft':
                return 'warning'
            case 'deprecated':
                return 'error'
            default:
                return 'default'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'published':
                return '已发布'
            case 'draft':
                return '草稿'
            case 'deprecated':
                return '已废弃'
            default:
                return status
        }
    }

    const categories = ['患者信息', '诊疗信息', '药品信息', '检查检验', '费用信息']

    const columns = [
        {
            title: '标准名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span style={{ fontWeight: 'bold' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '标准编码',
            dataIndex: 'code',
            key: 'code',
            width: 120,
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
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '版本',
            dataIndex: 'version',
            key: 'version',
            width: 80,
            render: (text: string) => <Tag color='green'>{text}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (text: string) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
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
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '数据类型',
            dataIndex: 'dataType',
            key: 'dataType',
            width: 100,
            render: (text: string) => <Tag color='orange'>{text}</Tag>,
        },
        {
            title: '创建人',
            dataIndex: 'author',
            key: 'author',
            width: 100,
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
            render: (_: unknown, record: DataStandard) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='复制'>
                        <Button
                            type='text'
                            icon={<CopyOutlined />}
                            size='small'
                            onClick={() => handleCopy(record)}
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
                        title='确定要删除这个数据标准吗？'
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
                    数据标准管理
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增标准
                    </Button>
                </Space>
            </div>
            <Alert
                message='数据标准管理'
                description='维护标准项的编码、定义、分类与状态，支持搜索与筛选。'
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
                        placeholder='分类筛选'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setCategoryFilter}
                    >
                        {categories.map(category => (
                            <Option key={category} value={category}>
                                {category}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        placeholder='状态筛选'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setStatusFilter}
                    >
                        <Option value='draft'>草稿</Option>
                        <Option value='published'>已发布</Option>
                        <Option value='deprecated'>已废弃</Option>
                    </Select>
                </Space>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1300 }}
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
                title={editingRecord ? '编辑数据标准' : '新增数据标准'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{ status: 'draft', nullable: false }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='标准名称'
                                rules={[{ required: true, message: '请输入标准名称' }]}
                            >
                                <Input placeholder='请输入标准名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='code'
                                label='标准编码'
                                rules={[{ required: true, message: '请输入标准编码' }]}
                            >
                                <Input placeholder='请输入标准编码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='category'
                                label='分类'
                                rules={[{ required: true, message: '请选择分类' }]}
                            >
                                <Select placeholder='请选择分类'>
                                    {categories.map(category => (
                                        <Option key={category} value={category}>
                                            {category}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='version'
                                label='版本'
                                rules={[{ required: true, message: '请输入版本' }]}
                            >
                                <Input placeholder='如: v1.0' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='status'
                                label='状态'
                                rules={[{ required: true, message: '请选择状态' }]}
                            >
                                <Select placeholder='请选择状态'>
                                    <Option value='draft'>草稿</Option>
                                    <Option value='published'>已发布</Option>
                                    <Option value='deprecated'>已废弃</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={2} placeholder='请输入描述' maxLength={200} showCount />
                    </Form.Item>

                    <Form.Item
                        name='definition'
                        label='定义'
                        rules={[{ required: true, message: '请输入定义' }]}
                    >
                        <TextArea rows={3} placeholder='请输入定义' maxLength={500} showCount />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='dataType'
                                label='数据类型'
                                rules={[{ required: true, message: '请输入数据类型' }]}
                            >
                                <Input placeholder='如: VARCHAR, INT, DATE' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='length' label='长度'>
                                <Input type='number' placeholder='请输入长度' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='precision' label='精度'>
                                <Input type='number' placeholder='请输入精度' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name='valueRange' label='值域'>
                        <TextArea rows={2} placeholder='请输入值域范围' maxLength={200} showCount />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='数据标准详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {viewingRecord && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label='标准名称' span={2}>
                            {viewingRecord.name}
                        </Descriptions.Item>
                        <Descriptions.Item label='标准编码'>
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
                        <Descriptions.Item label='分类'>
                            <Tag color='blue'>{viewingRecord.category}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='版本'>
                            <Tag color='green'>{viewingRecord.version}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Tag color={getStatusColor(viewingRecord.status)}>
                                {getStatusText(viewingRecord.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='数据类型'>
                            <Tag color='orange'>{viewingRecord.dataType}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='描述' span={2}>
                            {viewingRecord.description}
                        </Descriptions.Item>
                        <Descriptions.Item label='定义' span={2}>
                            {viewingRecord.definition}
                        </Descriptions.Item>
                        <Descriptions.Item label='长度'>
                            {viewingRecord.length || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='精度'>
                            {viewingRecord.precision || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='值域' span={2}>
                            {viewingRecord.valueRange || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='创建人'>{viewingRecord.author}</Descriptions.Item>
                        <Descriptions.Item label='审批人'>
                            {viewingRecord.approver || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='创建时间'>
                            {viewingRecord.createTime}
                        </Descriptions.Item>
                        <Descriptions.Item label='更新时间'>
                            {viewingRecord.updateTime}
                        </Descriptions.Item>
                        <Descriptions.Item label='生效时间'>
                            {viewingRecord.effectiveTime || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    )
}

export default DataStandardManagement
