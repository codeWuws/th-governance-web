import React, { useState, useCallback } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Input,
    Select,
    DatePicker,
    Modal,
    Form,
    Upload,
    message,
    Typography,
    Row,
    Col,
    Badge,
    Progress,
    Tooltip,
    Empty,
    Steps,
    Descriptions,
    Statistic,
} from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    UploadOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    RobotOutlined,
    DatabaseOutlined,
    ApiOutlined,
    BarChartOutlined,
    DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile, UploadChangeParam } from 'antd/es/upload'
import type { BadgeProps } from 'antd/es/badge'

const { Title, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Step } = Steps

interface MedicalRecordParsingRecord {
    id: string
    fileName: string
    patientId: string
    patientName: string
    fileType: string
    status: 'pending' | 'parsing' | 'completed' | 'failed'
    modelType: string
    createTime: string
    updateTime: string
    progress: number
    extractedItems: number
    totalItems: number
    accuracy?: number
    processingTime?: number
    errorMessage?: string
}

const MedicalRecordParsing: React.FC = () => {
    const [loading, _setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [configModalVisible, setConfigModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordParsingRecord | null>(null)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [_form] = Form.useForm()
    const [uploadForm] = Form.useForm()
    const [configForm] = Form.useForm()
    const [currentStep, setCurrentStep] = useState(0)

    // 模拟数据
    const [data, setData] = useState<MedicalRecordParsingRecord[]>([
        {
            id: '1',
            fileName: '入院记录_20241201_001.pdf',
            patientId: 'P20241201001',
            patientName: '张三',
            fileType: '入院记录',
            status: 'completed',
            modelType: '医疗NER模型',
            createTime: '2024-12-01 09:30:00',
            updateTime: '2024-12-01 09:35:00',
            progress: 100,
            extractedItems: 156,
            totalItems: 156,
            accuracy: 94.8,
            processingTime: 300,
        },
        {
            id: '2',
            fileName: '病程记录_20241201_002.docx',
            patientId: 'P20241201002',
            patientName: '李四',
            fileType: '病程记录',
            status: 'parsing',
            modelType: '医疗关系抽取模型',
            createTime: '2024-12-01 10:15:00',
            updateTime: '2024-12-01 10:18:00',
            progress: 65,
            extractedItems: 89,
            totalItems: 137,
        },
        {
            id: '3',
            fileName: '出院记录_20241201_003.pdf',
            patientId: 'P20241201003',
            patientName: '王五',
            fileType: '出院记录',
            status: 'pending',
            modelType: '医疗事件抽取模型',
            createTime: '2024-12-01 11:00:00',
            updateTime: '2024-12-01 11:00:00',
            progress: 0,
            extractedItems: 0,
            totalItems: 0,
        },
    ])

    // 解析步骤
    const parsingSteps = [
        {
            title: '文件预处理',
            description: '文档格式转换、文本清洗',
            icon: <DatabaseOutlined />,
        },
        {
            title: '模型推理',
            description: '机器学习模型分析处理',
            icon: <RobotOutlined />,
        },
        {
            title: '结果抽取',
            description: '结构化数据抽取',
            icon: <ApiOutlined />,
        },
        {
            title: '质量校验',
            description: '结果准确性验证',
            icon: <CheckCircleOutlined />,
        },
    ]

    // 表格列配置
    // 处理查看详情
    const handleView = useCallback((record: MedicalRecordParsingRecord) => {
        setSelectedRecord(record)
        setCurrentStep(record.status === 'completed' ? 3 : record.status === 'parsing' ? 1 : 0)
        setDetailModalVisible(true)
    }, [])

    // 处理开始解析
    const handleStartParsing = useCallback((record: MedicalRecordParsingRecord) => {
        message.info(`开始解析: ${record.fileName}`)
        // 模拟解析过程
        setData(prev =>
            prev.map(item =>
                item.id === record.id ? { ...item, status: 'parsing', progress: 0 } : item
            )
        )

        // 模拟进度更新
        let progress = 0
        const interval = setInterval(() => {
            progress += Math.random() * 20
            if (progress >= 100) {
                progress = 100
                clearInterval(interval)
                setData(prev =>
                    prev.map(item =>
                        item.id === record.id
                            ? {
                                  ...item,
                                  status: 'completed',
                                  progress: 100,
                                  extractedItems: Math.floor(Math.random() * 200) + 100,
                                  totalItems: Math.floor(Math.random() * 200) + 100,
                                  accuracy: Math.random() * 10 + 90,
                                  processingTime: Math.floor(Math.random() * 600) + 120,
                                  updateTime: new Date().toLocaleString(),
                              }
                            : item
                    )
                )
                message.success(`解析完成: ${record.fileName}`)
            } else {
                setData(prev =>
                    prev.map(item =>
                        item.id === record.id
                            ? {
                                  ...item,
                                  progress: Math.round(progress),
                                  extractedItems: Math.round(
                                      progress * 0.01 * (Math.floor(Math.random() * 200) + 100)
                                  ),
                                  updateTime: new Date().toLocaleString(),
                              }
                            : item
                    )
                )
            }
        }, 1000)
    }, [])


    // 处理删除
    const handleDelete = useCallback((record: MedicalRecordParsingRecord) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除解析任务 "${record.fileName}" 吗？`,
            onOk: () => {
                setData(prev => prev.filter(item => item.id !== record.id))
                message.success('删除成功')
            },
        })
    }, [])

    // 处理新建解析任务
    const handleCreate = useCallback(() => {
        setFileList([])
        uploadForm.resetFields()
        setModalVisible(true)
    }, [uploadForm])

    // 处理模型配置
    const handleModelConfig = useCallback(() => {
        configForm.resetFields()
        setConfigModalVisible(true)
    }, [configForm])

    const columns: ColumnsType<MedicalRecordParsingRecord> = [
        {
            title: '文件名称',
            dataIndex: 'fileName',
            key: 'fileName',
            width: 200,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span style={{ cursor: 'pointer' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '患者信息',
            key: 'patient',
            width: 120,
            render: (_, record) => (
                <div>
                    <div>ID: {record.patientId}</div>
                    <div>{record.patientName}</div>
                </div>
            ),
        },
        {
            title: '文档类型',
            dataIndex: 'fileType',
            key: 'fileType',
            width: 100,
            render: (type: string) => <Tag color='blue'>{type}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const statusConfig = {
                    pending: { color: 'default', text: '待解析', icon: <ClockCircleOutlined /> },
                    parsing: { color: 'processing', text: '解析中', icon: <PlayCircleOutlined /> },
                    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
                    failed: { color: 'error', text: '失败', icon: <ExclamationCircleOutlined /> },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return (
                    <Badge
                        status={config.color as BadgeProps['status']}
                        text={
                            <Space>
                                {config.icon}
                                {config.text}
                            </Space>
                        }
                    />
                )
            },
        },
        {
            title: '模型类型',
            dataIndex: 'modelType',
            key: 'modelType',
            width: 150,
            render: (type: string) => (
                <Tooltip title={type}>
                    <Tag color='green'>{type}</Tag>
                </Tooltip>
            ),
        },
        {
            title: '解析进度',
            key: 'progress',
            width: 150,
            render: (_, record) => (
                <div>
                    <Progress
                        percent={record.progress}
                        size='small'
                        status={record.status === 'failed' ? 'exception' : 'active'}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {record.extractedItems}/{record.totalItems}
                    </div>
                </div>
            ),
        },
        {
            title: '准确率',
            dataIndex: 'accuracy',
            key: 'accuracy',
            width: 80,
            render: (accuracy: number) =>
                accuracy ? (
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{accuracy}%</span>
                ) : (
                    '-'
                ),
        },
        {
            title: '处理时间',
            dataIndex: 'processingTime',
            key: 'processingTime',
            width: 100,
            render: (time: number) => (time ? `${Math.round(time / 60)}分钟` : '-'),
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
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='text'
                        icon={<EyeOutlined />}
                        size='small'
                        onClick={() => handleView(record)}
                    >
                        查看
                    </Button>
                    {record.status === 'pending' && (
                        <Button
                            type='text'
                            icon={<PlayCircleOutlined />}
                            size='small'
                            onClick={() => handleStartParsing(record)}
                        >
                            开始解析
                        </Button>
                    )}
                    <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        size='small'
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ]

    // 处理配置提交
    const handleConfigOk = useCallback(async () => {
        try {
            await configForm.validateFields()
            message.success('模型配置保存成功')
            setConfigModalVisible(false)
            configForm.resetFields()
        } catch {
            // 静默处理
        }
    }, [configForm])

    // 处理文件上传变化
    const handleFileChange = useCallback((info: UploadChangeParam) => {
        setFileList(info.fileList)
    }, [])

    // 处理搜索
    const handleSearch = useCallback(() => {
        message.info('搜索功能开发中')
        // TODO: 实现搜索功能
    }, [])

    return (
        <div style={{ padding: '24px' }}>
            {/* 页面标题和描述 */}
            <Card style={{ marginBottom: '24px' }}>
                <Title level={3}>电子病历解析</Title>
                <Paragraph type='secondary'>
                    数据结构化解析，通过机器学习、模型训练、数据抽取、标引等过程，
                    实现电子病历的自动化解析结构化，提升数据处理的效率、质量和准确率。
                </Paragraph>
            </Card>

            {/* 模型配置和统计 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title='总解析任务'
                            value={data.length}
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title='已完成任务'
                            value={data.filter(item => item.status === 'completed').length}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title='平均准确率'
                            value={94.2}
                            suffix='%'
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<BarChartOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Button
                            type='primary'
                            icon={<SettingOutlined />}
                            style={{ width: '100%' }}
                            onClick={handleModelConfig}
                        >
                            模型配置
                        </Button>
                    </Card>
                </Col>
            </Row>

            {/* 搜索和操作区域 */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align='middle'>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Input placeholder='搜索文件名称' prefix={<SearchOutlined />} allowClear />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select placeholder='选择文档类型' style={{ width: '100%' }} allowClear>
                            <Select.Option value='admission'>入院记录</Select.Option>
                            <Select.Option value='progress'>病程记录</Select.Option>
                            <Select.Option value='discharge'>出院记录</Select.Option>
                            <Select.Option value='emergency'>急诊记录</Select.Option>
                            <Select.Option value='operation'>手术记录</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select placeholder='选择模型类型' style={{ width: '100%' }} allowClear>
                            <Select.Option value='ner'>医疗NER模型</Select.Option>
                            <Select.Option value='relation'>医疗关系抽取模型</Select.Option>
                            <Select.Option value='event'>医疗事件抽取模型</Select.Option>
                            <Select.Option value='classification'>医疗文本分类模型</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select placeholder='选择状态' style={{ width: '100%' }} allowClear>
                            <Select.Option value='pending'>待解析</Select.Option>
                            <Select.Option value='parsing'>解析中</Select.Option>
                            <Select.Option value='completed'>已完成</Select.Option>
                            <Select.Option value='failed'>失败</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <RangePicker style={{ width: '100%' }} />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Space>
                            <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                                搜索
                            </Button>
                            <Button
                                onClick={() => {
                                    /* 重置功能开发中 */
                                }}
                            >
                                重置
                            </Button>
                        </Space>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} style={{ marginLeft: 'auto' }}>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleCreate}>
                            新建解析任务
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* 数据表格 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        total: data.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                    locale={{
                        emptyText: <Empty description='暂无解析任务' />,
                    }}
                />
            </Card>

            {/* 详情模态框 */}
            <Modal
                title='解析详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                {selectedRecord && (
                    <div>
                        <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label='文件名称'>
                                {selectedRecord.fileName}
                            </Descriptions.Item>
                            <Descriptions.Item label='患者ID'>
                                {selectedRecord.patientId}
                            </Descriptions.Item>
                            <Descriptions.Item label='患者姓名'>
                                {selectedRecord.patientName}
                            </Descriptions.Item>
                            <Descriptions.Item label='文档类型'>
                                <Tag color='blue'>{selectedRecord.fileType}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='模型类型'>
                                {selectedRecord.modelType}
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Badge
                                    status={
                                        selectedRecord.status === 'completed'
                                            ? 'success'
                                            : selectedRecord.status === 'parsing'
                                              ? 'processing'
                                              : selectedRecord.status === 'failed'
                                                ? 'error'
                                                : 'default'
                                    }
                                    text={
                                        selectedRecord.status === 'completed'
                                            ? '已完成'
                                            : selectedRecord.status === 'parsing'
                                              ? '解析中'
                                              : selectedRecord.status === 'failed'
                                                ? '失败'
                                                : '待解析'
                                    }
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='准确率'>
                                {selectedRecord.accuracy ? `${selectedRecord.accuracy}%` : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='处理时间'>
                                {selectedRecord.processingTime
                                    ? `${Math.round(selectedRecord.processingTime / 60)}分钟`
                                    : '-'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Title level={5} style={{ marginBottom: '16px' }}>
                            解析流程
                        </Title>
                        <Steps current={currentStep}>
                            {parsingSteps.map((step, index) => (
                                <Step
                                    key={index}
                                    title={step.title}
                                    description={step.description}
                                    icon={step.icon}
                                />
                            ))}
                        </Steps>

                        {selectedRecord.status === 'completed' && (
                            <div style={{ marginTop: '24px' }}>
                                <Title level={5} style={{ marginBottom: '16px' }}>
                                    解析结果统计
                                </Title>
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <Card size='small'>
                                            <Statistic
                                                title='抽取实体数'
                                                value={selectedRecord.extractedItems}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size='small'>
                                            <Statistic
                                                title='准确率'
                                                value={selectedRecord.accuracy || 0}
                                                suffix='%'
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size='small'>
                                            <Statistic
                                                title='处理时间'
                                                value={
                                                    selectedRecord.processingTime
                                                        ? Math.round(
                                                              selectedRecord.processingTime / 60
                                                          )
                                                        : 0
                                                }
                                                suffix='分钟'
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* 新建解析任务模态框 */}
            <Modal
                title='新建解析任务'
                open={modalVisible}
                onOk={() => setModalVisible(false)}
                onCancel={() => setModalVisible(false)}
                width={600}
            >
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Upload
                        fileList={fileList}
                        onChange={handleFileChange}
                        beforeUpload={() => false}
                        multiple
                        accept='.pdf,.doc,.docx,.txt'
                    >
                        <Button icon={<UploadOutlined />} size='large'>
                            选择电子病历文件
                        </Button>
                    </Upload>
                    <Paragraph type='secondary' style={{ marginTop: '16px' }}>
                        支持 PDF、Word、TXT 格式的电子病历文件
                    </Paragraph>
                </div>
            </Modal>

            {/* 模型配置模态框 */}
            <Modal
                title='模型配置'
                open={configModalVisible}
                onOk={handleConfigOk}
                onCancel={() => setConfigModalVisible(false)}
                width={600}
            >
                <Form
                    form={configForm}
                    layout='vertical'
                    initialValues={{
                        modelType: 'ner',
                        confidence: 0.8,
                        extractEntities: true,
                        extractRelations: true,
                        extractEvents: false,
                        customRules: [],
                    }}
                >
                    <Form.Item
                        name='modelType'
                        label='模型类型'
                        rules={[{ required: true, message: '请选择模型类型' }]}
                    >
                        <Select placeholder='请选择模型类型'>
                            <Select.Option value='ner'>医疗NER模型</Select.Option>
                            <Select.Option value='relation'>医疗关系抽取模型</Select.Option>
                            <Select.Option value='event'>医疗事件抽取模型</Select.Option>
                            <Select.Option value='classification'>医疗文本分类模型</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='confidence'
                        label='置信度阈值'
                        rules={[{ required: true, message: '请设置置信度阈值' }]}
                    >
                        <Input
                            type='number'
                            min={0}
                            max={1}
                            step={0.1}
                            placeholder='请输入置信度阈值 (0-1)'
                        />
                    </Form.Item>
                    <Form.Item name='extractEntities' valuePropName='checked'>
                        <input type='checkbox' /> 抽取实体
                    </Form.Item>
                    <Form.Item name='extractRelations' valuePropName='checked'>
                        <input type='checkbox' /> 抽取关系
                    </Form.Item>
                    <Form.Item name='extractEvents' valuePropName='checked'>
                        <input type='checkbox' /> 抽取事件
                    </Form.Item>
                    <Form.Item name='customRules' label='自定义规则'>
                        <TextArea rows={3} placeholder='请输入自定义规则（可选）' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default MedicalRecordParsing
