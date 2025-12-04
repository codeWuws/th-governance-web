import React, { useState, useEffect, useMemo } from 'react'
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
    Tree,
    Tabs,
    Row,
    Col,
    Descriptions,
    Divider,
    Tooltip,
    TreeSelect,
    Checkbox,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
    FolderOutlined,
    FolderOpenOutlined,
    TagOutlined,
    ImportOutlined,
    ExportOutlined,
    CopyOutlined,
    MergeCellsOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { useDebounce } from '../../hooks/useDebounce'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

// 类别标准接口定义
interface CategoryStandard {
    id: string
    name: string // 类别名称
    code: string // 类别编号
    parentId?: string // 父类别ID
    level: number // 层级
    enabled: boolean // 是否启用
    description?: string // 描述
    englishName?: string // 英文名
    aliases?: string[] // 别名列表
    tags?: string[] // 标签列表
    standardReference?: string // 标准引用（如ICD-10, SNOMED CT等）
    standardVersion?: string // 标准版本
    status: 'active' | 'inactive' | 'deprecated' // 状态
    createTime: string
    updateTime: string
    creator: string
    children?: CategoryStandard[] // 子类别
}

// 标签组接口
interface TagGroup {
    id: string
    name: string
    tags: string[]
    description?: string
}

// 模拟数据
const mockCategoryData: CategoryStandard[] = [
    {
        id: '1',
        name: '科室分类',
        code: 'DEPT_001',
        level: 1,
        enabled: true,
        description: '医院科室分类体系',
        englishName: 'Department Classification',
        aliases: ['科室', '部门'],
        tags: ['组织架构', '科室管理'],
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '系统管理员',
        children: [
            {
                id: '1-1',
                name: '内科',
                code: 'DEPT_001_001',
                parentId: '1',
                level: 2,
                enabled: true,
                description: '内科科室',
                englishName: 'Internal Medicine',
                aliases: ['内科学'],
                tags: ['临床科室'],
                status: 'active',
                createTime: '2024-01-10 09:00:00',
                updateTime: '2024-01-15 14:30:00',
                creator: '系统管理员',
                children: [
                    {
                        id: '1-1-1',
                        name: '心血管内科',
                        code: 'DEPT_001_001_001',
                        parentId: '1-1',
                        level: 3,
                        enabled: true,
                        description: '心血管内科',
                        englishName: 'Cardiology',
                        aliases: ['心内科'],
                        tags: ['专科', '心血管'],
                        status: 'active',
                        createTime: '2024-01-10 09:00:00',
                        updateTime: '2024-01-15 14:30:00',
                        creator: '系统管理员',
                    },
                ],
            },
        ],
    },
    {
        id: '2',
        name: '人员分类',
        code: 'PERSON_001',
        level: 1,
        enabled: true,
        description: '医院人员分类体系',
        englishName: 'Personnel Classification',
        aliases: ['人员', '员工'],
        tags: ['人力资源', '人员管理'],
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '系统管理员',
        children: [
            {
                id: '2-1',
                name: '医生',
                code: 'PERSON_001_001',
                parentId: '2',
                level: 2,
                enabled: true,
                description: '医生人员分类',
                englishName: 'Doctor',
                aliases: ['医师', '大夫'],
                tags: ['医疗人员', '临床'],
                status: 'active',
                createTime: '2024-01-11 10:00:00',
                updateTime: '2024-01-16 16:45:00',
                creator: '系统管理员',
            },
            {
                id: '2-2',
                name: '护士',
                code: 'PERSON_001_002',
                parentId: '2',
                level: 2,
                enabled: true,
                description: '护士人员分类',
                englishName: 'Nurse',
                aliases: ['护理人员'],
                tags: ['医疗人员', '护理'],
                status: 'active',
                createTime: '2024-01-11 10:00:00',
                updateTime: '2024-01-16 16:45:00',
                creator: '系统管理员',
            },
        ],
    },
]

const mockTagGroups: TagGroup[] = [
    {
        id: '1',
        name: '组织架构',
        tags: ['临床科室', '医技科室', '行政科室', '后勤科室'],
        description: '医院组织架构相关标签',
    },
    {
        id: '2',
        name: '人员类型',
        tags: ['医疗人员', '护理人员', '技术人员', '管理人员'],
        description: '人员类型相关标签',
    },
]

const CategoryStandardManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [categoryData, setCategoryData] = useState<CategoryStandard[]>([])
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [enabledFilter, setEnabledFilter] = useState<boolean | null>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [tagModalVisible, setTagModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<CategoryStandard | null>(null)
    const [viewingRecord, setViewingRecord] = useState<CategoryStandard | null>(null)
    const [selectedCategoryType, setSelectedCategoryType] = useState<string>('')
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
    const [tagGroups, setTagGroups] = useState<TagGroup[]>([])
    const [activeTab, setActiveTab] = useState('tree')

    const [form] = Form.useForm()
    const [tagForm] = Form.useForm()

    const debouncedSearchText = useDebounce(searchText, 300)

    useEffect(() => {
        fetchData()
        fetchTagGroups()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setCategoryData(mockCategoryData)
        } catch {
            message.error('获取类别数据失败')
        } finally {
            setLoading(false)
        }
    }

    const fetchTagGroups = async () => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            setTagGroups(mockTagGroups)
        } catch {
            message.error('获取标签组失败')
        }
    }

    // 过滤树形数据（保留树形结构用于表格分级查看）
    const filterTreeData = (data: CategoryStandard[]): CategoryStandard[] => {
        return data
            .map(item => {
                // 检查当前项是否匹配筛选条件
                const matchesSearch = !debouncedSearchText || 
                    item.name.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.code.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.description?.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
                    item.englishName?.toLowerCase().includes(debouncedSearchText.toLowerCase())
                
                const matchesStatus = !statusFilter || item.status === statusFilter
                const matchesEnabled = enabledFilter === null || item.enabled === enabledFilter
                
                const matches = matchesSearch && matchesStatus && matchesEnabled
                
                // 递归处理子节点
                const filteredChildren = item.children && item.children.length > 0
                    ? filterTreeData(item.children)
                    : undefined
                
                // 如果当前项或子项匹配，则保留
                if (matches || (filteredChildren && filteredChildren.length > 0)) {
                    return {
                        ...item,
                        children: filteredChildren,
                    }
                }
                
                return null
            })
            .filter((item): item is CategoryStandard => item !== null)
    }

    // 使用 useMemo 缓存过滤后的树形数据
    const filteredTreeData = useMemo(() => {
        return filterTreeData(categoryData)
    }, [categoryData, debouncedSearchText, statusFilter, enabledFilter])

    // 扁平化树形数据用于其他用途（如果需要）
    const flattenTree = (data: CategoryStandard[]): CategoryStandard[] => {
        const result: CategoryStandard[] = []
        const traverse = (items: CategoryStandard[]) => {
            items.forEach(item => {
                const { children, ...itemWithoutChildren } = item
                result.push(itemWithoutChildren)
                if (children && children.length > 0) {
                    traverse(children)
                }
            })
        }
        traverse(data)
        return result
    }

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            enabled: true,
            status: 'active',
            level: 1,
            parentId: undefined,
        })
        setModalVisible(true)
    }

    const handleAddChild = (parentRecord: CategoryStandard) => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            parentId: parentRecord.id,
            level: parentRecord.level + 1,
            enabled: true,
            status: 'active',
            aliases: '',
            tags: [],
        })
        setModalVisible(true)
    }

    const handleEdit = (record: CategoryStandard) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            aliases: record.aliases?.join(',') || '',
            tags: record.tags || [],
            parentId: record.parentId || undefined,
        })
        setModalVisible(true)
    }

    const handleView = (record: CategoryStandard) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            // 检查是否有子类别
            const hasChildren = categoryData.some(cat => {
                const findInTree = (items: CategoryStandard[]): boolean => {
                    for (const item of items) {
                        if (item.id === id && item.children && item.children.length > 0) {
                            return true
                        }
                        if (item.children) {
                            if (findInTree(item.children)) return true
                        }
                    }
                    return false
                }
                return findInTree([cat])
            })

            if (hasChildren) {
                message.warning('该类别下存在子类别，无法删除。请先删除或移动子类别。')
                return
            }

            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            const removeFromTree = (items: CategoryStandard[]): CategoryStandard[] => {
                return items
                    .filter(item => item.id !== id)
                    .map(item => ({
                        ...item,
                        children: item.children ? removeFromTree(item.children) : undefined,
                    }))
            }
            setCategoryData(removeFromTree(categoryData))
            message.success('删除成功')
        } catch {
            message.error('删除失败')
        }
    }

    const handleToggleEnabled = async (record: CategoryStandard) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            const updateInTree = (items: CategoryStandard[]): CategoryStandard[] => {
                return items.map(item => {
                    if (item.id === record.id) {
                        return { ...item, enabled: !item.enabled, updateTime: new Date().toLocaleString() }
                    }
                    if (item.children) {
                        return { ...item, children: updateInTree(item.children) }
                    }
                    return item
                })
            }
            setCategoryData(updateInTree(categoryData))
            message.success(record.enabled ? '已禁用' : '已启用')
        } catch {
            message.error('操作失败')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const aliasesArray = values.aliases
                ? typeof values.aliases === 'string'
                    ? values.aliases
                          .split(',')
                          .map((a: string) => a.trim())
                          .filter((a: string) => a)
                    : values.aliases
                : []

            // 处理 tags，确保是数组格式
            const tagsArray = Array.isArray(values.tags) ? values.tags : []

            if (editingRecord) {
                // 编辑 - 需要检查是否修改了父类别
                const updateInTree = (items: CategoryStandard[]): CategoryStandard[] => {
                    const result: CategoryStandard[] = []
                    for (const item of items) {
                        if (item.id === editingRecord.id) {
                            // 如果修改了父类别，需要从当前位置移除，然后添加到新位置
                            if (values.parentId !== editingRecord.parentId) {
                                // 从当前位置移除，不添加到结果中
                                continue
                            }
                            // 更新当前项
                            result.push({
                                ...item,
                                name: values.name,
                                code: values.code,
                                englishName: values.englishName || undefined,
                                description: values.description || undefined,
                                aliases: aliasesArray,
                                tags: tagsArray,
                                standardReference: values.standardReference || undefined,
                                standardVersion: values.standardVersion || undefined,
                                enabled: values.enabled !== undefined ? values.enabled : item.enabled,
                                status: values.status || item.status,
                                updateTime: new Date().toLocaleString(),
                                children: item.children,
                            })
                        } else {
                            // 递归处理子项
                            const updatedItem = {
                                ...item,
                                children: item.children ? updateInTree(item.children) : undefined,
                            }
                            result.push(updatedItem)
                        }
                    }
                    return result
                }

                let updatedData = updateInTree(categoryData)

                // 如果修改了父类别，需要重新插入到新位置
                if (values.parentId !== editingRecord.parentId) {
                    const editedItem: CategoryStandard = {
                        ...editingRecord,
                        name: values.name,
                        code: values.code,
                        englishName: values.englishName || undefined,
                        description: values.description || undefined,
                        aliases: aliasesArray,
                        tags: tagsArray,
                        standardReference: values.standardReference || undefined,
                        standardVersion: values.standardVersion || undefined,
                        enabled: values.enabled !== undefined ? values.enabled : editingRecord.enabled,
                        status: values.status || editingRecord.status,
                        parentId: values.parentId || undefined,
                        level: values.parentId
                            ? (() => {
                                  const findLevel = (items: CategoryStandard[], targetId: string, currentLevel = 1): number => {
                                      for (const item of items) {
                                          if (item.id === targetId) {
                                              return currentLevel + 1
                                          }
                                          if (item.children) {
                                              const found = findLevel(item.children, targetId, currentLevel + 1)
                                              if (found > 0) return found
                                          }
                                      }
                                      return 0
                                  }
                                  return findLevel(updatedData, values.parentId)
                              })()
                            : 1,
                        updateTime: new Date().toLocaleString(),
                        children: editingRecord.children || [],
                    }

                    if (values.parentId) {
                        // 添加到父类别下
                        const addToTree = (items: CategoryStandard[]): CategoryStandard[] => {
                            return items.map(item => {
                                if (item.id === values.parentId) {
                                    return {
                                        ...item,
                                        children: [...(item.children || []), editedItem],
                                    }
                                }
                                if (item.children) {
                                    return { ...item, children: addToTree(item.children) }
                                }
                                return item
                            })
                        }
                        updatedData = addToTree(updatedData)
                    } else {
                        // 添加到根级别
                        updatedData = [...updatedData, editedItem]
                    }
                }

                setCategoryData(updatedData)
                message.success('更新成功')
            } else {
                // 新增
                const parentLevel = values.parentId
                    ? (() => {
                          const findLevel = (items: CategoryStandard[], targetId: string, currentLevel = 1): number => {
                              for (const item of items) {
                                  if (item.id === targetId) {
                                      return currentLevel + 1
                                  }
                                  if (item.children) {
                                      const found = findLevel(item.children, targetId, currentLevel + 1)
                                      if (found > 0) return found
                                  }
                              }
                              return 0
                          }
                          return findLevel(categoryData, values.parentId)
                      })()
                    : 1

                const newRecord: CategoryStandard = {
                    id: Date.now().toString(),
                    name: values.name,
                    code: values.code,
                    parentId: values.parentId || undefined,
                    level: parentLevel,
                    enabled: values.enabled !== undefined ? values.enabled : true,
                    description: values.description || undefined,
                    englishName: values.englishName || undefined,
                    aliases: aliasesArray,
                    tags: tagsArray,
                    standardReference: values.standardReference || undefined,
                    standardVersion: values.standardVersion || undefined,
                    status: values.status || 'active',
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                    children: [],
                }

                if (values.parentId) {
                    // 添加到父类别下
                    const addToTree = (items: CategoryStandard[]): CategoryStandard[] => {
                        return items.map(item => {
                            if (item.id === values.parentId) {
                                return {
                                    ...item,
                                    children: [...(item.children || []), newRecord],
                                }
                            }
                            if (item.children) {
                                return { ...item, children: addToTree(item.children) }
                            }
                            return item
                        })
                    }
                    setCategoryData(addToTree(categoryData))
                } else {
                    // 添加到根级别
                    setCategoryData([...categoryData, newRecord])
                }
                message.success('添加成功')
            }

            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
        } catch (error) {
            console.error('操作失败:', error)
            message.error('操作失败，请检查表单数据')
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    // 将类别数据转换为树形结构（用于 Tree 组件）
    // 使用 useMemo 缓存转换结果，并确保 key 的唯一性
    const treeData = useMemo(() => {
        const globalKeySet = new Set<string>()
        
        const convert = (items: CategoryStandard[], parentPath: string = ''): DataNode[] => {
            return items.map((item, index) => {
                // 使用层级路径确保 key 的唯一性
                const pathKey = parentPath ? `${parentPath}-${index}` : `root-${index}`
                let finalKey = `${pathKey}-${item.id}`
                
                // 如果 key 已存在，添加后缀确保唯一性
                let suffix = 0
                while (globalKeySet.has(finalKey)) {
                    suffix++
                    finalKey = `${pathKey}-${item.id}-${suffix}`
                }
                globalKeySet.add(finalKey)
                
                return {
                    title: (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>
                                <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>({item.code})</span>
                                {!item.enabled && (
                                    <Tag color='default' style={{ marginLeft: 8 }}>
                                        已禁用
                                    </Tag>
                                )}
                            </span>
                        </div>
                    ),
                    key: finalKey,
                    icon: item.enabled ? <FolderOpenOutlined /> : <FolderOutlined />,
                    children: item.children && item.children.length > 0 
                        ? convert(item.children, finalKey) 
                        : undefined,
                }
            })
        }
        
        return convert(categoryData)
    }, [categoryData])

    // 将类别数据转换为 TreeSelect 需要的格式
    const convertToTreeSelectData = (data: CategoryStandard[], excludeId?: string): any[] => {
        const keySet = new Set<string>()
        
        const convert = (items: CategoryStandard[], parentPath: string = ''): any[] => {
            return items
                .filter(item => item.id !== excludeId)
                .map((item, index) => {
                    const pathKey = parentPath ? `${parentPath}-${index}` : `root-${index}`
                    let finalKey = `${pathKey}-${item.id}`
                    
                    // 确保 key 唯一
                    let suffix = 0
                    while (keySet.has(finalKey)) {
                        suffix++
                        finalKey = `${pathKey}-${item.id}-${suffix}`
                    }
                    keySet.add(finalKey)
                    
                    return {
                        title: `${item.name} (${item.code})`,
                        value: item.id,
                        key: finalKey,
                        children: item.children && item.children.length > 0 
                            ? convert(item.children, finalKey) 
                            : undefined,
                    }
                })
        }
        
        return convert(data)
    }

    // 获取所有父类别选项（用于选择父类别）
    const getAllParentOptions = (): CategoryStandard[] => {
        const result: CategoryStandard[] = []
        const traverse = (items: CategoryStandard[], excludeId?: string) => {
            items.forEach(item => {
                if (item.id !== excludeId) {
                    result.push(item)
                    if (item.children) {
                        traverse(item.children, excludeId)
                    }
                }
            })
        }
        traverse(categoryData, editingRecord?.id)
        return result
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'inactive':
                return 'default'
            case 'deprecated':
                return 'error'
            default:
                return 'default'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '启用'
            case 'inactive':
                return '停用'
            case 'deprecated':
                return '已废弃'
            default:
                return status
        }
    }

    const columns = [
        {
            title: '类别名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: CategoryStandard) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    {record.englishName && (
                        <div style={{ fontSize: 12, color: '#999' }}>{record.englishName}</div>
                    )}
                </div>
            ),
        },
        {
            title: '类别编号',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: (text: string) => (
                <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>
            ),
        },
        {
            title: '层级',
            dataIndex: 'level',
            key: 'level',
            width: 80,
            render: (level: number) => <Tag color='blue'>L{level}</Tag>,
        },
        {
            title: '是否启用',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 100,
            render: (enabled: boolean, record: CategoryStandard) => (
                <Switch checked={enabled} onChange={() => handleToggleEnabled(record)} />
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 200,
            render: (tags: string[]) =>
                tags && tags.length > 0 ? (
                    <Space size={[0, 8]} wrap>
                        {tags.map(tag => (
                            <Tag key={tag} color='purple'>
                                {tag}
                            </Tag>
                        ))}
                    </Space>
                ) : (
                    '-'
                ),
        },
        {
            title: '标准引用',
            dataIndex: 'standardReference',
            key: 'standardReference',
            width: 150,
            render: (ref: string) => (ref ? <Tag color='orange'>{ref}</Tag> : '-'),
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
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            width: 150,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: unknown, record: CategoryStandard) => (
                <Space size='small'>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            size='small'
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='添加子类别'>
                        <Button
                            type='text'
                            icon={<PlusOutlined />}
                            size='small'
                            onClick={() => handleAddChild(record)}
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
                        title='确定要删除这个类别吗？'
                        description='删除后无法恢复，请谨慎操作'
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
                    类别标准管理
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button icon={<ImportOutlined />} onClick={() => message.info('导入功能开发中')}>
                        导入标准
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={() => message.info('导出功能开发中')}>
                        导出
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增类别
                    </Button>
                </Space>
            </div>
            <Alert
                message='类别标准管理'
                description='支持多层次分类体系构建、标签管理、标准引用集成和权限控制。可创建树形结构分类（如科室分类、人员分类），支持启用/禁用状态管理。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'tree',
                            label: '树形视图',
                            children: (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Space wrap>
                                            <Search
                                                placeholder='搜索类别名称、编号或描述'
                                                allowClear
                                                onSearch={handleSearch}
                                                style={{ width: 300 }}
                                            />
                                            <Select
                                                placeholder='状态筛选'
                                                style={{ width: 120 }}
                                                allowClear
                                                onChange={setStatusFilter}
                                            >
                                                <Option value='active'>启用</Option>
                                                <Option value='inactive'>停用</Option>
                                                <Option value='deprecated'>已废弃</Option>
                                            </Select>
                                            <Select
                                                placeholder='启用状态'
                                                style={{ width: 120 }}
                                                allowClear
                                                onChange={setEnabledFilter}
                                            >
                                                <Option value={true}>已启用</Option>
                                                <Option value={false}>已禁用</Option>
                                            </Select>
                                        </Space>
                                    </div>
                                    <Tree
                                        showIcon
                                        defaultExpandAll
                                        treeData={treeData}
                                        expandedKeys={expandedKeys}
                                        selectedKeys={selectedKeys}
                                        onExpand={setExpandedKeys}
                                        onSelect={setSelectedKeys}
                                        style={{ minHeight: 400 }}
                                    />
                                </>
                            ),
                        },
                        {
                            key: 'list',
                            label: '列表视图',
                            children: (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <Space wrap>
                                            <Search
                                                placeholder='搜索类别名称、编号或描述'
                                                allowClear
                                                onSearch={handleSearch}
                                                style={{ width: 300 }}
                                            />
                                            <Select
                                                placeholder='状态筛选'
                                                style={{ width: 120 }}
                                                allowClear
                                                onChange={setStatusFilter}
                                            >
                                                <Option value='active'>启用</Option>
                                                <Option value='inactive'>停用</Option>
                                                <Option value='deprecated'>已废弃</Option>
                                            </Select>
                                            <Select
                                                placeholder='启用状态'
                                                style={{ width: 120 }}
                                                allowClear
                                                onChange={setEnabledFilter}
                                            >
                                                <Option value={true}>已启用</Option>
                                                <Option value={false}>已禁用</Option>
                                            </Select>
                                        </Space>
                                    </div>
                                    <Table
                                        columns={columns}
                                        dataSource={filteredTreeData}
                                        loading={loading}
                                        rowKey={record => record.id}
                                        scroll={{ x: 1500 }}
                                        pagination={{
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                                            pageSizeOptions: ['10', '20', '50', '100'],
                                            defaultPageSize: 20,
                                        }}
                                    />
                                </>
                            ),
                        },
                    ]}
                />
            </Card>

            {/* 新增/编辑类别弹窗 */}
            <Modal
                title={editingRecord ? '编辑类别' : '新增类别'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={800}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{ enabled: true, status: 'active', tags: [] }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='name'
                                label='类别名称'
                                rules={[{ required: true, message: '请输入类别名称' }]}
                            >
                                <Input placeholder='请输入类别名称，如：科室分类' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='code'
                                label='类别编号'
                                rules={[{ required: true, message: '请输入类别编号' }]}
                            >
                                <Input placeholder='请输入类别编号，如：DEPT_001' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name='englishName' label='英文名称'>
                                <Input placeholder='请输入英文名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='parentId' label='父类别'>
                                <TreeSelect
                                    placeholder='选择父类别（留空则为顶级类别）'
                                    treeData={convertToTreeSelectData(categoryData, editingRecord?.id)}
                                    allowClear
                                    showSearch
                                    treeDefaultExpandAll
                                    treeNodeFilterProp='title'
                                    style={{ width: '100%' }}
                                    key={editingRecord?.id || 'new'} // 添加 key 确保编辑时重新渲染
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name='description' label='描述'>
                        <TextArea rows={3} placeholder='请输入类别描述' maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name='aliases' label='别名'>
                        <Input
                            placeholder='请输入别名，多个别名用逗号分隔，如：科室,部门'
                            onBlur={e => {
                                const value = e.target.value
                                if (value) {
                                    form.setFieldsValue({
                                        aliases: value
                                            .split(',')
                                            .map(a => a.trim())
                                            .filter(a => a)
                                            .join(','),
                                    })
                                }
                            }}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name='standardReference' label='标准引用'>
                                <Select placeholder='选择标准引用' allowClear>
                                    <Option value='ICD-10'>ICD-10（国际疾病分类）</Option>
                                    <Option value='ICD-11'>ICD-11（国际疾病分类）</Option>
                                    <Option value='SNOMED CT'>SNOMED CT</Option>
                                    <Option value='LOINC'>LOINC（检验命名）</Option>
                                    <Option value='其他'>其他</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name='standardVersion' label='标准版本'>
                                <Input placeholder='请输入标准版本，如：v1.0' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name='tags' label='标签'>
                        <Select
                            mode='tags'
                            placeholder='输入标签后按回车添加，或从标签组选择'
                            style={{ width: '100%' }}
                        >
                            {tagGroups.flatMap(group => group.tags.map(tag => <Option key={tag}>{tag}</Option>))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name='enabled' label='是否启用' valuePropName='checked'>
                                <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='status' label='状态'>
                                <Select>
                                    <Option value='active'>启用</Option>
                                    <Option value='inactive'>停用</Option>
                                    <Option value='deprecated'>已废弃</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name='level' label='层级'>
                                <Input type='number' disabled />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* 详情查看弹窗 */}
            <Modal
                title='类别详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {viewingRecord && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label='类别名称' span={2}>
                            {viewingRecord.name}
                        </Descriptions.Item>
                        <Descriptions.Item label='英文名称' span={2}>
                            {viewingRecord.englishName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='类别编号'>
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
                        <Descriptions.Item label='层级'>
                            <Tag color='blue'>L{viewingRecord.level}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='是否启用'>
                            <Tag color={viewingRecord.enabled ? 'success' : 'default'}>
                                {viewingRecord.enabled ? '已启用' : '已禁用'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Tag color={getStatusColor(viewingRecord.status)}>
                                {getStatusText(viewingRecord.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label='描述' span={2}>
                            {viewingRecord.description || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='别名' span={2}>
                            {viewingRecord.aliases && viewingRecord.aliases.length > 0 ? (
                                <Space>
                                    {viewingRecord.aliases.map(alias => (
                                        <Tag key={alias}>{alias}</Tag>
                                    ))}
                                </Space>
                            ) : (
                                '-'
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label='标签' span={2}>
                            {viewingRecord.tags && viewingRecord.tags.length > 0 ? (
                                <Space wrap>
                                    {viewingRecord.tags.map(tag => (
                                        <Tag key={tag} color='purple'>
                                            {tag}
                                        </Tag>
                                    ))}
                                </Space>
                            ) : (
                                '-'
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label='标准引用'>
                            {viewingRecord.standardReference ? (
                                <Tag color='orange'>{viewingRecord.standardReference}</Tag>
                            ) : (
                                '-'
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label='标准版本'>
                            {viewingRecord.standardVersion || '-'}
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

export default CategoryStandardManagement

