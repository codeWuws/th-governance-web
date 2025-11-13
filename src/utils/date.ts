/**
 * 日期工具函数
 */

/**
 * 格式化日期
 * @param date - 日期字符串或Date对象
 * @param format - 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
        return '-'
    }

    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
}

/**
 * 获取相对时间
 * @param date - 日期字符串或Date对象
 * @returns 相对时间描述（如：刚刚、5分钟前、1小时前等）
 */
export const getRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()

    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24
    const month = day * 30
    const year = day * 365

    if (diff < 0) {
        return '未来时间'
    }

    if (diff < minute) {
        return '刚刚'
    } else if (diff < hour) {
        const minutes = Math.floor(diff / minute)
        return `${minutes}分钟前`
    } else if (diff < day) {
        const hours = Math.floor(diff / hour)
        return `${hours}小时前`
    } else if (diff < month) {
        const days = Math.floor(diff / day)
        return `${days}天前`
    } else if (diff < year) {
        const months = Math.floor(diff / month)
        return `${months}个月前`
    } else {
        const years = Math.floor(diff / year)
        return `${years}年前`
    }
}

/**
 * 检查日期是否有效
 * @param date - 日期字符串或Date对象
 * @returns 是否有效日期
 */
export const isValidDate = (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return !isNaN(dateObj.getTime())
}

/**
 * 获取当前时间戳（毫秒）
 * @returns 当前时间戳
 */
export const getCurrentTimestamp = (): number => {
    return Date.now()
}

/**
 * 将时间戳转换为日期字符串
 * @param timestamp - 时间戳（毫秒）
 * @param format - 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const timestampToDate = (
    timestamp: number,
    format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
    return formatDate(new Date(timestamp), format)
}
