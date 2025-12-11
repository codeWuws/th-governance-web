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
    Typography,
    message,
    Tooltip,
    Popconfirm,
    Descriptions,
    Switch,
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

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface IndexGenerationRule {
    id: string
    name: string // 规则名称
    code: string // 编码
    sourceTable: string // 依据表
    sourceFields: string[] // 依据字段（如：身份证号、姓名、年龄、性别、电话、住址等）
    description: string // 描述
    status: 'active' | 'inactive' // 状态
    createTime: string
    updateTime: string
    creator: string
}

const mockRules: IndexGenerationRule[] = [
    {
        id: '1',
        name: '患者主索引生成规则-身份证号',
        code: 'PATIENT_MPI_IDCARD',
        sourceTable: 'PAT_BASE_INFO',
        sourceFields: ['身份证号', '姓名', '性别', '年龄'],
        description: '基于患者身份证号、姓名、性别、年龄生成唯一主索引',
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '数据管理员',
    },
    {
        id: '2',
        name: '患者主索引生成规则-姓名电话',
        code: 'PATIENT_MPI_NAME_PHONE',
        sourceTable: 'PAT_BASE_INFO',
        sourceFields: ['姓名', '电话', '性别', '年龄', '住址'],
        description: '基于患者姓名、电话、性别、年龄、住址生成唯一主索引',
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '数据管理员',
    },
    {
        id: '3',
        name: '患者主索引生成规则-完整信息',
        code: 'PATIENT_MPI_FULL',
        sourceTable: 'PAT_BASE_INFO',
        sourceFields: ['身份证号', '姓名', '性别', '年龄', '电话', '住址'],
        description: '基于患者身份证号、姓名、性别、年龄、电话、住址生成唯一主索引',
        status: 'active',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-22 09:30:00',
        creator: '系统管理员',
    },
    {
        id: '4',
        name: '患者主索引生成规则-姓名住址',
        code: 'PATIENT_MPI_NAME_ADDR',
        sourceTable: 'PAT_BASE_INFO',
        sourceFields: ['姓名', '住址', '性别', '年龄'],
        description: '基于患者姓名、住址、性别、年龄生成唯一主索引',
        status: 'active',
        createTime: '2024-01-13 14:20:00',
        updateTime: '2024-01-18 10:15:00',
        creator: '数据管理员',
    },
    {
        id: '5',
        name: '患者主索引生成规则-电话住址',
        code: 'PATIENT_MPI_PHONE_ADDR',
        sourceTable: 'PAT_BASE_INFO',
        sourceFields: ['电话', '住址', '姓名', '性别'],
        description: '基于患者电话、住址、姓名、性别生成唯一主索引',
        status: 'inactive',
        createTime: '2024-01-14 09:30:00',
        updateTime: '2024-01-20 11:45:00',
        creator: '数据管理员',
    },
]

const IndexGenerationRules: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexGenerationRule[]>([])
    const [filteredData, setFilteredData] = useState<IndexGenerationRule[]>([])
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexGenerationRule | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexGenerationRule | null>(null)
    const [form] = Form.useForm()

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockRules)
        } catch {
            message.error('获取主索引生成规则失败')
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
                    item.sourceTable.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.sourceFields.some(field => field.toLowerCase().includes(debouncedSearchText.toLowerCase()))
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
            sourceFields: [],
        })
        setModalVisible(true)
    }

    const handleEdit = (record: IndexGenerationRule) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
        })
        setModalVisible(true)
    }

    const handleView = (record: IndexGenerationRule) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleCopy = (_record: IndexGenerationRule) => {
        const newRecord: IndexGenerationRule = {
            ..._record,
            id: Date.now().toString(),
            name: `${_record.name}_副本`,
            code: `${_record.code}_COPY`,
            status: 'inactive',
            createTime: new Date().toLocaleString('zh-CN'),
            updateTime: new Date().toLocaleString('zh-CN'),
        }
        setData([...data, newRecord])
        message.success('复制成功')
    }


    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            const newData = data.filter(item => item.id !== id)
            setData(newData)
            // 数据更新后，useEffect 会自动触发过滤
            message.success('删除成功')
        } catch {
            message.error('删除失败')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            // 将 Switch 的 boolean 值转换为 'active'/'inactive'
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
            }

            if (editingRecord) {
                // 编辑
                const updatedData = data.map(item =>
                    item.id === editingRecord.id
                        ? { ...item, ...formData, updateTime: new Date().toLocaleString('zh-CN') }
                        : item
                )
                setData(updatedData)
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: IndexGenerationRule = {
                    ...formData,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString('zh-CN'),
                    updateTime: new Date().toLocaleString('zh-CN'),
                    creator: '当前用户',
                }
                setData([...data, newRecord])
                message.success('添加成功')
            }

            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'green'
            case 'inactive':
                return 'red'
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
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 180,
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
            title: '依据表',
            dataIndex: 'sourceTable',
            key: 'sourceTable',
            width: 150,
            render: (text: string) => (
                <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>
                    {text}
                </code>
            ),
        },
        {
            title: '依据字段',
            dataIndex: 'sourceFields',
            key: 'sourceFields',
            width: 300,
            render: (fields: string[]) => (
                <Space size='small' wrap>
                    {fields.map((field, index) => (
                        <Tag key={index} color='blue'>
                            {field}
                        </Tag>
                    ))}
                </Space>
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
                <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 160,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: unknown, record: IndexGenerationRule) => (
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
                        title='确定要删除这个主索引生成规则吗？'
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
                    主索引生成规则
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
                message='主索引生成规则'
                description='维护主索引的生成算法与参数，支持搜索、筛选与执行。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Search
                        placeholder='搜索规则名称、编码、依据表或描述'
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder='状态'
                        style={{ width: 120 }}
                        allowClear
                        value={statusFilter}
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
                title={editingRecord ? '编辑主索引生成规则' : '新增主索引生成规则'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={700}
                okText='确定'
                cancelText='取消'
                destroyOnClose
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: true,
                        sourceFields: [],
                    }}
                >
                    <Form.Item
                        name='name'
                        label='规则名称'
                        rules={[{ required: true, message: '请输入规则名称' }]}
                    >
                        <Input placeholder='请输入规则名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='编码'
                        rules={[{ required: true, message: '请输入编码' }]}
                    >
                        <Input placeholder='请输入编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        name='sourceTable'
                        label='依据表'
                        rules={[{ required: true, message: '请输入依据表名称' }]}
                    >
                        <Input placeholder='请输入依据表名称，如：PAT_BASE_INFO' />
                    </Form.Item>

                    <Form.Item
                        name='sourceFields'
                        label='依据字段'
                        rules={[{ required: true, message: '请至少选择一个依据字段' }]}
                    >
                        <Select
                            mode='multiple'
                            placeholder='请选择依据字段（可多选）'
                            showSearch
                            optionFilterProp='children'
                        >
                            <Option value='身份证号'>身份证号</Option>
                            <Option value='姓名'>姓名</Option>
                            <Option value='年龄'>年龄</Option>
                            <Option value='性别'>性别</Option>
                            <Option value='电话'>电话</Option>
                            <Option value='住址'>住址</Option>
                            <Option value='出生日期'>出生日期</Option>
                            <Option value='民族'>民族</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='主索引生成规则详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={700}
            >
                {viewingRecord && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label='规则名称'>
                            <strong>{viewingRecord.name}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label='编码'>
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
                        <Descriptions.Item label='依据表'>
                            <code
                                style={{
                                    background: '#e6f7ff',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                }}
                            >
                                {viewingRecord.sourceTable}
                            </code>
                        </Descriptions.Item>
                        <Descriptions.Item label='依据字段'>
                            <Space size='small' wrap>
                                {viewingRecord.sourceFields.map((field, index) => (
                                    <Tag key={index} color='blue'>
                                        {field}
                                    </Tag>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label='描述'>
                            {viewingRecord.description}
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Tag color={getStatusColor(viewingRecord.status)}>
                                {getStatusText(viewingRecord.status)}
                            </Tag>
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
                )}
            </Modal>
        </div>
    )
}

export default IndexGenerationRules
