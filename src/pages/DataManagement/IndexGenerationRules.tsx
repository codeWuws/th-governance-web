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
    Switch,
    InputNumber,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    CopyOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface IndexGenerationRule {
    id: string
    name: string
    code: string
    description: string
    ruleType: 'hash' | 'sequence' | 'uuid' | 'composite' | 'custom'
    algorithm: string
    parameters: Record<string, unknown>
    scope: 'patient' | 'visit' | 'order' | 'document' | 'universal'
    uniquenessLevel: 'global' | 'system' | 'organization' | 'department'
    length: number
    prefix: string
    suffix: string
    checksum: boolean
    caseSensitive: boolean
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    lastExecutor: string
    successRate: number
    totalGenerated: number
}

const mockRules: IndexGenerationRule[] = [
    {
        id: '1',
        name: '患者主索引生成规则',
        code: 'PATIENT_MPI',
        description: '基于患者身份证号、姓名、出生日期生成唯一主索引',
        ruleType: 'composite',
        algorithm: 'SHA256_HASH',
        parameters: {
            fields: ['id_card', 'name', 'birth_date'],
            salt: 'patient_salt_2024',
            iterations: 1000,
        },
        scope: 'patient',
        uniquenessLevel: 'global',
        length: 32,
        prefix: 'P',
        suffix: '',
        checksum: true,
        caseSensitive: false,
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '张三',
        lastExecutor: '李四',
        successRate: 99.8,
        totalGenerated: 15420,
    },
    {
        id: '2',
        name: '就诊流水号生成规则',
        code: 'VISIT_SERIAL',
        description: '基于时间戳和序列号生成就诊流水号',
        ruleType: 'sequence',
        algorithm: 'TIMESTAMP_SEQUENCE',
        parameters: {
            dateFormat: 'yyyyMMdd',
            sequenceLength: 6,
            resetDaily: true,
        },
        scope: 'visit',
        uniquenessLevel: 'system',
        length: 14,
        prefix: 'V',
        suffix: '',
        checksum: false,
        caseSensitive: false,
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '李四',
        lastExecutor: '王五',
        successRate: 100,
        totalGenerated: 89650,
    },
    {
        id: '3',
        name: '文档UUID生成规则',
        code: 'DOC_UUID',
        description: '生成符合UUID v4标准的文档唯一标识',
        ruleType: 'uuid',
        algorithm: 'UUID_V4',
        parameters: {
            format: 'standard',
            uppercase: false,
        },
        scope: 'document',
        uniquenessLevel: 'global',
        length: 36,
        prefix: '',
        suffix: '',
        checksum: false,
        caseSensitive: false,
        status: 'inactive',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-22 09:30:00',
        creator: '王五',
        lastExecutor: '',
        successRate: 0,
        totalGenerated: 0,
    },
]

const IndexGenerationRules: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexGenerationRule[]>([])
    const [filteredData, setFilteredData] = useState<IndexGenerationRule[]>([])
    const [searchText, setSearchText] = useState('')
    const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('')
    const [scopeFilter, setScopeFilter] = useState<string>('')
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
                    item.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
            )
        }

        if (ruleTypeFilter) {
            filtered = filtered.filter(item => item.ruleType === ruleTypeFilter)
        }

        if (scopeFilter) {
            filtered = filtered.filter(item => item.scope === scopeFilter)
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, ruleTypeFilter, scopeFilter, statusFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: IndexGenerationRule) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    const handleView = (record: IndexGenerationRule) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleCopy = (_record: IndexGenerationRule) => {
        const newRecord = {
            ..._record,
            id: Date.now().toString(),
            name: `${_record.name}_副本`,
            code: `${_record.code}_COPY`,
            status: 'inactive' as const,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString(),
            successRate: 0,
            totalGenerated: 0,
        }
        setData([...data, newRecord])
        message.success('复制成功')
    }

    const handleExecute = async (_record: IndexGenerationRule) => {
        try {
            // 模拟执行操作
            message.loading('正在执行规则...', 2)
            await new Promise(resolve => setTimeout(resolve, 2000))
            message.success('规则执行成功')
        } catch {
            message.error('规则执行失败')
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
                const newRecord: IndexGenerationRule = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                    lastExecutor: '',
                    successRate: 0,
                    totalGenerated: 0,
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
            case 'hash':
                return 'blue'
            case 'sequence':
                return 'green'
            case 'uuid':
                return 'purple'
            case 'composite':
                return 'orange'
            case 'custom':
                return 'red'
            default:
                return 'default'
        }
    }

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'patient':
                return 'blue'
            case 'visit':
                return 'green'
            case 'order':
                return 'orange'
            case 'document':
                return 'purple'
            case 'universal':
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
            width: 180,
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
            title: '规则类型',
            dataIndex: 'ruleType',
            key: 'ruleType',
            width: 80,
            render: (text: string) => (
                <Tag color={getRuleTypeColor(text)} style={{ textTransform: 'capitalize' }}>
                    {text === 'hash'
                        ? '哈希'
                        : text === 'sequence'
                          ? '序列'
                          : text === 'uuid'
                            ? 'UUID'
                            : text === 'composite'
                              ? '复合'
                              : '自定义'}
                </Tag>
            ),
        },
        {
            title: '适用范围',
            dataIndex: 'scope',
            key: 'scope',
            width: 80,
            render: (text: string) => (
                <Tag color={getScopeColor(text)}>
                    {text === 'patient'
                        ? '患者'
                        : text === 'visit'
                          ? '就诊'
                          : text === 'order'
                            ? '医嘱'
                            : text === 'document'
                              ? '文档'
                              : '通用'}
                </Tag>
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
            title: '成功率',
            dataIndex: 'successRate',
            key: 'successRate',
            width: 80,
            render: (text: number) => (
                <Tag color={text >= 95 ? 'success' : text >= 80 ? 'warning' : 'error'}>
                    {text.toFixed(1)}%
                </Tag>
            ),
        },
        {
            title: '生成数量',
            dataIndex: 'totalGenerated',
            key: 'totalGenerated',
            width: 100,
            render: (text: number) => (
                <span style={{ fontWeight: 'bold' }}>{text.toLocaleString()}</span>
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
                    <Tooltip title='执行规则'>
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
                        <Option value='hash'>哈希</Option>
                        <Option value='sequence'>序列</Option>
                        <Option value='uuid'>UUID</Option>
                        <Option value='composite'>复合</Option>
                        <Option value='custom'>自定义</Option>
                    </Select>
                    <Select
                        placeholder='适用范围'
                        style={{ width: 120 }}
                        allowClear
                        onChange={setScopeFilter}
                    >
                        <Option value='patient'>患者</Option>
                        <Option value='visit'>就诊</Option>
                        <Option value='order'>医嘱</Option>
                        <Option value='document'>文档</Option>
                        <Option value='universal'>通用</Option>
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
                </Space>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1600 }}
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
                width={800}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'inactive',
                        checksum: false,
                        caseSensitive: false,
                        length: 32,
                        successRate: 0,
                        totalGenerated: 0,
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
                                    <Option value='hash'>哈希</Option>
                                    <Option value='sequence'>序列</Option>
                                    <Option value='uuid'>UUID</Option>
                                    <Option value='composite'>复合</Option>
                                    <Option value='custom'>自定义</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='scope'
                                label='适用范围'
                                rules={[{ required: true, message: '请选择适用范围' }]}
                            >
                                <Select placeholder='请选择适用范围'>
                                    <Option value='patient'>患者</Option>
                                    <Option value='visit'>就诊</Option>
                                    <Option value='order'>医嘱</Option>
                                    <Option value='document'>文档</Option>
                                    <Option value='universal'>通用</Option>
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
                                </Select>
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

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='algorithm'
                                label='算法'
                                rules={[{ required: true, message: '请输入算法' }]}
                            >
                                <Input placeholder='如: SHA256_HASH' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='length'
                                label='长度'
                                rules={[{ required: true, message: '请输入长度' }]}
                            >
                                <InputNumber
                                    min={1}
                                    max={128}
                                    placeholder='长度'
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='uniquenessLevel'
                                label='唯一性级别'
                                rules={[{ required: true, message: '请选择唯一性级别' }]}
                            >
                                <Select placeholder='请选择唯一性级别'>
                                    <Option value='global'>全局</Option>
                                    <Option value='system'>系统</Option>
                                    <Option value='organization'>机构</Option>
                                    <Option value='department'>科室</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name='prefix' label='前缀'>
                                <Input placeholder='前缀' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='suffix' label='后缀'>
                                <Input placeholder='后缀' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='checksum' label='校验和' valuePropName='checked'>
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title='主索引生成规则详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
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
                                    {viewingRecord.ruleType === 'hash'
                                        ? '哈希'
                                        : viewingRecord.ruleType === 'sequence'
                                          ? '序列'
                                          : viewingRecord.ruleType === 'uuid'
                                            ? 'UUID'
                                            : viewingRecord.ruleType === 'composite'
                                              ? '复合'
                                              : '自定义'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='适用范围'>
                                <Tag color={getScopeColor(viewingRecord.scope)}>
                                    {viewingRecord.scope === 'patient'
                                        ? '患者'
                                        : viewingRecord.scope === 'visit'
                                          ? '就诊'
                                          : viewingRecord.scope === 'order'
                                            ? '医嘱'
                                            : viewingRecord.scope === 'document'
                                              ? '文档'
                                              : '通用'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='唯一性级别'>
                                <Tag color='blue'>{viewingRecord.uniquenessLevel}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='算法'>
                                <Tag color='orange'>{viewingRecord.algorithm}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Tag color={getStatusColor(viewingRecord.status)}>
                                    {getStatusText(viewingRecord.status)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='长度'>
                                {viewingRecord.length}
                            </Descriptions.Item>
                            <Descriptions.Item label='前缀'>
                                {viewingRecord.prefix || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='后缀'>
                                {viewingRecord.suffix || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='校验和'>
                                <Tag color={viewingRecord.checksum ? 'green' : 'red'}>
                                    {viewingRecord.checksum ? '启用' : '禁用'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='大小写敏感'>
                                <Tag color={viewingRecord.caseSensitive ? 'green' : 'red'}>
                                    {viewingRecord.caseSensitive ? '是' : '否'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='描述' span={2}>
                                {viewingRecord.description}
                            </Descriptions.Item>
                            <Descriptions.Item label='成功率'>
                                <Tag
                                    color={
                                        viewingRecord.successRate >= 95
                                            ? 'success'
                                            : viewingRecord.successRate >= 80
                                              ? 'warning'
                                              : 'error'
                                    }
                                >
                                    {viewingRecord.successRate.toFixed(1)}%
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='生成数量'>
                                <span style={{ fontWeight: 'bold' }}>
                                    {viewingRecord.totalGenerated.toLocaleString()}
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
                            <Descriptions.Item label='更新时间'>
                                {viewingRecord.updateTime}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation='left'>参数配置</Divider>
                        <pre
                            style={{
                                background: '#f5f5f5',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                maxHeight: '200px',
                                overflow: 'auto',
                            }}
                        >
                            {JSON.stringify(viewingRecord.parameters, null, 2)}
                        </pre>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default IndexGenerationRules
