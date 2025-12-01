import {
    BookOutlined,
    ClearOutlined,
    CopyOutlined,
    DeleteOutlined,
    EyeInvisibleOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    SwapOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Spin, Switch, Typography } from 'antd'
import uiMessage from '@/utils/uiMessage'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounceCallback } from '../../hooks/useDebounce'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
    fetchWorkflowConfig,
    updateWorkflowConfig,
    updateWorkflowConfigLocal,
} from '../../store/slices/dataGovernanceSlice'
import type { DbConnection, WorkflowConfigUpdateItem } from '../../types'
import { dataGovernanceService } from '../../services/dataGovernanceService'
import { logger } from '../../utils/logger'
import { startWorkflow } from '../../utils/workflowUtils'
import { showDialog } from '@/utils/showDialog'
import CustomDialog from '@/components/CustomDialog'

const { Title } = Typography
const { Option } = Select

// 节点类型到图标的映射
const nodeTypeIconMap: Record<string, React.ReactElement> = {
    dataAccess: <UnorderedListOutlined />,
    StandardMapping: <BookOutlined />,
    DataCleansing: <ClearOutlined />,
    DataTransform: <SwapOutlined />,
    dataTransform: <SwapOutlined />, // 兼容小写
    DataDeduplication: <DeleteOutlined />,
    EMPIDefinitionDistribution: <CopyOutlined />,
    EMOIDefinitionDistribution: <CopyOutlined />,
    DataStandardization: <BookOutlined />,
    DataDesensitization: <EyeInvisibleOutlined />,
    DataOrphan: <BookOutlined />,
    dataLoad: <UnorderedListOutlined />,
}

/**
 * 工作流步骤页面
 * 提供工作流执行步骤的配置和管理
 */
const WorkflowConfig: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    // Redux 状态管理
    // 由于不再维护 currentExecution，可以通过其他方式判断执行状态
    // 例如通过 workflowLoading 或消息列表来判断

    // 从Redux获取状态
    const {
        workflowConfig: steps,
        workflowLoading,
        error: _error,
    } = useAppSelector(state => state.dataGovernance)

    // 用于收集待更新的配置项
    const pendingUpdatesRef = useRef<Map<number, WorkflowConfigUpdateItem>>(new Map())

    // 数据源选择弹窗相关状态
    const [isDataSourceModalVisible, setIsDataSourceModalVisible] = useState(false)
    const [dataSourceList, setDataSourceList] = useState<DbConnection[]>([])
    const [loadingDataSources, setLoadingDataSources] = useState(false)
    const [dataSourceForm] = Form.useForm()

    // 批量更新工作流配置
    const updateWorkflowConfigs = useCallback(async () => {
        const updates = Array.from(pendingUpdatesRef.current.values())
        if (updates.length === 0) return

        try {
            // 显示保存中的toast提示
            const loadingKey = uiMessage.loading('正在保存配置...', 0)

            // 使用Redux action进行更新
            await dispatch(updateWorkflowConfig(updates)).unwrap()

            // 隐藏loading提示
            uiMessage.destroy(loadingKey)
            uiMessage.success(`成功更新 ${updates.length} 个配置项`)

            // 清空待更新列表
            pendingUpdatesRef.current.clear()
        } catch (error: unknown) {
            logger.error(
                '更新工作流配置失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            const errorMessage =
                error instanceof Error ? error.message : '更新工作流配置失败，请稍后重试'
            uiMessage.error(errorMessage)
        }
    }, [dispatch])

    // 使用防抖机制，避免频繁更新
    const debouncedUpdate = useDebounceCallback(updateWorkflowConfigs, 300)

    /**
     * 添加待更新的配置项
     */
    const addPendingUpdate = useCallback(
        (stepId: number, enabled: boolean, isAuto: boolean) => {
            pendingUpdatesRef.current.set(stepId, {
                id: stepId,
                enabled,
                is_auto: isAuto,
            })

            // 触发防抖更新
            debouncedUpdate()
        },
        [debouncedUpdate]
    )

    /**
     * 处理步骤启用状态变更
     */
    const handleStepEnabledChange = useCallback(
        (stepId: number, enabled: boolean) => {
            // 先更新本地Redux状态
            dispatch(updateWorkflowConfigLocal({ id: stepId, enabled }))

            // 获取当前步骤的isAuto状态
            const currentStep = steps.find(step => step.id === stepId)
            const isAuto = enabled ? currentStep?.isAuto || false : false

            // 添加到待更新列表
            addPendingUpdate(stepId, enabled, isAuto)
        },
        [dispatch, steps, addPendingUpdate]
    )
    /**
     * 处理自动化流转开关变更
     */
    const handleAutoFlowChange = useCallback(
        (stepId: number, isAuto: boolean) => {
            // 先更新本地Redux状态
            dispatch(updateWorkflowConfigLocal({ id: stepId, isAuto }))

            // 获取当前步骤的enabled状态
            const currentStep = steps.find(step => step.id === stepId)
            const enabled = currentStep?.enabled || false

            // 添加到待更新列表
            addPendingUpdate(stepId, enabled, isAuto)
        },
        [dispatch, steps, addPendingUpdate]
    )

    /**
     * 页面初始化
     */
    useEffect(() => {
        dispatch(fetchWorkflowConfig())
    }, [dispatch])

    /**
     * 获取数据源列表
     */
    const fetchDataSourceList = useCallback(async () => {
        try {
            setLoadingDataSources(true)
            // 获取所有数据源，使用较大的 pageSize 来获取全部数据
            const result = await dataGovernanceService.getDbConnectionPage({
                pageNo: 1,
                pageSize: 1000, // 假设不超过1000个数据源
            })

            if (result.code === 200) {
                setDataSourceList(result.data.list || [])
            } else {
                uiMessage.error(result.msg || '获取数据源列表失败')
            }
        } catch (error) {
            logger.error(
                '获取数据源列表失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('获取数据源列表失败')
        } finally {
            setLoadingDataSources(false)
        }
    }, [])

    /**
     * 打开数据源选择弹窗
     */
    const handleOpenDataSourceModal = useCallback(async () => {
        setIsDataSourceModalVisible(true)
        dataSourceForm.resetFields()
        // 如果数据源列表为空，则获取数据源列表
        if (dataSourceList.length === 0) {
            await fetchDataSourceList()
        }
    }, [dataSourceForm, dataSourceList.length, fetchDataSourceList])

    /**
     * 确认选择数据源并启动工作流
     */
    const handleConfirmDataSourceAndStart = useCallback(async () => {
        try {
            const values = await dataSourceForm.validateFields()
            const { workflowName, dataSource, targetSource } = values

            // 将字符串ID转换为数字
            const sourceDbId = Number(dataSource)
            const targetDbId = Number(targetSource)

            // 验证ID转换是否成功
            if (isNaN(sourceDbId) || isNaN(targetDbId)) {
                uiMessage.error('数据源ID或目标源ID无效')
                return
            }

            logger.debug('工作流配置页面 - 开始启动工作流...', {
                workflowName,
                sourceDbId,
                targetDbId,
            })

            // 关闭弹窗
            setIsDataSourceModalVisible(false)

            // 使用工作流工具函数启动工作流
            const success = await startWorkflow({
                sourceDbId,
                targetDbId,
                taskFlowName: workflowName,
                onSuccess: taskId => {
                    logger.debug('工作流启动成功，任务ID:', taskId)
                    uiMessage.success('工作流启动成功！')
                },
                onError: error => {
                    uiMessage.error(`工作流启动失败: ${error}`)
                },
                onMessage: msg => {
                    logger.debug('收到工作流消息:', msg)
                },
                onOpen: taskId => {
                    navigate(`/data-governance/workflow/${taskId}`)
                },
            })

            if (!success) {
                logger.warn('工作流启动失败')
                uiMessage.error('工作流启动失败，请稍后重试')
            }
        } catch (error) {
            // 如果是表单验证错误，不处理
            if (error && typeof error === 'object' && 'errorFields' in error) {
                return
            }
            logger.error(
                '启动工作流时发生异常',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('启动工作流时发生异常，请稍后重试')
        }
    }, [dataSourceForm, navigate])

    /**
     * 启动工作流（打开数据源选择弹窗）
     */
    const handleStartWorkflow = useCallback(() => {
        handleOpenDataSourceModal()
    }, [handleOpenDataSourceModal])

    // 如果正在加载初始数据，显示加载状态
    if (workflowLoading && steps.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                }}
            >
                <Spin size='large' tip='正在加载工作流配置...' />
            </div>
        )
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
                    <SettingOutlined style={{ marginRight: 8 }} />
                    工作流步骤
                </Title>

                {/* 操作按钮 */}
                <Space>
                    <Button
                        type='primary'
                        icon={<PlayCircleOutlined />}
                        onClick={handleStartWorkflow}
                    >
                        启动工作流
                    </Button>
                </Space>
            </div>

            {/* 信息提示 */}
            <Alert
                message='工作流步骤配置'
                description='配置数据治理工作流的执行步骤，每个步骤可以独立启用或禁用，并设置是否自动流转到下一步骤。配置更改将自动保存。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            {/* 工作流步骤卡片 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {steps.map((step, _index) => (
                    <Card
                        key={step.id}
                        style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e8e8e8',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s ease',
                            opacity: step.enabled ? 1 : 0.7,
                        }}
                        styles={{
                            body: {
                                padding: '20px',
                            },
                        }}
                        hoverable
                    >
                        {/* 第一行：序号、图标、标题、启用开关 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flex: 1,
                                }}
                            >
                                {/* 步骤序号 */}
                                <div
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: step.enabled ? '#1890ff' : '#d9d9d9',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    {step.nodeStep}
                                </div>

                                {/* 图标 */}
                                <div
                                    style={{
                                        fontSize: '20px',
                                        color: step.enabled ? '#1890ff' : '#bfbfbf',
                                    }}
                                >
                                    {nodeTypeIconMap[step.nodeType] || <SettingOutlined />}
                                </div>

                                {/* 标题 */}
                                <div>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            color: step.enabled ? '#262626' : '#8c8c8c',
                                        }}
                                    >
                                        {step.nodeName}
                                    </h3>
                                </div>
                            </div>

                            {/* 启用开关 */}
                            <Switch
                                checked={step.enabled}
                                loading={workflowLoading}
                                onChange={checked => handleStepEnabledChange(step.id, checked)}
                            />
                        </div>

                        {/* 第二行：描述和自动化流转开关 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: '16px',
                                paddingLeft: '40px',
                            }}
                        >
                            {/* 描述 */}
                            <div
                                style={{
                                    flex: 1,
                                    lineHeight: '1.6',
                                    fontSize: '14px',
                                    color: step.enabled ? '#595959' : '#8c8c8c',
                                }}
                            >
                                {step.descript}
                            </div>

                            {/* 自动化流转开关 */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexShrink: 0,
                                    padding: '4px 8px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '4px',
                                    border: '1px solid #f0f0f0',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '12px',
                                        color: step.enabled ? '#595959' : '#bfbfbf',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    自动流转
                                </span>
                                <Switch
                                    size='small'
                                    checked={step.isAuto}
                                    loading={workflowLoading}
                                    onChange={checked => handleAutoFlowChange(step.id, checked)}
                                    disabled={!step.enabled}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* 数据源选择弹窗 */}
            <Modal
                title='选择数据源'
                open={isDataSourceModalVisible}
                onOk={handleConfirmDataSourceAndStart}
                onCancel={() => {
                    setIsDataSourceModalVisible(false)
                    dataSourceForm.resetFields()
                }}
                okText='确定'
                cancelText='取消'
                width={600}
            >
                <Form form={dataSourceForm} layout='vertical'>
                    <Form.Item
                        name='workflowName'
                        label='任务流名称'
                        rules={[{ required: true, message: '请输入任务流名称' }]}
                    >
                        <Input placeholder='请输入任务流名称' maxLength={100} showCount />
                    </Form.Item>

                    <Form.Item
                        name='dataSource'
                        label='数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select
                            placeholder='请选择数据源'
                            loading={loadingDataSources}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? option?.children ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {dataSourceList.map(connection => (
                                <Option key={connection.id} value={connection.id}>
                                    {connection.connectionName} ({connection.dbType} -{' '}
                                    {connection.dbName})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='targetSource'
                        label='目标源'
                        rules={[{ required: true, message: '请选择目标源' }]}
                    >
                        <Select
                            placeholder='请选择目标源'
                            loading={loadingDataSources}
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? option?.children ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {dataSourceList.map(connection => (
                                <Option key={connection.id} value={connection.id}>
                                    {connection.connectionName} ({connection.dbType} -{' '}
                                    {connection.dbName})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default WorkflowConfig
