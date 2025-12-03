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
import styles from './DataAssetManagement.module.scss'

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
}

// 资产类别
interface AssetCategory {
    id: string
    name: string
    dataSourceId: string
    database: string
    tables: string[]
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
    const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources)
    const [categories, setCategories] = useState<AssetCategory[]>(mockCategories)
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
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)

    const debouncedSearchText = useDebounce(searchText, 300)

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
        const databases = getDatabasesByDataSource(dataSource.id)
        const defaultDatabase = databases.length > 0 ? databases[0] : dataSource.database
        setSelectedDatabase(defaultDatabase || '')
        categoryForm.setFieldsValue({
            dataSourceId: dataSource.id,
            database: defaultDatabase || dataSource.database,
            tables: [],
        })
        setAddCategoryModalVisible(true)
    }, [categoryForm, dataSources])

    // 构建树形数据
    const treeData = useMemo(() => {
        const buildTree = (): ExtendedDataNode[] => {
            const nodes: ExtendedDataNode[] = []

            dataSources.forEach(ds => {
                const menuItems: MenuProps['items'] = [
                    {
                        key: 'add-category',
                        label: '添加资产类别',
                        icon: <PlusOutlined />,
                        onClick: () => {
                            handleAddCategoryClick(ds)
                        },
                    },
                ]

                const dsNode: ExtendedDataNode = {
                    title: ds.name, // 先设置简单的标题，稍后通过 titleRender 自定义
                    key: `ds-${ds.id}`,
                    nodeType: 'dataSource',
                    data: ds,
                    children: [],
                }

                // 添加资产类别（仅显示两个层级：资产 -> 资产类别）
                const dsCategories = categories.filter(cat => cat.dataSourceId === ds.id)
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
    }, [dataSources, categories, handleAddCategoryClick])

    // 过滤树形数据
    const filteredTreeData = useMemo(() => {
        if (!debouncedSearchText) return treeData

        const filterTree = (nodes: ExtendedDataNode[]): ExtendedDataNode[] => {
            return nodes
                .map(node => {
                    const title = String(node.title)
                    const matches = title.toLowerCase().includes(debouncedSearchText.toLowerCase())

                    let filteredChildren: ExtendedDataNode[] = []
                    if (node.children) {
                        filteredChildren = filterTree(node.children as ExtendedDataNode[])
                    }

                    if (matches || filteredChildren.length > 0) {
                        return {
                            ...node,
                            children: filteredChildren.length > 0 ? filteredChildren : node.children,
                        }
                    }
                    return null
                })
                .filter(Boolean) as ExtendedDataNode[]
        }

        return filterTree(treeData)
    }, [treeData, debouncedSearchText])

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
                        setSelectedTable(null) // 重置选中的表
                    } else if (node.nodeType === 'dataSource') {
                        setViewMode('empty')
                        setSelectedCategory(null)
                        setSelectedTable(null)
                    }
                }
            } else {
                setSelectedNode(null)
                setViewMode('empty')
                setSelectedCategory(null)
                setSelectedTable(null)
            }
        } else {
            setSelectedNode(null)
            setViewMode('empty')
            setSelectedCategory(null)
            setSelectedTable(null)
        }
    }, [selectedKeys, treeData])

    // 处理新增资产
    const handleAddAsset = async () => {
        try {
            const values = await form.validateFields()
            // 从选中的数据源获取信息
            const selectedDataSource = dataSources.find(ds => ds.id === values.dataSourceId)
            if (!selectedDataSource) {
                message.error('请选择数据源')
                return
            }
            
            // 创建新的资产（使用资产名称，但关联到选中的数据源）
            const newDataSource: DataSource = {
                id: `ds${Date.now()}`,
                name: values.name, // 使用资产名称
                type: selectedDataSource.type,
                host: selectedDataSource.host,
                port: selectedDataSource.port,
                database: selectedDataSource.database,
                status: selectedDataSource.status,
            }
            setDataSources([...dataSources, newDataSource])
            message.success('资产添加成功')
            setAddAssetModalVisible(false)
            form.resetFields()
        } catch (error) {
            console.error('添加失败:', error)
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

            // 直接保存，不再显示确认弹窗
            const newCategory: AssetCategory = {
                id: `cat${Date.now()}`,
                name: values.name,
                dataSourceId: dataSourceId, // 确保使用正确的数据源ID
                database: values.database,
                tables: values.tables || [],
            }
            
            setCategories([...categories, newCategory])
            message.success('资产类别添加成功')
            setAddCategoryModalVisible(false)
            setSelectedDataSourceId('')
            setSelectedDatabase('')
            categoryForm.resetFields()
            
            // 自动展开对应的数据源节点，确保新添加的类别可见
            const dsKey = `ds-${dataSourceId}`
            if (!expandedKeys.includes(dsKey)) {
                setExpandedKeys([...expandedKeys, dsKey])
            }
        } catch (error) {
            console.error('添加失败:', error)
            // 显示表单验证错误
            if (error && typeof error === 'object' && 'errorFields' in error) {
                message.error('请检查表单填写是否正确')
            }
        }
    }

    // 处理表行点击
    const handleTableRowClick = (tableName: string) => {
        const tableInfo = mockTables[tableName]
        if (tableInfo) {
            setSelectedTable(tableInfo)
            setViewMode('tableFields')
        }
    }

    // 返回到表列表
    const handleBackToTableList = () => {
        setSelectedTable(null)
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
        if (viewMode === 'tableFields' && selectedTable) {
            const columns = [
                {
                    title: '字段名',
                    dataIndex: 'name',
                    key: 'name',
                    width: 180,
                    fixed: 'left' as const,
                    render: (text: string, record: FieldInfo) => (
                        <span style={{ fontWeight: record.primaryKey ? 600 : 400 }}>
                            {text}
                            {record.primaryKey && (
                                <Tag color='gold' style={{ marginLeft: 8, fontSize: 11 }}>PK</Tag>
                            )}
                        </span>
                    ),
                },
                {
                    title: '数据类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 150,
                    render: (type: string, record: FieldInfo) => {
                        const length = record.length ? `(${record.length})` : ''
                        return <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>{`${type}${length}`}</code>
                    },
                },
                {
                    title: '允许为空',
                    dataIndex: 'nullable',
                    key: 'nullable',
                    width: 100,
                    align: 'center' as const,
                    render: (nullable: boolean) => (
                        nullable ? <span style={{ color: '#52c41a' }}>✓</span> : <span style={{ color: '#ff4d4f' }}>✗</span>
                    ),
                },
                {
                    title: '默认值',
                    dataIndex: 'default',
                    key: 'default',
                    width: 150,
                    render: (value: string) => value ? <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>{value}</code> : <span style={{ color: '#bfbfbf' }}>-</span>,
                },
                {
                    title: '说明',
                    dataIndex: 'comment',
                    key: 'comment',
                    ellipsis: true,
                    render: (text: string) => text || <span style={{ color: '#bfbfbf' }}>-</span>,
                },
            ]

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
                            {selectedTable.name}
                        </Title>
                        {selectedTable.comment && (
                            <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>
                                {selectedTable.comment}
                            </span>
                        )}
                    </div>
                    <div className={styles.detailContent}>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>基本信息</div>
                            <Descriptions bordered column={3} size='small' style={{ marginBottom: 20 }}>
                                <Descriptions.Item label='表名'>{selectedTable.name}</Descriptions.Item>
                                <Descriptions.Item label='模式'>{selectedTable.schema}</Descriptions.Item>
                                <Descriptions.Item label='记录数'>
                                    {selectedTable.rowCount?.toLocaleString() || '-'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>字段列表 ({selectedTable.fields.length})</div>
                            <Table
                                className={styles.infoTable}
                                dataSource={selectedTable.fields}
                                columns={columns}
                                rowKey='name'
                                pagination={false}
                                size='small'
                                scroll={{ x: 800 }}
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
                                    label: `表 (${cat.tables.length})`,
                                    children: (
                                        <div className={styles.infoSection}>
                                            <Table
                                                className={styles.infoTable}
                                                dataSource={cat.tables.map((table, index) => {
                                                    const tableInfo = mockTables[table]
                                                    return {
                                                        key: index,
                                                        name: table,
                                                        schema: tableInfo?.schema || cat.database,
                                                        comment: tableInfo?.comment || '-',
                                                        rowCount: tableInfo?.rowCount || 0,
                                                        fieldCount: tableInfo?.fields?.length || 0,
                                                        createTime: '2024-01-15 10:00:00',
                                                        updateTime: '2024-01-20 14:30:00',
                                                        tableType: 'BASE TABLE',
                                                        engine: 'InnoDB',
                                                        tableInfo: tableInfo, // 保存表信息用于点击
                                                    }
                                                })}
                                                columns={[
                                                    { 
                                                        title: '表名', 
                                                        dataIndex: 'name', 
                                                        key: 'name',
                                                        width: 180,
                                                        fixed: 'left' as const,
                                                    },
                                                    { 
                                                        title: '模式/数据库', 
                                                        dataIndex: 'schema', 
                                                        key: 'schema',
                                                        width: 150,
                                                    },
                                                    { 
                                                        title: '说明', 
                                                        dataIndex: 'comment', 
                                                        key: 'comment',
                                                        ellipsis: true,
                                                        width: 200,
                                                    },
                                                    {
                                                        title: '记录数',
                                                        dataIndex: 'rowCount',
                                                        key: 'rowCount',
                                                        width: 120,
                                                        align: 'right' as const,
                                                        render: (count: number) => count.toLocaleString(),
                                                    },
                                                    {
                                                        title: '字段数',
                                                        dataIndex: 'fieldCount',
                                                        key: 'fieldCount',
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
                                                        dataIndex: 'engine',
                                                        key: 'engine',
                                                        width: 120,
                                                    },
                                                    {
                                                        title: '创建时间',
                                                        dataIndex: 'createTime',
                                                        key: 'createTime',
                                                        width: 160,
                                                    },
                                                    {
                                                        title: '更新时间',
                                                        dataIndex: 'updateTime',
                                                        key: 'updateTime',
                                                        width: 160,
                                                    },
                                                ]}
                                                pagination={false}
                                                size='small'
                                                scroll={{ x: 1200 }}
                                                onRow={(record) => ({
                                                    onClick: () => {
                                                        handleTableRowClick(record.name)
                                                    },
                                                    style: {
                                                        cursor: 'pointer',
                                                    },
                                                })}
                                            />
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
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() => setAddAssetModalVisible(true)}
                            style={{ marginLeft: 8 }}
                        >
                            新增资产
                        </Button>
                    </div>
                    <div className={styles.treeContainer}>
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
                                            </div>
                                        </Dropdown>
                                    )
                                }
                                return node.title as React.ReactNode
                            }}
                        />
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
                        <Select placeholder='请选择数据源' showSearch filterOption={(input, option) => {
                            const label = String(option?.label ?? '')
                            return label.toLowerCase().includes(input.toLowerCase())
                        }}>
                            {dataSources.map(ds => (
                                <Option key={ds.id} value={ds.id} label={ds.name}>
                                    {ds.name} ({ds.type.toUpperCase()})
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
                    setSelectedDatabase('')
                    categoryForm.resetFields()
                }}
                width={600}
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
                        >
                            {dataSources.map(ds => (
                                <Option key={ds.id} value={ds.id}>
                                    {ds.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='database'
                        label='数据库'
                        rules={[{ required: true, message: '请选择数据库' }]}
                    >
                        <Select 
                            placeholder='请选择数据库'
                            onChange={(value) => {
                                setSelectedDatabase(value)
                                // 切换数据库时清空已选表
                                categoryForm.setFieldsValue({ tables: [] })
                            }}
                            value={selectedDatabase}
                        >
                            {selectedDataSourceId && getDatabasesByDataSource(selectedDataSourceId).map(db => (
                                <Option key={db} value={db}>
                                    {db}
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
                            placeholder={selectedDatabase ? '请选择表（可多选）' : '请先选择数据库'}
                            disabled={!selectedDatabase}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {selectedDatabase && getTablesByDatabase(selectedDatabase).map(tableName => {
                                const table = mockTables[tableName]
                                return (
                                    <Option key={tableName} value={tableName} label={tableName}>
                                        {tableName} - {table?.comment || '-'}
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

