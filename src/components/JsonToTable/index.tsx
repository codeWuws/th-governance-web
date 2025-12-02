import { Table, TableProps } from 'antd'
import type { ColumnsType, ColumnType, ColumnGroupType } from 'antd/es/table'
import React, { useMemo } from 'react'

/**
 * 列名映射配置
 * key: 原始列名（支持嵌套路径，如 'nested.field'）
 * value: 映射后的显示名称
 */
export type ColumnNameMapping = Record<string, string>

export interface JsonToTableProps {
    /** JSON 数据，对象数组 */
    data: Array<Record<string, unknown>>
    /** 列名映射配置，用于自定义列显示名称 */
    columnMapping?: ColumnNameMapping
    /** 嵌套对象的展开深度（默认 5） */
    maxDepth?: number
    /** 传递给 Ant Design Table 的其他属性 */
    tableProps?: Omit<TableProps<Record<string, unknown>>, 'columns' | 'dataSource'>
}

/**
 * 判断值是否为对象（排除 null 和数组）
 */
const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 判断值是否为数组
 */
const isArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value)
}

/**
 * 判断值是否为对象数组
 */
const isObjectArray = (value: unknown): value is Array<Record<string, unknown>> => {
    return isArray(value) && value.length > 0 && isObject(value[0])
}

/**
 * 格式化值显示
 */
const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '-'
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否'
    }
    if (isArray(value)) {
        if (isObjectArray(value)) {
            return `[对象数组，${value.length} 项]`
        }
        return `[数组，${value.length} 项]`
    }
    if (isObject(value)) {
        return '[对象]'
    }
    return String(value)
}

/**
 * 获取列显示名称
 */
const getColumnTitle = (key: string, mapping?: ColumnNameMapping): string => {
    if (mapping && mapping[key]) {
        return mapping[key]
    }
    return key
}

/**
 * 获取嵌套路径的值
 */
const getNestedValue = (obj: Record<string, unknown>, path: string[]): unknown => {
    let current: unknown = obj
    for (const key of path) {
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[key]
        } else {
            return undefined
        }
    }
    return current
}

/**
 * 递归构建列定义
 */
const buildColumns = (
    data: Array<Record<string, unknown>>,
    columnMapping?: ColumnNameMapping,
    prefix: string[] = [],
    depth = 0,
    maxDepth = 5
): ColumnsType<Record<string, unknown>> => {
    if (depth >= maxDepth || data.length === 0) {
        return []
    }

    // 收集所有字段
    const fieldSet = new Set<string>()
    data.forEach((row) => {
        Object.keys(row).forEach((key) => fieldSet.add(key))
    })

    const columns: ColumnsType<Record<string, unknown>> = []

    Array.from(fieldSet)
        .sort()
        .forEach((key) => {
            const fullPath = [...prefix, key]
            const fullKey = fullPath.join('.')
            const sampleValue = data.find((row) => row[key] !== undefined)?.[key]

            if (isObject(sampleValue)) {
                // 嵌套对象，递归构建子列
                const nestedData = data
                    .filter((row) => isObject(row[key]))
                    .map((row) => row[key] as Record<string, unknown>)

                const children = buildColumns(nestedData, columnMapping, fullPath, depth + 1, maxDepth)

                if (children.length > 0) {
                    columns.push({
                        title: getColumnTitle(fullKey, columnMapping),
                        key: fullKey,
                        dataIndex: fullPath,
                        children,
                    })
                } else {
                    // 如果嵌套对象没有可展开的字段，作为普通列
                    columns.push({
                        title: getColumnTitle(fullKey, columnMapping),
                        key: fullKey,
                        dataIndex: fullPath,
                        render: (value: unknown) => (
                            <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                {formatValue(value)}
                            </div>
                        ),
                    })
                }
            } else if (isObjectArray(sampleValue)) {
                // 对象数组，递归构建子列
                const firstObject = sampleValue[0]
                if (firstObject) {
                    const nestedData = data
                        .filter((row) => isObjectArray(row[key]))
                        .flatMap((row) => (row[key] as Array<Record<string, unknown>>))

                    const children = buildColumns(nestedData, columnMapping, fullPath, depth + 1, maxDepth)

                    if (children.length > 0) {
                        columns.push({
                            title: getColumnTitle(fullKey, columnMapping),
                            key: fullKey,
                            dataIndex: fullPath,
                            children,
                        })
                    } else {
                        columns.push({
                            title: getColumnTitle(fullKey, columnMapping),
                            key: fullKey,
                            dataIndex: fullPath,
                            render: (value: unknown) => (
                                <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                    {formatValue(value)}
                                </div>
                            ),
                        })
                    }
                } else {
                    columns.push({
                        title: getColumnTitle(fullKey, columnMapping),
                        key: fullKey,
                        dataIndex: fullPath,
                        render: (value: unknown) => (
                            <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                {formatValue(value)}
                            </div>
                        ),
                    })
                }
            } else {
                // 普通字段
                columns.push({
                    title: getColumnTitle(fullKey, columnMapping),
                    key: fullKey,
                    dataIndex: fullPath,
                    render: (value: unknown) => (
                        <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                            {formatValue(value)}
                        </div>
                    ),
                })
            }
        })

    return columns
}

/**
 * 递归展开嵌套对象
 */
const expandNestedObject = (
    obj: Record<string, unknown>,
    prefix = ''
): Record<string, unknown> => {
    const result: Record<string, unknown> = {}

    Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]

        if (isObject(value)) {
            // 嵌套对象，递归展开
            const nested = expandNestedObject(value as Record<string, unknown>, fullKey)
            Object.assign(result, nested)
        } else {
            // 普通值
            result[fullKey] = value
        }
    })

    return result
}

/**
 * 展开数据行，处理对象数组的行合并
 */
const expandDataRows = (
    data: Array<Record<string, unknown>>,
    depth = 0,
    maxDepth = 5
): Array<Record<string, unknown> & { _rowSpan?: Record<string, number> }> => {
    if (depth >= maxDepth || data.length === 0) {
        return []
    }

    const rows: Array<Record<string, unknown> & { _rowSpan?: Record<string, number> }> = []

    data.forEach((row) => {
        // 先展开所有嵌套对象（除了对象数组）
        const flattenedRow: Record<string, unknown> = {}
        const objectArrayFields: Array<{ key: string; value: Array<Record<string, unknown>> }> = []

        Object.keys(row).forEach((key) => {
            const value = row[key]

            if (isObjectArray(value)) {
                // 对象数组，稍后处理
                objectArrayFields.push({
                    key,
                    value: value as Array<Record<string, unknown>>,
                })
            } else if (isObject(value)) {
                // 嵌套对象，展开
                const expanded = expandNestedObject(value as Record<string, unknown>, key)
                Object.assign(flattenedRow, expanded)
            } else {
                // 普通字段
                flattenedRow[key] = value
            }
        })

        // 处理对象数组
        if (objectArrayFields.length === 0) {
            // 没有对象数组，直接添加行
            rows.push(flattenedRow)
        } else {
            // 有对象数组，为每个数组元素创建行
            const firstArrayField = objectArrayFields[0]
            if (!firstArrayField) {
                rows.push(flattenedRow)
                return
            }

            const arrayValue = firstArrayField.value

            arrayValue.forEach((item, index) => {
                const newRow: Record<string, unknown> & { _rowSpan?: Record<string, number> } = {
                    ...flattenedRow,
                }

                // 展开数组元素
                const expandedItem = expandNestedObject(item, firstArrayField.key)
                Object.assign(newRow, expandedItem)

                // 处理其他对象数组字段（如果有多个）
                objectArrayFields.slice(1).forEach(({ key, value }) => {
                    if (index < value.length) {
                        const itemValue = value[index]
                        if (itemValue) {
                            const expandedItem = expandNestedObject(itemValue, key)
                            Object.assign(newRow, expandedItem)
                        }
                    }
                })

                // 设置行合并
                if (arrayValue.length > 1) {
                    const rowSpans: Record<string, number> = {}
                    Object.keys(flattenedRow).forEach((key) => {
                        rowSpans[key] = arrayValue.length
                    })
                    // 其他对象数组字段也需要行合并
                    objectArrayFields.slice(1).forEach(({ key }) => {
                        rowSpans[key] = arrayValue.length
                    })

                    if (index === 0) {
                        newRow._rowSpan = rowSpans
                    } else {
                        // 后续行，需要隐藏合并的单元格
                        newRow._rowSpan = {}
                        Object.keys(rowSpans).forEach((key) => {
                            newRow._rowSpan![key] = 0 // 0 表示隐藏
                        })
                    }
                }

                rows.push(newRow)
            })
        }
    })

    return rows
}

/**
 * 为列添加行合并渲染逻辑
 */
const addRowSpanRender = (
    columns: ColumnsType<Record<string, unknown>>,
    dataSource: Array<Record<string, unknown> & { _rowSpan?: Record<string, number> }>
): ColumnsType<Record<string, unknown>> => {
    return columns.map((col) => {
        // 检查是否是分组列
        const isGroup = 'children' in col && col.children && col.children.length > 0

        if (isGroup) {
            // 分组列，递归处理子列
            const groupCol = col as ColumnGroupType<Record<string, unknown>>
            return {
                ...groupCol,
                children: addRowSpanRender(groupCol.children, dataSource),
            }
        } else {
            // 普通列，添加行合并逻辑
            const normalCol = col as ColumnType<Record<string, unknown>>
            const originalRender = normalCol.render
            const dataIndex = normalCol.dataIndex

            return {
                ...normalCol,
                render: (value: unknown, record: Record<string, unknown>, index: number) => {
                    const rowSpan = (record as { _rowSpan?: Record<string, number> })._rowSpan?.[normalCol.key as string]
                    
                    if (rowSpan !== undefined && rowSpan > 1) {
                        // 检查是否是合并行的第一行
                        const currentIndex = dataSource.findIndex((item) => item === record)
                        if (currentIndex === -1) {
                            const content = originalRender ? originalRender(value, record, index) : formatValue(value)
                            // 如果原始 render 已经返回了带样式的 div，直接使用；否则包装
                            let wrappedContent: React.ReactNode
                            if (React.isValidElement(content) && content.type === 'div') {
                                wrappedContent = content
                            } else {
                                wrappedContent = (
                                    <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                        {content as React.ReactNode}
                                    </div>
                                )
                            }
                            return {
                                children: wrappedContent,
                                props: {},
                            }
                        }

                        // 检查是否是第一个需要合并的行
                        let isFirstRow = true
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const prevRow = dataSource[i]
                            if (!prevRow) break
                            
                            // 检查前面的行是否有相同的值（用于判断是否是同一组）
                            if (dataIndex && typeof dataIndex === 'object' && Array.isArray(dataIndex)) {
                                const prevValue = getNestedValue(prevRow, dataIndex as string[])
                                if (prevValue !== value) {
                                    break
                                }
                            }
                            
                            // 如果前面的行也有 rowSpan，说明不是第一行
                            const prevRowSpan = (prevRow as { _rowSpan?: Record<string, number> })._rowSpan?.[normalCol.key as string]
                            if (prevRowSpan === rowSpan) {
                                isFirstRow = false
                                break
                            }
                        }

                        const content = originalRender ? originalRender(value, record, index) : formatValue(value)
                        // 如果原始 render 已经返回了带样式的 div，直接使用；否则包装
                        let wrappedContent: React.ReactNode
                        if (React.isValidElement(content) && content.type === 'div') {
                            wrappedContent = content
                        } else {
                            wrappedContent = (
                                <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                    {content as React.ReactNode}
                                </div>
                            )
                        }

                        if (isFirstRow) {
                            return {
                                children: wrappedContent,
                                props: { rowSpan },
                            }
                        } else {
                            return {
                                children: null,
                                props: { rowSpan: 0 },
                            }
                        }
                    }

                    const content = originalRender ? originalRender(value, record, index) : formatValue(value)
                    // 如果原始 render 已经返回了带样式的 div，直接使用；否则包装
                    if (React.isValidElement(content) && content.type === 'div') {
                        return content
                    }
                    return (
                        <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
                            {content as React.ReactNode}
                        </div>
                    )
                },
            }
        }
    })
}

/**
 * JsonToTable 组件
 * 
 * 将 JSON 对象数组转换为表格展示，支持嵌套结构渲染和列名映射
 * 使用行合并和列合并来展示嵌套对象
 * 
 * @example
 * ```tsx
 * const data = [
 *   {
 *     id: '001',
 *     parent_table: 'users',
 *     nested: {
 *       field1: 'value1',
 *       field2: 'value2'
 *     }
 *   }
 * ]
 * 
 * <JsonToTable 
 *   data={data}
 *   columnMapping={{
 *     'parent_table': '主表(parent_table)',
 *     'nested': '嵌套对象(nested)'
 *   }}
 * />
 * ```
 */
const JsonToTable: React.FC<JsonToTableProps> = ({
    data,
    columnMapping,
    maxDepth = 5,
    tableProps,
}) => {
    // 生成列配置和数据源
    const { columns, dataSource } = useMemo(() => {
        // 验证数据是数组
        if (!Array.isArray(data) || data.length === 0) {
            return { columns: [], dataSource: [] }
        }

        // 构建列定义
        const columnDefs = buildColumns(data, columnMapping, [], 0, maxDepth)

        // 展开数据行
        const expandedRows = expandDataRows(data, 0, maxDepth)

        // 为列添加行合并渲染逻辑
        const columnsWithRowSpan = addRowSpanRender(columnDefs, expandedRows)

        return {
            columns: columnsWithRowSpan,
            dataSource: expandedRows,
        }
    }, [data, columnMapping, maxDepth])

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            rowKey={(record, index) => {
                // 尝试使用 id 或 key 字段，否则使用索引
                if (record.id) return String(record.id)
                if (record.key) return String(record.key)
                return `row-${index}`
            }}
            pagination={false}
            size="small"
            bordered
            {...tableProps}
        />
    )
}

export default JsonToTable
