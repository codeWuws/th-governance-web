import {
    ArrowLeftOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    CloudSyncOutlined,
    DownloadOutlined,
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
import { WorkflowService } from '../../services/workflowService'
import {
    WorkflowLogDetailResponse,
    WorkflowLogDetailData,
    WorkflowStepLog,
    WorkflowNodeType,
} from '../../types'
import { statusConfig } from './const'
import { continueWorkflow, subscribeWorkflow } from '@/utils/workflowUtils'
import JsonToTable from '@/components/JsonToTable'
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
    const [cleaningResultData, setCleaningResultData] = useState<Array<Record<string, unknown>>>([])
    const [cleaningResultLoading, setCleaningResultLoading] = useState(false)
    const [cleaningResultPagination, setCleaningResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 去重结果状态
    const [deduplicateResultData, setDeduplicateResultData] = useState<Array<Record<string, unknown>>>([])
    const [deduplicateResultLoading, setDeduplicateResultLoading] = useState(false)
    const [deduplicateResultPagination, setDeduplicateResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // 丢孤儿结果状态
    const [orphanResultData, setOrphanResultData] = useState<Array<Record<string, unknown>>>([])
    const [orphanResultLoading, setOrphanResultLoading] = useState(false)
    const [orphanResultPagination, setOrphanResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // 数据脱敏结果状态
    const [sensitiveResultData, setSensitiveResultData] = useState<Array<Record<string, unknown>>>([])
    const [sensitiveResultLoading, setSensitiveResultLoading] = useState(false)
    const [sensitiveResultPagination, setSensitiveResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // 标准对照结果状态
    const [standardMappingResultData, setStandardMappingResultData] = useState<Array<Record<string, unknown>>>([])
    const [standardMappingResultLoading, setStandardMappingResultLoading] = useState(false)
    const [standardMappingResultPagination, setStandardMappingResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // 导出清洗结果加载状态
    const [exportCleaningLoading, setExportCleaningLoading] = useState(false)

    // 导出去重结果加载状态
    const [exportDeduplicateLoading, setExportDeduplicateLoading] = useState(false)

    // 导出丢孤儿结果加载状态
    const [exportOrphanLoading, setExportOrphanLoading] = useState(false)

    // 导出数据脱敏结果加载状态
    const [exportSensitiveLoading, setExportSensitiveLoading] = useState(false)

    // 导出EMOI结果加载状态
    const [exportEmoiLoading, setExportEmoiLoading] = useState(false)

    // 导出标准对照结果加载状态
    const [exportStandardMappingLoading, setExportStandardMappingLoading] = useState(false)

    // EMPI结果状态
    const [empiResultData, setEmpiResultData] = useState<Array<Record<string, unknown>>>([])
    const [empiResultLoading, setEmpiResultLoading] = useState(false)
    const [empiResultPagination, setEmpiResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // EMOI结果状态
    const [emoiResultData, setEmoiResultData] = useState<Array<Record<string, unknown>>>([])
    const [emoiResultLoading, setEmoiResultLoading] = useState(false)
    const [emoiResultPagination, setEmoiResultPagination] = useState<{
        current: number
        pageSize: number
        total: number
    }>({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    // 工作流日志详情状态
    const [logDetailData, setLogDetailData] = useState<WorkflowLogDetailData | null>(null)

    // 继续执行状态
    const [continueLoading, setContinueLoading] = useState(false)

    // 数据同步（数据录入）按钮加载状态
    const [dataSyncLoading, setDataSyncLoading] = useState(false)

    // 刷新状态
    const [refreshLoading, setRefreshLoading] = useState(false)

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
                await WorkflowService.getLogDetail(taskId)
            
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
        try {
            setRefreshLoading(true)
            logger.debug('手动刷新详情')
            await fetchLogDetail()
            // 刷新成功后显示提示
            uiMessage.success('刷新成功')
        } catch (error) {
            logger.error('刷新失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('刷新失败，请稍后重试')
        } finally {
            setRefreshLoading(false)
        }
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
                const { node, tableQuantity, completedQuantity, status, tableName, table } = msgInfo

                const step = detail.logList.find(
                    log => log.node_type === node.nodeType
                ) as WorkflowStepLog
                if (step) {
                    step.completedQuantity = completedQuantity
                    step.table_quantity = tableQuantity
                    // 更新tableName和table字段
                    if (tableName !== undefined) {
                        step.tableName = tableName
                    }
                    if (table !== undefined) {
                        step.table = table
                    }
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
    const handleViewResult = async (stepIndex: number) => {
        const step = EXECUTION_STEPS[stepIndex]
        if (!step) return

        setSelectedStepResult({
            title: step.title,
            resultSummary: step.resultSummary,
            stepIndex,
        })
        setResultModalVisible(true)

        // 如果是数据清洗步骤（第一个步骤），获取数据清洗结果
        if (stepIndex === 0 && step.nodeType === WorkflowNodeType.DATA_CLEANSING && taskId) {
            // 重置分页
            setCleaningResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            // 加载第一页数据
            await fetchCleaningResult(taskId, 1, 10)
        } else if (stepIndex === 1 && step.nodeType === WorkflowNodeType.DATA_DEDUPLICATION && taskId) {
            // 如果是数据去重步骤（第二个步骤），获取去重结果
            // 重置分页
            setDeduplicateResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchDeduplicateResult(taskId, 1, 20)
        } else if (stepIndex === 3 && step.nodeType === WorkflowNodeType.STANDARD_MAPPING && taskId) {
            // 如果是标准对照步骤（第四个步骤），获取标准对照结果
            // 重置分页
            setStandardMappingResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchStandardMappingResult(taskId, 1, 20)
        } else if (stepIndex === 4 && step.nodeType === WorkflowNodeType.EMPI_DEFINITION_DISTRIBUTION && taskId) {
            // 如果是EMPI发放步骤（第五个步骤），获取EMPI结果
            // 重置分页
            setEmpiResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchEmpiResult(taskId, 1, 20)
        } else if (stepIndex === 5 && step.nodeType === WorkflowNodeType.EMOI_DEFINITION_DISTRIBUTION && taskId) {
            // 如果是EMOI发放步骤（第六个步骤），获取EMOI结果
            // 重置分页
            setEmoiResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchEmoiResult(taskId, 1, 20)
        } else if (stepIndex === 7 && step.nodeType === WorkflowNodeType.DATA_ORPHAN && taskId) {
            // 如果是丢孤儿步骤（第八个步骤），获取丢孤儿结果
            // 重置分页
            setOrphanResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchOrphanResult(taskId, 1, 20)
        } else if (stepIndex === 8 && step.nodeType === WorkflowNodeType.DATA_DESENSITIZATION && taskId) {
            // 如果是数据脱敏步骤（第九个步骤），获取数据脱敏结果
            // 重置分页
            setSensitiveResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            // 加载第一页数据
            await fetchSensitiveResult(taskId, 1, 20)
        } else {
            // 其他步骤，清空数据
            setCleaningResultData([])
            setCleaningResultPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            })
            setDeduplicateResultData([])
            setDeduplicateResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            setEmpiResultData([])
            setEmpiResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            setEmoiResultData([])
            setEmoiResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            setOrphanResultData([])
            setOrphanResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            setSensitiveResultData([])
            setSensitiveResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
            setStandardMappingResultData([])
            setStandardMappingResultPagination({
                current: 1,
                pageSize: 20,
                total: 0,
            })
        }
    }

    // 获取数据清洗结果
    const fetchCleaningResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setCleaningResultLoading(true)
        try {
            const response = await WorkflowService.getCleaningResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setCleaningResultData(response.data.records || [])
                setCleaningResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取数据清洗结果失败'
                uiMessage.handleSystemError(errorMsg)
                setCleaningResultData([])
            }
        } catch (error) {
            logger.error('获取数据清洗结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取数据清洗结果失败')
            setCleaningResultData([])
        } finally {
            setCleaningResultLoading(false)
        }
    }

    // 获取去重结果
    const fetchDeduplicateResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setDeduplicateResultLoading(true)
        try {
            const response = await WorkflowService.getDeduplicateResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setDeduplicateResultData(response.data.records || [])
                setDeduplicateResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取去重步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setDeduplicateResultData([])
            }
        } catch (error) {
            logger.error('获取去重步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取去重步骤结果失败')
            setDeduplicateResultData([])
        } finally {
            setDeduplicateResultLoading(false)
        }
    }

    // 处理分页变化
    const handleCleaningResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 0) {
            fetchCleaningResult(taskId, page, pageSize)
        }
    }

    // 获取丢孤儿结果
    const fetchOrphanResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setOrphanResultLoading(true)
        try {
            const response = await WorkflowService.getOrphanResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setOrphanResultData(response.data.records || [])
                setOrphanResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取丢孤儿步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setOrphanResultData([])
            }
        } catch (error) {
            logger.error('获取丢孤儿步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取丢孤儿步骤结果失败')
            setOrphanResultData([])
        } finally {
            setOrphanResultLoading(false)
        }
    }

    // 处理去重结果分页变化
    const handleDeduplicateResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 1) {
            fetchDeduplicateResult(taskId, page, pageSize)
        }
    }

    // 获取数据脱敏结果
    const fetchSensitiveResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setSensitiveResultLoading(true)
        try {
            const response = await WorkflowService.getSensitiveResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setSensitiveResultData(response.data.records || [])
                setSensitiveResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取数据脱敏步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setSensitiveResultData([])
            }
        } catch (error) {
            logger.error('获取数据脱敏步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取数据脱敏步骤结果失败')
            setSensitiveResultData([])
        } finally {
            setSensitiveResultLoading(false)
        }
    }

    // 获取EMPI结果
    const fetchEmpiResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setEmpiResultLoading(true)
        try {
            const response = await WorkflowService.getEmpiResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setEmpiResultData(response.data.records || [])
                setEmpiResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取EMPI步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setEmpiResultData([])
            }
        } catch (error) {
            logger.error('获取EMPI步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取EMPI步骤结果失败')
            setEmpiResultData([])
        } finally {
            setEmpiResultLoading(false)
        }
    }

    // 获取EMOI结果
    const fetchEmoiResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setEmoiResultLoading(true)
        try {
            const response = await WorkflowService.getEmoiResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setEmoiResultData(response.data.records || [])
                setEmoiResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取EMOI步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setEmoiResultData([])
            }
        } catch (error) {
            logger.error('获取EMOI步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取EMOI步骤结果失败')
            setEmoiResultData([])
        } finally {
            setEmoiResultLoading(false)
        }
    }

    // 获取标准对照结果
    const fetchStandardMappingResult = async (batchId: string, pageNum: number, pageSize: number) => {
        setStandardMappingResultLoading(true)
        try {
            const response = await WorkflowService.getStandardMappingResult(batchId, pageNum, pageSize)
            // 接口返回标准 ApiResponse 格式：{ code, msg, data: { records, total, size, current, pages } }
            if (response.code === 200 && response.data) {
                setStandardMappingResultData(response.data.records || [])
                setStandardMappingResultPagination({
                    current: response.data.current || pageNum,
                    pageSize: response.data.size || pageSize,
                    total: response.data.total || 0,
                })
            } else {
                const errorMsg = (response as { msg?: string }).msg || '获取标准对照步骤结果失败'
                uiMessage.handleSystemError(errorMsg)
                setStandardMappingResultData([])
            }
        } catch (error) {
            logger.error('获取标准对照步骤结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('获取标准对照步骤结果失败')
            setStandardMappingResultData([])
        } finally {
            setStandardMappingResultLoading(false)
        }
    }

    // 处理丢孤儿结果分页变化
    const handleOrphanResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 7) {
            fetchOrphanResult(taskId, page, pageSize)
        }
    }

    // 处理数据脱敏结果分页变化
    const handleSensitiveResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 8) {
            fetchSensitiveResult(taskId, page, pageSize)
        }
    }

    // 处理EMPI结果分页变化
    const handleEmpiResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 4) {
            fetchEmpiResult(taskId, page, pageSize)
        }
    }

    // 处理EMOI结果分页变化
    const handleEmoiResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 5) {
            fetchEmoiResult(taskId, page, pageSize)
        }
    }

    // 处理标准对照结果分页变化
    const handleStandardMappingResultPageChange = (page: number, pageSize: number) => {
        if (taskId && selectedStepResult?.stepIndex === 3) {
            fetchStandardMappingResult(taskId, page, pageSize)
        }
    }

    // 导出数据清洗结果
    const handleExportCleaningResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportCleaningLoading(true)
        try {
            logger.info('开始导出数据清洗结果', { taskId })
            await WorkflowService.exportCleaningResult(taskId)
            uiMessage.success('导出成功')
            logger.info('数据清洗结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出数据清洗结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportCleaningLoading(false)
        }
    }

    // 导出数据去重结果
    const handleExportDeduplicateResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportDeduplicateLoading(true)
        try {
            logger.info('开始导出数据去重结果', { taskId })
            await WorkflowService.exportDeduplicateResult(taskId)
            uiMessage.success('导出成功')
            logger.info('数据去重结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出数据去重结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportDeduplicateLoading(false)
        }
    }

    // 导出丢孤儿结果
    const handleExportOrphanResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportOrphanLoading(true)
        try {
            logger.info('开始导出丢孤儿结果', { taskId })
            await WorkflowService.exportOrphanResult(taskId)
            uiMessage.success('导出成功')
            logger.info('丢孤儿结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出丢孤儿结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportOrphanLoading(false)
        }
    }

    // 导出数据脱敏结果
    const handleExportSensitiveResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportSensitiveLoading(true)
        try {
            logger.info('开始导出数据脱敏结果', { taskId })
            await WorkflowService.exportSensitiveResult(taskId)
            uiMessage.success('导出成功')
            logger.info('数据脱敏结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出数据脱敏结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportSensitiveLoading(false)
        }
    }

    // 导出EMOI结果
    const handleExportEmoiResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportEmoiLoading(true)
        try {
            logger.info('开始导出EMOI结果', { taskId })
            await WorkflowService.exportEmoiResult(taskId)
            uiMessage.success('导出成功')
            logger.info('EMOI结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出EMOI结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportEmoiLoading(false)
        }
    }

    // 导出标准对照结果
    const handleExportStandardMappingResult = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法导出')
            return
        }

        setExportStandardMappingLoading(true)
        try {
            logger.info('开始导出标准对照结果', { taskId })
            await WorkflowService.exportStandardMappingResult(taskId)
            uiMessage.success('导出成功')
            logger.info('标准对照结果导出成功', { taskId })
        } catch (error) {
            logger.error('导出标准对照结果失败', error instanceof Error ? error : new Error(String(error)))
            uiMessage.handleSystemError('导出失败，请稍后重试')
        } finally {
            setExportStandardMappingLoading(false)
        }
    }

    // 关闭结果弹窗
    const handleCloseResultModal = () => {
        setResultModalVisible(false)
        setSelectedStepResult(null)
        setCleaningResultData([])
        setCleaningResultPagination({
            current: 1,
            pageSize: 10,
            total: 0,
        })
        setDeduplicateResultData([])
        setDeduplicateResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
        setEmpiResultData([])
        setEmpiResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
        setEmoiResultData([])
        setEmoiResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
        setOrphanResultData([])
        setOrphanResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
        setSensitiveResultData([])
        setSensitiveResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
        setStandardMappingResultData([])
        setStandardMappingResultPagination({
            current: 1,
            pageSize: 20,
            total: 0,
        })
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
            uiMessage.handleSystemError('任务ID不存在，无法继续执行')
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
                    uiMessage.handleSystemError(`继续执行失败: ${error}`)
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
            uiMessage.handleSystemError(`继续执行失败: ${errorMsg}`)
            setContinueLoading(false)
            logger.error('继续执行工作流异常', error instanceof Error ? error : new Error(errorMsg), { taskId })
        }
    }

    // 触发数据同步（数据录入）
    const handleDataSync = async () => {
        if (!taskId) {
            uiMessage.handleSystemError('任务ID不存在，无法进行数据录入')
            return
        }

        try {
            setDataSyncLoading(true)
            logger.info('开始数据录入（数据同步）', { taskId })

            const response = await WorkflowService.syncTaskData(taskId)

            if (response.code === 200) {
                const successMsg = (response as { msg?: string }).msg || '数据录入成功'
                uiMessage.success(successMsg)
                logger.info('数据录入（同步）成功', { taskId })
                // 刷新展示数据
                await fetchLogDetail()
            } else {
                const errorMsg = (response as { msg?: string }).msg || '数据录入失败'
                uiMessage.handleSystemError(errorMsg)
                logger.error('数据录入失败', new Error(errorMsg), { taskId, response })
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '数据录入（同步）失败'
            uiMessage.handleSystemError(errorMsg)
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
        const { table, tableName } = step;
        const percentage = Math.round((step.completedQuantity / step.table_quantity) * 100)
        const isRunning = step.step_no === getCurrentStep() + 1;
        

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
                        {step.completedQuantity}/{step.table_quantity} ({percentage}%)
                    </Text>
                </div>
                {/* 在进度条下方显示table信息 */}
                {isRunning && (table || tableName) && (
                    <div>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            正在处理数据表{table}({tableName})
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

    return (
        <Spin spinning={refreshLoading} tip="正在刷新...">
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
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleRefresh} 
                        loading={refreshLoading}
                        type="default"
                    >
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

                                        {step.step_status === 2 && 
                                         (step.node_type === WorkflowNodeType.DATA_CLEANSING ||
                                          step.node_type === WorkflowNodeType.DATA_DEDUPLICATION ||
                                          step.node_type === WorkflowNodeType.STANDARD_MAPPING ||
                                          step.node_type === WorkflowNodeType.EMPI_DEFINITION_DISTRIBUTION ||
                                          step.node_type === WorkflowNodeType.EMOI_DEFINITION_DISTRIBUTION ||
                                          step.node_type === WorkflowNodeType.DATA_ORPHAN ||
                                          step.node_type === WorkflowNodeType.DATA_DESENSITIZATION) && (
                                            <Space style={{ marginTop: 8 }}>
                                                <Button
                                                    type='link'
                                                    size='small'
                                                    icon={<EyeOutlined />}
                                                    onClick={() => handleViewResult(index)}
                                                    style={{ padding: 0, height: 'auto' }}
                                                >
                                                    查看执行结果
                                                </Button>
                                                {/* 数据清洗步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.DATA_CLEANSING && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportCleaningResult}
                                                        loading={exportCleaningLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                                {/* 数据去重步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.DATA_DEDUPLICATION && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportDeduplicateResult}
                                                        loading={exportDeduplicateLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                                {/* 标准对照步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.STANDARD_MAPPING && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportStandardMappingResult}
                                                        loading={exportStandardMappingLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                                {/* EMOI步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.EMOI_DEFINITION_DISTRIBUTION && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportEmoiResult}
                                                        loading={exportEmoiLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                                {/* 丢孤儿步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.DATA_ORPHAN && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportOrphanResult}
                                                        loading={exportOrphanLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                                {/* 数据脱敏步骤显示导出按钮 */}
                                                {step.node_type === WorkflowNodeType.DATA_DESENSITIZATION && (
                                                    <Button
                                                        type='link'
                                                        size='small'
                                                        icon={<DownloadOutlined />}
                                                        onClick={handleExportSensitiveResult}
                                                        loading={exportSensitiveLoading}
                                                        style={{ padding: 0, height: 'auto' }}
                                                    >
                                                        导出执行结果
                                                    </Button>
                                                )}
                                            </Space>
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
                width={selectedStepResult?.stepIndex === 0 || selectedStepResult?.stepIndex === 1 || selectedStepResult?.stepIndex === 3 || selectedStepResult?.stepIndex === 4 || selectedStepResult?.stepIndex === 5 || selectedStepResult?.stepIndex === 7 || selectedStepResult?.stepIndex === 8 ? 1200 : 600}
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
                        {/* 数据清洗步骤显示表格 */}
                        {selectedStepResult.stepIndex === 0 &&
                        EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                            WorkflowNodeType.DATA_CLEANSING ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    数据清洗结果：
                                </Text>
                                <Spin spinning={cleaningResultLoading}>
                                    {cleaningResultData.length > 0 ? (
                                        <JsonToTable
                                            data={cleaningResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                batch_id: '批次ID',
                                                tableName: '表名',
                                                table_name: '表名',
                                                table: '表名',
                                                columnName: '列名',
                                                column_name: '列名',
                                                column: '列名',
                                                fieldName: '字段名',
                                                field_name: '字段名',
                                                oldValue: '原值',
                                                old_value: '原值',
                                                newValue: '新值',
                                                new_value: '新值',
                                                value: '值',
                                                ids: '记录ID',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: cleaningResultPagination.current,
                                                    pageSize: cleaningResultPagination.pageSize,
                                                    total: cleaningResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleCleaningResultPageChange,
                                                    onShowSizeChange: handleCleaningResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {cleaningResultLoading
                                                ? '加载中...'
                                                : '暂无数据清洗结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 1 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.DATA_DEDUPLICATION ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    去重步骤结果：
                                </Text>
                                <Spin spinning={deduplicateResultLoading}>
                                    {deduplicateResultData.length > 0 ? (
                                        <JsonToTable
                                            data={deduplicateResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                ids: '重复记录ID',
                                                tableName: '表名',
                                                columnName: '列名',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: deduplicateResultPagination.current,
                                                    pageSize: deduplicateResultPagination.pageSize,
                                                    total: deduplicateResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleDeduplicateResultPageChange,
                                                    onShowSizeChange: handleDeduplicateResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {deduplicateResultLoading
                                                ? '加载中...'
                                                : '暂无去重步骤结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 3 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.STANDARD_MAPPING ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    标准对照步骤结果：
                                </Text>
                                <Spin spinning={standardMappingResultLoading}>
                                    {standardMappingResultData.length > 0 ? (
                                        <JsonToTable
                                            data={standardMappingResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                batch_id: '批次ID',
                                                dataSourceId: '数据源ID',
                                                data_source_id: '数据源ID',
                                                ruleId: '规则ID',
                                                rule_id: '规则ID',
                                                tableName: '表名',
                                                table_name: '表名',
                                                columnName: '列名',
                                                column_name: '列名',
                                                standardName: '标准名称',
                                                standard_name: '标准名称',
                                                mappingCount: '值映射数量',
                                                mapping_count: '值映射数量',
                                                dataCount: '匹配数据量',
                                                data_count: '匹配数据量',
                                                totalDataCount: '总数据量',
                                                total_data_count: '总数据量',
                                                message: '描述',
                                                createTime: '创建时间',
                                                create_time: '创建时间',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: standardMappingResultPagination.current,
                                                    pageSize: standardMappingResultPagination.pageSize,
                                                    total: standardMappingResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleStandardMappingResultPageChange,
                                                    onShowSizeChange: handleStandardMappingResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {standardMappingResultLoading
                                                ? '加载中...'
                                                : '暂无标准对照步骤结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 4 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.EMPI_DEFINITION_DISTRIBUTION ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    EMPI发放结果：
                                </Text>
                                <Spin spinning={empiResultLoading}>
                                    {empiResultData.length > 0 ? (
                                        <JsonToTable
                                            data={empiResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                patientName: '患者姓名',
                                                patient_name: '患者姓名',
                                                sexCode: '性别编码',
                                                sex_code: '性别编码',
                                                birthDate: '出生日期',
                                                birth_date: '出生日期',
                                                idNumber: '身份证号',
                                                id_number: '身份证号',
                                                phone: '电话',
                                                hospitalNo: '住院号',
                                                hospital_no: '住院号',
                                                registrationNumber: '就诊号',
                                                registration_number: '就诊号',
                                                consulationType: '就诊类型',
                                                consulation_type: '就诊类型',
                                                empi: 'EMPI',
                                                empiStatus: 'EMPI状态',
                                                empi_status: 'EMPI状态',
                                                address: '地址',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: empiResultPagination.current,
                                                    pageSize: empiResultPagination.pageSize,
                                                    total: empiResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleEmpiResultPageChange,
                                                    onShowSizeChange: handleEmpiResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {empiResultLoading
                                                ? '加载中...'
                                                : '暂无EMPI发放结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 5 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.EMOI_DEFINITION_DISTRIBUTION ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    EMOI发放结果：
                                </Text>
                                <Spin spinning={emoiResultLoading}>
                                    {emoiResultData.length > 0 ? (
                                        <JsonToTable
                                            data={emoiResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                batch_id: '批次ID',
                                                dataId: '数据ID',
                                                data_id: '数据ID',
                                                tableName: '表名',
                                                table_name: '表名',
                                                table: '表名',
                                                registrationNumber: '就诊号',
                                                registration_number: '就诊号',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: emoiResultPagination.current,
                                                    pageSize: emoiResultPagination.pageSize,
                                                    total: emoiResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleEmoiResultPageChange,
                                                    onShowSizeChange: handleEmoiResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {emoiResultLoading
                                                ? '加载中...'
                                                : '暂无EMOI发放结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 7 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.DATA_ORPHAN ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    丢孤儿步骤结果：
                                </Text>
                                <Spin spinning={orphanResultLoading}>
                                    {orphanResultData.length > 0 ? (
                                        <JsonToTable
                                            data={orphanResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                batch_id: '批次ID',
                                                childTable: '子表名',
                                                child_table: '子表名',
                                                parentTable: '父表名',
                                                parent_table: '父表名',
                                                childColumn: '子表列名',
                                                child_column: '子表列名',
                                                parentColumn: '父表列名',
                                                parent_column: '父表列名',
                                                childId: '子表记录ID',
                                                child_id: '子表记录ID',
                                                // 兼容其他可能的字段名
                                                tableName: '表名',
                                                table_name: '表名',
                                                table: '表名',
                                                masterTable: '主表名',
                                                master_table: '主表名',
                                                orphanCount: '孤儿数量',
                                                orphan_count: '孤儿数量',
                                                columnName: '列名',
                                                column_name: '列名',
                                                column: '列名',
                                                ids: '记录ID',
                                                reason: '原因',
                                                relatedFields: '关联字段',
                                                related_fields: '关联字段',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: orphanResultPagination.current,
                                                    pageSize: orphanResultPagination.pageSize,
                                                    total: orphanResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleOrphanResultPageChange,
                                                    onShowSizeChange: handleOrphanResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {orphanResultLoading
                                                ? '加载中...'
                                                : '暂无丢孤儿步骤结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : selectedStepResult.stepIndex === 8 &&
                          EXECUTION_STEPS[selectedStepResult.stepIndex]?.nodeType ===
                              WorkflowNodeType.DATA_DESENSITIZATION ? (
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                                    数据脱敏步骤结果：
                                </Text>
                                <Spin spinning={sensitiveResultLoading}>
                                    {sensitiveResultData.length > 0 ? (
                                        <JsonToTable
                                            data={sensitiveResultData}
                                            columnMapping={{
                                                id: 'ID',
                                                batchId: '批次ID',
                                                batch_id: '批次ID',
                                                childTable: '子表名',
                                                child_table: '子表名',
                                                parentTable: '父表名',
                                                parent_table: '父表名',
                                                childColumn: '子表列名',
                                                child_column: '子表列名',
                                                parentColumn: '父表列名',
                                                parent_column: '父表列名',
                                                childId: '子表记录ID',
                                                child_id: '子表记录ID',
                                                // 兼容其他可能的字段名
                                                tableName: '表名',
                                                table_name: '表名',
                                                table: '表名',
                                                columnName: '列名',
                                                column_name: '列名',
                                                column: '列名',
                                                fieldName: '字段名',
                                                field_name: '字段名',
                                                oldValue: '原值',
                                                old_value: '原值',
                                                newValue: '脱敏后值',
                                                new_value: '脱敏后值',
                                                sensitiveType: '脱敏类型',
                                                sensitive_type: '脱敏类型',
                                                ids: '记录ID',
                                            }}
                                            tableProps={{
                                                scroll: { y: 400 },
                                                pagination: {
                                                    current: sensitiveResultPagination.current,
                                                    pageSize: sensitiveResultPagination.pageSize,
                                                    total: sensitiveResultPagination.total,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                    showTotal: (total, range) =>
                                                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                                    onChange: handleSensitiveResultPageChange,
                                                    onShowSizeChange: handleSensitiveResultPageChange,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: 40,
                                                textAlign: 'center',
                                                color: '#999',
                                            }}
                                        >
                                            {sensitiveResultLoading
                                                ? '加载中...'
                                                : '暂无数据脱敏步骤结果'}
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        ) : (
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
                        )}
                    </div>
                )}
            </Modal>
            </div>
        </Spin>
    )
}

export default WorkflowDetail
