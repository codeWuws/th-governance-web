import React, { useState, useEffect } from 'react'
import {
    Table,
    Button,
    Space,
    Card,
    Input,
    Select,
    Tag,
    message,
    Modal,
    Form,
    Switch,
    DatePicker,
    Alert,
    Typography,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ImportOutlined,
    ExportOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import moment from 'moment'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface StateDictionary {
    id: string
    name: string
    code: string
    category: string
    description: string
    values: Array<{
        code: string
        name: string
        description: string
        isDefault: boolean
    }>
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    version: string
    effectiveDate: string
    expiryDate: string
}

const StateDictionaryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StateDictionary[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StateDictionary | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // 模拟数据
    const mockData: StateDictionary[] = [
        {
            id: '1',
            name: '患者状态字典',
            code: 'PATIENT_STATUS',
            category: '患者管理',
            description: '定义患者在系统中的各种状态',
            values: [
                { code: 'ACTIVE', name: '活跃', description: '患者处于活跃状态', isDefault: true },
                {
                    code: 'INACTIVE',
                    name: '非活跃',
                    description: '患者处于非活跃状态',
                    isDefault: false,
                },
                { code: 'DELETED', name: '已删除', description: '患者已被删除', isDefault: false },
            ],
            status: 'active',
            createTime: '2024-01-15 10:30:00',
            updateTime: '2024-01-15 10:30:00',
            creator: '张三',
            version: '1.0',
            effectiveDate: '2024-01-01',
            expiryDate: '2025-12-31',
        },
        {
            id: '2',
            name: '数据质量状态',
            code: 'DATA_QUALITY_STATUS',
            category: '数据质量',
            description: '定义数据质量检查的状态',
            values: [
                { code: 'VALID', name: '有效', description: '数据质量检查通过', isDefault: true },
                {
                    code: 'INVALID',
                    name: '无效',
                    description: '数据质量检查未通过',
                    isDefault: false,
                },
                {
                    code: 'PENDING',
                    name: '待检查',
                    description: '数据质量待检查',
                    isDefault: false,
                },
            ],
            status: 'active',
            createTime: '2024-02-01 14:20:00',
            updateTime: '2024-02-01 14:20:00',
            creator: '李四',
            version: '1.1',
            effectiveDate: '2024-02-01',
            expiryDate: '2025-01-31',
        },
        {
            id: '3',
            name: '审批状态',
            code: 'APPROVAL_STATUS',
            category: '工作流',
            description: '定义审批流程中的状态',
            values: [
                { code: 'DRAFT', name: '草稿', description: '审批单处于草稿状态', isDefault: true },
                { code: 'PENDING', name: '待审批', description: '等待审批', isDefault: false },
                { code: 'APPROVED', name: '已批准', description: '审批通过', isDefault: false },
                { code: 'REJECTED', name: '已拒绝', description: '审批被拒绝', isDefault: false },
            ],
            status: 'active',
            createTime: '2024-02-10 09:15:00',
            updateTime: '2024-02-10 09:15:00',
            creator: '王五',
            version: '2.0',
            effectiveDate: '2024-02-10',
            expiryDate: '2026-02-09',
        },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLoading(true)
        setTimeout(() => {
            setData(mockData)
            setLoading(false)
        }, 500)
    }

    const handleSearch = () => {
        let filteredData = mockData

        if (searchText) {
            filteredData = filteredData.filter(
                item =>
                    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (categoryFilter) {
            filteredData = filteredData.filter(item => item.category === categoryFilter)
        }

        if (statusFilter) {
            filteredData = filteredData.filter(item => item.status === statusFilter)
        }

        setData(filteredData)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: StateDictionary) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            effectiveDate: moment(record.effectiveDate),
            expiryDate: moment(record.expiryDate),
        })
        setModalVisible(true)
    }

    const handleDelete = (record: StateDictionary) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除状态字典"${record.name}"吗？`,
            onOk: () => {
                message.success('删除成功')
                loadData()
            },
        })
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData = {
                ...values,
                effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
                expiryDate: values.expiryDate.format('YYYY-MM-DD'),
                updateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            }

            if (editingRecord) {
                message.success('修改成功')
            } else {
                message.success('新增成功')
            }

            setModalVisible(false)
            loadData()
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    const handleImport = () => {
        message.info('导入功能开发中...')
    }

    const handleExport = () => {
        message.success('导出成功')
    }

    const handlePreview = (record: StateDictionary) => {
        Modal.info({
            title: '状态字典详情',
            width: 600,
            content: (
                <div style={{ marginTop: 16 }}>
                    <p>
                        <strong>名称:</strong> {record.name}
                    </p>
                    <p>
                        <strong>编码:</strong> {record.code}
                    </p>
                    <p>
                        <strong>分类:</strong> {record.category}
                    </p>
                    <p>
                        <strong>描述:</strong> {record.description}
                    </p>
                    <p>
                        <strong>状态:</strong>{' '}
                        <Tag color={record.status === 'active' ? 'green' : 'red'}>
                            {record.status === 'active' ? '启用' : '禁用'}
                        </Tag>
                    </p>
                    <p>
                        <strong>版本:</strong> {record.version}
                    </p>
                    <p>
                        <strong>生效日期:</strong> {record.effectiveDate}
                    </p>
                    <p>
                        <strong>失效日期:</strong> {record.expiryDate}
                    </p>
                    <p>
                        <strong>创建人:</strong> {record.creator}
                    </p>
                    <p>
                        <strong>创建时间:</strong> {record.createTime}
                    </p>
                    <p>
                        <strong>字典值:</strong>
                    </p>
                    <Table
                        size='small'
                        dataSource={record.values}
                        columns={[
                            { title: '编码', dataIndex: 'code', key: 'code' },
                            { title: '名称', dataIndex: 'name', key: 'name' },
                            { title: '描述', dataIndex: 'description', key: 'description' },
                            {
                                title: '默认',
                                dataIndex: 'isDefault',
                                key: 'isDefault',
                                render: (isDefault: boolean) =>
                                    isDefault ? <Tag color='blue'>是</Tag> : <Tag>否</Tag>,
                            },
                        ]}
                        pagination={false}
                        rowKey='code'
                    />
                </div>
            ),
        })
    }

    const columns: ColumnsType<StateDictionary> = [
        {
            title: '字典名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '字典编码',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '版本',
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: '字典值数量',
            key: 'values',
            render: (_, record) => <span>{record.values.length} 个</span>,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                    >
                        查看
                    </Button>
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        type='link'
                        danger
                        size='small'
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
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
                <Typography.Title level={2} style={{ margin: 0 }}>
                    状态字典管理
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增状态字典
                    </Button>
                    <Button icon={<ImportOutlined />} onClick={handleImport}>
                        导入
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                </Space>
            </div>
            <Alert
                message='状态字典管理'
                description='支持新增、导入、导出与搜索，维护标准化状态字典。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space style={{ marginBottom: 16 }}></Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder='搜索字典名称、编码或描述'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                        />
                        <Select
                            placeholder='选择分类'
                            style={{ width: 150 }}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            allowClear
                        >
                            <Option value='患者管理'>患者管理</Option>
                            <Option value='数据质量'>数据质量</Option>
                            <Option value='工作流'>工作流</Option>
                            <Option value='系统管理'>系统管理</Option>
                        </Select>
                        <Select
                            placeholder='选择状态'
                            style={{ width: 150 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                        >
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>禁用</Option>
                        </Select>
                        <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                            查询
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑状态字典' : '新增状态字典'}
                visible={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='字典名称'
                        rules={[{ required: true, message: '请输入字典名称' }]}
                    >
                        <Input placeholder='请输入字典名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='字典编码'
                        rules={[{ required: true, message: '请输入字典编码' }]}
                    >
                        <Input placeholder='请输入字典编码' />
                    </Form.Item>

                    <Form.Item
                        name='category'
                        label='分类'
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select placeholder='请选择分类'>
                            <Option value='患者管理'>患者管理</Option>
                            <Option value='数据质量'>数据质量</Option>
                            <Option value='工作流'>工作流</Option>
                            <Option value='系统管理'>系统管理</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入描述' />
                    </Form.Item>

                    <Form.Item
                        name='status'
                        label='状态'
                        valuePropName='checked'
                        initialValue={true}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>

                    <Form.Item
                        name='version'
                        label='版本'
                        rules={[{ required: true, message: '请输入版本' }]}
                    >
                        <Input placeholder='请输入版本' />
                    </Form.Item>

                    <Space>
                        <Form.Item
                            name='effectiveDate'
                            label='生效日期'
                            rules={[{ required: true, message: '请选择生效日期' }]}
                        >
                            <DatePicker placeholder='选择生效日期' />
                        </Form.Item>

                        <Form.Item
                            name='expiryDate'
                            label='失效日期'
                            rules={[{ required: true, message: '请选择失效日期' }]}
                        >
                            <DatePicker placeholder='选择失效日期' />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>
        </div>
    )
}

export default StateDictionaryManagement
