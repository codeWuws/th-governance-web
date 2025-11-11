import { useEffect, useRef, useState, useCallback } from 'react'

interface UseIntersectionObserverOptions {
    root?: Element | null
    rootMargin?: string
    threshold?: number | number[]
    freezeOnceVisible?: boolean
}

export const useIntersectionObserver = (options: UseIntersectionObserverOptions = {}) => {
    const { freezeOnceVisible = false, ...observerOptions } = options
    const [isIntersecting, setIsIntersecting] = useState(false)
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
    const elementRef = useRef<HTMLElement | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const setElement = useCallback((element: HTMLElement | null) => {
        elementRef.current = element
    }, [])

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        // 如果已经可见且设置了冻结，则不再观察
        if (freezeOnceVisible && isIntersecting) return

        const observer = new IntersectionObserver(([entry]) => {
            if (entry) {
                setEntry(entry)
                setIsIntersecting(entry.isIntersecting)
            }
        }, observerOptions)

        observer.observe(element)
        observerRef.current = observer

        return () => {
            observer.disconnect()
            observerRef.current = null
        }
    }, [observerOptions, freezeOnceVisible, isIntersecting])

    return {
        ref: setElement,
        isIntersecting,
        entry,
    }
}

// 懒加载图片hook
export const useLazyImage = (src: string, placeholder?: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder || '')
    const [isLoaded, setIsLoaded] = useState(false)
    const [isError, setIsError] = useState(false)

    const { ref, isIntersecting } = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true,
    })

    useEffect(() => {
        if (isIntersecting && src && !isLoaded) {
            const img = new Image()
            img.onload = () => {
                setImageSrc(src)
                setIsLoaded(true)
            }
            img.onerror = () => {
                setIsError(true)
            }
            img.src = src
        }
    }, [isIntersecting, src, isLoaded])

    return {
        ref,
        src: imageSrc,
        isLoaded,
        isError,
        isIntersecting,
    }
}

// 无限滚动hook
export const useInfiniteScroll = (
    loadMore: () => void,
    hasMore: boolean = true,
    threshold: number = 0.1
) => {
    const [isFetching, setIsFetching] = useState(false)

    const { ref, isIntersecting } = useIntersectionObserver({
        threshold,
    })

    useEffect(() => {
        if (isIntersecting && hasMore && !isFetching) {
            setIsFetching(true)
            loadMore()
            // 假设loadMore是异步的，这里简单延迟重置状态
            setTimeout(() => setIsFetching(false), 100)
        }
    }, [isIntersecting, hasMore, isFetching, loadMore])

    return {
        ref,
        isFetching,
    }
}
