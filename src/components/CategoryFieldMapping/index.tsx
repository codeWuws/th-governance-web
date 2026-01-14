import React, { useState, useEffect, useRef } from 'react'
import { Button, Popconfirm, Empty, Select, Tag, Spin } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowRightOutlined, LinkOutlined } from '@ant-design/icons'
import styles from './index.module.scss'

const { Option } = Select

/**
 * 映射项接口
 */
export interface MappingItem {
    /** 唯一标识 */
    id: string
    /** 原始数据集值 */
    datasetValue: string
    /** 原始字段值 */
    originFieldValue: string
}

/**
 * 分类字段映射组件属性
 */
export interface CategoryFieldMappingProps {
    /** 原始数据集选项列表 */
    datasetOptions: Array<{ value: string; label: string }>
    /** 原始字段值选项列表（动态加载） */
    originFieldValueOptions?: Array<{ value: string; label: string }>
    /** 原始表名（用于加载字段值） */
    originalTableName?: string
    /** 原始字段名（用于加载字段值） */
    originalFieldName?: string
    /** 原始字段值加载状态 */
    originFieldValueLoading?: boolean
    /** 映射数据 */
    mappings?: MappingItem[]
    /** 映射数据变化回调 */
    onChange?: (mappings: MappingItem[]) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 原始数据集加载状态 */
    datasetLoading?: boolean
    /** 原始数据集分页信息 */
    datasetPagination?: {
        hasMore: boolean
        total: number
    }
    /** 原始数据集搜索关键词 */
    datasetSearchKeyword?: string
    /** 原始数据集搜索回调 */
    onDatasetSearch?: (keyword: string) => void
    /** 原始数据集滚动加载更多回调 */
    onDatasetLoadMore?: () => void
}

/**
 * 分类字段映射组件
 * 用于实现原始数据集与原始字段的一对一映射
 */
const CategoryFieldMapping: React.FC<CategoryFieldMappingProps> = ({
    datasetOptions = [],
    originFieldValueOptions = [],
    originalTableName,
    originalFieldName,
    originFieldValueLoading = false,
    mappings = [],
    onChange,
    disabled = false,
    datasetLoading = false,
    datasetPagination,
    datasetSearchKeyword = '',
    onDatasetSearch,
    onDatasetLoadMore,
}) => {
    const [dataSource, setDataSource] = useState<MappingItem[]>(mappings)
    // 使用ref保存最新的dataSource，避免闭包问题
    const dataSourceRef = useRef<MappingItem[]>(mappings)

    // 当外部传入的mappings变化时,更新内部状态
    useEffect(() => {
        // 只有当mappings真正变化时才更新（避免覆盖本地更新）
        if (JSON.stringify(mappings) !== JSON.stringify(dataSourceRef.current)) {
            setDataSource(mappings)
            dataSourceRef.current = mappings
        }
    }, [mappings])

    /**
     * 获取已使用的原始数据集值
     */
    const getAllUsedDatasetValues = (): string[] => {
        return dataSource
            .filter(item => item.datasetValue)
            .map(item => item.datasetValue)
    }

    /**
     * 获取已使用的原始字段值
     */
    const getAllUsedOriginFieldValues = (): string[] => {
        return dataSource
            .filter(item => item.originFieldValue)
            .map(item => item.originFieldValue)
    }

    /**
     * 添加新的映射行
     */
    const handleAdd = () => {
        if (disabled) return

        // 直接添加一个空的映射行
        setDataSource(prevDataSource => {
            const newItem: MappingItem = {
                id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                datasetValue: '',
                originFieldValue: '',
            }
            const newDataSource = [...prevDataSource, newItem]
            // 更新ref
            dataSourceRef.current = newDataSource
            // 调用onChange回调，通知父组件更新
            onChange?.(newDataSource)
            return newDataSource
        })
    }

    /**
     * 删除映射行
     */
    const handleDelete = (id: string) => {
        const newDataSource = dataSource.filter(item => item.id !== id)
        setDataSource(newDataSource)
        dataSourceRef.current = newDataSource
        onChange?.(newDataSource)
    }

    /**
     * 更新映射项的原始数据集值
     */
    const handleDatasetValueChange = (id: string, value: string) => {
        setDataSource(prevDataSource => {
            const newDataSource = prevDataSource.map(item =>
                item.id === id ? { ...item, datasetValue: String(value || '').trim() } : item
            )
            dataSourceRef.current = newDataSource
            onChange?.(newDataSource)
            return newDataSource
        })
    }

    /**
     * 更新映射项的原始字段值
     */
    const handleOriginFieldValueChange = (id: string, value: string) => {
        setDataSource(prevDataSource => {
            const newDataSource = prevDataSource.map(item =>
                item.id === id ? { ...item, originFieldValue: String(value || '').trim() } : item
            )
            dataSourceRef.current = newDataSource
            onChange?.(newDataSource)
            return newDataSource
        })
    }

    /**
     * 获取已使用的原始数据集值(用于防止重复选择)
     */
    const getUsedDatasetValues = (currentId: string): string[] => {
        return dataSource
            .filter(item => item.id !== currentId && item.datasetValue)
            .map(item => item.datasetValue)
    }

    /**
     * 获取已使用的原始字段值(用于防止重复选择)
     */
    const getUsedOriginFieldValues = (currentId: string): string[] => {
        return dataSource
            .filter(item => item.id !== currentId && item.originFieldValue)
            .map(item => item.originFieldValue)
    }

    return (
        <div className={styles.mappingContainer}>
            <div className={styles.mappingHeader}>
                <div className={styles.headerLeft}>
                    <LinkOutlined className={styles.headerIcon} />
                    <span className={styles.mappingTitle}>数据映射关系</span>
                    {dataSource.length > 0 && (
                        <Tag className={styles.countTag} color='blue'>
                            {dataSource.length} 条映射
                        </Tag>
                    )}
                </div>
                <Button
                    type='primary'
                    ghost
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    disabled={disabled}
                    className={styles.addButton}
                >
                    添加映射
                </Button>
            </div>

            {dataSource.length === 0 ? (
                <Empty
                    description='暂无映射关系，点击上方按钮添加'
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className={styles.emptyState}
                />
            ) : (
                <div className={styles.mappingList}>
                    {dataSource.map((item, index) => (
                        <div key={item.id} className={styles.mappingItem}>
                            <div className={styles.itemIndex}>#{index + 1}</div>
                            <div className={styles.mappingContent}>
                                <Select
                                    value={item.datasetValue || undefined}
                                    placeholder='请选择原始数据集'
                                    className={styles.categorySelect}
                                    onChange={(val) => handleDatasetValueChange(item.id, val)}
                                    disabled={disabled}
                                    loading={datasetLoading}
                                    showSearch
                                    filterOption={false} // 禁用本地过滤，使用远程搜索
                                    onSearch={(value) => {
                                        onDatasetSearch?.(value)
                                    }}
                                    notFoundContent={
                                        datasetLoading 
                                            ? <Spin size="small" /> 
                                            : datasetOptions.length === 0 
                                            ? (datasetSearchKeyword ? '未找到匹配项' : '暂无数据')
                                            : '未找到匹配项'
                                    }
                                    onPopupScroll={(e) => {
                                        const { target } = e
                                        const element = target as HTMLElement
                                        // 滚动到底部时加载更多（留出10px的缓冲）
                                        if (element && element.scrollTop + element.offsetHeight >= element.scrollHeight - 10) {
                                            // 滚动到底部，加载更多
                                            if (datasetPagination?.hasMore && !datasetLoading) {
                                                onDatasetLoadMore?.()
                                            }
                                        }
                                    }}
                                    allowClear
                                >
                                    {datasetOptions
                                        .filter(option => {
                                            const usedValues = getUsedDatasetValues(item.id)
                                            return !usedValues.includes(option.value)
                                        })
                                        .map(option => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        ))}
                                </Select>
                                <ArrowRightOutlined className={styles.mappingArrow} />
                                <Select
                                    value={item.originFieldValue || undefined}
                                    placeholder={
                                        !originalTableName || !originalFieldName
                                            ? '请先选择原始表和原始字段'
                                            : '请选择原始字段值'
                                    }
                                    className={styles.originFieldSelect}
                                    onChange={(val) => handleOriginFieldValueChange(item.id, val)}
                                    disabled={disabled || !originalTableName || !originalFieldName}
                                    loading={originFieldValueLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const label = option?.children as string || ''
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    notFoundContent={
                                        originFieldValueLoading 
                                            ? <Spin size="small" /> 
                                            : originFieldValueOptions.length === 0 
                                            ? (!originalTableName || !originalFieldName ? '请先选择原始表和原始字段' : '暂无数据')
                                            : '未找到匹配项'
                                    }
                                    allowClear
                                >
                                    {originFieldValueOptions
                                        .filter(option => {
                                            const usedValues = getUsedOriginFieldValues(item.id)
                                            return !usedValues.includes(option.value)
                                        })
                                        .map(option => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        ))}
                                </Select>
                            </div>
                            <Popconfirm
                                title='确认删除'
                                description='确定要删除这条映射关系吗？'
                                onConfirm={() => handleDelete(item.id)}
                                okText='确定'
                                cancelText='取消'
                                okButtonProps={{ danger: true }}
                                disabled={disabled}
                            >
                                <Button
                                    type='text'
                                    danger
                                    size='small'
                                    icon={<DeleteOutlined />}
                                    disabled={disabled}
                                    className={styles.deleteButton}
                                />
                            </Popconfirm>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CategoryFieldMapping

