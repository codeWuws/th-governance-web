import * as XLSX from 'xlsx'
import { message } from 'antd'
import { uiMessage } from './uiMessage'

/**
 * Excel导出工具函数
 * 
 * @param data 要导出的数据数组
 * @param columns 列配置，包含title和dataIndex
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名称，默认为'Sheet1'
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: Array<{ title: string; dataIndex: string; key?: string }>,
    filename: string,
    sheetName: string = 'Sheet1'
) {
    try {
        // 准备表头
        const headers = columns.map(col => col.title)
        
        // 准备数据行
        const rows = data.map(item => {
            return columns.map(col => {
                const value = item[col.dataIndex] || item[col.key || '']
                // 处理特殊值
                if (value === null || value === undefined) {
                    return ''
                }
                // 如果是对象或数组，转换为字符串
                if (typeof value === 'object') {
                    return JSON.stringify(value)
                }
                return value
            })
        })
        
        // 创建工作簿
        const wb = XLSX.utils.book_new()
        
        // 创建工作表数据（包含表头）
        const wsData = [headers, ...rows]
        
        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        
        // 设置列宽（自动调整）
        const colWidths = columns.map(() => ({ wch: 15 }))
        ws['!cols'] = colWidths
        
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
        
        // 生成Excel文件并下载
        const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
        
        message.success('导出成功')
    } catch (error) {
        console.error('导出Excel失败:', error)
        uiMessage.handleSystemError('导出失败，请重试')
        throw error
    }
}

/**
 * Excel导入工具函数
 * 
 * @param file Excel文件
 * @param options 导入选项
 * @returns Promise<导入的数据数组>
 */
export function importFromExcel<T extends Record<string, any>>(
    file: File,
    options: {
        /** 列映射配置，key为Excel列名，value为数据字段名 */
        columnMapping: Record<string, string>
        /** 工作表名称，默认为第一个工作表 */
        sheetName?: string
        /** 是否跳过第一行（表头），默认为true */
        skipFirstRow?: boolean
        /** 数据验证函数，返回false表示跳过该行 */
        validateRow?: (row: any, index: number) => boolean
        /** 数据转换函数，可以对每行数据进行转换 */
        transformRow?: (row: any, index: number) => T
    }
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const {
            columnMapping,
            sheetName,
            skipFirstRow = true,
            validateRow,
            transformRow,
        } = options

        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                if (!data) {
                    reject(new Error('文件读取失败'))
                    return
                }

                // 解析Excel文件
                const workbook = XLSX.read(data, { type: 'binary' })

                // 获取工作表
                const sheet = sheetName
                    ? workbook.Sheets[sheetName]
                    : workbook.Sheets[workbook.SheetNames[0]!]

                if (!sheet) {
                    reject(new Error('工作表不存在'))
                    return
                }

                // 转换为JSON数组
                const jsonData = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: '',
                }) as any[][]

                if (jsonData.length === 0) {
                    reject(new Error('Excel文件为空'))
                    return
                }

                // 获取表头（第一行）
                const headers = (jsonData[0] as string[]) || []
                
                // 找到列映射关系
                const headerMapping: Record<number, string> = {}
                headers.forEach((header, index) => {
                    const mappedKey = columnMapping[header]
                    if (mappedKey) {
                        headerMapping[index] = mappedKey
                    }
                })

                // 处理数据行
                const startIndex = skipFirstRow ? 1 : 0
                const result: T[] = []

                for (let i = startIndex; i < jsonData.length; i++) {
                    const row = jsonData[i]
                    if (!row || row.length === 0) continue

                    // 构建数据对象
                    const rowData: Record<string, any> = {}
                    Object.keys(headerMapping).forEach(colIndex => {
                        const key = headerMapping[Number(colIndex)]
                        rowData[key] = row[Number(colIndex)] || ''
                    })

                    // 验证行数据
                    if (validateRow && !validateRow(rowData, i)) {
                        continue
                    }

                    // 转换行数据
                    const finalRow = transformRow
                        ? transformRow(rowData, i)
                        : (rowData as T)

                    result.push(finalRow)
                }

                resolve(result)
            } catch (error) {
                console.error('解析Excel失败:', error)
                reject(error)
            }
        }

        reader.onerror = () => {
            reject(new Error('文件读取失败'))
        }

        // 读取文件为二进制字符串
        reader.readAsBinaryString(file)
    })
}

/**
 * 下载Excel模板文件
 * 
 * @param columns 列配置
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export function downloadExcelTemplate(
    columns: Array<{ title: string; dataIndex: string }>,
    filename: string,
    sheetName: string = 'Sheet1'
) {
    try {
        // 只导出表头
        const headers = columns.map(col => col.title)
        
        const wb = XLSX.utils.book_new()
        const wsData = [headers]
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        
        // 设置列宽
        const colWidths = columns.map(() => ({ wch: 15 }))
        ws['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
        
        const fileName = `${filename}_模板.xlsx`
        XLSX.writeFile(wb, fileName)
        
        message.success('模板下载成功')
    } catch (error) {
        console.error('下载模板失败:', error)
        uiMessage.handleSystemError('下载模板失败')
        throw error
    }
}

