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
    Alert,
    Typography,
    Popconfirm,
    Row,
    Col,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ImportOutlined,
    ExportOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface StandardDictionaryMapping {
    id: string
    standardName: string // 标准名称
    standardDatasetName: string // 标准数据集名称
    standardDatasetContent: string // 标准数据集内容
    originalTableName: string // 原始表名称
    originalDataField: string // 原始数据字段
    originalDataset: string // 原始数据集
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
}

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StandardDictionaryMapping[]>([])
    const [filteredData, setFilteredData] = useState<StandardDictionaryMapping[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [viewingRecord, setViewingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [standardNameFilter, setStandardNameFilter] = useState<string>('')

    // 模拟数据
    const mockData: StandardDictionaryMapping[] = [
        {
            id: '1',
            standardName: '患者基本信息',
            standardDatasetName: '性别',
            standardDatasetContent: '男',
            originalTableName: '门诊患者基本信息',
            originalDataField: 'sex',
            originalDataset: 'M',
            status: 'active',
            createTime: '2024-01-15 10:00:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '张三',
        },
        {
            id: '2',
            standardName: '患者基本信息',
            standardDatasetName: '性别',
            standardDatasetContent: '女',
            originalTableName: '门诊患者基本信息',
            originalDataField: 'sex',
            originalDataset: 'F',
            status: 'active',
            createTime: '2024-01-15 10:00:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '张三',
        },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        filterData()
    }, [searchText, statusFilter, standardNameFilter, data])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockData)
            setFilteredData(mockData)
        } catch {
            message.error('获取标准字典对照失败')
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let filtered = [...data]

        if (searchText) {
            filtered = filtered.filter(
                item =>
                    item.standardName.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.standardDatasetName.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.standardDatasetContent.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalTableName.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalDataField.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalDataset.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (standardNameFilter) {
            filtered = filtered.filter(item => item.standardName === standardNameFilter)
        }

        setFilteredData(filtered)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
        })
        setModalVisible(true)
    }

    const handleEdit = (record: StandardDictionaryMapping) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active',
        })
        setModalVisible(true)
    }

    const handleDelete = (record: StandardDictionaryMapping) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标准字典对照记录吗？`,
            onOk: () => {
                const newData = data.filter(item => item.id !== record.id)
                setData(newData)
                message.success('删除成功')
                fetchData()
            },
        })
    }

    const handleView = (record: StandardDictionaryMapping) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData: StandardDictionaryMapping = {
                id: editingRecord?.id || Date.now().toString(),
                standardName: values.standardName,
                standardDatasetName: values.standardDatasetName,
                standardDatasetContent: values.standardDatasetContent,
                originalTableName: values.originalTableName,
                originalDataField: values.originalDataField,
                originalDataset: values.originalDataset,
                status: values.status ? 'active' : 'inactive',
                createTime: editingRecord?.createTime || new Date().toLocaleString('zh-CN'),
                updateTime: new Date().toLocaleString('zh-CN'),
                creator: editingRecord?.creator || '当前用户',
            }

            if (editingRecord) {
                const newData = data.map(item => (item.id === editingRecord.id ? formData : item))
                setData(newData)
                message.success('修改成功')
            } else {
                setData([...data, formData])
                message.success('新增成功')
            }

            setModalVisible(false)
            form.resetFields()
            fetchData()
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    const handleImport = () => {
        message.info('导入功能开发中...')
    }

    const handleExport = () => {
        message.success('导出成功')
    }

    // 获取所有标准名称用于筛选
    const standardNames = Array.from(new Set(data.map(item => item.standardName)))

    const columns: ColumnsType<StandardDictionaryMapping> = [
        {
            title: '序号',
            key: 'index',
            width: 80,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: '标准名称',
            dataIndex: 'standardName',
            key: 'standardName',
            width: 150,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '标准数据集名称',
            dataIndex: 'standardDatasetName',
            key: 'standardDatasetName',
            width: 150,
        },
        {
            title: '标准数据集内容',
            dataIndex: 'standardDatasetContent',
            key: 'standardDatasetContent',
            width: 150,
        },
        {
            title: '原始表名称',
            dataIndex: 'originalTableName',
            key: 'originalTableName',
            width: 180,
        },
        {
            title: '原始数据字段',
            dataIndex: 'originalDataField',
            key: 'originalDataField',
            width: 150,
            render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
        },
        {
            title: '原始数据集',
            dataIndex: 'originalDataset',
            key: 'originalDataset',
            width: 150,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
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
            width: 180,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
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
                    <Popconfirm
                        title='确认删除'
                        description='确定要删除这条记录吗？'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button type='link' danger size='small' icon={<DeleteOutlined />}>
                            删除
                        </Button>
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
                <Typography.Title level={2} style={{ margin: 0 }}>
                    标准字典对照
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增对照
                    </Button>
                    <Button icon={<ImportOutlined />} onClick={handleImport}>
                        导入
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        刷新
                    </Button>
                </Space>
            </div>
            <Alert
                message='标准字典对照'
                description='管理标准数据集与原始数据之间的对照关系，用于数据标准化和映射。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space>
                        <Search
                            placeholder='搜索标准名称、数据集名称、原始表名等'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={filterData}
                        />
                        <Select
                            placeholder='选择标准名称'
                            style={{ width: 180 }}
                            value={standardNameFilter}
                            onChange={setStandardNameFilter}
                            allowClear
                        >
                            {standardNames.map(name => (
                                <Option key={name} value={name}>
                                    {name}
                                </Option>
                            ))}
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
                        <Button type='primary' icon={<SearchOutlined />} onClick={filterData}>
                            查询
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingRecord ? '编辑标准字典对照' : '新增标准字典对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
                destroyOnClose
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='standardName'
                        label='标准名称'
                        rules={[{ required: true, message: '请输入标准名称' }]}
                    >
                        <Input placeholder='请输入标准名称，如：患者基本信息' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetName'
                                label='标准数据集名称'
                                rules={[{ required: true, message: '请输入标准数据集名称' }]}
                            >
                                <Input placeholder='请输入标准数据集名称，如：性别' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetContent'
                                label='标准数据集内容'
                                rules={[{ required: true, message: '请输入标准数据集内容' }]}
                            >
                                <Input placeholder='请输入标准数据集内容，如：男' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='originalTableName'
                                label='原始表名称'
                                rules={[{ required: true, message: '请输入原始表名称' }]}
                            >
                                <Input placeholder='请输入原始表名称，如：门诊患者基本信息' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='originalDataField'
                                label='原始数据字段'
                                rules={[{ required: true, message: '请输入原始数据字段' }]}
                            >
                                <Input placeholder='请输入原始数据字段，如：sex' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='originalDataset'
                        label='原始数据集'
                        rules={[{ required: true, message: '请输入原始数据集' }]}
                    >
                        <Input placeholder='请输入原始数据集，如：M' />
                    </Form.Item>

                    <Form.Item
                        name='status'
                        label='状态'
                        valuePropName='checked'
                        initialValue={true}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情查看模态框 */}
            <Modal
                title='标准字典对照详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                {viewingRecord && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <div>
                                    <strong>标准名称：</strong>
                                    {viewingRecord.standardName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集名称：</strong>
                                    {viewingRecord.standardDatasetName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集内容：</strong>
                                    <Tag color='green'>{viewingRecord.standardDatasetContent}</Tag>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>原始表名称：</strong>
                                    {viewingRecord.originalTableName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>原始数据字段：</strong>
                                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.originalDataField}
                                    </code>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>原始数据集：</strong>
                                    <Tag color='blue'>{viewingRecord.originalDataset}</Tag>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>状态：</strong>
                                    <Tag color={viewingRecord.status === 'active' ? 'green' : 'red'}>
                                        {viewingRecord.status === 'active' ? '启用' : '禁用'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>创建人：</strong>
                                    {viewingRecord.creator}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>创建时间：</strong>
                                    {viewingRecord.createTime}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>更新时间：</strong>
                                    {viewingRecord.updateTime}
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

