import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// 定义计数器状态接口
export interface CounterState {
    value: number
    step: number
    history: number[]
}

// 初始状态
const initialState: CounterState = {
    value: 0,
    step: 1,
    history: [],
}

// 创建计数器 slice
export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        // 增加计数
        increment: state => {
            state.history.push(state.value)
            state.value += state.step
        },
        // 减少计数
        decrement: state => {
            state.history.push(state.value)
            state.value -= state.step
        },
        // 按指定数量增加
        incrementByAmount: (state, action: PayloadAction<number>) => {
            state.history.push(state.value)
            state.value += action.payload
        },
        // 设置步长
        setStep: (state, action: PayloadAction<number>) => {
            state.step = action.payload
        },
        // 重置计数器
        reset: state => {
            state.history.push(state.value)
            state.value = 0
            state.step = 1
        },
        // 清空历史记录
        clearHistory: state => {
            state.history = []
        },
        // 撤销上一步操作
        undo: state => {
            if (state.history.length > 0) {
                state.value = state.history.pop() || 0
            }
        },
    },
})

// 导出 actions
export const { increment, decrement, incrementByAmount, setStep, reset, clearHistory, undo } =
    counterSlice.actions

// 导出 reducer
export default counterSlice.reducer

// 选择器函数
export const selectCounter = (state: { counter: CounterState }) => state.counter
export const selectCounterValue = (state: { counter: CounterState }) => state.counter.value
export const selectCounterStep = (state: { counter: CounterState }) => state.counter.step
export const selectCounterHistory = (state: { counter: CounterState }) => state.counter.history
