import {
    BarChartOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DatabaseOutlined,
    HistoryOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    SyncOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography, Spin } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardService } from '@/services/dashboardService'
import { useAppSelector } from '@/store/hooks'
import { selectWorkflowStats } from '@/store/slices/workflowExecutionSlice'
import { statusConfig } from '@/pages/DataGovernance/const'
import type { ExecutionLogItem, DashboardStatistics } from '@/types'
import { logger } from '@/utils/logger'
import { getMockExecutionHistoryResponse, mockApiDelay } from '@/utils/mockData'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
    const navigate = useNavigate()
    
    // 从Redux获取工作流执行统计（作为后备数据）
    const workflowStats = useAppSelector(selectWorkflowStats)
    
    // 从Redux获取工作流配置
    const workflowConfig = useAppSelector(state => state.dataGovernance.workflowConfig)
    
    // 仪表盘统计数据
    const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)
    
    // 最近执行记录
    const [recentRecords, setRecentRecords] = useState<ExecutionLogItem[]>([])
    const [loadingRecords, setLoadingRecords] = useState(false)

    // 获取仪表盘统计数据
    const fetchDashboardStatistics = useCallback(async () => {
        try {
            setLoadingStats(true)
            const response = await DashboardService.getDashboardStatistics()
            
            if (response.code === 200) {
                setDashboardStats(response.data)
            } else {
                logger.warn('获取仪表盘统计数据失败', response.msg)
            }
        } catch (error) {
            logger.error('获取仪表盘统计数据失败', error as Error)
        } finally {
            setLoadingStats(false)
        }
    }, [])

    // 获取最近执行记录
    const fetchRecentRecords = useCallback(async () => {
        try {
            setLoadingRecords(true)
            await mockApiDelay(500)
            
            try {
                const response = await DashboardService.getExecutionLogPage({
                    pageNo: 1,
                    pageSize: 5,
                })
                
                if (response.code === 200) {
                    setRecentRecords(response.data.list)
                } else {
                    throw new Error(response.msg || '接口返回错误')
                }
            } catch (apiError) {
                logger.warn('接口调用失败，使用模拟数据', apiError)
                const mockResponse = getMockExecutionHistoryResponse(10, 1, 5)
                setRecentRecords(mockResponse.data.list)
            }
        } catch (error) {
            logger.error('获取最近执行记录失败', error as Error)
        } finally {
            setLoadingRecords(false)
        }
    }, [])

    // 初始化加载数据
    useEffect(() => {
        fetchDashboardStatistics()
        fetchRecentRecords()
    }, [fetchDashboardStatistics, fetchRecentRecords])

    // 使用接口数据或Redux数据作为后备
    const displayStats = useMemo(() => {
        if (dashboardStats) {
            return {
                total: dashboardStats.totalWorkflowCount,
                active: dashboardStats.runningCount,
                completed: dashboardStats.completedCount,
                failed: dashboardStats.failedCount,
            }
        }
        return workflowStats
    }, [dashboardStats, workflowStats])

    // 计算工作流成功率（优先使用接口数据）
    const successRate = useMemo(() => {
        if (dashboardStats) {
            return Math.round(dashboardStats.successRate * 100) / 100
        }
        const { total, completed, failed } = workflowStats
        if (total === 0) return 100
        return Math.round((completed / (completed + failed)) * 100) || 0
    }, [dashboardStats, workflowStats])

    // 计算启用的工作流步骤数量（优先使用接口数据）
    const enabledStepsCount = useMemo(() => {
        if (dashboardStats) {
            return dashboardStats.stepEnabledCount
        }
        return workflowConfig.filter(step => step.enabled).length
    }, [dashboardStats, workflowConfig])

    // 步骤总数（优先使用接口数据）
    const totalStepsCount = useMemo(() => {
        if (dashboardStats) {
            return dashboardStats.stepTotalCount
        }
        return workflowConfig.length
    }, [dashboardStats, workflowConfig])

    // 渲染工作流步骤状态
    const renderWorkflowStep = (step: typeof workflowConfig[0]) => {
        return (
            <List.Item>
                <List.Item.Meta
                    title={
                        <Space>
                            <Text strong>{step.nodeName}</Text>
                            <Tag color={step.enabled ? 'success' : 'default'}>
                                {step.enabled ? '已启用' : '已禁用'}
                            </Tag>
                            {step.isAuto && <Tag color='processing'>自动执行</Tag>}
                        </Space>
                    }
                    description={
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            {step.descript}
                        </Text>
                    }
                />
            </List.Item>
        )
    }

    // 渲染执行记录状态
    const renderRecordStatus = (status: number) => {
        const config = statusConfig[status as keyof typeof statusConfig] || {
            text: '未知',
            color: 'default',
        }
        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 格式化时间
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-'
        return dayjs(timeStr).format('MM-DD HH:mm')
    }

    return (
        <div>
            {/* 页面标题 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    数据治理仪表盘
                </Title>
                <Space>
                    <Button
                        type='primary'
                        icon={<PlayCircleOutlined />}
                        onClick={() => navigate('/data-governance/workflow-config')}
                    >
                        启动工作流
                    </Button>
                    <Button
                        icon={<SettingOutlined />}
                        onClick={() => navigate('/data-governance/workflow-config')}
                    >
                        工作流配置
                    </Button>
                    <Button
                        icon={<HistoryOutlined />}
                        onClick={() => navigate('/data-governance/execution-history')}
                    >
                        执行历史
                    </Button>
                </Space>
            </div>

            {/* 信息提示 */}
            <Alert
                message='数据治理概览'
                description='实时监控数据治理工作流的执行状态、处理进度和步骤配置情况，帮助您全面了解数据治理的整体运行状况。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 工作流执行统计 */}
            <Spin spinning={loadingStats}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title='总工作流数'
                                value={displayStats.total}
                                prefix={<DatabaseOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title='运行中'
                                value={displayStats.active}
                                prefix={<SyncOutlined spin={displayStats.active > 0} />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title='已完成'
                                value={displayStats.completed}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title='执行失败'
                                value={displayStats.failed}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>

            {/* 工作流健康度指标 */}
            <Spin spinning={loadingStats}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={12}>
                        <Card title='工作流成功率' extra={`${successRate}%`}>
                            <Progress
                                percent={successRate}
                                strokeColor={{
                                    '0%': '#ff4d4f',
                                    '50%': '#faad14',
                                    '100%': '#52c41a',
                                }}
                            />
                            <div style={{ marginTop: 16 }}>
                                <Space>
                                    <span>成功: {displayStats.completed} 个</span>
                                    <span>失败: {displayStats.failed} 个</span>
                                </Space>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title='工作流步骤配置' extra={`${enabledStepsCount}/${totalStepsCount} 已启用`}>
                            <Progress
                                percent={totalStepsCount > 0 ? Math.round((enabledStepsCount / totalStepsCount) * 100) : 0}
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                            />
                            <div style={{ marginTop: 16 }}>
                                <Space>
                                    <span>已启用: {enabledStepsCount} 个步骤</span>
                                    <span>已禁用: {totalStepsCount - enabledStepsCount} 个步骤</span>
                                </Space>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>

            {/* 工作流步骤列表和最近执行记录 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <Space>
                                <ThunderboltOutlined />
                                <span>工作流步骤配置</span>
                            </Space>
                        }
                        extra={
                            <Button
                                type='link'
                                size='small'
                                onClick={() => navigate('/data-governance/workflow-config')}
                            >
                                查看全部
                            </Button>
                        }
                    >
                        <List
                            dataSource={workflowConfig.slice(0, 5)}
                            renderItem={renderWorkflowStep}
                            size='small'
                            loading={false}
                        />
                        {workflowConfig.length > 5 && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Text type='secondary'>
                                    还有 {workflowConfig.length - 5} 个步骤未显示
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Space>
                                <HistoryOutlined />
                                <span>最近执行记录</span>
                            </Space>
                        }
                        extra={
                            <Button
                                type='link'
                                size='small'
                                onClick={() => {
                                    fetchRecentRecords()
                                }}
                                loading={loadingRecords}
                            >
                                刷新
                            </Button>
                        }
                    >
                        <List
                            dataSource={recentRecords}
                            loading={loadingRecords}
                            size='small'
                            renderItem={record => (
                                <List.Item
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/data-governance/workflow/${record.batch_id}`)}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                <Text strong style={{ fontSize: 13 }}>
                                                    {record.name || `批次 ${record.batch_id}`}
                                                </Text>
                                                {renderRecordStatus(record.status)}
                                            </Space>
                                        }
                                        description={
                                            <Space direction='vertical' size={2}>
                                                <Text type='secondary' style={{ fontSize: 12 }}>
                                                    开始时间: {formatTime(record.start_time)}
                                                </Text>
                                                {record.end_time && (
                                                    <Text type='secondary' style={{ fontSize: 12 }}>
                                                        结束时间: {formatTime(record.end_time)}
                                                    </Text>
                                                )}
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: '暂无执行记录' }}
                        />
                        {recentRecords.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Button
                                    type='link'
                                    size='small'
                                    onClick={() => navigate('/data-governance/execution-history')}
                                >
                                    查看全部记录
                                </Button>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Dashboard
