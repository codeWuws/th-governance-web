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
    InputNumber,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { dataManagementService } from '@/services/dataManagementService'
import { uiMessage } from '@/utils/uiMessage'
import type {
    MasterIndexConfigRecord,
    MasterIndexConfigPageParams,
    AddMasterIndexConfigRequest,
    UpdateMasterIndexConfigRequest,
} from '@/types'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 前端使用的数据模型
interface IndexConfiguration {
    id: string
    configName: string // 配置名称
    ruleCode: string // 规则编码
    generateType: number // 生成方式：1-固定生成，2-随机生成
    generateTypeName: string // 生成方式名称
    prefix: string | null // 固定前缀（固定生成时使用）
    length: number // 长度
    configInfo: string // 配置信息
    description: string // 描述
    status: number // 状态：0-禁用，1-启用
    statusName: string // 状态名称
    createBy: string // 创建人
    createTime: string // 创建时间
    updateBy: string | null // 更新人
    updateTime: string // 更新时间
    remark: string | null // 备注
}

/**
 * 将后端返回的记录转换为前端使用的数据模型
 */
const mapRecordToModel = (record: MasterIndexConfigRecord): IndexConfiguration => {
    return {
        id: record.id,
        configName: record.configName,
        ruleCode: record.ruleCode,
        generateType: record.generateType,
        generateTypeName: record.generateTypeName,
        prefix: record.prefix,
        length: record.length,
        configInfo: record.configInfo,
        description: record.description,
        status: record.status,
        statusName: record.statusName,
        createBy: record.createBy,
        createTime: record.createTime,
        updateBy: record.updateBy,
        updateTime: record.updateTime,
        remark: record.remark,
    }
}

const IndexConfiguration: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexConfiguration[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexConfiguration | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexConfiguration | null>(null)
    const [form] = Form.useForm()
    const [filterForm] = Form.useForm() // 筛选表单

    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 生成方式选项
    const generateTypeOptions = [
        { value: 1, label: '固定生成' },
        { value: 2, label: '随机生成' },
    ]

    /**
     * 获取数据
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        configName?: string | null
        ruleCode?: string | null
        generateType?: number | null
        status?: number | null
    }) => {
        setLoading(true)
        try {
            const pageNum = options?.pageNum ?? pagination.current
            const pageSize = options?.pageSize ?? pagination.pageSize

            // 获取筛选表单的值
            const filterValues = filterForm.getFieldsValue()

            // 处理配置名称
            let configNameValue: string | undefined
            if (options?.configName !== undefined) {
                configNameValue = options.configName === null ? undefined : (options.configName.trim() || undefined)
            } else {
                configNameValue = filterValues.configName ? filterValues.configName.trim() : undefined
            }

            // 处理规则编码
            let ruleCodeValue: string | undefined
            if (options?.ruleCode !== undefined) {
                ruleCodeValue = options.ruleCode === null ? undefined : (options.ruleCode.trim() || undefined)
            } else {
                ruleCodeValue = filterValues.ruleCode ? filterValues.ruleCode.trim() : undefined
            }

            // 处理生成方式
            let generateTypeValue: number | undefined
            if (options?.generateType !== undefined) {
                generateTypeValue = options.generateType === null ? undefined : options.generateType
            } else {
                generateTypeValue = filterValues.generateType !== undefined && filterValues.generateType !== null
                    ? filterValues.generateType
                    : undefined
            }

            // 处理状态
            let statusValue: number | undefined
            if (options?.status !== undefined) {
                statusValue = options.status === null ? undefined : options.status
            } else {
                const status = filterValues.status
                if (status === undefined || status === null) {
                    statusValue = undefined
                } else {
                    statusValue = status === 1 || status === '1' ? 1 : status === 0 || status === '0' ? 0 : undefined
                }
            }

            const params: MasterIndexConfigPageParams = {
                pageNum,
                pageSize,
                configName: configNameValue,
                ruleCode: ruleCodeValue,
                generateType: generateTypeValue,
                status: statusValue,
                sortField: 'create_time',
                sortOrder: 'desc',
            }

            const response = await dataManagementService.getMasterIndexConfigPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取主索引配置列表失败'
            uiMessage.handleSystemError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchData()
    }, [])

    /**
     * 处理查询
     */
    const handleSearch = () => {
        const filterValues = filterForm.getFieldsValue()
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            configName: filterValues.configName ? filterValues.configName.trim() : null,
            ruleCode: filterValues.ruleCode ? filterValues.ruleCode.trim() : null,
            generateType:
                filterValues.generateType !== undefined && filterValues.generateType !== null
                    ? filterValues.generateType
                    : null,
            status:
                filterValues.status !== undefined && filterValues.status !== null
                    ? filterValues.status === 1 || filterValues.status === '1'
                        ? 1
                        : 0
                    : null,
        })
    }

    /**
     * 重置筛选条件
     */
    const handleReset = () => {
        filterForm.resetFields()
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            configName: null,
            ruleCode: null,
            generateType: null,
            status: null,
        })
    }

    /**
     * 处理分页变化
     */
    const handleTableChange = (page: number, pageSize: number) => {
        setPagination(prev => ({ ...prev, current: page, pageSize }))
        void fetchData({ pageNum: page, pageSize })
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: 1,
            generateType: 1,
            length: 32,
        })
        setModalVisible(true)
    }

    const handleEdit = (record: IndexConfiguration) => {
        setEditingRecord(record)
        form.setFieldsValue({
            configName: record.configName,
            ruleCode: record.ruleCode,
            generateType: record.generateType,
            prefix: record.prefix,
            length: record.length,
            configInfo: record.configInfo,
            description: record.description,
            status: record.status,
            remark: record.remark,
        })
        setModalVisible(true)
    }

    const handleView = (record: IndexConfiguration) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await dataManagementService.deleteMasterIndexConfig(id)
            if (response.code === 200) {
                message.success('删除成功')
                // 删除成功后刷新列表
                const currentPageDataCount = data.length
                const nextPageNum =
                    currentPageDataCount === 1 && pagination.current > 1
                        ? pagination.current - 1
                        : pagination.current
                setPagination(prev => ({ ...prev, current: nextPageNum }))
                void fetchData({
                    pageNum: nextPageNum,
                    pageSize: pagination.pageSize,
                })
            } else {
                uiMessage.handleSystemError(response.msg || '删除失败')
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '删除失败'
            uiMessage.handleSystemError(errMsg)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            // 状态从 0/1 转换为 number
            const status = values.status === 1 || values.status === true ? 1 : 0

            if (editingRecord) {
                // 编辑
                const updateParams: UpdateMasterIndexConfigRequest = {
                    id: editingRecord.id,
                    configName: values.configName,
                    ruleCode: values.ruleCode,
                    generateType: values.generateType,
                    prefix: values.generateType === 1 ? values.prefix : undefined,
                    length: values.length,
                    configInfo: values.configInfo || '',
                    description: values.description || '',
                    status: status,
                    remark: values.remark || '',
                }

                const response = await dataManagementService.updateMasterIndexConfig(updateParams)
                if (response.code === 200) {
                    message.success('更新成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    void fetchData()
                } else {
                    uiMessage.handleSystemError(response.msg || '更新失败')
                }
            } else {
                // 新增
                const addParams: AddMasterIndexConfigRequest = {
                    configName: values.configName,
                    ruleCode: values.ruleCode,
                    generateType: values.generateType,
                    prefix: values.generateType === 1 ? values.prefix : undefined,
                    length: values.length,
                    configInfo: values.configInfo || '',
                    description: values.description || '',
                    status: status,
                    remark: values.remark || '',
                }

                const response = await dataManagementService.addMasterIndexConfig(addParams)
                if (response.code === 200) {
                    message.success('添加成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    void fetchData()
                } else {
                    uiMessage.handleSystemError(response.msg || '添加失败')
                }
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '操作失败'
            uiMessage.handleSystemError(errMsg)
            console.error('表单提交失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    const getStatusColor = (status: number) => {
        return status === 1 ? 'green' : 'red'
    }

    const getStatusText = (status: number) => {
        return status === 1 ? '启用' : '禁用'
    }

    const getGenerateTypeText = (type: number) => {
        return type === 1 ? '固定生成' : '随机生成'
    }

    const columns = [
        {
            title: '配置名称',
            dataIndex: 'configName',
            key: 'configName',
            width: 200,
            render: (text: string) => (
                <Tooltip title={text}>
                    <span style={{ fontWeight: 'bold' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '规则编码',
            dataIndex: 'ruleCode',
            key: 'ruleCode',
            width: 180,
            render: (text: string) => (
                <Tooltip title={text}>
                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                        {text}
                    </code>
                </Tooltip>
            ),
        },
        {
            title: '生成方式',
            dataIndex: 'generateType',
            key: 'generateType',
            width: 120,
            render: (type: number) => (
                <Tag color={type === 1 ? 'blue' : 'purple'}>{getGenerateTypeText(type)}</Tag>
            ),
        },
        {
            title: '固定前缀',
            dataIndex: 'prefix',
            key: 'prefix',
            width: 150,
            render: (prefix: string | null, record: IndexConfiguration) => {
                if (record.generateType === 1) {
                    return prefix ? (
                        <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>
                            {prefix}
                        </code>
                    ) : (
                        <span style={{ color: '#999' }}>-</span>
                    )
                }
                return <span style={{ color: '#999' }}>-</span>
            },
        },
        {
            title: '长度',
            dataIndex: 'length',
            key: 'length',
            width: 80,
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
            render: (status: number) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
        },
        {
            title: '创建人',
            dataIndex: 'createBy',
            key: 'createBy',
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
            render: (_: unknown, record: IndexConfiguration) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
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
                        title='确定要删除这个主索引配置吗？'
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
                    主索引配置
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增配置
                    </Button>
                </Space>
            </div>
            <Alert
                message='主索引配置'
                description='配置数据索引参数，包括索引类型、索引字段、索引生成方式和索引参数设置。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                {/* 筛选表单：自适应布局，左侧筛选区、右侧按钮区 */}
                <div className='filter-bar-wrap'>
                    <Form form={filterForm} layout='inline' className='filter-bar-form'>
                    <Form.Item name='configName' label='配置名称'>
                        <Input
                            placeholder='请输入配置名称'
                            allowClear
                            style={{ width: 200 }}
                            onPressEnter={handleSearch}
                        />
                    </Form.Item>
                    <Form.Item name='ruleCode' label='规则编码'>
                        <Input
                            placeholder='请输入规则编码'
                            allowClear
                            style={{ width: 200 }}
                            onPressEnter={handleSearch}
                        />
                    </Form.Item>
                    <Form.Item name='generateType' label='生成方式'>
                        <Select placeholder='请选择生成方式' allowClear style={{ width: 120 }}>
                            <Option value={1}>固定生成</Option>
                            <Option value={2}>随机生成</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name='status' label='状态'>
                        <Select placeholder='请选择状态' allowClear style={{ width: 120 }}>
                            <Option value={1}>启用</Option>
                            <Option value={0}>禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button
                                icon={<SearchOutlined />}
                                type='primary'
                                onClick={handleSearch}
                                loading={loading}
                            >
                                查询
                            </Button>
                            <Button onClick={handleReset}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
                </div>
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑主索引配置' : '新增主索引配置'}
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
                        status: 1,
                        generateType: 1,
                        length: 32,
                    }}
                >
                    <Form.Item
                        name='configName'
                        label='配置名称'
                        rules={[{ required: true, message: '请输入配置名称' }]}
                    >
                        <Input placeholder='请输入配置名称' />
                    </Form.Item>

                    <Form.Item
                        name='ruleCode'
                        label='规则编码'
                        rules={[{ required: true, message: '请输入规则编码' }]}
                    >
                        <Input placeholder='请输入规则编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        name='generateType'
                        label='生成方式'
                        rules={[{ required: true, message: '请选择生成方式' }]}
                    >
                        <Select placeholder='请选择生成方式'>
                            {generateTypeOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.generateType !== currentValues.generateType
                        }
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('generateType') === 1 ? (
                                <Form.Item
                                    name='prefix'
                                    label='固定前缀'
                                    rules={[{ required: true, message: '固定生成时请输入固定前缀' }]}
                                >
                                    <Input placeholder='请输入固定前缀' />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        name='length'
                        label='长度'
                        rules={[
                            { required: true, message: '请输入长度' },
                            { type: 'number', min: 1, max: 128, message: '长度必须在1-128之间' },
                        ]}
                    >
                        <InputNumber placeholder='请输入长度' min={1} max={128} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name='configInfo' label='配置信息'>
                        <TextArea rows={3} placeholder='请输入配置信息' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='status' label='状态' rules={[{ required: true, message: '请选择状态' }]}>
                        <Select placeholder='请选择状态'>
                            <Option value={1}>启用</Option>
                            <Option value={0}>禁用</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name='remark' label='备注'>
                        <TextArea rows={2} placeholder='请输入备注' maxLength={200} showCount />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='主索引配置详情'
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
                        <Descriptions.Item label='配置名称'>
                            <strong>{viewingRecord.configName}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label='规则编码'>
                            <code
                                style={{
                                    background: '#f5f5f5',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                }}
                            >
                                {viewingRecord.ruleCode}
                            </code>
                        </Descriptions.Item>
                        <Descriptions.Item label='生成方式'>
                            <Tag color={viewingRecord.generateType === 1 ? 'blue' : 'purple'}>
                                {viewingRecord.generateTypeName}
                            </Tag>
                        </Descriptions.Item>
                        {viewingRecord.generateType === 1 && (
                            <Descriptions.Item label='固定前缀'>
                                {viewingRecord.prefix ? (
                                    <code
                                        style={{
                                            background: '#e6f7ff',
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {viewingRecord.prefix}
                                    </code>
                                ) : (
                                    <span style={{ color: '#999' }}>-</span>
                                )}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label='长度'>{viewingRecord.length}</Descriptions.Item>
                        <Descriptions.Item label='配置信息'>
                            {viewingRecord.configInfo || <span style={{ color: '#999' }}>-</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label='描述'>
                            {viewingRecord.description || <span style={{ color: '#999' }}>-</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Tag color={getStatusColor(viewingRecord.status)}>
                                {viewingRecord.statusName}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='创建人'>{viewingRecord.createBy}</Descriptions.Item>
                        <Descriptions.Item label='创建时间'>{viewingRecord.createTime}</Descriptions.Item>
                        {viewingRecord.updateBy && (
                            <Descriptions.Item label='更新人'>{viewingRecord.updateBy}</Descriptions.Item>
                        )}
                        <Descriptions.Item label='更新时间'>{viewingRecord.updateTime}</Descriptions.Item>
                        {viewingRecord.remark && (
                            <Descriptions.Item label='备注'>{viewingRecord.remark}</Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    )
}

export default IndexConfiguration

