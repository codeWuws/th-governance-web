/**
 * 可控制的 Promise 类型
 * 既是 Promise，又包含 resolve 和 reject 方法
 */
export interface DeferredPromise<T = void> extends Promise<T> {
    /** 使 Promise 成功，并返回结果 */
    resolve: (value: T) => void
    /** 使 Promise 失败，并返回错误原因 */
    reject: (reason?: any) => void
}

/**
 * 创建一个可控制的 Promise（Deferred Promise）
 * 
 * 返回一个 Promise，可以直接 await，同时包含 resolve 和 reject 方法
 * 
 * @returns DeferredPromise，既是 Promise 又有 resolve/reject 方法
 * 
 * @example
 * ```typescript
 * // 基础用法
 * const task = createDeferred<string>()
 * 
 * // 直接 await
 * task.then(result => {
 *   console.log('任务成功:', result)
 * })
 * 
 * // 在另一个地方控制成功
 * setTimeout(() => {
 *   task.resolve('任务完成')
 * }, 1000)
 * ```
 * 
 * @example
 * ```typescript
 * // 在 async/await 中使用
 * const task = createDeferred<number>()
 * 
 * async function handleTask() {
 *   try {
 *     const result = await task
 *     console.log('结果:', result)
 *   } catch (error) {
 *     console.error('错误:', error)
 *   }
 * }
 * 
 * // 3秒后完成任务
 * setTimeout(() => {
 *   task.resolve(42)
 * }, 3000)
 * 
 * handleTask()
 * ```
 * 
 * @example
 * ```typescript
 * // 在用户交互中使用
 * const confirmTask = createDeferred<boolean>()
 * 
 * // 显示确认对话框
 * showDialog(ConfirmDialog, {
 *   onOk: () => confirmTask.resolve(true),
 *   onCancel: () => confirmTask.resolve(false)
 * })
 * 
 * // 等待用户选择
 * const userChoice = await confirmTask
 * if (userChoice) {
 *   // 用户确认了
 * }
 * ```
 */
export function createDeferred<T = void>(): DeferredPromise<T> {
    let resolve: (value: T) => void
    let reject: (reason?: any) => void

    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    }) as DeferredPromise<T>

    promise.resolve = resolve!
    promise.reject = reject!

    return promise
}

