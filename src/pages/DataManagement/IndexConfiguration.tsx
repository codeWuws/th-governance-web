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
    Radio,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    ImportOutlined,
    ExportOutlined,
    DownloadOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import { exportToExcel, importFromExcel, downloadExcelTemplate } from '../../utils/excel'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

// 生成方式类型
type GenerationType = 'fixed' | 'random'

interface IndexConfiguration {
    id: string
    name: string // 配置名称
    code: string // 规则编码
    generationType: GenerationType // 生成方式：固定生成 | 随机生成
    // 固定生成参数
    fixedPrefix?: string // 固定前缀
    fixedLength?: number // 固定长度
    // 随机生成参数
    randomLength?: number // 随机长度
    description?: string // 描述
    status: 'active' | 'inactive' // 状态
    createTime: string
    updateTime: string
    creator: string
}

const mockConfigurations: IndexConfiguration[] = [
    {
        id: '1',
        name: '患者主索引固定生成配置',
        code: 'PATIENT_EMPI_FIXED',
        generationType: 'fixed',
        fixedPrefix: 'EMPI',
        fixedLength: 18,
        description: '以EMPI为起始，长度为18位的主索引生成规则',
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '数据管理员',
    },
    {
        id: '2',
        name: '患者主索引随机生成配置',
        code: 'PATIENT_EMPI_RANDOM',
        generationType: 'random',
        randomLength: 18,
        description: '随机生成长度为18位的主索引',
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '数据管理员',
    },
    {
        id: '3',
        name: '患者主索引固定生成配置-长格式',
        code: 'PATIENT_EMPI_FIXED_LONG',
        generationType: 'fixed',
        fixedPrefix: 'EMPI',
        fixedLength: 20,
        description: '以EMPI为起始，长度为20位的主索引生成规则',
        status: 'active',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-22 09:30:00',
        creator: '系统管理员',
    },
    {
        id: '4',
        name: '患者主索引随机生成配置-短格式',
        code: 'PATIENT_EMPI_RANDOM_SHORT',
        generationType: 'random',
        randomLength: 15,
        description: '随机生成长度为15位的主索引',
        status: 'inactive',
        createTime: '2024-01-13 14:20:00',
        updateTime: '2024-01-18 10:15:00',
        creator: '数据管理员',
    },
]

const IndexConfiguration: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<IndexConfiguration[]>([])
    const [filteredData, setFilteredData] = useState<IndexConfiguration[]>([])
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [generationTypeFilter, setGenerationTypeFilter] = useState<string>('')
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<IndexConfiguration | null>(null)
    const [viewingRecord, setViewingRecord] = useState<IndexConfiguration | null>(null)
    const [form] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockConfigurations)
        } catch {
            message.error('获取主索引配置失败')
        } finally {
            setLoading(false)
        }
    }

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
                    (item.description &&
                        item.description.toLowerCase().includes(debouncedSearchText.toLowerCase()))
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (generationTypeFilter) {
            filtered = filtered.filter(item => item.generationType === generationTypeFilter)
        }

        setFilteredData(filtered)
    }, [data, debouncedSearchText, statusFilter, generationTypeFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
            generationType: 'fixed',
        })
        setModalVisible(true)
    }

    const handleEdit = (record: IndexConfiguration) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active',
        })
        setModalVisible(true)
    }

    const handleView = (record: IndexConfiguration) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            const newData = data.filter(item => item.id !== id)
            setData(newData)
            message.success('删除成功')
        } catch {
            message.error('删除失败')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
            }

            if (editingRecord) {
                // 编辑
                const updatedData = data.map(item =>
                    item.id === editingRecord.id
                        ? { ...item, ...formData, updateTime: new Date().toLocaleString('zh-CN') }
                        : item
                )
                setData(updatedData)
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: IndexConfiguration = {
                    ...formData,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString('zh-CN'),
                    updateTime: new Date().toLocaleString('zh-CN'),
                    creator: '当前用户',
                }
                setData([...data, newRecord])
                message.success('添加成功')
            }

            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    // Excel导出功能
    const handleExport = () => {
        try {
            const exportColumns = [
                { title: '配置名称', dataIndex: 'name', key: 'name' },
                { title: '规则编码', dataIndex: 'code', key: 'code' },
                {
                    title: '生成方式',
                    dataIndex: 'generationType',
                    key: 'generationType',
                },
                {
                    title: '固定前缀',
                    dataIndex: 'fixedPrefix',
                    key: 'fixedPrefix',
                },
                {
                    title: '固定长度',
                    dataIndex: 'fixedLength',
                    key: 'fixedLength',
                },
                {
                    title: '随机长度',
                    dataIndex: 'randomLength',
                    key: 'randomLength',
                },
                { title: '描述', dataIndex: 'description', key: 'description' },
                {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                },
                { title: '创建人', dataIndex: 'creator', key: 'creator' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
                { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
            ]

            // 准备导出数据，转换状态和生成方式
            const exportData = filteredData.map(item => ({
                ...item,
                status: getStatusText(item.status),
                generationType: getGenerationTypeText(item.generationType),
            }))

            exportToExcel(exportData, exportColumns, '主索引配置')
        } catch (error) {
            console.error('导出失败:', error)
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<IndexConfiguration>>(file, {
                columnMapping: {
                    '配置名称': 'name',
                    '规则编码': 'code',
                    '生成方式': 'generationType',
                    '固定前缀': 'fixedPrefix',
                    '固定长度': 'fixedLength',
                    '随机长度': 'randomLength',
                    '描述': 'description',
                    '状态': 'status',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.name || !row.code || !row.generationType) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    // 转换生成方式
                    let generationType: GenerationType = 'fixed'
                    if (row.generationType) {
                        const typeStr = String(row.generationType).trim()
                        if (typeStr === '固定生成' || typeStr === 'fixed' || typeStr === 'FIXED') {
                            generationType = 'fixed'
                        } else if (
                            typeStr === '随机生成' ||
                            typeStr === 'random' ||
                            typeStr === 'RANDOM'
                        ) {
                            generationType = 'random'
                        }
                    }

                    // 转换数据格式
                    const transformed: Partial<IndexConfiguration> = {
                        name: String(row.name || '').trim(),
                        code: String(row.code || '').trim(),
                        generationType,
                        description: String(row.description || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === 'active' ||
                            String(row.status || '').trim() === 'ACTIVE'
                                ? 'active'
                                : 'inactive',
                    }

                    // 根据生成方式设置对应字段
                    if (generationType === 'fixed') {
                        transformed.fixedPrefix = String(row.fixedPrefix || '').trim()
                        const fixedLength = Number(row.fixedLength)
                        transformed.fixedLength = isNaN(fixedLength) ? undefined : fixedLength
                    } else {
                        const randomLength = Number(row.randomLength)
                        transformed.randomLength = isNaN(randomLength) ? undefined : randomLength
                    }

                    return transformed as IndexConfiguration
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 添加到数据列表
            const newData = importedData.map(item => ({
                ...item,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                createTime: new Date().toLocaleString('zh-CN'),
                updateTime: new Date().toLocaleString('zh-CN'),
                creator: '当前用户',
            }))

            setData([...data, ...newData])
            message.success(`成功导入 ${importedData.length} 条数据`)
            return false // 阻止自动上传
        } catch (error) {
            console.error('导入失败:', error)
            message.error('导入失败，请检查文件格式')
            return false
        }
    }

    // 下载导入模板
    const handleDownloadTemplate = () => {
        const templateColumns = [
            { title: '配置名称', dataIndex: 'name' },
            { title: '规则编码', dataIndex: 'code' },
            { title: '生成方式', dataIndex: 'generationType' },
            { title: '固定前缀', dataIndex: 'fixedPrefix' },
            { title: '固定长度', dataIndex: 'fixedLength' },
            { title: '随机长度', dataIndex: 'randomLength' },
            { title: '描述', dataIndex: 'description' },
            { title: '状态', dataIndex: 'status' },
        ]
        downloadExcelTemplate(templateColumns, '主索引配置')
    }

    // 上传配置
    const uploadProps: UploadProps = {
        name: 'file',
        accept: '.xlsx,.xls',
        showUploadList: false,
        beforeUpload: (file) => {
            const isExcel =
                file.type ===
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel' ||
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls')
            if (!isExcel) {
                message.error('只支持 Excel 格式的文件！')
                return false
            }
            const isLt5M = file.size / 1024 / 1024 < 5
            if (!isLt5M) {
                message.error('文件大小不能超过 5MB！')
                return false
            }
            handleImport(file)
            return false // 阻止自动上传
        },
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

    const getGenerationTypeText = (type: GenerationType) => {
        switch (type) {
            case 'fixed':
                return '固定生成'
            case 'random':
                return '随机生成'
            default:
                return type
        }
    }

    const getGenerationTypeColor = (type: GenerationType) => {
        switch (type) {
            case 'fixed':
                return 'blue'
            case 'random':
                return 'purple'
            default:
                return 'default'
        }
    }

    const formatConfigurationInfo = (record: IndexConfiguration) => {
        if (record.generationType === 'fixed') {
            return `以${record.fixedPrefix}为起始，长度为${record.fixedLength}位`
        } else {
            return `长度为${record.randomLength}位`
        }
    }

    const columns = [
        {
            title: '配置名称',
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
            title: '规则编码',
            dataIndex: 'code',
            key: 'code',
            width: 200,
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
            title: '生成方式',
            dataIndex: 'generationType',
            key: 'generationType',
            width: 120,
            render: (type: GenerationType) => (
                <Tag color={getGenerationTypeColor(type)}>{getGenerationTypeText(type)}</Tag>
            ),
        },
        {
            title: '配置信息',
            key: 'configInfo',
            width: 250,
            render: (_: unknown, record: IndexConfiguration) => (
                <Tooltip title={formatConfigurationInfo(record)}>
                    <span>{formatConfigurationInfo(record)}</span>
                </Tooltip>
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
                    <span>{text || '-'}</span>
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

    // 监听生成方式变化，动态显示/隐藏相关字段
    const generationType = Form.useWatch('generationType', form)

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
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增配置
                    </Button>
                </Space>
            </div>
            <Alert
                message='主索引配置'
                description='维护主索引的生成配置规则，支持固定生成和随机生成两种方式。固定生成：以指定前缀为起始，指定长度；随机生成：指定长度（大于10位，20位以内）。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Search
                        placeholder='搜索配置名称、规则编码或描述'
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder='生成方式'
                        style={{ width: 120 }}
                        allowClear
                        value={generationTypeFilter}
                        onChange={setGenerationTypeFilter}
                    >
                        <Option value='fixed'>固定生成</Option>
                        <Option value='random'>随机生成</Option>
                    </Select>
                    <Select
                        placeholder='状态'
                        style={{ width: 120 }}
                        allowClear
                        value={statusFilter}
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
                    scroll={{ x: 1200 }}
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
                        status: true,
                        generationType: 'fixed',
                    }}
                >
                    <Form.Item
                        name='name'
                        label='配置名称'
                        rules={[{ required: true, message: '请输入配置名称' }]}
                    >
                        <Input placeholder='请输入配置名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='规则编码'
                        rules={[
                            { required: true, message: '请输入规则编码' },
                            {
                                pattern: /^[A-Z_]+$/,
                                message: '规则编码只能包含大写英文字母和下划线',
                            },
                        ]}
                    >
                        <Input placeholder='请输入规则编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        name='generationType'
                        label='生成方式'
                        rules={[{ required: true, message: '请选择生成方式' }]}
                    >
                        <Radio.Group>
                            <Radio value='fixed'>固定生成</Radio>
                            <Radio value='random'>随机生成</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {/* 固定生成相关字段 */}
                    {generationType === 'fixed' && (
                        <>
                            <Form.Item
                                name='fixedPrefix'
                                label='固定前缀'
                                rules={[{ required: true, message: '请输入固定前缀' }]}
                            >
                                <Input placeholder='请输入固定前缀，如：EMPI、MPI等' />
                            </Form.Item>
                            <Form.Item
                                name='fixedLength'
                                label='长度'
                                rules={[
                                    { required: true, message: '请输入长度' },
                                    { type: 'number', min: 1, message: '长度必须大于0' },
                                ]}
                            >
                                <InputNumber
                                    placeholder='请输入长度'
                                    style={{ width: '100%' }}
                                    min={1}
                                />
                            </Form.Item>
                        </>
                    )}

                    {/* 随机生成相关字段 */}
                    {generationType === 'random' && (
                        <Form.Item
                            name='randomLength'
                            label='长度'
                            rules={[
                                { required: true, message: '请输入长度' },
                                {
                                    type: 'number',
                                    min: 11,
                                    max: 20,
                                    message: '长度必须大于10位，20位以内',
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder='请输入长度（大于10位，20位以内）'
                                style={{ width: '100%' }}
                                min={11}
                                max={20}
                            />
                        </Form.Item>
                    )}

                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
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
                            <strong>{viewingRecord.name}</strong>
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
                        <Descriptions.Item label='生成方式'>
                            <Tag color={getGenerationTypeColor(viewingRecord.generationType)}>
                                {getGenerationTypeText(viewingRecord.generationType)}
                            </Tag>
                        </Descriptions.Item>
                        {viewingRecord.generationType === 'fixed' && (
                            <>
                                <Descriptions.Item label='固定前缀'>
                                    <code
                                        style={{
                                            background: '#e6f7ff',
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {viewingRecord.fixedPrefix}
                                    </code>
                                </Descriptions.Item>
                                <Descriptions.Item label='长度'>{viewingRecord.fixedLength}位</Descriptions.Item>
                            </>
                        )}
                        {viewingRecord.generationType === 'random' && (
                            <Descriptions.Item label='长度'>{viewingRecord.randomLength}位</Descriptions.Item>
                        )}
                        <Descriptions.Item label='配置信息'>
                            {formatConfigurationInfo(viewingRecord)}
                        </Descriptions.Item>
                        <Descriptions.Item label='描述'>
                            {viewingRecord.description || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Tag color={getStatusColor(viewingRecord.status)}>
                                {getStatusText(viewingRecord.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='创建人'>{viewingRecord.creator}</Descriptions.Item>
                        <Descriptions.Item label='创建时间'>{viewingRecord.createTime}</Descriptions.Item>
                        <Descriptions.Item label='更新时间'>{viewingRecord.updateTime}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    )
}

export default IndexConfiguration

