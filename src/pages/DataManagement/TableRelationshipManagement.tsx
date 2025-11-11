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
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface TableRelationship {
    id: string
    name: string
    description: string
    leftTable: string
    rightTable: string
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
    joinConditions: JoinCondition[]
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    cardinality: string
}

interface JoinCondition {
    id: string
    leftColumn: string
    operator: string
    rightColumn: string
}

const mockRelationships: TableRelationship[] = [
    {
        id: '1',
        name: '患者-病历关联',
        description: '患者基本信息表与病历记录表的关联关系',
        leftTable: 'patient_info',
        rightTable: 'medical_record',
        joinType: 'LEFT',
        joinConditions: [
            {
                id: '1',
                leftColumn: 'patient_info.patient_id',
                operator: '=',
                rightColumn: 'medical_record.patient_id',
            },
        ],
        relationshipType: 'one-to-many',
        status: 'active',
        createTime: '2024-01-15 10:00:00',
        updateTime: '2024-01-20 14:30:00',
        creator: '张三',
        cardinality: '1:N',
    },
    {
        id: '2',
        name: '病历-诊断关联',
        description: '病历记录表与诊断信息表的关联关系',
        leftTable: 'medical_record',
        rightTable: 'diagnosis_info',
        joinType: 'INNER',
        joinConditions: [
            {
                id: '2',
                leftColumn: 'medical_record.record_id',
                operator: '=',
                rightColumn: 'diagnosis_info.record_id',
            },
        ],
        relationshipType: 'one-to-many',
        status: 'active',
        createTime: '2024-01-16 09:00:00',
        updateTime: '2024-01-21 16:45:00',
        creator: '李四',
        cardinality: '1:N',
    },
    {
        id: '3',
        name: '患者-药品关联',
        description: '患者基本信息表与药品处方表的关联关系',
        leftTable: 'patient_info',
        rightTable: 'prescription',
        joinType: 'LEFT',
        joinConditions: [
            {
                id: '3',
                leftColumn: 'patient_info.patient_id',
                operator: '=',
                rightColumn: 'prescription.patient_id',
            },
        ],
        relationshipType: 'one-to-many',
        status: 'inactive',
        createTime: '2024-01-17 11:00:00',
        updateTime: '2024-01-22 09:30:00',
        creator: '王五',
        cardinality: '1:N',
    },
]

const TableRelationshipManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<TableRelationship[]>([])
    const [filteredData, setFilteredData] = useState<TableRelationship[]>([])
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [joinTypeFilter, setJoinTypeFilter] = useState<string>('')
    const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<TableRelationship | null>(null)
    const [viewingRecord, setViewingRecord] = useState<TableRelationship | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockRelationships)
        } catch {
            message.error('获取表关联关系失败')
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
                    item.leftTable.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.rightTable.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (joinTypeFilter) {
            filtered = filtered.filter(item => item.joinType === joinTypeFilter)
        }

        if (relationshipTypeFilter) {
            filtered = filtered.filter(item => item.relationshipType === relationshipTypeFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, statusFilter, joinTypeFilter, relationshipTypeFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: TableRelationship) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (_record: TableRelationship) => {
        setViewingRecord(_record)
        setDetailModalVisible(true)
    }

    const handleValidate = (_record: TableRelationship) => {
        // 模拟验证操作
        message.success('关联关系验证通过')
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
                const newRecord: TableRelationship = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
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

    const getJoinTypeColor = (type: string) => {
        switch (type) {
            case 'INNER':
                return 'green'
            case 'LEFT':
                return 'blue'
            case 'RIGHT':
                return 'orange'
            case 'FULL':
                return 'purple'
            default:
                return 'default'
        }
    }

    const getRelationshipTypeColor = (type: string) => {
        switch (type) {
            case 'one-to-one':
                return 'blue'
            case 'one-to-many':
                return 'green'
            case 'many-to-one':
                return 'orange'
            case 'many-to-many':
                return 'purple'
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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '启用'
            case 'inactive':
                return '禁用'
            default:
                return status
        }
    }

    const columns = [
        {
            title: '关联名称',
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
            title: '左表',
            dataIndex: 'leftTable',
            key: 'leftTable',
            width: 120,
            render: (text: string) => (
                <Tooltip title={text}>
                    <code
                        style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '4px' }}
                    >
                        {text}
                    </code>
                </Tooltip>
            ),
        },
        {
            title: '右表',
            dataIndex: 'rightTable',
            key: 'rightTable',
            width: 120,
            render: (text: string) => (
                <Tooltip title={text}>
                    <code
                        style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '4px' }}
                    >
                        {text}
                    </code>
                </Tooltip>
            ),
        },
        {
            title: '连接类型',
            dataIndex: 'joinType',
            key: 'joinType',
            width: 80,
            render: (text: string) => <Tag color={getJoinTypeColor(text)}>{text}</Tag>,
        },
        {
            title: '关系类型',
            dataIndex: 'relationshipType',
            key: 'relationshipType',
            width: 100,
            render: (text: string) => (
                <Tag color={getRelationshipTypeColor(text)}>
                    {text.replace('-', ':').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: '基数',
            dataIndex: 'cardinality',
            key: 'cardinality',
            width: 60,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
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
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
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
            width: 200,
            fixed: 'right' as const,
            render: (_: string, record: TableRelationship) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='验证'>
                        <Button
                            type='text'
                            icon={<CheckCircleOutlined />}
                            size='small'
                            onClick={() => handleValidate(record)}
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
                        title='确定要删除这个表关联关系吗？'
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
                                表关联关系管理
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Search
                                    placeholder='搜索名称、描述或表名'
                                    allowClear
                                    onSearch={handleSearch}
                                    style={{ width: 250 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder='连接类型'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setJoinTypeFilter}
                                >
                                    <Option value='INNER'>INNER</Option>
                                    <Option value='LEFT'>LEFT</Option>
                                    <Option value='RIGHT'>RIGHT</Option>
                                    <Option value='FULL'>FULL</Option>
                                </Select>
                                <Select
                                    placeholder='关系类型'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setRelationshipTypeFilter}
                                >
                                    <Option value='one-to-one'>1:1</Option>
                                    <Option value='one-to-many'>1:N</Option>
                                    <Option value='many-to-one'>N:1</Option>
                                    <Option value='many-to-many'>N:M</Option>
                                </Select>
                                <Select
                                    placeholder='状态'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setStatusFilter}
                                >
                                    <Option value='active'>启用</Option>
                                    <Option value='inactive'>禁用</Option>
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                                <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                                    新增关联
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
                    scroll={{ x: 1400 }}
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
                title={editingRecord ? '编辑表关联关系' : '新增表关联关系'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'active',
                        joinType: 'INNER',
                        relationshipType: 'one-to-many',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='关联名称'
                                rules={[{ required: true, message: '请输入关联名称' }]}
                            >
                                <Input placeholder='请输入关联名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
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
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='leftTable'
                                label='左表'
                                rules={[{ required: true, message: '请输入左表名称' }]}
                            >
                                <Input placeholder='请输入左表名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='rightTable'
                                label='右表'
                                rules={[{ required: true, message: '请输入右表名称' }]}
                            >
                                <Input placeholder='请输入右表名称' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='joinType'
                                label='连接类型'
                                rules={[{ required: true, message: '请选择连接类型' }]}
                            >
                                <Select placeholder='请选择连接类型'>
                                    <Option value='INNER'>INNER JOIN</Option>
                                    <Option value='LEFT'>LEFT JOIN</Option>
                                    <Option value='RIGHT'>RIGHT JOIN</Option>
                                    <Option value='FULL'>FULL JOIN</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='relationshipType'
                                label='关系类型'
                                rules={[{ required: true, message: '请选择关系类型' }]}
                            >
                                <Select placeholder='请选择关系类型'>
                                    <Option value='one-to-one'>一对一 (1:1)</Option>
                                    <Option value='one-to-many'>一对多 (1:N)</Option>
                                    <Option value='many-to-one'>多对一 (N:1)</Option>
                                    <Option value='many-to-many'>多对多 (N:M)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea
                            rows={3}
                            placeholder='请输入关联关系描述'
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='表关联关系详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {viewingRecord && (
                    <>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label='关联名称' span={2}>
                                {viewingRecord.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='左表'>
                                <code
                                    style={{
                                        background: '#f5f5f5',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {viewingRecord.leftTable}
                                </code>
                            </Descriptions.Item>
                            <Descriptions.Item label='右表'>
                                <code
                                    style={{
                                        background: '#f5f5f5',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {viewingRecord.rightTable}
                                </code>
                            </Descriptions.Item>
                            <Descriptions.Item label='连接类型'>
                                <Tag color={getJoinTypeColor(viewingRecord.joinType)}>
                                    {viewingRecord.joinType}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='关系类型'>
                                <Tag
                                    color={getRelationshipTypeColor(viewingRecord.relationshipType)}
                                >
                                    {viewingRecord.relationshipType.replace('-', ':').toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='基数'>
                                <Tag color='blue'>{viewingRecord.cardinality}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Tag color={getStatusColor(viewingRecord.status)}>
                                    {getStatusText(viewingRecord.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='描述' span={2}>
                                {viewingRecord.description}
                            </Descriptions.Item>
                            <Descriptions.Item label='创建人'>
                                {viewingRecord.creator}
                            </Descriptions.Item>
                            <Descriptions.Item label='创建时间'>
                                {viewingRecord.createTime}
                            </Descriptions.Item>
                            <Descriptions.Item label='更新时间'>
                                {viewingRecord.updateTime}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation='left'>连接条件</Divider>
                        <Table
                            columns={[
                                {
                                    title: '左表字段',
                                    dataIndex: 'leftColumn',
                                    key: 'leftColumn',
                                    render: (text: string) => (
                                        <code
                                            style={{
                                                background: '#f5f5f5',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            {text}
                                        </code>
                                    ),
                                },
                                {
                                    title: '操作符',
                                    dataIndex: 'operator',
                                    key: 'operator',
                                    width: 80,
                                    render: (text: string) => <Tag color='blue'>{text}</Tag>,
                                },
                                {
                                    title: '右表字段',
                                    dataIndex: 'rightColumn',
                                    key: 'rightColumn',
                                    render: (text: string) => (
                                        <code
                                            style={{
                                                background: '#f5f5f5',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            {text}
                                        </code>
                                    ),
                                },
                            ]}
                            dataSource={viewingRecord.joinConditions}
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

export default TableRelationshipManagement
