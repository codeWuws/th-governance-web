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
    Progress,
    Alert,
    Descriptions,
    Row,
    Col,
    Switch,
} from 'antd'
import {
    PlayCircleOutlined,
    SettingOutlined,
    EyeOutlined,
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import moment from 'moment'

const { Search } = Input
const { Option } = Select

interface DiscoveryRule {
    id: string
    name: string
    description: string
    ruleType: 'pattern' | 'similarity' | 'semantic' | 'statistical'
    sourceDatabases: string[]
    targetDatabases: string[]
    confidenceThreshold: number
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    lastRunTime?: string
    discoveryCount: number
}

interface DiscoveryResult {
    id: string
    ruleId: string
    ruleName: string
    sourceTable: string
    sourceColumn: string
    targetTable: string
    targetColumn: string
    relationshipType: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many'
    confidence: number
    discoveryMethod: string
    createTime: string
    status: 'pending' | 'approved' | 'rejected'
}

const AutoDiscoveryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [rules, setRules] = useState<DiscoveryRule[]>([])
    const [results, setResults] = useState<DiscoveryResult[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRule, setEditingRule] = useState<DiscoveryRule | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [ruleTypeFilter, setRuleTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [activeTab, setActiveTab] = useState<'rules' | 'results'>('rules')
    const [discoveryRunning, setDiscoveryRunning] = useState(false)
    const [discoveryProgress, setDiscoveryProgress] = useState(0)

    // 模拟数据
    const mockRules: DiscoveryRule[] = [
        {
            id: '1',
            name: '患者ID关联发现',
            description: '自动发现患者ID在不同表中的关联关系',
            ruleType: 'pattern',
            sourceDatabases: ['patient_db', 'clinical_db'],
            targetDatabases: ['lab_db', 'pharmacy_db'],
            confidenceThreshold: 0.85,
            status: 'active',
            createTime: '2024-01-15 10:30:00',
            updateTime: '2024-02-01 14:20:00',
            creator: '张三',
            lastRunTime: '2024-02-01 14:20:00',
            discoveryCount: 156,
        },
        {
            id: '2',
            name: '诊断编码相似性发现',
            description: '基于编码相似性发现诊断表间的关联',
            ruleType: 'similarity',
            sourceDatabases: ['diagnosis_db'],
            targetDatabases: ['icd_db', 'standard_db'],
            confidenceThreshold: 0.75,
            status: 'active',
            createTime: '2024-01-20 09:15:00',
            updateTime: '2024-01-25 16:45:00',
            creator: '李四',
            lastRunTime: '2024-01-25 16:45:00',
            discoveryCount: 89,
        },
        {
            id: '3',
            name: '语义关联发现',
            description: '基于语义分析发现字段间的关联关系',
            ruleType: 'semantic',
            sourceDatabases: ['clinical_db', 'emr_db'],
            targetDatabases: ['standard_db', 'terminology_db'],
            confidenceThreshold: 0.8,
            status: 'inactive',
            createTime: '2024-02-01 11:00:00',
            updateTime: '2024-02-01 11:00:00',
            creator: '王五',
            discoveryCount: 0,
        },
    ]

    const mockResults: DiscoveryResult[] = [
        {
            id: '1',
            ruleId: '1',
            ruleName: '患者ID关联发现',
            sourceTable: 'patient_basic',
            sourceColumn: 'patient_id',
            targetTable: 'lab_results',
            targetColumn: 'patient_id',
            relationshipType: 'one_to_many',
            confidence: 0.95,
            discoveryMethod: '模式匹配',
            createTime: '2024-02-01 14:20:00',
            status: 'approved',
        },
        {
            id: '2',
            ruleId: '1',
            ruleName: '患者ID关联发现',
            sourceTable: 'patient_basic',
            sourceColumn: 'patient_id',
            targetTable: 'prescription',
            targetColumn: 'patient_id',
            relationshipType: 'one_to_many',
            confidence: 0.92,
            discoveryMethod: '模式匹配',
            createTime: '2024-02-01 14:20:00',
            status: 'approved',
        },
        {
            id: '3',
            ruleId: '2',
            ruleName: '诊断编码相似性发现',
            sourceTable: 'diagnosis_record',
            sourceColumn: 'diagnosis_code',
            targetTable: 'icd10_standard',
            targetColumn: 'icd_code',
            relationshipType: 'many_to_one',
            confidence: 0.78,
            discoveryMethod: '相似性分析',
            createTime: '2024-01-25 16:45:00',
            status: 'pending',
        },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLoading(true)
        setTimeout(() => {
            setRules(mockRules)
            setResults(mockResults)
            setLoading(false)
        }, 500)
    }

    const handleSearch = () => {
        if (activeTab === 'rules') {
            let filteredRules = mockRules

            if (searchText) {
                filteredRules = filteredRules.filter(
                    rule =>
                        rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        rule.description.toLowerCase().includes(searchText.toLowerCase())
                )
            }

            if (ruleTypeFilter) {
                filteredRules = filteredRules.filter(rule => rule.ruleType === ruleTypeFilter)
            }

            if (statusFilter) {
                filteredRules = filteredRules.filter(rule => rule.status === statusFilter)
            }

            setRules(filteredRules)
        } else {
            let filteredResults = mockResults

            if (searchText) {
                filteredResults = filteredResults.filter(
                    result =>
                        result.sourceTable.toLowerCase().includes(searchText.toLowerCase()) ||
                        result.targetTable.toLowerCase().includes(searchText.toLowerCase()) ||
                        result.ruleName.toLowerCase().includes(searchText.toLowerCase())
                )
            }

            setResults(filteredResults)
        }
    }

    const handleAddRule = () => {
        setEditingRule(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEditRule = (rule: DiscoveryRule) => {
        setEditingRule(rule)
        form.setFieldsValue({
            ...rule,
            sourceDatabases: rule.sourceDatabases.join(', '),
            targetDatabases: rule.targetDatabases.join(', '),
        })
        setModalVisible(true)
    }

    const handleRunDiscovery = (rule: DiscoveryRule) => {
        Modal.confirm({
            title: '确认执行发现',
            content: `确定要执行规则"${rule.name}"的自动发现吗？`,
            onOk: () => {
                setDiscoveryRunning(true)
                setDiscoveryProgress(0)

                // 模拟进度
                const interval = setInterval(() => {
                    setDiscoveryProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(interval)
                            setDiscoveryRunning(false)
                            message.success(
                                `自动发现完成，发现 ${Math.floor(Math.random() * 50) + 10} 个新的关联关系`
                            )
                            loadData()
                            return 100
                        }
                        return prev + 10
                    })
                }, 300)
            },
        })
    }

    const handleApproveResult = (result: DiscoveryResult) => {
        message.success('关联关系已批准')
        loadData()
    }

    const handleRejectResult = (result: DiscoveryResult) => {
        message.success('关联关系已拒绝')
        loadData()
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData = {
                ...values,
                sourceDatabases: values.sourceDatabases.split(',').map((db: string) => db.trim()),
                targetDatabases: values.targetDatabases.split(',').map((db: string) => db.trim()),
                updateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            }

            if (editingRule) {
                message.success('规则修改成功')
            } else {
                message.success('规则新增成功')
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

    const ruleColumns: ColumnsType<DiscoveryRule> = [
        {
            title: '规则名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '规则类型',
            dataIndex: 'ruleType',
            key: 'ruleType',
            render: (type: string) => {
                const typeMap = {
                    pattern: '模式匹配',
                    similarity: '相似性分析',
                    semantic: '语义分析',
                    statistical: '统计分析',
                }
                return <Tag color='blue'>{typeMap[type as keyof typeof typeMap]}</Tag>
            },
        },
        {
            title: '置信度阈值',
            dataIndex: 'confidenceThreshold',
            key: 'confidenceThreshold',
            render: (threshold: number) => <span>{(threshold * 100).toFixed(0)}%</span>,
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
            title: '发现数量',
            dataIndex: 'discoveryCount',
            key: 'discoveryCount',
            render: (count: number) => (
                <span style={{ color: count > 0 ? 'green' : 'gray' }}>{count}</span>
            ),
        },
        {
            title: '最后执行时间',
            dataIndex: 'lastRunTime',
            key: 'lastRunTime',
            render: (time: string) => time || '未执行',
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
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleRunDiscovery(record)}
                        disabled={record.status !== 'active'}
                    >
                        执行
                    </Button>
                    <Button
                        type='link'
                        size='small'
                        icon={<SettingOutlined />}
                        onClick={() => handleEditRule(record)}
                    >
                        配置
                    </Button>
                </Space>
            ),
        },
    ]

    const resultColumns: ColumnsType<DiscoveryResult> = [
        {
            title: '规则名称',
            dataIndex: 'ruleName',
            key: 'ruleName',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '源表',
            dataIndex: 'sourceTable',
            key: 'sourceTable',
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '源字段',
            dataIndex: 'sourceColumn',
            key: 'sourceColumn',
        },
        {
            title: '目标表',
            dataIndex: 'targetTable',
            key: 'targetTable',
            render: (text: string) => <Tag color='green'>{text}</Tag>,
        },
        {
            title: '目标字段',
            dataIndex: 'targetColumn',
            key: 'targetColumn',
        },
        {
            title: '关系类型',
            dataIndex: 'relationshipType',
            key: 'relationshipType',
            render: (type: string) => {
                const typeMap = {
                    one_to_one: '一对一',
                    one_to_many: '一对多',
                    many_to_one: '多对一',
                    many_to_many: '多对多',
                }
                return <Tag>{typeMap[type as keyof typeof typeMap]}</Tag>
            },
        },
        {
            title: '置信度',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (confidence: number) => (
                <span
                    style={{
                        color: confidence > 0.8 ? 'green' : confidence > 0.6 ? 'orange' : 'red',
                    }}
                >
                    {(confidence * 100).toFixed(1)}%
                </span>
            ),
        },
        {
            title: '发现方法',
            dataIndex: 'discoveryMethod',
            key: 'discoveryMethod',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const statusMap = {
                    pending: { color: 'orange', text: '待审核' },
                    approved: { color: 'green', text: '已批准' },
                    rejected: { color: 'red', text: '已拒绝' },
                }
                const statusInfo = statusMap[status as keyof typeof statusMap]
                return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            },
        },
        {
            title: '发现时间',
            dataIndex: 'createTime',
            key: 'createTime',
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size='small'>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type='link'
                                size='small'
                                onClick={() => handleApproveResult(record)}
                            >
                                批准
                            </Button>
                            <Button
                                type='link'
                                danger
                                size='small'
                                onClick={() => handleRejectResult(record)}
                            >
                                拒绝
                            </Button>
                        </>
                    )}
                    <Button type='link' size='small' icon={<EyeOutlined />}>
                        详情
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                {discoveryRunning && (
                    <Alert
                        message='自动发现进行中'
                        description={`发现进度: ${discoveryProgress}%`}
                        type='info'
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {discoveryRunning && (
                    <Progress
                        percent={discoveryProgress}
                        status='active'
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ marginBottom: 16 }}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleAddRule}>
                            新增发现规则
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={loadData}>
                            刷新
                        </Button>
                    </Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder='搜索规则名称、表名或字段名'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                        />
                        {activeTab === 'rules' && (
                            <>
                                <Select
                                    placeholder='选择规则类型'
                                    style={{ width: 150 }}
                                    value={ruleTypeFilter}
                                    onChange={setRuleTypeFilter}
                                    allowClear
                                >
                                    <Option value='pattern'>模式匹配</Option>
                                    <Option value='similarity'>相似性分析</Option>
                                    <Option value='semantic'>语义分析</Option>
                                    <Option value='statistical'>统计分析</Option>
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
                            </>
                        )}
                        <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                            查询
                        </Button>
                    </Space>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Button.Group>
                        <Button
                            type={activeTab === 'rules' ? 'primary' : 'default'}
                            onClick={() => setActiveTab('rules')}
                        >
                            发现规则 ({rules.length})
                        </Button>
                        <Button
                            type={activeTab === 'results' ? 'primary' : 'default'}
                            onClick={() => setActiveTab('results')}
                        >
                            发现结果 ({results.length})
                        </Button>
                    </Button.Group>
                </div>

                {activeTab === 'rules' ? (
                    <Table
                        columns={ruleColumns}
                        dataSource={rules}
                        rowKey='id'
                        loading={loading}
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: total => `共 ${total} 条规则`,
                        }}
                    />
                ) : (
                    <Table
                        columns={resultColumns}
                        dataSource={results}
                        rowKey='id'
                        loading={loading}
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: total => `共 ${total} 个发现结果`,
                        }}
                    />
                )}
            </Card>

            <Modal
                title={editingRule ? '编辑发现规则' : '新增发现规则'}
                visible={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
            >
                <Form form={form} layout='vertical'>
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
                                name='ruleType'
                                label='规则类型'
                                rules={[{ required: true, message: '请选择规则类型' }]}
                            >
                                <Select placeholder='请选择规则类型'>
                                    <Option value='pattern'>模式匹配</Option>
                                    <Option value='similarity'>相似性分析</Option>
                                    <Option value='semantic'>语义分析</Option>
                                    <Option value='statistical'>统计分析</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='description'
                        label='规则描述'
                        rules={[{ required: true, message: '请输入规则描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入规则描述' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='sourceDatabases'
                                label='源数据库'
                                rules={[{ required: true, message: '请输入源数据库' }]}
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder='请输入源数据库，多个用逗号分隔'
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='targetDatabases'
                                label='目标数据库'
                                rules={[{ required: true, message: '请输入目标数据库' }]}
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder='请输入目标数据库，多个用逗号分隔'
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='confidenceThreshold'
                                label='置信度阈值'
                                rules={[{ required: true, message: '请输入置信度阈值' }]}
                                initialValue={0.8}
                            >
                                <Input
                                    type='number'
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    placeholder='请输入置信度阈值 (0-1)'
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='status'
                                label='状态'
                                valuePropName='checked'
                                initialValue={true}
                            >
                                <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}

export default AutoDiscoveryManagement
