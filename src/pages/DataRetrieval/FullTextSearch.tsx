/**
 * 全文检索页面
 * 提供基于关键词的模糊查询检索功能
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, Input, Button, Table, Space, Tag, message, Row, Col, Statistic, Empty } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import { useApi } from '../../hooks/useApi'
import { SearchRequest, SearchResponse, PatientRecord, SearchType } from './types'
import { dataRetrievalService } from './services/dataRetrievalService'
import { useNavigate } from 'react-router-dom'
import { getEnv } from '@/utils/env'
import { logger } from '@/utils/logger'
import './FullTextSearch.scss'

const { Search } = Input

const FullTextSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [totalRecords, setTotalRecords] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [searchTime, setSearchTime] = useState<number>(0)
    const [hotKeywords, setHotKeywords] = useState<
        Array<{ keyword: string; count: number; trend: 'up' | 'down' | 'stable' }>
    >([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    // 是否启用数据检索的模拟数据（用于本地无后端时保障交互）
    const USE_MOCK = getEnv('VITE_APP_USE_MOCK_DATA_RETRIEVAL') === 'true'

    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const navigate = useNavigate()
    // 统一的搜索 API（生产/模拟均可用）
    const boundSearch = useCallback(
        (req: SearchRequest, type: SearchType) => dataRetrievalService.search(req, type),
        []
    )
    const boundGetHot = useCallback(
        (limit: number) => dataRetrievalService.getHotKeywords(limit),
        []
    )
    const boundGetSuggest = useCallback(
        (q: string) => dataRetrievalService.getSearchSuggestions(q),
        []
    )
    const { execute: execSearch } = useApi<{ data: SearchResponse }, [SearchRequest, SearchType]>(
        boundSearch,
        { immediate: false }
    )
    // 热门关键词与建议（用于更好的默认体验）
    const { execute: fetchHot } = useApi<
        Array<{ keyword: string; count: number; trend: 'up' | 'down' | 'stable' }>,
        [number]
    >(boundGetHot, { immediate: false })
    const { execute: fetchSuggest } = useApi<string[], [string]>(boundGetSuggest, {
        immediate: false,
    })

    // 搜索函数
    // 执行搜索（在模拟环境下允许空查询以加载默认数据）
    const performSearch = useCallback(
        async (query: string, page: number = 1) => {
            if (!query.trim() && !USE_MOCK) {
                setSearchResults([])
                setTotalRecords(0)
                setSearchTime(0)
                return
            }

            setLoading(true)
            try {
                const searchRequest: SearchRequest = {
                    query: query.trim(),
                    page,
                    pageSize,
                    sortBy: 'relevance',
                    sortOrder: 'desc',
                }

                // 统一入口：按 FULL_TEXT 类型检索
                const response = await execSearch(searchRequest, SearchType.FULL_TEXT)

                if (response?.data) {
                    const searchResponse: SearchResponse = response.data
                    setSearchResults(searchResponse.records)
                    setTotalRecords(searchResponse.total)
                    setSearchTime(searchResponse.searchTime)
                }
            } catch (err) {
                logger.error('全文搜索失败', err instanceof Error ? err : undefined)
                message.error('搜索失败，请稍后重试')
            } finally {
                setLoading(false)
            }
        },
        [execSearch, pageSize, USE_MOCK]
    )

    // 监听搜索关键词变化
    useEffect(() => {
        if (debouncedSearchQuery) {
            performSearch(debouncedSearchQuery, 1)
            setCurrentPage(1)
            // 联想建议（防抖后查询）
            fetchSuggest(debouncedSearchQuery)
                .then(list => Array.isArray(list) && setSuggestions(list))
                .catch(err =>
                    logger.warn('获取搜索建议失败', err instanceof Error ? err : undefined)
                )
        } else {
            setSearchResults([])
            setTotalRecords(0)
            setSearchTime(0)
            setSuggestions([])
        }
    }, [debouncedSearchQuery, performSearch, fetchSuggest])

    // 初始化：在模拟模式下加载默认结果与热门关键词
    useEffect(() => {
        if (USE_MOCK) {
            performSearch('', 1)
            fetchHot(8)
                .then(list => Array.isArray(list) && setHotKeywords(list))
                .catch(err =>
                    logger.warn('获取热门关键词失败', err instanceof Error ? err : undefined)
                )
        }
    }, [])

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchQuery(value)
    }

    // 选择建议/关键词触发搜索
    const handlePickSuggestion = (keyword: string) => {
        setSearchQuery(keyword)
        performSearch(keyword, 1)
        setCurrentPage(1)
    }

    // 处理分页变化
    const handlePageChange = (page: number, newPageSize?: number) => {
        setCurrentPage(page)
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize)
        }
        performSearch(searchQuery, page)
    }

    // 查看详情
    const handleViewDetails = (record: PatientRecord) => {
        navigate(`/data-retrieval/visualization/${record.id}`)
    }

    // 查看统计分析
    const handleViewAnalysis = () => {
        navigate('/data-retrieval/analysis', {
            state: { searchQuery, searchResults },
        })
    }

    // 重置搜索
    const handleReset = () => {
        setSearchQuery('')
        setSearchResults([])
        setTotalRecords(0)
        setCurrentPage(1)
        setSearchTime(0)
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
            render: (dataQuality: { overall: number; completeness: number }) => (
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
        <div className='full-text-search-container'>
            <Card className='search-header-card'>
                <Row gutter={[16, 16]} align='middle'>
                    <Col span={16}>
                        <Search
                            placeholder='请输入搜索关键词（患者姓名、诊断、用药等）'
                            allowClear
                            enterButton={<SearchOutlined />}
                            size='large'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onSearch={handleSearch}
                            loading={loading}
                        />
                    </Col>
                    <Col span={8}>
                        <Space>
                            <Button
                                type='default'
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                disabled={!searchQuery && searchResults.length === 0}
                            >
                                重置
                            </Button>
                            <Button
                                type='primary'
                                icon={<BarChartOutlined />}
                                onClick={handleViewAnalysis}
                                disabled={searchResults.length === 0}
                            >
                                统计分析
                            </Button>
                        </Space>
                    </Col>
                </Row>
                {/* 建议与热门关键词，仅在模拟模式下或输入后显示，点击即可快速触发 */}
                {(USE_MOCK || suggestions.length > 0) && (
                    <div style={{ marginTop: 12 }}>
                        {suggestions.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                                <span style={{ color: '#666', marginRight: 8 }}>联想：</span>
                                <Space wrap>
                                    {suggestions.slice(0, 10).map(s => (
                                        <Tag
                                            key={`s-${s}`}
                                            color='geekblue'
                                            onClick={() => handlePickSuggestion(s)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {s}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        )}
                        {USE_MOCK && hotKeywords.length > 0 && (
                            <div>
                                <span style={{ color: '#666', marginRight: 8 }}>热门：</span>
                                <Space wrap>
                                    {hotKeywords.map(k => (
                                        <Tag
                                            key={`hk-${k.keyword}`}
                                            color='gold'
                                            onClick={() => handlePickSuggestion(k.keyword)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {k.keyword}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {searchQuery && (
                <Card className='search-stats-card' size='small'>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title='搜索结果'
                                value={totalRecords}
                                suffix='条记录'
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title='搜索耗时'
                                value={searchTime}
                                precision={3}
                                suffix='秒'
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title='当前页'
                                value={currentPage}
                                suffix={`/ ${Math.ceil(totalRecords / pageSize)}`}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title='关键词'
                                value={searchQuery}
                                valueStyle={{ color: '#722ed1', fontSize: '14px' }}
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            <Card className='search-results-card'>
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
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                        onChange: handlePageChange,
                    }}
                    scroll={{ x: 1200 }}
                    locale={{
                        emptyText:
                            searchQuery || USE_MOCK ? (
                                <Empty description='未找到匹配的记录' />
                            ) : (
                                <Empty description='请输入搜索关键词开始检索' />
                            ),
                    }}
                />
            </Card>
        </div>
    )
}

export default FullTextSearch
