import React, { useState, useEffect, useCallback } from 'react'
import {
    Table,
    Button,
    Space,
    Card,
    Input,
    Tag,
    message,
    Modal,
    Form,
    Alert,
    Typography,
    Popconfirm,
    Row,
    Col,
    Spin,
    Select,
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
import { dataManagementService } from '@/services/dataManagementService'
import type { StandardDictionaryMappingRecord } from '@/types'
import LoadMoreSelect, { type LoadMoreSelectOption } from '@/components/LoadMoreSelect'

const { TextArea } = Input
const { Option } = Select

// 标准集类型
type StandardSetType = 'category' | 'business' | 'medical' | 'state'

// 标准集选项
const STANDARD_SET_OPTIONS = [
    { value: 'category', label: '类别' },
    { value: 'business', label: '业务' },
    { value: 'medical', label: '医疗' },
    { value: 'state', label: '状态' },
] as const

// 页面使用的数据接口（映射后端数据）
interface StandardDictionaryMapping {
    id: string
    standardName: string // 标准名称
    standardDatasetName: string // 标准数据集名称
    standardDatasetContent: string // 标准数据集内容
    originalTableName: string // 原始表名称
    originalDataField: string // 原始数据字段
    originalDataset: string // 原始数据集
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
}

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StandardDictionaryMapping[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [viewingRecord, setViewingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [viewingRecordDetail, setViewingRecordDetail] = useState<StandardDictionaryMappingRecord | null>(null)
    const [form] = Form.useForm()
    // 筛选条件状态（用于输入，不会自动触发搜索）
    const [dictName, setDictName] = useState('')
    const [dataSetName, setDataSetName] = useState('')
    
    // 实际查询参数（点击搜索按钮时更新）
    const [queryParams, setQueryParams] = useState<{
        dictName?: string
        dataSetName?: string
    }>({})
    
    // 分页相关状态
    const [current, setCurrent] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)

    // 表单选项数据状态
    const [standardSetType, setStandardSetType] = useState<StandardSetType | undefined>(undefined)
    
    // 标准数据集内容选项（支持loadMore）
    const [standardDatasetContentOptions, setStandardDatasetContentOptions] = useState<LoadMoreSelectOption[]>([])
    const [standardDatasetContentLoading, setStandardDatasetContentLoading] = useState(false)
    const [standardDatasetContentHasMore, setStandardDatasetContentHasMore] = useState(false)
    const [standardDatasetContentPage, setStandardDatasetContentPage] = useState(1)
    const [standardDatasetContentSearch, setStandardDatasetContentSearch] = useState('')
    
    // 原始表选项（支持loadMore）
    const [originalTableOptions, setOriginalTableOptions] = useState<LoadMoreSelectOption[]>([])
    const [originalTableLoading, setOriginalTableLoading] = useState(false)
    const [originalTableHasMore, setOriginalTableHasMore] = useState(false)
    const [originalTablePage, setOriginalTablePage] = useState(1)
    const [originalTableSearch, setOriginalTableSearch] = useState('')
    
    // 原始数据字段选项（支持loadMore）
    const [originalFieldOptions, setOriginalFieldOptions] = useState<LoadMoreSelectOption[]>([])
    const [originalFieldLoading, setOriginalFieldLoading] = useState(false)
    const [originalFieldHasMore, setOriginalFieldHasMore] = useState(false)
    const [originalFieldPage, setOriginalFieldPage] = useState(1)
    const [originalFieldSearch, setOriginalFieldSearch] = useState('')
    const [selectedOriginalTable, setSelectedOriginalTable] = useState<string | undefined>(undefined)

    /**
     * 获取数据列表
     */
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params: {
                pageNum: number
                pageSize: number
                dictName?: string
                dataSetName?: string
            } = {
                pageNum: current,
                pageSize: pageSize,
            }

            // 使用实际查询参数
            if (queryParams.dictName?.trim()) {
                params.dictName = queryParams.dictName.trim()
            }
            if (queryParams.dataSetName?.trim()) {
                params.dataSetName = queryParams.dataSetName.trim()
            }

            const response = await dataManagementService.getStandardDictionaryMappingPage(params)

            if (response.code === 200) {
                // 映射数据格式
                const mappedData = response.data.records.map(mapRecordToPageFormat)
                setData(mappedData)
                setTotal(Number(response.data.total))
            } else {
                message.error(response.msg || '获取标准字典对照失败')
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '获取标准字典对照失败')
        } finally {
            setLoading(false)
        }
    }, [current, pageSize, queryParams])

    // 初始化时获取数据
    useEffect(() => {
        fetchData()
    }, [fetchData])

    /**
     * 将后端返回的数据映射为页面使用的格式
     */
    const mapRecordToPageFormat = (record: StandardDictionaryMappingRecord): StandardDictionaryMapping => {
        return {
            id: record.id,
            standardName: record.standardDictName,
            standardDatasetName: record.standardDataSetName,
            standardDatasetContent: record.standardDataSetContent,
            originalTableName: record.originalTableName,
            originalDataField: record.originalDataField,
            originalDataset: record.originalFieldDataSet,
            status: record.delFlag === 0 ? 'active' : 'inactive',
            createTime: record.createTime,
            updateTime: record.updateTime,
            creator: record.createBy || '未知',
        }
    }


    /**
     * 处理查询（点击搜索按钮时触发）
     */
    const handleSearch = () => {
        // 更新实际查询参数
        setQueryParams({
            dictName: dictName || undefined,
            dataSetName: dataSetName || undefined,
        })
        setCurrent(1) // 重置到第一页
    }

    /**
     * 处理重置
     */
    const handleReset = () => {
        setDictName('')
        setDataSetName('')
        setQueryParams({})
        setCurrent(1)
        // 重置后立即刷新数据（通过设置 current 触发 useEffect）
    }

    /**
     * 加载标准数据集内容选项
     */
    const loadStandardDatasetContentOptions = async (type: StandardSetType, page = 1, search = '', append = false) => {
        setStandardDatasetContentLoading(true)
        try {
            // TODO: 根据标准集类型调用对应的接口获取标准数据集内容列表
            // 这里先使用模拟数据
            await new Promise(resolve => setTimeout(resolve, 300))
            const mockOptions: LoadMoreSelectOption[] = [
                { value: '男', label: '男', code: 'MALE' },
                { value: '女', label: '女', code: 'FEMALE' },
                { value: '未知', label: '未知', code: 'UNKNOWN' },
                { value: '其他', label: '其他', code: 'OTHER' },
            ]
            
            if (append) {
                setStandardDatasetContentOptions(prev => [...prev, ...mockOptions])
            } else {
                setStandardDatasetContentOptions(mockOptions)
            }
            setStandardDatasetContentHasMore(page < 3) // 模拟还有更多数据
            setStandardDatasetContentPage(page)
        } catch (error) {
            message.error('加载标准数据集内容失败')
        } finally {
            setStandardDatasetContentLoading(false)
        }
    }

    /**
     * 加载更多标准数据集内容
     */
    const handleLoadMoreStandardDatasetContent = async () => {
        if (standardSetType) {
            await loadStandardDatasetContentOptions(standardSetType, standardDatasetContentPage + 1, standardDatasetContentSearch, true)
        }
    }

    /**
     * 搜索标准数据集内容
     */
    const handleSearchStandardDatasetContent = async (value: string) => {
        setStandardDatasetContentSearch(value)
        setStandardDatasetContentPage(1)
        if (standardSetType) {
            await loadStandardDatasetContentOptions(standardSetType, 1, value, false)
        }
    }

    /**
     * 加载原始表选项
     */
    const loadOriginalTableOptions = async (page = 1, search = '', append = false) => {
        setOriginalTableLoading(true)
        try {
            // TODO: 调用接口获取原始表列表
            await new Promise(resolve => setTimeout(resolve, 300))
            const mockOptions: LoadMoreSelectOption[] = [
                { value: '门诊患者基本信息', label: '门诊患者基本信息' },
                { value: '住院患者基本信息', label: '住院患者基本信息' },
                { value: '检验报告', label: '检验报告' },
                { value: '检查报告', label: '检查报告' },
            ]
            
            if (append) {
                setOriginalTableOptions(prev => [...prev, ...mockOptions])
            } else {
                setOriginalTableOptions(mockOptions)
            }
            setOriginalTableHasMore(page < 3) // 模拟还有更多数据
            setOriginalTablePage(page)
        } catch (error) {
            message.error('加载原始表列表失败')
        } finally {
            setOriginalTableLoading(false)
        }
    }

    /**
     * 加载更多原始表
     */
    const handleLoadMoreOriginalTable = async () => {
        await loadOriginalTableOptions(originalTablePage + 1, originalTableSearch, true)
    }

    /**
     * 搜索原始表
     */
    const handleSearchOriginalTable = async (value: string) => {
        setOriginalTableSearch(value)
        setOriginalTablePage(1)
        await loadOriginalTableOptions(1, value, false)
    }

    /**
     * 加载原始数据字段选项
     */
    const loadOriginalFieldOptions = async (tableName: string, page = 1, search = '', append = false) => {
        if (!tableName) return
        
        setOriginalFieldLoading(true)
        try {
            // TODO: 根据表名调用接口获取字段列表
            await new Promise(resolve => setTimeout(resolve, 300))
            const mockOptions: LoadMoreSelectOption[] = [
                { value: 'sex', label: 'sex' },
                { value: 'age', label: 'age' },
                { value: 'name', label: 'name' },
                { value: 'id', label: 'id' },
            ]
            
            if (append) {
                setOriginalFieldOptions(prev => [...prev, ...mockOptions])
            } else {
                setOriginalFieldOptions(mockOptions)
            }
            setOriginalFieldHasMore(page < 3) // 模拟还有更多数据
            setOriginalFieldPage(page)
        } catch (error) {
            message.error('加载原始数据字段失败')
        } finally {
            setOriginalFieldLoading(false)
        }
    }

    /**
     * 加载更多原始数据字段
     */
    const handleLoadMoreOriginalField = async () => {
        if (selectedOriginalTable) {
            await loadOriginalFieldOptions(selectedOriginalTable, originalFieldPage + 1, originalFieldSearch, true)
        }
    }

    /**
     * 搜索原始数据字段
     */
    const handleSearchOriginalField = async (value: string) => {
        setOriginalFieldSearch(value)
        setOriginalFieldPage(1)
        if (selectedOriginalTable) {
            await loadOriginalFieldOptions(selectedOriginalTable, 1, value, false)
        }
    }

    const handleAdd = () => {
        setEditingRecord(null)
        setStandardSetType(undefined)
        form.resetFields()
        // 重置选项数据
        setStandardDatasetContentOptions([])
        setOriginalTableOptions([])
        setOriginalFieldOptions([])
        setSelectedOriginalTable(undefined)
        // 加载原始表选项
        loadOriginalTableOptions()
        setModalVisible(true)
    }

    /**
     * 处理编辑
     */
    const handleEdit = async (record: StandardDictionaryMapping) => {
        setEditingRecord(record)
        setModalVisible(true)
        
        // 加载选项数据
        loadOriginalTableOptions()
        
        // 获取详情数据以获取完整信息
        try {
            const response = await dataManagementService.getStandardDictionaryMappingDetail(record.id)
            if (response.code === 200) {
                const detail = response.data
                // 根据标准名称推断标准集类型（这里需要根据实际业务逻辑调整）
                // TODO: 从详情数据中获取标准集类型，或者通过标准名称匹配
                const inferredType: StandardSetType = 'category' // 默认值，需要根据实际情况调整
                setStandardSetType(inferredType)
                
                // 加载对应的标准数据集内容选项
                await loadStandardDatasetContentOptions(inferredType, 1, '', false)
                
                // 设置选中的原始表
                setSelectedOriginalTable(detail.originalTableName)
                
                // 加载原始表字段选项
                await loadOriginalFieldOptions(detail.originalTableName, 1, '', false)
                
                form.setFieldsValue({
                    standardSetType: inferredType,
                    standardName: detail.standardDictName,
                    standardDatasetName: detail.standardDataSetName,
                    standardDatasetContent: detail.standardDataSetContent,
                    standardDatasetCode: '', // TODO: 从详情中获取编码
                    originalTableName: detail.originalTableName,
                    originalDataField: detail.originalDataField,
                    originalDataset: detail.originalFieldDataSet,
                    remark: detail.remark || '',
                })
            }
        } catch (error) {
            // 如果获取详情失败，使用列表数据
            console.warn('获取详情失败，使用列表数据:', error)
            form.setFieldsValue({
                standardName: record.standardName,
                standardDatasetName: record.standardDatasetName,
                standardDatasetContent: record.standardDatasetContent,
                originalTableName: record.originalTableName,
                originalDataField: record.originalDataField,
                originalDataset: record.originalDataset,
            })
        }
    }

    const handleDelete = (record: StandardDictionaryMapping) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标准字典对照记录吗？`,
            onOk: async () => {
                try {
                    // TODO: 调用删除接口
                    message.success('删除成功')
                    fetchData()
                } catch (error) {
                    message.error(error instanceof Error ? error.message : '删除失败')
                }
            },
        })
    }

    /**
     * 处理查看详情
     */
    const handleView = async (record: StandardDictionaryMapping) => {
        setDetailModalVisible(true)
        setDetailLoading(true)
        setViewingRecord(null)
        setViewingRecordDetail(null)
        
        try {
            const response = await dataManagementService.getStandardDictionaryMappingDetail(record.id)
            
            if (response.code === 200) {
                // 保存原始详情数据
                setViewingRecordDetail(response.data)
                // 同时保存映射后的数据用于兼容
                const mappedRecord = mapRecordToPageFormat(response.data)
                setViewingRecord(mappedRecord)
            } else {
                message.error(response.msg || '获取详情失败')
                setDetailModalVisible(false)
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '获取详情失败')
            setDetailModalVisible(false)
        } finally {
            setDetailLoading(false)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            
            // 构建保存参数
            const saveParams: {
                id?: number
                standardDictName: string
                standardDataSetName: string
                standardDataSetContent: string
                standardDataSetCode?: string
                originalTableName: string
                originalFieldDataSet: string
                originalDataField: string
                remark?: string
            } = {
                standardDictName: values.standardName,
                standardDataSetName: values.standardDatasetName,
                standardDataSetContent: values.standardDatasetContent,
                originalTableName: values.originalTableName,
                originalFieldDataSet: values.originalDataset,
                originalDataField: values.originalDataField,
            }

            // 如果有标准数据集编码，添加编码
            if (values.standardDatasetCode) {
                saveParams.standardDataSetCode = values.standardDatasetCode
            }

            // 如果是编辑，需要传入ID
            if (editingRecord) {
                saveParams.id = Number(editingRecord.id)
            } else {
                // 新增时ID为0
                saveParams.id = 0
            }

            // 如果有备注，添加备注
            if (values.remark) {
                saveParams.remark = values.remark
            }

            // 调用保存接口
            const response = await dataManagementService.saveStandardDictionaryMapping(saveParams)

            if (response.code === 200) {
                message.success(editingRecord ? '修改成功' : '新增成功')
                setModalVisible(false)
                form.resetFields()
                setEditingRecord(null)
                fetchData()
            } else {
                message.error(response.msg || (editingRecord ? '修改失败' : '新增失败'))
            }
        } catch (error) {
            console.error('保存失败:', error)
            message.error(error instanceof Error ? error.message : (editingRecord ? '修改失败' : '新增失败'))
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

    /**
     * 处理分页变化
     */
    const handleTableChange = (page: number, size: number) => {
        setCurrent(page)
        setPageSize(size)
    }

    const columns: ColumnsType<StandardDictionaryMapping> = [
        {
            title: '序号',
            key: 'index',
            width: 80,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: '标准名称',
            dataIndex: 'standardName',
            key: 'standardName',
            width: 150,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '标准数据集名称',
            dataIndex: 'standardDatasetName',
            key: 'standardDatasetName',
            width: 150,
        },
        {
            title: '标准数据集内容',
            dataIndex: 'standardDatasetContent',
            key: 'standardDatasetContent',
            width: 150,
        },
        {
            title: '原始表名称',
            dataIndex: 'originalTableName',
            key: 'originalTableName',
            width: 180,
        },
        {
            title: '原始数据字段',
            dataIndex: 'originalDataField',
            key: 'originalDataField',
            width: 150,
            render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
        },
        {
            title: '原始数据集',
            dataIndex: 'originalDataset',
            key: 'originalDataset',
            width: 150,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
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
                        description='确定要删除这条记录吗？'
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
                    标准字典对照
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增对照
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
                message='标准字典对照'
                description='管理标准数据集与原始数据之间的对照关系，用于数据标准化和映射。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space>
                        <Input
                            placeholder='标准名称'
                            allowClear
                            style={{ width: 200 }}
                            value={dictName}
                            onChange={e => setDictName(e.target.value)}
                            onPressEnter={handleSearch}
                        />
                        <Input
                            placeholder='标准数据集名称'
                            allowClear
                            style={{ width: 200 }}
                            value={dataSetName}
                            onChange={e => setDataSetName(e.target.value)}
                            onPressEnter={handleSearch}
                        />
                        <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                            查询
                        </Button>
                        <Button onClick={handleReset}>
                            重置
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        current: current,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                />
            </Card>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingRecord ? '编辑标准字典对照' : '新增标准字典对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
                destroyOnClose
            >
                <Form form={form} layout='vertical'>
                    {/* 标准名称 - 放在标准集上面 */}
                    <Form.Item
                        name='standardName'
                        label='标准名称'
                        rules={[{ required: true, message: '请输入标准名称' }]}
                    >
                        <Input placeholder='请输入标准名称，如：患者基本信息' />
                    </Form.Item>

                    {/* 标准集选择 */}
                    <Form.Item
                        name='standardSetType'
                        label='标准集'
                        rules={[{ required: true, message: '请选择标准集' }]}
                    >
                        <Select
                            placeholder='请选择标准集（类别、业务、医疗、状态）'
                            onChange={(value: StandardSetType) => {
                                setStandardSetType(value)
                                // 清空相关字段
                                form.setFieldsValue({
                                    standardDatasetContent: undefined,
                                    standardDatasetCode: undefined,
                                })
                                // 重置分页和搜索
                                setStandardDatasetContentPage(1)
                                setStandardDatasetContentSearch('')
                                // 根据选择的标准集类型加载对应的标准数据集内容选项
                                loadStandardDatasetContentOptions(value, 1, '', false)
                            }}
                        >
                            {STANDARD_SET_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='standardDatasetName'
                        label='标准数据集名称'
                        rules={[{ required: true, message: '请输入标准数据集名称' }]}
                    >
                        <Input placeholder='请输入标准数据集名称，如：性别' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetContent'
                                label='标准数据集内容'
                                rules={[{ required: true, message: '请选择标准数据集内容' }]}
                            >
                                <LoadMoreSelect
                                    placeholder='请选择标准数据集内容'
                                    options={standardDatasetContentOptions}
                                    loading={standardDatasetContentLoading}
                                    hasMore={standardDatasetContentHasMore}
                                    onLoadMore={handleLoadMoreStandardDatasetContent}
                                    onSearch={handleSearchStandardDatasetContent}
                                    onChange={(value) => {
                                        // 设置标准数据集编码
                                        const selectedOption = standardDatasetContentOptions.find(opt => opt.value === value)
                                        if (selectedOption?.code) {
                                            form.setFieldsValue({
                                                standardDatasetCode: selectedOption.code as string,
                                            })
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetCode'
                                label='标准数据集编码'
                            >
                                <Input placeholder='由标准数据集管理带入' disabled />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='originalTableName'
                                label='原始表名称'
                                rules={[{ required: true, message: '请选择原始表名称' }]}
                            >
                                <LoadMoreSelect
                                    placeholder='请选择原始表名称'
                                    options={originalTableOptions}
                                    loading={originalTableLoading}
                                    hasMore={originalTableHasMore}
                                    onLoadMore={handleLoadMoreOriginalTable}
                                    onSearch={handleSearchOriginalTable}
                                    onChange={(value) => {
                                        setSelectedOriginalTable(value as string)
                                        // 清空原始数据字段
                                        form.setFieldsValue({
                                            originalDataField: undefined,
                                        })
                                        // 重置字段选项
                                        setOriginalFieldOptions([])
                                        setOriginalFieldPage(1)
                                        setOriginalFieldSearch('')
                                        // 根据选择的表加载字段列表
                                        if (value) {
                                            loadOriginalFieldOptions(value as string, 1, '', false)
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='originalDataField'
                                label='原始数据字段'
                                rules={[{ required: true, message: '请选择原始数据字段' }]}
                            >
                                <LoadMoreSelect
                                    placeholder='请选择原始数据字段'
                                    options={originalFieldOptions}
                                    loading={originalFieldLoading}
                                    hasMore={originalFieldHasMore}
                                    onLoadMore={handleLoadMoreOriginalField}
                                    onSearch={handleSearchOriginalField}
                                    disabled={!selectedOriginalTable}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='originalDataset'
                        label='原始数据集'
                        rules={[{ required: true, message: '请输入原始数据集' }]}
                    >
                        <Input placeholder='请输入原始数据集，如：M' />
                    </Form.Item>

                    <Form.Item
                        name='remark'
                        label='备注'
                    >
                        <TextArea
                            placeholder='请输入备注信息（可选）'
                            rows={3}
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情查看模态框 */}
            <Modal
                title='标准字典对照详情'
                open={detailModalVisible}
                onCancel={() => {
                    setDetailModalVisible(false)
                    setViewingRecord(null)
                    setViewingRecordDetail(null)
                }}
                footer={[
                    <Button key='close' onClick={() => {
                        setDetailModalVisible(false)
                        setViewingRecord(null)
                        setViewingRecordDetail(null)
                    }}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                <Spin spinning={detailLoading}>
                    {viewingRecordDetail && (
                        <div>
                            <Row gutter={[16, 16]}>
                                {/* 基本信息 */}
                                <Col span={24}>
                                    <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 0 }}>
                                        基本信息
                                    </Typography.Title>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>标准名称：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.standardDictName}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>标准数据集名称：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.standardDataSetName}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>标准数据集内容：</strong>
                                        <Tag color='green' style={{ marginLeft: 8 }}>
                                            {viewingRecordDetail.standardDataSetContent}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>原始表名称：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.originalTableName}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>原始数据字段：</strong>
                                        <code
                                            style={{
                                                background: '#f5f5f5',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                marginLeft: 8,
                                            }}
                                        >
                                            {viewingRecordDetail.originalDataField}
                                        </code>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>原始数据集：</strong>
                                        <Tag color='blue' style={{ marginLeft: 8 }}>
                                            {viewingRecordDetail.originalFieldDataSet}
                                        </Tag>
                                    </div>
                                </Col>

                                {/* 备注信息 */}
                                {viewingRecordDetail.remark && (
                                    <>
                                        <Col span={24}>
                                            <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 8 }}>
                                                备注信息
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <div style={{ marginBottom: 12 }}>
                                                <strong>备注：</strong>
                                                <span style={{ marginLeft: 8 }}>{viewingRecordDetail.remark}</span>
                                            </div>
                                        </Col>
                                    </>
                                )}

                                {/* 系统信息 */}
                                <Col span={24}>
                                    <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 8 }}>
                                        系统信息
                                    </Typography.Title>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>记录ID：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.id}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>创建人：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.createBy || '未知'}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>创建时间：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.createTime}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>更新人：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.updateBy || '未知'}</span>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ marginBottom: 12 }}>
                                        <strong>更新时间：</strong>
                                        <span style={{ marginLeft: 8 }}>{viewingRecordDetail.updateTime}</span>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Spin>
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

