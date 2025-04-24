<template lang="pug">
._tooltip(:class="classNames" @mouseenter="handleMouseEnter" ref="host")
	.tool
		.tool-icon
			slot(name="tool")
		.tip(:style="{ '--tip-background-color': props.tipBackgroundColor, '--text-color': props.textColor }" ref="tipContainer")
			slot(name="tip")
		.tip-arrow(:class="classNames" :style="{ '--tip-background-color': props.tipBackgroundColor }")
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
	tipBackgroundColor: {
		type: String,
		default: 'transparent'
	},
	textColor: {
		type: String,
		default: '#000'
	}
});

const host = ref(null);
const tipContainer = ref(null);
const classNames = ref('');
const tipBackgroundColor = ref('transparent');

const handleMouseEnter = (e) => {
	const y = window.innerHeight / 2;
	const x = window.innerWidth / 2;
	const isBottom = e.clientY < y;
	const isLeft = e.clientX > x;

	classNames.value = '';
	classNames.value += isBottom ? ' bottom' : ' top';
	classNames.value += isLeft ? ' left' : ' right';

	nextTick(() => {
		const tipElement = tipContainer.value?.querySelector('[slot="tip"]');
		if (tipElement) {
			const bgColor = window.getComputedStyle(tipElement).getPropertyValue('background-color');
			tipBackgroundColor.value = bgColor || 'transparent';
		}
	})
}
</script>

<style lang="less" scoped>
._tooltip {
	display: block;
	position: relative !important;

	&.bottom {
		.tip {
			top: calc(100% + 8px);
			bottom: unset;
		}
	}
	&.left {
		.tip {
			left: unset;
			right: 0;
		}
	}
	&:hover {
		.tip {
			display: block;
		}
		.tip-arrow {
			display: block;
		}
	}
	// &::slotted([slot='tip']) {
	//     /* slot1 every slotted element - YES */
	//     white-space: pre;
	//     overflow: hidden;
	// }

	>.tool {
		text-align: inherit;
	}

	.tool-icon {
		display: inline-block;
		cursor: pointer;
		padding: 0 16px;

		svg {
			height: 20px;
			width: 20px;
			fill: #aaa !important;
		}
	}

	.tip {
		// min-width: 100%;
		// max-width: 100%;
		// width: 100%;
		// min-width: 10rem;
		display: none;
		position: absolute;
		box-sizing: border-box;
		bottom: calc(100% + 8px);
		top: unset;
		left: 0;
		right: unset;
		z-index: 9999;
		// white-space: pre-wrap;
		white-space: nowrap;
		text-align: left;
		// overflow: hidden;
		
		background-color: var(--tip-background-color); // 배경색 적용
		color: var(--text-color); // 텍스트 색상 적용
		padding: 8px;
		font-size: 0.8rem;
	}

	.tip-arrow {
		display: none;
		position: absolute;
		width: 0;
		height: 0;
		left: 50%;
		transform: translateX(-50%);

		&.top {
			top: unset;
			bottom: calc(100% + 4px);
			border: 4px solid transparent;
			border-bottom-width: 0;
			border-top-width: 4px;
			border-top-color: var(--tip-background-color);
		}
		&.bottom {
			z-index: 1;
			top: calc(100% + 4px);
			bottom: unset;
			border: 4px solid transparent;
			border-top-width: 0;
			border-bottom-width: 4px;
			border-bottom-color: var(--tip-background-color);
		}
	}
}
</style>