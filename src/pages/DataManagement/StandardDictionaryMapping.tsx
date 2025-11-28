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

interface DictionaryMapping {
    id: string
    name: string
    sourceDictionary: string
    sourceDictionaryCode: string
    targetDictionary: string
    targetDictionaryCode: string
    mappingType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
    mappingRules: MappingRule[]
    status: 'active' | 'inactive'
    description: string
    createTime: string
    updateTime: string
    creator: string
}

interface MappingRule {
    id: string
    sourceCode: string
    sourceName: string
    targetCode: string
    targetName: string
    mappingType: 'exact' | 'fuzzy' | 'custom'
    priority: number
    status: 'active' | 'inactive'
}

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DictionaryMapping[]>([])
    const [filteredData, setFilteredData] = useState<DictionaryMapping[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DictionaryMapping | null>(null)
    const [viewingRecord, setViewingRecord] = useState<DictionaryMapping | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [mappingTypeFilter, setMappingTypeFilter] = useState<string>('')

    // 模拟数据
    const mockData: DictionaryMapping[] = [
        {
            id: '1',
            name: 'ICD-10 到 SNOMED CT 映射',
            sourceDictionary: 'ICD-10 国际疾病分类',
            sourceDictionaryCode: 'ICD10',
            targetDictionary: 'SNOMED CT',
            targetDictionaryCode: 'SNOMED',
            mappingType: 'one-to-many',
            mappingRules: [
                {
                    id: '1',
                    sourceCode: 'A00',
                    sourceName: '霍乱',
                    targetCode: '61486000',
                    targetName: 'Cholera',
                    mappingType: 'exact',
                    priority: 1,
                    status: 'active',
                },
                {
                    id: '2',
                    sourceCode: 'A01',
                    sourceName: '伤寒和副伤寒',
                    targetCode: '397430003',
                    targetName: 'Typhoid fever',
                    mappingType: 'exact',
                    priority: 1,
                    status: 'active',
                },
            ],
            status: 'active',
            description: 'ICD-10 疾病编码到 SNOMED CT 临床术语的映射关系',
            createTime: '2024-01-15 10:00:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '张三',
        },
        {
            id: '2',
            name: 'LOINC 到 本地检验代码映射',
            sourceDictionary: 'LOINC 检验项目代码',
            sourceDictionaryCode: 'LOINC',
            targetDictionary: '本地检验代码',
            targetDictionaryCode: 'LOCAL_LAB',
            mappingType: 'many-to-one',
            mappingRules: [
                {
                    id: '3',
                    sourceCode: '33914-3',
                    sourceName: 'Glucose [Mass/volume] in Blood',
                    targetCode: 'GLU',
                    targetName: '血糖',
                    mappingType: 'exact',
                    priority: 1,
                    status: 'active',
                },
                {
                    id: '4',
                    sourceCode: '2339-0',
                    sourceName: 'Glucose [Mass/volume] in Serum or Plasma',
                    targetCode: 'GLU',
                    targetName: '血糖',
                    mappingType: 'fuzzy',
                    priority: 2,
                    status: 'active',
                },
            ],
            status: 'active',
            description: 'LOINC 检验代码到本地检验代码的映射关系',
            createTime: '2024-01-16 09:00:00',
            updateTime: '2024-01-22 09:30:00',
            creator: '李四',
        },
        {
            id: '3',
            name: '药品字典到ATC分类映射',
            sourceDictionary: '国家药品字典',
            sourceDictionaryCode: 'NDC',
            targetDictionary: 'ATC 分类',
            targetDictionaryCode: 'ATC',
            mappingType: 'one-to-one',
            mappingRules: [
                {
                    id: '5',
                    sourceCode: 'A01AA01',
                    sourceName: '氟化钠',
                    targetCode: 'A01AA01',
                    targetName: 'Sodium fluoride',
                    mappingType: 'exact',
                    priority: 1,
                    status: 'active',
                },
            ],
            status: 'inactive',
            description: '国家药品字典到 ATC 分类的映射关系',
            createTime: '2024-01-17 11:00:00',
            updateTime: '2024-01-25 16:20:00',
            creator: '王五',
        },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        filterData()
    }, [searchText, statusFilter, mappingTypeFilter])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockData)
            setFilteredData(mockData)
        } catch {
            message.error('获取标准字典关系对照失败')
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let filtered = [...mockData]

        if (searchText) {
            filtered = filtered.filter(
                item =>
                    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.sourceDictionary.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.targetDictionary.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (mappingTypeFilter) {
            filtered = filtered.filter(item => item.mappingType === mappingTypeFilter)
        }

        setFilteredData(filtered)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
            mappingType: 'one-to-one',
        })
        setModalVisible(true)
    }

    const handleEdit = (record: DictionaryMapping) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active',
        })
        setModalVisible(true)
    }

    const handleDelete = (record: DictionaryMapping) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标准字典关系对照"${record.name}"吗？`,
            onOk: () => {
                message.success('删除成功')
                fetchData()
            },
        })
    }

    const handleView = (record: DictionaryMapping) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
                updateTime: new Date().toLocaleString('zh-CN'),
            }

            if (editingRecord) {
                message.success('修改成功')
            } else {
                message.success('新增成功')
            }

            setModalVisible(false)
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

    const columns: ColumnsType<DictionaryMapping> = [
        {
            title: '映射名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '源字典',
            key: 'sourceDictionary',
            width: 180,
            render: (_, record) => (
                <div>
                    <div>{record.sourceDictionary}</div>
                    <Tag color='blue'>{record.sourceDictionaryCode}</Tag>
                </div>
            ),
        },
        {
            title: '目标字典',
            key: 'targetDictionary',
            width: 180,
            render: (_, record) => (
                <div>
                    <div>{record.targetDictionary}</div>
                    <Tag color='green'>{record.targetDictionaryCode}</Tag>
                </div>
            ),
        },
        {
            title: '映射类型',
            dataIndex: 'mappingType',
            key: 'mappingType',
            width: 120,
            render: (type: string) => {
                const typeMap: Record<string, { text: string; color: string }> = {
                    'one-to-one': { text: '一对一', color: 'blue' },
                    'one-to-many': { text: '一对多', color: 'orange' },
                    'many-to-one': { text: '多对一', color: 'purple' },
                    'many-to-many': { text: '多对多', color: 'red' },
                }
                const config = typeMap[type] || { text: type, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
            },
        },
        {
            title: '映射规则数',
            key: 'mappingRules',
            width: 120,
            render: (_, record) => <span>{record.mappingRules.length} 条</span>,
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
                        description={`确定要删除"${record.name}"吗？`}
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
                    标准字典关系对照
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增映射关系
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
                message='标准字典关系对照'
                description='管理不同标准字典之间的映射关系，支持一对一、一对多、多对一、多对多等多种映射类型。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space>
                        <Search
                            placeholder='搜索映射名称、源字典、目标字典或描述'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={filterData}
                        />
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
                        <Select
                            placeholder='选择映射类型'
                            style={{ width: 150 }}
                            value={mappingTypeFilter}
                            onChange={setMappingTypeFilter}
                            allowClear
                        >
                            <Option value='one-to-one'>一对一</Option>
                            <Option value='one-to-many'>一对多</Option>
                            <Option value='many-to-one'>多对一</Option>
                            <Option value='many-to-many'>多对多</Option>
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
                title={editingRecord ? '编辑标准字典关系对照' : '新增标准字典关系对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
                destroyOnClose
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='映射名称'
                        rules={[{ required: true, message: '请输入映射名称' }]}
                    >
                        <Input placeholder='请输入映射名称' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='sourceDictionary'
                                label='源字典名称'
                                rules={[{ required: true, message: '请输入源字典名称' }]}
                            >
                                <Input placeholder='请输入源字典名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='sourceDictionaryCode'
                                label='源字典编码'
                                rules={[{ required: true, message: '请输入源字典编码' }]}
                            >
                                <Input placeholder='请输入源字典编码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='targetDictionary'
                                label='目标字典名称'
                                rules={[{ required: true, message: '请输入目标字典名称' }]}
                            >
                                <Input placeholder='请输入目标字典名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='targetDictionaryCode'
                                label='目标字典编码'
                                rules={[{ required: true, message: '请输入目标字典编码' }]}
                            >
                                <Input placeholder='请输入目标字典编码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='mappingType'
                        label='映射类型'
                        rules={[{ required: true, message: '请选择映射类型' }]}
                    >
                        <Select placeholder='请选择映射类型'>
                            <Option value='one-to-one'>一对一</Option>
                            <Option value='one-to-many'>一对多</Option>
                            <Option value='many-to-one'>多对一</Option>
                            <Option value='many-to-many'>多对多</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入描述' />
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
                title='标准字典关系对照详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={900}
            >
                {viewingRecord && (
                    <div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <div>
                                    <strong>映射名称：</strong>
                                    {viewingRecord.name}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>映射类型：</strong>
                                    <Tag
                                        color={
                                            viewingRecord.mappingType === 'one-to-one'
                                                ? 'blue'
                                                : viewingRecord.mappingType === 'one-to-many'
                                                  ? 'orange'
                                                  : viewingRecord.mappingType === 'many-to-one'
                                                    ? 'purple'
                                                    : 'red'
                                        }
                                    >
                                        {viewingRecord.mappingType === 'one-to-one'
                                            ? '一对一'
                                            : viewingRecord.mappingType === 'one-to-many'
                                              ? '一对多'
                                              : viewingRecord.mappingType === 'many-to-one'
                                                ? '多对一'
                                                : '多对多'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>源字典：</strong>
                                    {viewingRecord.sourceDictionary} (
                                    <Tag color='blue'>{viewingRecord.sourceDictionaryCode}</Tag>)
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>目标字典：</strong>
                                    {viewingRecord.targetDictionary} (
                                    <Tag color='green'>{viewingRecord.targetDictionaryCode}</Tag>)
                                </div>
                            </Col>
                            <Col span={24}>
                                <div>
                                    <strong>描述：</strong>
                                    {viewingRecord.description}
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

                        <div style={{ marginTop: 24 }}>
                            <Typography.Title level={5}>映射规则列表</Typography.Title>
                            <Table
                                size='small'
                                dataSource={viewingRecord.mappingRules}
                                columns={[
                                    {
                                        title: '源编码',
                                        dataIndex: 'sourceCode',
                                        key: 'sourceCode',
                                    },
                                    {
                                        title: '源名称',
                                        dataIndex: 'sourceName',
                                        key: 'sourceName',
                                    },
                                    {
                                        title: '目标编码',
                                        dataIndex: 'targetCode',
                                        key: 'targetCode',
                                    },
                                    {
                                        title: '目标名称',
                                        dataIndex: 'targetName',
                                        key: 'targetName',
                                    },
                                    {
                                        title: '映射方式',
                                        dataIndex: 'mappingType',
                                        key: 'mappingType',
                                        render: (type: string) => {
                                            const typeMap: Record<string, string> = {
                                                exact: '精确匹配',
                                                fuzzy: '模糊匹配',
                                                custom: '自定义',
                                            }
                                            return typeMap[type] || type
                                        },
                                    },
                                    {
                                        title: '优先级',
                                        dataIndex: 'priority',
                                        key: 'priority',
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
                                ]}
                                pagination={false}
                                rowKey='id'
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

