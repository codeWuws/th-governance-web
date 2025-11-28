import type { HistoryItem } from '../ExecutionHistory'

/**
 * 生成数据质量控制历史记录的模拟数据
 * @param count 生成记录数量，默认 20 条
 * @returns HistoryItem[] 历史记录数组
 */
export function generateMockExecutionHistory(count: number = 20): HistoryItem[] {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneHour = 60 * 60 * 1000
    const oneMinute = 60 * 1000

    // 质控类型选项
    const allTypes = ['text', 'comprehensive', 'completeness', 'basic-medical-logic', 'core-data']
    
    // 状态选项及其概率
    const statusOptions: Array<{
        status: HistoryItem['status']
        weight: number
    }> = [
        { status: 'completed', weight: 60 },
        { status: 'running', weight: 15 },
        { status: 'error', weight: 10 },
        { status: 'starting', weight: 10 },
        { status: 'cancelled', weight: 5 },
    ]

    // 根据权重随机选择状态
    const pickStatus = (): HistoryItem['status'] => {
        const totalWeight = statusOptions.reduce((sum, opt) => sum + opt.weight, 0)
        let random = Math.random() * totalWeight
        for (const opt of statusOptions) {
            random -= opt.weight
            if (random <= 0) return opt.status
        }
        return 'completed'
    }

    // 随机选择质控类型（1-3个）
    const pickTypes = (): string[] => {
        const count = Math.floor(Math.random() * 3) + 1 // 1-3个类型
        const shuffled = [...allTypes].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }

    // 生成随机时间戳（过去30天内）
    const generateTimeRange = (daysAgo: number) => {
        const startTime = now - daysAgo * oneDay - Math.random() * oneDay
        const duration = Math.random() * 2 * oneHour + 5 * oneMinute // 5分钟到2小时
        const endTime = startTime + duration
        return { startTime, endTime }
    }

    const records: HistoryItem[] = []

    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 30) // 过去30天内
        const status = pickStatus()
        const types = pickTypes()
        const { startTime, endTime } = generateTimeRange(daysAgo)

        // 根据状态决定结束时间
        let finalEndTime: number | null = null
        if (status === 'completed') {
            finalEndTime = endTime
        } else if (status === 'error' || status === 'cancelled') {
            // 错误或取消的任务也有结束时间，但可能更短
            finalEndTime = startTime + Math.random() * 30 * oneMinute
        }
        // starting 和 running 状态没有结束时间

        // 生成任务ID（格式：QC-YYYYMMDD-HHMMSS-序号）
        const startDate = new Date(startTime)
        const year = startDate.getFullYear()
        const month = String(startDate.getMonth() + 1).padStart(2, '0')
        const day = String(startDate.getDate()).padStart(2, '0')
        const hours = String(startDate.getHours()).padStart(2, '0')
        const minutes = String(startDate.getMinutes()).padStart(2, '0')
        const seconds = String(startDate.getSeconds()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        const timeStr = `${hours}${minutes}${seconds}`
        const id = `QC-${dateStr}-${timeStr}-${String(i + 1).padStart(3, '0')}`

        records.push({
            id,
            types,
            status,
            start_time: startTime,
            end_time: finalEndTime,
        })
    }

    // 按开始时间倒序排列（最新的在前）
    return records.sort((a, b) => b.start_time - a.start_time)
}

