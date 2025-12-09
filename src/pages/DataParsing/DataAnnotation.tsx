import React, { useState, useCallback } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
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
    Empty,
} from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    UploadOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile, UploadChangeParam } from 'antd/es/upload'
import type { BadgeProps } from 'antd/es/badge'

const { Title, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

interface DataAnnotationRecord {
    id: string
    fileName: string
    patientId: string
    patientName: string
    annotationType: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    annotator: string
    createTime: string
    updateTime: string
    progress: number
    totalItems: number
    annotatedItems: number
    accuracy?: number
}

interface AnnotationFormValues {
    fileName: string
    patientId: string
    patientName: string
    annotationType: string
    description: string
}

const DataAnnotation: React.FC = () => {
    const [loading, _setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [uploadModalVisible, setUploadModalVisible] = useState(false)
    const [_editingRecord, setEditingRecord] = useState<DataAnnotationRecord | null>(null)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [form] = Form.useForm()
    const [uploadForm] = Form.useForm()

    // 模拟数据
    const [data, setData] = useState<DataAnnotationRecord[]>([
        {
            id: '1',
            fileName: '病历_20241201_001.pdf',
            patientId: 'P20241201001',
            patientName: '张三',
            annotationType: '实体识别',
            status: 'completed',
            annotator: '李医生',
            createTime: '2024-12-01 09:30:00',
            updateTime: '2024-12-01 14:20:00',
            progress: 100,
            totalItems: 150,
            annotatedItems: 150,
            accuracy: 95.2,
        },
        {
            id: '2',
            fileName: '病历_20241201_002.pdf',
            patientId: 'P20241201002',
            patientName: '李四',
            annotationType: '关系抽取',
            status: 'in_progress',
            annotator: '王医生',
            createTime: '2024-12-01 10:15:00',
            updateTime: '2024-12-01 15:30:00',
            progress: 65,
            totalItems: 200,
            annotatedItems: 130,
        },
        {
            id: '3',
            fileName: '病历_20241201_003.pdf',
            patientId: 'P20241201003',
            patientName: '王五',
            annotationType: '事件抽取',
            status: 'pending',
            annotator: '',
            createTime: '2024-12-01 11:00:00',
            updateTime: '2024-12-01 11:00:00',
            progress: 0,
            totalItems: 180,
            annotatedItems: 0,
        },
    ])

    // 处理查看
    const handleView = useCallback((record: DataAnnotationRecord) => {
        message.info(`查看标注任务: ${record.fileName}`)
    }, [])

    // 处理编辑/标注
    const handleEdit = useCallback((record: DataAnnotationRecord) => {
        message.info(`开始标注: ${record.fileName}`)
    }, [])


    // 处理删除
    const handleDelete = useCallback((record: DataAnnotationRecord) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标注任务 "${record.fileName}" 吗？`,
            onOk: () => {
                setData(prev => prev.filter(item => item.id !== record.id))
                message.success('删除成功')
            },
        })
    }, [])

    // 表格列配置
    const columns: ColumnsType<DataAnnotationRecord> = [
        {
            title: '文件名称',
            dataIndex: 'fileName',
            key: 'fileName',
            width: 200,
            ellipsis: true,
        },
        {
            title: '患者ID',
            dataIndex: 'patientId',
            key: 'patientId',
            width: 120,
        },
        {
            title: '患者姓名',
            dataIndex: 'patientName',
            key: 'patientName',
            width: 120,
        },
        {
            title: '标注类型',
            dataIndex: 'annotationType',
            key: 'annotationType',
            width: 120,
            render: (type: string) => {
                const typeMap = {
                    entity: '实体识别',
                    relation: '关系抽取',
                    event: '事件抽取',
                    classification: '文本分类',
                }
                return typeMap[type as keyof typeof typeMap] || type
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const statusConfig = {
                    pending: { color: 'default', text: '待处理', icon: <ClockCircleOutlined /> },
                    in_progress: {
                        color: 'processing',
                        text: '进行中',
                        icon: <ClockCircleOutlined />,
                    },
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
            title: '进度',
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
                        {record.annotatedItems}/{record.totalItems}
                    </div>
                </div>
            ),
        },
        {
            title: '标注员',
            dataIndex: 'annotator',
            key: 'annotator',
            width: 100,
            render: (annotator: string) => annotator || '-',
        },
        {
            title: '准确率',
            dataIndex: 'accuracy',
            key: 'accuracy',
            width: 100,
            render: (accuracy: number) => (accuracy ? `${accuracy}%` : '-'),
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
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
                    {record.status !== 'completed' && (
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            size='small'
                            onClick={() => handleEdit(record)}
                        >
                            标注
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

    // 处理新建标注任务
    const handleCreate = useCallback(() => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }, [form])

    // 处理文件上传
    const handleUpload = useCallback(() => {
        setFileList([])
        uploadForm.resetFields()
        setUploadModalVisible(true)
    }, [uploadForm])

    // 处理表单提交
    const handleModalOk = useCallback(async () => {
        try {
            const values: AnnotationFormValues = await form.validateFields()
            const newTask: DataAnnotationRecord = {
                id: Date.now().toString(),
                fileName: values.fileName,
                patientId: values.patientId,
                patientName: values.patientName,
                annotationType: values.annotationType,
                status: 'pending',
                annotator: '',
                createTime: new Date().toLocaleString(),
                updateTime: new Date().toLocaleString(),
                progress: 0,
                totalItems: Math.floor(Math.random() * 200) + 100,
                annotatedItems: 0,
            }
            setData(prev => [newTask, ...prev])
            setModalVisible(false)
            form.resetFields()
            message.success('创建标注任务成功')
        } catch {
            // 静默处理表单验证失败
        }
    }, [form])

    // 处理文件上传提交
    const handleUploadOk = useCallback(async () => {
        try {
            await uploadForm.validateFields()
            if (fileList.length === 0) {
                message.warning('请上传文件')
                return
            }
            message.success('文件上传成功，开始自动标注')
            setUploadModalVisible(false)
            uploadForm.resetFields()
            setFileList([])
        } catch {
            // 静默处理表单验证失败
        }
    }, [uploadForm, fileList])

    // 处理文件上传变化
    const handleFileChange = useCallback((info: UploadChangeParam) => {
        setFileList(info.fileList)
    }, [])

    // 处理搜索
    const handleSearch = useCallback(() => {
        message.info('搜索功能开发中')
    }, [])

    return (
        <div style={{ padding: '24px' }}>
            {/* 页面标题和描述 */}
            <Card style={{ marginBottom: '24px' }}>
                <Title level={3}>数据标注</Title>
                <Paragraph type='secondary'>
                    对于电子病历数据进行标注，支持实体识别、关系抽取、事件抽取等多种标注类型，
                    提供可视化标注界面和智能辅助功能，提高标注效率和准确性。
                </Paragraph>
            </Card>

            {/* 搜索和操作区域 */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align='middle'>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Input placeholder='搜索文件名称' prefix={<SearchOutlined />} allowClear />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select placeholder='选择标注类型' style={{ width: '100%' }} allowClear>
                            <Select.Option value='entity'>实体识别</Select.Option>
                            <Select.Option value='relation'>关系抽取</Select.Option>
                            <Select.Option value='event'>事件抽取</Select.Option>
                            <Select.Option value='classification'>文本分类</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select placeholder='选择状态' style={{ width: '100%' }} allowClear>
                            <Select.Option value='pending'>待处理</Select.Option>
                            <Select.Option value='in_progress'>进行中</Select.Option>
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
                        <Space>
                            <Button type='primary' icon={<UploadOutlined />} onClick={handleUpload}>
                                上传标注
                            </Button>
                            <Button type='primary' icon={<PlusOutlined />} onClick={handleCreate}>
                                新建任务
                            </Button>
                        </Space>
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
                    scroll={{ x: 1300 }}
                    pagination={{
                        total: data.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                    locale={{
                        emptyText: <Empty description='暂无标注任务' />,
                    }}
                />
            </Card>

            {/* 新建任务模态框 */}
            <Modal
                title='新建标注任务'
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                width={600}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        annotationType: 'entity',
                    }}
                >
                    <Form.Item
                        name='fileName'
                        label='文件名称'
                        rules={[{ required: true, message: '请输入文件名称' }]}
                    >
                        <Input placeholder='请输入文件名称' />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='patientId'
                                label='患者ID'
                                rules={[{ required: true, message: '请输入患者ID' }]}
                            >
                                <Input placeholder='请输入患者ID' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='patientName'
                                label='患者姓名'
                                rules={[{ required: true, message: '请输入患者姓名' }]}
                            >
                                <Input placeholder='请输入患者姓名' />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name='annotationType'
                        label='标注类型'
                        rules={[{ required: true, message: '请选择标注类型' }]}
                    >
                        <Select placeholder='请选择标注类型'>
                            <Select.Option value='entity'>实体识别</Select.Option>
                            <Select.Option value='relation'>关系抽取</Select.Option>
                            <Select.Option value='event'>事件抽取</Select.Option>
                            <Select.Option value='classification'>文本分类</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入任务描述（可选）' />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 文件上传模态框 */}
            <Modal
                title='上传标注文件'
                open={uploadModalVisible}
                onOk={handleUploadOk}
                onCancel={() => setUploadModalVisible(false)}
                width={600}
            >
                <Form form={uploadForm} layout='vertical'>
                    <Form.Item
                        name='annotationType'
                        label='标注类型'
                        rules={[{ required: true, message: '请选择标注类型' }]}
                    >
                        <Select placeholder='请选择标注类型'>
                            <Select.Option value='entity'>实体识别</Select.Option>
                            <Select.Option value='relation'>关系抽取</Select.Option>
                            <Select.Option value='event'>事件抽取</Select.Option>
                            <Select.Option value='classification'>文本分类</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='files'
                        label='上传文件'
                        rules={[{ required: true, message: '请上传文件' }]}
                    >
                        <Upload
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false}
                            multiple
                            accept='.pdf,.doc,.docx,.txt,.json'
                        >
                            <Button icon={<UploadOutlined />}>选择文件</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入文件描述（可选）' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default DataAnnotation
