import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { AppDispatch, RootState } from './index'

// 类型安全的 useDispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>()

// 类型安全的 useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 导出常用的 hooks
export { useDispatch, useSelector }
