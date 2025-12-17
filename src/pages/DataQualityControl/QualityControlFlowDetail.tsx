import {
    ArrowLeftOutlined,
    ReloadOutlined,
    EyeOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LinkOutlined,
    HeartOutlined,
} from '@ant-design/icons'
import { Button, Card, Steps, Tag, Typography, Modal, Space, Spin, Progress } from 'antd'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { QCTaskLogDetailData, CompletenessQCRateRecord, AccuracyQCRecord, ConsistencyQCRelationRecord } from '@/types'
import uiMessage from '@/utils/uiMessage'
import { logger } from '@/utils/logger'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages, selectQCExecutionByTaskId } from '@/store/slices/qcExecutionSlice'
import type { QCExecutionMessage } from '@/store/slices/qcExecutionSlice'
import JsonToTable from '@/components/JsonToTable'

const { Title, Text } = Typography
const { Step } = Steps

// 质控类型映射
const QC_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    comprehensive: {
        label: '及时性质控',
        icon: <BarChartOutlined />,
        description: '关注数据时效与更新延迟、准点率与管道稳定性，支持结果解析与指标统计。',
    },
    completeness: {
        label: '完整性质控',
        icon: <PieChartOutlined />,
        description: '针对表与字段的填充率进行检查，识别空值与缺失数据，输出表级与字段级完整性分析。',
    },
    'basic-medical-logic': {
        label: '一致性质控',
        icon: <LinkOutlined />,
        description: '一致性校验，包含主附表关联与基础规则（时间、年龄、性别等）。',
    },
    'core-data': {
        label: '准确性质控',
        icon: <HeartOutlined />,
        description: '开展核心医疗数据的准确性评估，包含编码规范、字段值校验与对比分析。',
    },
}

// 执行状态映射
const statusConfig = {
    0: { text: '待执行', color: 'default' },
    1: { text: '执行中', color: 'processing' },
    2: { text: '已完成', color: 'success' },
    3: { text: '暂停', color: 'warning' },
    4: { text: '跳过', color: 'default' },
    5: { text: '失败', color: 'error' },
}

const QualityControlFlowDetail: React.FC = () => {
    const navigate = useNavigate()
    const { taskId } = useParams<{ taskId: string }>()

    // 状态管理
    const [loading, setLoading] = useState(false)
    const [logDetailData, setLogDetailData] = useState<QCTaskLogDetailData | null>(null)
    const [resultModalVisible, setResultModalVisible] = useState(false)
    const [selectedStepResult, setSelectedStepResult] = useState<{
        title: string
        resultSummary: string
        nodeType?: string
        logId?: number
        batchId?: string
    } | null>(null)
    
    // 完整性质控结果数据
    const [completenessResultData, setCompletenessResultData] = useState<CompletenessQCRateRecord[]>([])
    const [completenessResultLoading, setCompletenessResultLoading] = useState(false)
    const [completenessResultPagination, setCompletenessResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })
    
    // 准确性质控结果数据
    const [accuracyResultData, setAccuracyResultData] = useState<AccuracyQCRecord[]>([])
    const [accuracyResultLoading, setAccuracyResultLoading] = useState(false)
    const [accuracyResultPagination, setAccuracyResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })
    
    // 一致性质控结果数据
    const [consistencyResultData, setConsistencyResultData] = useState<ConsistencyQCRelationRecord[]>([])
    const [consistencyResultLoading, setConsistencyResultLoading] = useState(false)
    const [consistencyResultPagination, setConsistencyResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 用于跟踪是否已经在 SSE 结束时调用过 fetchLogDetail
    const hasFetchedOnEndRef = useRef<boolean>(false)

    // 从 Redux 获取消息列表
    const qcMessages = useAppSelector(
        state => (taskId ? selectQCMessages(taskId)(state) : [])
    )


    console.log({
        qcMessages,
    }, '===>');


    // 获取质控任务日志详情
    const fetchLogDetail = useCallback(async () => {
        if (!taskId) {
            uiMessage.error('任务ID不存在')
            navigate('/data-quality-control/flow-management')
            return
        }

        try {
            setLoading(true)
            const response = await dataQualityControlService.getQCTaskLogDetail(taskId)

            if (response.code === 200 && response.data) {
                setLogDetailData(response.data)
            } else {
                uiMessage.error(response.msg || '获取任务详情失败')
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取任务详情时发生未知错误'
            uiMessage.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [taskId, navigate])

    // 初始化时获取数据
    useEffect(() => {
        fetchLogDetail()
        // 重置标记，允许新的任务重新监听
        hasFetchedOnEndRef.current = false
    }, [taskId, fetchLogDetail])

    // 监听 SSE 消息，当执行结束时重新获取详情
    useEffect(() => {
        if (!taskId || qcMessages.length === 0) return

        // 获取最后一条消息
        const lastMessage = qcMessages[qcMessages.length - 1]
        const executionStatus = lastMessage?.executionStatus

        // 检测是否执行结束
        if (
            (executionStatus === 'end' || executionStatus === 'completed') &&
            !hasFetchedOnEndRef.current
        ) {
            // 标记已调用，避免重复调用
            hasFetchedOnEndRef.current = true

            // 延迟一小段时间后调用，确保后端数据已更新
            setTimeout(() => {
                fetchLogDetail()
            }, 500)
        }
    }, [taskId, qcMessages, fetchLogDetail])

    // 结合 SSE 消息和接口数据，生成实时进度数据
    const displayDetail = useMemo(() => {
        // 深拷贝 logDetailData，避免直接修改原始数据
        const detail = logDetailData
            ? (JSON.parse(JSON.stringify(logDetailData)) as QCTaskLogDetailData)
            : null

        if (!detail || !detail.logList || qcMessages.length === 0) {
            return detail
        }

        // 遍历 SSE 消息，更新步骤信息
        qcMessages.forEach((msgInfo: QCExecutionMessage) => {
            // 从消息中提取节点类型和进度信息
            const nodeType = msgInfo.node?.nodeType
            const progress = msgInfo.progress // 使用 progress 作为进度百分比
            const status = msgInfo.status
            const executionStatus = msgInfo.executionStatus
            const tableName = msgInfo.tableName
            const table = msgInfo.table

            // 根据 nodeType 找到对应的步骤
            if (nodeType && detail.logList) {
                const step = detail.logList.find(log => log.node_type === nodeType)

                if (step) {
                    // 更新进度信息（使用 progress 字段）
                    if (progress !== undefined) {
                        (step as any).progress = Number(progress)
                    }

                    // 更新表信息
                    if (tableName !== undefined) {
                        (step as any).tableName = tableName
                    }
                    if (table !== undefined) {
                        (step as any).table = table
                    }

                    // 更新步骤状态
                    if (status !== undefined) {
                        step.step_status = Number(status)
                    } else if (executionStatus === 'running' || executionStatus === 'start') {
                        step.step_status = 1 // 执行中
                    } else if (executionStatus === 'end' || executionStatus === 'completed') {
                        step.step_status = 2 // 已完成
                    }
                }
            }
        })

        // 获取最后一个消息，确定最新执行的步骤
        const lastMessage = qcMessages[qcMessages.length - 1]
        if (lastMessage && detail.logList) {
            const lastNodeType = lastMessage.node?.nodeType
            
            if (lastNodeType) {
                // 找到最后一个执行的步骤
                const lastExecutingStep = detail.logList.find(log => log.node_type === lastNodeType)
                
                if (lastExecutingStep) {
                    // 更新 logSummary 的 node_type 为最后一个正在执行的步骤
                    if (detail.logSummary) {
                        detail.logSummary.node_type = lastNodeType
                    }

                    // 将最后一个执行步骤之前的所有步骤标记为已完成
                    // 先按 step_no 排序，找到最后一个执行步骤的索引
                    const sortedLogList = [...detail.logList].sort((a, b) => a.step_no - b.step_no)
                    const lastStepIndex = sortedLogList.findIndex(log => log.log_id === lastExecutingStep.log_id)
                    
                    // 将最后一个执行步骤之前的所有步骤标记为已完成
                    if (lastStepIndex > 0) {
                        for (let i = 0; i < lastStepIndex; i++) {
                            const sortedStep = sortedLogList[i]
                            if (sortedStep) {
                                // 在原始 logList 中找到对应的步骤并更新
                                const originalStep = detail.logList.find(log => log.log_id === sortedStep.log_id)
                                if (originalStep) {
                                    // 只更新未执行或执行中的步骤，跳过已经失败或暂停的步骤
                                    if (originalStep.step_status === 0 || originalStep.step_status === 1) {
                                        originalStep.step_status = 2 // 已完成
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 更新整体状态
            const lastExecutionStatus = lastMessage.executionStatus
            if (lastExecutionStatus === 'end' || lastExecutionStatus === 'completed') {
                if (detail.logSummary) {
                    detail.logSummary.status = 2 // 已完成
                }
            } else if (lastExecutionStatus === 'running' || lastExecutionStatus === 'start') {
                if (detail.logSummary) {
                    detail.logSummary.status = 1 // 执行中
                }
            }
        }

        return detail
    }, [taskId, qcMessages, logDetailData])


    // 返回上一页
    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/data-quality-control/flow-management')
        }
    }

    // 刷新
    const handleRefresh = async () => {
        await fetchLogDetail()
        uiMessage.success('刷新成功')
    }

    // 加载完整性质控结果数据
    const loadCompletenessResultData = async (batchId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setCompletenessResultLoading(true)
            const response = await dataQualityControlService.getCompletenessQCRatePage({
                pageNum,
                pageSize,
                batchId: batchId,
            })
            
            if (response.code === 200 && response.data) {
                setCompletenessResultData(response.data.records)
                setCompletenessResultPagination({
                    current: Number(response.data.current),
                    pageSize: Number(response.data.size),
                    total: Number(response.data.total),
                })
                logger.info('完整性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取完整性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载完整性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('加载结果失败，请重试')
        } finally {
            setCompletenessResultLoading(false)
        }
    }

    // 加载准确性质控结果数据
    const loadAccuracyResultData = async (batchId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setAccuracyResultLoading(true)
            const response = await dataQualityControlService.getAccuracyQCPage({
                pageNum,
                pageSize,
                batchId: batchId,
            })
            
            if (response.code === 200 && response.data) {
                setAccuracyResultData(response.data.records)
                setAccuracyResultPagination({
                    current: Number(response.data.current),
                    pageSize: Number(response.data.size),
                    total: Number(response.data.total),
                })
                logger.info('准确性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取准确性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载准确性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('加载结果失败，请重试')
        } finally {
            setAccuracyResultLoading(false)
        }
    }

    // 加载一致性质控结果数据
    const loadConsistencyResultData = async (batchId: string, pageNum: number = 1, pageSize: number = 10) => {
        try {
            setConsistencyResultLoading(true)
            const response = await dataQualityControlService.getConsistencyQCRelationPage({
                pageNum,
                pageSize,
                batchId: batchId,
            })
            
            if (response.code === 200 && response.data) {
                setConsistencyResultData(response.data.records)
                setConsistencyResultPagination({
                    current: Number(response.data.current),
                    pageSize: Number(response.data.size),
                    total: Number(response.data.total),
                })
                logger.info('一致性质控结果加载成功:', response.data)
            } else {
                logger.warn('获取一致性质控结果失败:', response.msg)
                uiMessage.warning(response.msg || '获取结果失败')
            }
        } catch (error) {
            logger.error('加载一致性质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('加载结果失败，请重试')
        } finally {
            setConsistencyResultLoading(false)
        }
    }

    // 查看执行结果
    const handleViewResult = async (stepIndex: number) => {
        if (!logDetailData?.logList) return

        const sortedLogList = [...logDetailData.logList].sort((a, b) => a.step_no - b.step_no)
        const step = sortedLogList[stepIndex]
        if (!step) return

        const stepResult = {
            title: step.step_name,
            resultSummary: '暂无执行结果',
            nodeType: step.node_type,
            logId: typeof step.log_id === 'number' ? step.log_id : Number(step.log_id),
            batchId: logDetailData.logSummary?.batch_id ? String(logDetailData.logSummary.batch_id) : undefined,
        }

        setSelectedStepResult(stepResult)
        setResultModalVisible(true)

        // 根据步骤类型加载结果数据
        if (step.node_type === 'CompletenessQC' && stepResult.batchId) {
            await loadCompletenessResultData(stepResult.batchId, 1, 10)
            // 清空其他质控数据
            setAccuracyResultData([])
            setAccuracyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setConsistencyResultData([])
            setConsistencyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
        } else if (step.node_type === 'AccuracyQC' && stepResult.batchId) {
            await loadAccuracyResultData(stepResult.batchId, 1, 10)
            // 清空其他质控数据
            setCompletenessResultData([])
            setCompletenessResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setConsistencyResultData([])
            setConsistencyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
        } else if (step.node_type === 'ConsistencyQC' && stepResult.batchId) {
            await loadConsistencyResultData(stepResult.batchId, 1, 10)
            // 清空其他质控数据
            setCompletenessResultData([])
            setCompletenessResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setAccuracyResultData([])
            setAccuracyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
        } else {
            // 清空之前的数据
            setCompletenessResultData([])
            setCompletenessResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setAccuracyResultData([])
            setAccuracyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setConsistencyResultData([])
            setConsistencyResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
        }
    }

    // 关闭结果弹窗
    const handleCloseResultModal = () => {
        setResultModalVisible(false)
        setSelectedStepResult(null)
        // 清空结果数据
        setCompletenessResultData([])
        setCompletenessResultPagination({
            current: 1,
            pageSize: 10,
            total: 0,
        })
        setAccuracyResultData([])
        setAccuracyResultPagination({
            current: 1,
            pageSize: 10,
            total: 0,
        })
        setConsistencyResultData([])
        setConsistencyResultPagination({
            current: 1,
            pageSize: 10,
            total: 0,
        })
    }

    // 获取状态标签
    const getStatusTag = (status: number) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 获取状态文本
    const getStatusText = (status: number): string => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return config.text
    }

    // 获取步骤状态（用于 Steps 组件）
    const getStepStatus = (stepStatus: number): 'wait' | 'process' | 'finish' | 'error' => {
        switch (stepStatus) {
            case 0: // 未执行
                return 'wait'
            case 1: // 执行中
                return 'process'
            case 2: // 已完成
                return 'finish'
            case 3: // 暂停
                return 'wait'
            case 5: // 失败
                return 'error'
            case 4: // 跳过
            default:
                return 'wait'
        }
    }

    // 根据 node_type 获取类型信息
    const getTypeInfo = (nodeType: string) => {
        const nodeTypeToValue: Record<string, string> = {
            TimelinessQC: 'comprehensive',
            CompletenessQC: 'completeness',
            ConsistencyQC: 'basic-medical-logic',
            AccuracyQC: 'core-data',
        }
        const type = nodeTypeToValue[nodeType] || nodeType
        return QC_TYPE_MAP[type] || { label: nodeType, icon: null, description: '' }
    }

    // 获取当前步骤索引（用于 Steps 组件的 current 属性）
    const getCurrentStep = () => {
        if (!displayDetail?.logList || displayDetail.logList.length === 0) return 0
        if (!displayDetail?.logSummary?.node_type) return 0

        const sortedLogList = [...displayDetail.logList].sort((a, b) => a.step_no - b.step_no)
        const currentNodeType = displayDetail.logSummary.node_type

        // 根据 logSummary.node_type 在 logList 中查找匹配的步骤
        const matchedStep = sortedLogList.find(log => log.node_type === currentNodeType)
        
        if (matchedStep) {
            // 返回步骤在排序列表中的索引（从0开始）
            return sortedLogList.findIndex(log => log.step_no === matchedStep.step_no)
        }

        // 如果没有找到匹配的步骤，回退到原来的逻辑
        // 查找第一个执行中的步骤
        const executingIndex = sortedLogList.findIndex(log => log.step_status === 1)
        if (executingIndex >= 0) {
            return executingIndex
        }

        // 如果没有执行中的步骤，查找最后一个已完成的步骤
        let lastCompletedIndex = -1
        for (let i = sortedLogList.length - 1; i >= 0; i--) {
            const log = sortedLogList[i]
            if (log && log.step_status === 2) {
                lastCompletedIndex = i
                break
            }
        }

        // 如果找到了已完成的步骤，返回下一个步骤的索引（如果存在）
        if (lastCompletedIndex >= 0) {
            return lastCompletedIndex < sortedLogList.length - 1
                ? lastCompletedIndex + 1
                : sortedLogList.length
        }

        return 0
    }

    // 渲染进度条
    const renderProgressBar = (step: any) => {
        // 已完成、跳过、失败状态不显示进度条
        if ([2, 4, 5].includes(step.step_status)) {
            return null
        }

        // 暂停状态也不显示进度条
        if (step.step_status === 3) {
            return null
        }

        // 检查是否有进度数据（使用 progress 字段）
        if (step.progress === undefined || step.progress === null) return null

        const percentage = Math.round(Number(step.progress))
        const isRunning = step.step_status === 1

        return (
            <div style={{ marginTop: 8 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: isRunning ? 8 : 0,
                    }}
                >
                    <Progress
                        percent={percentage}
                        size='small'
                        status={percentage === 100 ? 'success' : 'active'}
                        showInfo={false}
                        style={{ width: 250 }}
                    />
                    <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {percentage}%
                    </Text>
                </div>
                {/* 在进度条下方显示表信息 */}
                {isRunning && (step.table || step.tableName) && (
                    <div>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            正在处理数据表{step.table}({step.tableName})
                        </Text>
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size='large' />
                <div style={{ marginTop: 16 }}>
                    <Text>加载执行详情中...</Text>
                </div>
            </div>
        )
    }

    // 使用 displayDetail（结合了 SSE 消息和接口数据）
    const logSummary = displayDetail?.logSummary || logDetailData?.logSummary
    const logList = displayDetail?.logList || logDetailData?.logList || []
    const sortedLogList = [...logList].sort((a, b) => a.step_no - b.step_no)
    const currentStepIndex = getCurrentStep()

    return (
        <div>
            {/* 头部 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={goBack}
                        style={{ marginRight: 16 }}
                    >
                        返回
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        质控流程执行详情
                    </Title>
                </div>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                    刷新
                </Button>
            </div>

            {/* 基本信息 */}
            <Card title='基本信息' style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16,
                        marginBottom: 16,
                    }}
                >
                    <div>
                        <Text strong>任务ID：</Text>
                        <Text copyable>
                            {logSummary?.batch_id ? String(logSummary.batch_id) : '--'}
                        </Text>
                    </div>
                    <div>
                        <Text strong>任务名称：</Text>
                        <Text>{logSummary?.name || '--'}</Text>
                    </div>
                    <div>
                        <Text strong>质控类型：</Text>
                        <Space>
                            {sortedLogList.length > 0
                                ? sortedLogList.map((log) => {
                                      const typeInfo = getTypeInfo(log.node_type)
                                      return (
                                          <Tag key={`${log.log_id}-${log.step_no}`} color='blue'>
                                              {typeInfo.icon}
                                              <span style={{ marginLeft: 4 }}>
                                                  {log.step_name || typeInfo.label || log.node_type}
                                              </span>
                                          </Tag>
                                      )
                                  })
                                : null}
                        </Space>
                    </div>
                    <div>
                        <Text strong>状态：</Text>
                        {getStatusTag(logSummary?.status ?? 0)}
                    </div>
                    
                    {logSummary?.remark && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Text strong>备注：</Text>
                            <Text>{logSummary.remark}</Text>
                        </div>
                    )}
                </div>
            </Card>

            {/* 执行步骤 */}
            <Card title='执行步骤' style={{ marginBottom: 24 }}>
                <Steps
                    current={currentStepIndex}
                    direction='vertical'
                    size='small'
                    style={{ marginBottom: 24 }}
                >
                    {sortedLogList.map((log, index) => {
                        const typeInfo = getTypeInfo(log.node_type)
                        const statusText = getStatusText(log.step_status)
                        
                        // 根据 current 和 step_status 综合判断每个 Step 的 status
                        // 如果索引小于 current，应该是 finish；如果等于 current，根据 step_status 判断；如果大于 current，应该是 wait
                        let stepStatusType: 'wait' | 'process' | 'finish' | 'error'
                        if (index < currentStepIndex) {
                            // 已完成的步骤
                            stepStatusType = 'finish'
                        } else if (index === currentStepIndex) {
                            // 当前步骤，根据 step_status 判断
                            stepStatusType = getStepStatus(log.step_status)
                            // 如果当前步骤已完成，也显示为 finish
                            if (log.step_status === 2) {
                                stepStatusType = 'finish'
                            }
                        } else {
                            // 未执行的步骤
                            stepStatusType = 'wait'
                        }

                        return (
                            <Step
                                key={`${log.log_id}-${log.step_no}`}
                                status={stepStatusType}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{log.step_name || typeInfo.label || log.node_type}</span>
                                        {getStatusTag(log.step_status)}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <Text type='secondary'>{typeInfo.description}</Text>
                                        </div>

                                        {/* 状态信息 */}
                                        <div
                                            style={{
                                                marginBottom: 8,
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '16px',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div>
                                                <Text strong>状态：</Text>
                                                <Text style={{ marginLeft: 4 }}>{statusText}</Text>
                                            </div>
                                           
                                            
                                        </div>

                                        {/* 进度条展示 */}
                                        {renderProgressBar(log)}

                                        {/* 查看执行结果按钮 - 仅在已完成的步骤显示 */}
                                        {log.step_status === 2 && (
                                            <Button
                                                type='link'
                                                size='small'
                                                icon={<EyeOutlined />}
                                                onClick={() => handleViewResult(index)}
                                                style={{ padding: 0, height: 'auto', marginTop: 8 }}
                                            >
                                                查看执行结果
                                            </Button>
                                        )}
                                    </div>
                                }
                            />
                        )
                    })}
                </Steps>
            </Card>

            {/* 执行结果查看弹窗 */}
            <Modal
                title={`执行结果 - ${selectedStepResult?.title || ''}`}
                open={resultModalVisible}
                onCancel={handleCloseResultModal}
                footer={[
                    <Button key='close' onClick={handleCloseResultModal}>
                        关闭
                    </Button>,
                ]}
                width={selectedStepResult?.nodeType === 'CompletenessQC' || selectedStepResult?.nodeType === 'AccuracyQC' || selectedStepResult?.nodeType === 'ConsistencyQC' ? 1200 : 700}
            >
                {selectedStepResult && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>步骤名称：</Text>
                            <Text>{selectedStepResult.title}</Text>
                        </div>
                        
                        {/* 完整性质控结果展示 */}
                        {selectedStepResult.nodeType === 'CompletenessQC' ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    完整性质控结果：
                                </Text>
                                <Spin spinning={completenessResultLoading}>
                                    {completenessResultData.length > 0 ? (
                                        <JsonToTable
                                            data={completenessResultData as unknown as Array<Record<string, unknown>>}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                tableName: '表名',
                                                fieldName: '字段名',
                                                tableComment: '表注释',
                                                fieldComment: '字段注释',
                                                tableTotalRecords: '表总记录数',
                                                fieldFillRecords: '字段填充记录数',
                                                fieldFillRate: '字段填充率',
                                            }}
                                            tableProps={{
                                                pagination: {
                                                    current: completenessResultPagination.current,
                                                    pageSize: completenessResultPagination.pageSize,
                                                    total: completenessResultPagination.total,
                                                    showSizeChanger: true,
                                                    showTotal: (total) => `共 ${total} 条`,
                                                    onChange: (page, pageSize) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadCompletenessResultData(selectedStepResult.batchId, page, pageSize)
                                                        }
                                                    },
                                                    onShowSizeChange: (current, size) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadCompletenessResultData(selectedStepResult.batchId, current, size)
                                                        }
                                                    },
                                                },
                                                scroll: { x: 'max-content' },
                                            }}
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                            {completenessResultLoading ? '加载中...' : '暂无执行结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.nodeType === 'AccuracyQC' ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    准确性质控结果：
                                </Text>
                                <Spin spinning={accuracyResultLoading}>
                                    {accuracyResultData.length > 0 ? (
                                        <JsonToTable
                                            data={accuracyResultData as unknown as Array<Record<string, unknown>>}
                                            columnMapping={{
                                                id: 'ID',
                                                ruleCode: '规则编码',
                                                mainTable: '主表',
                                                subTable: '次表',
                                                mainTableName: '主表名称',
                                                subTableName: '次表名称',
                                                mainCount: '主表数量',
                                                subCount: '次表数量',
                                                issueDesc: '问题描述',
                                                batchId: '批次ID',
                                            }}
                                            tableProps={{
                                                pagination: {
                                                    current: accuracyResultPagination.current,
                                                    pageSize: accuracyResultPagination.pageSize,
                                                    total: accuracyResultPagination.total,
                                                    showSizeChanger: true,
                                                    showTotal: (total) => `共 ${total} 条`,
                                                    onChange: (page, pageSize) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadAccuracyResultData(selectedStepResult.batchId, page, pageSize)
                                                        }
                                                    },
                                                    onShowSizeChange: (current, size) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadAccuracyResultData(selectedStepResult.batchId, current, size)
                                                        }
                                                    },
                                                },
                                                scroll: { x: 'max-content' },
                                            }}
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                            {accuracyResultLoading ? '加载中...' : '暂无执行结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.nodeType === 'ConsistencyQC' ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    一致性质控结果：
                                </Text>
                                <Spin spinning={consistencyResultLoading}>
                                    {consistencyResultData.length > 0 ? (
                                        <JsonToTable
                                            data={consistencyResultData as unknown as Array<Record<string, unknown>>}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                mainTableName: '主表名称',
                                                subTableName: '次表名称',
                                                relationField: '关联字段',
                                                mainCount: '主表数量',
                                                subCount: '次表数量',
                                                matchedCount: '匹配数量',
                                                unmatchedCount: '未匹配数量',
                                                matchRate: '匹配率',
                                                status: '状态',
                                                mainTableComment: '主表注释',
                                                subTableComment: '次表注释',
                                            }}
                                            tableProps={{
                                                pagination: {
                                                    current: consistencyResultPagination.current,
                                                    pageSize: consistencyResultPagination.pageSize,
                                                    total: consistencyResultPagination.total,
                                                    showSizeChanger: true,
                                                    showTotal: (total) => `共 ${total} 条`,
                                                    onChange: (page, pageSize) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadConsistencyResultData(
                                                                selectedStepResult.batchId,
                                                                page,
                                                                pageSize
                                                            )
                                                        }
                                                    },
                                                    onShowSizeChange: (current, size) => {
                                                        if (selectedStepResult.batchId) {
                                                            loadConsistencyResultData(
                                                                selectedStepResult.batchId,
                                                                current,
                                                                size
                                                            )
                                                        }
                                                    },
                                                },
                                                scroll: { x: 'max-content' },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
                                        >
                                            {consistencyResultLoading ? '加载中...' : '暂无执行结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    执行结果：
                                </Text>
                                <div
                                    style={{
                                        marginTop: 8,
                                        padding: 16,
                                        background: '#f5f5f5',
                                        borderRadius: 4,
                                        border: '1px solid #d9d9d9',
                                        whiteSpace: 'pre-line',
                                        fontFamily: 'monospace',
                                        fontSize: 13,
                                        lineHeight: 1.8,
                                    }}
                                >
                                    <Text>{selectedStepResult.resultSummary || '暂无执行结果'}</Text>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default QualityControlFlowDetail
