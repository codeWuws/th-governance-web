import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { store } from '@/store'

// 存储已挂载的弹窗实例
interface DialogInstance {
    root: Root
    container: HTMLDivElement
    resolve: (value: boolean) => void
    reject: (reason?: any) => void
    promise: Promise<boolean>
}

// 使用 Map 存储弹窗实例，key 为唯一 ID
const dialogInstances = new Map<string, DialogInstance>()

// 存储没有唯一 ID 的弹窗实例（用于清理）
const anonymousInstances = new Set<DialogInstance>()

// 默认容器 ID
const DEFAULT_CONTAINER_ID = 'custom-dialog-container'

/**
 * 创建或获取容器元素
 */
function getOrCreateContainer(id?: string): HTMLDivElement {
    const containerId = id || DEFAULT_CONTAINER_ID
    let container = document.getElementById(containerId) as HTMLDivElement

    if (!container) {
        container = document.createElement('div')
        container.id = containerId
        document.body.appendChild(container)
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
 * 排除 open、forceClose、onOk、onCancel、onClose，因为这些由 showDialog 内部管理
 */
export type ShowDialogProps<T extends CustomDialogProps = CustomDialogProps> = Omit<T, 'open' | 'forceClose' | 'onOk' | 'onCancel' | 'onClose'> & {
    onOk?: (e: React.MouseEvent<HTMLElement>) => void | Promise<void>
    onCancel?: (e: React.MouseEvent<HTMLElement>) => void
    onClose?: () => void
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

    // 创建容器
    const container = getOrCreateContainer(finalUniqueId)
    const root = createRoot(container)

    // 先创建实例对象（但先不存储到 Map 中）
    const instance: DialogInstance = {
        root,
        container,
        resolve: promiseResolve!,
        reject: promiseReject!,
        promise,
    }

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
            // 如果 onOk 没有抛出错误，则关闭弹窗并 resolve(true)
            handleClose(true)
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
        handleClose(false)
    }

    // 处理关闭事件
    const handleClose = (result: boolean) => {
        console.log(`🔒 [showDialog] 关闭弹窗，结果: ${result ? '确认' : '取消'}`)
        // 执行用户传入的 onClose
        if (props.onClose) {
            props.onClose()
        }

        // 更新弹窗状态为关闭（通过 forceClose 来触发关闭）
        root.render(
            <Provider store={store}>
                <ConfigProvider locale={zhCN}>
                    <DialogComponent
                        {...(props as any)}
                        forceClose={true}
                        onOk={handleOk}
                        onCancel={handleCancel}
                        onClose={() => {
                            destroyDialog(instance, finalUniqueId)
                            console.log(`✨ [showDialog] Promise resolved，返回值: ${result}`)
                            promiseResolve!(result)
                        }}
                    />
                </ConfigProvider>
            </Provider>
        )
    }

    if (finalUniqueId) {
        dialogInstances.set(finalUniqueId, instance)
    } else {
        anonymousInstances.add(instance)
    }

    // 渲染弹窗
    root.render(
        <Provider store={store}>
            <ConfigProvider locale={zhCN}>
                <DialogComponent
                    {...(props as any)}
                    forceClose={false}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    onClose={() => handleClose(false)}
                />
            </ConfigProvider>
        </Provider>
    )

    return promise
}

/**
 * 关闭指定 ID 的弹窗
 * @param id - 弹窗的唯一 ID
 */
export function closeDialog(id: string) {
    const instance = dialogInstances.get(id)
    if (instance) {
        instance.root.render(
            <Provider store={store}>
                <ConfigProvider locale={zhCN}>
                    <CustomDialog
                        forceClose={true}
                        onClose={() => {
                            destroyDialog(instance, id)
                            instance.resolve(false)
                        }}
                    />
                </ConfigProvider>
            </Provider>
        )
    }
}

/**
 * 关闭所有弹窗
 */
export function closeAllDialogs() {
    dialogInstances.forEach((instance, id) => {
        instance.root.render(
            <Provider store={store}>
                <ConfigProvider locale={zhCN}>
                    <CustomDialog
                        forceClose={true}
                        onClose={() => {
                            destroyDialog(instance, id)
                            instance.resolve(false)
                        }}
                    />
                </ConfigProvider>
            </Provider>
        )
    })
    anonymousInstances.forEach((instance) => {
        instance.root.render(
            <Provider store={store}>
                <ConfigProvider locale={zhCN}>
                    <CustomDialog
                        forceClose={true}
                        onClose={() => {
                            destroyDialog(instance)
                            instance.resolve(false)
                        }}
                    />
                </ConfigProvider>
            </Provider>
        )
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

