import { WorkflowService } from '@/services/workflowService'
import type { ExecutionLogItem } from '@/types'
import { logger } from '@/utils/logger'
import { getMockExecutionHistoryResponse, mockApiDelay } from '@/utils/mockData'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Space, Typography } from 'antd'
import uiMessage from '@/utils/uiMessage'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExecutionRecordTable } from './ExecutionRecordTable'

const { Title, Paragraph } = Typography

/**
 * 执行历史页面
 * 展示数据治理工作流的执行历史记录
 */
export const ExecutionHistory: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<ExecutionLogItem[]>([])
    const [pageNo, setPageNo] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [usingMockData, setUsingMockData] = useState(false) // 标记是否使用模拟数据

    /**
     * 获取执行历史数据
     */
    const fetchExecutionHistory = useCallback(
        async (page: number = pageNo, size: number = pageSize) => {
            try {
                setLoading(true)

                // 添加模拟延迟，模拟真实API调用
                await mockApiDelay(800)

                try {
                    // 尝试调用真实接口
                    const response = await WorkflowService.getExecutionLogPage({
                        pageNo: page,
                        pageSize: size,
                    })

                    if (response.code === 200) {
                        const { list, total } = response.data
                        setRecords(list)
                        setTotal(total)
                        setUsingMockData(false)
                        logger.info('成功获取执行历史数据', list.length)
                    } else {
                        throw new Error(response.msg || '接口返回错误')
                    }
                } catch (apiError) {
                    // 接口调用失败时使用模拟数据
                    logger.warn('接口调用失败，使用模拟数据', apiError)
                    const mockResponse = getMockExecutionHistoryResponse(50, page, size)
                    const { list, total } = mockResponse.data
                    setRecords(list)
                    setTotal(total)
                    setUsingMockData(true)

                    uiMessage.warning('接口暂时无法连接，当前显示模拟数据')
                }
            } catch (error) {
                logger.error('获取执行历史失败', error as Error)
                uiMessage.error('获取执行历史失败，请稍后重试')

                // 即使出现错误也提供模拟数据
                const mockResponse = getMockExecutionHistoryResponse(20, page, size)
                const { list, total } = mockResponse.data
                setRecords(list)
                setTotal(total)
                setUsingMockData(true)
            } finally {
                setLoading(false)
            }
        },
        [pageNo, pageSize]
    )

    /**
     * 处理分页变化
     */
    const handlePageChange = useCallback(
        (page: number, size?: number) => {
            const nextSize = size ?? pageSize
            setPageNo(page)
            setPageSize(nextSize)
            // 立即按新分页参数拉取数据，避免异步状态更新导致的旧参数请求
            fetchExecutionHistory(page, nextSize)
        },
        [fetchExecutionHistory, pageSize]
    )

    /**
     * 页面初始化时获取数据
     */
    useEffect(() => {
        fetchExecutionHistory()
    }, [fetchExecutionHistory])

    /**
     * 刷新执行记录
     */
    const handleRefresh = useCallback(() => {
        fetchExecutionHistory()
    }, [fetchExecutionHistory])

    /**
     * 跳转到工作流配置页面
     */
    const handleGoToWorkflowConfig = useCallback(() => {
        navigate('/data-governance/workflow-config')
    }, [navigate])

    /**
     * 查看执行详情
     */
    const handleViewDetails = useCallback(
        (record: ExecutionLogItem) => {
            navigate(`/data-governance/workflow/${record.batch_id}`)
        },
        [navigate]
    )

    return (
        <div className='execution-history-page'>
            {/* 页面头部 */}
            <div className='page-header' style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Title level={2} style={{ margin: 0 }}>
                        执行历史
                    </Title>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                            刷新记录
                        </Button>
                        <Button
                            type='primary'
                            icon={<SettingOutlined />}
                            onClick={handleGoToWorkflowConfig}
                        >
                            工作流配置
                        </Button>
                    </Space>
                </div>
            </div>

            {/* 状态提示 */}
            <Card
                size='small'
                style={{
                    marginBottom: 16,
                    backgroundColor: usingMockData ? '#fff7e6' : '#f6ffed',
                    border: usingMockData ? '1px solid #ffd591' : '1px solid #b7eb8f',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: usingMockData ? '#fa8c16' : '#52c41a',
                    }}
                >
                    <span style={{ fontSize: 16, marginRight: 8 }}>
                        {usingMockData ? '⚠' : '✓'}
                    </span>
                    <span>
                        {usingMockData
                            ? '当前显示模拟数据，接口暂时无法连接'
                            : '数据治理工作流正在正常运行中'}
                    </span>
                </div>
            </Card>

            {/* 页面说明 */}
            <Card style={{ marginBottom: 24 }}>
                <Paragraph>
                    此页面展示数据治理工作流的执行历史记录，包括每个步骤的执行状态、时间和详细信息。
                    您可以查看具体的执行详情，了解数据处理过程中的问题和结果。
                </Paragraph>
            </Card>

            {/* 执行记录表格 */}
            <ExecutionRecordTable
                data={records}
                loading={loading}
                onViewDetails={handleViewDetails}
                onRefresh={handleRefresh}
                pagination={{
                    current: pageNo,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    onChange: handlePageChange,
                }}
            />
        </div>
    )
}
