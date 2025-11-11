import type { ExecutionLogItem, ExecutionLogPageResponse } from '@/types'
import dayjs from 'dayjs'

/**
 * 节点类型配置
 */
const NODE_TYPES = [
    'dataLoad',
    'DataCleansing',
    'dataDedupe',
    'typeConvert',
    'standardMap',
    'empiDistribute',
    'emoiDistribute',
    'dataUnify',
    'orphanDrop',
    'dataDesensitize',
] as const

/**
 * 任务名称配置
 */
const TASK_NAMES = [
    '患者基础信息数据清洗',
    '医嘱数据去重处理',
    '检验结果类型转换',
    '诊断编码标准对照',
    'EMPI患者主索引发放',
    'EMOI医疗机构对象标识发放',
    '药品信息数据归一',
    '孤儿数据清理',
    '敏感信息脱敏处理',
    '手术记录数据清洗',
    '护理记录去重',
    '影像报告类型转换',
    '疾病编码标准化',
    '科室信息归一化',
    '医生信息脱敏',
] as const

/**
 * 生成随机执行状态
 * 0: 成功, 1: 失败, 2: 进行中
 */
const generateRandomStatus = (): number => {
    const weights = [0.7, 0.2, 0.1] // 70%成功, 20%失败, 10%进行中
    const random = Math.random()

    if (random < weights[0]) return 0 // 成功
    if (random < weights[0] + weights[1]) return 1 // 失败
    return 2 // 进行中
}

/**
 * 生成随机时间
 */
const generateRandomTime = (baseTime: dayjs.Dayjs, offsetMinutes: number): string => {
    return baseTime.subtract(offsetMinutes, 'minute').format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 生成单条执行日志记录
 */
const generateExecutionLogItem = (id: number, batchId: number): ExecutionLogItem => {
    const status = generateRandomStatus()
    const nodeType = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)]
    const taskName = TASK_NAMES[Math.floor(Math.random() * TASK_NAMES.length)]

    // 生成时间 - 最近7天内的随机时间
    const now = dayjs()
    const startOffset = Math.floor(Math.random() * 7 * 24 * 60) // 7天内的随机分钟数
    const startTime = generateRandomTime(now, startOffset)

    // 结束时间 - 如果不是进行中状态，则有结束时间
    let endTime: string | undefined
    if (status !== 2) {
        const duration = Math.floor(Math.random() * 120) + 5 // 5-125分钟的执行时长
        endTime = dayjs(startTime).add(duration, 'minute').format('YYYY-MM-DD HH:mm:ss')
    }

    return {
        id,
        batch_id: batchId,
        name: taskName,
        status,
        start_time: startTime,
        end_time: endTime,
        node_type: nodeType,
    }
}

/**
 * 生成执行历史模拟数据
 * @param count 生成数据条数，默认50条
 * @returns ExecutionLogItem数组
 */
export const generateMockExecutionHistory = (count: number = 50): ExecutionLogItem[] => {
    const mockData: ExecutionLogItem[] = []

    // 生成不同批次的数据
    const batchCount = Math.ceil(count / 10) // 每批次大约10条记录
    let currentId = 1

    for (let batchIndex = 1; batchIndex <= batchCount; batchIndex++) {
        const batchId = 1000 + batchIndex
        const itemsInBatch = Math.min(10, count - mockData.length)

        for (let i = 0; i < itemsInBatch; i++) {
            mockData.push(generateExecutionLogItem(currentId++, batchId))
        }
    }

    // 按开始时间倒序排列（最新的在前面）
    return mockData.sort((a, b) => dayjs(b.start_time).unix() - dayjs(a.start_time).unix())
}

/**
 * 模拟API响应格式
 */
export const getMockExecutionHistoryResponse = (
    totalCount: number = 50,
    pageNo: number = 1,
    pageSize: number = 10
): ExecutionLogPageResponse => {
    const all = generateMockExecutionHistory(totalCount)
    const startIndex = (pageNo - 1) * pageSize
    const endIndex = startIndex + pageSize
    const list = all.slice(startIndex, endIndex)
    return {
        code: 200,
        msg: '操作成功',
        data: {
            total: totalCount,
            list,
        },
    }
}

/**
 * 模拟API调用延迟
 */
export const mockApiDelay = (ms: number = 500): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
