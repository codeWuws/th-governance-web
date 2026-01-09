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

interface Metadata {
    id: string
    name: string
    type: 'database' | 'table' | 'field'
    dataSource: string
    schema: string
    description: string
    createTime: string
    updateTime: string
    status: 'active' | 'inactive'
    tags: string[]
}

const mockMetadata: Metadata[] = [
    {
        id: '1',
        name: 'patient_info',
        type: 'table',
        dataSource: 'hospital_db',
        schema: 'public',
        description: '患者基本信息表',
        createTime: '2024-01-15 10:00:00',
        updateTime: '2024-01-20 14:30:00',
        status: 'active',
        tags: ['patient', 'basic-info'],
    },
    {
        id: '2',
        name: 'medical_record',
        type: 'table',
        dataSource: 'hospital_db',
        schema: 'public',
        description: '病历记录表',
        createTime: '2024-01-16 09:00:00',
        updateTime: '2024-01-21 16:45:00',
        status: 'active',
        tags: ['medical', 'record'],
    },
    {
        id: '3',
        name: 'patient_id',
        type: 'field',
        dataSource: 'hospital_db',
        schema: 'public',
        description: '患者ID字段',
        createTime: '2024-01-15 10:00:00',
        updateTime: '2024-01-15 10:00:00',
        status: 'active',
        tags: ['primary-key', 'patient'],
    },
]

const MetadataManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Metadata[]>([])
    const [filteredData, setFilteredData] = useState<Metadata[]>([])
    const [searchText, setSearchText] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<Metadata | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockMetadata)
        } catch {
            uiMessage.handleSystemError('获取元数据失败')
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
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.dataSource.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (typeFilter) {
            filtered = filtered.filter(item => item.type === typeFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, typeFilter, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: Metadata) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
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
                const newRecord: Metadata = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
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

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'database':
                return 'blue'
            case 'table':
                return 'green'
            case 'field':
                return 'orange'
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
            default:
                return 'default'
        }
    }

    const columns = [
        {
            title: '名称',
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
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (text: string) => (
                <Tag color={getTypeColor(text)} style={{ textTransform: 'capitalize' }}>
                    {text === 'database' ? '数据库' : text === 'table' ? '表' : '字段'}
                </Tag>
            ),
        },
        {
            title: '数据源',
            dataIndex: 'dataSource',
            key: 'dataSource',
            width: 120,
        },
        {
            title: '模式',
            dataIndex: 'schema',
            key: 'schema',
            width: 100,
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
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (text: string) => (
                <Tag color={getStatusColor(text)}>{text === 'active' ? '启用' : '禁用'}</Tag>
            ),
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 150,
            render: (tags: string[]) => (
                <Space size='small' wrap>
                    {tags.map(tag => (
                        <Tag key={tag} style={{ marginBottom: '4px' }}>
                            {tag}
                        </Tag>
                    ))}
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
            width: 150,
            fixed: 'right' as const,
            render: (_: unknown, record: Metadata) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleEdit(record)}
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
                        title='确定要删除这个元数据吗？'
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
                    元数据管理
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增元数据
                    </Button>
                </Space>
            </div>
            <Alert
                message='元数据管理'
                description='维护数据库、表与字段的元数据，支持搜索、筛选、编辑与删除。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Search
                        placeholder='搜索名称、描述或数据源'
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 250 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder='类型筛选'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setTypeFilter}
                    >
                        <Option value='database'>数据库</Option>
                        <Option value='table'>表</Option>
                        <Option value='field'>字段</Option>
                    </Select>
                    <Select
                        placeholder='状态筛选'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setStatusFilter}
                    >
                        <Option value='active'>启用</Option>
                        <Option value='inactive'>禁用</Option>
                    </Select>
                </Space>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1200 }}
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
                title={editingRecord ? '编辑元数据' : '新增元数据'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form form={form} layout='vertical' initialValues={{ status: 'active' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='名称'
                                rules={[{ required: true, message: '请输入名称' }]}
                            >
                                <Input placeholder='请输入名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='type'
                                label='类型'
                                rules={[{ required: true, message: '请选择类型' }]}
                            >
                                <Select placeholder='请选择类型'>
                                    <Option value='database'>数据库</Option>
                                    <Option value='table'>表</Option>
                                    <Option value='field'>字段</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='dataSource'
                                label='数据源'
                                rules={[{ required: true, message: '请输入数据源' }]}
                            >
                                <Input placeholder='请输入数据源' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='schema'
                                label='模式'
                                rules={[{ required: true, message: '请输入模式' }]}
                            >
                                <Input placeholder='请输入模式' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入描述' maxLength={200} showCount />
                    </Form.Item>

                    <Form.Item
                        name='status'
                        label='状态'
                        rules={[{ required: true, message: '请选择状态' }]}
                    >
                        <Select placeholder='请选择状态'>
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>禁用</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name='tags' label='标签'>
                        <Select mode='tags' placeholder='请输入标签' tokenSeparators={[',']} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default MetadataManagement
