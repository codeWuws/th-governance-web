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
import { dataManagementService } from '@/services/dataManagementService'
import { uiMessage } from '@/utils/uiMessage'
import type { PrimaryIndexRuleRecord, PrimaryIndexRulePageParams } from '@/types'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 前端使用的数据模型
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

/**
 * 将后端返回的记录转换为前端使用的数据模型
 */
const mapRecordToModel = (record: PrimaryIndexRuleRecord): IndexGenerationRule => {
    // 将 baseFields 字符串转换为数组（假设用逗号分隔）
    // 注意：后端存储的应该是 value，而不是 label
    const sourceFields = record.baseFields
        ? record.baseFields.split(',').map(field => field.trim()).filter(Boolean)
        : []
    
    return {
        id: record.id,
        name: record.ruleName,
        code: record.ruleCode,
        // 使用 baseTable（value）而不是 baseTableName（label），因为表单中需要存储 value
        sourceTable: record.baseTable,
        sourceFields,
        description: record.description || '',
        status: record.status === 1 ? 'active' : 'inactive',
        createTime: record.createTime,
        updateTime: record.updateTime || record.createTime,
        creator: record.createBy || '系统',
    }
}


const IndexGenerationRules: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexGenerationRule[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexGenerationRule | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexGenerationRule | null>(null)
    const [form] = Form.useForm()
    const [filterForm] = Form.useForm() // 筛选表单
    
    // 下拉选项数据
    const [baseTableOptions, setBaseTableOptions] = useState<Array<{ value: string; label: string }>>([])
    const [baseFieldOptions, setBaseFieldOptions] = useState<Array<{ value: string; label: string }>>([])
    
    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    /**
     * 获取数据
     * @param options 可选的查询参数，用于覆盖状态变量
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        keyword?: string | null
        status?: number | null
        condition?: string | null
    }) => {
        setLoading(true)
        try {
            const pageNum = options?.pageNum ?? pagination.current
            const pageSize = options?.pageSize ?? pagination.pageSize
            
            // 获取筛选表单的值
            const filterValues = filterForm.getFieldsValue()
            
            // 处理关键字
            let keywordValue: string | undefined
            if (options?.keyword !== undefined) {
                keywordValue = options.keyword === null ? undefined : (options.keyword.trim() || undefined)
            } else {
                keywordValue = filterValues.keyword ? filterValues.keyword.trim() : undefined
            }
            
            // 处理条件查询
            let conditionValue: string | undefined
            if (options?.condition !== undefined) {
                conditionValue = options.condition === null ? undefined : (options.condition.trim() || undefined)
            } else {
                conditionValue = filterValues.condition ? filterValues.condition.trim() : undefined
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

            const params: PrimaryIndexRulePageParams = {
                pageNum,
                pageSize,
                condition: conditionValue,
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue,
                status: statusValue,
            }

            const response = await dataManagementService.getPrimaryIndexRulePage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取主索引生成规则列表失败'
            uiMessage.handleSystemError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 获取依据表选项
     */
    const fetchBaseTableOptions = async () => {
        try {
            const response = await dataManagementService.getBaseTableOptions()
            if (response.code === 200 && response.data) {
                // 按 sort 字段排序
                const sortedOptions = [...response.data].sort((a, b) => a.sort - b.sort)
                setBaseTableOptions(
                    sortedOptions.map(item => ({
                        value: item.value,
                        label: item.label,
                    }))
                )
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取依据表选项失败'
            uiMessage.handleSystemError(errMsg)
        }
    }

    /**
     * 获取字段选项
     */
    const fetchBaseFieldOptions = async () => {
        try {
            const response = await dataManagementService.getBaseFieldOptions()
            if (response.code === 200 && response.data) {
                // 按 sort 字段排序
                const sortedOptions = [...response.data].sort((a, b) => a.sort - b.sort)
                setBaseFieldOptions(
                    sortedOptions.map(item => ({
                        value: item.value,
                        label: item.label,
                    }))
                )
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取字段选项失败'
            uiMessage.handleSystemError(errMsg)
        }
    }

    useEffect(() => {
        void fetchData()
        void fetchBaseTableOptions()
        void fetchBaseFieldOptions()
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
            keyword: filterValues.keyword ? filterValues.keyword.trim() : null,
            condition: filterValues.condition ? filterValues.condition.trim() : null,
            status: filterValues.status !== undefined && filterValues.status !== null 
                ? (filterValues.status === 1 || filterValues.status === '1' ? 1 : 0)
                : null,
        })
    }

    /**
     * 重置筛选条件
     */
    const handleReset = () => {
        filterForm.resetFields()
        setPagination(prev => ({ ...prev, current: 1 }))
        // 重置后重新查询，传入 null 表示清空所有筛选条件
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            keyword: null,
            condition: null,
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

    const handleCopy = (record: IndexGenerationRule) => {
        // 复制记录数据，但不包括id等系统字段
        setEditingRecord(null) // 设置为null，表示是新增操作
        
        // 设置表单值，规则名称添加"_副本"后缀
        form.setFieldsValue({
            name: `${record.name}_副本`,
            code: record.code,
            sourceTable: record.sourceTable,
            sourceFields: record.sourceFields,
            description: record.description,
            status: record.status === 'active', // 转换为boolean
        })
        
        setModalVisible(true)
        message.info('已复制规则，请修改后保存')
    }

    const handleDelete = async (id: string) => {
        try {
            // TODO: 实现删除功能，需要调用后端接口
            message.info('删除功能待实现')
            // 删除成功后刷新列表
            // const currentPageDataCount = data.length
            // const nextPageNum =
            //     currentPageDataCount === 1 && pagination.current > 1
            //         ? pagination.current - 1
            //         : pagination.current
            // setPagination(prev => ({ ...prev, current: nextPageNum }))
            // void fetchData({
            //     pageNum: nextPageNum,
            //     pageSize: pagination.pageSize,
            // })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '删除失败'
            uiMessage.handleSystemError(errMsg)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            
            // 将表单数据转换为 API 需要的格式
            // sourceFields 数组转换为逗号分隔的字符串
            const baseFields = Array.isArray(values.sourceFields) 
                ? values.sourceFields.join(',') 
                : ''
            
            // status 从 boolean 转换为 0/1（0-禁用，1-启用）
            const status = values.status ? 1 : 0

            if (editingRecord) {
                // 编辑
                const updateParams = {
                    id: editingRecord.id,
                    ruleName: values.name,
                    ruleCode: values.code,
                    baseTable: values.sourceTable,
                    baseFields: baseFields,
                    description: values.description || '',
                    status: status,
                    remark: values.remark || '',
                }

                const response = await dataManagementService.updatePrimaryIndexRule(updateParams)
                if (response.code === 200) {
                    message.success('更新成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    // 刷新列表
                    void fetchData()
                } else {
                    uiMessage.handleSystemError(response.msg || '更新失败')
                }
            } else {
                // 新增
                const addParams = {
                    ruleName: values.name,
                    ruleCode: values.code,
                    baseTable: values.sourceTable,
                    baseFields: baseFields,
                    description: values.description || '',
                    status: status,
                    remark: values.remark || '',
                }

                const response = await dataManagementService.addPrimaryIndexRule(addParams)
                if (response.code === 200) {
                    message.success('添加成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    // 刷新列表
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

    /**
     * 根据字段值获取字段标签
     * @param value 字段值
     * @returns 字段标签，如果找不到则返回原值
     */
    const getFieldLabel = (value: string): string => {
        const option = baseFieldOptions.find(opt => opt.value === value)
        return option ? option.label : value
    }

    /**
     * 根据表值获取表标签
     * @param value 表值
     * @returns 表标签，如果找不到则返回原值
     */
    const getTableLabel = (value: string): string => {
        const option = baseTableOptions.find(opt => opt.value === value)
        return option ? option.label : value
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
            render: (text: string) => {
                const label = getTableLabel(text)
                return (
                    <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>
                        {label}
                    </code>
                )
            },
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
                            {getFieldLabel(field)}
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
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>
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
                {/* 筛选表单：自适应布局，左侧筛选区、右侧按钮区 */}
                <div className='filter-bar-wrap'>
                    <Form
                        form={filterForm}
                        layout='inline'
                        className='filter-bar-form'
                    >
                    <Form.Item name='keyword' label='关键字'>
                        <Input
                            placeholder='请输入规则名称、编码等'
                            allowClear
                            style={{ width: 200 }}
                            onPressEnter={handleSearch}
                        />
                    </Form.Item>
                    <Form.Item name='status' label='状态'>
                        <Select
                            placeholder='请选择状态'
                            allowClear
                            style={{ width: 120 }}
                        >
                            <Option value={1}>启用</Option>
                            <Option value={0}>禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button icon={<SearchOutlined />} type='primary' onClick={handleSearch} loading={loading}>
                                查询
                            </Button>
                            <Button onClick={handleReset}>
                                重置
                            </Button>
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
                        rules={[{ required: true, message: '请选择依据表' }]}
                    >
                        <Select
                            placeholder='请选择依据表'
                            showSearch
                            optionFilterProp='label'
                            loading={baseTableOptions.length === 0}
                        >
                            {baseTableOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
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
                            optionFilterProp='label'
                            loading={baseFieldOptions.length === 0}
                        >
                            {baseFieldOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
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
                                {getTableLabel(viewingRecord.sourceTable)}
                            </code>
                        </Descriptions.Item>
                        <Descriptions.Item label='依据字段'>
                            <Space size='small' wrap>
                                {viewingRecord.sourceFields.map((field, index) => (
                                    <Tag key={index} color='blue'>
                                        {getFieldLabel(field)}
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
