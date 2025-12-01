import {
    ArrowLeftOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    CloudSyncOutlined,
} from '@ant-design/icons'
import { Button, Card, Progress, Spin, Steps, Tag, Typography, Modal, Space } from 'antd'
import uiMessage from '@/utils/uiMessage'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { logger } from '@/utils/logger'
import {
    selectExecutionByTaskId,
    initializeExecution,
} from '../../store/slices/workflowExecutionSlice'
import { DataGovernanceService } from '../../services/dataGovernanceService'
import {
    WorkflowLogDetailResponse,
    WorkflowLogDetailData,
    WorkflowStepLog,
    WorkflowNodeType,
} from '../../types'
import { statusConfig } from './const'
import { continueWorkflow, subscribeWorkflow } from '@/utils/workflowUtils'
// 移除直接请求，统一通过 service 调用

const { Title, Text } = Typography
const { Step } = Steps

// 定义九个执行步骤
const EXECUTION_STEPS = [
    {
        title: '数据清洗',
        description: '清理无效字符，确保数据质量',
        isAutomatic: true,
        resultSummary: '清理了 1,234 条无效记录，修复了 567 个格式错误',
        nodeType: WorkflowNodeType.DATA_CLEANSING,
    },
    {
        title: '数据去重',
        description: '移除重复数据，防止数据失真',
        isAutomatic: true,
        resultSummary: '检测到 892 条重复记录，已成功去重',
        nodeType: WorkflowNodeType.DATA_DEDUPLICATION,
    },
    {
        title: '类型转换',
        description: '将字符串类型转换为数据模型定义的标准类型',
        isAutomatic: true,
        resultSummary: '转换了 15,678 个字段，成功率 99.8%',
        nodeType: WorkflowNodeType.DATA_TRANSFORM,
    },
    {
        title: '标准字典对照',
        description: '将多源数据字典统一为标准字典',
        isAutomatic: false,
        resultSummary: '匹配了 2,345 个字典项，需人工确认 23 项',
        nodeType: WorkflowNodeType.STANDARD_MAPPING,
    },
    {
        title: 'EMPI发放',
        description: '为同一患者发放唯一主索引',
        isAutomatic: true,
        resultSummary: '为 8,901 名患者分配了唯一标识',
        nodeType: WorkflowNodeType.EMPI_DEFINITION_DISTRIBUTION,
    },
    {
        title: 'EMOI发放',
        description: '为检查检验发放就诊唯一主索引',
        isAutomatic: true,
        resultSummary: '处理了 12,345 次就诊记录',
        nodeType: WorkflowNodeType.EMOI_DEFINITION_DISTRIBUTION,
    },
    {
        title: '数据归一',
        description: '统一数据格式和标准值',
        isAutomatic: true,
        resultSummary: '标准化了 45,678 条记录',
        nodeType: WorkflowNodeType.DATA_STANDARDIZATION,
    },
    {
        title: '孤儿数据处理',
        description: '清理无法关联主表的无效数据',
        isAutomatic: false,
        resultSummary: '发现 156 条孤儿数据，已标记待处理',
        nodeType: WorkflowNodeType.DATA_ORPHAN,
    },
    {
        title: '数据脱敏',
        description: '保护敏感数据安全',
        isAutomatic: true,
        resultSummary: '脱敏处理了 3,456 个敏感字段',
        nodeType: WorkflowNodeType.DATA_DESENSITIZATION,
    },
]

const WorkflowDetail: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    // 状态管理
    const [resultModalVisible, setResultModalVisible] = useState(false)
    const [selectedStepResult, setSelectedStepResult] = useState<{
        title: string
        resultSummary: string
        stepIndex: number
    } | null>(null)

    // 工作流日志详情状态
    const [logDetailData, setLogDetailData] = useState<WorkflowLogDetailData | null>(null)

    // 继续执行状态
    const [continueLoading, setContinueLoading] = useState(false)

    // 数据同步（数据录入）按钮加载状态
    const [dataSyncLoading, setDataSyncLoading] = useState(false)

    // Redux状态 - 按taskId获取特定工作流的执行信息
    const { loading } = useAppSelector(state => state.dataGovernance)
    const workflowExecution = useAppSelector(state =>
        taskId ? selectExecutionByTaskId(taskId)(state) : null
    )

    // 获取工作流日志详情
    const fetchLogDetail = useCallback(async () => {
        if (!taskId) {
            logger.warn('taskId 为空，无法获取日志详情')
            return
        }

        try {
            logger.info('开始获取工作流日志详情', { taskId })
            const response: WorkflowLogDetailResponse =
                await DataGovernanceService.getLogDetail(taskId)

            if (response.code === 200 && response.data) {
                setLogDetailData(response.data)
                logger.info('成功获取工作流日志详情', {
                    taskId,
                    logCount: response.data.logList?.length || 0,
                })
            } else {
                const errorMsg = response.msg || '获取日志详情失败'
                logger.error('获取工作流日志详情失败' + errorMsg)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取日志详情时发生未知错误'
            logger.error('获取工作流日志详情异常' + errorMsg)
        }
    }, [taskId])

    // 手动刷新数据的处理函数
    const handleRefresh = async () => {
        logger.debug('手动刷新详情')
        await fetchLogDetail()
    }

    // 组件初始化时获取日志详情并初始化工作流执行状态
    useEffect(() => {
        if (taskId) {
            // 初始化工作流执行状态（如果还不存在）
            if (!workflowExecution) {
                dispatch(initializeExecution({ taskId }))
            }
            // 只在初始化时获取一次日志详情，后续通过SSE更新
            fetchLogDetail()
        }
    }, [taskId, dispatch, fetchLogDetail]) // workflowExecution 在此处不应作为依赖，避免无限循环

    // 订阅工作流完成/关闭事件：遵循既定流程，避免额外处理
    useEffect(() => {
        if (!taskId) return

        let unsubscribe: (() => void) | null = null
        try {
            unsubscribe = subscribeWorkflow(String(taskId), evt => {
                if (!evt || evt.taskId !== String(taskId)) return
                if (evt.type === 'completed' || evt.type === 'closed') {
                    // 仅在完成或关闭时刷新详情
                    fetchLogDetail()
                }
            })
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : '订阅工作流事件时发生未知错误'
            console.error('订阅工作流事件失败', { taskId, error: errMsg })
        }

        // 清理订阅
        return () => {
            try {
                unsubscribe?.()
            } catch (e) {
                const errMsg = e instanceof Error ? e.message : '取消订阅时发生未知错误'
                console.error('取消订阅工作流事件失败', { taskId, error: errMsg })
            }
        }
    }, [taskId])

    // 获取工作流详情，如果有SSE连接的情况下优先从SSE中步骤详情
    const displayDetail = useMemo(() => {
        const detail = JSON.parse(JSON.stringify(logDetailData)) as WorkflowLogDetailData
        // 将 executionMessages 移到 useMemo 内部，避免依赖问题
        const executionMessages = workflowExecution?.messages || []
        console.log('executionMessages:===>', executionMessages)

        if (executionMessages?.length && detail?.logList) {
            // 找到最后一个正在执行的步骤索引
            const lastExecutingStep = executionMessages.at(-1)
            const lastNode = executionMessages.findLast(
                msg => msg.executionStatus !== 'end' && !!msg.node && (typeof msg.node === 'string' ? msg.node !== '-' : true)
            )
            const isEnd =
                lastExecutingStep?.executionStatus === 'end' &&
                (typeof lastNode?.node === 'object' && lastNode?.node !== null
                    ? lastNode.node.nodeType === detail?.logList?.at(-1)?.node_type
                    : false)
            executionMessages.forEach(msgInfo => {
                const { node, tableQuantity, completedQuantity, status } = msgInfo

                const step = detail.logList.find(
                    log => log.node_type === node.nodeType
                ) as WorkflowStepLog
                if (step) {
                    step.completedQuantity = completedQuantity
                    step.table_quantity = tableQuantity
                    // 找到最后一个的索引
                    const lastIndex = detail.logList?.findIndex(
                        step => step.node_type === lastNode?.node.nodeType
                    )

                    if ((isEnd || step.step_no < lastIndex + 1) && step.enabled) {
                        step.step_status = 2
                    } else {
                        step.step_status = status
                    }
                }
            })
            if (lastNode) {
                detail.logSummary.node_type = lastNode?.node.nodeType
            }
            if (isEnd) {
                detail.logSummary.status = 2
            } else if (lastNode?.node && !lastNode.node.isAuto) {
                detail.logSummary.status = 3
            } else {
                detail.logSummary.status = 1
            }
        }
        return detail
    }, [logDetailData, workflowExecution?.messages, taskId])

    // 返回上一页
    const goBack = () => {
        // 检查是否有历史记录可以返回
        if (window.history.length > 1) {
            // 使用浏览器历史记录返回上一页
            navigate(-1)
        } else {
            // 如果没有历史记录（比如直接访问URL），则返回到工作流配置页面作为默认行为
            navigate('/data-governance/workflow-config')
        }
    }

    const getCurrentStep = () => {
        const stepIndex = displayDetail?.logList?.findIndex(
            step => displayDetail?.logSummary?.node_type === step.node_type
        )
        return stepIndex
    }

    const isCompletedNode = (step: WorkflowStepLog) => {
        return step.step_status === 2 || (step.enabled && step.step_status === 0)
    }

    // 查看执行结果
    const handleViewResult = (stepIndex: number) => {
        const step = EXECUTION_STEPS[stepIndex]
        if (!step) return

        setSelectedStepResult({
            title: step.title,
            resultSummary: step.resultSummary,
            stepIndex,
        })
        setResultModalVisible(true)
    }

    // 关闭结果弹窗
    const handleCloseResultModal = () => {
        setResultModalVisible(false)
        setSelectedStepResult(null)
    }

    // 获取状态标签
    const getStatusTag = (status: number, step?: WorkflowStepLog) => {
        // 如果没有执行详情，默认显示等待中状态
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]

        // 判断是否为历史节点（已经走过的步骤）
        const currentStepIndex = getCurrentStep()
        const stepIndex = displayDetail?.logList?.findIndex(s => s === step) ?? -1
        const isHistoricalNode = stepIndex >= 0 && stepIndex < currentStepIndex

        // 对于历史节点，根据enabled字段判断显示"已跳过"还是"已完成"
        if (isHistoricalNode && step) {
            if (!step.enabled) {
                // 关闭的节点显示"已跳过"
                return (
                    <Tag color='default'>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            ⊘ 已跳过
                        </span>
                    </Tag>
                )
            }
        }

        // 为已完成状态添加打勾标记，并简化文字显示
        if (step && isHistoricalNode && isCompletedNode(step)) {
            // 已完成状态
            return (
                <Tag color='success'>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>✓ 已完成</span>
                </Tag>
            )
        }

        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 计算是否全部步骤已完成
    const isWorkflowCompleted = useMemo(() => {
        return displayDetail?.logSummary?.status === 2
    }, [displayDetail])

    // 继续执行工作流
    const handleContinueExecution = async () => {
        if (!taskId) {
            uiMessage.error('任务ID不存在，无法继续执行')
            return
        }

        setContinueLoading(true)

        try {
            logger.info('开始继续执行工作流', { taskId })

            // 调用继续执行接口，复用启动工作流的SSE连接逻辑
            const success = await continueWorkflow(taskId, {
                onSuccess: () => {
                    uiMessage.success('工作流继续执行成功')
                    setContinueLoading(false)
                    // 刷新页面数据
                    fetchLogDetail()
                },
                onError: (error: string) => {
                    uiMessage.error(`继续执行失败: ${error}`)
                    setContinueLoading(false)
                    logger.error('继续执行工作流失败', new Error(error), { taskId })
                },
                onMessage: (message: string) => {
                    // SSE消息处理逻辑已在Redux中处理
                    logger.debug('收到继续执行SSE消息', { taskId, message })
                },
            })

            if (!success) {
                setContinueLoading(false)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '继续执行时发生未知错误'
            uiMessage.error(`继续执行失败: ${errorMsg}`)
            setContinueLoading(false)
            logger.error('继续执行工作流异常', error instanceof Error ? error : new Error(errorMsg), { taskId })
        }
    }

    // 触发数据同步（数据录入）
    // 使用模拟数据，等待2秒后提示已成功录入
    const handleDataSync = async () => {
        if (!taskId) {
            uiMessage.error('任务ID不存在，无法进行数据录入')
            return
        }

        try {
            setDataSyncLoading(true)
            logger.info('开始数据录入（数据同步）', { taskId })

            // 模拟数据录入，等待2秒
            await new Promise(resolve => setTimeout(resolve, 2000))

            // 提示已成功录入
            uiMessage.success('已成功录入')
            logger.info('数据录入（同步）成功', { taskId })

            // 尝试刷新展示数据
            await fetchLogDetail()
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '数据录入（同步）失败'
            uiMessage.error(errorMsg)
            logger.error('数据录入（同步）异常', error instanceof Error ? error : new Error(errorMsg), { taskId })
        } finally {
            setDataSyncLoading(false)
        }
    }

    // 渲染进度条
    const renderProgressBar = (step: WorkflowStepLog) => {
        if ([2, 3, 4].includes(step.step_status)) {
            return null
        }

        // 检查是否有进度数据
        if (!step.completedQuantity || !step.table_quantity) return null

        const percentage = Math.round((step.completedQuantity / step.table_quantity) * 100)

        return (
            <div
                style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
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
                    {step.completedQuantity}/{step.table_quantity} ({percentage}%)
                </Text>
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
                        执行详情
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
                        <Text copyable>{displayDetail?.logSummary?.batch_id || '无'}</Text>
                    </div>
                    <div>
                        <Text strong>任务名称：</Text>
                        <Text>{displayDetail?.logSummary?.name || '无'}</Text>
                    </div>
                    <div>
                        <Text strong>状态：</Text>
                        {getStatusTag(displayDetail?.logSummary?.status || 0)}
                    </div>
                    <div>
                        <Text strong>开始时间：</Text>
                        <Text>{displayDetail?.logSummary?.start_time || '未开始'}</Text>
                    </div>
                    <div>
                        <Text strong>结束时间：</Text>
                        <Text>{displayDetail?.logSummary?.end_time || '进行中'}</Text>
                    </div>
                </div>
            </Card>

            {/* 执行步骤 */}
            <Card title='执行步骤' style={{ marginBottom: 24 }}>
                <Steps
                    current={getCurrentStep()}
                    direction='vertical'
                    size='small'
                    style={{ marginBottom: 24 }}
                >
                    {displayDetail?.logList?.map((step, index) => {
                        if (!step) return null
                        const stepInfo = EXECUTION_STEPS.find(
                            item => item.nodeType === step.node_type
                        )
                        
                        return (
                            <Step
                                key={index}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{step?.step_name}</span>
                                        <Space>
                                            {
                                                step.step_status !== 4 && <Tag color={step.is_auto ? 'blue' : 'orange'}>
                                                    {step.is_auto ? '自动执行' : '手动执行'}
                                                </Tag>
                                            }
                                            {getStatusTag(step.step_status || 0, step)}
                                        </Space>
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            {step?.descript || stepInfo?.description}
                                        </div>
                                        {/* 进度条展示 - 仅在已完成的步骤上显示 */}
                                        {renderProgressBar(step)}

                                        {/* 继续执行按钮 - 仅在暂停状态的步骤显示 */}
                                        {step.step_status === 3 && (
                                            <Button
                                                type='primary'
                                                size='small'
                                                icon={<PlayCircleOutlined />}
                                                onClick={handleContinueExecution}
                                                loading={continueLoading}
                                                style={{ marginTop: 8, marginRight: 8 }}
                                            >
                                                继续执行
                                            </Button>
                                        )}

                                        {step.step_status === 2 && (
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

                {/* 全部完成后显示数据录入按钮 */}
                {isWorkflowCompleted && (
                    <div style={{ marginTop: 8 }}>
                        <Button
                            type='primary'
                            icon={<CloudSyncOutlined />}
                            onClick={handleDataSync}
                            loading={dataSyncLoading}
                        >
                            数据录入
                        </Button>
                    </div>
                )}
            </Card>
            {/* 执行结果查看弹窗 */}
            <Modal
                title={`执行结果 - ${selectedStepResult?.title}`}
                open={resultModalVisible}
                onCancel={handleCloseResultModal}
                footer={[
                    <Button key='close' onClick={handleCloseResultModal}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                {selectedStepResult && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>步骤名称：</Text>
                            <Text>{selectedStepResult.title}</Text>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>执行类型：</Text>
                            <Tag
                                color={
                                    EXECUTION_STEPS[selectedStepResult.stepIndex]?.isAutomatic
                                        ? 'blue'
                                        : 'orange'
                                }
                            >
                                {EXECUTION_STEPS[selectedStepResult.stepIndex]?.isAutomatic
                                    ? '自动执行'
                                    : '手动执行'}
                            </Tag>
                        </div>
                        <div>
                            <Text strong>执行结果：</Text>
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                }}
                            >
                                <Text>{selectedStepResult.resultSummary}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default WorkflowDetail
