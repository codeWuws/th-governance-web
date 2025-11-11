import React, { useState, useMemo, useCallback } from 'react'

interface UseVirtualListOptions {
    itemHeight: number
    containerHeight: number
    overscan?: number
}

interface VirtualListItem {
    index: number
    style: React.CSSProperties
}

export const useVirtualList = <T>(items: T[], options: UseVirtualListOptions) => {
    const { itemHeight, containerHeight, overscan = 5 } = options
    const [scrollTop, setScrollTop] = useState(0)

    const totalHeight = items.length * itemHeight
    const visibleCount = Math.ceil(containerHeight / itemHeight)

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

    const visibleItems = useMemo(() => {
        const result: VirtualListItem[] = []
        for (let i = startIndex; i <= endIndex; i++) {
            result.push({
                index: i,
                style: {
                    position: 'absolute',
                    top: i * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                },
            })
        }
        return result
    }, [startIndex, endIndex, itemHeight])

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }, [])

    const containerStyle: React.CSSProperties = {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
    }

    const innerStyle: React.CSSProperties = {
        height: totalHeight,
        position: 'relative',
    }

    return {
        visibleItems,
        containerStyle,
        innerStyle,
        handleScroll,
        totalHeight,
        startIndex,
        endIndex,
    }
}
