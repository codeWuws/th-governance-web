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
    Switch,
    Alert,
    Typography,
    Popconfirm,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ImportOutlined,
    ExportOutlined,
    EyeOutlined,
    DownloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import moment from 'moment'
import { exportToExcel, importFromExcel, downloadExcelTemplate } from '../../utils/excel'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'
import { dataManagementService } from '@/services/dataManagementService'
import type { CategoryItem, StatusDictPageParams, StatusDictRecord } from '@/types'

const { Search } = Input
const { Option } = Select

interface StateDictionary {
    id: string
    name: string // 状态名称
    code: string // 状态编码
    category: string // 分类
    description: string // 描述
    version?: string // 版本
    status: 'active' | 'inactive' // 启用状态
    createTime: string
    updateTime: string
    creator: string
}

const StateDictionaryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StateDictionary[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StateDictionary | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [categoryList, setCategoryList] = useState<CategoryItem[]>([])
    const [categoryListLoading, setCategoryListLoading] = useState(false)
    
    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 模拟数据 - 每个状态一条记录
    const mockData: StateDictionary[] = [
        {
            id: '1',
            name: '已审核',
            code: 'AUDITED',
            category: '工作流',
            description: '审核完成状态',
            status: 'active',
            createTime: '2024-01-15 10:30:00',
            updateTime: '2024-01-15 10:30:00',
            creator: '系统管理员',
        },
        {
            id: '2',
            name: '未审核',
            code: 'UNAUDITED',
            category: '工作流',
            description: '待审核状态',
            status: 'active',
            createTime: '2024-01-15 10:31:00',
            updateTime: '2024-01-15 10:31:00',
            creator: '系统管理员',
        },
        {
            id: '3',
            name: '已中止',
            code: 'TERMINATED',
            category: '工作流',
            description: '流程已中止状态',
            status: 'active',
            createTime: '2024-01-15 10:32:00',
            updateTime: '2024-01-15 10:32:00',
            creator: '系统管理员',
        },
        {
            id: '4',
            name: '已结束',
            code: 'COMPLETED',
            category: '工作流',
            description: '流程已结束状态',
            status: 'active',
            createTime: '2024-01-15 10:33:00',
            updateTime: '2024-01-15 10:33:00',
            creator: '系统管理员',
        },
        {
            id: '5',
            name: '草稿',
            code: 'DRAFT',
            category: '工作流',
            description: '草稿状态',
            status: 'active',
            createTime: '2024-01-16 09:00:00',
            updateTime: '2024-01-16 09:00:00',
            creator: '系统管理员',
        },
        {
            id: '6',
            name: '待审批',
            code: 'PENDING',
            category: '工作流',
            description: '等待审批状态',
            status: 'active',
            createTime: '2024-01-16 09:01:00',
            updateTime: '2024-01-16 09:01:00',
            creator: '系统管理员',
        },
        {
            id: '7',
            name: '已批准',
            code: 'APPROVED',
            category: '工作流',
            description: '审批通过状态',
            status: 'active',
            createTime: '2024-01-16 09:02:00',
            updateTime: '2024-01-16 09:02:00',
            creator: '系统管理员',
        },
        {
            id: '8',
            name: '已拒绝',
            code: 'REJECTED',
            category: '工作流',
            description: '审批被拒绝状态',
            status: 'active',
            createTime: '2024-01-16 09:03:00',
            updateTime: '2024-01-16 09:03:00',
            creator: '系统管理员',
        },
    ]

    useEffect(() => {
        fetchCategoryList()
        fetchData({ pageNum: 1, pageSize: pagination.pageSize })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * 将后端返回的记录转换为前端使用的模型
     */
    const mapStatusDictRecordToModel = (record: StatusDictRecord): StateDictionary => {
        return {
            id: record.id,
            name: record.dictName,
            code: record.dictCode,
            category: record.categoryName || '',
            description: record.remark || '',
            version: record.version || '',
            status: record.status === 1 ? 'active' : 'inactive',
            createTime: record.createTime,
            updateTime: record.updateTime || record.createTime,
            creator: record.createBy || '',
        }
    }

    /**
     * 从后端分页接口获取状态字典数据
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        condition?: string
        keyword?: string | null
        categoryId?: number | null
        status?: number | null
    }) => {
        const pageNum = options?.pageNum ?? pagination.current
        const pageSize = options?.pageSize ?? pagination.pageSize

        setLoading(true)
        try {
            // 如果 options 中明确传入了值（包括 null），使用传入的值；否则使用状态变量
            let keywordValue: string | undefined
            if (options?.keyword !== undefined) {
                // 如果传入的是 null，表示清空，使用 undefined
                // 如果传入的是字符串，使用该字符串
                keywordValue = options.keyword === null ? undefined : (options.keyword.trim() || undefined)
            } else {
                // 如果没有传入，使用状态变量
                keywordValue = searchText ? searchText.trim() : undefined
            }

            let categoryIdValue: number | undefined
            if (options?.categoryId !== undefined) {
                // 如果传入的是 null，表示清空，使用 undefined
                categoryIdValue = options.categoryId === null ? undefined : options.categoryId
            } else {
                // 如果没有传入，使用状态变量
                const categoryItem = categoryFilter
                    ? categoryList.find(item => item.categoryName === categoryFilter)
                    : null
                categoryIdValue = categoryItem ? Number(categoryItem.id) : undefined
            }

            let statusValue: number | undefined
            if (options?.status !== undefined) {
                // 如果传入的是 null，表示清空，使用 undefined
                statusValue = options.status === null ? undefined : options.status
            } else {
                // 如果没有传入，使用状态变量
                statusValue = statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : undefined
            }

            const params: StatusDictPageParams = {
                pageNum,
                pageSize,
                condition: options?.condition ? options.condition.trim() : undefined, // 保留 condition 用于关键字段模糊查询
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue, // keyword 字段
                categoryId: categoryIdValue,
                status: statusValue,
            }

            const response = await dataManagementService.getStatusDictPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapStatusDictRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取状态字典列表失败'
            message.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

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

    const handleSearch = () => {
        // 重置到第一页并重新查询
        setPagination(prev => ({ ...prev, current: 1 }))
        // 如果 searchText 为空，明确传入 null 表示清空；否则传入实际值
        const keywordValue = searchText && searchText.trim() ? searchText.trim() : null
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            keyword: keywordValue,
        })
    }

    /**
     * 处理筛选条件变化
     */
    const handleFilterChange = () => {
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            keyword: searchText || null, // 空字符串时传入 null
            categoryId: categoryFilter ? (categoryList.find(item => item.categoryName === categoryFilter)?.id ? Number(categoryList.find(item => item.categoryName === categoryFilter)!.id) : null) : null,
            status: statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : null,
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
        setModalVisible(true)
    }

    const handleEdit = async (record: StateDictionary) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
        })
        // 确保分类列表数据已加载
        if (categoryList.length === 0) {
            await fetchCategoryList()
        }
        setModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await dataManagementService.deleteStatusDict(id)
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

            // 将表单数据转换为接口需要的格式
            const requestData = {
                dictName: values.name,
                dictCode: values.code,
                categoryId,
                status: values.status ? 1 : 0, // boolean 转换为 0/1
                version: values.version || '', // version 字段，可选
                remark: values.description || '', // description 映射到 remark
            }

            if (editingRecord) {
                // 编辑：需要包含 id
                await dataManagementService.updateStatusDict({
                    id: editingRecord.id,
                    ...requestData,
                })
                message.success('更新成功')
            } else {
                // 新增
                await dataManagementService.addStatusDict(requestData)
                message.success('创建成功')
            }

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
            if (error instanceof Error && !error.message.includes('失败')) {
                console.error('表单验证失败:', error)
            }
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    // Excel导出功能
    const handleExport = async () => {
        try {
            // 构建导出参数，使用当前的查询条件
            let keywordValue: string | undefined
            keywordValue = searchText ? searchText.trim() : undefined

            let categoryIdValue: number | undefined
            const categoryItem = categoryFilter
                ? categoryList.find(item => item.categoryName === categoryFilter)
                : null
            categoryIdValue = categoryItem ? Number(categoryItem.id) : undefined

            let statusValue: number | undefined
            statusValue = statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : undefined

            const exportParams: StatusDictPageParams = {
                pageNum: 1,
                pageSize: 10000, // 导出时使用较大的pageSize以获取所有数据
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue,
                categoryId: categoryIdValue,
                status: statusValue,
            }

            await dataManagementService.exportStatusDict(exportParams)
            message.success('导出成功')
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '导出失败'
            message.error(errMsg)
            console.error('导出失败:', error)
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<StateDictionary>>(file, {
                columnMapping: {
                    '状态名称': 'name',
                    '状态编码': 'code',
                    '分类': 'category',
                    '描述': 'description',
                    '状态': 'status',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.name || !row.code) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    const transformed: Partial<StateDictionary> = {
                        name: String(row.name || '').trim(),
                        code: String(row.code || '').trim(),
                        category: String(row.category || '').trim(),
                        description: String(row.description || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === 'active' ||
                            String(row.status || '').trim() === 'ACTIVE'
                                ? 'active'
                                : 'inactive',
                    }
                    return transformed as StateDictionary
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 添加到数据列表
            const newData: StateDictionary[] = importedData
                .filter(item => item.name && item.code) // 再次过滤确保必填字段存在
                .map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: item.name || '',
                    code: item.code || '',
                    category: item.category || '',
                    description: item.description || '',
                    status: item.status || 'active',
                    createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
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
            { title: '状态名称', dataIndex: 'name' },
            { title: '状态编码', dataIndex: 'code' },
            { title: '分类', dataIndex: 'category' },
            { title: '描述', dataIndex: 'description' },
            { title: '状态', dataIndex: 'status' },
        ]
        downloadExcelTemplate(templateColumns, '状态字典管理')
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

    const handlePreview = (record: StateDictionary) => {
        Modal.info({
            title: '状态详情',
            width: 600,
            content: (
                <div style={{ marginTop: 16 }}>
                    <p>
                        <strong>状态名称:</strong> {record.name}
                    </p>
                    <p>
                        <strong>状态编码:</strong> {record.code}
                    </p>
                    <p>
                        <strong>分类:</strong> {record.category}
                    </p>
                    <p>
                        <strong>描述:</strong> {record.description}
                    </p>
                    <p>
                        <strong>状态:</strong>{' '}
                        <Tag color={record.status === 'active' ? 'green' : 'red'}>
                            {record.status === 'active' ? '启用' : '禁用'}
                        </Tag>
                    </p>
                    <p>
                        <strong>创建人:</strong> {record.creator}
                    </p>
                    <p>
                        <strong>创建时间:</strong> {record.createTime}
                    </p>
                    <p>
                        <strong>更新时间:</strong> {record.updateTime}
                    </p>
                </div>
            ),
        })
    }

    const columns: ColumnsType<StateDictionary> = [
        {
            title: '状态名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '状态编码',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
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
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
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
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个状态字典吗？'
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
                    状态字典管理
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增状态
                    </Button>
                    {/* <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button> */}
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                </Space>
            </div>
            <Alert
                message='状态字典管理'
                description='支持新增、导入、导出与搜索，维护标准化状态。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space style={{ marginBottom: 16 }}></Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder='搜索状态名称、编码或描述'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                            onClear={() => {
                                setSearchText('')
                                // 清空搜索框时，立即重新查询
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    keyword: null,
                                })
                            }}
                        />
                        <Select
                            placeholder='选择分类'
                            style={{ width: 150 }}
                            value={categoryFilter}
                            onChange={(value) => {
                                setCategoryFilter(value || '')
                                // 当清空时，value 为 undefined，需要明确传入 null
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    keyword: searchText || null,
                                    categoryId: value ? (categoryList.find(item => item.categoryName === value)?.id ? Number(categoryList.find(item => item.categoryName === value)!.id) : null) : null,
                                    status: statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : null,
                                })
                            }}
                            allowClear
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
                        <Select
                            placeholder='选择状态'
                            style={{ width: 150 }}
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value || '')
                                // 当清空时，value 为 undefined，需要明确传入 null
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    keyword: searchText || null,
                                    categoryId: categoryFilter ? (categoryList.find(item => item.categoryName === categoryFilter)?.id ? Number(categoryList.find(item => item.categoryName === categoryFilter)!.id) : null) : null,
                                    status: value === 'active' ? 1 : value === 'inactive' ? 0 : null,
                                })
                            }}
                            allowClear
                        >
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>禁用</Option>
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
                title={editingRecord ? '编辑状态' : '新增状态'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='状态名称'
                        rules={[{ required: true, message: '请输入状态名称' }]}
                    >
                        <Input placeholder='请输入状态名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='状态编码'
                        rules={[{ required: true, message: '请输入状态编码' }]}
                    >
                        <Input placeholder='请输入状态编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        name='category'
                        label='分类'
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

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入描述' />
                    </Form.Item>

                    <Form.Item
                        name='version'
                        label='版本'
                    >
                        <Input placeholder='请输入版本号（可选）' />
                    </Form.Item>

                    <Form.Item
                        name='status'
                        label='状态'
                        valuePropName='checked'
                        initialValue={true}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StateDictionaryManagement
