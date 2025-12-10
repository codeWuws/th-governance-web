import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Layout,
    Tree,
    Input,
    Button,
    Card,
    Table,
    Space,
    Modal,
    Form,
    Select,
    Typography,
    Descriptions,
    Tag,
    message,
    Empty,
    Divider,
    Dropdown,
    MenuProps,
    Tabs,
    Alert,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import {
    DatabaseOutlined,
    FolderOutlined,
    TableOutlined,
    FieldTimeOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import { dataManagementService } from '../../services/dataManagementService'
import type { AssetTreeNode, AssetTableInfo, AssetTableColumnDetailsData, AssetDataSourceOption, AssetTableInfoOption } from '../../types'
import { logger } from '../../utils/logger'
import { Spin } from 'antd'
import styles from './DataAssetManagement.module.scss'
import { EditAssetDialog } from '../../components/EditAssetDialog'
import { EditAssetCategoryDialog } from '../../components/EditAssetCategoryDialog'
import { showDialog } from '../../utils/showDialog'

const { Sider, Content } = Layout
const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography

// 数据源类型
interface DataSource {
    id: string
    name: string
    type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver'
    host: string
    port: number
    database: string
    status: 'connected' | 'disconnected'
    deleted?: boolean // 逻辑删除标记
}

// 资产类别
interface AssetCategory {
    id: string
    name: string
    dataSourceId: string
    database: string
    tables: string[]
    deleted?: boolean // 逻辑删除标记
}

// 表信息
interface TableInfo {
    name: string
    schema: string
    comment?: string
    rowCount?: number
    fields: FieldInfo[]
}

// 字段信息
interface FieldInfo {
    name: string
    type: string
    length?: number
    nullable: boolean
    default?: string
    comment?: string
    primaryKey?: boolean
}

// 树节点扩展
interface ExtendedDataNode extends DataNode {
    nodeType: 'dataSource' | 'category' | 'table' | 'field'
    data?: DataSource | AssetCategory | TableInfo | FieldInfo
    dataSourceId?: string
    categoryId?: string
    tableName?: string
}

// 医学科研领域相关的模拟数据
const mockDataSources: DataSource[] = [
    {
        id: 'ds1',
        name: '医院HIS系统数据库',
        type: 'mysql',
        host: '192.168.1.100',
        port: 3306,
        database: 'hospital_his',
        status: 'connected',
    },
    {
        id: 'ds2',
        name: '科研数据仓库',
        type: 'postgresql',
        host: '192.168.1.101',
        port: 5432,
        database: 'research_warehouse',
        status: 'connected',
    },
    {
        id: 'ds3',
        name: '电子病历系统',
        type: 'mysql',
        host: '192.168.1.102',
        port: 3306,
        database: 'emr_system',
        status: 'disconnected',
    },
]

const mockCategories: AssetCategory[] = [
    {
        id: 'cat1',
        name: '患者基础信息',
        dataSourceId: 'ds1',
        database: 'hospital_his',
        tables: ['patient_info', 'patient_contact', 'patient_insurance'],
    },
    {
        id: 'cat2',
        name: '临床诊疗数据',
        dataSourceId: 'ds1',
        database: 'hospital_his',
        tables: ['diagnosis_record', 'treatment_plan', 'prescription'],
    },
    {
        id: 'cat3',
        name: '检验检查数据',
        dataSourceId: 'ds2',
        database: 'research_warehouse',
        tables: ['lab_result', 'imaging_report', 'pathology_report'],
    },
    {
        id: 'cat4',
        name: '科研项目数据',
        dataSourceId: 'ds2',
        database: 'research_warehouse',
        tables: ['research_project', 'clinical_trial', 'sample_data'],
    },
]

const mockTables: Record<string, TableInfo> = {
    patient_info: {
        name: 'patient_info',
        schema: 'hospital_his',
        comment: '患者基本信息表',
        rowCount: 125680,
        fields: [
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者唯一标识',
                primaryKey: true,
            },
            {
                name: 'name',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '患者姓名',
            },
            {
                name: 'gender',
                type: 'CHAR',
                length: 1,
                nullable: false,
                default: 'M',
                comment: '性别：M-男，F-女',
            },
            {
                name: 'birth_date',
                type: 'DATE',
                nullable: true,
                comment: '出生日期',
            },
            {
                name: 'id_card',
                type: 'VARCHAR',
                length: 18,
                nullable: true,
                comment: '身份证号',
            },
            {
                name: 'phone',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '联系电话',
            },
            {
                name: 'address',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '住址',
            },
            {
                name: 'create_time',
                type: 'DATETIME',
                nullable: false,
                comment: '创建时间',
            },
        ],
    },
    diagnosis_record: {
        name: 'diagnosis_record',
        schema: 'hospital_his',
        comment: '诊断记录表',
        rowCount: 456230,
        fields: [
            {
                name: 'record_id',
                type: 'BIGINT',
                nullable: false,
                comment: '记录ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'diagnosis_code',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '诊断编码（ICD-10）',
            },
            {
                name: 'diagnosis_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '诊断名称',
            },
            {
                name: 'diagnosis_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '诊断类型：主要诊断、次要诊断',
            },
            {
                name: 'diagnosis_date',
                type: 'DATE',
                nullable: false,
                comment: '诊断日期',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '医生ID',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
        ],
    },
    lab_result: {
        name: 'lab_result',
        schema: 'research_warehouse',
        comment: '检验结果表',
        rowCount: 892450,
        fields: [
            {
                name: 'result_id',
                type: 'BIGINT',
                nullable: false,
                comment: '结果ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'test_code',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '检验项目编码',
            },
            {
                name: 'test_name',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '检验项目名称',
            },
            {
                name: 'test_value',
                type: 'DECIMAL',
                length: 10,
                nullable: true,
                comment: '检验数值',
            },
            {
                name: 'test_unit',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '检验单位',
            },
            {
                name: 'reference_range',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '参考范围',
            },
            {
                name: 'test_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检验日期',
            },
        ],
    },
    research_project: {
        name: 'research_project',
        schema: 'research_warehouse',
        comment: '科研项目表',
        rowCount: 1250,
        fields: [
            {
                name: 'project_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '项目ID',
                primaryKey: true,
            },
            {
                name: 'project_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '项目名称',
            },
            {
                name: 'project_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '项目类型',
            },
            {
                name: 'principal_investigator',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '项目负责人',
            },
            {
                name: 'start_date',
                type: 'DATE',
                nullable: false,
                comment: '开始日期',
            },
            {
                name: 'end_date',
                type: 'DATE',
                nullable: true,
                comment: '结束日期',
            },
            {
                name: 'status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '项目状态',
            },
        ],
    },
}

// 视图状态类型
type ViewMode = 'empty' | 'category' | 'tableFields'

const DataAssetManagement: React.FC = () => {
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [categories, setCategories] = useState<AssetCategory[]>([])
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
    const [searchText, setSearchText] = useState('')
    const [addAssetModalVisible, setAddAssetModalVisible] = useState(false)
    const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false)
    const [selectedNode, setSelectedNode] = useState<ExtendedDataNode | null>(null)
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('')
    const [selectedDatabase, setSelectedDatabase] = useState<string>('')
    const [form] = Form.useForm()
    const [categoryForm] = Form.useForm()
    // 视图状态管理
    const [viewMode, setViewMode] = useState<ViewMode>('empty')
    const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)
    const [loading, setLoading] = useState(false)
    // 表列表相关状态
    const [tableList, setTableList] = useState<AssetTableInfo[]>([])
    const [tableListLoading, setTableListLoading] = useState(false)
    // 字段详情相关状态
    const [tableColumnsDetail, setTableColumnsDetail] = useState<AssetTableColumnDetailsData | null>(null)
    const [tableColumnsLoading, setTableColumnsLoading] = useState(false)
    // 数据源选项相关状态
    const [dataSourceOptions, setDataSourceOptions] = useState<AssetDataSourceOption[]>([])
    const [dataSourceOptionsLoading, setDataSourceOptionsLoading] = useState(false)
    // 表信息选项相关状态
    const [tableInfoOptions, setTableInfoOptions] = useState<AssetTableInfoOption[]>([])
    const [tableInfoOptionsLoading, setTableInfoOptionsLoading] = useState(false)

    const debouncedSearchText = useDebounce(searchText, 300)

    // 将接口返回的资产树数据转换为页面需要的数据格式
    const convertAssetTreeToData = useCallback((treeData: AssetTreeNode[]) => {
        const dataSourcesList: DataSource[] = []
        const categoriesList: AssetCategory[] = []

        // 递归处理节点
        const processNode = (node: AssetTreeNode, parentDataSourceId?: string) => {
            if (node.nodeType === 0) {
                // 数据源节点
                const dataSource: DataSource = {
                    id: node.id,
                    name: node.name,
                    type: 'mysql', // 默认类型，如果接口后续提供可以更新
                    host: '', // 接口未提供，使用空值
                    port: 3306, // 默认端口
                    database: '', // 接口未提供，使用空值
                    status: node.status === 1 ? 'connected' : 'disconnected',
                }
                dataSourcesList.push(dataSource)

                // 递归处理子节点
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => {
                        processNode(child, node.id)
                    })
                }
            } else if (node.nodeType === 1 && parentDataSourceId) {
                // 资产类别节点
                const category: AssetCategory = {
                    id: node.id,
                    name: node.name,
                    dataSourceId: parentDataSourceId,
                    database: '', // 接口未提供，使用空值
                    tables: node.tables || [],
                }
                categoriesList.push(category)

                // 递归处理子节点（如果有嵌套的资产类别）
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => {
                        processNode(child, parentDataSourceId)
                    })
                }
            }
        }

        // 处理所有根节点
        treeData.forEach(node => {
            processNode(node)
        })

        return { dataSourcesList, categoriesList }
    }, [])

    // 获取资产树数据
    const fetchAssetTree = useCallback(async (name?: string) => {
        try {
            setLoading(true)
            const params = name ? { name } : undefined
            const response = await dataManagementService.getAssetTree(params)
            
            if (response.code === 200 && response.data) {
                const { dataSourcesList, categoriesList } = convertAssetTreeToData(response.data)
                setDataSources(dataSourcesList)
                setCategories(categoriesList)
            } else {
                message.error(response.msg || '获取资产树数据失败')
            }
        } catch (error) {
            logger.error('获取资产树数据失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '获取资产树数据失败')
        } finally {
            setLoading(false)
        }
    }, [convertAssetTreeToData])

    // 初始加载数据
    useEffect(() => {
        fetchAssetTree()
    }, [fetchAssetTree])

    // 搜索功能：当搜索文本变化时重新获取数据
    useEffect(() => {
        // 使用防抖后的搜索文本
        fetchAssetTree(debouncedSearchText || undefined)
    }, [debouncedSearchText, fetchAssetTree])

    // 模拟数据：每个数据源下的数据库列表
    const getDatabasesByDataSource = (dataSourceId: string): string[] => {
        const dataSource = dataSources.find(ds => ds.id === dataSourceId)
        if (!dataSource) return []
        
        // 根据数据源返回可用的数据库列表
        const databaseMap: Record<string, string[]> = {
            'ds1': ['hospital_his', 'hospital_emr', 'hospital_pacs'],
            'ds2': ['research_warehouse', 'research_archive', 'research_temp'],
            'ds3': ['emr_system', 'emr_backup'],
        }
        
        return databaseMap[dataSourceId] || [dataSource.database]
    }

    // 模拟数据：根据数据库获取表列表
    const getTablesByDatabase = (database: string): string[] => {
        // 返回该数据库下所有可用的表
        const allTables = Object.keys(mockTables)
        // 可以根据数据库名称过滤，这里简化处理，返回所有表
        return allTables
    }

    // 处理点击添加资产类别按钮/右键菜单
    const handleAddCategoryClick = useCallback((dataSource: DataSource) => {
        // 直接打开表单弹窗
        setSelectedDataSourceId(dataSource.id)
        categoryForm.setFieldsValue({
            dataSourceId: dataSource.id,
            tables: [],
        })
        setAddCategoryModalVisible(true)
    }, [categoryForm])

    // 构建树形数据
    const treeData = useMemo(() => {
        const buildTree = (): ExtendedDataNode[] => {
            const nodes: ExtendedDataNode[] = []

            // 过滤掉已删除的数据源
            dataSources
                .filter(ds => !ds.deleted)
                .forEach(ds => {
                    const dsNode: ExtendedDataNode = {
                        title: ds.name, // 先设置简单的标题，稍后通过 titleRender 自定义
                        key: `ds-${ds.id}`,
                        nodeType: 'dataSource',
                        data: ds,
                        children: [],
                    }

                    // 添加资产类别（仅显示两个层级：资产 -> 资产类别）
                    // 过滤掉已删除的资产类别
                    const dsCategories = categories.filter(
                        cat => cat.dataSourceId === ds.id && !cat.deleted
                    )
                    dsCategories.forEach(cat => {
                        const catNode: ExtendedDataNode = {
                            title: (
                                <span>
                                    <FolderOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                    {cat.name}
                                </span>
                            ),
                            key: `cat-${cat.id}`,
                            nodeType: 'category',
                            data: cat,
                            dataSourceId: ds.id,
                            children: [], // 不再包含表和字段子节点
                        }

                        dsNode.children!.push(catNode)
                    })

                    nodes.push(dsNode)
                })

            return nodes
        }

        return buildTree()
    }, [dataSources, categories])

    // 树形数据（搜索由接口处理，这里直接使用 treeData）
    const filteredTreeData = useMemo(() => {
        return treeData
    }, [treeData])

    // 获取数据源选项列表
    const fetchDataSourceOptions = useCallback(async () => {
        try {
            setDataSourceOptionsLoading(true)
            const response = await dataManagementService.getAssetDataSourceOptions()
            
            if (response.code === 200 && response.data) {
                setDataSourceOptions(response.data)
                // 如果已选中数据源，检查是否在数据源选项中存在
                if (selectedDataSourceId && addCategoryModalVisible) {
                    const exists = response.data.some(opt => opt.id === selectedDataSourceId)
                    if (!exists) {
                        // 如果不存在，清空选择
                        setSelectedDataSourceId('')
                        categoryForm.setFieldsValue({ dataSourceId: undefined })
                    }
                }
            } else {
                message.error(response.msg || '获取数据源选项失败')
                setDataSourceOptions([])
            }
        } catch (error) {
            logger.error('获取数据源选项失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '获取数据源选项失败')
            setDataSourceOptions([])
        } finally {
            setDataSourceOptionsLoading(false)
        }
    }, [selectedDataSourceId, addCategoryModalVisible, categoryForm])

    // 获取表信息列表
    const fetchTableInfo = useCallback(async () => {
        try {
            setTableInfoOptionsLoading(true)
            const response = await dataManagementService.getTableInfo()
            
            if (response.code === 200 && response.data) {
                setTableInfoOptions(response.data)
            } else {
                message.error(response.msg || '获取表信息失败')
                setTableInfoOptions([])
            }
        } catch (error) {
            logger.error('获取表信息失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '获取表信息失败')
            setTableInfoOptions([])
        } finally {
            setTableInfoOptionsLoading(false)
        }
    }, [])

    // 获取资产类别表列表
    const fetchCategoryTableList = useCallback(async (categoryId: string) => {
        try {
            setTableListLoading(true)
            const response = await dataManagementService.getAssetTableList(categoryId)
            
            if (response.code === 200 && response.data) {
                setTableList(response.data)
            } else {
                message.error(response.msg || '获取表列表失败')
                setTableList([])
            }
        } catch (error) {
            logger.error('获取表列表失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '获取表列表失败')
            setTableList([])
        } finally {
            setTableListLoading(false)
        }
    }, [])

    // 查找选中的节点并更新视图状态
    useEffect(() => {
        if (selectedKeys.length > 0) {
            const findNode = (
                nodes: ExtendedDataNode[],
                key: React.Key
            ): ExtendedDataNode | null => {
                for (const node of nodes) {
                    if (node.key === key) {
                        return node
                    }
                    if (node.children) {
                        const found = findNode(node.children as ExtendedDataNode[], key)
                        if (found) return found
                    }
                }
                return null
            }

            if (selectedKeys[0] !== undefined) {
                const node = findNode(treeData, selectedKeys[0])
                setSelectedNode(node || null)
                
                // 根据节点类型更新视图状态
                if (node) {
                    if (node.nodeType === 'category') {
                        const cat = node.data as AssetCategory
                        setSelectedCategory(cat)
                        setViewMode('category')
                        setTableColumnsDetail(null) // 重置字段详情
                        // 获取表列表
                        fetchCategoryTableList(cat.id)
                    } else if (node.nodeType === 'dataSource') {
                        setViewMode('empty')
                        setSelectedCategory(null)
                        setTableColumnsDetail(null) // 清空字段详情
                        setTableList([]) // 清空表列表
                    }
                }
            } else {
                setSelectedNode(null)
                setViewMode('empty')
                setSelectedCategory(null)
                setTableColumnsDetail(null) // 清空字段详情
                setTableList([]) // 清空表列表
            }
        } else {
            setSelectedNode(null)
            setViewMode('empty')
            setSelectedCategory(null)
            setTableColumnsDetail(null) // 清空字段详情
            setTableList([]) // 清空表列表
        }
    }, [selectedKeys, treeData, fetchCategoryTableList])

    // 处理新增资产
    const handleAddAsset = async () => {
        try {
            const values = await form.validateFields()
            
            // 转换 sourceId 为数字类型
            const sourceId = parseInt(values.dataSourceId, 10)
            if (isNaN(sourceId)) {
                message.error('数据源ID无效')
                return
            }
            
            // 调用接口新增资产
            const response = await dataManagementService.addAsset({
                parentId: 0, // 根节点
                assetName: values.name,
                nodeType: 0, // 数据源类型
                sourceId: sourceId,
            })
            
            if (response.code === 200) {
                message.success(response.msg || '资产添加成功')
                setAddAssetModalVisible(false)
                form.resetFields()
                // 刷新资产树数据
                await fetchAssetTree(debouncedSearchText || undefined)
            } else {
                message.error(response.msg || '资产添加失败')
            }
        } catch (error) {
            logger.error('新增资产失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '新增资产失败')
        }
    }

    // 处理新增资产类别表单提交
    const handleAddCategory = async () => {
        try {
            const values = await categoryForm.validateFields()
            
            // 确保使用正确的数据源ID（优先使用表单值，否则使用选中的数据源ID）
            const dataSourceId = values.dataSourceId || selectedDataSourceId
            if (!dataSourceId) {
                message.error('请选择数据源')
                return
            }

            if (!values.tables || values.tables.length === 0) {
                message.error('请至少选择一个表')
                return
            }

            // 转换 parentId 为数字类型
            const parentId = parseInt(dataSourceId, 10)
            if (isNaN(parentId)) {
                message.error('数据源ID无效')
                return
            }

            // 调用接口新增资产类别
            const response = await dataManagementService.addAssetCategory({
                parentId: parentId, // 数据源节点ID
                assetName: values.name,
                nodeType: 1, // 资产类别类型
                tableNames: values.tables || [],
            })
            
            if (response.code === 200) {
                message.success(response.msg || '资产类别添加成功')
                setAddCategoryModalVisible(false)
                setSelectedDataSourceId('')
                categoryForm.resetFields()
                // 刷新资产树数据
                await fetchAssetTree(debouncedSearchText || undefined)
            } else {
                message.error(response.msg || '资产类别添加失败')
            }
        } catch (error) {
            logger.error('新增资产类别失败:', error instanceof Error ? error : new Error(String(error)))
            // 显示表单验证错误
            if (error && typeof error === 'object' && 'errorFields' in error) {
                message.error('请检查表单填写是否正确')
            } else {
                message.error(error instanceof Error ? error.message : '新增资产类别失败')
            }
        }
    }

    // 处理编辑资产（数据源）
    const handleEditAsset = useCallback(async (dataSource: DataSource) => {
        try {
            // 确保数据源选项已加载
            if (dataSourceOptions.length === 0) {
                await fetchDataSourceOptions()
            }

            await showDialog(EditAssetDialog as React.ComponentType<any>, {
                name: dataSource.name,
                dataSourceId: dataSource.id,
                dataSourceOptions,
                dataSourceOptionsLoading,
                onOk: async (values: { name: string; dataSourceId: string }) => {
                    // 逻辑更新：更新本地状态中的数据源信息
                    setDataSources(prev => 
                        prev.map(ds => 
                            ds.id === dataSource.id 
                                ? { ...ds, name: values.name, id: values.dataSourceId }
                                : ds
                        )
                    )
                    message.success('资产编辑成功')
                },
            } as any)
        } catch (error) {
            logger.error('编辑资产失败:', error instanceof Error ? error : new Error(String(error)))
        }
    }, [dataSourceOptions, dataSourceOptionsLoading, fetchDataSourceOptions])

    // 处理删除资产（数据源）- 逻辑删除
    const handleDeleteAsset = useCallback((dataSource: DataSource) => {
        showDialog({
            title: '确认删除',
            children: (
                <div>
                    <p>确定要删除资产 "{dataSource.name}" 吗？</p>
                    <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                        注意：此操作将同时删除该资产下的所有资产类别（逻辑删除）
                    </p>
                </div>
            ),
            onOk: async () => {
                // 逻辑删除：标记数据源和其下的所有资产类别为已删除
                setDataSources(prev => 
                    prev.map(ds => 
                        ds.id === dataSource.id ? { ...ds, deleted: true } : ds
                    )
                )
                setCategories(prev => 
                    prev.map(cat => 
                        cat.dataSourceId === dataSource.id ? { ...cat, deleted: true } : cat
                    )
                )
                message.success('资产删除成功')
            },
        })
    }, [])

    // 处理编辑资产类别
    const handleEditCategory = useCallback(async (category: AssetCategory) => {
        try {
            // 确保数据源选项和表信息已加载
            if (dataSourceOptions.length === 0) {
                await fetchDataSourceOptions()
            }
            if (tableInfoOptions.length === 0) {
                await fetchTableInfo()
            }

            await showDialog(EditAssetCategoryDialog as React.ComponentType<any>, {
                name: category.name,
                dataSourceId: category.dataSourceId,
                tables: category.tables,
                dataSourceOptions,
                tableInfoOptions,
                dataSourceOptionsLoading,
                tableInfoOptionsLoading,
                disableDataSource: false, // 允许修改数据源
                onOk: async (values: { name: string; dataSourceId: string; tables: string[] }) => {
                    // 逻辑更新：更新本地状态中的资产类别信息
                    setCategories(prev => 
                        prev.map(cat => 
                            cat.id === category.id 
                                ? { 
                                    ...cat, 
                                    name: values.name, 
                                    dataSourceId: values.dataSourceId,
                                    tables: values.tables 
                                }
                                : cat
                        )
                    )
                    message.success('资产类别编辑成功')
                    
                    // 如果当前选中的是正在编辑的类别，需要刷新表列表
                    if (selectedCategory?.id === category.id) {
                        await fetchCategoryTableList(category.id)
                    }
                },
            } as any)
        } catch (error) {
            logger.error('编辑资产类别失败:', error instanceof Error ? error : new Error(String(error)))
        }
    }, [
        dataSourceOptions, 
        tableInfoOptions, 
        dataSourceOptionsLoading, 
        tableInfoOptionsLoading,
        fetchDataSourceOptions,
        fetchTableInfo,
        selectedCategory,
        fetchCategoryTableList,
    ])

    // 处理删除资产类别 - 逻辑删除
    const handleDeleteCategory = useCallback((category: AssetCategory) => {
        showDialog({
            title: '确认删除',
            children: (
                <div>
                    <p>确定要删除资产类别 "{category.name}" 吗？</p>
                    <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                        注意：此操作为逻辑删除，数据不会真正删除
                    </p>
                </div>
            ),
            onOk: async () => {
                // 逻辑删除：标记资产类别为已删除
                setCategories(prev => 
                    prev.map(cat => 
                        cat.id === category.id ? { ...cat, deleted: true } : cat
                    )
                )
                message.success('资产类别删除成功')
                
                // 如果当前选中的是被删除的类别，清空选中状态
                if (selectedCategory?.id === category.id) {
                    setSelectedKeys([])
                    setViewMode('empty')
                    setSelectedCategory(null)
                    setTableList([])
                }
            },
        })
    }, [selectedCategory])

    // 处理表行点击
    const handleTableRowClick = useCallback(async (tableName: string) => {
        if (!selectedCategory) {
            return
        }

        try {
            setTableColumnsLoading(true)
            setViewMode('tableFields')
            
            const response = await dataManagementService.getAssetTableColumnDetails(
                selectedCategory.id,
                tableName
            )
            
            if (response.code === 200 && response.data) {
                setTableColumnsDetail(response.data)
            } else {
                message.error(response.msg || '获取字段详情失败')
                setTableColumnsDetail(null)
                setViewMode('category') // 返回表列表视图
            }
        } catch (error) {
            logger.error('获取字段详情失败:', error instanceof Error ? error : new Error(String(error)))
            message.error(error instanceof Error ? error.message : '获取字段详情失败')
            setTableColumnsDetail(null)
            setViewMode('category') // 返回表列表视图
        } finally {
            setTableColumnsLoading(false)
        }
    }, [selectedCategory])

    // 返回到表列表
    const handleBackToTableList = () => {
        setTableColumnsDetail(null)
        setViewMode('category')
    }

    // 渲染右侧详情区域
    const renderDetailContent = () => {
        // 空状态
        if (viewMode === 'empty') {
            return (
                <div className={styles.detailContent}>
                    <Empty
                        description='请从左侧选择资产类别查看表列表'
                        style={{ marginTop: 100 }}
                    />
                </div>
            )
        }

        // 字段详情视图
        if (viewMode === 'tableFields') {
            // 如果正在加载，显示loading状态
            if (tableColumnsLoading || !tableColumnsDetail) {
                return (
                    <>
                        <div className={styles.detailHeader}>
                            <Button
                                type='text'
                                icon={<ArrowLeftOutlined />}
                                onClick={handleBackToTableList}
                                style={{ marginRight: 8 }}
                            >
                                返回
                            </Button>
                            <TableOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                            <Title level={4} className={styles.detailTitle}>
                                加载中...
                            </Title>
                        </div>
                        <div className={styles.detailContent}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                                <Spin size='large' tip='正在加载字段详情...' />
                            </div>
                        </div>
                    </>
                )
            }
            const columns = [
                {
                    title: '字段名',
                    dataIndex: 'columnName',
                    key: 'columnName',
                    width: 180,
                    fixed: 'left' as const,
                    render: (text: string) => (
                        <span style={{ fontWeight: 400 }}>
                            {text}
                        </span>
                    ),
                },
                {
                    title: '数据类型',
                    dataIndex: 'dataType',
                    key: 'dataType',
                    width: 150,
                    render: (dataType: string) => (
                        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>
                            {dataType}
                        </code>
                    ),
                },
                {
                    title: '允许为空',
                    dataIndex: 'isNullable',
                    key: 'isNullable',
                    width: 100,
                    align: 'center' as const,
                    render: (isNullable: string) => (
                        isNullable === 'YES' ? (
                            <span style={{ color: '#52c41a' }}>✓</span>
                        ) : (
                            <span style={{ color: '#ff4d4f' }}>✗</span>
                        )
                    ),
                },
                {
                    title: '默认值',
                    dataIndex: 'columnDefault',
                    key: 'columnDefault',
                    width: 150,
                    render: (value: string | null) => (
                        value ? (
                            <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>
                                {value}
                            </code>
                        ) : (
                            <span style={{ color: '#bfbfbf' }}>-</span>
                        )
                    ),
                },
                {
                    title: '说明',
                    dataIndex: 'columnComment',
                    key: 'columnComment',
                    ellipsis: true,
                    render: (text: string) => text || <span style={{ color: '#bfbfbf' }}>-</span>,
                },
            ]

            // 格式化表大小
            const formatSize = (size: string) => {
                const num = parseInt(size, 10)
                if (isNaN(num)) return size
                if (num < 1024) return `${num} B`
                if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`
                if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`
                return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`
            }

            return (
                <>
                    <div className={styles.detailHeader}>
                        <Button
                            type='text'
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBackToTableList}
                            style={{ marginRight: 8 }}
                        >
                            返回
                        </Button>
                        <TableOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                        <Title level={4} className={styles.detailTitle}>
                            {tableColumnsDetail.tableName}
                        </Title>
                    </div>
                    <div className={styles.detailContent}>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>基本信息</div>
                            <Descriptions bordered column={3} size='small' style={{ marginBottom: 20 }}>
                                <Descriptions.Item label='表名'>{tableColumnsDetail.tableName}</Descriptions.Item>
                                <Descriptions.Item label='模式/数据库'>{tableColumnsDetail.schema}</Descriptions.Item>
                                <Descriptions.Item label='表大小'>
                                    {formatSize(tableColumnsDetail.size)}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>字段列表 ({tableColumnsDetail.list.length})</div>
                            <Table
                                className={styles.infoTable}
                                dataSource={tableColumnsDetail.list}
                                columns={columns}
                                rowKey='columnName'
                                pagination={false}
                                size='small'
                                scroll={{ x: 800, y: 400 }}
                            />
                        </div>
                    </div>
                </>
            )
        }

        // 资产类别视图 - 显示表列表
        if (viewMode === 'category' && selectedCategory) {
            const cat = selectedCategory
            const ds = dataSources.find(d => d.id === cat.dataSourceId)
            
            // 格式化日期时间
            const formatDateTime = (dateTime: string | null) => {
                if (!dateTime) return '-'
                try {
                    const date = new Date(dateTime)
                    return date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })
                } catch {
                    return dateTime
                }
            }
            
            return (
                <>
                    <div className={styles.detailHeader}>
                        <FolderOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                        <Title level={4} className={styles.detailTitle}>
                            {cat.name}
                        </Title>
                    </div>
                    <div className={styles.detailContent}>
                        <Tabs
                            defaultActiveKey='tables'
                            items={[
                                {
                                    key: 'tables',
                                    label: `表 (${tableList.length})`,
                                    children: (
                                        <div className={styles.infoSection}>
                                            <Spin spinning={tableListLoading}>
                                                <Table
                                                    className={styles.infoTable}
                                                    dataSource={tableList.map((table, index) => ({
                                                        key: index,
                                                        tableName: table.tableName,
                                                        databaseName: table.databaseName,
                                                        tableComment: table.tableComment,
                                                        rowCount: table.rowCount,
                                                        columnCount: table.columnCount,
                                                        tableType: table.tableType,
                                                        storageEngine: table.storageEngine,
                                                        createTime: table.createTime,
                                                        updateTime: table.updateTime,
                                                    }))}
                                                    columns={[
                                                        { 
                                                            title: '表名', 
                                                            dataIndex: 'tableName', 
                                                            key: 'tableName',
                                                            width: 180,
                                                            fixed: 'left' as const,
                                                        },
                                                        { 
                                                            title: '数据库', 
                                                            dataIndex: 'databaseName', 
                                                            key: 'databaseName',
                                                            width: 150,
                                                        },
                                                        { 
                                                            title: '说明', 
                                                            dataIndex: 'tableComment', 
                                                            key: 'tableComment',
                                                            ellipsis: true,
                                                            width: 200,
                                                        },
                                                        {
                                                            title: '记录数',
                                                            dataIndex: 'rowCount',
                                                            key: 'rowCount',
                                                            width: 120,
                                                            align: 'right' as const,
                                                            render: (count: string) => {
                                                                const num = parseInt(count, 10)
                                                                return isNaN(num) ? count : num.toLocaleString()
                                                            },
                                                        },
                                                        {
                                                            title: '字段数',
                                                            dataIndex: 'columnCount',
                                                            key: 'columnCount',
                                                            width: 100,
                                                            align: 'right' as const,
                                                        },
                                                        {
                                                            title: '表类型',
                                                            dataIndex: 'tableType',
                                                            key: 'tableType',
                                                            width: 120,
                                                        },
                                                        {
                                                            title: '存储引擎',
                                                            dataIndex: 'storageEngine',
                                                            key: 'storageEngine',
                                                            width: 120,
                                                        },
                                                        {
                                                            title: '创建时间',
                                                            dataIndex: 'createTime',
                                                            key: 'createTime',
                                                            width: 160,
                                                            render: (time: string | null) => formatDateTime(time),
                                                        },
                                                        {
                                                            title: '更新时间',
                                                            dataIndex: 'updateTime',
                                                            key: 'updateTime',
                                                            width: 160,
                                                            render: (time: string | null) => formatDateTime(time),
                                                        },
                                                        {
                                                            title: '操作',
                                                            key: 'action',
                                                            width: 120,
                                                            fixed: 'right' as const,
                                                            render: (_: unknown, record: AssetTableInfo) => (
                                                                <Space size="small">
                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        icon={<EditOutlined />}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            // 表编辑功能（演示用，仅提示）
                                                                            message.info(`编辑表 "${record.tableName}" 功能（演示）`)
                                                                        }}
                                                                    >
                                                                        编辑
                                                                    </Button>
                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            // 表删除功能（演示用，逻辑删除）
                                                                            showDialog({
                                                                                title: '确认删除',
                                                                                children: (
                                                                                    <div>
                                                                                        <p>确定要删除表 "{record.tableName}" 吗？</p>
                                                                                        <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                                                                                            注意：此操作为逻辑删除，数据不会真正删除
                                                                                        </p>
                                                                                    </div>
                                                                                ),
                                                                                onOk: async () => {
                                                                                    // 逻辑删除：从表列表中移除
                                                                                    setTableList(prev => 
                                                                                        prev.filter(table => table.tableName !== record.tableName)
                                                                                    )
                                                                                    message.success('表删除成功')
                                                                                },
                                                                            })
                                                                        }}
                                                                    >
                                                                        删除
                                                                    </Button>
                                                                </Space>
                                                            ),
                                                        },
                                                    ]}
                                                    pagination={false}
                                                    size='small'
                                                    scroll={{ x: 1400, y: 400 }}
                                                    onRow={(record) => ({
                                                        onClick: () => {
                                                            handleTableRowClick(record.tableName)
                                                        },
                                                        style: {
                                                            cursor: 'pointer',
                                                        },
                                                    })}
                                                />
                                            </Spin>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'info',
                                    label: '信息',
                                    children: (
                                        <div className={styles.infoSection}>
                                            <div className={styles.sectionTitle}>基本信息</div>
                                            <Descriptions bordered column={2} size='small'>
                                                <Descriptions.Item label='类别名称'>{cat.name}</Descriptions.Item>
                                                <Descriptions.Item label='所属数据源'>{ds?.name || '-'}</Descriptions.Item>
                                                <Descriptions.Item label='数据库'>{cat.database}</Descriptions.Item>
                                                <Descriptions.Item label='包含表数量'>{cat.tables.length}</Descriptions.Item>
                                            </Descriptions>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </>
            )
        }

        return null
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={2} style={{ margin: 0 }}>
                    <DatabaseOutlined style={{ marginRight: 8 }} />
                    数据资产管理
                </Title>
            </div>
            <Alert
                message='数据资产管理'
                description='管理数据源、资产类别、表和字段的层级结构，支持树形浏览和详情查看。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Layout className={styles.layout} hasSider>
                <Sider width={400} className={styles.sider}>
                    <div className={styles.toolbar}>
                        <Search
                            placeholder='搜索数据源、类别、表'
                            allowClear
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            prefix={<SearchOutlined />}
                            style={{ flex: 1 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchAssetTree(debouncedSearchText || undefined)}
                            style={{ marginLeft: 8 }}
                            title='刷新'
                        />
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() => setAddAssetModalVisible(true)}
                            style={{ marginLeft: 8 }}
                        >
                            新增资产
                        </Button>
                    </div>
                    <div className={styles.treeContainer}>
                        <Spin spinning={loading}>
                            <Tree
                                treeData={filteredTreeData as DataNode[]}
                                selectedKeys={selectedKeys}
                                expandedKeys={expandedKeys}
                                onSelect={keys => setSelectedKeys(keys)}
                                onExpand={keys => setExpandedKeys(keys)}
                                showLine={{ showLeafIcon: false }}
                                defaultExpandAll={false}
                                blockNode
                            titleRender={(nodeData): React.ReactNode => {
                                const node = nodeData as ExtendedDataNode
                                if (node.nodeType === 'dataSource') {
                                    const ds = node.data as DataSource
                                    const menuItems: MenuProps['items'] = [
                                        {
                                            key: 'add-category',
                                            label: '添加资产类别',
                                            icon: <PlusOutlined />,
                                            onClick: () => {
                                                handleAddCategoryClick(ds)
                                            },
                                        },
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            key: 'edit',
                                            label: '编辑',
                                            icon: <EditOutlined />,
                                            onClick: () => {
                                                handleEditAsset(ds)
                                            },
                                        },
                                        {
                                            key: 'delete',
                                            label: '删除',
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () => {
                                                handleDeleteAsset(ds)
                                            },
                                        },
                                    ]

                                    return (
                                        <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    paddingRight: 8,
                                                }}
                                            >
                                                <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                <span style={{ flex: 1 }}>{ds.name}</span>
                                                <Tag
                                                    color={ds.status === 'connected' ? 'success' : 'default'}
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {ds.status === 'connected' ? '已连接' : '未连接'}
                                                </Tag>
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<PlusOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleAddCategoryClick(ds)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 8,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                    }}
                                                    title='添加资产类别'
                                                />
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleEditAsset(ds)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 4,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                        color: '#1890ff',
                                                    }}
                                                    title='编辑'
                                                />
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleDeleteAsset(ds)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 4,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                        color: '#ff4d4f',
                                                    }}
                                                    title='删除'
                                                />
                                            </div>
                                        </Dropdown>
                                    )
                                } else if (node.nodeType === 'category') {
                                    const cat = node.data as AssetCategory
                                    const menuItems: MenuProps['items'] = [
                                        {
                                            key: 'edit',
                                            label: '编辑',
                                            icon: <EditOutlined />,
                                            onClick: () => {
                                                handleEditCategory(cat)
                                            },
                                        },
                                        {
                                            key: 'delete',
                                            label: '删除',
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () => {
                                                handleDeleteCategory(cat)
                                            },
                                        },
                                    ]

                                    return (
                                        <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    paddingRight: 8,
                                                }}
                                            >
                                                <FolderOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                                <span style={{ flex: 1 }}>{cat.name}</span>
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleEditCategory(cat)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 8,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                        color: '#1890ff',
                                                    }}
                                                    title='编辑'
                                                />
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleDeleteCategory(cat)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 4,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                        color: '#ff4d4f',
                                                    }}
                                                    title='删除'
                                                />
                                            </div>
                                        </Dropdown>
                                    )
                                }
                                return node.title as React.ReactNode
                            }}
                        />
                        </Spin>
                    </div>
                </Sider>
                <Content className={styles.content}>
                    <div className={styles.detailCard}>
                        {renderDetailContent()}
                    </div>
                </Content>
            </Layout>

            {/* 新增资产弹窗 */}
            <Modal
                title='新增资产'
                open={addAssetModalVisible}
                onOk={handleAddAsset}
                onCancel={() => {
                    setAddAssetModalVisible(false)
                    form.resetFields()
                }}
                width={500}
                afterOpenChange={(open) => {
                    // 弹窗打开时获取数据源选项
                    if (open) {
                        fetchDataSourceOptions()
                    }
                }}
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='资产名称'
                        rules={[{ required: true, message: '请输入资产名称' }]}
                    >
                        <Input placeholder='请输入资产名称' />
                    </Form.Item>
                    <Form.Item
                        name='dataSourceId'
                        label='数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select 
                            placeholder='请选择数据源' 
                            showSearch 
                            loading={dataSourceOptionsLoading}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {dataSourceOptions.map(option => (
                                <Option key={option.id} value={option.id} label={`${option.dbName} (${option.dbType})`}>
                                    {option.dbName} ({option.dbType.toUpperCase()})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 新增资产类别弹窗 */}
            <Modal
                title='新增资产类别'
                open={addCategoryModalVisible}
                onOk={handleAddCategory}
                onCancel={() => {
                    setAddCategoryModalVisible(false)
                    setSelectedDataSourceId('')
                    categoryForm.resetFields()
                }}
                width={600}
                afterOpenChange={async (open) => {
                    // 弹窗打开时获取表信息和数据源选项
                    if (open) {
                        fetchTableInfo()
                        await fetchDataSourceOptions()
                    }
                }}
            >
                <Form form={categoryForm} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='类别名称'
                        rules={[{ required: true, message: '请输入类别名称' }]}
                    >
                        <Input placeholder='请输入类别名称' />
                    </Form.Item>
                    <Form.Item
                        name='dataSourceId'
                        label='所属数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select 
                            placeholder='请选择数据源' 
                            disabled={!!selectedDataSourceId}
                            loading={dataSourceOptionsLoading}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {dataSourceOptions.map(option => (
                                <Option key={option.id} value={option.id} label={`${option.dbName} (${option.dbType})`}>
                                    {option.dbName} ({option.dbType.toUpperCase()})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        name='tables' 
                        label='选择表'
                        rules={[{ required: true, message: '请至少选择一个表' }]}
                    >
                        <Select
                            mode='multiple'
                            placeholder='请选择表（可多选）'
                            loading={tableInfoOptionsLoading}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {tableInfoOptions.map(table => {
                                // 处理表注释中的换行符
                                const cleanComment = (table.tableComment || '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim()
                                return (
                                    <Option 
                                        key={table.tableName} 
                                        value={table.tableName} 
                                        label={`${table.tableName} - ${cleanComment}`}
                                    >
                                        {table.tableName} - {cleanComment || '-'}
                                    </Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default DataAssetManagement

