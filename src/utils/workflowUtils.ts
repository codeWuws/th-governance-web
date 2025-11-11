/**
 * 工作流工具函数
 * 提供独立的工作流操作函数，可在任何地方直接调用
 */

import {
    startWorkflow as serviceStartWorkflow,
    continueWorkflow as serviceContinueWorkflow,
    stopWorkflow as serviceStopWorkflow,
    resetWorkflow as serviceResetWorkflow,
    getWorkflowSSEStatus,
    type StartWorkflowConfig,
    type SSEConnectionState,
    subscribeWorkflow as serviceSubscribeWorkflow,
} from '../services/workflowExecutionService'

/**
 * 启动工作流
 *
 * @param enabledSteps 启用的工作流步骤
 * @param options 可选配置
 * @returns Promise<boolean> 是否启动成功
 *
 * @example
 * ```typescript
 * import { startWorkflow } from '@/utils/workflowUtils'
 *
 * // 基本用法
 * const success = await startWorkflow(enabledSteps)
 *
 * // 带回调的用法
 * const success = await startWorkflow(enabledSteps, {
 *   onSuccess: (taskId) => {
 *     console.log('工作流启动成功，任务ID:', taskId)
 *   },
 *   onError: (error) => {
 *     console.error('工作流启动失败:', error)
 *   },
 *   onMessage: (message) => {
 *     console.log('收到消息:', message)
 *   }
 * })
 *
 * ```
 */
export const startWorkflow = async (
    options?: Partial<Omit<StartWorkflowConfig, 'enabledSteps'>>
): Promise<boolean> => {
    const config: StartWorkflowConfig = {
        ...options,
    }

    return serviceStartWorkflow(config)
}

/**
 * 继续执行工作流
 *
 * @param taskId - 要继续执行的任务ID
 * @param options - 继续执行配置选项
 * @returns Promise<boolean> - 返回是否成功启动继续执行
 *
 * @example
 * ```typescript
 * import { continueWorkflow } from '@/utils/workflowUtils'
 *
 * const success = await continueWorkflow('task-123', {
 *   onSuccess: (taskId) => {
 *     console.log('工作流继续执行成功，任务ID:', taskId)
 *   },
 *   onError: (error) => {
 *     console.error('工作流继续执行失败:', error)
 *   },
 *   onMessage: (message) => {
 *     console.log('收到消息:', message)
 *   }
 * })
 *
 * ```
 */
export const continueWorkflow = async (
    taskId: string,
    options?: Partial<StartWorkflowConfig>
): Promise<boolean> => {
    const config: StartWorkflowConfig = {
        ...options,
    }

    return serviceContinueWorkflow(taskId, config)
}

/**
 * 停止当前工作流执行
 *
 * @example
 * ```typescript
 * import { stopWorkflow } from '@/utils/workflowUtils'
 *
 * stopWorkflow()
 * ```
 */
export const stopWorkflow = (): void => {
    serviceStopWorkflow()
}

/**
 * 重置工作流状态
 *
 * @example
 * ```typescript
 * import { resetWorkflow } from '@/utils/workflowUtils'
 *
 * resetWorkflow()
 * ```
 */
export const resetWorkflow = (): void => {
    serviceResetWorkflow()
}

/**
 * 获取工作流SSE连接状态
 *
 * @returns SSEConnectionState 连接状态信息
 *
 * @example
 * ```typescript
 * import { getSSEStatus } from '@/utils/workflowUtils'
 *
 * const status = getSSEStatus()
 * console.log('连接状态:', status.status)
 * console.log('连接管理器:', status.manager)
 * ```
 */
export const getSSEStatus = (): SSEConnectionState => {
    return getWorkflowSSEStatus()
}

/**
 * 快速启动工作流（使用默认配置）
 *
 * @param enabledSteps 启用的工作流步骤
 * @returns Promise<boolean> 是否启动成功
 *
 * @example
 * ```typescript
 * import { quickStartWorkflow } from '@/utils/workflowUtils'
 *
 * const success = await quickStartWorkflow(enabledSteps)
 * if (success) {
 *   console.log('工作流启动成功')
 * }
 * ```
 */
export const quickStartWorkflow = async (): Promise<boolean> => {
    return startWorkflow({})
}

/**
 * 启动工作流但不自动跳转
 *
 * @param enabledSteps 启用的工作流步骤
 * @param onSuccess 成功回调
 * @param onError 错误回调
 * @returns Promise<boolean> 是否启动成功
 *
 * @example
 * ```typescript
 * import { startWorkflowWithoutNavigation } from '@/utils/workflowUtils'
 *
 * const success = await startWorkflowWithoutNavigation(
 *   enabledSteps,
 *   (taskId) => console.log('任务ID:', taskId),
 *   (error) => console.error('错误:', error)
 * )
 * ```
 */
export const startWorkflowWithoutNavigation = async (
    onSuccess?: (taskId: string) => void,
    onError?: (error: string) => void
): Promise<boolean> => {
    return startWorkflow({
        onSuccess,
        onError,
    })
}

/**
 * 检查是否有工作流正在运行
 *
 * @returns boolean 是否有工作流正在运行
 *
 * @example
 * ```typescript
 * import { isWorkflowRunning } from '@/utils/workflowUtils'
 *
 * if (isWorkflowRunning()) {
 *   console.log('有工作流正在运行')
 * }
 * ```
 */
export const isWorkflowRunning = (): boolean => {
    const status = getSSEStatus()
    return status.status === 'connected' || status.status === 'connecting'
}

/**
 * 订阅指定任务的工作流事件（完成/关闭/错误）
 * 返回取消订阅函数
 *
 * @example
 * const unsubscribe = subscribeWorkflow('task-123', (evt) => {
 *   if (evt.type === 'completed') console.log('完成')
 * })
 * // 页面卸载时
 * unsubscribe()
 */
export const subscribeWorkflow = (
    taskId: string,
    callback: (event: { type: 'completed' | 'closed' | 'error'; taskId: string }) => void
): (() => void) => {
    return serviceSubscribeWorkflow(taskId, callback)
}

// 重新导出类型，方便使用
export type { StartWorkflowConfig, SSEConnectionState } from '../services/workflowExecutionService'
export type { WorkflowNode } from '../types'
