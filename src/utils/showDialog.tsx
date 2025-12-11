import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'

// 存储已挂载的弹窗实例
interface DialogInstance {
    root: Root
    container: HTMLDivElement
    resolve: (value: boolean) => void
    reject: (reason?: any) => void
    promise: Promise<boolean>
    close: () => void // 关闭弹窗的函数
}

// 使用 Map 存储弹窗实例，key 为唯一 ID
const dialogInstances = new Map<string, DialogInstance>()

// 存储没有唯一 ID 的弹窗实例（用于清理）
const anonymousInstances = new Set<DialogInstance>()

// 默认容器 ID
const DEFAULT_CONTAINER_ID = 'custom-dialog-container'

/**
 * 创建或获取容器元素
 * 如果容器已存在且有对应的实例，返回该容器
 * 如果容器已存在但没有对应的实例，清理容器内容后返回
 */
function getOrCreateContainer(id?: string): HTMLDivElement {
    const containerId = id || DEFAULT_CONTAINER_ID
    let container = document.getElementById(containerId) as HTMLDivElement

    if (!container) {
        // 容器不存在，创建新容器
        container = document.createElement('div')
        container.id = containerId
        document.body.appendChild(container)
    } else {
        // 容器已存在，检查是否有对应的实例
        const hasInstance = id ? dialogInstances.has(id) : false
        const hasRoot = (container as any)._reactRootContainer !== undefined
        
        // 如果容器有 root 但没有对应的实例，说明是残留的，需要清理
        if (hasRoot && !hasInstance) {
            console.warn(`⚠️ [getOrCreateContainer] Container "${containerId}" has root but no instance, cleaning container`)
            // 清理容器内容，但保留容器本身
            // 注意：这不会卸载 React root，但可以避免 DOM 冲突
            try {
                container.innerHTML = ''
                // 清除可能的 root 引用（虽然 React 内部管理，但我们可以尝试）
                delete (container as any)._reactRootContainer
            } catch (e) {
                console.error('Error cleaning container:', e)
                // 如果清理失败，创建新容器
                const newContainerId = `${containerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                container = document.createElement('div')
                container.id = newContainerId
                document.body.appendChild(container)
            }
        }
    }

    return container
}

/**
 * 销毁弹窗实例
 */
function destroyDialog(instance: DialogInstance, id?: string) {
    // 延迟卸载，确保动画完成
    setTimeout(() => {
        instance.root.unmount()
        if (instance.container.parentNode) {
            instance.container.parentNode.removeChild(instance.container)
        }
        if (id) {
            dialogInstances.delete(id)
        } else {
            anonymousInstances.delete(instance)
        }
    }, 300) // Modal 默认动画时长
}

/**
 * showDialog 的 props 类型
 * 排除 open、onOk、onCancel、onClose，因为这些由 showDialog 内部管理
 */
export type ShowDialogProps<T extends CustomDialogProps = CustomDialogProps> = Omit<T, 'open' | 'onOk' | 'onCancel' | 'onClose'> & {
    onOk?: (e: React.MouseEvent<HTMLElement>) => void | Promise<void>
    onCancel?: (e: React.MouseEvent<HTMLElement>) => void
    onClose?: () => void
    /** 点击确定按钮后是否关闭弹窗，默认为 true */
    okClose?: boolean
    /** 点击取消按钮后是否关闭弹窗，默认为 true */
    cancelClose?: boolean
}

/**
 * 显示弹窗函数（重载1：简洁写法，使用默认 CustomDialog）
 * 
 * @param props - 传入对话框的 props
 * @returns Promise<boolean> - 返回 true 表示点击了确定，false 表示取消或关闭
 * 
 * @example
 * ```tsx
 * // 简洁写法
 * const isConfirm = await showDialog({
 *   title: "确认操作",
 *   children: <p>确定要执行此操作吗？</p>
 * })
 * 
 * if (isConfirm) {
 *   console.log('用户确认了')
 * }
 * ```
 */
export function showDialog(props: ShowDialogProps<CustomDialogProps>): Promise<boolean>

/**
 * 显示弹窗函数（重载2：使用自定义组件）
 * 
 * @param DialogComponent - CustomDialog 组件或自定义对话框组件
 * @param props - 传入对话框的 props
 * @param uniqueId - 可选，唯一 ID
 * @returns Promise<boolean> - 返回 true 表示点击了确定，false 表示取消或关闭
 * 
 * @example
 * ```tsx
 * // 使用自定义组件
 * const result = await showDialog(WorkFlowDialog, {
 *   title: "123",
 *   onOk: async () => {
 *     await someAsyncOperation()
 *   }
 * })
 * ```
 */
export function showDialog<T extends CustomDialogProps = CustomDialogProps>(
    DialogComponent: React.ComponentType<T>,
    props: ShowDialogProps<T>,
    uniqueId?: string
): Promise<boolean>

/**
 * 显示弹窗函数实现
 * 
 * 支持 async/await 来等待弹窗执行结束
 * 
 * @returns Promise<boolean> - 返回 true 表示点击了确定，false 表示取消或关闭
 */
export function showDialog<T extends CustomDialogProps = CustomDialogProps>(
    DialogComponentOrProps: React.ComponentType<T> | ShowDialogProps<CustomDialogProps>,
    propsOrUniqueId?: ShowDialogProps<T> | string,
    uniqueId?: string
): Promise<boolean> {
    // 判断是重载1（简洁写法）还是重载2（自定义组件）
    let DialogComponent: React.ComponentType<any>
    let props: ShowDialogProps<any>
    let finalUniqueId: string | undefined

    if (typeof DialogComponentOrProps === 'function') {
        // 重载2：showDialog(Component, props, uniqueId?)
        DialogComponent = DialogComponentOrProps
        props = propsOrUniqueId as ShowDialogProps<T>
        finalUniqueId = uniqueId
    } else {
        // 重载1：showDialog(props) 或 showDialog(props, uniqueId)
        DialogComponent = CustomDialog
        props = DialogComponentOrProps as ShowDialogProps<CustomDialogProps>
        // 如果第二个参数是字符串，说明是 uniqueId
        finalUniqueId = typeof propsOrUniqueId === 'string' ? propsOrUniqueId : undefined
    }

    console.log('🚀 [showDialog] 显示弹窗', {
        isDefaultDialog: DialogComponent === CustomDialog,
        hasUniqueId: !!finalUniqueId,
        title: props.title,
    })

    // 如果提供了唯一 ID 且已存在，则返回已存在的 Promise
    if (finalUniqueId && dialogInstances.has(finalUniqueId)) {
        console.warn(`⚠️ [showDialog] Dialog with id "${finalUniqueId}" already exists, returning existing promise`)
        return dialogInstances.get(finalUniqueId)!.promise
    }

    let promiseResolve: (value: boolean) => void
    let promiseReject: (reason?: any) => void

    const promise = new Promise<boolean>((resolve, reject) => {
        promiseResolve = resolve
        promiseReject = reject
    })

    // 为没有 uniqueId 的弹窗生成唯一的容器 ID，避免冲突
    let containerId = finalUniqueId
    if (!containerId) {
        // 为匿名实例生成唯一的容器 ID
        containerId = `dialog-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // 创建容器
    let container = getOrCreateContainer(containerId)
    
    // 检查容器是否已经有 root，如果有则创建新容器
    const hasExistingRoot = (container as any)._reactRootContainer !== undefined
    if (hasExistingRoot) {
        console.warn('⚠️ [showDialog] Container has existing root, creating new container')
        // 创建全新的容器
        const newContainerId = `${containerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        container = document.createElement('div')
        container.id = newContainerId
        document.body.appendChild(container)
    }
    
    // 创建新的 root
    let root: Root
    try {
        root = createRoot(container)
    } catch (error) {
        // 如果创建 root 失败（不应该发生），抛出错误
        console.error('❌ [showDialog] Failed to create root:', error)
        throw new Error('Failed to create dialog root')
    }

    // 先创建实例对象（但先不存储到 Map 中）
    const instance: DialogInstance = {
        root,
        container,
        resolve: promiseResolve!,
        reject: promiseReject!,
        promise,
        close: () => {}, // 稍后设置
    }

    // 获取 okClose 和 cancelClose，默认为 true
    const okClose = props.okClose !== undefined ? props.okClose : true
    const cancelClose = props.cancelClose !== undefined ? props.cancelClose : true

    // 处理确定按钮
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        console.log('✅ [showDialog] 用户点击确定按钮')
        try {
            // 先执行用户传入的 onOk
            if (props.onOk) {
                console.log('⏳ [showDialog] 执行 onOk 回调...')
                await props.onOk(e)
                console.log('✅ [showDialog] onOk 回调执行完成')
            }
            // 根据 okClose 决定是否关闭弹窗
            if (okClose) {
                handleClose(true)
            }
        } catch (error) {
            // 如果 onOk 抛出错误，则 reject
            console.error('❌ [showDialog] onOk 回调抛出错误:', error)
            promiseReject!(error)
        }
    }

    // 处理取消按钮
    const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
        console.log('❌ [showDialog] 用户点击取消按钮')
        if (props.onCancel) {
            props.onCancel(e)
        }
        // 根据 cancelClose 决定是否关闭弹窗
        if (cancelClose) {
            handleClose(false)
        }
    }

    // 处理关闭事件
    const handleClose = (result: boolean) => {
        console.log(`🔒 [showDialog] 关闭弹窗，结果: ${result ? '确认' : '取消'}`)
        // 执行用户传入的 onClose
        if (props.onClose) {
            props.onClose()
        }

        // 更新弹窗状态为关闭（CustomDialog 内部会处理关闭逻辑）
        root.render(
            <DialogComponent
                {...(props as any)}
                okClose={okClose}
                cancelClose={cancelClose}
                onOk={handleOk}
                onCancel={handleCancel}
                onClose={() => {
                    destroyDialog(instance, finalUniqueId)
                    console.log(`✨ [showDialog] Promise resolved，返回值: ${result}`)
                    promiseResolve!(result)
                }}
            />
        )
    }

    // 设置关闭函数
    instance.close = () => handleClose(false)

    if (finalUniqueId) {
        dialogInstances.set(finalUniqueId, instance)
    } else {
        anonymousInstances.add(instance)
    }

    // 渲染弹窗（CustomDialog 内部使用 state 控制 open，不需要传 open prop）
    root.render(
        <DialogComponent
            {...(props as any)}
            okClose={okClose}
            cancelClose={cancelClose}
            onOk={handleOk}
            onCancel={handleCancel}
            onClose={() => handleClose(false)}
        />
    )

    return promise
}

/**
 * 关闭指定 ID 的弹窗
 * @param id - 弹窗的唯一 ID
 */
export function closeDialog(id: string) {
    const instance = dialogInstances.get(id)
    if (instance && instance.close) {
        instance.close()
    }
}

/**
 * 关闭所有弹窗
 */
export function closeAllDialogs() {
    dialogInstances.forEach((instance) => {
        if (instance.close) {
            instance.close()
        }
    })
    anonymousInstances.forEach((instance) => {
        if (instance.close) {
            instance.close()
        }
    })
}

/**
 * 检查指定 ID 的弹窗是否存在
 * @param id - 弹窗的唯一 ID
 * @returns 是否存在
 */
export function hasDialog(id: string): boolean {
    return dialogInstances.has(id)
}

