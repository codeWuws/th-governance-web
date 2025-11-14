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
    Alert,
    Descriptions,
    Row,
    Col,
    Timeline,
    Progress,
} from 'antd'
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import moment from 'moment'

const { Search } = Input
const { Option } = Select

interface ImpactAnalysis {
    id: string
    tableName: string
    fieldName: string
    changeType: 'add' | 'modify' | 'delete'
    impactLevel: 'high' | 'medium' | 'low'
    description: string
    affectedTables: string[]
    affectedFields: number
    affectedProcesses: number
    affectedReports: number
    analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed'
    createTime: string
    completeTime?: string
    analyst: string
    confidence: number
    recommendations: string[]
}

interface AffectedObject {
    type: 'table' | 'field' | 'process' | 'report'
    name: string
    impact: 'direct' | 'indirect'
    severity: 'high' | 'medium' | 'low'
    description: string
}

const ImpactAnalysisManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<ImpactAnalysis[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedAnalysis, setSelectedAnalysis] = useState<ImpactAnalysis | null>(null)
    const [searchText, setSearchText] = useState('')
    const [impactLevelFilter, setImpactLevelFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [changeTypeFilter, setChangeTypeFilter] = useState('')

    // 模拟数据
    const mockData: ImpactAnalysis[] = [
        {
            id: '1',
            tableName: 'patient_basic',
            fieldName: 'patient_id',
            changeType: 'modify',
            impactLevel: 'high',
            description: '患者ID字段长度从20位扩展到30位',
            affectedTables: ['patient_visit', 'diagnosis_record', 'lab_results', 'prescription'],
            affectedFields: 8,
            affectedProcesses: 5,
            affectedReports: 3,
            analysisStatus: 'completed',
            createTime: '2024-02-01 10:30:00',
            completeTime: '2024-02-01 10:35:00',
            analyst: '张三',
            confidence: 0.95,
            recommendations: [
                '建议同步更新相关表的患者ID字段长度',
                '需要更新ETL流程中的字段映射',
                '需要重新生成受影响的报表',
                '建议进行数据质量检查',
            ],
        },
        {
            id: '2',
            tableName: 'diagnosis_record',
            fieldName: 'diagnosis_code',
            changeType: 'add',
            impactLevel: 'medium',
            description: '新增诊断编码字段，支持ICD-11标准',
            affectedTables: ['standard_diagnosis', 'report_diagnosis_summary'],
            affectedFields: 3,
            affectedProcesses: 2,
            affectedReports: 1,
            analysisStatus: 'analyzing',
            createTime: '2024-02-01 14:20:00',
            analyst: '李四',
            confidence: 0.78,
            recommendations: ['需要建立新的诊断编码映射关系', '建议更新诊断标准化流程'],
        },
        {
            id: '3',
            tableName: 'lab_results',
            fieldName: 'test_unit',
            changeType: 'delete',
            impactLevel: 'low',
            description: '删除测试单位字段，合并到参考范围字段',
            affectedTables: ['lab_reference_range'],
            affectedFields: 1,
            affectedProcesses: 1,
            affectedReports: 0,
            analysisStatus: 'pending',
            createTime: '2024-02-01 16:45:00',
            analyst: '王五',
            confidence: 0.65,
            recommendations: ['需要更新参考范围字段的格式', '建议清理历史数据中的单位信息'],
        },
        {
            id: '4',
            tableName: 'prescription',
            fieldName: 'medication_name',
            changeType: 'modify',
            impactLevel: 'high',
            description: '药品名称字段标准化，使用标准药品字典',
            affectedTables: ['medication_dict', 'pharmacy_inventory', 'drug_interaction'],
            affectedFields: 12,
            affectedProcesses: 8,
            affectedReports: 5,
            analysisStatus: 'failed',
            createTime: '2024-02-02 09:15:00',
            analyst: '赵六',
            confidence: 0.0,
            recommendations: ['需要重新评估标准化方案', '建议分批进行字段更新'],
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
                    item.tableName.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.fieldName.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (impactLevelFilter) {
            filteredData = filteredData.filter(item => item.impactLevel === impactLevelFilter)
        }

        if (statusFilter) {
            filteredData = filteredData.filter(item => item.analysisStatus === statusFilter)
        }

        if (changeTypeFilter) {
            filteredData = filteredData.filter(item => item.changeType === changeTypeFilter)
        }

        setData(filteredData)
    }

    const handleViewDetails = (record: ImpactAnalysis) => {
        setSelectedAnalysis(record)
        setModalVisible(true)
    }

    const handleReanalyze = (record: ImpactAnalysis) => {
        Modal.confirm({
            title: '确认重新分析',
            content: `确定要重新分析"${record.tableName}.${record.fieldName}"的影响吗？`,
            onOk: () => {
                message.success('重新分析任务已提交')
                // 模拟重新分析
                setTimeout(() => {
                    loadData()
                }, 3000)
            },
        })
    }

    const handleApprove = (record: ImpactAnalysis) => {
        Modal.confirm({
            title: '确认批准',
            content: `确定要批准对"${record.tableName}.${record.fieldName}"的变更吗？`,
            onOk: () => {
                message.success('变更已批准')
                loadData()
            },
        })
    }

    const handleReject = (record: ImpactAnalysis) => {
        Modal.confirm({
            title: '确认拒绝',
            content: `确定要拒绝对"${record.tableName}.${record.fieldName}"的变更吗？`,
            onOk: () => {
                message.success('变更已拒绝')
                loadData()
            },
        })
    }

    const getStatusColor = (status: string) => {
        const colorMap = {
            pending: 'orange',
            analyzing: 'processing',
            completed: 'green',
            failed: 'red',
        }
        return colorMap[status as keyof typeof colorMap] || 'default'
    }

    const getStatusText = (status: string) => {
        const textMap = {
            pending: '待分析',
            analyzing: '分析中',
            completed: '已完成',
            failed: '失败',
        }
        return textMap[status as keyof typeof textMap] || status
    }

    const getImpactColor = (level: string) => {
        const colorMap = {
            high: 'red',
            medium: 'orange',
            low: 'green',
        }
        return colorMap[level as keyof typeof colorMap] || 'default'
    }

    const getImpactText = (level: string) => {
        const textMap = {
            high: '高',
            medium: '中',
            low: '低',
        }
        return textMap[level as keyof typeof textMap] || level
    }

    const getChangeTypeText = (type: string) => {
        const textMap = {
            add: '新增',
            modify: '修改',
            delete: '删除',
        }
        return textMap[type as keyof typeof textMap] || type
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'failed':
                return <CloseCircleOutlined style={{ color: '#f5222d' }} />
            case 'completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />
            default:
                return <WarningOutlined style={{ color: '#faad14' }} />
        }
    }

    const columns: ColumnsType<ImpactAnalysis> = [
        {
            title: '状态',
            dataIndex: 'analysisStatus',
            key: 'status',
            width: 80,
            render: (status: string) => (
                <div style={{ textAlign: 'center' }}>
                    {getStatusIcon(status)}
                    <div style={{ fontSize: 12, marginTop: 4 }}>{getStatusText(status)}</div>
                </div>
            ),
        },
        {
            title: '表名',
            dataIndex: 'tableName',
            key: 'tableName',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '字段名',
            dataIndex: 'fieldName',
            key: 'fieldName',
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '变更类型',
            dataIndex: 'changeType',
            key: 'changeType',
            render: (type: string) => (
                <Tag color={type === 'add' ? 'green' : type === 'modify' ? 'orange' : 'red'}>
                    {getChangeTypeText(type)}
                </Tag>
            ),
        },
        {
            title: '影响级别',
            dataIndex: 'impactLevel',
            key: 'impactLevel',
            render: (level: string) => (
                <Tag color={getImpactColor(level)}>{getImpactText(level)}</Tag>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
        },
        {
            title: '影响范围',
            key: 'impactScope',
            render: (_, record) => (
                <div>
                    <div>表: {record.affectedTables.length}</div>
                    <div>字段: {record.affectedFields}</div>
                    <div>流程: {record.affectedProcesses}</div>
                    <div>报表: {record.affectedReports}</div>
                </div>
            ),
        },
        {
            title: '置信度',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (confidence: number) => (
                <Progress
                    percent={Math.round(confidence * 100)}
                    size='small'
                    strokeColor={
                        confidence > 0.8 ? '#52c41a' : confidence > 0.6 ? '#faad14' : '#f5222d'
                    }
                />
            ),
        },
        {
            title: '分析时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 140,
        },
        {
            title: '分析员',
            dataIndex: 'analyst',
            key: 'analyst',
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
                        onClick={() => handleViewDetails(record)}
                    >
                        详情
                    </Button>
                    {record.analysisStatus === 'failed' && (
                        <Button type='link' size='small' onClick={() => handleReanalyze(record)}>
                            重新分析
                        </Button>
                    )}
                    {record.analysisStatus === 'completed' && record.impactLevel === 'high' && (
                        <>
                            <Button
                                type='link'
                                size='small'
                                style={{ color: '#52c41a' }}
                                onClick={() => handleApprove(record)}
                            >
                                批准
                            </Button>
                            <Button
                                type='link'
                                danger
                                size='small'
                                onClick={() => handleReject(record)}
                            >
                                拒绝
                            </Button>
                        </>
                    )}
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
                    影响分析
                </Typography.Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                        刷新
                    </Button>
                </Space>
            </div>
            <Alert
                message='数据变更影响分析'
                description='按影响级别、分析状态与变更类型筛选，查看受影响对象与建议措施。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                            刷新
                        </Button>
                    </Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder='搜索表名、字段名或描述'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                        />
                        <Select
                            placeholder='影响级别'
                            style={{ width: 120 }}
                            value={impactLevelFilter}
                            onChange={setImpactLevelFilter}
                            allowClear
                        >
                            <Option value='high'>高</Option>
                            <Option value='medium'>中</Option>
                            <Option value='low'>低</Option>
                        </Select>
                        <Select
                            placeholder='分析状态'
                            style={{ width: 120 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                        >
                            <Option value='pending'>待分析</Option>
                            <Option value='analyzing'>分析中</Option>
                            <Option value='completed'>已完成</Option>
                            <Option value='failed'>失败</Option>
                        </Select>
                        <Select
                            placeholder='变更类型'
                            style={{ width: 120 }}
                            value={changeTypeFilter}
                            onChange={setChangeTypeFilter}
                            allowClear
                        >
                            <Option value='add'>新增</Option>
                            <Option value='modify'>修改</Option>
                            <Option value='delete'>删除</Option>
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
                        showTotal: total => `共 ${total} 条分析记录`,
                    }}
                />
            </Card>

            <Modal
                title='影响分析详情'
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                {selectedAnalysis && (
                    <div>
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={12}>
                                <Card size='small' title='基本信息'>
                                    <Descriptions column={1} size='small'>
                                        <Descriptions.Item label='表名'>
                                            {selectedAnalysis.tableName}
                                        </Descriptions.Item>
                                        <Descriptions.Item label='字段名'>
                                            <Tag color='blue'>{selectedAnalysis.fieldName}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label='变更类型'>
                                            <Tag
                                                color={
                                                    selectedAnalysis.changeType === 'add'
                                                        ? 'green'
                                                        : selectedAnalysis.changeType === 'modify'
                                                          ? 'orange'
                                                          : 'red'
                                                }
                                            >
                                                {getChangeTypeText(selectedAnalysis.changeType)}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label='影响级别'>
                                            <Tag
                                                color={getImpactColor(selectedAnalysis.impactLevel)}
                                            >
                                                {getImpactText(selectedAnalysis.impactLevel)}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label='分析状态'>
                                            <Tag
                                                color={getStatusColor(
                                                    selectedAnalysis.analysisStatus
                                                )}
                                            >
                                                {getStatusText(selectedAnalysis.analysisStatus)}
                                            </Tag>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size='small' title='分析信息'>
                                    <Descriptions column={1} size='small'>
                                        <Descriptions.Item label='分析员'>
                                            {selectedAnalysis.analyst}
                                        </Descriptions.Item>
                                        <Descriptions.Item label='创建时间'>
                                            {selectedAnalysis.createTime}
                                        </Descriptions.Item>
                                        <Descriptions.Item label='完成时间'>
                                            {selectedAnalysis.completeTime || '-'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label='置信度'>
                                            <Progress
                                                percent={Math.round(
                                                    selectedAnalysis.confidence * 100
                                                )}
                                                size='small'
                                                strokeColor={
                                                    selectedAnalysis.confidence > 0.8
                                                        ? '#52c41a'
                                                        : selectedAnalysis.confidence > 0.6
                                                          ? '#faad14'
                                                          : '#f5222d'
                                                }
                                            />
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </Col>
                        </Row>

                        <Card size='small' title='变更描述' style={{ marginBottom: 16 }}>
                            <p>{selectedAnalysis.description}</p>
                        </Card>

                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={8}>
                                <Card size='small' title='影响范围统计'>
                                    <div>
                                        受影响表数:{' '}
                                        <strong>{selectedAnalysis.affectedTables.length}</strong>
                                    </div>
                                    <div>
                                        受影响字段数:{' '}
                                        <strong>{selectedAnalysis.affectedFields}</strong>
                                    </div>
                                    <div>
                                        受影响流程数:{' '}
                                        <strong>{selectedAnalysis.affectedProcesses}</strong>
                                    </div>
                                    <div>
                                        受影响报表数:{' '}
                                        <strong>{selectedAnalysis.affectedReports}</strong>
                                    </div>
                                </Card>
                            </Col>
                            <Col span={16}>
                                <Card size='small' title='受影响的数据表'>
                                    <Space wrap>
                                        {selectedAnalysis.affectedTables.map(table => (
                                            <Tag key={table} color='orange'>
                                                {table}
                                            </Tag>
                                        ))}
                                    </Space>
                                </Card>
                            </Col>
                        </Row>

                        <Card size='small' title='建议措施' style={{ marginBottom: 16 }}>
                            <Timeline>
                                {selectedAnalysis.recommendations.map((recommendation, index) => (
                                    <Timeline.Item key={index}>{recommendation}</Timeline.Item>
                                ))}
                            </Timeline>
                        </Card>

                        <Card size='small' title='分析过程'>
                            <Timeline>
                                <Timeline.Item color='green'>
                                    <p>开始分析</p>
                                    <p>{selectedAnalysis.createTime}</p>
                                </Timeline.Item>
                                {selectedAnalysis.analysisStatus === 'completed' && (
                                    <>
                                        <Timeline.Item color='blue'>
                                            <p>识别受影响对象</p>
                                            <p>
                                                发现 {selectedAnalysis.affectedTables.length}{' '}
                                                个相关表
                                            </p>
                                        </Timeline.Item>
                                        <Timeline.Item color='blue'>
                                            <p>评估影响程度</p>
                                            <p>
                                                影响级别:{' '}
                                                {getImpactText(selectedAnalysis.impactLevel)}
                                            </p>
                                        </Timeline.Item>
                                        <Timeline.Item color='green'>
                                            <p>分析完成</p>
                                            <p>{selectedAnalysis.completeTime}</p>
                                        </Timeline.Item>
                                    </>
                                )}
                                {selectedAnalysis.analysisStatus === 'failed' && (
                                    <Timeline.Item color='red'>
                                        <p>分析失败</p>
                                        <p>需要重新评估分析方案</p>
                                    </Timeline.Item>
                                )}
                                {selectedAnalysis.analysisStatus === 'analyzing' && (
                                    <Timeline.Item color='blue'>
                                        <p>正在分析中...</p>
                                        <p>请稍后查看结果</p>
                                    </Timeline.Item>
                                )}
                            </Timeline>
                        </Card>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ImpactAnalysisManagement
