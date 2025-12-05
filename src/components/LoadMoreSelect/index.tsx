import React, { useState, useEffect, useRef } from 'react'
import { Select, Spin } from 'antd'
import type { SelectProps } from 'antd/es/select'

const { Option } = Select

export interface LoadMoreSelectOption {
    value: string
    label: string
    [key: string]: unknown
}

export interface LoadMoreSelectProps extends Omit<SelectProps, 'onPopupScroll' | 'loading'> {
    /** 选项数据 */
    options: LoadMoreSelectOption[]
    /** 是否还有更多数据 */
    hasMore?: boolean
    /** 是否正在加载 */
    loading?: boolean
    /** 加载更多回调 */
    onLoadMore?: () => void | Promise<void>
    /** 搜索回调 */
    onSearch?: (value: string) => void | Promise<void>
    /** 是否启用搜索 */
    enableSearch?: boolean
}

/**
 * 支持loadMore的下拉选择框组件
 * 支持滚动加载更多、搜索等功能
 */
const LoadMoreSelect: React.FC<LoadMoreSelectProps> = ({
    options = [],
    hasMore = false,
    loading = false,
    onLoadMore,
    onSearch,
    enableSearch = true,
    ...restProps
}) => {
    const [searchValue, setSearchValue] = useState<string>('')
    const popupRef = useRef<HTMLDivElement | null>(null)

    /**
     * 处理下拉框滚动事件
     */
    const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { target } = e
        const element = target as HTMLElement

        // 检查是否滚动到底部（距离底部20px时触发）
        const scrollTop = element.scrollTop
        const scrollHeight = element.scrollHeight
        const clientHeight = element.clientHeight

        if (scrollHeight - scrollTop - clientHeight < 20 && hasMore && !loading && onLoadMore) {
            onLoadMore()
        }
    }

    /**
     * 处理搜索
     */
    const handleSearch = (value: string) => {
        setSearchValue(value)
        if (onSearch) {
            onSearch(value)
        }
    }

    return (
        <Select
            {...restProps}
            showSearch={enableSearch}
            filterOption={false}
            onSearch={enableSearch ? handleSearch : undefined}
            onPopupScroll={handlePopupScroll}
            loading={loading}
            notFoundContent={loading ? <Spin size='small' /> : restProps.notFoundContent}
        >
            {options.map(option => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
            ))}
            {hasMore && !loading && (
                <Option disabled value='__load_more__' style={{ textAlign: 'center', color: '#999' }}>
                    滚动加载更多...
                </Option>
            )}
        </Select>
    )
}

export default LoadMoreSelect

