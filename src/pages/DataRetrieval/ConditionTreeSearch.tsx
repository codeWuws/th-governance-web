/**
 * 条件树检索页面
 * 通过多个条件树进行复杂逻辑组合检索
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
    Card,
    Button,
    Tree,
    Select,
    Input,
    InputNumber,
    DatePicker,
    Space,
    Tag,
    message,
    Row,
    Col,
    Table,
    Empty,
    Tooltip,
    Popconfirm,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    FormOutlined,
} from '@ant-design/icons'
import { useApi } from '../../hooks/useApi'
import {
    SearchRequest,
    SearchResponse,
    PatientRecord,
    ConditionNode,
    SearchType,
    DataQuality,
    AdvancedFilter,
} from './types'
import { dataRetrievalService } from './services/dataRetrievalService'
import { useNavigate } from 'react-router-dom'
import moment, { Moment } from 'moment'
import { getEnv } from '@/utils/env'
import { logger } from '@/utils/logger'
import './ConditionTreeSearch.scss'

const { Option } = Select
const { RangePicker } = DatePicker

type FilterValue =
    | string
    | number
    | null
    | Moment
    | { min?: number; max?: number }
    | [Moment, Moment]

interface TreeNode {
    id: string
    title: string
    key: string
    type: 'AND' | 'OR' | 'NOT' | 'CONDITION'
    children?: TreeNode[]
    condition?: {
        field: string
        operator: AdvancedFilter['operator']
        value: FilterValue
        valueType: AdvancedFilter['valueType']
    }
}

const ConditionTreeSearch: React.FC = () => {
    const [conditionTree, setConditionTree] = useState<TreeNode[]>([])
    const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [totalRecords, setTotalRecords] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [searchTime, setSearchTime] = useState<number>(0)
    const [expandedKeys, setExpandedKeys] = useState<string[]>([])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const USE_MOCK = getEnv('VITE_APP_USE_MOCK_DATA_RETRIEVAL') === 'true'

    const navigate = useNavigate()
    const boundSearch = useCallback(
        (req: SearchRequest, type: SearchType) => dataRetrievalService.search(req, type),
        []
    )
    const { execute: execSearch } = useApi<{ data: SearchResponse }, [SearchRequest, SearchType]>(
        boundSearch,
        { immediate: false }
    )

    // 可用的字段选项
    const fieldOptions = [
        { label: '患者姓名', value: 'patientName', type: 'string' },
        { label: '性别', value: 'gender', type: 'select' },
        { label: '年龄', value: 'age', type: 'number' },
        { label: '科室', value: 'department', type: 'string' },
        { label: '医生', value: 'doctor', type: 'string' },
        { label: '诊断', value: 'diagnosis', type: 'string' },
        { label: '用药', value: 'medications', type: 'string' },
        { label: '就诊日期', value: 'visitDate', type: 'date' },
        { label: '数据质量', value: 'dataQuality', type: 'number' },
    ]

    // 操作符选项
    const getOperatorOptions = (fieldType: AdvancedFilter['valueType']) => {
        switch (fieldType) {
            case 'string':
                return [
                    { label: '包含', value: 'contains' },
                    { label: '等于', value: 'equals' },
                    { label: '不等于', value: 'not_equals' },
                ]
            case 'number':
                return [
                    { label: '等于', value: 'equals' },
                    { label: '大于', value: 'greater_than' },
                    { label: '小于', value: 'less_than' },
                    { label: '大于等于', value: 'greater_equal' },
                    { label: '小于等于', value: 'less_equal' },
                    { label: '介于', value: 'between' },
                ]
            case 'select':
                return [
                    { label: '等于', value: 'equals' },
                    { label: '不等于', value: 'not_equals' },
                ]
            case 'date':
                return [
                    { label: '等于', value: 'equals' },
                    { label: '介于', value: 'between' },
                    { label: '大于', value: 'greater_than' },
                    { label: '小于', value: 'less_than' },
                ]
            default:
                return [{ label: '等于', value: 'equals' }]
        }
    }

    // 生成唯一ID
    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建逻辑节点
    const createLogicNode = (type: 'AND' | 'OR' | 'NOT'): TreeNode => ({
        id: generateId(),
        title: type,
        key: generateId(),
        type,
        children: [],
    })

    // 创建条件节点
    const createConditionNode = (): TreeNode => ({
        id: generateId(),
        title: '条件',
        key: generateId(),
        type: 'CONDITION',
        condition: {
            field: '',
            operator: 'equals',
            value: null,
            valueType: 'string',
        },
    })

    // 添加根节点
    const addRootNode = (type: 'AND' | 'OR' | 'NOT') => {
        const newNode = createLogicNode(type)
        setConditionTree([...conditionTree, newNode])
        setExpandedKeys([...expandedKeys, newNode.key])
    }

    // 添加子节点
    const addChildNode = (parentKey: string, type: 'AND' | 'OR' | 'NOT' | 'CONDITION') => {
        const newNode = type === 'CONDITION' ? createConditionNode() : createLogicNode(type)

        const updateTree = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.key === parentKey) {
                    return {
                        ...node,
                        children: [...(node.children || []), newNode],
                    }
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateTree(node.children),
                    }
                }
                return node
            })
        }

        setConditionTree(updateTree(conditionTree))
        setExpandedKeys([...expandedKeys, parentKey])
    }

    // 删除节点
    const deleteNode = (nodeKey: string) => {
        const removeNode = (nodes: TreeNode[]): TreeNode[] => {
            return nodes
                .filter(node => node.key !== nodeKey)
                .map(node => ({
                    ...node,
                    children: node.children ? removeNode(node.children) : undefined,
                }))
        }

        setConditionTree(removeNode(conditionTree))
    }

    // 更新条件节点
    const updateConditionNode = (nodeKey: string, updates: Partial<TreeNode>) => {
        const updateTree = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.key === nodeKey) {
                    return { ...node, ...updates }
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateTree(node.children),
                    }
                }
                return node
            })
        }

        setConditionTree(updateTree(conditionTree))
    }

    // 获取字段类型
    const getFieldType = (field: string): AdvancedFilter['valueType'] => {
        const fieldOption = fieldOptions.find(option => option.value === field)
        return (fieldOption?.type as AdvancedFilter['valueType']) || 'string'
    }

    // 渲染条件值输入组件
    const renderConditionValue = (
        condition: NonNullable<TreeNode['condition']>,
        nodeKey: string
    ) => {
        const fieldType = getFieldType(condition.field)

        switch (fieldType) {
            case 'string':
                return (
                    <Input
                        placeholder='请输入值'
                        value={condition.value}
                        onChange={e =>
                            updateConditionNode(nodeKey, {
                                condition: { ...condition, value: e.target.value },
                            })
                        }
                        style={{ width: '100%' }}
                    />
                )
            case 'number':
                if (condition.operator === 'between') {
                    return (
                        <Space>
                            <InputNumber
                                placeholder='最小值'
                                value={condition.value?.min}
                                onChange={value =>
                                    updateConditionNode(nodeKey, {
                                        condition: {
                                            ...condition,
                                            value: { ...condition.value, min: value },
                                        },
                                    })
                                }
                                style={{ width: 80 }}
                            />
                            <span>-</span>
                            <InputNumber
                                placeholder='最大值'
                                value={condition.value?.max}
                                onChange={value =>
                                    updateConditionNode(nodeKey, {
                                        condition: {
                                            ...condition,
                                            value: { ...condition.value, max: value },
                                        },
                                    })
                                }
                                style={{ width: 80 }}
                            />
                        </Space>
                    )
                }
                return (
                    <InputNumber
                        placeholder='请输入数值'
                        value={condition.value}
                        onChange={value =>
                            updateConditionNode(nodeKey, {
                                condition: { ...condition, value },
                            })
                        }
                        style={{ width: '100%' }}
                    />
                )
            case 'select':
                if (condition.field === 'gender') {
                    return (
                        <Select
                            placeholder='请选择性别'
                            value={condition.value}
                            onChange={value =>
                                updateConditionNode(nodeKey, {
                                    condition: { ...condition, value },
                                })
                            }
                            style={{ width: '100%' }}
                        >
                            <Option value='male'>男</Option>
                            <Option value='female'>女</Option>
                            <Option value='unknown'>未知</Option>
                        </Select>
                    )
                }
                return (
                    <Input
                        placeholder='请输入值'
                        value={condition.value}
                        onChange={e =>
                            updateConditionNode(nodeKey, {
                                condition: { ...condition, value: e.target.value },
                            })
                        }
                        style={{ width: '100%' }}
                    />
                )
            case 'date':
                if (condition.operator === 'between') {
                    return (
                        <RangePicker
                            value={condition.value}
                            onChange={dates =>
                                updateConditionNode(nodeKey, {
                                    condition: { ...condition, value: dates },
                                })
                            }
                            style={{ width: '100%' }}
                        />
                    )
                }
                return (
                    <DatePicker
                        value={condition.value}
                        onChange={date =>
                            updateConditionNode(nodeKey, {
                                condition: { ...condition, value: date },
                            })
                        }
                        style={{ width: '100%' }}
                    />
                )
            default:
                return null
        }
    }

    // 构建条件树数据结构
    const buildConditionTree = (nodes: TreeNode[]): ConditionNode[] => {
        return nodes.map(node => {
            if (node.type === 'CONDITION' && node.condition) {
                const fieldType = getFieldType(node.condition.field)
                let filterValue = node.condition.value

                // 处理日期格式
                if (fieldType === 'date' && node.condition.value) {
                    if (
                        node.condition.operator === 'between' &&
                        Array.isArray(node.condition.value)
                    ) {
                        filterValue = node.condition.value.map(date => date?.format('YYYY-MM-DD'))
                    } else if (moment.isMoment(node.condition.value)) {
                        filterValue = node.condition.value.format('YYYY-MM-DD')
                    }
                }

                return {
                    id: node.id,
                    type: 'AND' as const,
                    filter: {
                        field: node.condition.field,
                        operator: node.condition.operator,
                        value: filterValue as unknown,
                        valueType: fieldType,
                    },
                }
            } else {
                return {
                    id: node.id,
                    type: node.type,
                    conditions: node.children ? buildConditionTree(node.children) : [],
                }
            }
        })
    }

    // 执行搜索
    const handleSearch = async () => {
        if (conditionTree.length === 0) {
            message.warning('请至少构建一个条件树')
            return
        }

        const conditionTreeData = buildConditionTree(conditionTree)

        setLoading(true)
        try {
            const searchRequest: SearchRequest = {
                conditionTree: {
                    id: 'root',
                    type: 'AND',
                    conditions: conditionTreeData,
                },
                page: currentPage,
                pageSize,
                sortBy: 'visitDate',
                sortOrder: 'desc',
            }

            const response = await execSearch(searchRequest, SearchType.CONDITION_TREE)
            if (response?.data) {
                const searchResponse: SearchResponse = response.data
                setSearchResults(searchResponse.records)
                setTotalRecords(searchResponse.total)
                setSearchTime(searchResponse.searchTime)
                message.success(`搜索完成，找到 ${searchResponse.total} 条记录`)
            }
        } catch (err) {
            logger.error('条件树搜索失败:', err instanceof Error ? err : undefined)
            message.error('搜索失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    // 在模拟环境下初始化加载默认结果，避免空页面
    useEffect(() => {
        if (USE_MOCK) {
            ;(async () => {
                setLoading(true)
                try {
                    const response = await execSearch(
                        {
                            page: 1,
                            pageSize,
                            sortBy: 'visitDate',
                            sortOrder: 'desc',
                            conditionTree: { id: 'root', type: 'AND', conditions: [] },
                        } as SearchRequest,
                        SearchType.CONDITION_TREE
                    )
                    if (response?.data) {
                        const searchResponse: SearchResponse = response.data
                        setSearchResults(searchResponse.records)
                        setTotalRecords(searchResponse.total)
                        setSearchTime(searchResponse.searchTime)
                    }
                } catch (_) {
                    // 非关键错误，忽略
                } finally {
                    setLoading(false)
                }
            })()
        }
    }, [])

    // 重置搜索
    const handleReset = () => {
        setConditionTree([])
        setSearchResults([])
        setTotalRecords(0)
        setCurrentPage(1)
        setSearchTime(0)
        setExpandedKeys([])
        setSelectedNode(null)
    }

    // 处理分页变化
    const handlePageChange = (page: number, newPageSize?: number) => {
        setCurrentPage(page)
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize)
        }
        handleSearch()
    }

    // 查看详情
    const handleViewDetails = (record: PatientRecord) => {
        navigate(`/data-retrieval/visualization/${record.id}`)
    }

    // 渲染树节点标题
    const renderNodeTitle = (node: TreeNode) => {
        if (node.type === 'CONDITION') {
            const condition = node.condition
            if (!condition || !condition.field) {
                return (
                    <span style={{ color: '#999' }}>
                        <FormOutlined /> 未配置条件
                    </span>
                )
            }

            const fieldOption = fieldOptions.find(f => f.value === condition.field)
            const operatorOption = getOperatorOptions(fieldOption?.type || 'string').find(
                o => o.value === condition.operator
            )

            return (
                <div className='condition-node-title'>
                    <span className='condition-summary'>
                        {fieldOption?.label} {operatorOption?.label} {condition.value}
                    </span>
                    <div className='condition-actions'>
                        <Select
                            size='small'
                            placeholder='字段'
                            value={condition.field}
                            onChange={value => {
                                const fieldType = getFieldType(value)
                                updateConditionNode(node.key, {
                                    condition: {
                                        ...condition,
                                        field: value,
                                        operator: 'equals',
                                        value: null,
                                        valueType: fieldType,
                                    },
                                })
                            }}
                            style={{ width: 100, marginRight: 8 }}
                        >
                            {fieldOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>

                        {condition.field && (
                            <>
                                <Select
                                    size='small'
                                    placeholder='操作符'
                                    value={condition.operator}
                                    onChange={value =>
                                        updateConditionNode(node.key, {
                                            condition: {
                                                ...condition,
                                                operator: value,
                                                value: null,
                                            },
                                        })
                                    }
                                    style={{ width: 80, marginRight: 8 }}
                                >
                                    {getOperatorOptions(getFieldType(condition.field)).map(
                                        option => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        )
                                    )}
                                </Select>

                                <div style={{ width: 120, display: 'inline-block' }}>
                                    {renderConditionValue(condition, node.key)}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <span className='logic-node-title'>
                <Tag color={node.type === 'AND' ? 'blue' : node.type === 'OR' ? 'green' : 'red'}>
                    {node.type}
                </Tag>
            </span>
        )
    }

    // 渲染树节点
    const renderTreeNodes = (nodes: TreeNode[]): React.ReactNode[] => {
        return nodes.map(node => {
            const title = (
                <div className='tree-node-content'>
                    {renderNodeTitle(node)}
                    <div className='node-actions'>
                        <Tooltip title='添加逻辑节点'>
                            <Button
                                size='small'
                                type='text'
                                icon={<PlusOutlined />}
                                onClick={() => addChildNode(node.key, 'AND')}
                            />
                        </Tooltip>
                        <Tooltip title='添加条件节点'>
                            <Button
                                size='small'
                                type='text'
                                icon={<FormOutlined />}
                                onClick={() => addChildNode(node.key, 'CONDITION')}
                            />
                        </Tooltip>
                        <Popconfirm
                            title='确定要删除这个节点吗？'
                            onConfirm={() => deleteNode(node.key)}
                            okText='确定'
                            cancelText='取消'
                        >
                            <Button size='small' type='text' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </div>
                </div>
            )

            return (
                <Tree.TreeNode
                    key={node.key}
                    title={title}
                    icon={node.type === 'CONDITION' ? <FormOutlined /> : null}
                >
                    {node.children && renderTreeNodes(node.children)}
                </Tree.TreeNode>
            )
        })
    }

    // 表格列定义
    const columns = [
        {
            title: '患者信息',
            dataIndex: 'patientName',
            key: 'patientName',
            width: 150,
            render: (text: string, record: PatientRecord) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.patientId}</div>
                </div>
            ),
        },
        {
            title: '基本信息',
            dataIndex: 'gender',
            key: 'basicInfo',
            width: 100,
            render: (gender: string, record: PatientRecord) => (
                <div>
                    <Tag
                        color={
                            gender === 'male' ? 'blue' : gender === 'female' ? 'pink' : 'default'
                        }
                    >
                        {gender === 'male' ? '男' : gender === 'female' ? '女' : '未知'}
                    </Tag>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.age}岁</div>
                </div>
            ),
        },
        {
            title: '就诊信息',
            dataIndex: 'department',
            key: 'visitInfo',
            width: 150,
            render: (department: string, record: PatientRecord) => (
                <div>
                    <div>{department}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.visitDate}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>医生: {record.doctor}</div>
                </div>
            ),
        },
        {
            title: '诊断',
            dataIndex: 'diagnosis',
            key: 'diagnosis',
            width: 200,
            render: (diagnosis: string[]) => (
                <div>
                    {diagnosis.slice(0, 2).map((d, index) => (
                        <Tag key={index} color='red' style={{ marginBottom: '4px' }}>
                            {d}
                        </Tag>
                    ))}
                    {diagnosis.length > 2 && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                            +{diagnosis.length - 2} 更多
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: '数据质量',
            dataIndex: 'dataQuality',
            key: 'dataQuality',
            width: 120,
            render: (dataQuality: DataQuality) => (
                <div>
                    <div style={{ marginBottom: '4px' }}>
                        总体:{' '}
                        <Tag
                            color={
                                dataQuality.overall >= 80
                                    ? 'green'
                                    : dataQuality.overall >= 60
                                      ? 'orange'
                                      : 'red'
                            }
                        >
                            {dataQuality.overall.toFixed(1)}
                        </Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        完整度: {dataQuality.completeness.toFixed(1)}
                    </div>
                </div>
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 120,
            fixed: 'right' as const,
            render: (record: PatientRecord) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                    >
                        详情
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <div className='condition-tree-search-container'>
            <Row gutter={16}>
                <Col span={10}>
                    <Card
                        title='条件树构建'
                        className='condition-tree-card'
                        extra={
                            <Space>
                                <Button size='small' onClick={() => addRootNode('AND')}>
                                    添加 AND
                                </Button>
                                <Button size='small' onClick={() => addRootNode('OR')}>
                                    添加 OR
                                </Button>
                                <Button size='small' onClick={() => addRootNode('NOT')}>
                                    添加 NOT
                                </Button>
                            </Space>
                        }
                    >
                        <div className='condition-tree'>
                            {conditionTree.length === 0 ? (
                                <Empty
                                    description='请添加根节点开始构建条件树'
                                    style={{ margin: '40px 0' }}
                                />
                            ) : (
                                <Tree
                                    expandedKeys={expandedKeys}
                                    onExpand={keys => setExpandedKeys(keys as string[])}
                                    selectedKeys={selectedNode ? [selectedNode] : []}
                                    onSelect={keys =>
                                        setSelectedNode(keys.length > 0 ? keys[0].toString() : null)
                                    }
                                    showIcon
                                    defaultExpandAll
                                >
                                    {renderTreeNodes(conditionTree)}
                                </Tree>
                            )}
                        </div>

                        <div className='tree-actions'>
                            <Button
                                type='primary'
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={loading}
                                disabled={conditionTree.length === 0}
                                block
                            >
                                执行搜索
                            </Button>
                            <Button
                                type='default'
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                block
                                style={{ marginTop: 8 }}
                            >
                                重置
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col span={14}>
                    <Card
                        title='搜索结果'
                        className='search-results-card'
                        extra={
                            totalRecords > 0 && (
                                <Space>
                                    <span style={{ color: '#666' }}>
                                        找到 {totalRecords} 条记录，耗时 {searchTime.toFixed(3)} 秒
                                    </span>
                                </Space>
                            )
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={searchResults}
                            rowKey='id'
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize,
                                total: totalRecords,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                                onChange: handlePageChange,
                            }}
                            scroll={{ x: 1200 }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description={
                                            conditionTree.length === 0
                                                ? '请构建条件树'
                                                : '未找到匹配的记录'
                                        }
                                    />
                                ),
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default ConditionTreeSearch
