/**
 * 高级检索页面
 * 提供多条件组合的高级检索功能
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
    Card,
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Table,
    Space,
    Tag,
    message,
    Row,
    Col,
    InputNumber,
    Empty,
} from 'antd'
import {
    SearchOutlined,
    PlusOutlined,
    DeleteOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useApi } from '@/hooks/useApi'
import { uiMessage } from '@/utils/uiMessage'
import {
    SearchRequest,
    SearchResponse,
    PatientRecord,
    AdvancedFilter,
    SearchType,
    DataQuality,
} from './types'
import { dataRetrievalService } from './services/dataRetrievalService'
import { useNavigate } from 'react-router-dom'
import moment, { Moment } from 'moment'
import { getEnv } from '@/utils/env'
import { logger } from '@/utils/logger'
import './AdvancedSearch.scss'

const { RangePicker } = DatePicker
const { Option } = Select

type FilterValue =
    | string
    | number
    | null
    | Moment
    | { min?: number; max?: number }
    | [Moment, Moment]

interface FilterCondition {
    id: string
    field: string
    operator: AdvancedFilter['operator']
    value: FilterValue
    valueType: AdvancedFilter['valueType']
}

const AdvancedSearch: React.FC = () => {
    const [form] = Form.useForm()
    const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
    const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [totalRecords, setTotalRecords] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [searchTime, setSearchTime] = useState<number>(0)
    const [hotKeywords, setHotKeywords] = useState<
        Array<{ keyword: string; count: number; trend: 'up' | 'down' | 'stable' }>
    >([])
    const USE_MOCK = getEnv('VITE_APP_USE_MOCK_DATA_RETRIEVAL') === 'true'

    const navigate = useNavigate()
    const boundSearch = useCallback(
        (req: SearchRequest, type: SearchType) => dataRetrievalService.search(req, type),
        []
    )
    const boundGetHot = useCallback(
        (limit: number) => dataRetrievalService.getHotKeywords(limit),
        []
    )
    const { execute: execSearch } = useApi<{ data: SearchResponse }, [SearchRequest, SearchType]>(
        boundSearch,
        { immediate: false }
    )
    const { execute: fetchHot } = useApi<
        Array<{ keyword: string; count: number; trend: 'up' | 'down' | 'stable' }>,
        [number]
    >(boundGetHot, { immediate: false })

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

    // 添加过滤条件
    const addFilterCondition = () => {
        const newCondition: FilterCondition = {
            id: Date.now().toString(),
            field: '',
            operator: 'equals',
            value: null,
            valueType: 'string',
        }
        setFilterConditions([...filterConditions, newCondition])
    }

    // 删除过滤条件
    const removeFilterCondition = (id: string) => {
        setFilterConditions(filterConditions.filter(condition => condition.id !== id))
    }

    // 更新过滤条件
    const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
        setFilterConditions(
            filterConditions.map(condition =>
                condition.id === id ? { ...condition, ...updates } : condition
            )
        )
    }

    // 获取字段类型
    const getFieldType = (field: string): AdvancedFilter['valueType'] => {
        const fieldOption = fieldOptions.find(option => option.value === field)
        return (fieldOption?.type as AdvancedFilter['valueType']) || 'string'
    }

    // 渲染条件值输入组件
    const renderConditionValue = (condition: FilterCondition) => {
        const fieldType = getFieldType(condition.field)

        switch (fieldType) {
            case 'string':
                return (
                    <Input
                        placeholder='请输入值'
                        value={condition.value}
                        onChange={e =>
                            updateFilterCondition(condition.id, { value: e.target.value })
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
                                    updateFilterCondition(condition.id, {
                                        value: { ...condition.value, min: value },
                                    })
                                }
                                style={{ width: 100 }}
                            />
                            <span>-</span>
                            <InputNumber
                                placeholder='最大值'
                                value={condition.value?.max}
                                onChange={value =>
                                    updateFilterCondition(condition.id, {
                                        value: { ...condition.value, max: value },
                                    })
                                }
                                style={{ width: 100 }}
                            />
                        </Space>
                    )
                }
                return (
                    <InputNumber
                        placeholder='请输入数值'
                        value={condition.value}
                        onChange={value => updateFilterCondition(condition.id, { value })}
                        style={{ width: '100%' }}
                    />
                )
            case 'select':
                if (condition.field === 'gender') {
                    return (
                        <Select
                            placeholder='请选择性别'
                            value={condition.value}
                            onChange={value => updateFilterCondition(condition.id, { value })}
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
                            updateFilterCondition(condition.id, { value: e.target.value })
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
                                updateFilterCondition(condition.id, { value: dates })
                            }
                            style={{ width: '100%' }}
                        />
                    )
                }
                return (
                    <DatePicker
                        value={condition.value}
                        onChange={date => updateFilterCondition(condition.id, { value: date })}
                        style={{ width: '100%' }}
                    />
                )
            default:
                return null
        }
    }

    // 执行搜索
    const handleSearch = async () => {
        if (filterConditions.length === 0) {
            if (!USE_MOCK) {
                message.warning('请至少添加一个检索条件')
                return
            }
        }

        // 验证所有条件是否完整
        const invalidConditions = filterConditions.filter(
            condition => !condition.field || condition.value === null || condition.value === ''
        )

        if (invalidConditions.length > 0) {
            uiMessage.handleSystemError('请完善所有检索条件', true)
            return
        }

        // 构建高级过滤器
        const advancedFilters: AdvancedFilter[] = filterConditions.map(condition => {
            const fieldType = getFieldType(condition.field)
            let filterValue = condition.value

            // 处理日期格式
            if (fieldType === 'date' && condition.value) {
                if (condition.operator === 'between' && Array.isArray(condition.value)) {
                    filterValue = condition.value.map(date => date?.format('YYYY-MM-DD'))
                } else if (moment.isMoment(condition.value)) {
                    filterValue = condition.value.format('YYYY-MM-DD')
                }
            }

            return {
                field: condition.field,
                operator: condition.operator,
                value: filterValue as unknown,
                valueType: fieldType,
            }
        })

        setLoading(true)
        try {
            const searchRequest: SearchRequest = {
                advancedFilters,
                page: currentPage,
                pageSize,
                sortBy: 'visitDate',
                sortOrder: 'desc',
            }

            const response = await execSearch(searchRequest, SearchType.ADVANCED)
            if (response?.data) {
                const searchResponse: SearchResponse = response.data
                setSearchResults(searchResponse.records)
                setTotalRecords(searchResponse.total)
                setSearchTime(searchResponse.searchTime)
                message.success(`搜索完成，找到 ${searchResponse.total} 条记录`)
            }
        } catch (err) {
            logger.error('高级搜索失败:', err instanceof Error ? err : undefined)
            uiMessage.handleSystemError('搜索失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    // 在模拟环境下初始化加载默认结果与热门关键词
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
                        } as SearchRequest,
                        SearchType.ADVANCED
                    )
                    if (response?.data) {
                        const searchResponse: SearchResponse = response.data
                        setSearchResults(searchResponse.records)
                        setTotalRecords(searchResponse.total)
                        setSearchTime(searchResponse.searchTime)
                    }
                } catch (e) {
                    logger.warn('加载默认高级检索结果失败', e instanceof Error ? e : undefined)
                } finally {
                    setLoading(false)
                }
            })()
            fetchHot(8)
                .then(list => Array.isArray(list) && setHotKeywords(list))
                .catch(err =>
                    logger.warn('获取热门关键词失败', err instanceof Error ? err : undefined)
                )
        }
    }, [])

    // 从热门关键词快速添加一个“诊断 包含”条件
    const addConditionFromSuggestion = (keyword: string) => {
        const newCondition: FilterCondition = {
            id: Date.now().toString(),
            field: 'diagnosis',
            operator: 'contains',
            value: keyword,
            valueType: 'string',
        }
        setFilterConditions(prev => [newCondition, ...prev])
    }

    // 重置搜索
    const handleReset = () => {
        setFilterConditions([])
        setSearchResults([])
        setTotalRecords(0)
        setCurrentPage(1)
        setSearchTime(0)
        form.resetFields()
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
        <div className='advanced-search-container'>
            <Row gutter={16}>
                <Col span={8}>
                    <Card
                        title='高级检索条件'
                        className='filter-conditions-card'
                        extra={
                            <Space>
                                <Button
                                    type='primary'
                                    size='small'
                                    icon={<PlusOutlined />}
                                    onClick={addFilterCondition}
                                >
                                    添加条件
                                </Button>
                                <Button
                                    type='default'
                                    size='small'
                                    icon={<ReloadOutlined />}
                                    onClick={handleReset}
                                >
                                    重置
                                </Button>
                            </Space>
                        }
                    >
                        {USE_MOCK && hotKeywords.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <span style={{ color: '#666', marginRight: 8 }}>热门关键词：</span>
                                <Space wrap>
                                    {hotKeywords.map(k => (
                                        <Tag
                                            key={`adv-hk-${k.keyword}`}
                                            color='gold'
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => addConditionFromSuggestion(k.keyword)}
                                        >
                                            {k.keyword}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        )}
                        <div className='filter-conditions'>
                            {filterConditions.length === 0 ? (
                                <Empty description='暂无检索条件' style={{ margin: '20px 0' }} />
                            ) : (
                                filterConditions.map((condition, index) => (
                                    <div key={condition.id} className='filter-condition'>
                                        <div className='condition-header'>
                                            <span className='condition-number'>
                                                条件 {index + 1}
                                            </span>
                                            <Button
                                                type='text'
                                                size='small'
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeFilterCondition(condition.id)}
                                            />
                                        </div>

                                        <div className='condition-content'>
                                            <Form.Item label='字段' required>
                                                <Select
                                                    placeholder='选择字段'
                                                    value={condition.field}
                                                    onChange={value => {
                                                        const fieldType = getFieldType(value)
                                                        updateFilterCondition(condition.id, {
                                                            field: value,
                                                            valueType: fieldType,
                                                            operator: 'equals',
                                                            value: null,
                                                        })
                                                    }}
                                                >
                                                    {fieldOptions.map(option => (
                                                        <Option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>

                                            {condition.field && (
                                                <>
                                                    <Form.Item label='操作符' required>
                                                        <Select
                                                            placeholder='选择操作符'
                                                            value={condition.operator}
                                                            onChange={value =>
                                                                updateFilterCondition(
                                                                    condition.id,
                                                                    { operator: value }
                                                                )
                                                            }
                                                        >
                                                            {getOperatorOptions(
                                                                condition.valueType
                                                            ).map(option => (
                                                                <Option
                                                                    key={option.value}
                                                                    value={option.value}
                                                                >
                                                                    {option.label}
                                                                </Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>

                                                    <Form.Item label='值' required>
                                                        {renderConditionValue(condition)}
                                                    </Form.Item>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className='search-actions'>
                            <Button
                                type='primary'
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={loading}
                                disabled={filterConditions.length === 0}
                                block
                            >
                                执行搜索
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col span={16}>
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
                                            filterConditions.length === 0
                                                ? '请设置检索条件'
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

export default AdvancedSearch
