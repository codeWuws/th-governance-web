import React, { useState, useEffect, useCallback } from 'react'
import { Tag, Typography, Spin, Button } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import JsonToTable from '@/components/JsonToTable'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import dayjs from 'dayjs'
import type {
    QCTaskLogItem,
    AccuracyQCResultRecord,
    CompletenessQCResultRecord,
    ConsistencyQCResultRecord,
} from '@/types'

const { Text } = Typography

interface QCResultDialogProps extends Omit<CustomDialogProps, 'children'> {
    /** 步骤标题 */
    title: string
    /** 步骤类型 */
    type?: string
    /** 步骤信息 */
    step?: QCTaskLogItem
    /** 批次ID */
    batchId?: string
}

/**
 * 质控执行结果查看弹窗
 * 支持准确性质控和完整性质控的表格展示
 */
const QCResultDialog: React.FC<QCResultDialogProps> = ({
    title,
    type,
    step,
    batchId,
    ...restProps
}) => {
    // 准确性质控数据状态
    const [accuracyResultData, setAccuracyResultData] = useState<AccuracyQCResultRecord[]>([])
    const [accuracyResultLoading, setAccuracyResultLoading] = useState(false)
    const [accuracyResultPagination, setAccuracyResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 完整性质控数据状态
    const [completenessResultData, setCompletenessResultData] = useState<CompletenessQCResultRecord[]>([])
    const [completenessResultLoading, setCompletenessResultLoading] = useState(false)
    const [completenessResultPagination, setCompletenessResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 一致性质控数据状态
    const [consistencyResultData, setConsistencyResultData] = useState<ConsistencyQCResultRecord[]>([])
    const [consistencyResultLoading, setConsistencyResultLoading] = useState(false)
    const [consistencyResultPagination, setConsistencyResultPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 获取准确性质控执行结果
    const fetchAccuracyResult = useCallback(async (pageNum: number, pageSize: number) => {
        if (!batchId) return

        try {
            setAccuracyResultLoading(true)
            logger.info('开始获取准确性质控执行结果', { batchId, pageNum, pageSize })

            const response = await dataQualityControlService.getAccuracyQCResultPage({
                pageNum,
                pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
                batchId,
            })

            if (response.code === 200 && response.data) {
                setAccuracyResultData(response.data.records || [])
                setAccuracyResultPagination(prev => ({
                    ...prev,
                    current: parseInt(response.data.current || '1', 10),
                    total: parseInt(response.data.total || '0', 10),
                }))
                logger.info('成功获取准确性质控执行结果', {
                    count: response.data.records?.length || 0,
                    total: response.data.total,
                })
            } else {
                const errorMsg = response.msg || '获取准确性质控执行结果失败'
                logger.error('获取准确性质控执行结果失败', new Error(errorMsg))
                uiMessage.error(errorMsg)
                setAccuracyResultData([])
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取准确性质控执行结果时发生未知错误'
            logger.error('获取准确性质控执行结果异常', error instanceof Error ? error : new Error(errorMsg))
            uiMessage.error(errorMsg)
            setAccuracyResultData([])
        } finally {
            setAccuracyResultLoading(false)
        }
    }, [batchId])

    // 获取完整性质控执行结果
    const fetchCompletenessResult = useCallback(async (pageNum: number, pageSize: number) => {
        if (!batchId) return

        try {
            setCompletenessResultLoading(true)
            logger.info('开始获取完整性质控执行结果', { batchId, pageNum, pageSize })

            const response = await dataQualityControlService.getCompletenessQCResultPage({
                pageNum,
                pageSize,
                batchId,
            })

            if (response.code === 200 && response.data) {
                setCompletenessResultData(response.data.records || [])
                setCompletenessResultPagination(prev => ({
                    ...prev,
                    current: parseInt(response.data.current || '1', 10),
                    total: parseInt(response.data.total || '0', 10),
                }))
                logger.info('成功获取完整性质控执行结果', {
                    count: response.data.records?.length || 0,
                    total: response.data.total,
                })
            } else {
                const errorMsg = response.msg || '获取完整性质控执行结果失败'
                logger.error('获取完整性质控执行结果失败', new Error(errorMsg))
                uiMessage.error(errorMsg)
                setCompletenessResultData([])
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取完整性质控执行结果时发生未知错误'
            logger.error('获取完整性质控执行结果异常', error instanceof Error ? error : new Error(errorMsg))
            uiMessage.error(errorMsg)
            setCompletenessResultData([])
        } finally {
            setCompletenessResultLoading(false)
        }
    }, [batchId])

    // 获取一致性质控执行结果
    const fetchConsistencyResult = useCallback(async (pageNum: number, pageSize: number) => {
        if (!batchId) return

        try {
            setConsistencyResultLoading(true)
            logger.info('开始获取一致性质控执行结果', { batchId, pageNum, pageSize })

            const response = await dataQualityControlService.getConsistencyQCResultPage({
                pageNum,
                pageSize,
                batchId,
            })

            if (response.code === 200 && response.data) {
                setConsistencyResultData(response.data.records || [])
                setConsistencyResultPagination(prev => ({
                    ...prev,
                    current: parseInt(response.data.current || '1', 10),
                    total: parseInt(response.data.total || '0', 10),
                }))
                logger.info('成功获取一致性质控执行结果', {
                    count: response.data.records?.length || 0,
                    total: response.data.total,
                })
            } else {
                const errorMsg = response.msg || '获取一致性质控执行结果失败'
                logger.error('获取一致性质控执行结果失败', new Error(errorMsg))
                uiMessage.error(errorMsg)
                setConsistencyResultData([])
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取一致性质控执行结果时发生未知错误'
            logger.error('获取一致性质控执行结果异常', error instanceof Error ? error : new Error(errorMsg))
            uiMessage.error(errorMsg)
            setConsistencyResultData([])
        } finally {
            setConsistencyResultLoading(false)
        }
    }, [batchId])

    // 初始化数据
    useEffect(() => {
        if (type === 'core-data' && batchId) {
            setAccuracyResultPagination(prev => ({ ...prev, current: 1 }))
            fetchAccuracyResult(1, accuracyResultPagination.pageSize)
        } else if (type === 'completeness' && batchId) {
            setCompletenessResultPagination(prev => ({ ...prev, current: 1 }))
            fetchCompletenessResult(1, completenessResultPagination.pageSize)
        } else if (type === 'basic-medical-logic' && batchId) {
            setConsistencyResultPagination(prev => ({ ...prev, current: 1 }))
            fetchConsistencyResult(1, consistencyResultPagination.pageSize)
        }
    }, [type, batchId, fetchAccuracyResult, fetchCompletenessResult, fetchConsistencyResult, accuracyResultPagination.pageSize, completenessResultPagination.pageSize, consistencyResultPagination.pageSize])

    // 处理准确性质控分页变化
    const handleAccuracyResultPaginationChange = (page: number, pageSize: number) => {
        if (batchId) {
            setAccuracyResultPagination(prev => ({ ...prev, current: page, pageSize }))
            fetchAccuracyResult(page, pageSize)
        }
    }

    // 处理完整性质控分页变化
    const handleCompletenessResultPaginationChange = (page: number, pageSize: number) => {
        if (batchId) {
            setCompletenessResultPagination(prev => ({ ...prev, current: page, pageSize }))
            fetchCompletenessResult(page, pageSize)
        }
    }

    // 处理一致性质控分页变化
    const handleConsistencyResultPaginationChange = (page: number, pageSize: number) => {
        if (batchId) {
            setConsistencyResultPagination(prev => ({ ...prev, current: page, pageSize }))
            fetchConsistencyResult(page, pageSize)
        }
    }

    // 计算弹窗宽度
    const dialogWidth = type === 'core-data' || type === 'completeness' || type === 'basic-medical-logic' ? 1200 : 600

    // 渲染执行结果内容
    const renderResultContent = () => {
        // 准确性质控显示表格
        if (type === 'core-data') {
            return (
                <div style={{ marginTop: 16 }}>
                    <Spin spinning={accuracyResultLoading}>
                        {accuracyResultData.length > 0 ? (
                            <JsonToTable
                                data={accuracyResultData as unknown as Array<Record<string, unknown>>}
                                columnMapping={{
                                    id: 'ID',
                                    ruleCode: '规则编码',
                                    mainTable: '主表',
                                    subTable: '次表',
                                    mainTableName: '主表表名',
                                    subTableName: '次表表名',
                                    mainCount: '主表数量',
                                    subCount: '次表数量',
                                    issueDesc: '问题描述',
                                    batchId: '批次ID',
                                }}
                                tableProps={{
                                    scroll: { y: 400, x: 'max-content' },
                                    pagination: {
                                        current: accuracyResultPagination.current,
                                        pageSize: accuracyResultPagination.pageSize,
                                        total: accuracyResultPagination.total,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                        onChange: handleAccuracyResultPaginationChange,
                                        onShowSizeChange: handleAccuracyResultPaginationChange,
                                    },
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}
                            >
                                <Text type='secondary'>暂无数据</Text>
                            </div>
                        )}
                    </Spin>
                </div>
            )
        }

        // 完整性质控显示表格
        if (type === 'completeness') {
            return (
                <div style={{ marginTop: 16 }}>
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
                                    scroll: { y: 400, x: 'max-content' },
                                    pagination: {
                                        current: completenessResultPagination.current,
                                        pageSize: completenessResultPagination.pageSize,
                                        total: completenessResultPagination.total,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                        onChange: handleCompletenessResultPaginationChange,
                                        onShowSizeChange: handleCompletenessResultPaginationChange,
                                    },
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}
                            >
                                <Text type='secondary'>暂无数据</Text>
                            </div>
                        )}
                    </Spin>
                </div>
            )
        }

        // 一致性质控显示表格
        if (type === 'basic-medical-logic') {
            return (
                <div style={{ marginTop: 16 }}>
                    <Spin spinning={consistencyResultLoading}>
                        {consistencyResultData.length > 0 ? (
                            <JsonToTable
                                data={consistencyResultData as unknown as Array<Record<string, unknown>>}
                                columnMapping={{
                                    id: 'ID',
                                    code: '规则编码',
                                    mainTable: '主表',
                                    subTable: '次表',
                                    mainTableName: '主表表名',
                                    subTableName: '次表表名',
                                    mainTableCount: '主表数量',
                                    subTableCount: '次表数量',
                                    field: '字段名',
                                    fieldName: '字段名称',
                                    issueDesc: '问题描述',
                                    batchId: '批次ID',
                                }}
                                tableProps={{
                                    scroll: { y: 400, x: 'max-content' },
                                    pagination: {
                                        current: consistencyResultPagination.current,
                                        pageSize: consistencyResultPagination.pageSize,
                                        total: consistencyResultPagination.total,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total, range) =>
                                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                                        onChange: handleConsistencyResultPaginationChange,
                                        onShowSizeChange: handleConsistencyResultPaginationChange,
                                    },
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                    textAlign: 'center',
                                }}
                            >
                                <Text type='secondary'>暂无数据</Text>
                            </div>
                        )}
                    </Spin>
                </div>
            )
        }

        // 其他类型显示文本结果
        const resultSummary = step?.step_status === 2 ? `${title}执行完成` : '暂无执行结果'
        return (
            <div
                style={{
                    marginTop: 8,
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                }}
            >
                <Text>{resultSummary}</Text>
            </div>
        )
    }

    return (
        <CustomDialog
            title={`执行结果 - ${title}`}
            width={dialogWidth}
            okText='关闭'
            okClose={true}
            {...restProps}
        >
            <div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong>步骤名称：</Text>
                    <Text>{title}</Text>
                </div>
                {step && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>执行类型：</Text>
                        <Tag color={step.is_auto ? 'blue' : 'orange'}>
                            {step.is_auto ? '自动执行' : '手动执行'}
                        </Tag>
                    </div>
                )}
                {step?.create_time && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>开始时间：</Text>
                        <Text>
                            {dayjs(step.create_time).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                    </div>
                )}
                {step?.end_time && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>结束时间：</Text>
                        <Text>
                            {dayjs(step.end_time).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                    </div>
                )}
                <div>
                    <Text strong>执行结果：</Text>
                    {renderResultContent()}
                </div>
            </div>
        </CustomDialog>
    )
}

export default QCResultDialog

