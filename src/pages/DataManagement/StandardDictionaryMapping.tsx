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
    List,
    Empty,
    Spin,
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
import { databaseConnectionService } from '@/services/databaseConnectionService'
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
    StatusDictRecord,
    CategoryItem,
    DictionaryType,
    DbConnection,
    TableInfo,
    StandardDictRequest,
    DataStandardValueDTO,
    DataStandardDetailResponse,
    DataStandardVO,
    DictionaryTypeListResponse,
    DictionaryTypeItem
} from '@/types'
import CategoryFieldMapping, { type MappingItem } from '@/components/CategoryFieldMapping'
import { useDebounce } from '@/hooks/useDebounce'
import styles from './StandardDictionaryMapping.module.scss'

const { Search } = Input
const { Option } = Select
const { TextArea } = Input

// 直接使用接口返回的数据格式
type StandardDictionaryMapping = StandardDictRecord

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StandardDictRecord[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StandardDictRecord | null>(null)
    const [viewingRecord, setViewingRecord] = useState<StandardDictRecord | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
    const [originSourceFilter, setOriginSourceFilter] = useState<number | undefined>(undefined)
    
    // 数据源列表相关状态
    const [dataSourceList, setDataSourceList] = useState<DbConnection[]>([])
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null)
    const [dataSourceListLoading, setDataSourceListLoading] = useState(false)
    
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
    const [originFieldLoading, setOriginFieldLoading] = useState(false)
    const [optionsLoading, setOptionsLoading] = useState(false)
    
    // 原始字段值选项（用于映射）
    const [originFieldValueOptions, setOriginFieldValueOptions] = useState<Array<{ value: string; label: string }>>([])
    const [originFieldValueLoading, setOriginFieldValueLoading] = useState(false)

    // 数据集类型选项列表
    const [datasetTypeOptions, setDatasetTypeOptions] = useState<Array<{
        value: string
        label: string
        typeCode: string
    }>>([])
    const [datasetTypeLoading, setDatasetTypeLoading] = useState(false)

    // 原始数据集相关状态
    const [datasetType, setDatasetType] = useState<'business' | 'medical' | 'status' | ''>('')
    const [datasetOptions, setDatasetOptions] = useState<Array<{
        value: string
        label: string
        name: string
        code: string
        type: string
        id?: string // 数据集ID，用于转换为 dataSetId
    }>>([])
    const [datasetLoading, setDatasetLoading] = useState(false)
    const [datasetSearchKeyword, setDatasetSearchKeyword] = useState<string>('')
    const debouncedDatasetSearchKeyword = useDebounce(datasetSearchKeyword, 300)
    const [datasetPagination, setDatasetPagination] = useState<{ current: number; pageSize: number; total: number; hasMore: boolean }>({
        current: 1,
        pageSize: 20,
        total: 0,
        hasMore: true,
    })

    // 分类选项相关状态
    const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>([])
    const [categoryLoading, setCategoryLoading] = useState(false)
    // 弹窗数据加载状态
    const [modalDataLoading, setModalDataLoading] = useState(false)

    // 映射相关状态
    const [mappings, setMappings] = useState<MappingItem[]>([])

    useEffect(() => {
        fetchDataSourceList()
        fetchOptions()
        fetchTableList() // 获取原始表列表
        fetchDatasetTypeList() // 获取数据集类型列表
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 当选中数据源变化时，重新加载数据
    useEffect(() => {
        if (selectedDataSourceId) {
            fetchData({ pageNum: 1, pageSize: pagination.pageSize, dataSourceId: Number(selectedDataSourceId) })
        } else {
            setData([])
            setPagination(prev => ({ ...prev, current: 1, total: 0 }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDataSourceId])

    // 监听防抖后的搜索关键词，触发数据加载
    useEffect(() => {
        if (datasetType && form.getFieldValue('categoryId')) {
            const categoryId = form.getFieldValue('categoryId')
            setDatasetOptions([])
            setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
            fetchDatasetOptions(
                datasetType as 'business' | 'medical' | 'status',
                1,
                categoryId,
                debouncedDatasetSearchKeyword
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedDatasetSearchKeyword, datasetType])

    /**
     * 获取数据源列表
     */
    const fetchDataSourceList = async () => {
        setDataSourceListLoading(true)
        try {
            const result = await databaseConnectionService.getDbConnectionPage({
                pageNo: 1,
                pageSize: 1000, // 获取所有数据源
            })
            setDataSourceList(result.list || [])
            // 如果有数据源，默认选中第一个
            if (result.list && result.list.length > 0 && !selectedDataSourceId) {
                setSelectedDataSourceId(result.list[0]!.id)
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取数据源列表失败'
            uiMessage.handleSystemError(errMsg)
        } finally {
            setDataSourceListLoading(false)
        }
    }

    /**
     * 获取数据集类型列表
     */
    const fetchDatasetTypeList = async () => {
        setDatasetTypeLoading(true)
        try {
            console.log('开始调用获取数据集类型列表接口...')
            const response = await dataManagementService.getDictionaryTypeList()
            console.log('获取数据集类型列表接口响应:', response)
            const types = response.data || []
            console.log('数据集类型数据:', types)
            // 将字典类型转换为数据集类型选项
            // typeCode: STATUS -> value: status, BUSINESS -> business, MEDICAL -> medical
            const typeOptions = types
                .filter(item => item.typeStatus === 1) // 只显示启用的类型
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) // 按排序字段排序
                .map(item => {
                    // 将 typeCode 转换为小写作为 value
                    const value = item.typeCode.toLowerCase()
                    return {
                        value,
                        label: item.typeName,
                        typeCode: item.typeCode,
                    }
                })
            console.log('转换后的数据集类型选项:', typeOptions)
            setDatasetTypeOptions(typeOptions)
        } catch (error) {
            console.error('获取数据集类型列表失败:', error)
            uiMessage.handleSystemError('获取数据集类型列表失败')
            setDatasetTypeOptions([])
        } finally {
            setDatasetTypeLoading(false)
        }
    }

    /**
     * 根据数据集类型获取分类选项
     * @returns 返回加载的分类列表
     */
    const fetchCategoryOptions = async (type: 'business' | 'medical' | 'status'): Promise<CategoryItem[]> => {
        if (!type) {
            setCategoryOptions([])
            return []
        }

        setCategoryLoading(true)
        try {
            // 将数据集类型转换为字典类型
            const dictionaryType: DictionaryType = 
                type === 'business' ? 'BUSINESS' :
                type === 'medical' ? 'MEDICAL' :
                'STATUS'
            
            const response = await dataManagementService.getCategoryListByDictionaryType(dictionaryType)
            const categories = response.data || []
            setCategoryOptions(categories)
            return categories
        } catch (error) {
            console.error('获取分类选项失败:', error)
            uiMessage.handleSystemError('获取分类选项失败')
            setCategoryOptions([])
            return []
        } finally {
            setCategoryLoading(false)
        }
    }


    /**
     * 根据数据集类型和分类ID获取数据集选项（支持分页和搜索）
     * @returns 返回新加载的选项数组
     */
    const fetchDatasetOptions = async (
        type: 'business' | 'medical' | 'status', 
        pageNum: number = 1,
        categoryId?: string,
        searchKeyword?: string
    ): Promise<Array<{
        value: string
        label: string
        name: string
        code: string
        type: string
        id?: string
    }>> => {
        if (!type) return []

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
                    categoryId: categoryId || undefined, // 根据分类ID筛选
                    condition: searchKeyword && searchKeyword.trim() ? searchKeyword.trim() : undefined, // 搜索关键词
                })
                const records = (response.data.records || []) as BusinessDatasetRecord[]
                const newOptions = records.map(record => ({
                    value: record.dataSetCode || record.id,
                    label: `${record.dataSetName}（${record.dataSetCode}）- ${record.dataSource || '业务数据集'}`,
                    name: record.dataSetName,
                    code: record.dataSetCode,
                    type: record.dataSource || '业务数据集',
                    id: record.id, // 保存数据集ID
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
                return newOptions
            } else if (type === 'medical') {
                // 医疗字典 - 使用 dictName 进行搜索（通常名称搜索更常用）
                response = await dataManagementService.getMedicalDictPage({
                    pageNum,
                    pageSize,
                    sortField: 'create_time',
                    sortOrder: 'desc',
                    categoryId: categoryId || undefined, // 根据分类ID筛选
                    dictName: searchKeyword && searchKeyword.trim() ? searchKeyword.trim() : undefined, // 搜索字典名称或编码
                })
                const records = (response.data.records || []) as MedicalDictRecord[]
                const newOptions = records.map(record => ({
                    value: record.dictCode || record.id,
                    label: `${record.dictName}（${record.dictCode}）- ${record.source || '医疗字典'}`,
                    name: record.dictName,
                    code: record.dictCode,
                    type: record.source || '医疗字典',
                    id: record.id, // 保存数据集ID
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
                return newOptions
            } else if (type === 'status') {
                // 状态字典
                response = await dataManagementService.getStatusDictPage({
                    pageNum,
                    pageSize,
                    sortField: 'create_time',
                    sortOrder: 'desc',
                    categoryId: categoryId || undefined, // 根据分类ID筛选
                    keyword: searchKeyword && searchKeyword.trim() ? searchKeyword.trim() : undefined, // 搜索关键词
                })
                const records = (response.data.records || []) as StatusDictRecord[]
                const newOptions = records.map(record => ({
                    value: record.dictCode || record.id,
                    label: `${record.dictName}（${record.dictCode}）- 状态字典`,
                    name: record.dictName,
                    code: record.dictCode,
                    type: '状态字典',
                    id: record.id, // 保存数据集ID
                }))
                setDatasetOptions(prev => pageNum === 1 ? newOptions : [...prev, ...newOptions])
                setDatasetPagination({
                    current: Number(response.data.current) || pageNum,
                    pageSize: Number(response.data.size) || pageSize,
                    total: Number(response.data.total) || 0,
                    hasMore: Number(response.data.current) < Number(response.data.pages),
                })
                return newOptions
            }
            return []
        } catch (error) {
            console.error('获取数据集选项失败:', error)
            uiMessage.handleSystemError('获取数据集选项失败')
            return []
        } finally {
            setDatasetLoading(false)
        }
    }

    /**
     * 获取原始表列表
     */
    const fetchTableList = async () => {
        setOptionsLoading(true)
        try {
            const response = await dataManagementService.getTableList()
            const tables = response.data || []
            // 将表信息转换为选项格式
            const tableOptions: OriginTableOption[] = tables.map(table => ({
                value: table.tableName,
                label: table.tableComment 
                    ? `${table.tableName}（${table.tableComment}）` 
                    : table.tableName,
                sort: 0,
            }))
            setOriginTableOptions(tableOptions)
        } catch (error) {
            console.error('获取表列表失败:', error)
            uiMessage.handleSystemError('获取表列表失败')
            setOriginTableOptions([])
        } finally {
            setOptionsLoading(false)
        }
    }

    /**
     * 根据表名获取字段列表
     */
    const fetchTableColumns = async (tableName: string) => {
        if (!tableName) {
            setOriginFieldOptions([])
            return
        }

        setOriginFieldLoading(true)
        try {
            const response = await dataManagementService.getTableColumns(tableName)
            const columns = response.data || []
            // 将字段信息转换为选项格式
            const fieldOptions: OriginFieldOption[] = columns.map(column => ({
                value: column.columnName,
                label: column.columnComment 
                    ? `${column.columnName}（${column.columnComment}）` 
                    : column.columnName,
                sort: 0,
            }))
            setOriginFieldOptions(fieldOptions)
        } catch (error) {
            console.error('获取字段列表失败:', error)
            uiMessage.handleSystemError('获取字段列表失败')
            setOriginFieldOptions([])
        } finally {
            setOriginFieldLoading(false)
        }
    }

    /**
     * 根据表名和字段名获取字段值列表
     */
    const fetchFieldValues = async (tableName: string, fieldName: string) => {
        if (!tableName || !fieldName) {
            setOriginFieldValueOptions([])
            return
        }

        setOriginFieldValueLoading(true)
        try {
            const response = await dataManagementService.getFieldValues({
                tableName,
                fieldName,
            })
            const fieldValues = response.data || []
            
            // 将字段值转换为选项格式
            // 数组中的对象的key就是字段名，值就是字段值
            const valueOptions = fieldValues.map((item, index) => {
                const value = item[fieldName]
                // 将值转换为字符串，如果是对象则序列化
                const valueStr = value !== null && value !== undefined 
                    ? String(value) 
                    : `value_${index}`
                return {
                    value: valueStr,
                    label: valueStr,
                }
            })
            setOriginFieldValueOptions(valueOptions)
        } catch (error) {
            console.error('获取字段值列表失败:', error)
            uiMessage.handleSystemError('获取字段值列表失败')
            setOriginFieldValueOptions([])
        } finally {
            setOriginFieldValueLoading(false)
        }
    }

    /**
     * 获取原始数据源选项、目标源选项、目标表选项和目标字段选项
     * 注意：原始字段选项现在通过表名动态获取，不再在这里获取
     */
    const fetchOptions = async () => {
        setOptionsLoading(true)
        try {
            const [
                originSourceResponse, 
                targetSourceResponse, 
                targetTableResponse,
                targetFieldResponse
            ] = await Promise.all([
                dataManagementService.getOriginSourceOptions(),
                dataManagementService.getTargetSourceOptions(),
                dataManagementService.getTargetTableOptions(),
                dataManagementService.getTargetFieldOptions(),
            ])
            // 按sort字段排序
            const sortedOriginSourceOptions = (originSourceResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetSourceOptions = (targetSourceResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetTableOptions = (targetTableResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            const sortedTargetFieldOptions = (targetFieldResponse.data || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
            setOriginSourceOptions(sortedOriginSourceOptions)
            setTargetSourceOptions(sortedTargetSourceOptions)
            setTargetTableOptions(sortedTargetTableOptions)
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
        keyword?: string | null
        dataSourceId?: number | null
        status?: number | null
    }) => {
        // 数据源ID是必填的，如果没有选中数据源，不执行查询
        const currentDataSourceId = options?.dataSourceId !== undefined 
            ? options.dataSourceId 
            : (selectedDataSourceId ? Number(selectedDataSourceId) : undefined)
        
        if (!currentDataSourceId) {
            setData([])
            setPagination(prev => ({ ...prev, current: 1, total: 0 }))
            return
        }

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
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue,
                dataSourceId: currentDataSourceId,
                status: statusValue,
            }

            const response = await dataManagementService.getStandardDictPage(params)
            const { records, total, size, current } = response.data
            setData(records)
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
        if (!selectedDataSourceId) {
            uiMessage.warning('请先选择数据源')
            return
        }
        // 重置到第一页并重新查询
        setPagination(prev => ({ ...prev, current: 1 }))
        // 如果 searchText 为空，明确传入 null 表示清空；否则传入实际值
        const keywordValue = searchText && searchText.trim() ? searchText.trim() : null
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            keyword: keywordValue,
            dataSourceId: Number(selectedDataSourceId),
        })
    }

    /**
     * 处理筛选条件变化
     */
    const handleFilterChange = () => {
        if (!selectedDataSourceId) {
            uiMessage.warning('请先选择数据源')
            return
        }
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            keyword: searchText || null, // 空字符串时传入 null
            dataSourceId: Number(selectedDataSourceId),
            status: statusFilter === undefined ? null : statusFilter,
        })
    }

    /**
     * 处理分页变化
     */
    const handleTableChange = (page: number, pageSize: number) => {
        if (!selectedDataSourceId) {
            return
        }
        setPagination(prev => ({ ...prev, current: page, pageSize }))
        void fetchData({ pageNum: page, pageSize, dataSourceId: Number(selectedDataSourceId) })
    }

    const handleAdd = async () => {
        if (!selectedDataSourceId) {
            uiMessage.warning('请先选择数据源')
            return
        }
        setEditingRecord(null)
        setDatasetType('')
        setDatasetOptions([])
        setCategoryOptions([])
        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
        setDatasetSearchKeyword('')
        setMappings([])
        form.resetFields()
        form.setFieldsValue({
            status: true,
            dataSourceId: selectedDataSourceId,
        })
        
        // 先打开弹窗
        setModalVisible(true)
        setModalDataLoading(true)
        
        // 在后台异步加载选项数据
        try {
            // 确保选项数据已加载
            if (originTableOptions.length === 0) {
                await fetchTableList()
            }
            // 加载数据集类型选项
            if (datasetTypeOptions.length === 0) {
                await fetchDatasetTypeList()
            }
        } catch (error) {
            console.error('加载选项数据失败:', error)
            uiMessage.handleSystemError('加载选项数据失败')
        } finally {
            setModalDataLoading(false)
        }
    }

    const handleEdit = async (record: StandardDictRecord) => {
        try {
            setEditingRecord(record)
            
            // 先打开弹窗并显示 loading
            setModalVisible(true)
            setModalDataLoading(true)
            
            // 重置表单和状态
            setDatasetType('')
            setDatasetOptions([])
            setCategoryOptions([])
            setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
            setDatasetSearchKeyword('')
            setMappings([])
            form.resetFields()
            
            // 在后台异步加载数据
            // 调用详情接口获取完整数据
            const detailResponse = await dataManagementService.getStandardDictDetail(record.id)
            const detailData = detailResponse.data
            
            if (!detailData) {
                uiMessage.handleSystemError('获取详情数据失败', true)
                setModalDataLoading(false)
                return
            }

            // 确保数据集类型选项已加载（必须在推断类型之前加载，否则下拉框无法显示）
            if (datasetTypeOptions.length === 0) {
                await fetchDatasetTypeList()
            }

            // 根据业务类型ID推断数据集类型（与保存逻辑保持一致：business=1, medical=2, status=3）
            const businessTypeId = detailData.businessTypeId
            console.log('编辑时获取的 businessTypeId:', businessTypeId, '类型:', typeof businessTypeId, 'datasetTypeOptions:', datasetTypeOptions)
            let inferredDatasetType: 'business' | 'medical' | 'status' | '' = ''
            // 处理 number 和 string 类型
            const typeId = typeof businessTypeId === 'string' ? Number(businessTypeId) : businessTypeId
            if (typeId === 1) {
                inferredDatasetType = 'business'
            } else if (typeId === 2) {
                inferredDatasetType = 'medical'
            } else if (typeId === 3) {
                inferredDatasetType = 'status'
            }
            console.log('推断的数据集类型:', inferredDatasetType)

            // 设置数据集类型
            if (inferredDatasetType) {
                setDatasetType(inferredDatasetType)
                // 先加载分类选项（必须等待完成，因为表单需要分类选项才能回显）
                await fetchCategoryOptions(inferredDatasetType)
            } else {
                console.warn('无法推断数据集类型，businessTypeId:', businessTypeId)
            }
            if (originTableOptions.length === 0) {
                await fetchTableList()
            }

            // 加载原始表字段列表
            if (detailData.originTable) {
                await fetchTableColumns(detailData.originTable)
            }

            // 加载原始字段值列表
            if (detailData.originTable && detailData.originField) {
                await fetchFieldValues(detailData.originTable, detailData.originField)
            }

            // 加载分类下的数据集选项（用于映射，必须在设置表单值之前加载）
            // 如果 valueList 中有映射数据，需要确保所有相关的数据集选项都已加载
            let allLoadedOptionsForMapping: Array<{ value: string; label: string; id?: string }> = []
            if (detailData.businessCategoryId && inferredDatasetType) {
                // 先加载第一页
                const firstPageOptions = await fetchDatasetOptions(inferredDatasetType, 1, String(detailData.businessCategoryId), '')
                
                // 使用局部变量跟踪已加载的选项
                let allLoadedOptions = [...firstPageOptions]
                allLoadedOptionsForMapping = [...firstPageOptions]
                
                // 如果 valueList 中有映射数据，尝试加载更多页以确保所有数据集选项都已加载
                if (detailData.valueList && detailData.valueList.length > 0) {
                    const dataSetIds = detailData.valueList
                        .map(item => item.dataSetId)
                        .filter(id => id !== null && id !== undefined)
                        .map(id => String(id))
                    
                    console.log('需要匹配的 dataSetIds:', dataSetIds)
                    console.log('第一页加载的选项数:', firstPageOptions.length)
                    
                    // 检查是否所有 dataSetId 都在已加载的选项中
                    let missingIds = dataSetIds.filter(id => !allLoadedOptions.some(opt => String(opt.id) === id))
                    console.log('未找到匹配的 dataSetIds:', missingIds)
                    
                    // 如果有未匹配的 id，尝试加载更多页（最多加载10页）
                    if (missingIds.length > 0 && datasetPagination.hasMore) {
                        let currentPage = 1
                        const maxPages = 10
                        while (currentPage < maxPages && datasetPagination.hasMore && missingIds.length > 0) {
                            currentPage++
                            console.log(`加载第 ${currentPage} 页数据集选项，查找缺失的 id:`, missingIds)
                            
                            // 调用 fetchDatasetOptions 并获取返回的新选项
                            const newOptions = await fetchDatasetOptions(
                                inferredDatasetType, 
                                currentPage, 
                                String(detailData.businessCategoryId), 
                                ''
                            )
                            
                            // 将新选项添加到已加载选项列表
                            allLoadedOptions = [...allLoadedOptions, ...newOptions]
                            allLoadedOptionsForMapping = [...allLoadedOptionsForMapping, ...newOptions]
                            
                            // 重新检查缺失的 id
                            const previousMissingCount = missingIds.length
                            missingIds = dataSetIds.filter(id => !allLoadedOptions.some(opt => String(opt.id) === id))
                            
                            console.log(`第 ${currentPage} 页加载后，已加载选项数:`, allLoadedOptions.length, '仍缺失:', missingIds.length)
                            
                            // 如果没有新的匹配，停止加载
                            if (missingIds.length === previousMissingCount) {
                                console.log('没有新的匹配，停止加载更多页')
                                break
                            }
                            
                            // 如果所有 id 都已找到，停止加载
                            if (missingIds.length === 0) {
                                console.log('所有 dataSetId 都已找到，停止加载')
                                break
                            }
                        }
                    }
                    
                    // 最终检查
                    const finalMissingIds = dataSetIds.filter(id => !allLoadedOptions.some(opt => String(opt.id) === id))
                    if (finalMissingIds.length > 0) {
                        console.warn('以下 dataSetId 在已加载的选项中未找到:', finalMissingIds)
                        console.warn('已加载的选项 ID 列表:', allLoadedOptions.map(opt => opt.id))
                    } else {
                        console.log('所有 dataSetId 都已找到匹配的选项')
                    }
                }
            }

            // 所有数据加载完成后再设置表单值
            // 确保 datasetType 值在 datasetTypeOptions 中存在
            const validDatasetType = datasetTypeOptions.find(opt => opt.value === inferredDatasetType) 
                ? inferredDatasetType 
                : ''
            console.log('设置表单值，datasetType:', inferredDatasetType, 'validDatasetType:', validDatasetType, 'datasetTypeOptions:', datasetTypeOptions)
            
            form.setFieldsValue({
                standardName: detailData.standardName,
                dataSourceId: String(detailData.dataSourceId || ''),
                datasetType: validDatasetType,
                categoryId: String(detailData.businessCategoryId || ''),
                originalTableName: detailData.originTable,
                originalDataField: detailData.originField,
                status: detailData.status === 1,
                remark: detailData.remark || '',
            })
            
            // 验证表单值是否设置成功
            setTimeout(() => {
                const formDatasetType = form.getFieldValue('datasetType')
                console.log('表单中的 datasetType 值:', formDatasetType, '是否在选项中:', datasetTypeOptions.some(opt => opt.value === formDatasetType))
            }, 100)

            // 转换并设置映射数据
            // 注意：使用 allLoadedOptionsForMapping 而不是 datasetOptions 状态，因为状态更新是异步的
            if (detailData.valueList && detailData.valueList.length > 0) {
                console.log('开始转换映射数据，valueList:', detailData.valueList)
                console.log('使用 allLoadedOptionsForMapping 进行匹配，选项数:', allLoadedOptionsForMapping.length)
                console.log('allLoadedOptionsForMapping 示例:', allLoadedOptionsForMapping.slice(0, 3).map(opt => ({ id: opt.id, value: opt.value, label: opt.label })))
                
                const convertedMappings: MappingItem[] = detailData.valueList.map((item, index) => {
                    // 处理 dataSetId 可能是 number 或 string 的情况
                    const dataSetId = item.dataSetId !== null && item.dataSetId !== undefined 
                        ? String(item.dataSetId) 
                        : ''
                    
                    console.log(`映射项 ${index}: dataSetId=${dataSetId}, 类型=${typeof item.dataSetId}`)
                    
                    // 从已加载的数据集选项中查找匹配的 value（使用 allLoadedOptionsForMapping 而不是 datasetOptions）
                    // 下拉框的 value 是 dataSetCode || id，所以需要查找 id 匹配的选项
                    const matchedOption = allLoadedOptionsForMapping.find(opt => {
                        const optId = String(opt.id || '')
                        const match = optId === dataSetId
                        if (match) {
                            console.log(`找到匹配选项: id=${opt.id}, value=${opt.value}, label=${opt.label}`)
                        }
                        return match
                    })
                    
                    if (!matchedOption) {
                        console.warn(`映射项 ${index}: 未找到匹配的选项，dataSetId=${dataSetId}`)
                        console.warn('可用的选项 ID:', allLoadedOptionsForMapping.map(opt => opt.id).slice(0, 10))
                    }
                    
                    // 如果找到匹配的选项，使用其 value；否则使用 dataSetId（虽然可能无法正确显示，但至少不会报错）
                    const datasetValue = matchedOption ? matchedOption.value : dataSetId
                    console.log(`映射项 ${index}: 最终 datasetValue=${datasetValue}`)
                    
                    return {
                        id: `mapping_${item.id || index}`,
                        datasetValue: datasetValue,
                        originFieldValue: item.originValue || '',
                    }
                })
                console.log('转换后的映射数据:', convertedMappings)
                
                // 等待 datasetOptions 状态更新完成后再设置映射数据
                // 这样可以确保 Select 组件能够找到对应的选项并显示 label
                await new Promise(resolve => setTimeout(resolve, 100))
                
                setMappings(convertedMappings)
            } else {
                setMappings([])
            }
            
            // 确保选项数据已加载
            if (originTableOptions.length === 0) {
                await fetchTableList()
            }
            
            // 数据加载完成，关闭 loading
            setModalDataLoading(false)
        } catch (error) {
            console.error('获取详情失败:', error)
            uiMessage.handleSystemError('获取详情数据失败', true)
            // 发生错误时也要关闭 loading
            setModalDataLoading(false)
        }
    }

    const handleDelete = async (record: StandardDictRecord) => {
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

    const handleView = async (record: StandardDictRecord) => {
        try {
            setViewingRecord(record)
            
            // 调用详情接口获取完整数据
            const detailResponse = await dataManagementService.getStandardDictDetail(record.id)
            const detailData = detailResponse.data
            
            if (!detailData) {
                uiMessage.handleSystemError('获取详情数据失败', true)
                return
            }

            // 直接使用详情数据，确保所有字段类型正确
            setViewingRecord({
                ...detailData,
                id: String(detailData.id || record.id),
                dataSourceId: String(detailData.dataSourceId || ''),
                businessTypeId: String(detailData.businessTypeId || ''),
                businessCategoryId: String(detailData.businessCategoryId || ''),
                // 确保 valueList 存在
                valueList: detailData.valueList || [],
            } as unknown as StandardDictRecord)
            
            setDetailModalVisible(true)
        } catch (error) {
            console.error('获取详情失败:', error)
            uiMessage.handleSystemError('获取详情数据失败', true)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            // 数据源ID是必填的
            if (!values.dataSourceId) {
                uiMessage.handleSystemError('请选择数据源', true)
                return
            }

            // 获取选中的数据源信息
            const selectedDataSource = dataSourceList.find(ds => ds.id === values.dataSourceId)
            if (!selectedDataSource) {
                uiMessage.handleSystemError('请选择有效的数据源', true)
                return
            }

            // 根据数据集类型推断业务类型ID（business=1, medical=2, status=3）
            const businessTypeId = 
                datasetType === 'business' ? '1' :
                datasetType === 'medical' ? '2' :
                datasetType === 'status' ? '3' : undefined

            // 将映射数据转换为 valueList 格式
            const valueList: DataStandardValueDTO[] = mappings.map(mapping => {
                // 从 datasetOptions 中查找对应的数据集ID
                const datasetOption = datasetOptions.find(opt => opt.value === mapping.datasetValue)
                const dataSetId = datasetOption?.id ? String(datasetOption.id) : undefined
                
                return {
                    dataSetId,
                    originValue: mapping.originFieldValue,
                    // 编辑时如果有 id，需要传递（这里暂时不处理，由后端返回）
                }
            })

            // 将表单数据转换为接口需要的格式
            const requestData: StandardDictRequest = {
                standardName: values.standardName,
                originTable: values.originalTableName,
                originField: values.originalDataField,
                businessCategoryId: values.categoryId ? String(values.categoryId) : undefined,
                businessTypeId,
                dataSourceId: String(values.dataSourceId),
                status: values.status ? 1 : 0, // boolean 转换为 0/1，1=启用，0=禁用
                remark: values.remark || undefined, // 备注字段
                valueList: valueList.length > 0 ? valueList : undefined, // 子表数据列表
            }

            if (editingRecord) {
                // 编辑：需要包含 id
                await dataManagementService.updateStandardDict({
                    ...requestData,
                    id: String(editingRecord.id), // 主键ID，修改必填
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
            setCategoryOptions([])
            setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
            setDatasetSearchKeyword('')
            setMappings([])

            // 刷新列表（回到第一页，显示最新数据）
            setPagination(prev => ({ ...prev, current: 1 }))
            if (selectedDataSourceId) {
                void fetchData({
                    pageNum: 1,
                    pageSize: pagination.pageSize,
                    dataSourceId: Number(selectedDataSourceId),
                })
            }
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
        setCategoryOptions([])
        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
        setDatasetSearchKeyword('')
        setMappings([])
    }

    // Excel导出功能
    const handleExport = async () => {
        try {
            if (!selectedDataSourceId) {
                uiMessage.warning('请先选择数据源')
                return
            }

            // 构建导出参数，使用当前的查询条件
            let keywordValue: string | undefined
            keywordValue = searchText ? searchText.trim() : undefined

            let statusValue: number | undefined
            statusValue = statusFilter

            const exportParams: StandardDictPageParams = {
                pageNum: 1,
                pageSize: 10000, // 导出时使用较大的pageSize以获取所有数据
                sortField: 'create_time',
                sortOrder: 'desc',
                keyword: keywordValue,
                dataSourceId: Number(selectedDataSourceId),
                status: statusValue,
            }

            const response = await dataManagementService.getStandardDictPage(exportParams)
            const exportData = response.data.records.map(item => ({
                ...item,
                status: item.status === 1 ? '启用' : '禁用',
            }))

            const exportColumns = [
                { title: '标准名称', dataIndex: 'standardName', key: 'standardName' },
                {
                    title: '数据源',
                    dataIndex: 'dataSourceName',
                    key: 'dataSourceName',
                },
                {
                    title: '数据库类型',
                    dataIndex: 'dbType',
                    key: 'dbType',
                },
                {
                    title: '数据库主机',
                    dataIndex: 'dbHost',
                    key: 'dbHost',
                },
                {
                    title: '数据库端口',
                    dataIndex: 'dbPort',
                    key: 'dbPort',
                },
                {
                    title: '数据库名称',
                    dataIndex: 'dbName',
                    key: 'dbName',
                },
                {
                    title: '业务类型',
                    dataIndex: 'businessTypeName',
                    key: 'businessTypeName',
                },
                {
                    title: '业务分类',
                    dataIndex: 'businessCategoryName',
                    key: 'businessCategoryName',
                },
                {
                    title: '原始表',
                    dataIndex: 'originTable',
                    key: 'originTable',
                },
                {
                    title: '原始字段',
                    dataIndex: 'originField',
                    key: 'originField',
                },
                {
                    title: '描述',
                    dataIndex: 'description',
                    key: 'description',
                },
                {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                },
                {
                    title: '备注',
                    dataIndex: 'remark',
                    key: 'remark',
                },
                { title: '创建人', dataIndex: 'createBy', key: 'createBy' },
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
                    if (!row.standardName) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    const transformed: Partial<StandardDictionaryMapping> = {
                        standardName: String(row.standardName || '').trim(),
                        standardDatasetName: '', // 已删除字段
                        standardDatasetContent: '', // 已删除字段
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
                .filter(item => item.standardName) // 再次过滤确保必填字段存在
                .map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    standardName: item.standardName || '',
                    standardDatasetName: '', // 已删除字段
                    standardDatasetContent: '', // 已删除字段
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
    const dataSources = Array.from(new Set(data.map(item => item.dataSourceName).filter(Boolean)))
    // 获取所有标准名称用于筛选（从当前数据中提取）
    const standardNames = Array.from(new Set(data.map(item => item.standardName)))

    const columns: ColumnsType<StandardDictRecord> = [
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
            title: '数据源',
            dataIndex: 'dataSourceName',
            key: 'dataSourceName',
            width: 150,
            render: (text: string) => <Tag color='orange'>{text || '-'}</Tag>,
        },
        {
            title: '数据库类型',
            dataIndex: 'dbType',
            key: 'dbType',
            width: 100,
        },
        {
            title: '数据库连接',
            key: 'dbConnection',
            width: 200,
            render: (_, record: StandardDictRecord) => {
                if (record.dbHost && record.dbPort && record.dbName) {
                    return `${record.dbHost}:${record.dbPort}/${record.dbName}`
                }
                return '-'
            },
        },
        {
            title: '业务类型',
            dataIndex: 'businessTypeName',
            key: 'businessTypeName',
            width: 120,
            render: (text: string) => <Tag color='blue'>{text || '-'}</Tag>,
        },
        {
            title: '业务分类',
            dataIndex: 'businessCategoryName',
            key: 'businessCategoryName',
            width: 150,
            render: (text: string) => <Tag color='purple'>{text || '-'}</Tag>,
        },
        {
            title: '原始表',
            dataIndex: 'originTable',
            key: 'originTable',
            width: 180,
        },
        {
            title: '原始字段',
            dataIndex: 'originField',
            key: 'originField',
            width: 120,
            render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text || '-'}</code>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
            render: (text: string) => text || '-',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: number) => (
                <Tag color={status === 1 ? 'green' : 'red'}>
                    {status === 1 ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'createBy',
            key: 'createBy',
            width: 100,
            render: (text: string) => text || '-',
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
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd} disabled={!selectedDataSourceId}>
                        新增对照
                    </Button>
                    <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />} disabled={!selectedDataSourceId}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport} disabled={!selectedDataSourceId}>
                        导出
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={async () => {
                        // 刷新数据源列表
                        await fetchDataSourceList()
                        // 如果已选中数据源，刷新标准字典对照数据
                        if (selectedDataSourceId) {
                            fetchData({ pageNum: pagination.current, pageSize: pagination.pageSize, dataSourceId: Number(selectedDataSourceId) })
                        }
                    }}>
                        刷新
                    </Button>
                </Space>
            </div>
            <Alert
                message='标准字典对照'
                description='管理标准数据集与原始数据之间的对照关系，用于数据标准化和映射。请先选择左侧数据源，然后查看和管理该数据源下的标准字典对照。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <div className={styles.pageContainer}>
                <div className={styles.dataSourceSidebar}>
                    <Typography.Title level={4} className={styles.dataSourceTitle}>
                        数据源列表
                    </Typography.Title>
                    <div className={styles.dataSourceContent}>
                        <Spin spinning={dataSourceListLoading}>
                            {dataSourceList.length === 0 ? (
                                <Empty description='暂无数据源' style={{ marginTop: '40px' }} />
                            ) : (
                                <List
                                    className={styles.dataSourceList}
                                    dataSource={dataSourceList}
                                    renderItem={(item) => (
                                        <List.Item
                                            className={styles.dataSourceItem}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedDataSourceId === item.id ? '#e6f7ff' : 'transparent',
                                                borderLeft: selectedDataSourceId === item.id ? '3px solid #1890ff' : '3px solid transparent',
                                            }}
                                            onClick={() => setSelectedDataSourceId(item.id)}
                                        >
                                            <List.Item.Meta
                                                title={
                                                    <span style={{ fontWeight: selectedDataSourceId === item.id ? 600 : 400 }}>
                                                        {item.connectionName}
                                                    </span>
                                                }
                                                description={
                                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                                        <div>{item.dbType} - {item.dbHost}:{item.dbPort}</div>
                                                        <div>{item.dbName}</div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Spin>
                    </div>
                </div>
                <div className={styles.contentArea}>
                    {!selectedDataSourceId ? (
                        <Empty description='请从左侧选择数据源' />
                    ) : (
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
                                            if (selectedDataSourceId) {
                                                void fetchData({
                                                    pageNum: 1,
                                                    pageSize: pagination.pageSize,
                                                    keyword: null,
                                                    dataSourceId: Number(selectedDataSourceId),
                                                })
                                            }
                                        }}
                                    />
                                    <Select
                                        placeholder='选择状态'
                                        style={{ width: 150 }}
                                        value={statusFilter}
                                        onChange={(value) => {
                                            setStatusFilter(value)
                                            // 当清空时，value 为 undefined，需要明确传入 null
                                            setPagination(prev => ({ ...prev, current: 1 }))
                                            if (selectedDataSourceId) {
                                                void fetchData({
                                                    pageNum: 1,
                                                    pageSize: pagination.pageSize,
                                                    keyword: searchText || null,
                                                    dataSourceId: Number(selectedDataSourceId),
                                                    status: value === undefined ? null : value,
                                                })
                                            }
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
                    )}
                </div>
            </div>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingRecord ? '编辑标准字典对照' : '新增标准字典对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={1000}
                destroyOnClose
                okText='确定'
                cancelText='取消'
                className={styles.dialogModal}
                style={{ maxWidth: 'calc(100vw - 32px)' }}
            >
                {modalDataLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" tip="正在加载数据..." />
                    </div>
                ) : (
                    <Form form={form} layout='vertical' className={styles.dialogForm}>
                    <Form.Item
                        name='dataSourceId'
                        label='数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select 
                            placeholder='请选择数据源'
                            loading={dataSourceListLoading}
                            disabled={true}
                            value={selectedDataSourceId || undefined}
                            notFoundContent={dataSourceListLoading ? <Spin size="small" /> : '暂无数据源'}
                        >
                            {dataSourceList.map(ds => (
                                <Option key={ds.id} value={ds.id}>
                                    {ds.connectionName} ({ds.dbType} - {ds.dbHost}:{ds.dbPort})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='standardName'
                        label='标准名称'
                        rules={[{ required: true, message: '请输入标准名称' }]}
                    >
                        <Input placeholder='请输入标准名称，如：患者基本信息' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='datasetType'
                                label='数据集类型'
                                rules={[{ required: true, message: '请选择数据集类型' }]}
                            >
                                <Select 
                                    placeholder='请选择数据集类型'
                                    loading={datasetTypeLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const children = option?.children
                                        const label = typeof children === 'string' 
                                            ? children 
                                            : (option?.label as string) || ''
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    notFoundContent={datasetTypeLoading ? <Spin size="small" /> : '暂无数据'}
                                    onChange={async (value) => {
                                        setDatasetType(value as 'business' | 'medical' | 'status')
                                        setDatasetOptions([])
                                        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
                                        setDatasetSearchKeyword('') // 清空搜索关键词
                                        
                                        // 保存当前分类ID（编辑时可能需要保留）
                                        const currentCategoryId = form.getFieldValue('categoryId')
                                        
                                        // 清空映射数据
                                        setMappings([])
                                        
                                        if (value) {
                                            // 选择数据集类型时，先加载分类选项
                                            const loadedCategories = await fetchCategoryOptions(value as 'business' | 'medical' | 'status')
                                            
                                            // 编辑时，如果记录中已有分类ID，且该分类在当前数据集类型的分类列表中，自动加载该分类下的数据集
                                            if (currentCategoryId && editingRecord) {
                                                // 检查分类是否在当前数据集类型的分类列表中
                                                const categoryExists = (loadedCategories || []).some(cat => cat.id === currentCategoryId)
                                                if (categoryExists) {
                                                    // 分类匹配，自动加载数据集
                                                    await fetchDatasetOptions(
                                                        value as 'business' | 'medical' | 'status', 
                                                        1, 
                                                        currentCategoryId,
                                                        ''
                                                    )
                                                } else {
                                                    // 分类不匹配，清空分类ID
                                                    form.setFieldsValue({ categoryId: undefined })
                                                }
                                            }
                                        } else {
                                            setCategoryOptions([])
                                            form.setFieldsValue({ categoryId: undefined })
                                        }
                                    }}
                                >
                                    {datasetTypeOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='categoryId'
                                label='分类'
                            >
                                <Select 
                                    placeholder={datasetType ? '请选择分类' : '请先选择数据集类型'}
                                    loading={categoryLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const children = option?.children
                                        const label = typeof children === 'string' 
                                            ? children 
                                            : (option?.label as string) || ''
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    notFoundContent={categoryLoading ? <Spin size="small" /> : '暂无数据'}
                                    disabled={!datasetType}
                                    allowClear
                                    onChange={(value) => {
                                        // 清空数据集选项（但不清空映射数据，因为映射数据可能已经保存）
                                        setDatasetOptions([])
                                        setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
                                        setDatasetSearchKeyword('')
                                        // 注意：不清空映射数据，保留用户已添加的映射关系
                                        
                                        if (value && datasetType) {
                                            // 选择分类后，根据分类查询原始数据集
                                            // 重置搜索关键词和分页
                                            setDatasetSearchKeyword('')
                                            setDatasetOptions([])
                                            setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
                                            fetchDatasetOptions(datasetType as 'business' | 'medical' | 'status', 1, value, '')
                                        }
                                    }}
                                >
                                    {categoryOptions.map(option => (
                                        <Option key={option.id} value={option.id}>
                                            {option.categoryName}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
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
                                    filterOption={(input, option) => {
                                        const children = option?.children
                                        const label = typeof children === 'string' 
                                            ? children 
                                            : (option?.label as string) || ''
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    notFoundContent={optionsLoading ? <Spin size="small" /> : '暂无数据'}
                                    allowClear
                                    onChange={(value) => {
                                        // 清空原始字段选择
                                        form.setFieldsValue({ originalDataField: undefined })
                                        setOriginFieldOptions([])
                                        setOriginFieldValueOptions([])
                                        setMappings([])
                                        
                                        // 选择表后，根据表名查询字段列表
                                        if (value) {
                                            fetchTableColumns(value)
                                        }
                                    }}
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
                                    placeholder={
                                        !form.getFieldValue('originalTableName')
                                            ? '请先选择原始表'
                                            : '请选择原始字段'
                                    }
                                    loading={originFieldLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const children = option?.children
                                        const label = typeof children === 'string' 
                                            ? children 
                                            : (option?.label as string) || ''
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    notFoundContent={
                                        originFieldLoading 
                                            ? <Spin size="small" /> 
                                            : originFieldOptions.length === 0 
                                            ? (form.getFieldValue('originalTableName') ? '暂无字段数据' : '请先选择原始表')
                                            : '未找到匹配项'
                                    }
                                    disabled={!form.getFieldValue('originalTableName')}
                                    allowClear
                                    onChange={async (value) => {
                                        // 清空字段值选项（但不清空映射数据，因为映射数据可能已经保存）
                                        setOriginFieldValueOptions([])
                                        // 注意：不清空映射数据，保留用户已添加的映射关系
                                        
                                        // 选择字段后，根据表名和字段名查询字段值列表
                                        const tableName = form.getFieldValue('originalTableName')
                                        if (value && tableName) {
                                            console.log('切换原始字段，调用 fetchFieldValues:', { tableName, fieldName: value })
                                            await fetchFieldValues(tableName, value)
                                        } else {
                                            console.log('原始字段或表名为空，不调用接口:', { tableName, fieldName: value })
                                        }
                                    }}
                                >
                                    {originFieldOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            {/* 占位，保持布局对齐 */}
                        </Col>
                    </Row>

                    {/* 映射组件 - 常驻显示 */}
                    <Form.Item label='数据映射' className={styles.compactMappingItem}>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                            prevValues.datasetType !== currentValues.datasetType ||
                            prevValues.categoryId !== currentValues.categoryId ||
                            prevValues.originalTableName !== currentValues.originalTableName ||
                            prevValues.originalDataField !== currentValues.originalDataField
                        }>
                            {({ getFieldValue }) => {
                                const datasetTypeValue = getFieldValue('datasetType')
                                const categoryIdValue = getFieldValue('categoryId')
                                const originalTableNameValue = getFieldValue('originalTableName')
                                const originalDataFieldValue = getFieldValue('originalDataField')
                                
                                // 检查各个条件，用于调试
                                const checks = {
                                    datasetLoading,
                                    noDatasetType: !datasetTypeValue,
                                    noCategoryId: !categoryIdValue,
                                    noOriginalTable: !originalTableNameValue,
                                    noOriginalField: !originalDataFieldValue,
                                }
                                
                                // 只要必填字段都选择了，就允许添加映射
                                // 选项列表为空不影响，因为用户已经选择了字段值
                                const isDisabled = 
                                    checks.datasetLoading || 
                                    checks.noDatasetType ||
                                    checks.noCategoryId ||
                                    checks.noOriginalTable ||
                                    checks.noOriginalField

                                return (
                                    <>
                                        <CategoryFieldMapping
                                            datasetOptions={datasetOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                                            originFieldValueOptions={originFieldValueOptions}
                                            originalTableName={originalTableNameValue}
                                            originalFieldName={originalDataFieldValue}
                                            originFieldValueLoading={originFieldValueLoading}
                                            mappings={mappings}
                                            onChange={setMappings}
                                            disabled={isDisabled}
                                            datasetLoading={datasetLoading}
                                            datasetPagination={datasetPagination}
                                            datasetSearchKeyword={datasetSearchKeyword}
                                            onDatasetSearch={(value) => {
                                                setDatasetSearchKeyword(value)
                                                setDatasetOptions([])
                                                setDatasetPagination({ current: 1, pageSize: 20, total: 0, hasMore: true })
                                            }}
                                            onDatasetLoadMore={() => {
                                                if (datasetPagination.hasMore && !datasetLoading) {
                                                    fetchDatasetOptions(
                                                        datasetType as 'business' | 'medical' | 'status', 
                                                        datasetPagination.current + 1,
                                                        categoryIdValue,
                                                        debouncedDatasetSearchKeyword
                                                    )
                                                }
                                            }}
                                        />
                                    </>
                                )
                            }}
                        </Form.Item>
                    </Form.Item>

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
                        <TextArea 
                            rows={3} 
                            placeholder='请输入备注信息（可选）'
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
                )}
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
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                            <strong>原始数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始表：</strong>
                                    {viewingRecord.originTable}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始字段：</strong>
                                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.originField}
                                    </code>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>业务分类：</strong>
                                    <Tag color='purple'>{viewingRecord.businessCategoryName || '-'}</Tag>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                            <strong>目标数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                    <strong>业务类型：</strong>
                                    <Tag color='blue'>{viewingRecord.businessTypeName || '-'}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>数据源：</strong>
                                    <Tag color='orange'>{viewingRecord.dataSourceName || '-'}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>描述：</strong>
                                    {viewingRecord.description || '-'}
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <div>
                                    <strong>状态：</strong>
                                    <Tag color={viewingRecord.status === 1 ? 'green' : 'red'}>
                                        {viewingRecord.status === 1 ? '启用' : '禁用'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>创建人：</strong>
                                    {viewingRecord.createBy || '-'}
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
                                    <strong>备注：</strong>
                                    {viewingRecord.remark || '-'}
                                </div>
                            </Col>
                        </Row>

                        {/* 映射关系列表 */}
                        {(viewingRecord as any).valueList && (viewingRecord as any).valueList.length > 0 && (
                            <>
                                <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                                    <strong>数据映射关系</strong>
                                    <Tag color='blue' style={{ marginLeft: 8 }}>
                                        {(viewingRecord as any).valueList.length} 条映射
                                    </Tag>
                                </div>
                                <Table
                                    dataSource={(viewingRecord as any).valueList}
                                    rowKey={(record, index) => String(record.id || index)}
                                    pagination={false}
                                    size='small'
                                    columns={[
                                        {
                                            title: '序号',
                                            key: 'index',
                                            width: 60,
                                            render: (_: any, __: any, index: number) => index + 1,
                                        },
                                        {
                                            title: '数据集ID',
                                            dataIndex: 'dataSetId',
                                            key: 'dataSetId',
                                            render: (value: any) => value || '-',
                                        },
                                        {
                                            title: '原始值',
                                            dataIndex: 'originValue',
                                            key: 'originValue',
                                            render: (value: string) => (
                                                <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                                                    {value || '-'}
                                                </code>
                                            ),
                                        },
                                    ]}
                                />
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

