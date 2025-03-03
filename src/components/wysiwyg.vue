<template lang="pug">
.wysiwyg
	.btns-wrap
		button.btn-custom(type="button" @click="handleCommand('bold')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-bold")
		button.btn-custom(type="button" @click="handleCommand('italic')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-italic")
		button.btn-custom(type="button" @click="handleCommand('underline')")
			.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-underline")
		button.btn-custom(type="button" @click="handleCommand('strike')" style="border-right: 1px solid #e4e4e7;")
			.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-strike")
		button.btn-custom(type="button" @click="handleCommand('h1')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h1")
		button.btn-custom(type="button" @click="handleCommand('h2')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h2")
		button.btn-custom(type="button" @click="handleCommand('h3')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h3")
		button.btn-custom(type="button" @click="handleCommand('h4')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h4")
		button.btn-custom(type="button" @click="handleCommand('h5')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h5")
		button.btn-custom(type="button" @click="handleCommand('h6')" style="border-right: 1px solid #e4e4e7;")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h6")
		//- button.btn-custom(type="button" @click="handleCommand('small')" style="border-right: 1px solid #e4e4e7;") Small
	
		// 색상 변경
		.input-color
			input#colorInput.btn-custom(type="color" @change="handleCommand($event.target.value)" @blur="wysiwyg.restoreLastSelection()" style="padding: 0; border: none; border-bottom: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7; position: relative; border-radius: 0;")
		//- button.btn-custom(type="button" @click="handleCommand('color')" style="border-right: 1px solid #e4e4e7;") Color
		button.btn-custom(type="button" @click="handleCommand('divider')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-divider")
		button.btn-custom(type="button" @click="handleCommand('quote')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-quote")
		button.btn-custom(type="button" @click="handleCommand('unorderedList')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-list-bullet")
		button.btn-custom(type="button" @click="handleCommand('orderedList')" style="border-right: 1px solid #e4e4e7;")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-list-number")
		button.btn-custom(type="button" @click="handleCommand('alignLeft')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-left")
		button.btn-custom(type="button" @click="handleCommand('alignCenter')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-center")
		button.btn-custom(type="button" @click="handleCommand('alignRight')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-right")
		//- button.btn-custom(type="button" @click="handleCommand('image')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-image")
		//- button.btn-custom(type="button" @click="exportData") Export
	
	#myeditor(style="width: 100%; min-height: 3rem;")
</template>

<script setup>
	import { onMounted, onBeforeUnmount } from 'vue';
	// import { skapi } from '@/main';
	import { Wysiwyg4All } from 'wysiwyg4all';
	import 'wysiwyg4all/css';
	// import Loading from '@/components/loading.vue';

	// 이벤트 emit 방식으로 에디터 내용을 실시간으로 부모 컴포넌트로 전달
	const emit = defineEmits(['update:content', 'editor-ready']);
	// const emit = defineEmits(['update:content']);

	// const wysiwyg = ref(null);
	let wysiwyg = null;

	// const loadScript = () => {
	//   return new Promise((resolve, reject) => {
	//     if (document.getElementById('wysiwyg4all-script')) {
	//       resolve();
	//       return;
	//     }

	//     const script = document.createElement('script');
	//     script.id = 'wysiwyg4all-script';
	//     script.src = 'https://cdn.jsdelivr.net/npm/wysiwyg4all@latest/dist/wysiwyg4all.min.js';  // dist 폴더의 minified 버전 사용
	//     script.async = true;

	//     script.onload = () => resolve();
	//     script.onerror = () => reject(new Error('Failed to load Wysiwyg4All'));

	//     document.head.appendChild(script);
	//   });
	// };

	// const loadStylesheet = () => {
	//   return new Promise((resolve) => {
	//     if (document.getElementById('wysiwyg4all-style')) {
	//       resolve();
	//       return;
	//     }

	//     const link = document.createElement('link');
	//     link.id = 'wysiwyg4all-style';
	//     link.rel = 'stylesheet';
	//     link.href = 'https://cdn.jsdelivr.net/npm/wysiwyg4all@latest/wysiwyg4all.css';

	//     link.onload = () => resolve();
	//     document.head.appendChild(link);
	//   });
	// };

	// const initEditor = async () => {
	//   try {
	//     // await Promise.all([loadScript(), loadStylesheet()]);
	// 	// await Promise.all([loadStylesheet()]);

	//     setTimeout(() => {
	//       if (typeof Wysiwyg4All === 'function') {
	//         wysiwyg.value = new Wysiwyg4All({
	//           elementId: 'myeditor',
	//           placeholder: '결재 내용',
	//           spellcheck: false,
	//           highlightColor: '#4a90e2',
	//           lastLineBlank: true,
	//           hashtag: false,
	//           urllink: true,
	//           callback: (c) => {
	//             if (c.commandTracker) {
	//               // 에디터 내용이 변경될 때마다 부모 컴포넌트에 내용 전달
	// 			  wysiwyg.value.export().then(r => {
	// 				emit('update:content', r.html);
	// 			  });
	//             }
	//             return c;
	//           }
	//         });
	//         editorReady.value = true;
	//         emit('editor-ready', true);
	//       }
	//     }, 100);
	//   } catch (error) {
	//     console.error('Failed to initialize editor:', error);
	//     emit('editor-ready', false);
	//   }
	// };

	const handleCommand = (command) => {
		// if (wysiwyg.value && editorReady.value) {
		// wysiwyg.value.command(command);
		// }
		wysiwyg.command(command);
	};

	const handleBlur = () => {
		// if (wysiwyg.value && editorReady.value) {
		// wysiwyg.value.restoreLastSelection();
		// }
		wysiwyg.restoreLastSelection();
	};

	// const exportData = () => {
	//   if (wysiwyg.value && editorReady.value) {
	//     const content = wysiwyg.value.export();
	//     emit('update:content', content);
	//   }
	// };

	onMounted(() => {
		//   initEditor();
		wysiwyg = new Wysiwyg4All({
			elementId: 'myeditor',
			placeholder: '결재 내용',
			spellcheck: false,
			highlightColor: '#4a90e2',
			lastLineBlank: true,
			hashtag: false,
			urllink: true,
			callback: (c) => {
				if (c.commandTracker) {
					// 에디터 내용이 변경될 때마다 부모 컴포넌트에 내용 전달
					wysiwyg.export().then(r => {
						console.log('r', r);
						emit('update:content', r.html);
					});
				}
				return c;
			}
		});
		// wysiwyg.value = new Wysiwyg4All({
		// 	elementId: 'myeditor',
		// 	placeholder: '결재 내용',
		// 	spellcheck: false,
		// 	highlightColor: '#4a90e2',
		// 	lastLineBlank: true,
		// 	hashtag: false,
		// 	urllink: true,
		// 	callback: (c) => {
		// 		if (c.commandTracker) {
		// 			// 에디터 내용이 변경될 때마다 부모 컴포넌트에 내용 전달
		// 			wysiwyg.value.export().then(r => {
		// 				emit('update:content', r.html);
		// 			});
		// 		}
		// 		return c;
		// 	}
		// });
		emit('editor-ready', true);
	});

	onBeforeUnmount(() => {
		wysiwyg = null;
		// wysiwyg.value = null;
		// editorReady.value = false;
	});

	defineExpose({
		// getContent: () => wysiwyg.value?.export() || '',
		getContent: () => wysiwyg.export() || '',
	});
</script>

<style lang="less">
	._wysiwyg4all {
		padding: 1rem;

		&::before {
			color: var(--gray-color-300) !important;
		}

		ul {
			list-style: disc !important;
			padding: initial !important;
			padding-inline-start: 40px !important;
		}

		ol {
			list-style: decimal !important;
			padding: initial !important;
			padding-inline-start: 40px !important;
		}

		li {
			list-style: inherit !important;
			padding: initial !important;
		}
	}

	.input-color {
		display: inline-block;
		position: relative;
	}

	.btns-wrap {
		justify-content: flex-start !important;
		gap: 0 !important;
		margin-bottom: 0.5rem;
		display: flex;
		flex-wrap: wrap;
		// align-content: stretch;

		&:after {
			content: "";
			flex: 1 1 auto;
			border-bottom: 1px solid var(--gray-color-200);
		}
	}

	.btn-custom {
		display: inline-block;
		border-bottom: 1px solid var(--gray-color-200);
		padding: 0 8px;
		height: 2rem;

		&:hover,
		&:focus,
		&:active {
			border-bottom: 1px solid var(--gray-color-200);
			background-color: var(--gray-color-200);
		}

		.icon {
			padding: 0;
		}
	}
</style>