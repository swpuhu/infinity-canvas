<template>
    <button
        class="u-button"
        :class="[
            type ? `u-button--${type}` : '',
            size ? `u-button--${size}` : '',
            { 'is-disabled': disabled },
            { 'is-selected': selected },
        ]"
        :disabled="disabled"
        @click="$emit('click', $event)"
    >
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
interface Props {
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    selected?: boolean;
}

defineProps<Props>();
defineEmits<{
    (e: 'click', event: MouseEvent): void;
}>();
</script>

<style scoped>
.u-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    line-height: 1;
    height: 32px;
    white-space: nowrap;
    cursor: pointer;
    color: #606266;
    text-align: center;
    box-sizing: border-box;
    outline: none;
    transition: 0.1s;
    font-weight: 500;
    user-select: none;
    vertical-align: middle;
    padding: 8px 15px;
    font-size: 14px;
    border-radius: 4px;
    background-color: #ffffff;
    border: 1px solid #dcdfe6;
    margin: 0;
}

.u-button:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background-color: #ecf5ff;
}

.u-button:active {
    color: #3a8ee6;
    border-color: #3a8ee6;
    outline: none;
}

.u-button.is-disabled {
    color: #c0c4cc;
    cursor: not-allowed;
    background-image: none;
    background-color: #fff;
    border-color: #ebeef5;
}

/* 选中状态样式 */
.u-button.is-selected {
    color: #409eff;
    border-color: #409eff;
    background-color: #ecf5ff;
}

.u-button.is-selected:hover {
    color: #66b1ff;
    border-color: #66b1ff;
    background-color: #ecf5ff;
}

.u-button.is-selected:active {
    color: #3a8ee6;
    border-color: #3a8ee6;
    background-color: #ecf5ff;
}

/* 主题按钮的选中状态 */
.u-button--primary.is-selected {
    background: #66b1ff;
    border-color: #66b1ff;
    color: #fff;
}

.u-button--success.is-selected {
    background: #85ce61;
    border-color: #85ce61;
    color: #fff;
}

/* 类型样式 */
.u-button--primary {
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
}

.u-button--primary:hover {
    background: #66b1ff;
    border-color: #66b1ff;
    color: #fff;
}

.u-button--primary:active {
    background: #3a8ee6;
    border-color: #3a8ee6;
    color: #fff;
}

.u-button--success {
    color: #fff;
    background-color: #67c23a;
    border-color: #67c23a;
}

.u-button--success:hover {
    background: #85ce61;
    border-color: #85ce61;
    color: #fff;
}

.u-button--success:active {
    background: #5daf34;
    border-color: #5daf34;
    color: #fff;
}

/* 尺寸样式 */
.u-button--small {
    height: 24px;
    padding: 5px 11px;
    font-size: 12px;
    border-radius: 3px;
}

.u-button--large {
    height: 40px;
    padding: 12px 19px;
    font-size: 14px;
    border-radius: 4px;
}
</style>
