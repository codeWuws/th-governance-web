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
    Row,
    Col,
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
    DownloadOutlined,
} from '@ant-design/icons'
import { uiMessage } from '@/utils/uiMessage'
import type { ColumnsType } from 'antd/es/table'
import { exportToExcel, importFromExcel, downloadExcelTemplate } from '../../utils/excel'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'
import { dataManagementService } from '@/services/dataManagementService'
import type { 
    StandardDictPageParams, 
    StandardDictRecord, 
    OriginSourceOption, 
    TargetSourceOption,
    OriginTableOption,
    TargetTableOption,
    OriginFieldOption,
    TargetFieldOption,
    BusinessDatasetRecord,
    MedicalDictRecord,
    StatusDictRecord
} from '@/types'

const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface StandardDictionaryMapping {
    id: string
    standardName: string // 标准名称
    standardDatasetName: string // 标准数据集名称
    standardDatasetContent: string // 标准数据集内容
    originalDataSource: string // 原始数据源
    originalTableName: string // 原始表
    originalDataField: string // 原始字段
    originalDataset: string // 原始数据集
    targetDataSource: string // 目标源
    targetTableName: string // 目标表
    targetField: string // 目标字段
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
}

/**
 * 将后端返回的记录转换为前端使用的模型
 */
const mapStandardDictRecordToModel = (record: StandardDictRecord): StandardDictionaryMapping => {
    return {
        id: record.id,
        standardName: record.standardName,
        standardDatasetName: record.standardDataSetName,
        standardDatasetContent: record.standardDataSetContent,
        originalDataSource: record.originSourceName || '',
        originalTableName: record.originTable,
        originalDataField: record.originField,
        originalDataset: record.originDataSet,
        targetDataSource: record.targetSource,
        targetTableName: record.targetTable,
        targetField: record.targetField,
        status: record.status === 1 ? 'active' : 'inactive',
        createTime: record.createTime,
        updateTime: record.createTime, // 后端没有返回updateTime，使用createTime
        creator: record.createBy || '',
    }
}

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StandardDictionaryMapping[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [viewingRecord, setViewingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
    const [originSourceFilter, setOriginSourceFilter] = useState<number | undefined>(undefined)
    
    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 原始数据源选项和目标源选项
    const [originSourceOptions, setOriginSourceOptions] = useState<OriginSourceOption[]>([])
    const [targetSourceOptions, setTargetSourceOptions] = useState<TargetSourceOption[]>([])
    const [originTableOptions, setOriginTableOptions] = useState<OriginTableOption[]>([])
    const [targetTableOptions, setTargetTableOptions] = useState<TargetTableOption[]>([])
    const [originFieldOptions, setOriginFieldOptions] = useState<OriginFieldOption[]>([])
    const [targetFieldOptions, setTargetFieldOptions] = useState<TargetFieldOption[]>([])
    const [optionsLoading, setOptionsLoading] = useState(false)

    // 原始数据集相关状态
    const [datasetType, setDatasetType] = useState<'business' | 'medical' | 'status' | ''>('')
    const [datasetOptions, setDatasetOptions] = useState<Array<{
        value: string
        label: string
        name: string
        code: string
        type: string
    }>>([])
    const [datasetLoading, setDatasetLoading] = useState(false)
    const [datasetPagination, setDatasetPagination] = useState<{ current: number; pageSize: number; total: number; hasMore: boolean }>({
        current: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,
    })

    useEffect(() => {
        fetchData({ pageNum: 1, pageSize: pagination.pageSize })
        fetchOptions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * 根据数据集类型获取数据集选项（支持分页）
     */
    const fetchDatasetOptions = async (type: 'business' | 'medical' | 'status', pageNum: number = 1) => {
        if (!type) return

        setDatasetLoading(true)
        try {
            let response
            const pageSize = datasetPagination.pageSize

            if (type === 'business') {
                // 业务数据集
                response = await dataManagementService.getBusinessDatasetPage({
                    pageNum,
                    pageSize,
                    sortField: 'create_time',
                    sortOrder: 'desc',
                })
                const records = (response.data.records || []) as BusinessDatasetRecord[]
                const newOptions = records.map(record => ({
                    value: record.dataSetCode || record.id,
                    label: `${record.dataSetName}（${record.dataSetCode}）- ${record.dataSource || '业务数据集'}`,
                    name: record.dataSetName,
                    code: record.dataSetCode,
                    type: record.dataSource || '业务数据集',
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
            } else if (type === 'medical') {
                // 医疗字典
                response = await dataManagementService.getMedicalDictPage({
                    pageNum,
                    pageSize,
                    sortField: 'create_time',
                    sortOrder: 'desc',
                })
                const records = (response.data.records || []) as MedicalDictRecord[]
                const newOptions = records.map(record => ({
                    value: record.dictCode || record.id,
                    label: `${record.dictName}（${record.dictCode}）- ${record.source || '医疗字典'}`,
                    name: record.dictName,
                    code: record.dictCode,
                    type: record.source || '医疗字典',
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
            } else if (type === 'status') {
                // 状态字典
                response = await dataManagementService.getStatusDictPage({
                    pageNum,
                    pageSize,
                    sortField: 'create_time',
                    sortOrder: 'desc',
                })
                const records = (response.data.records || []) as StatusDictRecord[]
                const newOptions = records.map(record => ({
                    value: record.dictCode || record.id,
                    label: `${record.dictName}（${record.dictCode}）- 状态字典`,
                    name: record.dictName,
                    code: record.dictCode,
                    type: '状态字典',
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
            }
        } catch (error) {
            console.error('获取数据集选项失败:', error)
            uiMessage.handleSystemError('获取数据集选项失败')
        } finally {
            setDatasetLoading(false)
        }
    }

    /**
     * 获取原始数据源选项、目标源选项、原始表选项、目标表选项、原始字段选项和目标字段选项
     */
    const fetchOptions = async () => {
        setOptionsLoading(true)
        try {
            const [
                originSourceResponse, 
                targetSourceResponse, 
                originTableResponse, 
                targetTableResponse,
                originFieldResponse,
                targetFieldResponse
            ] = await Promise.all([
                dataManagementService.getOriginSourceOptions(),
                dataManagementService.getTargetSourceOptions(),
                dataManagementService.getOriginTableOptions(),
                dataManagementService.getTargetTableOptions(),
                dataManagementService.getOriginFieldOptions(),
                dataManagementService.getTargetFieldOptions(),
            ])
            // 按sort字段排序
            const sortedOriginSourceOptions = (originSourceResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetSourceOptions = (targetSourceResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedOriginTableOptions = (originTableResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetTableOptions = (targetTableResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedOriginFieldOptions = (originFieldResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetFieldOptions = (targetFieldResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            setOriginSourceOptions(sortedOriginSourceOptions)
            setTargetSourceOptions(sortedTargetSourceOptions)
            setOriginTableOptions(sortedOriginTableOptions)
            setTargetTableOptions(sortedTargetTableOptions)
            setOriginFieldOptions(sortedOriginFieldOptions)
            setTargetFieldOptions(sortedTargetFieldOptions)
        } catch (error) {
            console.error('获取选项列表失败:', error)
            uiMessage.handleSystemError('获取选项列表失败')
        } finally {
            setOptionsLoading(false)
        }
    }

    /**
     * 从后端分页接口获取标准字典对照数据
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        condition?: string
        keyword?: string | null
        originSource?: number | null
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

            let originSourceValue: number | undefined
            if (options?.originSource !== undefined) {
                // 如果传入的是 null，表示清空，使用 undefined
                originSourceValue = options.originSource === null ? undefined : options.originSource
            } else {
                // 如果没有传入，使用状态变量
                originSourceValue = originSourceFilter
            }

            let statusValue: number | undefined
            if (options?.status !== undefined) {
                // 如果传入的是 null，表示清空，使用 undefined
                statusValue = options.status === null ? undefined : options.status
            } else {
                // 如果没有传入，使用状态变量
                statusValue = statusFilter
            }

            const params: StandardDictPageParams = {
                pageNum,
                pageSize,
                condition: options?.condition ? options.condition.trim() : undefined, // 保留 condition 用于关键字段模糊查询
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue, // keyword 字段
                originSource: originSourceValue,
                status: statusValue,
            }

            const response = await dataManagementService.getStandardDictPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapStandardDictRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取标准字典对照列表失败'
            uiMessage.handleSystemError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 处理搜索
     */
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
            originSource: originSourceFilter === undefined ? null : originSourceFilter,
            status: statusFilter === undefined ? null : statusFilter,
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
        setDatasetType('')
        setDatasetOptions([])
        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
        form.resetFields()
        form.setFieldsValue({
            status: true,
        })
        // 确保选项数据已加载
        if (originSourceOptions.length === 0 || targetSourceOptions.length === 0 || 
            originTableOptions.length === 0 || targetTableOptions.length === 0 ||
            originFieldOptions.length === 0 || targetFieldOptions.length === 0) {
            await fetchOptions()
        }
        setModalVisible(true)
    }

    const handleEdit = async (record: StandardDictionaryMapping) => {
        setEditingRecord(record)
        // 编辑时不清空数据集类型和选项，保持当前状态
        form.setFieldsValue({
            ...record,
            status: record.status === 'active',
        })
        // 确保选项数据已加载
        if (originSourceOptions.length === 0 || targetSourceOptions.length === 0 || 
            originTableOptions.length === 0 || targetTableOptions.length === 0 ||
            originFieldOptions.length === 0 || targetFieldOptions.length === 0) {
            await fetchOptions()
        }
        setModalVisible(true)
    }

    const handleDelete = async (record: StandardDictionaryMapping) => {
        try {
            await dataManagementService.deleteStandardDict(record.id)
            message.success('删除成功')
            // 删除成功后刷新列表
            void fetchData({
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '删除失败'
            uiMessage.handleSystemError(errMsg)
        }
    }

    const handleView = (record: StandardDictionaryMapping) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            // 根据原始数据源label找到对应的originSource（数字）和originSourceName
            const originDataSourceLabel = values.originalDataSource
            const originSourceOption = originSourceOptions.find(option => option.label === originDataSourceLabel)
            if (!originSourceOption) {
                uiMessage.handleSystemError('请选择有效的原始数据源', true)
                return
            }
            const originSource = Number(originSourceOption.value)
            const originSourceName = originSourceOption.label

            // 将表单数据转换为接口需要的格式
            const requestData = {
                standardName: values.standardName,
                standardDataSetName: values.standardDatasetName,
                standardDataSetContent: values.standardDatasetContent,
                originSource,
                originSourceName,
                originTable: values.originalTableName,
                originField: values.originalDataField,
                originDataSet: values.originalDataset,
                targetSource: values.targetDataSource,
                targetTable: values.targetTableName,
                targetField: values.targetField,
                status: values.status ? 1 : 0, // boolean 转换为 0/1
                remark: values.remark || '', // 备注字段
            }

            if (editingRecord) {
                // 编辑：需要包含 id
                await dataManagementService.updateStandardDict({
                    id: editingRecord.id,
                    ...requestData,
                })
                message.success('更新成功')
            } else {
                // 新增
                await dataManagementService.addStandardDict(requestData)
                message.success('创建成功')
            }

            // 关闭弹窗并重置表单
            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
            setDatasetType('')
            setDatasetOptions([])
            setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })

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
        setEditingRecord(null)
        setDatasetType('')
        setDatasetOptions([])
        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
    }

    // Excel导出功能
    const handleExport = async () => {
        try {
            // 构建导出参数，使用当前的查询条件
            let keywordValue: string | undefined
            keywordValue = searchText ? searchText.trim() : undefined

            let originSourceValue: number | undefined
            originSourceValue = originSourceFilter

            let statusValue: number | undefined
            statusValue = statusFilter

            const exportParams: StandardDictPageParams = {
                pageNum: 1,
                pageSize: 10000, // 导出时使用较大的pageSize以获取所有数据
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue,
                originSource: originSourceValue,
                status: statusValue,
            }

            const response = await dataManagementService.getStandardDictPage(exportParams)
            const exportData = response.data.records.map(mapStandardDictRecordToModel).map(item => ({
                ...item,
                status: item.status === 'active' ? '启用' : '禁用',
            }))

            const exportColumns = [
                { title: '标准名称', dataIndex: 'standardName', key: 'standardName' },
                {
                    title: '标准数据集名称',
                    dataIndex: 'standardDatasetName',
                    key: 'standardDatasetName',
                },
                {
                    title: '标准数据集内容',
                    dataIndex: 'standardDatasetContent',
                    key: 'standardDatasetContent',
                },
                {
                    title: '原始数据源',
                    dataIndex: 'originalDataSource',
                    key: 'originalDataSource',
                },
                {
                    title: '原始表',
                    dataIndex: 'originalTableName',
                    key: 'originalTableName',
                },
                {
                    title: '原始字段',
                    dataIndex: 'originalDataField',
                    key: 'originalDataField',
                },
                {
                    title: '原始数据集',
                    dataIndex: 'originalDataset',
                    key: 'originalDataset',
                },
                {
                    title: '目标数据源',
                    dataIndex: 'targetDataSource',
                    key: 'targetDataSource',
                },
                {
                    title: '目标表',
                    dataIndex: 'targetTableName',
                    key: 'targetTableName',
                },
                { title: '目标字段', dataIndex: 'targetField', key: 'targetField' },
                { title: '状态', dataIndex: 'status', key: 'status' },
                { title: '创建人', dataIndex: 'creator', key: 'creator' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
            ]

            exportToExcel(exportData, exportColumns, '标准字典关系对照')
            message.success('导出成功')
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '导出失败'
            uiMessage.handleSystemError(errMsg)
            console.error('导出失败:', error)
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<StandardDictionaryMapping>>(file, {
                columnMapping: {
                    '标准名称': 'standardName',
                    '标准数据集名称': 'standardDatasetName',
                    '标准数据集内容': 'standardDatasetContent',
                    '原始数据源': 'originalDataSource',
                    '原始表': 'originalTableName',
                    '原始字段': 'originalDataField',
                    '原始数据集': 'originalDataset',
                    '目标数据源': 'targetDataSource',
                    '目标表': 'targetTableName',
                    '目标字段': 'targetField',
                    '状态': 'status',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.standardName || !row.standardDatasetName) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    const transformed: Partial<StandardDictionaryMapping> = {
                        standardName: String(row.standardName || '').trim(),
                        standardDatasetName: String(row.standardDatasetName || '').trim(),
                        standardDatasetContent: String(row.standardDatasetContent || '').trim(),
                        originalDataSource: String(row.originalDataSource || '').trim(),
                        originalTableName: String(row.originalTableName || '').trim(),
                        originalDataField: String(row.originalDataField || '').trim(),
                        originalDataset: String(row.originalDataset || '').trim(),
                        targetDataSource: String(row.targetDataSource || '').trim(),
                        targetTableName: String(row.targetTableName || '').trim(),
                        targetField: String(row.targetField || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === 'active' ||
                            String(row.status || '').trim() === 'ACTIVE'
                                ? 'active'
                                : 'inactive',
                    }
                    return transformed as StandardDictionaryMapping
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 添加到数据列表
            const newData: StandardDictionaryMapping[] = importedData
                .filter(item => item.standardName && item.standardDatasetName) // 再次过滤确保必填字段存在
                .map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    standardName: item.standardName || '',
                    standardDatasetName: item.standardDatasetName || '',
                    standardDatasetContent: item.standardDatasetContent || '',
                    originalDataSource: item.originalDataSource || '',
                    originalTableName: item.originalTableName || '',
                    originalDataField: item.originalDataField || '',
                    originalDataset: item.originalDataset || '',
                    targetDataSource: item.targetDataSource || '',
                    targetTableName: item.targetTableName || '',
                    targetField: item.targetField || '',
                    status: item.status || 'active',
                    createTime: new Date().toLocaleString('zh-CN'),
                    updateTime: new Date().toLocaleString('zh-CN'),
                    creator: '当前用户',
                }))

            setData([...data, ...newData])
            message.success(`成功导入 ${importedData.length} 条数据`)
            return false // 阻止自动上传
        } catch (error) {
            console.error('导入失败:', error)
            uiMessage.handleSystemError('导入失败，请检查文件格式', true)
            return false
        }
    }

    // 下载导入模板
    const handleDownloadTemplate = () => {
        const templateColumns = [
            { title: '标准名称', dataIndex: 'standardName' },
            { title: '标准数据集名称', dataIndex: 'standardDatasetName' },
            { title: '标准数据集内容', dataIndex: 'standardDatasetContent' },
            { title: '原始数据源', dataIndex: 'originalDataSource' },
            { title: '原始表', dataIndex: 'originalTableName' },
            { title: '原始字段', dataIndex: 'originalDataField' },
            { title: '原始数据集', dataIndex: 'originalDataset' },
            { title: '目标数据源', dataIndex: 'targetDataSource' },
            { title: '目标表', dataIndex: 'targetTableName' },
            { title: '目标字段', dataIndex: 'targetField' },
            { title: '状态', dataIndex: 'status' },
        ]
        downloadExcelTemplate(templateColumns, '标准字典关系对照')
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
                uiMessage.handleSystemError('只支持 Excel 格式的文件！', true)
                return false
            }
            const isLt5M = file.size / 1024 / 1024 < 5
            if (!isLt5M) {
                uiMessage.handleSystemError('文件大小不能超过 5MB！', true)
                return false
            }
            handleImport(file)
            return false // 阻止自动上传
        },
    }

    // 获取所有数据源用于筛选（从当前数据中提取）
    const dataSources = Array.from(new Set(data.map(item => item.originalDataSource)))
    // 获取所有标准名称用于筛选（从当前数据中提取）
    const standardNames = Array.from(new Set(data.map(item => item.standardName)))

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
            title: '原始数据源',
            dataIndex: 'originalDataSource',
            key: 'originalDataSource',
            width: 120,
            render: (text: string) => <Tag color='orange'>{text}</Tag>,
        },
        {
            title: '原始表',
            dataIndex: 'originalTableName',
            key: 'originalTableName',
            width: 180,
        },
        {
            title: '原始字段',
            dataIndex: 'originalDataField',
            key: 'originalDataField',
            width: 120,
            render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
        },
        {
            title: '原始数据集',
            dataIndex: 'originalDataset',
            key: 'originalDataset',
            width: 150,
            render: (text: string) => <Tag color='purple'>{text}</Tag>,
        },
        {
            title: '目标源',
            dataIndex: 'targetDataSource',
            key: 'targetDataSource',
            width: 120,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '目标表',
            dataIndex: 'targetTableName',
            key: 'targetTableName',
            width: 180,
        },
        {
            title: '目标字段',
            dataIndex: 'targetField',
            key: 'targetField',
            width: 120,
            render: (text: string) => <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
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
                        description='确定要删除这条记录吗？删除后无法恢复。'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                        okButtonProps={{ danger: true }}
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
                    <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData({ pageNum: pagination.current, pageSize: pagination.pageSize })}>
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
                        <Search
                            placeholder='搜索标准名称、数据集名称、表名、字段名等'
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
                            placeholder='选择原始数据源'
                            style={{ width: 180 }}
                            value={originSourceFilter}
                            onChange={(value) => {
                                setOriginSourceFilter(value)
                                // 当清空时，value 为 undefined，需要明确传入 null
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    keyword: searchText || null,
                                    originSource: value === undefined ? null : value,
                                    status: statusFilter === undefined ? null : statusFilter,
                                })
                            }}
                            allowClear
                        >
                            <Option value={1}>HIS系统</Option>
                            <Option value={2}>EMR系统</Option>
                            <Option value={3}>LIS系统</Option>
                            <Option value={4}>PACS系统</Option>
                        </Select>
                        <Select
                            placeholder='选择状态'
                            style={{ width: 150 }}
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value)
                                // 当清空时，value 为 undefined，需要明确传入 null
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    keyword: searchText || null,
                                    originSource: originSourceFilter === undefined ? null : originSourceFilter,
                                    status: value === undefined ? null : value,
                                })
                            }}
                            allowClear
                        >
                            <Option value={1}>启用</Option>
                            <Option value={0}>禁用</Option>
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
                    scroll={{ x: 1400 }}
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

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingRecord ? '编辑标准字典对照' : '新增标准字典对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={900}
                destroyOnClose
                okText='确定'
                cancelText='取消'
            >
                <Form form={form} layout='vertical'>
                    <div style={{ marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
                        <strong>标准信息</strong>
                    </div>
                    <Form.Item
                        name='standardName'
                        label='标准名称'
                        rules={[{ required: true, message: '请输入标准名称' }]}
                    >
                        <Input placeholder='请输入标准名称，如：患者基本信息' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetName'
                                label='标准数据集名称'
                                rules={[{ required: true, message: '请输入标准数据集名称' }]}
                            >
                                <Input placeholder='请输入标准数据集名称，如：性别' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetContent'
                                label='标准数据集内容'
                                rules={[{ required: true, message: '请输入标准数据集内容' }]}
                            >
                                <Input placeholder='请输入标准数据集内容，如：男' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                        <strong>原始数据</strong>
                    </div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='originalDataSource'
                                label='原始数据源'
                                rules={[{ required: true, message: '请选择原始数据源' }]}
                            >
                                <Select 
                                    placeholder='请选择原始数据源'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {originSourceOptions.map(option => (
                                        <Option key={option.value} value={option.label}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='originalTableName'
                                label='原始表'
                                rules={[{ required: true, message: '请选择原始表' }]}
                            >
                                <Select 
                                    placeholder='请选择原始表'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {originTableOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='originalDataField'
                                label='原始字段'
                                rules={[{ required: true, message: '请选择原始字段' }]}
                            >
                                <Select 
                                    placeholder='请选择原始字段'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {originFieldOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='datasetType'
                                label='数据集类型'
                                rules={[{ required: true, message: '请选择数据集类型' }]}
                            >
                                <Select 
                                    placeholder='请选择数据集类型'
                                    onChange={(value) => {
                                        setDatasetType(value as 'business' | 'medical' | 'status')
                                        setDatasetOptions([])
                                        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
                                        form.setFieldsValue({ originalDataset: undefined })
                                        if (value) {
                                            fetchDatasetOptions(value as 'business' | 'medical' | 'status', 1)
                                        }
                                    }}
                                >
                                    <Option value='business'>业务数据集</Option>
                                    <Option value='medical'>医疗字典集</Option>
                                    <Option value='status'>状态字典集</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='originalDataset'
                                label='原始数据集'
                                rules={[{ required: true, message: '请选择原始数据集' }]}
                            >
                                <Select 
                                    placeholder={datasetType ? '请选择原始数据集' : '请先选择数据集类型'}
                                    loading={datasetLoading}
                                    showSearch
                                    optionFilterProp='children'
                                    disabled={!datasetType}
                                    onPopupScroll={(e) => {
                                        const { target } = e
                                        if (target && (target as HTMLElement).scrollTop + (target as HTMLElement).offsetHeight === (target as HTMLElement).scrollHeight) {
                                            // 滚动到底部，加载更多
                                            if (datasetPagination.hasMore && !datasetLoading) {
                                                fetchDatasetOptions(datasetType as 'business' | 'medical' | 'status', datasetPagination.current + 1)
                                            }
                                        }
                                    }}
                                >
                                    {datasetOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                        <strong>目标数据</strong>
                    </div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='targetDataSource'
                                label='目标源'
                                rules={[{ required: true, message: '请选择目标源' }]}
                            >
                                <Select 
                                    placeholder='请选择目标源'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {targetSourceOptions.map(option => (
                                        <Option key={option.value} value={option.label}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='targetTableName'
                                label='目标表'
                                rules={[{ required: true, message: '请选择目标表' }]}
                            >
                                <Select 
                                    placeholder='请选择目标表'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {targetTableOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='targetField'
                                label='目标字段'
                                rules={[{ required: true, message: '请选择目标字段' }]}
                            >
                                <Select 
                                    placeholder='请选择目标字段'
                                    loading={optionsLoading}
                                    showSearch
                                    optionFilterProp='children'
                                >
                                    {targetFieldOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='status'
                        label='状态'
                        valuePropName='checked'
                        initialValue={true}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>

                    <Form.Item
                        name='remark'
                        label='备注'
                    >
                        <Input.TextArea 
                            rows={3} 
                            placeholder='请输入备注信息（可选）'
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情查看模态框 */}
            <Modal
                title='标准字典对照详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                {viewingRecord && (
                    <div>
                        <div style={{ marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
                            <strong>标准信息</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <div>
                                    <strong>标准名称：</strong>
                                    {viewingRecord.standardName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集名称：</strong>
                                    {viewingRecord.standardDatasetName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集内容：</strong>
                                    <Tag color='green'>{viewingRecord.standardDatasetContent}</Tag>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                            <strong>原始数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                    <strong>原始数据源：</strong>
                                    <Tag color='orange'>{viewingRecord.originalDataSource}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始表：</strong>
                                    {viewingRecord.originalTableName}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始字段：</strong>
                                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.originalDataField}
                                    </code>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>原始数据集：</strong>
                                    <Tag color='purple'>{viewingRecord.originalDataset}</Tag>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                            <strong>目标数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                    <strong>目标源：</strong>
                                    <Tag color='blue'>{viewingRecord.targetDataSource}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>目标表：</strong>
                                    {viewingRecord.targetTableName}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>目标字段：</strong>
                                    <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.targetField}
                                    </code>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <div>
                                    <strong>状态：</strong>
                                    <Tag color={viewingRecord.status === 'active' ? 'green' : 'red'}>
                                        {viewingRecord.status === 'active' ? '启用' : '禁用'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>创建人：</strong>
                                    {viewingRecord.creator}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>创建时间：</strong>
                                    {viewingRecord.createTime}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>更新时间：</strong>
                                    {viewingRecord.updateTime}
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

