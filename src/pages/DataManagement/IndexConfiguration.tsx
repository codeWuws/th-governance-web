import React, { useState, useEffect, useRef } from 'react'
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
import type { TablePaginationConfig } from 'antd'
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
import { dataManagementService } from '../../services/dataManagementService'
import type { UploadProps } from 'antd'
import type { MasterIndexConfigRecord } from '../../types'
import { Upload } from 'antd'
import { isDevVersion, isDemoVersion } from '../../utils/versionControl'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

// 生成方式类型
type GenerationType = 1 | 2 // 1-固定生成，2-随机生成

interface IndexConfiguration {
    id: string
    name: string // 配置名称
    code: string // 规则编码
    generationType: GenerationType // 生成方式：1-固定生成，2-随机生成
    // 固定生成参数
    fixedPrefix?: string // 固定前缀
    fixedLength?: number // 固定长度
    // 随机生成参数
    randomLength?: number // 随机长度
    description?: string // 描述
    status: number // 状态：0-禁用，1-启用
    createTime: string
    updateTime: string
    creator: string
}

const IndexConfiguration: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<MasterIndexConfigRecord[]>([])
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
    const [generationTypeFilter, setGenerationTypeFilter] = useState<number | undefined>(undefined)
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MasterIndexConfigRecord | null>(null)
    const [viewingRecord, setViewingRecord] = useState<MasterIndexConfigRecord | null>(null)
    const [form] = Form.useForm()
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 用于防止重复加载
    const isInitialMount = useRef(true)
    const abortControllerRef = useRef<AbortController | null>(null)

    const debouncedSearchText = useDebounce(searchText, 300)

    const fetchData = async (page = 1, pageSize = 10) => {
        // 取消之前未完成的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController()

        setLoading(true)
        try {
            const response = await dataManagementService.getMasterIndexConfigPage({
                condition: debouncedSearchText,
                pageNum: page,
                pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
                configName: debouncedSearchText,
                ruleCode: debouncedSearchText,
                generateType: generationTypeFilter,
                status: statusFilter,
            })

            if (response.code === 200 && response.data) {
                setData(response.data.records)
                setPagination({
                    current: Number(response.data.current),
                    pageSize: Number(response.data.size),
                    total: Number(response.data.total),
                })
            } else {
                message.error(response.msg || '获取主索引配置失败')
            }
        } catch (error: any) {
            // 忽略被取消的请求错误
            if (error?.name !== 'CanceledError' && error?.message !== 'canceled') {
                message.error('获取主索引配置失败')
                console.error('获取主索引配置失败:', error)
            }
        } finally {
            setLoading(false)
            abortControllerRef.current = null
        }
    }

    // 初始化加载数据
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            fetchData(pagination.current, pagination.pageSize)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 监听搜索和筛选条件变化
    useEffect(() => {
        if (!isInitialMount.current) {
            fetchData(1, pagination.pageSize)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchText, statusFilter, generationTypeFilter])

    const handleSearch = (value: string) => {
        setSearchText(value)
        setPagination({ ...pagination, current: 1 })
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
            generationType: 1,
        })
        setModalVisible(true)
    }

    const handleEdit = (record: MasterIndexConfigRecord) => {
        setEditingRecord(record)
        // 根据生成方式，将length映射到不同的表单字段
        const formValues: Record<string, any> = {
            configName: record.configName,
            ruleCode: record.ruleCode,
            generationType: record.generateType,
            description: record.description,
            status: record.status === 1,
            remark: record.remark,
        }
        
        // 根据生成方式设置对应的长度字段
        if (record.generateType === 1) {
            // 固定生成
            formValues.prefix = record.prefix
            formValues.fixedLength = record.length
        } else {
            // 随机生成
            formValues.randomLength = record.length
        }
        
        form.setFieldsValue(formValues)
        setModalVisible(true)
    }

    const handleView = (record: MasterIndexConfigRecord) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await dataManagementService.deleteMasterIndexConfig(id)
            if (response.code === 200) {
                message.success('删除成功')
                fetchData(pagination.current, pagination.pageSize)
            } else {
                message.error(response.msg || '删除失败')
            }
        } catch (error) {
            message.error('删除失败')
            console.error('删除失败:', error)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            
            // 计算长度和前缀
            const generateType = values.generationType
            const prefix = generateType === 1 ? values.prefix : undefined
            const length = generateType === 1 ? values.fixedLength : values.randomLength
            
            // 生成配置信息
            let configInfo = ''
            if (generateType === 1 && prefix) {
                configInfo = `以${prefix}为起始，长度为${length}位`
            } else if (generateType === 2) {
                configInfo = `随机生成${length}位主索引`
            } else {
                configInfo = `长度为${length}位`
            }
            
            const formData = {
                configName: values.configName,
                ruleCode: values.ruleCode,
                generateType,
                prefix,
                length,
                configInfo,
                description: values.description,
                status: values.status ? 1 : 0,
                remark: values.remark,
            }

            if (editingRecord) {
                // 编辑
                const response = await dataManagementService.updateMasterIndexConfig({
                    id: editingRecord.id,
                    ...formData,
                })
                if (response.code === 200) {
                    message.success('更新成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    fetchData(pagination.current, pagination.pageSize)
                } else {
                    message.error(response.msg || '更新失败')
                }
            } else {
                // 新增
                const response = await dataManagementService.addMasterIndexConfig(formData)
                if (response.code === 200) {
                    message.success('添加成功')
                    setModalVisible(false)
                    form.resetFields()
                    fetchData(1, pagination.pageSize)
                } else {
                    message.error(response.msg || '添加失败')
                }
            }
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
                { title: '配置名称', dataIndex: 'configName', key: 'configName' },
                { title: '规则编码', dataIndex: 'ruleCode', key: 'ruleCode' },
                { title: '生成方式', dataIndex: 'generateType', key: 'generateType' },
                { title: '固定前缀', dataIndex: 'prefix', key: 'prefix' },
                { title: '长度', dataIndex: 'length', key: 'length' },
                { title: '配置信息', dataIndex: 'configInfo', key: 'configInfo' },
                { title: '描述', dataIndex: 'description', key: 'description' },
                { title: '状态', dataIndex: 'status', key: 'status' },
                { title: '创建人', dataIndex: 'createBy', key: 'createBy' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
                { title: '更新人', dataIndex: 'updateBy', key: 'updateBy' },
                { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
            ]

            // 准备导出数据，转换状态和生成方式
            const exportData = data.map(item => ({
                ...item,
                status: getStatusText(item.status),
                generateType: getGenerationTypeText(item.generateType),
                prefix: item.prefix || '-',
                length: `${item.length}位`,
                updateBy: item.updateBy || '-',
                remark: item.remark || '-',
            }))

            exportToExcel(exportData, exportColumns, '主索引配置')
        } catch (error) {
            console.error('导出失败:', error)
            message.error('导出失败')
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<MasterIndexConfigRecord>>(file, {
                columnMapping: {
                    '配置名称': 'configName',
                    '规则编码': 'ruleCode',
                    '生成方式': 'generateType',
                    '固定前缀': 'prefix',
                    '长度': 'length',
                    '描述': 'description',
                    '状态': 'status',
                    '备注': 'remark',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.configName || !row.ruleCode || !row.generateType) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    // 转换生成方式
                    let generateType: GenerationType = 1
                    if (row.generateType) {
                        const typeStr = String(row.generateType).trim()
                        if (typeStr === '固定生成' || typeStr === '1' || typeStr === 'fixed' || typeStr === 'FIXED') {
                            generateType = 1
                        } else if (
                            typeStr === '随机生成' ||
                            typeStr === '2' ||
                            typeStr === 'random' ||
                            typeStr === 'RANDOM'
                        ) {
                            generateType = 2
                        }
                    }

                    // 转换数据格式
                    const transformed: Partial<MasterIndexConfigRecord> = {
                        configName: String(row.configName || '').trim(),
                        ruleCode: String(row.ruleCode || '').trim(),
                        generateType,
                        description: String(row.description || '').trim(),
                        remark: String(row.remark || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === '1'
                                ? 1
                                : 0,
                    }

                    // 设置前缀和长度
                    if (generateType === 1) {
                        transformed.prefix = String(row.prefix || '').trim() || null
                    } else {
                        transformed.prefix = null
                    }
                    const length = Number(row.length)
                    transformed.length = isNaN(length) ? 0 : length

                    return transformed as MasterIndexConfigRecord
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 批量添加数据
            let successCount = 0
            for (const item of importedData) {
                try {
                    await dataManagementService.addMasterIndexConfig({
                        configName: item.configName || '',
                        ruleCode: item.ruleCode || '',
                        generateType: item.generateType || 1,
                        prefix: item.prefix || undefined,
                        length: item.length || 0,
                        description: item.description || undefined,
                        status: item.status || 1,
                        remark: item.remark || undefined,
                    })
                    successCount++
                } catch (error) {
                    console.error('导入单条数据失败:', error)
                }
            }

            if (successCount > 0) {
                message.success(`成功导入 ${successCount} 条数据`)
                fetchData(1, pagination.pageSize)
            } else {
                message.error('导入失败')
            }
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
            { title: '配置名称', dataIndex: 'configName' },
            { title: '规则编码', dataIndex: 'ruleCode' },
            { title: '生成方式', dataIndex: 'generateType' },
            { title: '固定前缀', dataIndex: 'prefix' },
            { title: '长度', dataIndex: 'length' },
            { title: '描述', dataIndex: 'description' },
            { title: '状态', dataIndex: 'status' },
            { title: '备注', dataIndex: 'remark' },
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

    const getStatusColor = (status: number) => {
        return status === 1 ? 'green' : 'red'
    }

    const getStatusText = (status: number) => {
        return status === 1 ? '启用' : '禁用'
    }

    const getGenerationTypeText = (type: number) => {
        return type === 1 ? '固定生成' : '随机生成'
    }

    const getGenerationTypeColor = (type: number) => {
        return type === 1 ? 'blue' : 'purple'
    }

    const formatConfigurationInfo = (record: MasterIndexConfigRecord) => {
        if (record.generateType === 1) {
            return record.prefix ? `以${record.prefix}为起始，长度为${record.length}位` : `长度为${record.length}位`
        } else {
            return `随机生成${record.length}位主索引`
        }
    }

    const handleTableChange = (newPagination: TablePaginationConfig) => {
        const current = newPagination.current || 1
        const pageSize = newPagination.pageSize || 10
        setPagination({
            current,
            pageSize,
            total: pagination.total,
        })
        fetchData(current, pageSize)
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
            dataIndex: 'generateType',
            key: 'generateType',
            width: 120,
            render: (type: number) => (
                <Tag color={getGenerationTypeColor(type)}>{getGenerationTypeText(type)}</Tag>
            ),
        },
        {
            title: '固定前缀',
            dataIndex: 'prefix',
            key: 'prefix',
            width: 100,
            render: (text: string | null) => (
                <span>{text || '-'}</span>
            ),
        },
        {
            title: '长度',
            dataIndex: 'length',
            key: 'length',
            width: 80,
            render: (length: number) => (
                <span>{length}位</span>
            ),
        },
        {
            title: '配置信息',
            key: 'configInfo',
            width: 250,
            render: (_: unknown, record: MasterIndexConfigRecord) => (
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
            render: (status: number) => (
                <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            ),
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
            render: (_: unknown, record: MasterIndexConfigRecord) => (
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
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagination.current, pagination.pageSize)} loading={loading}>
                        刷新
                    </Button>
                    {/* <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button> */}
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增配置
                    </Button>
                </Space>
            </div>
            <Alert
                message='主索引配置'
                description={
                    <>
                        <div>维护主索引的生成配置规则，支持固定生成和随机生成两种方式。固定生成：以指定前缀为起始，指定长度；随机生成：指定长度（大于10位，20位以内）。</div>
                        {isDemoVersion() && (
                            <div style={{ marginTop: 8, color: '#faad14' }}>
                                <strong>当前为演示版本</strong>，使用模拟数据展示
                            </div>
                        )}
                        {isDevVersion() && (
                            <div style={{ marginTop: 8, color: '#52c41a' }}>
                                <strong>当前为开发版本</strong>，使用真实接口数据
                            </div>
                        )}
                    </>
                }
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
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        placeholder='生成方式'
                        style={{ width: 120 }}
                        allowClear
                        value={generationTypeFilter}
                        onChange={(value) => {
                            setGenerationTypeFilter(value)
                            setPagination({ ...pagination, current: 1 })
                        }}
                    >
                        <Option value={1}>固定生成</Option>
                        <Option value={2}>随机生成</Option>
                    </Select>
                    <Select
                        placeholder='状态'
                        style={{ width: 120 }}
                        allowClear
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value)
                            setPagination({ ...pagination, current: 1 })
                        }}
                    >
                        <Option value={1}>启用</Option>
                        <Option value={0}>禁用</Option>
                    </Select>
                </Space>
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey='id'
                    scroll={{ x: 1200 }}
                    onChange={handleTableChange}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
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
                        generationType: 1,
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
                            <Radio value={1}>固定生成</Radio>
                            <Radio value={2}>随机生成</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {/* 固定生成相关字段 */}
                    {generationType === 1 && (
                        <>
                            <Form.Item
                                name='prefix'
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
                    {generationType === 2 && (
                        <Form.Item
                            name='randomLength'
                            label='长度'
                            rules={[
                                { required: true, message: '请输入长度' },
                                {
                                    type: 'number',
                                    min: 10,
                                    max: 18,
                                    message: '长度必须大于10位，18位以内',
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder='请输入长度（10-18位）'
                                style={{ width: '100%' }}
                                min={10}
                                max={18}
                            />
                        </Form.Item>
                    )}

                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='remark' label='备注'>
                        <TextArea rows={2} placeholder='请输入备注' maxLength={200} showCount />
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
                            <Tag color={getGenerationTypeColor(viewingRecord.generateType)}>
                                {getGenerationTypeText(viewingRecord.generateType)}
                            </Tag>
                        </Descriptions.Item>
                        {viewingRecord.generateType === 1 && viewingRecord.prefix && (
                            <Descriptions.Item label='固定前缀'>
                                <code
                                    style={{
                                        background: '#e6f7ff',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    {viewingRecord.prefix}
                                </code>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label='长度'>{viewingRecord.length}位</Descriptions.Item>
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
                        <Descriptions.Item label='创建人'>{viewingRecord.createBy}</Descriptions.Item>
                        <Descriptions.Item label='创建时间'>{viewingRecord.createTime}</Descriptions.Item>
                        <Descriptions.Item label='更新人'>{viewingRecord.updateBy || '-'}</Descriptions.Item>
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

