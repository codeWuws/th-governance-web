import React, { useState, useEffect } from 'react'
import {
    Alert,
    Card,
    Table,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Typography,
    Switch,
    Row,
    Col,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    DownloadOutlined,
    UploadOutlined,
    SearchOutlined,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { dataManagementService } from '@/services/dataManagementService'
import type {
    BusinessDatasetPageParams,
    BusinessDatasetRecord,
    DataSourceOption,
    CategoryItem,
} from '@/types'

const { Option } = Select
const { Search } = Input

/**
 * 前端使用的业务数据集模型
 */
interface BusinessDataset {
    id: string
    name: string
    code: string
    category: string // 分类名称
    categoryId: number // 分类ID
    description: string
    diseaseType: string
    dataSource: string
    fieldCount: number
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    version: string
}

/**
 * 将后端返回的记录转换为前端使用的模型
 */
const mapBusinessDatasetRecordToModel = (
    record: BusinessDatasetRecord
): BusinessDataset => {
    return {
        id: record.id,
        name: record.dataSetName,
        code: record.dataSetCode,
        category: record.categoryName || '',
        categoryId: record.categoryId,
        description: record.description || '',
        diseaseType: record.diseaseType || '',
        dataSource: record.dataSource || '',
        fieldCount: record.fieldCount || 0,
        status: record.status === 1 ? 'active' : 'inactive',
        createTime: record.createTime,
        updateTime: record.updateTime || '',
        creator: record.creator || '',
        version: record.version || '',
    }
}

const BusinessDatasetManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<BusinessDataset[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<BusinessDataset | null>(null)
    const [form] = Form.useForm()
    const [filterForm] = Form.useForm()
    const [categoryList, setCategoryList] = useState<CategoryItem[]>([])
    const [categoryListLoading, setCategoryListLoading] = useState(false)
    const [dataSourceOptions, setDataSourceOptions] = useState<DataSourceOption[]>([])
    const [dataSourceOptionsLoading, setDataSourceOptionsLoading] = useState(false)
    
    // 筛选条件
    const [dataSetName, setDataSetName] = useState<string>('')
    const [dataSetCode, setDataSetCode] = useState<string>('')
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
    const [status, setStatus] = useState<number | undefined>(undefined)
    
    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    useEffect(() => {
        fetchCategoryList()
        fetchDataSourceOptions()
        fetchData({ pageNum: 1, pageSize: pagination.pageSize })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 获取分类列表数据
    const fetchCategoryList = async () => {
        setCategoryListLoading(true)
        try {
            const response = await dataManagementService.getCategoryList()
            setCategoryList(response.data || [])
        } catch (error) {
            console.error('获取分类列表失败:', error)
            message.error('获取分类列表失败')
        } finally {
            setCategoryListLoading(false)
        }
    }

    // 获取数据源选项数据
    const fetchDataSourceOptions = async () => {
        setDataSourceOptionsLoading(true)
        try {
            const response = await dataManagementService.getBusinessDatasetDataSourceOptions()
            // 按 sort 字段排序
            const sortedOptions = response.data.sort((a, b) => a.sort - b.sort)
            setDataSourceOptions(sortedOptions)
        } catch (error) {
            console.error('获取数据源选项失败:', error)
            message.error('获取数据源选项失败')
        } finally {
            setDataSourceOptionsLoading(false)
        }
    }

    /**
     * 从后端分页接口获取业务数据集数据
     * @param options 重载查询参数（页码、页大小、筛选条件）
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        condition?: string
        dataSetName?: string | null
        dataSetCode?: string | null
        categoryId?: number | null
        status?: number | null
    }) => {
        const pageNum = options?.pageNum ?? pagination.current
        const pageSize = options?.pageSize ?? pagination.pageSize
        
        // 如果 options 中明确传入了值（包括 null），使用传入的值；否则使用状态变量
        // null 表示明确清空，应该使用 undefined
        const condition = options?.condition !== undefined 
            ? (options.condition === null ? undefined : (options.condition.trim() || undefined))
            : undefined
        
        const filterDataSetName = options?.dataSetName !== undefined 
            ? (options.dataSetName === null ? undefined : (options.dataSetName.trim() || undefined))
            : (dataSetName ? dataSetName.trim() : undefined)
        
        const filterDataSetCode = options?.dataSetCode !== undefined 
            ? (options.dataSetCode === null ? undefined : (options.dataSetCode.trim() || undefined))
            : (dataSetCode ? dataSetCode.trim() : undefined)
        
        const filterCategoryId = options?.categoryId !== undefined 
            ? (options.categoryId === null ? undefined : options.categoryId)
            : categoryId
        
        const filterStatus = options?.status !== undefined 
            ? (options.status === null ? undefined : options.status)
            : status

        setLoading(true)
        try {
            const params: BusinessDatasetPageParams = {
                pageNum,
                pageSize,
                condition,
                sortField: 'create_time',
                sortOrder: 'desc',
                dataSetName: filterDataSetName,
                dataSetCode: filterDataSetCode,
                categoryId: filterCategoryId,
                status: typeof filterStatus === 'number' ? filterStatus : undefined,
            }

            const response = await dataManagementService.getBusinessDatasetPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapBusinessDatasetRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            // 统一错误提示，优先展示后端/服务封装的错误信息
            const errMsg = error instanceof Error ? error.message : '获取业务数据集列表失败'
            message.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 处理搜索（关键字段模糊查询 -> condition）
     */
    const handleSearch = (value: string) => {
        const keyword = value.trim()
        const nextPageSize = pagination.pageSize
        setPagination(prev => ({ ...prev, current: 1 }))
        // 如果 keyword 为空，明确传入 null 表示清空；否则传入实际值
        const conditionValue = keyword ? keyword : null
        void fetchData({ pageNum: 1, pageSize: nextPageSize, condition: conditionValue })
    }


    /**
     * 重置筛选条件
     */
    const handleResetFilter = () => {
        filterForm.resetFields()
        setDataSetName('')
        setDataSetCode('')
        setCategoryId(undefined)
        setStatus(undefined)
        
        const nextPageSize = pagination.pageSize
        setPagination(prev => ({ ...prev, current: 1 }))
        // 明确传入 null 表示清空所有筛选条件
        void fetchData({ 
            pageNum: 1, 
            pageSize: nextPageSize,
            dataSetName: null,
            dataSetCode: null,
            categoryId: null,
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

    const handleAdd = async () => {
        setEditingRecord(null)
        form.resetFields()
        // 确保分类列表数据已加载
        if (categoryList.length === 0) {
            await fetchCategoryList()
        }
        // 确保数据源选项已加载
        if (dataSourceOptions.length === 0) {
            await fetchDataSourceOptions()
        }
        setModalVisible(true)
    }

    const handleEdit = async (record: BusinessDataset) => {
        setEditingRecord(record)
        // 处理数据源：如果是逗号分隔的字符串，转换为数组
        const dataSourceValue = record.dataSource
            ? record.dataSource.split(',').map(s => s.trim()).filter(Boolean)
            : []
        
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
            dataSource: dataSourceValue, // 数据源转换为数组格式
        })
        // 确保分类列表数据已加载
        if (categoryList.length === 0) {
            await fetchCategoryList()
        }
        // 确保数据源选项已加载
        if (dataSourceOptions.length === 0) {
            await fetchDataSourceOptions()
        }
        setModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await dataManagementService.deleteBusinessDataset(id)
            message.success('删除成功')
            // 刷新列表（如果当前页没有数据了，回到上一页）
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
        } catch (error) {
            // 错误信息已在服务层处理，这里只做兜底提示
            const errMsg = error instanceof Error ? error.message : '删除失败'
            message.error(errMsg)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            
            // 根据分类名称查找分类ID
            const categoryName = values.category
            const categoryItem = categoryList.find(item => item.categoryName === categoryName)
            if (!categoryItem) {
                message.error('请选择有效的分类')
                return
            }
            const categoryId = Number(categoryItem.id)

            // 处理数据源：如果是数组，转换为逗号分隔的字符串
            const dataSource = Array.isArray(values.dataSource)
                ? values.dataSource.join(',')
                : values.dataSource || ''

            // 将表单数据转换为接口需要的格式
            const requestData = {
                dataSetName: values.name,
                dataSetCode: values.code,
                categoryId,
                dataSource,
                status: values.status ? 1 : 0, // boolean 转换为 0/1
                remark: values.description || '', // description 映射到 remark
            }

            if (editingRecord) {
                // 编辑：需要包含 id（字符串类型）
                await dataManagementService.updateBusinessDataset({
                    id: editingRecord.id,
                    ...requestData,
                })
                message.success('更新成功')
            } else {
                // 新增
                await dataManagementService.addBusinessDataset(requestData)
                message.success('创建成功')
            }

            // 关闭弹窗并重置表单
            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)

            // 刷新列表（回到第一页，显示最新数据）
            setPagination(prev => ({ ...prev, current: 1 }))
            void fetchData({
                pageNum: 1,
                pageSize: pagination.pageSize,
            })
        } catch (error) {
            // 错误信息已在服务层处理，这里只做兜底提示
            if (error && typeof error === 'object' && 'errorFields' in error) {
                // 表单验证错误，不需要额外提示
                console.error('表单验证失败:', error)
            } else {
                const errMsg = error instanceof Error ? error.message : '操作失败'
                message.error(errMsg)
            }
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    const handleExport = (record: BusinessDataset) => {
        message.info(`正在导出 ${record.name} 的模板...`)
        // 模拟导出操作
        setTimeout(() => {
            message.success('模板导出成功')
        }, 1000)
    }

    const handleImport = () => {
        message.info('导入功能开发中...')
    }

    /**
     * 处理自动映射
     */
    const handleAutomaticMapping = async () => {
        try {
            message.loading({ content: '正在执行自动映射...', key: 'automaticMapping' })
            const response = await dataManagementService.automaticMapping()
            message.success({
                content: response.msg || '自动映射完成',
                key: 'automaticMapping',
                duration: 3,
            })
            // 如果返回了详细信息，可以显示
            if (response.data?.details && response.data.details.length > 0) {
                console.log('映射详情:', response.data.details)
            }
            // 刷新列表
            void fetchData({
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
            })
        } catch (error) {
            message.error({
                content: error instanceof Error ? error.message : '自动映射失败',
                key: 'automaticMapping',
            })
        }
    }

    const handlePreview = (record: BusinessDataset) => {
        Modal.info({
            title: '数据集预览',
            width: 800,
            content: (
                <div>
                    <p>
                        <strong>数据集名称：</strong>
                        {record.name}
                    </p>
                    <p>
                        <strong>编码：</strong>
                        {record.code}
                    </p>
                    <p>
                        <strong>数据源：</strong>
                        {record.dataSource}
                    </p>
                    <p>
                        <strong>描述：</strong>
                        {record.description}
                    </p>
                    <p>
                        <strong>版本：</strong>
                        {record.version}
                    </p>
                </div>
            ),
        })
    }

    const columns = [
        {
            title: '数据集名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 150,
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (category: string) => {
                // 从分类列表中查找对应的分类信息
                const categoryItem = categoryList.find(item => item.categoryName === category)
                if (categoryItem) {
                    return (
                        <Tag color='blue' title={categoryItem.categoryCode}>
                            {category}
                        </Tag>
                    )
                }
                return <Tag>{category}</Tag>
            },
        },
        {
            title: '数据源',
            dataIndex: 'dataSource',
            key: 'dataSource',
            width: 120,
            render: (sources: string) => {
                if (!sources) return '-'
                // 将数据源字符串按逗号分割
                const sourceList = sources.split(',').map(s => s.trim()).filter(Boolean)
                return (
                    <Space size='small'>
                        {sourceList.map((source, index) => {
                            // 根据数据源值或标签查找对应的选项
                            const option = dataSourceOptions.find(
                                opt => opt.value === source || opt.label === source
                            )
                            // 如果找到对应的选项，显示标签；否则显示原始值（兼容性处理）
                            const displayLabel = option ? option.label : source
                            return (
                                <Tag key={index} color='blue' title={option ? `值: ${option.value}` : undefined}>
                                    {displayLabel}
                                </Tag>
                            )
                        })}
                    </Space>
                )
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 160,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: BusinessDataset) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个数据集吗？'
                        onConfirm={() => handleDelete(record.id)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button type='link' size='small' danger icon={<DeleteOutlined />}>
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
                    业务数据集管理
                </Typography.Title>
                <Space>
                    <Button
                        type='default'
                        icon={<SyncOutlined />}
                        onClick={handleAutomaticMapping}
                    >
                        自动映射
                    </Button>
                    <Button type='default' icon={<UploadOutlined />} onClick={handleImport}>
                        导入模板
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新建数据集
                    </Button>
                </Space>
            </div>
            <Alert
                message='管理面向业务的专病数据集'
                description='支持创建、编辑、导入导出与预览，确保数据集规范与完整。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card>

                {/* 筛选表单 */}
                <Form
                    form={filterForm}
                    layout='inline'
                    style={{ marginBottom: 16 }}
                    onValuesChange={(changedValues, allValues) => {
                        // 当字段被清空时，确保传入 null 而不是 undefined
                        const values = {
                            dataSetName: allValues.dataSetName || null,
                            dataSetCode: allValues.dataSetCode || null,
                            categoryId: allValues.categoryId ?? null,
                            status: allValues.status ?? null,
                        }
                        setDataSetName(values.dataSetName || '')
                        setDataSetCode(values.dataSetCode || '')
                        setCategoryId(values.categoryId ?? undefined)
                        setStatus(values.status ?? undefined)
                        
                        const nextPageSize = pagination.pageSize
                        setPagination(prev => ({ ...prev, current: 1 }))
                        void fetchData({
                            pageNum: 1,
                            pageSize: nextPageSize,
                            dataSetName: values.dataSetName,
                            dataSetCode: values.dataSetCode,
                            categoryId: values.categoryId,
                            status: values.status,
                        })
                    }}
                >
                    <Form.Item name='dataSetName' label='数据集名称'>
                        <Input
                            placeholder='请输入数据集名称'
                            allowClear
                            style={{ width: 200 }}
                        />
                    </Form.Item>
                    <Form.Item name='dataSetCode' label='数据集编码'>
                        <Input
                            placeholder='请输入数据集编码'
                            allowClear
                            style={{ width: 200 }}
                        />
                    </Form.Item>
                    <Form.Item name='categoryId' label='分类'>
                        <Select
                            placeholder='请选择分类'
                            allowClear
                            showSearch
                            optionFilterProp='children'
                            loading={categoryListLoading}
                            style={{ width: 200 }}
                        >
                            {categoryList.map(category => (
                                <Option key={category.id} value={Number(category.id)}>
                                    {category.categoryName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name='status' label='状态'>
                        <Select
                            placeholder='请选择状态'
                            allowClear
                            style={{ width: 150 }}
                        >
                            <Option value={1}>启用</Option>
                            <Option value={0}>禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
                            重置
                        </Button>
                    </Form.Item>
                </Form>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑数据集' : '新建数据集'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form form={form} layout='vertical' initialValues={{ status: true }}>
                    <Form.Item
                        label='数据集名称'
                        name='name'
                        rules={[{ required: true, message: '请输入数据集名称' }]}
                    >
                        <Input placeholder='请输入数据集名称' />
                    </Form.Item>

                    <Form.Item
                        label='数据集编码'
                        name='code'
                        rules={[{ required: true, message: '请输入数据集编码' }]}
                    >
                        <Input placeholder='请输入数据集编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        label='数据源'
                        name='dataSource'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select
                            mode='tags'
                            placeholder='请选择数据源'
                            loading={dataSourceOptionsLoading}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? option?.children ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {dataSourceOptions.map(option => (
                                <Option key={option.value} value={option.label}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='描述'
                        name='description'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入数据集描述' />
                    </Form.Item>

                    <Form.Item
                        label='分类'
                        name='category'
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select
                            placeholder='请选择分类'
                            showSearch
                            optionFilterProp='children'
                            loading={categoryListLoading}
                        >
                            {categoryList.map(category => (
                                <Option key={category.id} value={category.categoryName}>
                                    {category.categoryName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default BusinessDatasetManagement
